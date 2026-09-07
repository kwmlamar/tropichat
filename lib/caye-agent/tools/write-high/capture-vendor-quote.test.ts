import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { makeCaptureVendorQuote } from './capture-vendor-quote'
import { HIGH_RISK_TOOLS } from '../high-risk-registry'
import type { ToolContext } from '../types'

const ctx: ToolContext = { workspaceId: 'ws-1', callerRole: 'owner', requestId: 'req-1', operatorId: 7 }

const CATALOGUE = [
  { id: 'R1_0', name: 'Portland Cement 94lb', unit: 'bag' },
  { id: 'R4_0', name: 'Plywood 3/4 CDX', unit: 'sheet' },
]
const VENDORS = [{ id: 'v-mikro', name: 'Mikro' }, { id: 'v-adi', name: 'ADI Metal' }]

function harness(options: { catalogue?: typeof CATALOGUE; vendors?: typeof VENDORS } = {}) {
  const priceInserts: Record<string, unknown>[][] = []
  const tool = makeCaptureVendorQuote({
    getWriteProvider: (async () => ({
      companyId: 'company-1',
      identityFor: () => ({ profileId: 'profile-lamar', workerId: null }),
      provider: {
        async insertMaterialPrices(_companyId: string, rows: Record<string, unknown>[]) {
          priceInserts.push(rows)
          return {
            ok: true, attemptedCount: rows.length, insertedCount: rows.length,
            insertedIds: rows.map((_, i) => `price-${i}`), failedRows: [],
            auditLogWritten: true, auditLogError: null,
          }
        },
      },
    })) as never,
    getAdapter: (() => ({
      async listMaterials() { return options.catalogue ?? CATALOGUE },
      async listVendors() { return options.vendors ?? VENDORS },
    })) as never,
  })
  return { tool, priceInserts }
}

const quote = (over: Record<string, unknown> = {}) => ({
  vendor: 'Mikro',
  quote_date: '2026-09-05',
  origin: 'FL',
  currency: 'USD' as const,
  document_ref: 'Q-118',
  lines: [{ name: 'Portland Cement 94lb', unit: 'bag', unit_price: 9.4 }],
  ...over,
})

describe('capture_vendor_quote — registration', () => {
  it('is registered, so it stages and confirms like every other write-high tool', () => {
    // It was deliberately unregistered until TropiTrack PR #34 gave
    // materials.unit_cost a defined basis (landed BSD, stamped
    // unit_cost_basis). Before that a captured FOB/USD quote would have
    // overwritten a landed cost with a raw one. This assertion is what makes
    // an accidental removal visible.
    expect(HIGH_RISK_TOOLS.map(t => t.name)).toContain('capture_vendor_quote')
  })

  it('is high risk, so nothing it writes can execute on the turn it is proposed', () => {
    const registered = HIGH_RISK_TOOLS.find(t => t.name === 'capture_vendor_quote')!
    expect(registered.risk).toBe('high')
  })
})

describe('capture_vendor_quote — what reaches the ledger', () => {
  it('records a Florida quote as FOB, in the currency it was quoted in', async () => {
    // The distinction the whole rebuild turns on: duty and freight are not in
    // this number, and the ledger now costs it accordingly.
    const { tool, priceInserts } = harness()
    const result = await tool.execute(quote(), ctx)

    expect(result.ok).toBe(true)
    expect(priceInserts[0][0]).toMatchObject({
      material_id: 'R1_0', vendor_id: 'v-mikro', source: 'quote',
      observed_at: '2026-09-05', unit_price: 9.4, currency: 'USD',
      is_landed: false, origin: 'FL', document_ref: 'Q-118', company_id: 'company-1',
    })
  })

  it('records a Nassau quote as landed', async () => {
    const { tool, priceInserts } = harness()
    await tool.execute(quote({ origin: 'NASSAU', currency: 'BSD' }), ctx)
    expect(priceInserts[0][0]).toMatchObject({ is_landed: true })
  })

  it('uses the date on the quote, never today', async () => {
    // A price is only comparable against the date it was seen. Stamping today
    // on a three-month-old quote makes a stale number look fresh, and the
    // ranking view trusts observed_at.
    const { tool, priceInserts } = harness()
    await tool.execute(quote({ quote_date: '2026-06-01' }), ctx)
    expect(priceInserts[0][0]).toMatchObject({ observed_at: '2026-06-01' })
  })

  it('carries match confidence onto the observation instead of claiming certainty', async () => {
    const { tool, priceInserts } = harness()
    await tool.execute(quote({ lines: [{ name: 'PLYWOOD 3/4 CDX 4x8', unit_price: 62 }] }), ctx)
    expect(priceInserts[0][0]).toMatchObject({ material_id: 'R4_0', confidence: 'medium' })
  })

  it('records the lines it matched and names the ones it did not', async () => {
    const { tool, priceInserts } = harness()
    const result = await tool.execute(
      quote({ lines: [{ name: 'Portland Cement 94lb', unit_price: 9.4 }, { name: 'Widget nobody stocks', unit_price: 3 }] }),
      ctx
    )

    expect(priceInserts[0]).toHaveLength(1)
    const data = result.data as Record<string, unknown>
    expect(data.unmatched).toEqual(['Widget nobody stocks'])
    expect(String(data.note)).toContain('Widget nobody stocks')
  })
})

describe('capture_vendor_quote — what it refuses', () => {
  it('refuses a quote whose vendor cannot be resolved, rather than filing a price under nobody', async () => {
    // A quote with no supplier is a price attached to nothing, which is
    // exactly the shape that makes vendor comparison useless.
    const { tool, priceInserts } = harness()
    const result = await tool.execute(quote({ vendor: 'Somebody Not On File' }), ctx)

    expect(result.ok).toBe(false)
    expect(priceInserts).toHaveLength(0)
    expect(String(result.error)).toContain('supplier')
  })

  it('refuses an ambiguous vendor rather than picking one', async () => {
    const { tool, priceInserts } = harness({
      vendors: [{ id: 'v-1', name: 'Sutton Brick' }, { id: 'v-2', name: 'Sutton Stone & Tile' }],
    })
    const result = await tool.execute(quote({ vendor: 'Sutton' }), ctx)

    expect(result.ok).toBe(false)
    expect(priceInserts).toHaveLength(0)
  })

  it('refuses a line with no readable price instead of guessing one', async () => {
    const { tool, priceInserts } = harness()
    const result = await tool.execute(quote({ lines: [{ name: 'Portland Cement 94lb', unit_price: 0 }] }), ctx)

    expect(result.ok).toBe(false)
    expect(priceInserts).toHaveLength(0)
  })

  it('refuses an origin it does not understand, because origin decides duty', async () => {
    const { tool } = harness()
    const result = await tool.execute(quote({ origin: 'MIAMI' }), ctx)
    expect(result.ok).toBe(false)
    expect(String(result.error)).toContain('duty')
  })

  it('writes nothing when no line matched anything in the catalogue', async () => {
    const { tool, priceInserts } = harness()
    const result = await tool.execute(quote({ lines: [{ name: 'Widget nobody stocks', unit_price: 3 }] }), ctx)

    expect(result.ok).toBe(false)
    expect(priceInserts).toHaveLength(0)
    expect(String(result.error)).toContain('create_material')
  })
})
