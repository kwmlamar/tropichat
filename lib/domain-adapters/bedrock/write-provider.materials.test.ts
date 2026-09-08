import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { BedrockWriteProvider, type BedrockReceiptLineInsert, type BedrockStockMovementInsert } from './write-provider'
import type { BedrockConnection } from './types'

const connection: BedrockConnection = {
  workspaceId: 'ws-1',
  companyId: 'company-1',
  supabaseUrl: 'https://bedrock.invalid',
  serviceRoleKey: 'super-secret-key',
}

/**
 * Fake Supabase client for the materials write path — no module mocking and
 * no network, per house convention (see write-provider.receipts.test.ts).
 *
 * `rows` is what the ownership and completion lookups find. It defaults to
 * EMPTY, so a test has to opt into a receipt or project existing: a forgotten
 * fixture then fails loudly as a denied write rather than silently passing.
 */
function fakeClient(options: { rows?: Record<string, Record<string, unknown>> } = {}) {
  const rows = options.rows ?? {}
  const inserts: Record<string, Record<string, unknown>[]> = {}
  const updates: { table: string; patch: Record<string, unknown>; filters: Record<string, string> }[] = []
  const audits: Record<string, unknown>[] = []
  let seq = 0

  const client = {
    from(table: string) {
      return {
        insert(row: Record<string, unknown>) {
          if (table === 'audit_logs') {
            audits.push(row)
            return Promise.resolve({ error: null })
          }
          ;(inserts[table] ??= []).push(row)
          return {
            select: () => ({
              async single() {
                return { data: { id: `${table}-${seq++}` }, error: null }
              },
            }),
          }
        },
        update(patch: Record<string, unknown>) {
          const filters: Record<string, string> = {}
          const builder = {
            eq(column: string, value: string) {
              filters[column] = value
              return builder
            },
            then(resolve: (value: { error: null }) => unknown) {
              updates.push({ table, patch, filters })
              return Promise.resolve({ error: null }).then(resolve)
            },
          }
          return builder
        },
        select() {
          const filters: Record<string, string> = {}
          const builder = {
            eq(column: string, value: string) {
              filters[column] = value
              return builder
            },
            async maybeSingle() {
              const found = rows[`${table}:${filters.id}`]
              if (!found) return { data: null, error: null }
              if (filters.company_id && found.company_id !== filters.company_id) return { data: null, error: null }
              return { data: found, error: null }
            },
          }
          return builder
        },
      }
    },
  } as unknown as SupabaseClient

  return { client, inserts, updates, audits }
}

function providerWith(fake: ReturnType<typeof fakeClient>) {
  return new BedrockWriteProvider(connection, () => fake.client)
}

const OWN_RECEIPT = { 'receipts:receipt-1': { id: 'receipt-1', company_id: 'company-1', project_id: null } }
const OWN_PROJECT = { 'projects:project-1': { id: 'project-1', company_id: 'company-1' } }

function line(overrides: Partial<BedrockReceiptLineInsert> = {}): BedrockReceiptLineInsert {
  return {
    receipt_id: 'receipt-1',
    material_id: 'R1_0',
    receipt_name: 'Portland Cement 94lb',
    qty: 10,
    unit: 'bag',
    unit_cost: 12.5,
    total_cost: 125,
    match_confidence: 'high',
    ...overrides,
  }
}

describe('insertReceiptLineItems', () => {
  it('writes the lines and never a price observation alongside them', async () => {
    // The receipt_line_to_price trigger produces the observation. Writing one
    // here as well would record the same purchase twice, which is the exact
    // thing that makes an average untrustworthy.
    const fake = fakeClient({ rows: OWN_RECEIPT })
    const result = await providerWith(fake).insertReceiptLineItems('company-1', 'receipt-1', [line()])

    expect(result.ok).toBe(true)
    expect(fake.inserts.receipt_line_items).toHaveLength(1)
    expect(fake.inserts.material_prices).toBeUndefined()
  })

  it('counts only the lines the trigger would actually price', async () => {
    const fake = fakeClient({ rows: OWN_RECEIPT })
    const result = await providerWith(fake).insertReceiptLineItems('company-1', 'receipt-1', [
      line(),
      line({ receipt_name: 'Mystery item', material_id: null, match_confidence: 'none' }),
      line({ receipt_name: 'Free sample', unit_cost: 0 }),
    ])

    expect(result.insertedCount).toBe(3)
    expect(result.pricedLineCount).toBe(1)
  })

  it('refuses lines for another company’s receipt and audits the refusal', async () => {
    const fake = fakeClient({ rows: { 'receipts:receipt-1': { id: 'receipt-1', company_id: 'other-company' } } })
    const result = await providerWith(fake).insertReceiptLineItems('company-1', 'receipt-1', [line()])

    expect(result.ok).toBe(false)
    expect(fake.inserts.receipt_line_items).toBeUndefined()
    expect(fake.audits[0]).toMatchObject({ status: 'denied', target_table: 'receipt_line_items' })
  })

  it('forces the verified parent onto every row, whatever the caller put there', async () => {
    const fake = fakeClient({ rows: OWN_RECEIPT })
    await providerWith(fake).insertReceiptLineItems('company-1', 'receipt-1', [line({ receipt_id: 'someone-elses-receipt' })])

    expect(fake.inserts.receipt_line_items[0].receipt_id).toBe('receipt-1')
  })

  it('writes nothing and audits nothing for an empty line list', async () => {
    const fake = fakeClient({ rows: OWN_RECEIPT })
    const result = await providerWith(fake).insertReceiptLineItems('company-1', 'receipt-1', [])

    expect(result.ok).toBe(true)
    expect(fake.audits).toHaveLength(0)
  })
})

describe('insertMaterialPrices', () => {
  it('sets company_id explicitly rather than leaning on the live ODS default', async () => {
    // material_prices.company_id defaults to a hard-coded ODS uuid. Relying on
    // it would scope another tenant's observation to ODS, and the default is
    // being dropped so a missing value fails loudly.
    const fake = fakeClient()
    await providerWith(fake).insertMaterialPrices('company-1', [
      {
        material_id: 'R1_0', vendor_id: 'v-1', project_id: null, source: 'quote',
        observed_at: '2026-09-07', unit_price: 12.5, currency: 'USD', uom: 'bag',
        quantity: null, origin: 'FL', store_ref: null, document_ref: 'Q-118',
        receipt_id: null, is_landed: false, confidence: 'high', note: null,
        company_id: 'someone-else',
      },
    ])

    expect(fake.inserts.material_prices[0]).toMatchObject({ company_id: 'company-1', is_landed: false, currency: 'USD' })
  })
})

describe('insertInstalledItem', () => {
  it('refuses an item pointed at another company’s project', async () => {
    const fake = fakeClient({ rows: { 'projects:project-1': { id: 'project-1', company_id: 'other-company' } } })
    const result = await providerWith(fake).insertInstalledItem('company-1', {
      project_id: 'project-1', material_id: null, description: 'Water heater', tag: null, location: null,
      quantity: null, unit: null, manufacturer: 'Rheem', model_no: 'XE50', serial_no: null,
      finish_color: null, size_spec: null, vendor_id: null, install_date: null, warranty_months: null,
      spec_sheet_path: null, photo_path: null, data_quality: 'partial', notes: null, company_id: 'company-1',
    })

    expect(result.ok).toBe(false)
    expect(fake.inserts.project_installed_items).toBeUndefined()
    expect(fake.audits[0]).toMatchObject({ status: 'denied' })
  })
})

describe('updateReceiptAttribution', () => {
  it('sets project_id and touches nothing else', async () => {
    const fake = fakeClient({ rows: { ...OWN_RECEIPT, ...OWN_PROJECT } })
    const result = await providerWith(fake).updateReceiptAttribution('company-1', 'receipt-1', 'project-1')

    expect(result.ok).toBe(true)
    // The whole allowlist. A money or status column appearing in this patch
    // would mean the exception had stopped being an exception.
    expect(Object.keys(fake.updates[0].patch)).toEqual(['project_id'])
    expect(fake.updates[0].filters).toMatchObject({ id: 'receipt-1', company_id: 'company-1' })
  })

  it('refuses to move a receipt already attached to a different job', async () => {
    const fake = fakeClient({
      rows: { 'receipts:receipt-1': { id: 'receipt-1', company_id: 'company-1', project_id: 'project-other' }, ...OWN_PROJECT },
    })
    const result = await providerWith(fake).updateReceiptAttribution('company-1', 'receipt-1', 'project-1')

    expect(result.ok).toBe(false)
    expect(result.previousProjectId).toBe('project-other')
    expect(fake.updates).toHaveLength(0)
    expect(fake.audits[0]).toMatchObject({ status: 'denied' })
  })

  it('refuses a project that belongs to another company', async () => {
    const fake = fakeClient({ rows: { ...OWN_RECEIPT, 'projects:project-1': { id: 'project-1', company_id: 'other-company' } } })
    const result = await providerWith(fake).updateReceiptAttribution('company-1', 'receipt-1', 'project-1')

    expect(result.ok).toBe(false)
    expect(fake.updates).toHaveLength(0)
  })

  it('refuses a receipt that belongs to another company', async () => {
    const fake = fakeClient({ rows: { 'receipts:receipt-1': { id: 'receipt-1', company_id: 'other-company' }, ...OWN_PROJECT } })
    const result = await providerWith(fake).updateReceiptAttribution('company-1', 'receipt-1', 'project-1')

    expect(result.ok).toBe(false)
    expect(fake.updates).toHaveLength(0)
  })
})

describe('completeInstalledItem', () => {
  const existing = (over: Record<string, unknown> = {}) => ({
    'project_installed_items:item-1': {
      id: 'item-1', company_id: 'company-1', manufacturer: null, model_no: null,
      serial_no: null, location: 'utility room', ...over,
    },
  })

  it('fills fields that are null and leaves the rest alone', async () => {
    const fake = fakeClient({ rows: existing() })
    const result = await providerWith(fake).completeInstalledItem('company-1', 'item-1', {
      manufacturer: 'Rheem',
      model_no: 'XE50T10H45U0',
      data_quality: 'partial',
    })

    expect(result.ok).toBe(true)
    expect(result.filledFields.sort()).toEqual(['manufacturer', 'model_no'])
    expect(fake.updates[0].patch).toEqual({ manufacturer: 'Rheem', model_no: 'XE50T10H45U0', data_quality: 'partial' })
  })

  it('refuses to overwrite a value that is already there and differs', async () => {
    // Two people disagreeing about a serial number is something an operator
    // has to see. A later photo silently winning is how a wrong part gets
    // ordered off a number nobody checked.
    const fake = fakeClient({ rows: existing({ serial_no: 'Q12345' }) })
    const result = await providerWith(fake).completeInstalledItem('company-1', 'item-1', { serial_no: 'Q99999' })

    expect(result.ok).toBe(false)
    expect(result.conflicts).toEqual([{ field: 'serial_no', existing: 'Q12345', proposed: 'Q99999' }])
    expect(fake.updates).toHaveLength(0)
    expect(fake.audits[0]).toMatchObject({ status: 'denied' })
  })

  it('treats an identical value as nothing to do, not a conflict', async () => {
    const fake = fakeClient({ rows: existing({ serial_no: 'Q12345' }) })
    const result = await providerWith(fake).completeInstalledItem('company-1', 'item-1', { serial_no: 'Q12345' })

    expect(result.ok).toBe(true)
    expect(result.conflicts).toHaveLength(0)
  })

  it('ignores anything outside the completable allowlist', async () => {
    const fake = fakeClient({ rows: existing() })
    await providerWith(fake).completeInstalledItem('company-1', 'item-1', {
      manufacturer: 'Rheem',
      // Not on the allowlist. A completion path that could restate a cost
      // would be a money write wearing a data-plate photo as a disguise.
      unit_cost: 999,
      description: 'something else entirely',
    } as never)

    expect(Object.keys(fake.updates[0].patch)).toEqual(['manufacturer'])
  })

  it('writes and audits nothing when there is nothing left to fill', async () => {
    const fake = fakeClient({ rows: existing({ manufacturer: 'Rheem' }) })
    const result = await providerWith(fake).completeInstalledItem('company-1', 'item-1', { manufacturer: 'Rheem' })

    expect(result.ok).toBe(true)
    expect(fake.updates).toHaveLength(0)
    expect(fake.audits).toHaveLength(0)
  })

  it('refuses an item belonging to another company', async () => {
    const fake = fakeClient({ rows: { 'project_installed_items:item-1': { id: 'item-1', company_id: 'other-company' } } })
    const result = await providerWith(fake).completeInstalledItem('company-1', 'item-1', { manufacturer: 'Rheem' })

    expect(result.ok).toBe(false)
    expect(fake.updates).toHaveLength(0)
  })
})

describe('insertStockMovement', () => {
  function movement(overrides: Partial<BedrockStockMovementInsert> = {}): BedrockStockMovementInsert {
    return {
      material_id: 'S028',
      description: '3/4" CDX Plywood 4x8',
      movement_type: 'return_from_job',
      quantity: 8,
      unit: 'SHEET',
      unit_cost_landed: 62.4,
      project_id: 'project-1',
      location: 'Yard',
      occurred_at: '2026-09-08T15:00:00.000Z',
      recorded_by: 'profile-jay',
      photo_path: null,
      note: null,
      company_id: 'company-1',
      ...overrides,
    }
  }

  it('forces company_id and audits the insert', async () => {
    // The live column default is a hard-coded ODS uuid due for removal, so a
    // row that trusted it silently becomes another company's stock the day it
    // changes.
    const fake = fakeClient({ rows: OWN_PROJECT })
    const result = await providerWith(fake).insertStockMovement('company-1', movement({ company_id: 'attacker' }))

    expect(result.ok).toBe(true)
    expect(fake.inserts.stock_movements[0]).toMatchObject({ company_id: 'company-1', movement_type: 'return_from_job' })
    expect(fake.audits[0]).toMatchObject({ target_table: 'stock_movements', tool_name: 'insertStockMovement', status: 'ok' })
  })

  it('writes only the allowlisted columns, never a spread of the caller argument', async () => {
    const fake = fakeClient({ rows: OWN_PROJECT })
    await providerWith(fake).insertStockMovement(
      'company-1',
      movement({ id: 'chosen-id', created_at: '1999-01-01' } as never),
    )

    expect(Object.keys(fake.inserts.stock_movements[0]).sort()).toEqual([
      'company_id', 'description', 'location', 'material_id', 'movement_type', 'note',
      'occurred_at', 'photo_path', 'project_id', 'quantity', 'recorded_by', 'unit', 'unit_cost_landed',
    ])
  })

  it('reports that the shelf did NOT move when there is no material', async () => {
    // stock_movements_apply returns early on a null material_id. The caller
    // has to be told, because the database is silent about it.
    const fake = fakeClient({ rows: OWN_PROJECT })
    const result = await providerWith(fake).insertStockMovement('company-1', movement({ material_id: null }))

    expect(result.ok).toBe(true)
    expect(result.materialApplied).toBe(false)
  })

  it('reports that the shelf moved when there is one', async () => {
    const fake = fakeClient({ rows: OWN_PROJECT })
    const result = await providerWith(fake).insertStockMovement('company-1', movement())

    expect(result.materialApplied).toBe(true)
  })

  it('refuses and audits a movement pointed at another company’s project', async () => {
    const fake = fakeClient({ rows: { 'projects:project-1': { id: 'project-1', company_id: 'other-company' } } })
    const result = await providerWith(fake).insertStockMovement('company-1', movement())

    expect(result.ok).toBe(false)
    expect(result.materialApplied).toBe(false)
    expect(fake.inserts.stock_movements).toBeUndefined()
    expect(fake.audits[0]).toMatchObject({ status: 'denied', target_table: 'stock_movements' })
  })

  it('writes a movement with no project without inventing an ownership check', async () => {
    // project_id is nullable on this table. There is nothing to check, so
    // nothing is checked -- but the row still lands.
    const fake = fakeClient()
    const result = await providerWith(fake).insertStockMovement('company-1', movement({ project_id: null }))

    expect(result.ok).toBe(true)
    expect(fake.inserts.stock_movements[0]).toMatchObject({ project_id: null })
  })

  it('never touches stock_items, which the trigger owns', async () => {
    const fake = fakeClient({ rows: OWN_PROJECT })
    await providerWith(fake).insertStockMovement('company-1', movement())

    expect(fake.inserts.stock_items).toBeUndefined()
    expect(fake.updates.filter((u) => u.table === 'stock_items')).toHaveLength(0)
  })
})
