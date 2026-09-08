import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { makeRecordYardReturn } from './record-yard-return'
import { resolveYardReturn } from './_yard-resolution'
import type { ToolContext } from '../types'
import type { BedrockMaterialInsert, BedrockStockMovementInsert } from '@/lib/domain-adapters/bedrock'

const ctx: ToolContext = { workspaceId: 'ws-1', callerRole: 'staff', requestId: 'req-1', operatorId: 34 }

const CATALOGUE = [
  { id: 'S028', name: '3/4" CDX Plywood 4x8', unit: 'SHEET', isCore: false },
  { id: 'S029', name: '1/2" CDX Plywood 4x8', unit: 'SHEET', isCore: true },
  { id: 'B012', name: '8" Concrete Block', unit: 'EA', isCore: true },
]

const PRICES = [
  { materialId: 'S028', landedUnitCost: 62.4, unit: 'SHEET', observedAt: '2026-08-01', isStale: false, source: 'receipt', currency: 'BSD' },
  { materialId: 'B012', landedUnitCost: 3.15, unit: 'EA', observedAt: '2026-07-02', isStale: true, source: 'quote', currency: 'BSD' },
]

const PROJECT = { id: 'project-1', name: 'Blue Sky Villa', status: 'active', clientNameSnapshot: null, location: null }

function fakeAdapter(options: { projects?: unknown[]; catalogue?: unknown[]; prices?: unknown[]; catalogueThrows?: boolean } = {}) {
  return {
    async listProjects() {
      return options.projects ?? [PROJECT]
    },
    async listMaterials() {
      if (options.catalogueThrows) throw new Error('catalogue unreadable')
      return options.catalogue ?? CATALOGUE
    },
    async getMaterialLandedCosts() {
      return options.prices ?? PRICES
    },
  }
}

interface HarnessOptions {
  adapter?: ReturnType<typeof fakeAdapter>
  photo?: { mediaId: string; mimeType: string; arrivedAt: string } | null
  uploadOk?: boolean
  downloadThrows?: boolean
  failDescriptions?: string[]
  materialInsertFails?: boolean
}

function harness(options: HarnessOptions = {}) {
  const written: BedrockStockMovementInsert[] = []
  const materials: BedrockMaterialInsert[] = []
  const uploads: { filename: string; mimeType: string }[] = []

  const tool = makeRecordYardReturn({
    getAdapter: (() => options.adapter ?? fakeAdapter()) as never,
    getWriteProvider: (async () => ({
      companyId: 'company-1',
      identityFor: () => ({ profileId: 'profile-jay', workerId: null }),
      provider: {
        async uploadStockPhoto(_c: string, params: { filename: string; mimeType: string }) {
          uploads.push({ filename: params.filename, mimeType: params.mimeType })
          return options.uploadOk === false
            ? { ok: false as const, error: 'bucket rejected it' }
            : { ok: true as const, url: `https://bucket/stock/company-1/${params.filename}`, path: `stock/company-1/${params.filename}` }
        },
        async insertMaterial(_c: string, row: BedrockMaterialInsert) {
          materials.push(row)
          const failed = options.materialInsertFails === true
          return {
            ok: !failed,
            attemptedCount: 1,
            insertedCount: failed ? 0 : 1,
            insertedIds: failed ? [] : [row.id],
            failedRows: failed ? [{ index: 0, row, error: 'catalogue insert failed' }] : [],
            auditLogWritten: true,
            auditLogError: null,
          }
        },
        async insertStockMovement(_c: string, row: BedrockStockMovementInsert) {
          written.push(row)
          const failed = options.failDescriptions?.includes(row.description) ?? false
          return {
            ok: !failed,
            attemptedCount: 1,
            insertedCount: failed ? 0 : 1,
            insertedIds: failed ? [] : [`movement-${written.length}`],
            failedRows: failed ? [{ index: 0, row, error: 'insert failed' }] : [],
            auditLogWritten: true,
            auditLogError: null,
            materialApplied: !failed && row.material_id != null,
          }
        },
      },
    })) as never,
    findPhoto: (async () => options.photo ?? null) as never,
    downloadMedia: (async () => {
      if (options.downloadThrows) throw new Error('Meta returned 404')
      return { base64: Buffer.from('image-bytes').toString('base64'), mimeType: 'image/jpeg' }
    }) as never,
    resolveReturn: resolveYardReturn,
    now: () => new Date('2026-09-08T15:00:00.000Z'),
  })

  return { tool, written, materials, uploads }
}

describe('record_yard_return', () => {
  it('records a put-away with the landed cost looked up, not asked for', async () => {
    // The whole point: nobody in a yard is asked what a sheet of plywood
    // cost. The value comes from material_pricing.landed_unit_cost.
    const { tool, written } = harness()
    const result = await tool.execute(
      { items: [{ description: '3/4" CDX Plywood 4x8', quantity: 8 }], project: 'Blue Sky' },
      ctx,
    )

    expect(result.ok).toBe(true)
    expect(written).toHaveLength(1)
    expect(written[0]).toMatchObject({
      material_id: 'S028',
      description: '3/4" CDX Plywood 4x8',
      movement_type: 'return_from_job',
      quantity: 8,
      unit: 'SHEET',
      unit_cost_landed: 62.4,
      project_id: 'project-1',
      location: 'Yard',
      recorded_by: 'profile-jay',
      company_id: 'company-1',
    })
    expect((result.data as { value_returned: number }).value_returned).toBe(499.2)
  })

  it('never writes anything but return_from_job', async () => {
    // Issues to jobs, count adjustments and disposals are desk actions done
    // in TropiTrack's UI. This tool has exactly one movement type and no
    // argument that could change it.
    const { tool, written } = harness()
    await tool.execute({ items: [{ description: '8" Concrete Block', quantity: 40 }], project: 'Blue Sky' }, ctx)
    expect(written.every(row => row.movement_type === 'return_from_job')).toBe(true)
    expect(Object.keys(tool.inputSchema.properties ?? {})).not.toContain('movement_type')
  })

  it('sets company_id explicitly rather than relying on the column default', async () => {
    // The live default on stock_movements.company_id is a hard-coded ODS
    // uuid due for removal. A row that relied on it becomes another
    // company's stock the day it changes.
    const { tool, written } = harness()
    await tool.execute({ items: [{ description: '8" Concrete Block', quantity: 40 }], project: 'Blue Sky' }, ctx)
    expect(written[0].company_id).toBe('company-1')
  })

  it('writes one movement per thing so a load is one confirmation', async () => {
    const { tool, written } = harness()
    const result = await tool.execute(
      {
        items: [
          { description: '3/4" CDX Plywood 4x8', quantity: 8 },
          { description: '8" Concrete Block', quantity: 40 },
        ],
        project: 'Blue Sky',
      },
      ctx,
    )

    expect(result.ok).toBe(true)
    expect(written).toHaveLength(2)
    // 8 * 62.40 + 40 * 3.15
    expect((result.data as { value_returned: number }).value_returned).toBe(625.2)
  })

  it('refuses to record without a job, and hands back the candidates', async () => {
    // Provenance is the one field with no defensible default: material with
    // no job cannot be credited back to the budget that bought it, and the
    // wrong job moves money between two houses.
    const adapter = fakeAdapter({
      projects: [PROJECT, { ...PROJECT, id: 'project-2', name: 'Blue Sky Cottage' }],
    })
    const { tool, written } = harness({ adapter })
    const result = await tool.execute(
      { items: [{ description: '3/4" CDX Plywood 4x8', quantity: 8 }], project: 'Blue Sky' },
      ctx,
    )

    expect(result.ok).toBe(false)
    expect(written).toHaveLength(0)
    expect(String(result.error)).toContain('Blue Sky Cottage')
    expect((result.data as { job_candidates: string[] }).job_candidates).toHaveLength(2)
  })

  it('creates a catalogue row for an unmatched line so the shelf still moves', async () => {
    // stock_items is keyed on (company_id, material_id, location), so a null
    // material cannot form a shelf and stock_movements_apply returns early on
    // one. The unmatched case is the COMMON one in a yard, so leaving it null
    // would have permanently under-stated the material actually standing there.
    const { tool, written, materials } = harness()
    const result = await tool.execute(
      { items: [{ description: 'them grey blocks off the pallet', quantity: 12 }], project: 'Blue Sky' },
      ctx,
    )

    expect(result.ok).toBe(true)
    expect(materials).toHaveLength(1)
    expect(materials[0]).toMatchObject({
      name: 'them grey blocks off the pallet',
      division_code: '99',
      division_name: 'Unclassified — needs review',
      category: 'Unclassified',
      unit: 'EA',
      origin: 'UNKNOWN',
      needs_review: true,
      is_core: false,
      company_id: 'company-1',
      // NOT a guess at a price. materials.unit_cost means landed BSD and feeds
      // estimates; a put-away carries no purchase price.
      unit_cost: 0,
      duty_category: null,
    })
    expect(String(materials[0].review_note)).toContain('No cost basis')

    // The movement carries the material that was just created, so the shelf
    // moves -- but at no value.
    expect(written[0].material_id).toBe(materials[0].id)
    expect(written[0].unit_cost_landed).toBeNull()
    expect(written[0].description).toBe('them grey blocks off the pallet')

    const data = result.data as { on_the_shelf: number; not_on_the_shelf: number; note: string; catalogue_items_created: unknown[] }
    expect(data.on_the_shelf).toBe(1)
    expect(data.not_on_the_shelf).toBe(0)
    expect(data.catalogue_items_created).toHaveLength(1)
    expect(data.note).toContain('added for review')
    expect(data.note).toContain('under-stated')
  })

  it('gives yard-created rows a Y prefix so LIKE \'R%\' queries stay correct', async () => {
    // 12 live catalogue rows are selected as document-derived with LIKE 'R%'.
    // A yard row in that set would assert a purchase price that does not exist.
    const { tool, materials } = harness()
    await tool.execute(
      {
        items: [
          { description: 'them grey blocks', quantity: 12 },
          { description: 'a bag of something', quantity: 2 },
        ],
        project: 'Blue Sky',
      },
      ctx,
    )

    expect(materials).toHaveLength(2)
    expect(materials.every(row => row.id.startsWith('Y'))).toBe(true)
    // The index disambiguates two rows created in the same millisecond.
    expect(new Set(materials.map(row => row.id)).size).toBe(2)
  })

  it('uses the model’s division guess when it gave one, and never invents a name for it', async () => {
    const { tool, materials } = harness()
    await tool.execute(
      { items: [{ description: '8in block', quantity: 40, division_code: '04', category: 'Block', unit: 'EA' }], project: 'Blue Sky' },
      ctx,
    )
    expect(materials[0]).toMatchObject({ division_code: '04', division_name: 'Masonry', category: 'Block' })
  })

  it('reuses an existing catalogue row rather than creating a duplicate', async () => {
    const { tool, materials, written } = harness()
    await tool.execute(
      { items: [{ description: '3/4" CDX Plywood 4x8', quantity: 8 }], project: 'Blue Sky' },
      ctx,
    )
    expect(materials).toHaveLength(0)
    expect(written[0].material_id).toBe('S028')
  })

  it('still records the count when the catalogue row cannot be created', async () => {
    // The count is worth more than the shelf entry. The shortfall is reported
    // rather than presented as a clean put-away.
    const { tool, written } = harness({ materialInsertFails: true })
    const result = await tool.execute(
      { items: [{ description: 'them grey blocks', quantity: 12 }], project: 'Blue Sky' },
      ctx,
    )

    expect(written).toHaveLength(1)
    expect(written[0].material_id).toBeNull()
    expect(written[0].quantity).toBe(12)
    expect(result.ok).toBe(false)
    expect(String((result.data as { failed: string[] }).failed.join(' '))).toContain('could not be added to the catalogue')
  })

  it('attaches no cost when the material has no price on file', async () => {
    const { tool, written } = harness({ adapter: fakeAdapter({ prices: [] }) })
    const result = await tool.execute(
      { items: [{ description: '3/4" CDX Plywood 4x8', quantity: 8 }], project: 'Blue Sky' },
      ctx,
    )

    expect(result.ok).toBe(true)
    expect(written[0].material_id).toBe('S028')
    expect(written[0].unit_cost_landed).toBeNull()
    expect((result.data as { value_returned: number }).value_returned).toBe(0)
  })

  it('still records the count when the catalogue cannot be read', async () => {
    // Nothing can be matched, so a new row is created -- which is the same
    // outcome as any unidentified return, and keeps the shelf right.
    const { tool, written, materials } = harness({ adapter: fakeAdapter({ catalogueThrows: true }) })
    const result = await tool.execute(
      { items: [{ description: '3/4" CDX Plywood 4x8', quantity: 8 }], project: 'Blue Sky' },
      ctx,
    )

    expect(result.ok).toBe(true)
    expect(materials).toHaveLength(1)
    expect(written[0].material_id).toBe(materials[0].id)
    expect(written[0].quantity).toBe(8)
  })

  it('defaults the location to the main yard without asking', async () => {
    const { tool, written } = harness()
    await tool.execute({ items: [{ description: '8" Concrete Block', quantity: 40 }], project: 'Blue Sky' }, ctx)
    expect(written[0].location).toBe('Yard')
  })

  it('keeps a genuinely different location', async () => {
    const { tool, written } = harness()
    await tool.execute(
      { items: [{ description: '8" Concrete Block', quantity: 40 }], project: 'Blue Sky', location: 'Palmetto Point lot' },
      ctx,
    )
    expect(written[0].location).toBe('Palmetto Point lot')
  })

  it('defaults occurred_at to now and accepts an earlier day', async () => {
    const { tool, written } = harness()
    await tool.execute({ items: [{ description: '8" Concrete Block', quantity: 40 }], project: 'Blue Sky' }, ctx)
    expect(written[0].occurred_at).toBe('2026-09-08T15:00:00.000Z')

    const { tool: dated, written: datedRows } = harness()
    await dated.execute(
      { items: [{ description: '8" Concrete Block', quantity: 40 }], project: 'Blue Sky', occurred_at: '2026-09-05' },
      ctx,
    )
    expect(String(datedRows[0].occurred_at)).toContain('2026-09-05')
  })

  it('attaches a recent photo when there was one', async () => {
    const { tool, written, uploads } = harness({
      photo: { mediaId: 'media-9', mimeType: 'image/jpeg', arrivedAt: '2026-09-08T14:58:00.000Z' },
    })
    const result = await tool.execute(
      { items: [{ description: '3/4" CDX Plywood 4x8', quantity: 8 }], project: 'Blue Sky' },
      ctx,
    )

    expect(uploads).toEqual([{ filename: 'media-9.jpg', mimeType: 'image/jpeg' }])
    expect(written[0].photo_path).toBe('stock/company-1/media-9.jpg')
    expect((result.data as { photo_taken_from_message_at: string }).photo_taken_from_message_at).toBe(
      '2026-09-08T14:58:00.000Z',
    )
  })

  it('records the put-away anyway when the photo cannot be fetched', async () => {
    // The opposite of log_receipt, deliberately: receipts.image_url is NOT
    // NULL so a receipt without its image cannot exist, but
    // stock_movements.photo_path is nullable. Losing the count because
    // nobody's photo downloaded would trade the feature for evidence.
    const { tool, written } = harness({
      photo: { mediaId: 'media-9', mimeType: 'image/jpeg', arrivedAt: '2026-09-08T14:58:00.000Z' },
      downloadThrows: true,
    })
    const result = await tool.execute(
      { items: [{ description: '3/4" CDX Plywood 4x8', quantity: 8 }], project: 'Blue Sky' },
      ctx,
    )

    expect(result.ok).toBe(true)
    expect(written[0].photo_path).toBeNull()
    expect(String((result.data as { photo_note: string }).photo_note)).toContain('could not be retrieved')
  })

  it('records the put-away anyway when the photo cannot be stored', async () => {
    const { tool, written } = harness({
      photo: { mediaId: 'media-9', mimeType: 'image/jpeg', arrivedAt: '2026-09-08T14:58:00.000Z' },
      uploadOk: false,
    })
    const result = await tool.execute(
      { items: [{ description: '3/4" CDX Plywood 4x8', quantity: 8 }], project: 'Blue Sky' },
      ctx,
    )

    expect(result.ok).toBe(true)
    expect(written[0].photo_path).toBeNull()
    expect(String((result.data as { photo_note: string }).photo_note)).toContain('could not be stored')
  })

  it('reports a partial write as partial, naming what is NOT in the yard', async () => {
    const { tool } = harness({ failDescriptions: ['8" Concrete Block'] })
    const result = await tool.execute(
      {
        items: [
          { description: '3/4" CDX Plywood 4x8', quantity: 8 },
          { description: '8" Concrete Block', quantity: 40 },
        ],
        project: 'Blue Sky',
      },
      ctx,
    )

    expect(result.ok).toBe(false)
    const data = result.data as { recorded: number; attempted: number; note: string; value_returned: number }
    expect(data.recorded).toBe(1)
    expect(data.attempted).toBe(2)
    expect(data.note).toContain('NOT in the yard')
    // The value reported is the value of what actually landed, never of what
    // was attempted.
    expect(data.value_returned).toBe(499.2)
  })

  it('refuses a quantity that is not a positive number', async () => {
    const { tool, written } = harness()
    for (const quantity of [0, -3, Number.NaN]) {
      const result = await tool.execute(
        { items: [{ description: '3/4" CDX Plywood 4x8', quantity }], project: 'Blue Sky' },
        ctx,
      )
      expect(result.ok).toBe(false)
    }
    expect(written).toHaveLength(0)
  })

  it('refuses an empty load and a nameless line', async () => {
    const { tool, written } = harness()
    expect((await tool.execute({ items: [], project: 'Blue Sky' }, ctx)).ok).toBe(false)
    expect((await tool.execute({ items: [{ description: '  ', quantity: 4 }], project: 'Blue Sky' }, ctx)).ok).toBe(false)
    expect(written).toHaveLength(0)
  })

  it('is high risk, so nothing reaches the ledger without a confirming turn', async () => {
    const { tool } = harness()
    expect(tool.risk).toBe('high')
    expect(tool.roles).toEqual(['owner', 'staff', 'founder'])
  })
})
