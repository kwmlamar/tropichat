import 'server-only'

import {
  createBedrockAdapter,
  createBedrockWriteProvider,
  BedrockConnectionMissingError,
} from '@/lib/domain-adapters/bedrock'
import type { Tool } from '../types'
import {
  MATERIAL_ORIGINS,
  isLandedFor,
  isMaterialOrigin,
  matchMaterialLine,
  resolveVendorFromList,
  type MaterialOrigin,
} from './_materials-helpers'

/**
 * Capture the prices on a vendor quote, so ODS can compare suppliers.
 *
 * WHY THIS IS THE HIGHEST-VALUE INTAKE PATH
 *
 * Comparing vendors when pricing a job needs more than one price per
 * material. Today 12 of 236 materials have any vendor at all and nothing has
 * two competing quotes, so `material_vendor_comparison` returns nothing.
 * Most of ODS's material money goes to quote-by-email suppliers — Mikro, ADI
 * Metal, Simple Steps, All Stones FL, Sutton Brick — none of whom have an
 * API. A captured quote is the only way that data ever exists.
 *
 * WHY THIS SHIPPED DISABLED FIRST
 *
 * When this tool was written it was deliberately left out of
 * `HIGH_RISK_TOOLS`, so it was not in the agent's tool list and
 * `confirm_pending_action` could not execute it. That was not a feature flag
 * — it was a hold on a real defect in the ledger it writes to.
 *
 * `refresh_material_unit_cost()` used to write the winning observation's RAW
 * `unit_price` into `materials.unit_cost`, a column with no stated currency
 * and no landed/FOB basis. `material_current_price` ranks a quote at tier 2
 * and reference/manual/stale prices at tiers 4-5, and 219 of 236 materials
 * were won by a tier 4/5 observation. So the first FOB-Florida USD quote
 * captured against such a material would have silently replaced a landed BSD
 * figure with an un-landed one — structurally the same failure as the $28
 * item that sat in the catalogue at $52, arriving through the feature meant
 * to fix pricing.
 *
 * TropiTrack PR #34 fixed it at the source. `materials.unit_cost` now has one
 * defined meaning, landed BSD, computed through `landed_cost()` from the
 * winning observation with the material's own `duty_category` and `origin`
 * (an observation flagged `is_landed` is costed as already-landed, everything
 * else has duty applied), and every refreshed row is stamped
 * `unit_cost_basis = 'landed_bsd'` so the column describes itself. Verified
 * live on 2026-09-07: the column exists, NOT NULL, defaulting to
 * 'landed_bsd', and the function is non-circular — it reads `unit_price` from
 * the observation and never `unit_cost` from the catalogue.
 *
 * That is what makes an FOB quote safe to record here: a `false` on
 * `is_landed` is now a fact the ledger acts on rather than a distinction it
 * discards. This tool is registered from that point on. If that column or
 * that function is ever reverted, this tool has to come back out of
 * `HIGH_RISK_TOOLS` — writing FOB prices into a cache with no basis is the
 * defect, not the writing of FOB prices.
 *
 * WHAT IT WRITES
 *
 * One `material_prices` row per line that matches a catalogue material, with
 * `source: 'quote'`, the resolved vendor, the date on the quote, and
 * `is_landed: false` for anything quoted FOB Florida. Lines that match
 * nothing are reported back, never guessed at — `create_material` is how one
 * of those becomes a catalogue entry, and only after a person says what it is.
 */

export interface CaptureVendorQuoteLineInput {
  name: string
  qty?: number
  unit?: string
  unit_price: number
}

export interface CaptureVendorQuoteInput {
  vendor: string
  quote_date: string
  origin: string
  currency?: 'BSD' | 'USD'
  document_ref?: string
  note?: string
  lines: CaptureVendorQuoteLineInput[]
}

export interface CaptureVendorQuoteDeps {
  getWriteProvider: typeof createBedrockWriteProvider
  getAdapter: typeof createBedrockAdapter
}

export function makeCaptureVendorQuote(deps: Partial<CaptureVendorQuoteDeps> = {}): Tool<CaptureVendorQuoteInput> {
  const getWriteProvider = deps.getWriteProvider ?? createBedrockWriteProvider
  const getAdapter = deps.getAdapter ?? createBedrockAdapter

  return {
    name: 'capture_vendor_quote',
    description:
      'Record the prices on a vendor quote so suppliers can be compared when pricing a job. Read the ' +
      'lines off the quote exactly as printed — never adjust a price for duty or freight, and never ' +
      'invent a line. Say where the quote is from: a Florida quote is FOB and does not include duty. ' +
      'This changes what ODS believes things cost, so it is staged for explicit confirmation first.',
    risk: 'high',
    roles: ['owner', 'staff', 'founder'],
    modes: ['back-office'],
    inputSchema: {
      type: 'object',
      properties: {
        vendor: { type: 'string', description: 'Who quoted, as printed on the document.' },
        quote_date: { type: 'string', description: 'The date on the quote, YYYY-MM-DD. Not today unless the quote says today.' },
        origin: { type: 'string', description: `Where the price is quoted from: ${MATERIAL_ORIGINS.join(', ')}. FL means FOB Florida — duty and freight not included.` },
        currency: { type: 'string', description: "'BSD' or 'USD'. A Florida quote is usually USD. Defaults to BSD." },
        document_ref: { type: 'string', description: 'Quote number or the attachment/email it came from, so the price can be traced back.' },
        note: { type: 'string', description: 'Anything worth recording — validity period, minimum order, what was unreadable.' },
        lines: {
          type: 'array',
          description: 'The quoted lines. Copy names as printed; leave out any line whose price you cannot read.',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Item name exactly as printed on the quote.' },
              qty: { type: 'number', description: 'Quantity the price is for, if stated.' },
              unit: { type: 'string', description: 'Unit as printed (bag, ea, sheet, lf).' },
              unit_price: { type: 'number', description: 'Quoted price for ONE.' },
            },
            required: ['name', 'unit_price'],
          },
        },
      },
      required: ['vendor', 'quote_date', 'origin', 'lines'],
    },

    async execute(args, ctx) {
      if (!args.vendor?.trim()) return { ok: false, error: 'Who quoted? A price with no vendor cannot be compared against anything.' }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(args.quote_date ?? '')) return { ok: false, error: 'quote_date must be YYYY-MM-DD, as printed on the quote.' }
      if (!isMaterialOrigin(args.origin ?? '')) {
        return { ok: false, error: `Origin has to be one of ${MATERIAL_ORIGINS.join(', ')} — it is what decides whether the price includes duty.` }
      }
      const currency = args.currency ?? 'BSD'
      if (currency !== 'BSD' && currency !== 'USD') return { ok: false, error: "Currency has to be 'BSD' or 'USD'." }
      if (!args.lines?.length) return { ok: false, error: 'A quote with no lines records nothing. What is on it?' }
      for (const line of args.lines) {
        if (!line.name?.trim()) return { ok: false, error: 'Every quoted line needs the name printed on it.' }
        if (!Number.isFinite(line.unit_price) || line.unit_price <= 0) {
          return { ok: false, error: `"${line.name}" has no readable price. Leave the line out rather than guessing one.` }
        }
        if (line.qty !== undefined && (!Number.isFinite(line.qty) || line.qty <= 0)) {
          return { ok: false, error: `"${line.name}" has a quantity that is not a positive number.` }
        }
      }

      let write: Awaited<ReturnType<typeof createBedrockWriteProvider>>
      try {
        write = await getWriteProvider(ctx.workspaceId)
      } catch (error) {
        if (error instanceof BedrockConnectionMissingError) {
          return { ok: false, error: 'This workspace is not connected to a construction ledger.' }
        }
        return { ok: false, error: error instanceof Error ? error.message : 'Could not reach the ledger.' }
      }

      const adapter = getAdapter()
      const origin = args.origin as MaterialOrigin
      const isLanded = isLandedFor('quote', origin)

      // The vendor is not optional here, unlike on a receipt. A receipt with an
      // unresolved supplier is still a record of money spent; a quote with no
      // vendor is a price attached to nobody, which is exactly the shape that
      // makes vendor comparison useless.
      let vendorId: string | null = null
      let vendorName: string | null = null
      try {
        const resolved = resolveVendorFromList(await adapter.listVendors(ctx.workspaceId, { limit: 500 }), args.vendor)
        vendorId = resolved.vendorId
        vendorName = resolved.vendorName
        if (!vendorId) {
          return {
            ok: false,
            error: `${resolved.note ?? `No vendor on file matches "${args.vendor}".`} A quote has to be attached to a supplier to be worth comparing, so nothing was recorded. Add the vendor in TropiTrack first, or say which existing one this is.`,
          }
        }
      } catch {
        return { ok: false, error: 'Could not check the vendor list, so nothing was recorded. Try again shortly.' }
      }

      let catalogue
      try {
        catalogue = await adapter.listMaterials(ctx.workspaceId, { limit: 1000 })
      } catch {
        return { ok: false, error: 'The materials catalogue could not be read, so nothing was recorded.' }
      }

      const matched = args.lines.map(line => ({ line, match: matchMaterialLine(catalogue, line.name) }))
      const priceable = matched.filter(m => m.match.materialId)
      const unmatched = matched.filter(m => !m.match.materialId)

      if (priceable.length === 0) {
        return {
          ok: false,
          error: `None of the ${args.lines.length} quoted lines matched anything in the catalogue, so no prices were recorded. Say what each one is and they can be added with create_material first.`,
        }
      }

      const result = await write.provider.insertMaterialPrices(
        write.companyId,
        priceable.map(({ line, match }) => ({
          material_id: match.materialId!,
          vendor_id: vendorId,
          project_id: null,
          source: 'quote' as const,
          observed_at: args.quote_date,
          unit_price: line.unit_price,
          currency,
          uom: line.unit?.trim() || null,
          quantity: line.qty ?? null,
          origin,
          store_ref: null,
          document_ref: args.document_ref?.trim() || null,
          receipt_id: null,
          is_landed: isLanded,
          // The match confidence IS the price confidence. A line matched on a
          // partial word overlap is a low-confidence claim about what that
          // material costs, and saying otherwise would put an unearned number
          // into vendor comparison.
          confidence: match.confidence === 'none' ? 'low' : match.confidence,
          note: args.note?.trim() || `Quoted by ${vendorName ?? args.vendor} — ${match.reason}.`,
          company_id: write.companyId,
        }))
      )

      return {
        ok: result.ok,
        data: {
          vendor: vendorName ?? args.vendor,
          quote_date: args.quote_date,
          currency,
          origin,
          is_landed: isLanded,
          prices_recorded: result.insertedCount,
          lines_read: args.lines.length,
          unmatched: unmatched.map(m => m.line.name),
          audit_recorded: result.auditLogWritten,
          failed: result.failedRows.map(f => f.error),
          note: result.ok
            ? `${result.insertedCount} price${result.insertedCount === 1 ? '' : 's'} from ${vendorName ?? args.vendor} recorded${isLanded ? '' : ' as FOB — duty and freight are not in these numbers'}.${
                unmatched.length ? ` ${unmatched.length} line${unmatched.length === 1 ? '' : 's'} matched nothing in the catalogue: ${unmatched.map(m => m.line.name).join(', ')}.` : ''
              }`
            : 'Nothing was recorded. Do not assume these prices are on file.',
        },
      }
    },
  }
}

export const captureVendorQuote: Tool<CaptureVendorQuoteInput> = makeCaptureVendorQuote()
