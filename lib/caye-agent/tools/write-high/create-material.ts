import 'server-only'

import {
  createBedrockAdapter,
  createBedrockWriteProvider,
  BedrockConnectionMissingError,
} from '@/lib/domain-adapters/bedrock'
import type { Tool } from '../types'
import {
  CSI_DIVISIONS,
  DUTY_CATEGORIES,
  MATERIAL_ORIGINS,
  divisionNameFor,
  generateMaterialId,
  isDutyCategory,
  isMaterialOrigin,
  isLandedFor,
  matchMaterialLine,
  resolveVendorFromList,
  type MaterialOrigin,
} from './_materials-helpers'

/**
 * Add one thing to the materials catalogue, together with the first thing
 * anybody actually knows about its price.
 *
 * WHY THE CATALOGUE ROW AND THE PRICE ARE ONE ACTION
 *
 * `materials.unit_cost` is NOT NULL with no default, so a catalogue row
 * physically cannot be written without a number in it. But that column is a
 * CACHE — TropiTrack maintains it from the winning price observation through
 * `refresh_material_unit_cost()`, and a number sitting there with no source,
 * no date and no vendor is precisely the failure the materials rebuild fixed
 * (a $28 item sat in the catalogue at $52 for months).
 *
 * So the column is written exactly once, here, as a seed, and the observation
 * that justifies it is inserted in the same confirmed action. The
 * `material_prices_refresh` trigger then fires and takes the column over for
 * the rest of its life. The number is never independent of an observation,
 * even for the instant between the two inserts. Caye never writes
 * `unit_cost` again.
 *
 * WHY THE TAXONOMY FIELDS ARE VALIDATED RATHER THAN TRUSTED
 *
 * `division_name` used to be filled with the string 'From Receipt'. That is a
 * source flag, not a division, and putting it in a taxonomy field meant every
 * receipt-derived material landed in a division that does not exist, so no
 * CSI division total was true. The caller supplies a division CODE and the
 * name is looked up — it cannot be free text. `duty_category` has no CHECK
 * constraint on the live table, so an invented value would be accepted and
 * then match no `landed_cost_rules` row, leaving a material whose landed cost
 * can never be computed; it is validated here instead.
 *
 * WHY RECORDING A PRICE HERE DOES NOT DOUBLE-COUNT A RECEIPT
 *
 * TropiTrack's `receipt_line_to_price` trigger writes an observation for
 * every receipt line that carries a material id. This tool exists for the
 * lines that carried NONE — the trigger wrote nothing for those, so the
 * observation written here is the only one that will ever exist for them. It
 * is also for a material that did not exist a moment ago, so there is no
 * earlier observation of it to duplicate. `receipt_id` is carried onto the
 * observation so the price still points back at the paper it came from.
 */

export interface CreateMaterialInput {
  name: string
  division_code: string
  category: string
  unit: string
  unit_price: number
  origin: string
  duty_category: string
  vendor?: string
  spec?: string
  source: 'receipt' | 'quote' | 'manual'
  observed_at?: string
  currency?: 'BSD' | 'USD'
  receipt_id?: string
  note?: string
}

export interface CreateMaterialDeps {
  getWriteProvider: typeof createBedrockWriteProvider
  getAdapter: typeof createBedrockAdapter
  now: () => Date
}

export function makeCreateMaterial(deps: Partial<CreateMaterialDeps> = {}): Tool<CreateMaterialInput> {
  const getWriteProvider = deps.getWriteProvider ?? createBedrockWriteProvider
  const getAdapter = deps.getAdapter ?? createBedrockAdapter
  const now = deps.now ?? (() => new Date())

  return {
    name: 'create_material',
    description:
      'Add a thing to the materials catalogue and record the first price anybody knows for it. Use this ' +
      'when a receipt or quote line matched nothing in the catalogue and somebody has said what it is. ' +
      'Everything must come from what is written on the document or what a person told you — never ' +
      'invent a division, a duty category, or a price. This changes what ODS believes things cost, so it ' +
      'is staged for explicit confirmation first.',
    risk: 'high',
    roles: ['owner', 'staff', 'founder'],
    modes: ['back-office'],
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'What the thing is, as it should read in the catalogue.' },
        division_code: {
          type: 'string',
          description: `CSI division code. One of: ${Object.entries(CSI_DIVISIONS).map(([code, name]) => `${code} (${name})`).join(', ')}.`,
        },
        category: { type: 'string', description: 'A short grouping within the division, e.g. "Rebar", "Fittings".' },
        unit: { type: 'string', description: 'How it is bought and counted: bag, ea, sheet, lf, yd.' },
        unit_price: { type: 'number', description: 'Price for ONE, as printed. Do not compute one you cannot see.' },
        origin: { type: 'string', description: `Where it came from: ${MATERIAL_ORIGINS.join(', ')}. This decides whether duty applies.` },
        duty_category: { type: 'string', description: `Which duty rule applies. One of: ${DUTY_CATEGORIES.join(', ')}.` },
        vendor: { type: 'string', description: 'Supplier name as printed. Omit if unknown.' },
        spec: { type: 'string', description: 'Size, grade or model detail worth keeping. Omit if none.' },
        source: { type: 'string', description: "Where the price came from: 'receipt', 'quote', or 'manual' when a person simply told you." },
        observed_at: { type: 'string', description: 'The date the price was seen, YYYY-MM-DD. Defaults to today.' },
        currency: { type: 'string', description: "'BSD' or 'USD'. Defaults to BSD. A Florida quote is usually USD." },
        receipt_id: { type: 'string', description: 'The receipt this price came off, when it came off one.' },
        note: { type: 'string', description: 'Anything worth recording about where the price came from.' },
      },
      required: ['name', 'division_code', 'category', 'unit', 'unit_price', 'origin', 'duty_category', 'source'],
    },

    async execute(args, ctx) {
      const name = args.name?.trim()
      if (!name) return { ok: false, error: 'What is it called? A catalogue entry needs a name.' }

      const divisionName = divisionNameFor(args.division_code ?? '')
      if (!divisionName) {
        return {
          ok: false,
          error: `"${args.division_code}" is not a CSI division code. Use one of: ${Object.entries(CSI_DIVISIONS).map(([code, n]) => `${code} (${n})`).join(', ')}.`,
        }
      }
      if (!isMaterialOrigin(args.origin ?? '')) {
        return { ok: false, error: `Origin has to be one of ${MATERIAL_ORIGINS.join(', ')}. Where was it bought?` }
      }
      if (!isDutyCategory(args.duty_category ?? '')) {
        return {
          ok: false,
          error: `"${args.duty_category}" is not a duty category, so nothing would be able to work out its landed cost. Use one of: ${DUTY_CATEGORIES.join(', ')}.`,
        }
      }
      if (!args.unit?.trim()) return { ok: false, error: 'How is it bought — bag, ea, sheet, lf? A price with no unit means nothing.' }
      if (!Number.isFinite(args.unit_price) || args.unit_price <= 0) {
        return { ok: false, error: 'The price has to be a positive number you can actually see. Do not estimate one.' }
      }
      if (args.observed_at !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(args.observed_at)) {
        return { ok: false, error: 'observed_at must be YYYY-MM-DD.' }
      }
      const currency = args.currency ?? 'BSD'
      if (currency !== 'BSD' && currency !== 'USD') {
        return { ok: false, error: "Currency has to be 'BSD' or 'USD'." }
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

      // A near-duplicate catalogue row is worse than a missing one: two rows
      // for the same thing split its price history in half, so neither has
      // enough observations to be trusted and vendor comparison silently
      // compares one supplier's row against another's.
      let existingNote: string | null = null
      try {
        const catalogue = await adapter.listMaterials(ctx.workspaceId, { limit: 1000 })
        const match = matchMaterialLine(catalogue, name)
        if (match.confidence === 'high') {
          return {
            ok: false,
            error: `The catalogue already has "${name}" (${match.materialId}). Adding it again would split its price history. Record the price against the existing one instead.`,
          }
        }
        if (match.confidence === 'medium' && match.materialId) {
          existingNote = `Close to an existing catalogue item — ${match.reason}. Added as a separate item; say so if they are the same thing.`
        }
      } catch {
        existingNote = 'The catalogue could not be checked for a near-duplicate first.'
      }

      let vendorId: string | null = null
      let vendorNote: string | null = null
      if (args.vendor?.trim()) {
        try {
          const resolved = resolveVendorFromList(await adapter.listVendors(ctx.workspaceId, { limit: 500 }), args.vendor)
          vendorId = resolved.vendorId
          vendorNote = resolved.note
        } catch {
          vendorNote = 'Could not check the vendor list, so no vendor was attached.'
        }
      }

      const materialId = generateMaterialId(now(), 0)
      const origin = args.origin as MaterialOrigin
      const source = args.source === 'quote' ? 'quote' : args.source === 'manual' ? 'manual' : 'receipt'
      const isLanded = source === 'manual' ? isLandedFor('quote', origin) : isLandedFor(source, origin)

      const created = await write.provider.insertMaterial(write.companyId, {
        id: materialId,
        division_code: args.division_code.trim(),
        division_name: divisionName,
        category: args.category.trim(),
        name,
        unit: args.unit.trim(),
        // Seed only. The material_prices insert below fires
        // material_prices_refresh, which takes this column over immediately.
        unit_cost: args.unit_price,
        company_id: write.companyId,
        origin,
        duty_category: args.duty_category,
        vendor_id: vendorId,
        spec: args.spec?.trim() || null,
        uom_note: null,
        needs_review: source === 'manual',
        review_note: source === 'manual' ? 'Created from what a person said, not from a document.' : null,
        // Core status is a judgement about what ODS repeatedly restocks, made
        // from history. A brand-new catalogue entry has none, so it starts
        // false and somebody promotes it later.
        is_core: false,
      })

      if (!created.ok) {
        return {
          ok: false,
          error: `Nothing was added to the catalogue. ${created.failedRows.map(f => f.error).join('; ')}`,
        }
      }

      const priced = await write.provider.insertMaterialPrices(write.companyId, [
        {
          material_id: materialId,
          vendor_id: vendorId,
          project_id: null,
          source,
          observed_at: args.observed_at ?? now().toISOString().slice(0, 10),
          unit_price: args.unit_price,
          currency,
          uom: args.unit.trim(),
          quantity: null,
          origin,
          store_ref: null,
          document_ref: null,
          receipt_id: args.receipt_id?.trim() || null,
          is_landed: isLanded,
          confidence: source === 'manual' ? 'low' : 'high',
          note: args.note?.trim() || 'First observation, recorded when the catalogue entry was created.',
          company_id: write.companyId,
        },
      ])

      return {
        ok: created.ok && priced.ok,
        data: {
          material_id: materialId,
          name,
          division: `${args.division_code} ${divisionName}`,
          unit: args.unit.trim(),
          observed_price: args.unit_price,
          currency,
          is_landed: isLanded,
          vendor_attached: Boolean(vendorId),
          vendor_note: vendorNote,
          existing_note: existingNote,
          audit_recorded: created.auditLogWritten && priced.auditLogWritten,
          failed: [...created.failedRows, ...priced.failedRows].map(f => f.error),
          note: priced.ok
            ? `Added to the catalogue under ${divisionName}, with one ${currency} price observation from ${source === 'manual' ? 'what you told me' : `a ${source}`}${isLanded ? ' (landed)' : ' (FOB — duty and freight not included)'}.`
            : 'The catalogue entry was added but its price observation was not, so it has a seeded cost with nothing behind it. Tell somebody — this needs fixing rather than repeating.',
        },
      }
    },
  }
}

export const createMaterial: Tool<CreateMaterialInput> = makeCreateMaterial()
