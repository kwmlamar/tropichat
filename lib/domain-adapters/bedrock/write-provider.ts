import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { BedrockConnection } from './types'

/**
 * The first and only write boundary from Caye into TropiTrack.
 *
 * This is deliberately a separate class from `SupabaseBedrockReadProvider`,
 * not additional methods on it. The read provider's value is that it
 * *cannot* mutate; adding write methods to it would spend that property
 * permanently. See `briefs/ods-crew-day-write-path.md` for the crew-day
 * write contract and `briefs/ods-receivables-loop.md` for the receivables
 * contract this class also implements.
 *
 * Insert capabilities: `insertTimeEntries`, `insertInvoice`, `insertPayment`,
 * `insertReceipt`, `insertReceiptLineItems`, `insertMaterial`,
 * `insertMaterialPrices`, `insertInstalledItem`, `insertStockMovement`,
 * `uploadReceiptImage`, and `uploadStockPhoto`.
 * Approving a timesheet (`approved_by` / `approved_at`) is a separate
 * authority and is out of scope for this class.
 *
 * `insertStockMovement` writes `stock_movements`, which is append-only by
 * design: TropiTrack's `stock_movements_apply` trigger derives `stock_items`
 * from it. `stock_items` is therefore a CACHE and is never written here --
 * writing it directly would put a quantity on the shelf that no movement
 * accounts for, which is the same unsourced-number failure `materials
 * .unit_cost` had. There is no method on this class that touches it.
 *
 * UPDATE IS PERMITTED IN EXACTLY TWO PLACES, AND NOWHERE ELSE
 *
 * This class used to say "no update, no delete, on any table or storage
 * object" and mean it literally. That is no longer true, and leaving the
 * sentence standing would have been worse than the exception: the next reader
 * should not have to discover it from the code.
 *
 * Two facts about a construction record arrive AFTER the record does, and
 * cannot be expressed as an insert:
 *
 *   - `updateReceiptAttribution` sets `receipts.project_id`. Six live receipts
 *     have no job on them. Until a receipt names a job its spend cannot be
 *     costed and its price cannot be tied to a house, and the row already
 *     exists, so there is nothing to insert.
 *   - `completeInstalledItem` fills NULL identification fields on a
 *     `project_installed_items` row -- the model number that was unreadable in
 *     the first photo and legible in the second.
 *
 * The exception is fenced so it stays one:
 *
 *   - Each has a fixed column allowlist. Attribution's whole allowlist is
 *     `project_id`. Completion's is
 *     `BEDROCK_INSTALLED_ITEM_COMPLETABLE_FIELDS` plus `data_quality`.
 *   - NEITHER may touch a money or status column. No `total_amount`, no
 *     `unit_cost`, no `unit_price`, no `receipts.status`. Correcting what
 *     something cost is a new price observation, never an overwrite.
 *   - Completion may only fill a field that is currently NULL. If a value is
 *     already there and the proposed one differs, that is a disagreement
 *     between two humans about a serial number, and it is escalated as a
 *     conflict rather than written. It completes a record; it does not
 *     revise one.
 *   - Row ownership is verified against the resolved `companyId` before the
 *     write, and a refusal is audited with `status: 'denied'`.
 *
 * Delete remains absolute: nothing in this class removes a row or a storage
 * object.
 *
 * `uploadReceiptImage` is the one capability here that is not a table
 * insert, and it stays inside the same rule: it only ever ADDS an object,
 * never overwrites (`upsert: false`) and never removes one. It exists
 * because `receipts.image_url` is NOT NULL with no default -- a receipt row
 * physically cannot be written without an image already stored somewhere --
 * so storing the photo is not an optional extra, it is a precondition of
 * the insert. See `insertReceipt` for why the placeholder the existing rows
 * use was not an option.
 *
 * `insertPayment` in particular stays insert-only on purpose. TropiTrack
 * runs a live trigger, `after_payment_insert`, calling
 * `update_invoice_on_payment()`, which recalculates the invoice's
 * `amount_paid`, `balance_due` and status the moment a payment row lands.
 * Recording a payment therefore never needs this class to update
 * `invoices` -- the database already keeps that derived state in sync.
 * Do not "helpfully" add an update path here to keep totals in sync; that
 * would race the trigger and duplicate logic that already lives, and is
 * tested, at the database layer.
 */

/**
 * Insertable shape of a `time_entries` row, restricted to the columns this
 * write path is allowed to set. `company_id` is accepted here only because
 * it is a live NOT NULL column on the table -- `insertTimeEntries` always
 * overwrites it with the resolved `companyId` argument and never trusts the
 * value on the row itself.
 */
/**
 * TropiTrack's `documents` bucket, verified live 2026-09-03: the only bucket
 * in that project, public, 10MB cap, and these exact mime types. Its own app
 * already writes receipt images under a `receipts/` prefix.
 *
 * Note `image/gif` is absent even though Caye can read one, and `image/heic`
 * is present even though the model cannot -- the two sets are not the same,
 * and a caller has to satisfy both.
 */
export const BEDROCK_DOCUMENTS_BUCKET = 'documents'
export const BEDROCK_RECEIPT_MAX_BYTES = 10 * 1024 * 1024
export const BEDROCK_RECEIPT_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
  'image/heic',
  'image/heif',
])

export interface BedrockTimeEntryInsert {
  worker_id: string
  project_id: string
  date: string
  start_time: string
  end_time: string
  break_duration_minutes: number
  regular_hours: number
  overtime_hours: number
  notes: string | null
  created_by: string
  company_id: string
}

/**
 * Insertable shape of an `invoices` row, restricted to the columns this
 * write path is allowed to set. `company_id` is accepted here only because
 * it is a live NOT NULL column on the table -- `insertInvoice` always
 * overwrites it with the resolved `companyId` argument and never trusts the
 * value on the row itself.
 */
export interface BedrockInvoiceInsert {
  invoice_number: string
  client_name: string
  invoice_type: string
  status: string
  issue_date: string
  due_date: string
  created_by: string
  client_id: string | null
  project_id: string | null
  estimate_id: string | null
  subtotal: number | null
  tax_rate: number | null
  tax_amount: number | null
  total_amount: number | null
  notes: string | null
  terms: string | null
  sent_at: string | null
  company_id: string
}

/**
 * Insertable shape of a `payments` row, restricted to the columns this
 * write path is allowed to set.
 *
 * There is deliberately no `company_id` here -- the live `payments` table
 * has no tenant column. `insertPayment` verifies tenancy indirectly, by
 * confirming `invoice_id` names an invoice that belongs to the resolved
 * `companyId`, before it writes anything.
 */
export interface BedrockPaymentInsert {
  invoice_id: string
  payment_date: string
  amount: number
  payment_method: string
  received_by: string
  reference_number: string | null
  notes: string | null
}

/**
 * Insertable shape of a `receipts` row, restricted to the columns this write
 * path is allowed to set. Verified against the live table on 2026-09-03.
 *
 * `image_url` is NOT NULL with no default, so it is required here rather
 * than optional -- the schema itself refuses a receipt with no image.
 *
 * `status` is NOT NULL with a CHECK of ('pending','processed','failed') and
 * a default of 'pending'. It is deliberately NOT settable here: a receipt
 * Caye records is 'pending' by definition, because nothing has reconciled
 * it yet, and letting a caller declare it 'processed' would be Caye
 * asserting an outcome it has no evidence for.
 *
 * `project_id`, `vendor`, `receipt_date` and `total_amount` are all nullable
 * on the table, and that is used rather than worked around: a receipt whose
 * job nobody could name is recorded unattributed instead of guessed at, the
 * same restraint `log_invoice_sent` already shows for its own job link.
 *
 * `vendor_id` is set explicitly rather than left to TropiTrack's
 * `receipts_resolve_vendor` BEFORE trigger. That trigger calls
 * `resolve_vendor_id(text)`, which matches a two-directional prefix LIKE with
 * no company filter -- it can return another tenant's vendor, and it can match
 * a one-word fragment to an unrelated supplier. Passing a company-scoped id
 * that Caye resolved itself both fixes the tenancy hole and bypasses the
 * trigger, which only fires when the column is left null. A vendor Caye could
 * not resolve confidently stays null.
 */
export interface BedrockReceiptInsert {
  image_url: string
  project_id: string | null
  submitted_by: string | null
  vendor: string | null
  vendor_id: string | null
  receipt_date: string | null
  total_amount: number | null
  notes: string | null
  company_id: string
}

/**
 * Insertable shape of a `receipt_line_items` row. Verified against the live
 * table on 2026-09-07.
 *
 * There is deliberately no `company_id` here -- the live table has no tenant
 * column. `insertReceiptLineItems` verifies tenancy indirectly, by confirming
 * `receipt_id` names a receipt belonging to the resolved `companyId` before it
 * writes anything, exactly as `insertPayment` does through `invoice_id`.
 *
 * WHY THIS EXISTS
 *
 * `receipt_line_items` had ZERO rows while twelve catalogue prices claimed to
 * come from receipts: the prices survived, the evidence did not. TropiTrack
 * now runs an AFTER INSERT trigger, `receipt_line_to_price`, that turns each
 * line into a `material_prices` observation. So this is the ONLY write Caye
 * makes for a receipt's prices -- see `insertMaterialPrices` for why writing
 * an observation for the same line as well would double-count it.
 *
 * `match_confidence` is not cosmetic: the trigger copies it straight onto the
 * observation's `confidence`, so an optimistic value here becomes an
 * optimistic claim about what a thing costs.
 */
export interface BedrockReceiptLineInsert {
  receipt_id: string
  material_id: string | null
  receipt_name: string
  qty: number | null
  unit: string | null
  unit_cost: number | null
  total_cost: number | null
  match_confidence: 'high' | 'medium' | 'low' | 'none'
}

/**
 * Insertable shape of a `materials` row -- the catalogue. Verified against the
 * live table on 2026-09-07.
 *
 * `id` is text, NOT NULL, with **no default**: the caller must generate it.
 * See `generateMaterialId` in the tools layer for the `R<epoch_ms>_<index>`
 * scheme the existing 236 rows use.
 *
 * `unit_cost` is a NOT NULL cache that TropiTrack maintains from the winning
 * price observation via `refresh_material_unit_cost()`. Caye must never write
 * it as a standing value -- a number in the catalogue with no source, date or
 * vendor is exactly the failure the materials rebuild fixed (a $28 item sat at
 * $52). The column cannot be omitted on INSERT, so the one permitted write is
 * the seed: create the row and record its first `material_prices` observation
 * in the SAME confirmed action, and let the `material_prices_refresh` trigger
 * take ownership of the column from that moment on. Never write it again.
 *
 * `division_name` must be the real CSI name for `division_code` (live data
 * uses the bare name -- 'Concrete', 'Thermal & Moisture'). Never the string
 * 'From Receipt': that is a source flag, and putting it in a taxonomy field is
 * what corrupted CSI grouping before.
 */
export interface BedrockMaterialInsert {
  id: string
  division_code: string
  division_name: string
  category: string
  name: string
  unit: string
  unit_cost: number
  company_id: string
  origin: string | null
  duty_category: string | null
  vendor_id: string | null
  spec: string | null
  uom_note: string | null
  needs_review: boolean
  review_note: string | null
  /**
   * Set explicitly rather than left to the column default (`false`), because
   * this flag now decides catalogue matching: `matchYardLine` breaks a tie
   * between two equally-good candidates toward the core one. A row created
   * from an unidentified yard return must never be core -- it would start
   * winning ties against real catalogue entries on the strength of a flag
   * nobody set deliberately.
   */
  is_core: boolean
}

/**
 * Insertable shape of a `material_prices` row -- one append-only price
 * OBSERVATION. Verified against the live table on 2026-09-07.
 *
 * Never an UPDATE. A corrected price is a new observation; the ranking in
 * `material_current_price` decides which one currently wins.
 *
 * `company_id` is set explicitly even though the live column carries a
 * hard-coded ODS default. Relying on that default would silently scope another
 * tenant's observation to ODS, and the default is being dropped on the
 * TropiTrack side so a missing value fails loudly.
 *
 * `is_landed = true` means the price already includes duty/VAT/freight -- any
 * local Nassau or Eleuthera purchase, and any paid receipt. `false` means
 * FOB/shelf, which is what a Florida quote is.
 */
export interface BedrockMaterialPriceInsert {
  material_id: string
  vendor_id: string | null
  project_id: string | null
  source: 'receipt' | 'purchase_order' | 'quote' | 'project_actual' | 'bigbox' | 'reference' | 'manual' | 'legacy'
  observed_at: string
  unit_price: number
  currency: 'BSD' | 'USD'
  uom: string | null
  quantity: number | null
  origin: string | null
  store_ref: string | null
  document_ref: string | null
  receipt_id: string | null
  is_landed: boolean
  confidence: 'high' | 'medium' | 'low'
  note: string | null
  company_id: string
}

/**
 * Insertable shape of a `project_installed_items` row -- what physically went
 * into one house. Verified against the live table on 2026-09-07.
 *
 * `project_id` and `description` are NOT NULL: an installed item with no house
 * and no description is not a record of anything.
 *
 * `data_quality` is set honestly, never optimistically: 'complete' only with
 * manufacturer + model (+ serial where applicable), 'partial' when the item is
 * identified but plate data is missing. An owner who orders the wrong part off
 * a guessed model number is a worse outcome than a blank field.
 */
export interface BedrockInstalledItemInsert {
  project_id: string
  material_id: string | null
  description: string
  tag: string | null
  location: string | null
  quantity: number | null
  unit: string | null
  manufacturer: string | null
  model_no: string | null
  serial_no: string | null
  finish_color: string | null
  size_spec: string | null
  vendor_id: string | null
  install_date: string | null
  warranty_months: number | null
  spec_sheet_path: string | null
  photo_path: string | null
  data_quality: 'complete' | 'partial' | 'placeholder'
  notes: string | null
  company_id: string
}

/**
 * The ONLY fields `completeInstalledItem` may fill in, and only while they are
 * still NULL.
 *
 * No money column appears here, deliberately: `unit_cost` on an installed item
 * is a financial assertion, and this path exists to finish identifying a piece
 * of equipment, not to restate what it cost. `description` is absent too -- it
 * is NOT NULL, so it is never null to fill.
 */
export const BEDROCK_INSTALLED_ITEM_COMPLETABLE_FIELDS = [
  'material_id',
  'tag',
  'location',
  'quantity',
  'unit',
  'manufacturer',
  'model_no',
  'serial_no',
  'finish_color',
  'size_spec',
  'vendor_id',
  'install_date',
  'warranty_months',
  'spec_sheet_path',
  'photo_path',
  'notes',
] as const

export type BedrockInstalledItemCompletableField = (typeof BEDROCK_INSTALLED_ITEM_COMPLETABLE_FIELDS)[number]

export type BedrockInstalledItemCompletion = Partial<
  Record<BedrockInstalledItemCompletableField, string | number | null>
> & { data_quality?: 'complete' | 'partial' | 'placeholder' }

/** One field a completion tried to change rather than fill. */
export interface BedrockInstalledItemConflict {
  field: BedrockInstalledItemCompletableField
  existing: unknown
  proposed: unknown
}

/**
 * Insertable shape of a `stock_movements` row -- one physical event in the
 * yard, recorded once and never revised.
 *
 * WHY EVERY FIELD IS SPELLED OUT RATHER THAN LEFT TO A DEFAULT
 *
 * `company_id`'s live column default is a hard-coded ODS uuid, due for
 * removal. A row that relied on it would silently become another company's
 * stock the day that default changes. `insertStockMovement` always overwrites
 * this with the resolved `companyId` argument.
 *
 * `location` has no column default on this table, but the
 * `stock_movements_apply` trigger COALESCEs a null to `'Yard'` before it
 * touches `stock_items` -- whose own default is also `'Yard'`. So the string
 * that means "the main yard" is exactly `'Yard'`, and a caller writing
 * `'yard'` or `'Main Yard'` opens a SECOND stock location holding half the
 * material. Callers must normalise; this class stores what it is given.
 *
 * `movement_type` is constrained by a live CHECK to
 * `return_from_job | issue_to_job | count_adjust | disposal`, and `quantity`
 * by `quantity >= 0`.
 */
export interface BedrockStockMovementInsert {
  material_id: string | null
  description: string
  movement_type: 'return_from_job' | 'issue_to_job' | 'count_adjust' | 'disposal'
  quantity: number
  unit: string | null
  unit_cost_landed: number | null
  project_id: string | null
  location: string | null
  occurred_at: string | null
  recorded_by: string | null
  photo_path: string | null
  note: string | null
  company_id: string
}

export type BedrockWriteRow =
  | BedrockTimeEntryInsert
  | BedrockInvoiceInsert
  | BedrockPaymentInsert
  | BedrockReceiptInsert
  | BedrockReceiptLineInsert
  | BedrockMaterialInsert
  | BedrockMaterialPriceInsert
  | BedrockInstalledItemInsert
  | BedrockStockMovementInsert
  | Record<string, unknown>

export interface BedrockWriteRowFailure {
  /** Index into the `rows` array passed to `insertTimeEntries`; always 0 for the single-row insertInvoice/insertPayment/insertReceipt paths. */
  index: number
  row: BedrockWriteRow
  error: string
}

export interface BedrockWriteResult {
  /**
   * True only when the row (or every row, for `insertTimeEntries`) was
   * inserted AND the audit_logs row was written. A partial insert, an
   * insert that succeeded without a corresponding audit row, or a refused
   * cross-tenant write is never reported as `ok: true` -- see "Partial
   * failure is reported precisely" in the design brief.
   */
  ok: boolean
  attemptedCount: number
  insertedCount: number
  insertedIds: string[]
  failedRows: BedrockWriteRowFailure[]
  auditLogWritten: boolean
  auditLogError: string | null
}

type AuditStatus = 'ok' | 'error' | 'denied'

type SupabaseClientFactory = (connection: BedrockConnection) => SupabaseClient

function createRealClient(connection: BedrockConnection): SupabaseClient {
  return createClient(connection.supabaseUrl, connection.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export class BedrockWriteProvider {
  private readonly client: SupabaseClient
  private readonly clientFactory: SupabaseClientFactory

  constructor(connection: BedrockConnection, clientFactory: SupabaseClientFactory = createRealClient) {
    this.clientFactory = clientFactory
    this.client = this.createClient(connection)
  }

  private createClient(connection: BedrockConnection): SupabaseClient {
    return this.clientFactory(connection)
  }

  /**
   * Insert one or more `time_entries` rows for `companyId` and record a
   * single `audit_logs` row describing the attempt.
   *
   * - `companyId` is forced onto every row; whatever the caller put in
   *   `row.company_id` is discarded.
   * - Rows are inserted one at a time so that a failure on one row never
   *   blocks the others, and so the result can name exactly which rows
   *   landed and which did not.
   * - An empty `rows` array is a no-op: nothing is inserted and no audit
   *   row is written for zero attempted writes.
   * - Every non-empty attempt writes exactly one `audit_logs` row,
   *   including when every insert fails. If the audit write itself fails,
   *   that failure is returned on the result rather than swallowed.
   */
  async insertTimeEntries(companyId: string, rows: BedrockTimeEntryInsert[]): Promise<BedrockWriteResult> {
    if (rows.length === 0) {
      return {
        ok: true,
        attemptedCount: 0,
        insertedCount: 0,
        insertedIds: [],
        failedRows: [],
        auditLogWritten: false,
        auditLogError: null,
      }
    }

    const startedAt = Date.now()

    // Explicit field allowlist -- never a spread -- so an `approved_by` or
    // `approved_at` (or any other extra key) smuggled onto the caller's row
    // object cannot reach the insert, and so `company_id` is always the
    // resolved companyId regardless of what the caller supplied.
    const scopedRows: BedrockTimeEntryInsert[] = rows.map(row => ({
      worker_id: row.worker_id,
      project_id: row.project_id,
      date: row.date,
      start_time: row.start_time,
      end_time: row.end_time,
      break_duration_minutes: row.break_duration_minutes,
      regular_hours: row.regular_hours,
      overtime_hours: row.overtime_hours,
      notes: row.notes,
      created_by: row.created_by,
      company_id: companyId,
    }))

    const insertedIds: string[] = []
    const failedRows: BedrockWriteRowFailure[] = []

    for (let index = 0; index < scopedRows.length; index++) {
      const row = scopedRows[index]
      try {
        const { data, error } = await this.client.from('time_entries').insert(row).select('id').single()
        if (error) {
          failedRows.push({ index, row, error: error.message })
        } else {
          insertedIds.push((data as { id: string }).id)
        }
      } catch (err) {
        failedRows.push({ index, row, error: err instanceof Error ? err.message : String(err) })
      }
    }

    const durationMs = Date.now() - startedAt
    const attemptedCount = scopedRows.length
    const insertedCount = insertedIds.length
    const insertOk = failedRows.length === 0
    const errorMessage = insertOk
      ? null
      : `${failedRows.length} of ${attemptedCount} time entry insert(s) failed: ${failedRows
          .map(f => `row ${f.index} (${f.error})`)
          .join('; ')}`

    const auditOutcome = await this.writeAuditLog({
      companyId,
      toolName: 'insertTimeEntries',
      targetTable: 'time_entries',
      status: insertOk ? 'ok' : 'error',
      input: { attemptedCount, rows: scopedRows },
      result: { insertedCount, insertedIds, failedCount: failedRows.length, failedRows },
      targetRowId: insertedIds.length === 1 ? insertedIds[0] : null,
      errorMessage,
      durationMs,
    })

    return {
      ok: insertOk && auditOutcome.written,
      attemptedCount,
      insertedCount,
      insertedIds,
      failedRows,
      auditLogWritten: auditOutcome.written,
      auditLogError: auditOutcome.error,
    }
  }

  /**
   * Insert one `invoices` row for `companyId` and record a single
   * `audit_logs` row describing the attempt.
   *
   * `companyId` is forced onto the row via an explicit field allowlist,
   * never a spread; whatever the caller put in `row.company_id` is
   * discarded.
   */
  async insertInvoice(companyId: string, row: BedrockInvoiceInsert): Promise<BedrockWriteResult> {
    const scopedRow: BedrockInvoiceInsert = {
      invoice_number: row.invoice_number,
      client_name: row.client_name,
      invoice_type: row.invoice_type,
      status: row.status,
      issue_date: row.issue_date,
      due_date: row.due_date,
      created_by: row.created_by,
      client_id: row.client_id,
      project_id: row.project_id,
      estimate_id: row.estimate_id,
      subtotal: row.subtotal,
      tax_rate: row.tax_rate,
      tax_amount: row.tax_amount,
      total_amount: row.total_amount,
      notes: row.notes,
      terms: row.terms,
      sent_at: row.sent_at,
      company_id: companyId,
    }

    return this.insertSingleRowAndAudit({
      companyId,
      table: 'invoices',
      toolName: 'insertInvoice',
      scopedRow,
    })
  }

  /**
   * Insert one `payments` row and record a single `audit_logs` row
   * describing the attempt.
   *
   * `payments` carries no `company_id` column, so before writing anything
   * this verifies -- through the same client this class already holds --
   * that `row.invoice_id` names an invoice belonging to `companyId` (a
   * lookup scoped by `id` AND `company_id` together). An invoice that does
   * not exist, or that belongs to a different company, is refused rather
   * than written: the refusal is itself audited with `status: 'denied'`,
   * because an attempted cross-tenant write is exactly the kind of event
   * that record exists for.
   *
   * See the class-level comment for why this never updates `invoices` to
   * keep totals in sync -- the `after_payment_insert` trigger already does
   * that in the database.
   */
  async insertPayment(companyId: string, row: BedrockPaymentInsert): Promise<BedrockWriteResult> {
    const scopedRow: BedrockPaymentInsert = {
      invoice_id: row.invoice_id,
      payment_date: row.payment_date,
      amount: row.amount,
      payment_method: row.payment_method,
      received_by: row.received_by,
      reference_number: row.reference_number,
      notes: row.notes,
    }

    const startedAt = Date.now()
    const owned = await this.invoiceBelongsToCompany(companyId, scopedRow.invoice_id)

    if (!owned) {
      const durationMs = Date.now() - startedAt
      const errorMessage = `refused: invoice ${scopedRow.invoice_id} was not found for company ${companyId} (nonexistent, or belongs to a different company)`
      const auditOutcome = await this.writeAuditLog({
        companyId,
        toolName: 'insertPayment',
        targetTable: 'payments',
        status: 'denied',
        input: { row: scopedRow },
        result: null,
        targetRowId: null,
        errorMessage,
        durationMs,
      })

      return {
        ok: false,
        attemptedCount: 1,
        insertedCount: 0,
        insertedIds: [],
        failedRows: [{ index: 0, row: scopedRow, error: errorMessage }],
        auditLogWritten: auditOutcome.written,
        auditLogError: auditOutcome.error,
      }
    }

    return this.insertSingleRowAndAudit({
      companyId,
      table: 'payments',
      toolName: 'insertPayment',
      scopedRow,
    })
  }

  /**
   * Store a receipt photo and return the URL that `insertReceipt` needs.
   *
   * WHY THIS EXISTS AT ALL
   *
   * `receipts.image_url` is NOT NULL with no default. A receipt row cannot
   * be written without one, so this is a precondition of the insert rather
   * than a convenience.
   *
   * WHY NOT THE PLACEHOLDER THE EXISTING ROWS USE
   *
   * All six receipts in the live table have `image_url` set to the literal
   * string `'uploaded'`. Writing that for a photo that was never uploaded
   * anywhere would be recording a claim with nothing behind it, which is the
   * one thing this system is built not to do. If the image cannot be stored,
   * the receipt is not written.
   *
   * WHERE IT GOES
   *
   * TropiTrack's own `documents` bucket, under the `receipts/` prefix its
   * app already uses. The bucket is public, which is TropiTrack's existing
   * choice for this bucket and not something this class changes -- callers
   * should know a receipt URL is not a secret. Allowed types there are
   * jpeg/jpg/png/webp/pdf/heic/heif with a 10MB cap; this refuses anything
   * else up front rather than letting storage reject it with a less useful
   * error.
   *
   * `upsert: false`, so this can only ever add an object. A name collision
   * fails loudly instead of overwriting somebody's receipt.
   */
  async uploadReceiptImage(
    companyId: string,
    params: { bytes: Uint8Array; mimeType: string; filename: string }
  ): Promise<{ ok: true; url: string; path: string } | { ok: false; error: string }> {
    return this.uploadDocument(companyId, 'receipts', 'receipt image', params)
  }

  /**
   * The photo of material being put away, stored under a `stock/` prefix.
   *
   * Same bucket, same limits, same never-overwrite rule as
   * `uploadReceiptImage` -- and the same reason to exist rather than reusing
   * it: a yard photo is not a receipt, and filing it under `receipts/` would
   * make a put-away look like a purchase to anyone reading the bucket.
   *
   * The ONE difference that matters is upstream, not here:
   * `stock_movements.photo_path` is NULLABLE. A photo is evidence, not a
   * precondition, so a failed upload must leave the movement recorded without
   * one rather than losing the count -- the opposite of `insertReceipt`,
   * whose `image_url` is NOT NULL. See `record_yard_return`.
   */
  async uploadStockPhoto(
    companyId: string,
    params: { bytes: Uint8Array; mimeType: string; filename: string }
  ): Promise<{ ok: true; url: string; path: string } | { ok: false; error: string }> {
    return this.uploadDocument(companyId, 'stock', 'yard photo', params)
  }

  /**
   * Add one object to TropiTrack's `documents` bucket under `prefix/`.
   *
   * `upsert: false`, so this can only ever ADD. A name collision fails loudly
   * instead of overwriting somebody's file, and `companyId` is in the path so
   * one company's objects can never collide with another's even though the
   * bucket itself is not company-scoped.
   *
   * `prefix` is never caller-supplied -- it comes from this class's own two
   * call sites above.
   */
  private async uploadDocument(
    companyId: string,
    prefix: 'receipts' | 'stock',
    label: string,
    params: { bytes: Uint8Array; mimeType: string; filename: string }
  ): Promise<{ ok: true; url: string; path: string } | { ok: false; error: string }> {
    if (!BEDROCK_RECEIPT_MIME_TYPES.has(params.mimeType)) {
      return {
        ok: false,
        error: `refused: ${params.mimeType} is not an accepted ${label} type (${[...BEDROCK_RECEIPT_MIME_TYPES].join(', ')})`,
      }
    }
    if (params.bytes.byteLength > BEDROCK_RECEIPT_MAX_BYTES) {
      return {
        ok: false,
        error: `refused: ${label} is ${params.bytes.byteLength} bytes, over the ${BEDROCK_RECEIPT_MAX_BYTES}-byte bucket limit`,
      }
    }

    const path = `${prefix}/${companyId}/${params.filename}`
    const { error } = await this.client.storage
      .from(BEDROCK_DOCUMENTS_BUCKET)
      .upload(path, params.bytes, { contentType: params.mimeType, upsert: false })

    if (error) return { ok: false, error: `${label} upload failed: ${error.message}` }

    const { data } = this.client.storage.from(BEDROCK_DOCUMENTS_BUCKET).getPublicUrl(path)
    if (!data?.publicUrl) {
      return { ok: false, error: `${label} uploaded but no public URL could be resolved` }
    }
    return { ok: true, url: data.publicUrl, path }
  }

  /**
   * Insert one `receipts` row and record a single `audit_logs` row
   * describing the attempt.
   *
   * `status` is left to the column default (`'pending'`) rather than set
   * here -- see `BedrockReceiptInsert`. `image_url` must already point at a
   * stored object; get one from `uploadReceiptImage` and do not invent a
   * value for it.
   */
  async insertReceipt(companyId: string, row: BedrockReceiptInsert): Promise<BedrockWriteResult> {
    const scopedRow: BedrockReceiptInsert = {
      image_url: row.image_url,
      project_id: row.project_id,
      submitted_by: row.submitted_by,
      vendor: row.vendor,
      vendor_id: row.vendor_id,
      receipt_date: row.receipt_date,
      total_amount: row.total_amount,
      notes: row.notes,
      company_id: companyId,
    }

    return this.insertSingleRowAndAudit({
      companyId,
      table: 'receipts',
      toolName: 'insertReceipt',
      scopedRow,
    })
  }

  /**
   * Insert the lines read off one receipt, and record a single `audit_logs`
   * row describing the attempt.
   *
   * `receipt_line_items` has no `company_id` column, so tenancy is verified
   * through the parent: `receiptId` must name a receipt belonging to
   * `companyId` before anything is written. A refusal is audited with
   * `status: 'denied'`, like `insertPayment`'s cross-tenant refusal.
   *
   * WHAT THIS DELIBERATELY DOES NOT DO
   *
   * It does not also write `material_prices`. TropiTrack's
   * `receipt_line_to_price` trigger produces the observation from the line
   * itself; a second write here would record the same purchase twice and
   * corrupt the very averages the split-out price table exists to make
   * trustworthy.
   *
   * The trigger is also SILENT about lines it skips -- it produces nothing
   * when `material_id` is null, when `unit_cost` is null or <= 0, or when
   * `material_id` names no catalogue row. `pricedLineCount` on the result
   * counts the lines that will actually have produced an observation, so a
   * caller can tell an operator "8 lines recorded, 5 priced" instead of
   * implying the whole receipt reached the price history.
   */
  async insertReceiptLineItems(
    companyId: string,
    receiptId: string,
    rows: BedrockReceiptLineInsert[]
  ): Promise<BedrockWriteResult & { pricedLineCount: number }> {
    if (rows.length === 0) {
      return {
        ok: true,
        attemptedCount: 0,
        insertedCount: 0,
        insertedIds: [],
        failedRows: [],
        auditLogWritten: false,
        auditLogError: null,
        pricedLineCount: 0,
      }
    }

    const startedAt = Date.now()

    const owned = await this.rowBelongsToCompany('receipts', companyId, receiptId)
    if (!owned) {
      const errorMessage = `refused: receipt ${receiptId} was not found for company ${companyId} (nonexistent, or belongs to a different company)`
      const auditOutcome = await this.writeAuditLog({
        companyId,
        toolName: 'insertReceiptLineItems',
        targetTable: 'receipt_line_items',
        status: 'denied',
        input: { receiptId, attemptedCount: rows.length },
        result: null,
        targetRowId: null,
        errorMessage,
        durationMs: Date.now() - startedAt,
      })
      return {
        ok: false,
        attemptedCount: rows.length,
        insertedCount: 0,
        insertedIds: [],
        failedRows: rows.map((row, index) => ({ index, row, error: errorMessage })),
        auditLogWritten: auditOutcome.written,
        auditLogError: auditOutcome.error,
        pricedLineCount: 0,
      }
    }

    // Explicit field allowlist -- never a spread -- and `receipt_id` is always
    // the verified parent, regardless of what the caller put on the row.
    const scopedRows: BedrockReceiptLineInsert[] = rows.map(row => ({
      receipt_id: receiptId,
      material_id: row.material_id,
      receipt_name: row.receipt_name,
      qty: row.qty,
      unit: row.unit,
      unit_cost: row.unit_cost,
      total_cost: row.total_cost,
      match_confidence: row.match_confidence,
    }))

    const insertedIds: string[] = []
    const failedRows: BedrockWriteRowFailure[] = []
    let pricedLineCount = 0

    for (let index = 0; index < scopedRows.length; index++) {
      const row = scopedRows[index]
      try {
        const { data, error } = await this.client.from('receipt_line_items').insert(row).select('id').single()
        if (error) {
          failedRows.push({ index, row, error: error.message })
        } else {
          insertedIds.push((data as { id: string }).id)
          // Mirrors trg_receipt_line_to_price's own guard. It ALSO requires the
          // material to exist, which the FK on material_id already enforces --
          // a line naming a missing material fails the insert above rather
          // than landing here uncounted.
          if (row.material_id && row.unit_cost != null && row.unit_cost > 0) pricedLineCount++
        }
      } catch (err) {
        failedRows.push({ index, row, error: err instanceof Error ? err.message : String(err) })
      }
    }

    const durationMs = Date.now() - startedAt
    const insertOk = failedRows.length === 0
    const errorMessage = insertOk
      ? null
      : `${failedRows.length} of ${scopedRows.length} receipt line insert(s) failed: ${failedRows
          .map(f => `row ${f.index} (${f.error})`)
          .join('; ')}`

    const auditOutcome = await this.writeAuditLog({
      companyId,
      toolName: 'insertReceiptLineItems',
      targetTable: 'receipt_line_items',
      status: insertOk ? 'ok' : 'error',
      input: { receiptId, attemptedCount: scopedRows.length, rows: scopedRows },
      result: { insertedCount: insertedIds.length, insertedIds, pricedLineCount, failedCount: failedRows.length, failedRows },
      targetRowId: null,
      errorMessage,
      durationMs,
    })

    return {
      ok: insertOk && auditOutcome.written,
      attemptedCount: scopedRows.length,
      insertedCount: insertedIds.length,
      insertedIds,
      failedRows,
      auditLogWritten: auditOutcome.written,
      auditLogError: auditOutcome.error,
      pricedLineCount,
    }
  }

  /**
   * Insert one `materials` row (a catalogue entry) and record a single
   * `audit_logs` row describing the attempt.
   *
   * `unit_cost` reaches the table exactly once, here, as a seed -- see
   * `BedrockMaterialInsert`. The caller is expected to record the matching
   * `material_prices` observation in the same confirmed action so the
   * `material_prices_refresh` trigger immediately takes the column over.
   */
  async insertMaterial(companyId: string, row: BedrockMaterialInsert): Promise<BedrockWriteResult> {
    const scopedRow: BedrockMaterialInsert = {
      id: row.id,
      division_code: row.division_code,
      division_name: row.division_name,
      category: row.category,
      name: row.name,
      unit: row.unit,
      unit_cost: row.unit_cost,
      origin: row.origin,
      duty_category: row.duty_category,
      vendor_id: row.vendor_id,
      spec: row.spec,
      uom_note: row.uom_note,
      needs_review: row.needs_review,
      review_note: row.review_note,
      is_core: row.is_core,
      company_id: companyId,
    }

    return this.insertSingleRowAndAudit({
      companyId,
      table: 'materials',
      toolName: 'insertMaterial',
      scopedRow,
    })
  }

  /**
   * Insert one or more `material_prices` observations and record a single
   * `audit_logs` row describing the attempt.
   *
   * NEVER call this for a receipt line that was inserted through
   * `insertReceiptLineItems` with a `material_id` on it: TropiTrack's
   * `receipt_line_to_price` trigger already produced that observation, and a
   * second one double-counts the same purchase.
   *
   * It IS correct to call this with `source: 'receipt'` for a line the trigger
   * skipped -- one whose material did not exist yet at insert time and has
   * since been created. That observation has no duplicate because the trigger
   * produced none.
   *
   * `company_id` is forced onto every row rather than left to the live
   * column default, which is a hard-coded ODS UUID.
   */
  async insertMaterialPrices(companyId: string, rows: BedrockMaterialPriceInsert[]): Promise<BedrockWriteResult> {
    if (rows.length === 0) {
      return {
        ok: true,
        attemptedCount: 0,
        insertedCount: 0,
        insertedIds: [],
        failedRows: [],
        auditLogWritten: false,
        auditLogError: null,
      }
    }

    const startedAt = Date.now()

    const scopedRows: BedrockMaterialPriceInsert[] = rows.map(row => ({
      material_id: row.material_id,
      vendor_id: row.vendor_id,
      project_id: row.project_id,
      source: row.source,
      observed_at: row.observed_at,
      unit_price: row.unit_price,
      currency: row.currency,
      uom: row.uom,
      quantity: row.quantity,
      origin: row.origin,
      store_ref: row.store_ref,
      document_ref: row.document_ref,
      receipt_id: row.receipt_id,
      is_landed: row.is_landed,
      confidence: row.confidence,
      note: row.note,
      company_id: companyId,
    }))

    const insertedIds: string[] = []
    const failedRows: BedrockWriteRowFailure[] = []

    for (let index = 0; index < scopedRows.length; index++) {
      const row = scopedRows[index]
      try {
        const { data, error } = await this.client.from('material_prices').insert(row).select('id').single()
        if (error) failedRows.push({ index, row, error: error.message })
        else insertedIds.push((data as { id: string }).id)
      } catch (err) {
        failedRows.push({ index, row, error: err instanceof Error ? err.message : String(err) })
      }
    }

    const durationMs = Date.now() - startedAt
    const insertOk = failedRows.length === 0
    const errorMessage = insertOk
      ? null
      : `${failedRows.length} of ${scopedRows.length} price observation insert(s) failed: ${failedRows
          .map(f => `row ${f.index} (${f.error})`)
          .join('; ')}`

    const auditOutcome = await this.writeAuditLog({
      companyId,
      toolName: 'insertMaterialPrices',
      targetTable: 'material_prices',
      status: insertOk ? 'ok' : 'error',
      input: { attemptedCount: scopedRows.length, rows: scopedRows },
      result: { insertedCount: insertedIds.length, insertedIds, failedCount: failedRows.length, failedRows },
      targetRowId: insertedIds.length === 1 ? insertedIds[0] : null,
      errorMessage,
      durationMs,
    })

    return {
      ok: insertOk && auditOutcome.written,
      attemptedCount: scopedRows.length,
      insertedCount: insertedIds.length,
      insertedIds,
      failedRows,
      auditLogWritten: auditOutcome.written,
      auditLogError: auditOutcome.error,
    }
  }

  /**
   * Insert one `project_installed_items` row and record a single `audit_logs`
   * row describing the attempt.
   *
   * `project_id` is NOT NULL and is verified to belong to `companyId` first --
   * an installed item is a claim about one specific house, so pointing it at
   * another company's project is refused and audited, never written.
   */
  async insertInstalledItem(companyId: string, row: BedrockInstalledItemInsert): Promise<BedrockWriteResult> {
    const startedAt = Date.now()
    const owned = await this.rowBelongsToCompany('projects', companyId, row.project_id)
    if (!owned) {
      return this.denied({
        companyId,
        toolName: 'insertInstalledItem',
        targetTable: 'project_installed_items',
        row,
        errorMessage: `refused: project ${row.project_id} was not found for company ${companyId} (nonexistent, or belongs to a different company)`,
        input: { row },
        startedAt,
      })
    }

    const scopedRow: BedrockInstalledItemInsert = {
      project_id: row.project_id,
      material_id: row.material_id,
      description: row.description,
      tag: row.tag,
      location: row.location,
      quantity: row.quantity,
      unit: row.unit,
      manufacturer: row.manufacturer,
      model_no: row.model_no,
      serial_no: row.serial_no,
      finish_color: row.finish_color,
      size_spec: row.size_spec,
      vendor_id: row.vendor_id,
      install_date: row.install_date,
      warranty_months: row.warranty_months,
      spec_sheet_path: row.spec_sheet_path,
      photo_path: row.photo_path,
      data_quality: row.data_quality,
      notes: row.notes,
      company_id: companyId,
    }

    return this.insertSingleRowAndAudit({
      companyId,
      table: 'project_installed_items',
      toolName: 'insertInstalledItem',
      scopedRow,
    })
  }

  /**
   * Insert one `stock_movements` row and record a single `audit_logs` row
   * describing the attempt.
   *
   * WHAT THE DATABASE DOES NEXT, AND WHY THE CALLER HAS TO KNOW
   *
   * TropiTrack's `stock_movements_apply` trigger turns this row into the
   * `stock_items` balance -- but its FIRST statement is
   * `IF NEW.material_id IS NULL THEN RETURN NEW`. A movement with no
   * catalogue match is therefore recorded in full and changes NO balance:
   * real history, invisible on the shelf. That is the honest outcome (a
   * quantity of something unidentified cannot be added to a quantity of
   * something identified), but it is silent, so `materialApplied` is
   * returned here rather than left for a caller to infer.
   *
   * `project_id` is the PROVENANCE of returned material -- which house it
   * came off -- so it is ownership-checked against `companyId` before the
   * write, exactly like `insertInstalledItem`. Unlike that method it is
   * nullable on the table; a null project is written without a check because
   * there is nothing to check.
   *
   * The material is deliberately NOT ownership-checked by a second query.
   * `materials.id` is text and company-scoped, and every caller resolves it
   * through the company-scoped catalogue read before arriving here; a
   * cross-tenant id would have had to come from somewhere this class does not
   * hand out. The FK plus the company scoping on the read is the boundary.
   */
  async insertStockMovement(companyId: string, row: BedrockStockMovementInsert): Promise<BedrockWriteResult & { materialApplied: boolean }> {
    const startedAt = Date.now()

    if (row.project_id != null) {
      const owned = await this.rowBelongsToCompany('projects', companyId, row.project_id)
      if (!owned) {
        const denied = await this.denied({
          companyId,
          toolName: 'insertStockMovement',
          targetTable: 'stock_movements',
          row,
          errorMessage: `refused: project ${row.project_id} was not found for company ${companyId} (nonexistent, or belongs to a different company)`,
          input: { row },
          startedAt,
        })
        return { ...denied, materialApplied: false }
      }
    }

    const scopedRow: BedrockStockMovementInsert = {
      material_id: row.material_id,
      description: row.description,
      movement_type: row.movement_type,
      quantity: row.quantity,
      unit: row.unit,
      unit_cost_landed: row.unit_cost_landed,
      project_id: row.project_id,
      location: row.location,
      occurred_at: row.occurred_at,
      recorded_by: row.recorded_by,
      photo_path: row.photo_path,
      note: row.note,
      company_id: companyId,
    }

    const result = await this.insertSingleRowAndAudit({
      companyId,
      table: 'stock_movements',
      toolName: 'insertStockMovement',
      scopedRow,
    })

    return { ...result, materialApplied: result.ok && scopedRow.material_id != null }
  }

  /**
   * Attach an existing receipt to a job. See the class comment for why this
   * class updates at all, and what fences the exception.
   *
   * The entire column allowlist is `project_id`. Nothing else on the row is
   * read, written, or considered -- not the total, not the vendor, not the
   * status. Both sides of the link are ownership-checked against `companyId`
   * before the write: the receipt, and the project it is being attached to.
   *
   * A receipt already attached to a DIFFERENT job is refused rather than
   * silently re-pointed. Moving spend from one house to another is a
   * correction with consequences for both, and it is not this path's job to
   * make it quietly.
   */
  async updateReceiptAttribution(
    companyId: string,
    receiptId: string,
    projectId: string
  ): Promise<BedrockWriteResult & { previousProjectId: string | null }> {
    const startedAt = Date.now()

    const { data: receipt, error: readError } = await this.client
      .from('receipts')
      .select('id, project_id')
      .eq('id', receiptId)
      .eq('company_id', companyId)
      .maybeSingle()

    if (readError || !receipt) {
      const result = await this.denied({
        companyId,
        toolName: 'updateReceiptAttribution',
        targetTable: 'receipts',
        row: { receipt_id: receiptId, project_id: projectId },
        errorMessage: `refused: receipt ${receiptId} was not found for company ${companyId} (nonexistent, or belongs to a different company)`,
        input: { receiptId, projectId },
        startedAt,
        targetRowId: null,
      })
      return { ...result, previousProjectId: null }
    }

    const previousProjectId = (receipt as { project_id: string | null }).project_id
    if (previousProjectId && previousProjectId !== projectId) {
      const result = await this.denied({
        companyId,
        toolName: 'updateReceiptAttribution',
        targetTable: 'receipts',
        row: { receipt_id: receiptId, project_id: projectId },
        errorMessage: `refused: receipt ${receiptId} is already attached to project ${previousProjectId}; re-pointing spend from one job to another is not done on this path`,
        input: { receiptId, projectId, previousProjectId },
        startedAt,
        targetRowId: receiptId,
      })
      return { ...result, previousProjectId }
    }

    const projectOwned = await this.rowBelongsToCompany('projects', companyId, projectId)
    if (!projectOwned) {
      const result = await this.denied({
        companyId,
        toolName: 'updateReceiptAttribution',
        targetTable: 'receipts',
        row: { receipt_id: receiptId, project_id: projectId },
        errorMessage: `refused: project ${projectId} was not found for company ${companyId} (nonexistent, or belongs to a different company)`,
        input: { receiptId, projectId },
        startedAt,
        targetRowId: receiptId,
      })
      return { ...result, previousProjectId }
    }

    let failure: BedrockWriteRowFailure | null = null
    try {
      const { error } = await this.client
        .from('receipts')
        .update({ project_id: projectId })
        .eq('id', receiptId)
        .eq('company_id', companyId)
      if (error) failure = { index: 0, row: { receipt_id: receiptId, project_id: projectId }, error: error.message }
    } catch (err) {
      failure = {
        index: 0,
        row: { receipt_id: receiptId, project_id: projectId },
        error: err instanceof Error ? err.message : String(err),
      }
    }

    const updateOk = failure === null
    const auditOutcome = await this.writeAuditLog({
      companyId,
      toolName: 'updateReceiptAttribution',
      targetTable: 'receipts',
      status: updateOk ? 'ok' : 'error',
      input: { receiptId, projectId, previousProjectId },
      result: updateOk ? { receiptId, projectId } : { failure },
      targetRowId: receiptId,
      errorMessage: updateOk ? null : failure!.error,
      durationMs: Date.now() - startedAt,
    })

    return {
      ok: updateOk && auditOutcome.written,
      attemptedCount: 1,
      insertedCount: updateOk ? 1 : 0,
      insertedIds: updateOk ? [receiptId] : [],
      failedRows: failure ? [failure] : [],
      auditLogWritten: auditOutcome.written,
      auditLogError: auditOutcome.error,
      previousProjectId,
    }
  }

  /**
   * Fill in identification fields that are still NULL on one
   * `project_installed_items` row. See the class comment for why this class
   * updates at all.
   *
   * Only `BEDROCK_INSTALLED_ITEM_COMPLETABLE_FIELDS` and `data_quality` are
   * considered; anything else in `completion` is ignored rather than written.
   * No money column is in that list.
   *
   * FILL, NEVER REVISE
   *
   * A field that already holds a value is not overwritten. If the proposed
   * value differs from the stored one, the whole update is refused and the
   * differing fields are returned as `conflicts` -- two people disagreeing
   * about a serial number is something an operator has to see, not something
   * a later photo silently wins. Identical values are not conflicts; they are
   * simply nothing to do.
   */
  async completeInstalledItem(
    companyId: string,
    itemId: string,
    completion: BedrockInstalledItemCompletion
  ): Promise<BedrockWriteResult & { conflicts: BedrockInstalledItemConflict[]; filledFields: string[] }> {
    const startedAt = Date.now()

    const { data: existing, error: readError } = await this.client
      .from('project_installed_items')
      .select('*')
      .eq('id', itemId)
      .eq('company_id', companyId)
      .maybeSingle()

    if (readError || !existing) {
      const result = await this.denied({
        companyId,
        toolName: 'completeInstalledItem',
        targetTable: 'project_installed_items',
        row: { id: itemId, ...completion } as Record<string, unknown>,
        errorMessage: `refused: installed item ${itemId} was not found for company ${companyId} (nonexistent, or belongs to a different company)`,
        input: { itemId, completion },
        startedAt,
        targetRowId: null,
      })
      return { ...result, conflicts: [], filledFields: [] }
    }

    const current = existing as Record<string, unknown>
    const conflicts: BedrockInstalledItemConflict[] = []
    const patch: Record<string, unknown> = {}
    const filledFields: string[] = []

    for (const field of BEDROCK_INSTALLED_ITEM_COMPLETABLE_FIELDS) {
      const proposed = completion[field]
      if (proposed === undefined || proposed === null || proposed === '') continue
      const stored = current[field]
      if (stored === null || stored === undefined) {
        patch[field] = proposed
        filledFields.push(field)
      } else if (String(stored) !== String(proposed)) {
        conflicts.push({ field, existing: stored, proposed })
      }
    }

    if (conflicts.length > 0) {
      const result = await this.denied({
        companyId,
        toolName: 'completeInstalledItem',
        targetTable: 'project_installed_items',
        row: { id: itemId, ...completion } as Record<string, unknown>,
        errorMessage: `refused: ${conflicts
          .map(c => `${c.field} is already "${String(c.existing)}", not "${String(c.proposed)}"`)
          .join('; ')} — this path completes a record, it does not revise one`,
        input: { itemId, completion, conflicts },
        startedAt,
        targetRowId: itemId,
      })
      return { ...result, conflicts, filledFields: [] }
    }

    if (completion.data_quality) patch.data_quality = completion.data_quality

    if (Object.keys(patch).length === 0) {
      // Nothing to do is not a failure, and it writes no audit row -- there
      // was no attempt to record. Mirrors the empty-rows no-op above.
      return {
        ok: true,
        attemptedCount: 0,
        insertedCount: 0,
        insertedIds: [],
        failedRows: [],
        auditLogWritten: false,
        auditLogError: null,
        conflicts: [],
        filledFields: [],
      }
    }

    let failure: BedrockWriteRowFailure | null = null
    try {
      const { error } = await this.client
        .from('project_installed_items')
        .update(patch)
        .eq('id', itemId)
        .eq('company_id', companyId)
      if (error) failure = { index: 0, row: patch, error: error.message }
    } catch (err) {
      failure = { index: 0, row: patch, error: err instanceof Error ? err.message : String(err) }
    }

    const updateOk = failure === null
    const auditOutcome = await this.writeAuditLog({
      companyId,
      toolName: 'completeInstalledItem',
      targetTable: 'project_installed_items',
      status: updateOk ? 'ok' : 'error',
      input: { itemId, completion, patch },
      result: updateOk ? { itemId, filledFields } : { failure },
      targetRowId: itemId,
      errorMessage: updateOk ? null : failure!.error,
      durationMs: Date.now() - startedAt,
    })

    return {
      ok: updateOk && auditOutcome.written,
      attemptedCount: 1,
      insertedCount: updateOk ? 1 : 0,
      insertedIds: updateOk ? [itemId] : [],
      failedRows: failure ? [failure] : [],
      auditLogWritten: auditOutcome.written,
      auditLogError: auditOutcome.error,
      conflicts: [],
      filledFields,
    }
  }

  /**
   * One refused write, audited with `status: 'denied'` and reported as a
   * failure. Shared by every ownership and precondition refusal so an
   * attempted cross-tenant write is always recorded the same way.
   */
  private async denied(params: {
    companyId: string
    toolName: string
    targetTable: string
    row: BedrockWriteRow
    errorMessage: string
    input: unknown
    startedAt: number
    targetRowId?: string | null
  }): Promise<BedrockWriteResult> {
    const auditOutcome = await this.writeAuditLog({
      companyId: params.companyId,
      toolName: params.toolName,
      targetTable: params.targetTable,
      status: 'denied',
      input: params.input,
      result: null,
      targetRowId: params.targetRowId ?? null,
      errorMessage: params.errorMessage,
      durationMs: Date.now() - params.startedAt,
    })

    return {
      ok: false,
      attemptedCount: 1,
      insertedCount: 0,
      insertedIds: [],
      failedRows: [{ index: 0, row: params.row, error: params.errorMessage }],
      auditLogWritten: auditOutcome.written,
      auditLogError: auditOutcome.error,
    }
  }

  /**
   * True only when a row exists in `table` matching both `id` and
   * `company_id`. Any failure to confirm that -- not found, wrong company, or
   * a query error -- fails closed and returns false, so a child-table write is
   * never made on an ambiguous ownership check.
   *
   * Only ever called with a table name from this class's own call sites; the
   * parameter is never caller-supplied.
   */
  private async rowBelongsToCompany(
    table: 'receipts' | 'projects',
    companyId: string,
    id: string
  ): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from(table)
        .select('id')
        .eq('id', id)
        .eq('company_id', companyId)
        .maybeSingle()
      if (error) return false
      return data != null
    } catch {
      return false
    }
  }

  /**
   * True only when an `invoices` row exists matching both `id` and
   * `company_id`. Any failure to confirm that -- not found, wrong company,
   * or a query error -- fails closed and returns false, so a payment is
   * never written on an ambiguous ownership check.
   */
  private async invoiceBelongsToCompany(companyId: string, invoiceId: string): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('invoices')
        .select('id')
        .eq('id', invoiceId)
        .eq('company_id', companyId)
        .maybeSingle()
      if (error) return false
      return data != null
    } catch {
      return false
    }
  }

  private async insertSingleRowAndAudit(params: {
    companyId: string
    table: 'invoices' | 'payments' | 'receipts' | 'materials' | 'project_installed_items' | 'stock_movements'
    toolName: 'insertInvoice' | 'insertPayment' | 'insertReceipt' | 'insertMaterial' | 'insertInstalledItem' | 'insertStockMovement'
    scopedRow:
      | BedrockInvoiceInsert
      | BedrockPaymentInsert
      | BedrockReceiptInsert
      | BedrockMaterialInsert
      | BedrockInstalledItemInsert
      | BedrockStockMovementInsert
  }): Promise<BedrockWriteResult> {
    const { companyId, table, toolName, scopedRow } = params
    const startedAt = Date.now()

    let insertedId: string | null = null
    let failure: BedrockWriteRowFailure | null = null

    try {
      // Cast at the client boundary only: `scopedRow` is a union of two
      // distinct insertable shapes, and supabase-js's per-overload excess-
      // property check does not accept a union argument. The row itself is
      // still built above via an explicit field allowlist, so this cast
      // widens nothing that reaches the database.
      const { data, error } = await this.client
        .from(table)
        .insert(scopedRow as unknown as Record<string, unknown>)
        .select('id')
        .single()
      if (error) {
        failure = { index: 0, row: scopedRow, error: error.message }
      } else {
        insertedId = (data as { id: string }).id
      }
    } catch (err) {
      failure = { index: 0, row: scopedRow, error: err instanceof Error ? err.message : String(err) }
    }

    const durationMs = Date.now() - startedAt
    const insertOk = failure === null

    const auditOutcome = await this.writeAuditLog({
      companyId,
      toolName,
      targetTable: table,
      status: insertOk ? 'ok' : 'error',
      input: { row: scopedRow },
      result: insertOk ? { insertedId } : { failure },
      targetRowId: insertedId,
      errorMessage: insertOk ? null : failure!.error,
      durationMs,
    })

    return {
      ok: insertOk && auditOutcome.written,
      attemptedCount: 1,
      insertedCount: insertOk ? 1 : 0,
      insertedIds: insertedId ? [insertedId] : [],
      failedRows: failure ? [failure] : [],
      auditLogWritten: auditOutcome.written,
      auditLogError: auditOutcome.error,
    }
  }

  private async writeAuditLog(params: {
    companyId: string
    toolName: string
    targetTable: string
    status: AuditStatus
    input: unknown
    result: unknown
    targetRowId: string | null
    errorMessage: string | null
    durationMs: number
  }): Promise<{ written: boolean; error: string | null }> {
    try {
      const { error } = await this.client.from('audit_logs').insert({
        company_id: params.companyId,
        tool_name: params.toolName,
        source: 'api',
        scope: 'write',
        tier: 'confirm',
        status: params.status,
        target_table: params.targetTable,
        target_row_id: params.targetRowId,
        input: params.input,
        result: params.result,
        error_message: params.errorMessage,
        duration_ms: params.durationMs,
      })
      if (error) return { written: false, error: error.message }
      return { written: true, error: null }
    } catch (err) {
      return { written: false, error: err instanceof Error ? err.message : String(err) }
    }
  }
}
