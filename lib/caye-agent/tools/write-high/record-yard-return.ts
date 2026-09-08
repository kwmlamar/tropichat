import 'server-only'

import {
  createBedrockAdapter,
  createBedrockWriteProvider,
  BedrockConnectionMissingError,
} from '@/lib/domain-adapters/bedrock'
import { createServiceClient } from '@/lib/supabase-server'
import { downloadWhatsAppMedia } from '@/lib/whatsapp/media'
import type { Tool } from '../types'
import { generateMaterialId } from './_materials-helpers'
import { lineValue, renderYardReturnReceipt, totalValue } from './_yard-helpers'
import { resolveYardReturn } from './_yard-resolution'

/**
 * Record material coming off a job and being put away in the yard.
 *
 * WHY THIS IS THE ONLY WAY THE YARD EVER GETS COUNTED
 *
 * ODS orders deliberate overage on nearly every job — extra block, extra
 * rebar, extra ply, bought out of that job's budget as insurance against
 * running short mid-pour, which on Eleuthera is a two-to-four-week problem.
 * The leftovers come back to the yard and, until now, were recorded nowhere:
 * re-bought on the next job, or lost.
 *
 * That total cannot be derived. Takeoff minus receipts is not consumption —
 * nobody at ODS tracks consumption to that resolution, and inferring a yard
 * balance from two numbers that were never meant to be subtracted would
 * produce a confident wrong answer. The ONLY reliable signal is the physical
 * event: somebody carried something off a truck and put it down. So this tool
 * captures that event and nothing else.
 *
 * WHY IT ASKS FOR AT MOST TWO THINGS
 *
 * This lives or dies on taking fifteen seconds. Jay, or a crew member, dusty
 * hands, end of a work day. If it takes longer it does not happen, and a yard
 * ledger nobody feeds is worth less than no yard ledger at all, because it
 * looks like data.
 *
 * So exactly two things may be asked for, and only when they genuinely cannot
 * be read from what arrived:
 *
 *   1. what and how much — usually already in the photo or the message
 *   2. which job it came off — the provenance, and the one field with no
 *      defensible default
 *
 * Everything else is inferred and never asked:
 *
 *   - `unit_cost_landed` is READ from `material_pricing.landed_unit_cost` for
 *     the matched catalogue item. That number is `landed_cost()` applied to
 *     the winning price observation, so it already carries duty and freight.
 *     Asking a man in a yard what a sheet of plywood cost would get an answer,
 *     and it would be a guess overwriting a computed figure.
 *   - `location` defaults to the main yard (see `normaliseYardLocation` for
 *     why the exact string matters).
 *   - `occurred_at` defaults to now.
 *   - `recorded_by` is whoever sent the message.
 *   - `photo_path` is the image, if there was one.
 *
 * WHY A WRONG MATCH IS WORSE THAN NO MATCH — AND WHY "NO MATCH" STILL COUNTS
 *
 * Setting `material_id` to an EXISTING catalogue row attaches that material's
 * landed cost to the movement, and the trigger stamps it onto the shelf. A
 * confident-but-wrong match therefore does not merely mislabel a row, it
 * misvalues the yard, and does it in a way nobody knows to doubt. So only high-
 * and medium-confidence matches reuse an existing row.
 *
 * Anything weaker creates a NEW catalogue row first, and the movement points at
 * that. This is the common case, not the exception: a crew member describing
 * something not in the catalogue is normal. Leaving `material_id` null was the
 * first design and it was backwards — `stock_items` is keyed on
 * `(company_id, material_id, location)`, so a null cannot form a shelf and
 * `stock_movements_apply` returns early on one. The yard would have silently
 * under-stated exactly the material it exists to keep track of.
 *
 * The created row costs ZERO and carries `needs_review`. `materials.unit_cost`
 * means landed BSD and feeds estimates; a put-away carries no purchase price,
 * and asking for one breaks the fifteen seconds. A flagged zero is a known gap,
 * a guess is a wrong number in an estimate. `stock_movements.unit_cost_landed`
 * is left null for the same reason. The consequence is deliberate and stated in
 * the PR: these items enter the yard at zero value, so `stock_recovery_ledger`
 * under-states recovery until somebody attaches a cost.
 *
 * The id is `Y`-prefixed, not `R`. Live queries select document-derived
 * materials with `LIKE 'R%'`; a yard row in that set would assert a purchase
 * price that does not exist. See `generateMaterialId`.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 *
 * Only `return_from_job`. Issues to jobs, count adjustments and disposals are
 * desk actions done in TropiTrack's own UI by someone looking at a screen, not
 * things a person reports from a truck. And Caye does not follow a put-away
 * with advice — no reorder points, no "use yard stock for this instead". She
 * captures what happened. What to buy next is the owner's call.
 */

/** How recently an image must have arrived to be taken as this put-away's photo. */
const PHOTO_LOOKBACK_MS = 15 * 60 * 1000

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

export interface RecordYardReturnInput {
  /**
   * `division_code` and `category` are the model's best guess, used ONLY if
   * the line has to be added to the catalogue. Neither is ever asked of a
   * person -- that would break the fifteen seconds, and they would not know.
   * Omitted, they fall back to unclassified with `needs_review`.
   */
  items?: Array<{ description: string; quantity: number; unit?: string; division_code?: string; category?: string }>
  project?: string
  location?: string
  occurred_at?: string
  note?: string
  photo_message_id?: string
}

interface ResolvedPhoto {
  mediaId: string
  mimeType: string
  arrivedAt: string
}

/**
 * The photo this put-away is about, or null.
 *
 * Unlike `log_receipt`'s equivalent, a missing photo is NOT an error.
 * `receipts.image_url` is NOT NULL, so a receipt without its image cannot
 * exist; `stock_movements.photo_path` is nullable, so a put-away without one
 * is a complete record. Refusing to record eight sheets of plywood because
 * nobody took a picture would trade the whole point of the feature for
 * evidence that is nice to have.
 *
 * The window is short (fifteen minutes) and the resolved arrival time is
 * shown in the confirmation, because the failure mode here is attaching an
 * unrelated earlier photo — a receipt someone sent half an hour ago — to a
 * yard movement it has nothing to do with.
 */
async function resolveYardPhoto(args: {
  workspaceId: string
  operatorId: number | null
  waMessageId?: string
  now: Date
}): Promise<ResolvedPhoto | null> {
  const supabase = createServiceClient()
  let query = supabase
    .from('caye_operator_messages')
    .select('wa_message_id, inbound_media, created_at')
    .eq('workspace_id', args.workspaceId)
    .eq('direction', 'inbound')
    .not('inbound_media', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)

  if (args.waMessageId) {
    query = query.eq('wa_message_id', args.waMessageId)
  } else {
    query = query.gte('created_at', new Date(args.now.getTime() - PHOTO_LOOKBACK_MS).toISOString())
    if (args.operatorId != null) query = query.eq('operator_allowlist_id', args.operatorId)
  }

  const { data, error } = await query.maybeSingle()
  if (error || !data) return null

  const media = data.inbound_media as { media_id?: unknown; mime_type?: unknown } | null
  const mediaId = typeof media?.media_id === 'string' ? media.media_id : null
  const mimeType = typeof media?.mime_type === 'string' ? media.mime_type : null
  if (!mediaId || !mimeType || !(mimeType in EXTENSION_BY_MIME)) return null

  return { mediaId, mimeType, arrivedAt: data.created_at as string }
}

export interface RecordYardReturnDeps {
  getWriteProvider: typeof createBedrockWriteProvider
  getAdapter: typeof createBedrockAdapter
  downloadMedia: typeof downloadWhatsAppMedia
  findPhoto: typeof resolveYardPhoto
  resolveReturn: typeof resolveYardReturn
  now: () => Date
}

export function makeRecordYardReturn(deps: Partial<RecordYardReturnDeps> = {}): Tool<RecordYardReturnInput> {
  const getWriteProvider = deps.getWriteProvider ?? createBedrockWriteProvider
  const getAdapter = deps.getAdapter ?? createBedrockAdapter
  const downloadMedia = deps.downloadMedia ?? downloadWhatsAppMedia
  const findPhoto = deps.findPhoto ?? resolveYardPhoto
  const resolveReturn = deps.resolveReturn ?? resolveYardReturn
  const now = deps.now ?? (() => new Date())

  return {
    name: 'record_yard_return',
    description:
      'Record leftover material coming off a job and going back into the yard, so it can be used again ' +
      'instead of re-bought. Use this the moment somebody says something came back — from a photo, a ' +
      'voice note, or a line of text. Read what and how much straight off the photo or the message. Ask ' +
      'for AT MOST two things and only if you genuinely cannot tell: what came back and how much, and ' +
      'which job it came off. Never ask what it cost, where to put it, or when it happened — those are ' +
      'looked up or assumed. Copy the description as it was said; do not tidy it into what you think it ' +
      'means — if it is not in the catalogue it will be added as a new item for review, which is normal. ' +
      'This writes to the construction ledger, so it is staged for explicit confirmation first and one ' +
      '"yes" records the lot.',
    risk: 'high',
    roles: ['owner', 'staff', 'founder'],
    modes: ['back-office'],
    inputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          description:
            'Everything coming off the truck, one entry each. Put several things in one call — a load ' +
            'coming back is one event and should be one confirmation, not five.',
          items: {
            type: 'object',
            properties: {
              description: {
                type: 'string',
                description: 'What it is, as it was said or as it reads on the photo, e.g. "3/4 ply", "1/2 rebar".',
              },
              quantity: { type: 'number', description: 'How many came back. Ask if nobody said.' },
              unit: {
                type: 'string',
                description: 'What is being counted: sheet, bag, ea, lf. Omit if not said — the catalogue supplies it.',
              },
              division_code: {
                type: 'string',
                description:
                  'Your best guess at the CSI division, used ONLY if this has to be added to the catalogue: ' +
                  '03 Concrete, 04 Masonry, 05 Metals, 06 Wood & Plastics, 07 Thermal & Moisture, ' +
                  '08 Openings, 09 Finishes, 22 Plumbing, 23 HVAC, 26 Electrical, 31 Earthwork, ' +
                  '32 Exterior Improvements. Never ask anybody for this — omit it if the description does ' +
                  'not make it obvious, and it will be filed under division 99 (unclassified) for review ' +
                  'rather than guessed into a real one.',
              },
              category: {
                type: 'string',
                description:
                  'Your best guess at a short grouping ("Block", "Rebar", "Fittings"), used only if this ' +
                  'has to be added to the catalogue. Never ask for it; omit if unsure.',
              },
            },
            required: ['description', 'quantity'],
          },
        },
        project: {
          type: 'string',
          description: 'The job it came off, however it was named. Required — this is the provenance of the material.',
        },
        location: {
          type: 'string',
          description: 'Only when it is going somewhere OTHER than the main yard. Omit otherwise.',
        },
        occurred_at: {
          type: 'string',
          description: 'Only when it came back on an earlier day, YYYY-MM-DD. Omit for today.',
        },
        note: { type: 'string', description: 'Anything worth recording, e.g. "half a pallet, some water damage".' },
        photo_message_id: {
          type: 'string',
          description: 'Only when a specific earlier photo is meant. A recent photo is picked up on its own.',
        },
      },
      required: ['items', 'project'],
    },

    async execute(args, ctx) {
      const items = args.items ?? []
      if (items.length === 0) {
        return { ok: false, error: 'Nothing to put away. What came back, and how many?' }
      }
      for (const item of items) {
        if (!item?.description?.trim()) {
          return { ok: false, error: 'Every line needs to say what it is. Leave it out rather than inventing a name.' }
        }
        if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
          return { ok: false, error: `How many ${item.description?.trim() || 'of it'} came back? It has to be a positive number.` }
        }
      }
      if (args.occurred_at !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(args.occurred_at)) {
        return { ok: false, error: 'occurred_at must be YYYY-MM-DD.' }
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
      const resolved = await resolveReturn(adapter, ctx.workspaceId, args)

      // Provenance is not optional. Material with no job on it cannot be
      // credited back to the budget that bought it, and attaching it to the
      // WRONG job moves money between two houses. So an unresolved job refuses
      // rather than writing — and hands back the candidates so the next
      // message settles it in one step instead of starting over.
      if (!resolved.projectId) {
        return {
          ok: false,
          error: resolved.view.projectNote ?? 'Which job did this come off?',
          data: {
            job_candidates: resolved.jobCandidates,
            nothing_recorded: true,
          },
        }
      }

      // Evidence, not a precondition: unlike a receipt, a put-away with no
      // photo is a complete record. A failed fetch or upload degrades to a
      // null photo_path with a note rather than losing the count.
      let photoPath: string | null = null
      let photoNote: string | null = null
      let photoArrivedAt: string | null = null
      const photo = await findPhoto({
        workspaceId: ctx.workspaceId,
        operatorId: ctx.operatorId ?? null,
        waMessageId: args.photo_message_id,
        now: now(),
      })
      if (photo) {
        photoArrivedAt = photo.arrivedAt
        try {
          const media = await downloadMedia(photo.mediaId)
          const upload = await write.provider.uploadStockPhoto(write.companyId, {
            bytes: Buffer.from(media.base64, 'base64'),
            mimeType: photo.mimeType,
            filename: `${photo.mediaId}.${EXTENSION_BY_MIME[photo.mimeType] ?? 'jpg'}`,
          })
          if (upload.ok) photoPath = upload.path
          else photoNote = `The photo could not be stored, so this is recorded without it. ${upload.error}`
        } catch (error) {
          photoNote = `The photo could not be retrieved, so this is recorded without it. ${
            error instanceof Error ? error.message : ''
          }`.trim()
        }
      } else if (args.photo_message_id) {
        photoNote = 'That message has no usable photo on it, so this is recorded without one.'
      }

      const occurredAt = args.occurred_at ? new Date(`${args.occurred_at}T12:00:00Z`).toISOString() : now().toISOString()
      const recordedBy = write.identityFor(ctx.operatorId).profileId

      // One row per thing, all under the single confirmation the operator
      // already gave. `stock_movements` is append-only and each row is one
      // physical item put down, so a load of three things is three movements,
      // not one aggregated row that could never be corrected line by line.
      const written: Array<{ description: string; movementId: string | null; applied: boolean }> = []
      const created: Array<{ materialId: string; name: string; division: string }> = []
      const failures: string[] = []
      let auditWritten = true
      let index = 0

      for (const item of resolved.items) {
        // The catalogue row goes in FIRST, so the movement always carries a
        // material and therefore always moves the shelf. If it fails, the
        // movement is still written with a null material -- the count is worth
        // more than the shelf entry, and the shortfall is reported rather than
        // presented as a clean put-away.
        let materialId = item.materialId
        if (!materialId && item.newMaterial) {
          const draft = item.newMaterial
          const generatedId = generateMaterialId(now(), index, 'Y')
          const material = await write.provider.insertMaterial(write.companyId, {
            id: generatedId,
            division_code: draft.divisionCode,
            division_name: draft.divisionName,
            category: draft.category,
            name: draft.name,
            unit: draft.unit,
            // NOT a price. `materials.unit_cost` is NOT NULL and means landed
            // BSD; a put-away carries no purchase price, so this is zero and
            // `needs_review` says why. Never a guess -- it would flow straight
            // into an estimate.
            unit_cost: 0,
            company_id: write.companyId,
            origin: draft.origin,
            // No duty category: there is no cost to apply a duty rule to, and
            // inventing one would claim a landed-cost basis this row has not
            // got. `needs_review` is what gets it filled in.
            duty_category: null,
            vendor_id: null,
            spec: null,
            uom_note: null,
            needs_review: true,
            review_note: draft.reviewNote,
            is_core: false,
          })
          if (material.ok) {
            materialId = generatedId
            created.push({ materialId: generatedId, name: draft.name, division: `${draft.divisionCode} ${draft.divisionName}` })
          } else {
            failures.push(
              `${item.description}: could not be added to the catalogue (${material.failedRows.map(f => f.error).join('; ') || 'unknown error'}), so it is recorded without one and will not show in yard stock`,
            )
            if (!material.auditLogWritten) auditWritten = false
          }
        }
        index += 1

        const result = await write.provider.insertStockMovement(write.companyId, {
          material_id: materialId,
          description: item.description,
          movement_type: 'return_from_job',
          quantity: item.quantity,
          unit: item.unit,
          unit_cost_landed: item.landedUnitCost,
          project_id: resolved.projectId,
          location: resolved.location,
          occurred_at: occurredAt,
          recorded_by: recordedBy,
          photo_path: photoPath,
          note: args.note?.trim() || null,
          company_id: write.companyId,
        })
        if (!result.auditLogWritten) auditWritten = false
        if (result.ok) {
          written.push({
            description: item.description,
            movementId: result.insertedIds[0] ?? null,
            applied: result.materialApplied,
          })
        } else {
          failures.push(`${item.description}: ${result.failedRows.map(f => f.error).join('; ') || 'not recorded'}`)
        }
      }

      const recordedItems = resolved.items.filter(item =>
        written.some(row => row.description === item.description)
      )
      const shelved = written.filter(row => row.applied).length
      const value = totalValue(recordedItems)
      const allOk = failures.length === 0 && written.length === resolved.items.length && auditWritten

      return {
        ok: allOk,
        data: {
          recorded: written.length,
          attempted: resolved.items.length,
          movement_ids: written.map(row => row.movementId).filter(Boolean),
          job: resolved.view.projectName,
          location: resolved.location,
          occurred_at: occurredAt,
          value_returned: value,
          items: recordedItems.map(item => ({
            description: item.description,
            matched_to: item.materialName,
            added_to_catalogue: item.newMaterial ? item.newMaterial.name : null,
            quantity: item.quantity,
            unit: item.unit,
            landed_unit_cost: item.landedUnitCost,
            value: lineValue(item),
            price_is_stale: item.priceIsStale,
            match_reason: item.matchReason,
          })),
          // The catalogue rows this put-away created, at zero cost and flagged
          // for review. Reported explicitly because the operator agreed to two
          // things in one yes and only one of them was a put-away.
          catalogue_items_created: created,
          on_the_shelf: shelved,
          not_on_the_shelf: written.length - shelved,
          photo_attached: Boolean(photoPath),
          photo_taken_from_message_at: photoArrivedAt,
          photo_note: photoNote,
          audit_recorded: auditWritten,
          failed: failures,
          receipt: renderYardReturnReceipt({ ...resolved.view, items: recordedItems }),
          note: allOk
            ? [
                `Put away against ${resolved.view.projectName}.`,
                created.length
                  ? `${created.length} new catalogue ${created.length === 1 ? 'item was' : 'items were'} added for review (${created
                      .map(row => row.name)
                      .join(', ')}), at no cost — the yard count is right, but its VALUE is under-stated until somebody prices ${
                      created.length === 1 ? 'it' : 'them'
                    }.`
                  : null,
                shelved === written.length
                  ? null
                  : `${written.length - shelved} of these are recorded but not counted in yard stock, because a catalogue row could not be created for them.`,
                photoNote,
              ]
                .filter(Boolean)
                .join(' ')
            : written.length === 0
              ? 'Nothing was recorded. Do not tell anybody this is in the yard.'
              : `Only ${written.length} of ${resolved.items.length} were recorded. The rest are NOT in the yard: ${failures.join('; ')}`,
        },
      }
    },
  }
}

export const recordYardReturn: Tool<RecordYardReturnInput> = makeRecordYardReturn()
