import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { makeAttributeReceipt } from './attribute-receipt'
import { makeCreateMaterial } from './create-material'
import { makeRecordInstalledItem } from './record-installed-item'
import type { ToolContext } from '../types'

const ctx: ToolContext = { workspaceId: 'ws-1', callerRole: 'owner', requestId: 'req-1', operatorId: 7 }

const OK = {
  ok: true, attemptedCount: 1, insertedCount: 1, insertedIds: ['new-1'],
  failedRows: [], auditLogWritten: true, auditLogError: null,
}

type JobMatch = 'one' | 'none' | 'many'

function jobResolver(match: JobMatch) {
  return async () => ({
    match,
    count: match === 'many' ? 2 : match === 'one' ? 1 : 0,
    candidates:
      match === 'one'
        ? [{ id: 'project-1', name: 'Blue Sky Villa', status: 'active', client_name: null, location: null }]
        : match === 'many'
          ? [
              { id: 'project-1', name: 'Blue Sky Villa', status: 'active', client_name: null, location: null },
              { id: 'project-2', name: 'Blue Sky Cottage', status: 'active', client_name: null, location: null },
            ]
          : [],
  })
}

describe('attribute_receipt', () => {
  function harness(options: { match?: JobMatch; previousProjectId?: string | null; ok?: boolean } = {}) {
    const calls: { receiptId: string; projectId: string }[] = []
    const tool = makeAttributeReceipt({
      getWriteProvider: (async () => ({
        companyId: 'company-1',
        identityFor: () => ({ profileId: 'p', workerId: null }),
        provider: {
          async updateReceiptAttribution(_c: string, receiptId: string, projectId: string) {
            calls.push({ receiptId, projectId })
            return {
              ...OK,
              ok: options.ok ?? true,
              failedRows: options.ok === false ? [{ index: 0, row: {}, error: 'refused' }] : [],
              previousProjectId: options.previousProjectId ?? null,
            }
          },
        },
      })) as never,
      getAdapter: (() => ({})) as never,
      resolveJobBy: jobResolver(options.match ?? 'one') as never,
    })
    return { tool, calls }
  }

  it('attaches a receipt when the job resolves to exactly one', async () => {
    const { tool, calls } = harness()
    const result = await tool.execute({ receipt_id: 'receipt-1', project: 'Blue Sky' }, ctx)

    expect(result.ok).toBe(true)
    expect(calls).toEqual([{ receiptId: 'receipt-1', projectId: 'project-1' }])
  })

  it('asks which job rather than picking one when the name is ambiguous', async () => {
    // A receipt on the wrong house is worse than one on no house: it is a
    // false number in a job's costs that nobody will go looking for.
    const { tool, calls } = harness({ match: 'many' })
    const result = await tool.execute({ receipt_id: 'receipt-1', project: 'Blue Sky' }, ctx)

    expect(result.ok).toBe(false)
    expect(calls).toHaveLength(0)
    expect(String(result.error)).toContain('Blue Sky Cottage')
  })

  it('writes nothing when no job matches', async () => {
    const { tool, calls } = harness({ match: 'none' })
    const result = await tool.execute({ receipt_id: 'receipt-1', project: 'Nowhere' }, ctx)

    expect(result.ok).toBe(false)
    expect(calls).toHaveLength(0)
  })

  it('explains a refusal to move spend between houses in the operator’s terms', async () => {
    const { tool } = harness({ ok: false, previousProjectId: 'project-other' })
    const result = await tool.execute({ receipt_id: 'receipt-1', project: 'Blue Sky' }, ctx)

    expect(result.ok).toBe(false)
    expect(String(result.error)).toContain('already attached to a different job')
  })
})

describe('create_material', () => {
  function harness() {
    const materials: Record<string, unknown>[] = []
    const prices: Record<string, unknown>[][] = []
    const tool = makeCreateMaterial({
      now: () => new Date('2026-09-07T12:00:00Z'),
      getWriteProvider: (async () => ({
        companyId: 'company-1',
        identityFor: () => ({ profileId: 'p', workerId: null }),
        provider: {
          async insertMaterial(_c: string, row: Record<string, unknown>) { materials.push(row); return OK },
          async insertMaterialPrices(_c: string, rows: Record<string, unknown>[]) { prices.push(rows); return OK },
        },
      })) as never,
      getAdapter: (() => ({
        async listMaterials() { return [{ id: 'R9_0', name: 'Rebar #4 20ft', unit: 'ea' }] },
        async listVendors() { return [{ id: 'v-1', name: 'Kelly’s' }] },
      })) as never,
    })
    return { tool, materials, prices }
  }

  const args = (over: Record<string, unknown> = {}) => ({
    name: 'Portland Cement 94lb', division_code: '03', category: 'Cement', unit: 'bag',
    unit_price: 12.5, origin: 'NASSAU', duty_category: 'cement', source: 'receipt' as const,
    vendor: 'Kelly’s', receipt_id: 'receipt-1', ...over,
  })

  it('writes the catalogue row and its first observation together', async () => {
    // unit_cost is NOT NULL with no default, so it must be seeded — but it is
    // only ever a seed. The observation goes in with it, and the
    // material_prices_refresh trigger owns the column from then on.
    const { tool, materials, prices } = harness()
    const result = await tool.execute(args(), ctx)

    expect(result.ok).toBe(true)
    expect(materials[0]).toMatchObject({
      division_code: '03', division_name: 'Concrete', origin: 'NASSAU',
      duty_category: 'cement', company_id: 'company-1', vendor_id: 'v-1', unit_cost: 12.5,
    })
    expect(String(materials[0].id)).toMatch(/^R\d+_0$/)
    expect(prices[0][0]).toMatchObject({ material_id: materials[0].id, source: 'receipt', unit_price: 12.5, is_landed: true })
  })

  it('never lets a source flag reach the division name', async () => {
    // 'From Receipt' in division_name is what collapsed CSI grouping. The name
    // is looked up from the code and cannot be supplied.
    const { tool, materials } = harness()
    const result = await tool.execute(args({ division_code: 'From Receipt' }), ctx)

    expect(result.ok).toBe(false)
    expect(materials).toHaveLength(0)
  })

  it('refuses a duty category no landed-cost rule could match', async () => {
    const { tool, materials } = harness()
    const result = await tool.execute(args({ duty_category: 'cementish' }), ctx)

    expect(result.ok).toBe(false)
    expect(materials).toHaveLength(0)
    expect(String(result.error)).toContain('landed cost')
  })

  it('refuses a price it was not given', async () => {
    const { tool, materials } = harness()
    expect((await tool.execute(args({ unit_price: 0 }), ctx)).ok).toBe(false)
    expect(materials).toHaveLength(0)
  })

  it('refuses to add something the catalogue already has', async () => {
    // Two rows for the same thing split its price history, so neither has
    // enough observations to trust and vendor comparison compares one row
    // against the other.
    const { tool, materials } = harness()
    const result = await tool.execute(args({ name: 'Rebar #4 20ft' }), ctx)

    expect(result.ok).toBe(false)
    expect(materials).toHaveLength(0)
    expect(String(result.error)).toContain('split its price history')
  })

  it('marks a price somebody merely told us as low confidence and needing review', async () => {
    const { tool, materials, prices } = harness()
    await tool.execute(args({ source: 'manual', origin: 'FL' }), ctx)

    expect(materials[0]).toMatchObject({ needs_review: true })
    expect(prices[0][0]).toMatchObject({ source: 'manual', confidence: 'low', is_landed: false })
  })
})

describe('record_installed_item', () => {
  function harness(options: { match?: JobMatch; conflicts?: { field: string; existing: unknown; proposed: unknown }[] } = {}) {
    const inserts: Record<string, unknown>[] = []
    const completions: Record<string, unknown>[] = []
    const tool = makeRecordInstalledItem({
      getWriteProvider: (async () => ({
        companyId: 'company-1',
        identityFor: () => ({ profileId: 'p', workerId: null }),
        provider: {
          async insertInstalledItem(_c: string, row: Record<string, unknown>) { inserts.push(row); return OK },
          async completeInstalledItem(_c: string, _id: string, completion: Record<string, unknown>) {
            completions.push(completion)
            return {
              ...OK,
              ok: !(options.conflicts?.length),
              conflicts: options.conflicts ?? [],
              filledFields: options.conflicts?.length ? [] : ['manufacturer'],
            }
          },
        },
      })) as never,
      getAdapter: (() => ({ async listVendors() { return [] } })) as never,
      resolveJobBy: jobResolver(options.match ?? 'one') as never,
    })
    return { tool, inserts, completions }
  }

  it('records what was legible and computes data_quality from it, not from the caller', async () => {
    const { tool, inserts } = harness()
    const result = await tool.execute(
      { project: 'Blue Sky', description: '50 gal electric water heater', manufacturer: 'Rheem', model_no: 'XE50', serial_no: 'Q1', serial_expected: true },
      ctx
    )

    expect(result.ok).toBe(true)
    expect(inserts[0]).toMatchObject({ project_id: 'project-1', data_quality: 'complete', company_id: 'company-1' })
  })

  it('will not call a record complete when the serial it should have is missing', async () => {
    // An owner ordering the wrong part off a guessed model number is a worse
    // outcome than a blank field, so the record says what it does not know.
    const { tool, inserts } = harness()
    const result = await tool.execute(
      { project: 'Blue Sky', description: 'AC condenser', manufacturer: 'Carrier', model_no: '24ABC6', serial_expected: true },
      ctx
    )

    expect(inserts[0]).toMatchObject({ data_quality: 'partial', serial_no: null })
    expect((result.data as Record<string, unknown>).not_recorded).toContain('serial number')
  })

  it('never stores a document path for a file it did not store', async () => {
    const { tool, inserts } = harness()
    await tool.execute({ project: 'Blue Sky', description: 'Front door', manufacturer: 'Therma-Tru' }, ctx)

    expect(inserts[0]).toMatchObject({ photo_path: null, spec_sheet_path: null })
  })

  it('refuses to record an item against an ambiguous house', async () => {
    const { tool, inserts } = harness({ match: 'many' })
    const result = await tool.execute({ project: 'Blue Sky', description: 'Water heater' }, ctx)

    expect(result.ok).toBe(false)
    expect(inserts).toHaveLength(0)
  })

  it('needs a house and a description before it records anything', async () => {
    const { tool, inserts } = harness()
    expect((await tool.execute({ description: 'Water heater' }, ctx)).ok).toBe(false)
    expect((await tool.execute({ project: 'Blue Sky' }, ctx)).ok).toBe(false)
    expect(inserts).toHaveLength(0)
  })

  it('completes an existing record instead of creating a rival one', async () => {
    const { tool, inserts, completions } = harness()
    const result = await tool.execute({ installed_item_id: 'item-1', manufacturer: 'Rheem' }, ctx)

    expect(result.ok).toBe(true)
    expect(inserts).toHaveLength(0)
    expect(completions[0]).toMatchObject({ manufacturer: 'Rheem' })
  })

  it('surfaces a disagreement about a serial number instead of overwriting it', async () => {
    const { tool } = harness({ conflicts: [{ field: 'serial_no', existing: 'Q12345', proposed: 'Q99999' }] })
    const result = await tool.execute({ installed_item_id: 'item-1', serial_no: 'Q99999' }, ctx)

    expect(result.ok).toBe(false)
    expect(String(result.error)).toContain('Q12345')
    expect(String(result.error)).toContain('will not overwrite')
  })
})
