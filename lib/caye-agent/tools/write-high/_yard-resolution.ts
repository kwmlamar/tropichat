import 'server-only'

import type { createBedrockAdapter } from '@/lib/domain-adapters/bedrock'
import { resolveJob } from '../read/find-job'
import {
  draftYardMaterial,
  isConfidentYardMatch,
  matchYardLine,
  normaliseYardLocation,
  type YardCatalogueEntry,
  type YardReturnItemView,
  type YardReturnView,
} from './_yard-helpers'

/**
 * Turn what somebody said into the rows a yard put-away would write.
 *
 * WHY THIS IS A SEPARATE MODULE FROM THE TOOL
 *
 * It is called TWICE per put-away, from two places that must not disagree:
 *
 *   1. `describePendingAction` (high-risk-gate.ts), to build the receipt the
 *      operator reads before saying yes.
 *   2. `record_yard_return.execute`, to build the rows actually inserted after
 *      they do.
 *
 * The gate's whole guarantee is that the text shown IS derived from what will
 * run. Resolving the catalogue and the price in the tool alone would have left
 * the confirmation reading "Run record_yard_return" — a form, not a receipt,
 * and with no value on it at all. Resolving it in the gate alone would have
 * put pricing logic somewhere the write cannot see. So it lives here, once,
 * and both callers get the same answer from the same code.
 *
 * The two calls happen at different times, so in principle the catalogue could
 * change between them. That is a real and accepted window: both reads are pure
 * functions of the same tables, the second one is what gets written, and the
 * result reports what actually landed rather than echoing the summary.
 *
 * NOTHING HERE THROWS. Every read is best-effort, and every failure degrades
 * into a note the operator can see rather than an exception that would either
 * block staging or crash the confirmation. A put-away that records a
 * description and a count with no catalogue match is still worth having; one
 * that fails because the price view was slow is not.
 */

export interface YardReturnItemArgs {
  description: string
  quantity: number
  unit?: string
  division_code?: string
  category?: string
}

export interface YardReturnArgs {
  items?: YardReturnItemArgs[]
  project?: string
  location?: string
  occurred_at?: string
  note?: string
  photo_message_id?: string
}

export interface YardReturnResolution {
  view: YardReturnView
  items: YardReturnItemView[]
  /** Null when the job could not be resolved to exactly one project. */
  projectId: string | null
  /** How the job name failed to resolve, if it did. Already inside `view.projectNote`. */
  projectFailure: 'none' | 'many' | 'unreadable' | null
  jobCandidates: string[]
  location: string
}

export type YardAdapter = ReturnType<typeof createBedrockAdapter>

/**
 * Resolve the job, the catalogue match, and the landed cost for one put-away.
 *
 * The order matters: the catalogue is matched BEFORE prices are fetched, so
 * only the ids that actually matched are ever priced — `material_pricing` is
 * read by id, and the ids come from the company-scoped catalogue read, which
 * is what scopes the price lookup (the view projects no `company_id` of its
 * own).
 */
export async function resolveYardReturn(
  adapter: YardAdapter,
  workspaceId: string,
  args: YardReturnArgs,
): Promise<YardReturnResolution> {
  const location = normaliseYardLocation(args.location)
  const rawItems = (args.items ?? []).filter(item => item?.description?.trim())

  let projectId: string | null = null
  let projectName: string | null = null
  let projectNote: string | null = null
  let projectFailure: YardReturnResolution['projectFailure'] = null
  let jobCandidates: string[] = []

  if (args.project?.trim()) {
    try {
      const job = await resolveJob(adapter, workspaceId, args.project)
      if (job.match === 'one') {
        projectId = job.candidates[0].id
        projectName = job.candidates[0].name
      } else if (job.match === 'none') {
        projectFailure = 'none'
        projectNote = `No job matched "${args.project}", and material coming back has to say which house it came off. Which job was it?`
      } else {
        projectFailure = 'many'
        jobCandidates = job.candidates.map(candidate => candidate.name)
        projectNote = `"${args.project}" matches ${job.count} jobs — ${jobCandidates.join(', ')}. Which one?`
      }
    } catch {
      projectFailure = 'unreadable'
      projectNote = 'The job list could not be read, so the job this came off could not be confirmed.'
    }
  } else {
    projectFailure = 'none'
    projectNote = 'Nobody has said which job this came off, and that is the one thing a put-away has to carry.'
  }

  // Match against the whole active catalogue. A yard line is spoken rather
  // than printed, so the core tie-break in matchYardLine does real work here
  // that it would not do for a receipt.
  let catalogue: YardCatalogueEntry[] = []
  let catalogueNote: string | null = null
  try {
    catalogue = (await adapter.listMaterials(workspaceId, { limit: 1000 })).map(material => ({
      id: material.id,
      name: material.name,
      unit: material.unit,
      isCore: material.isCore,
    }))
  } catch {
    catalogueNote =
      'The materials catalogue could not be read, so nothing was matched to it and no value could be worked out.'
  }

  // Every line ends up carrying a material one way or another: an existing
  // catalogue row when the match is confident, or a draft of a new one when it
  // is not. That is what makes the shelf balance always correct --
  // `stock_items` is keyed on `(company_id, material_id, location)`, so a null
  // material cannot form a shelf and `stock_movements_apply` returns early on
  // one. Leaving the common case (a crew member naming something not in the
  // catalogue) unmatched would have under-stated the yard permanently.
  const matched = rawItems.map(item => {
    const description = item.description.trim()
    const match = matchYardLine(catalogue, description)
    const confident = isConfidentYardMatch(match)
    const catalogueEntry = confident && match.materialId
      ? catalogue.find(entry => entry.id === match.materialId) ?? null
      : null
    return {
      description,
      quantity: item.quantity,
      unit: item.unit?.trim() || catalogueEntry?.unit || null,
      materialId: catalogueEntry?.id ?? null,
      materialName: catalogueEntry?.name ?? null,
      matchReason: catalogueNote ?? match.reason,
      newMaterial: catalogueEntry
        ? null
        : draftYardMaterial({
            description,
            unit: item.unit,
            divisionCode: item.division_code,
            category: item.category,
          }),
    }
  })

  const priceable = [...new Set(matched.map(item => item.materialId).filter((id): id is string => Boolean(id)))]
  const prices = new Map<string, { landedUnitCost: number | null; isStale: boolean; observedAt: string | null }>()
  if (priceable.length > 0) {
    try {
      for (const price of await adapter.getMaterialLandedCosts(workspaceId, priceable)) {
        prices.set(price.materialId, {
          landedUnitCost: price.landedUnitCost,
          isStale: price.isStale,
          observedAt: price.observedAt,
        })
      }
    } catch {
      // A missing price is already a state this renders honestly ("no price on
      // file"), so a failed price read degrades into exactly that rather than
      // losing the count.
    }
  }

  const items: YardReturnItemView[] = matched.map(item => {
    const price = item.materialId ? prices.get(item.materialId) : undefined
    return {
      ...item,
      // A newly-drafted material always has a unit (the column is NOT NULL),
      // so the line reads "12 EA them grey blocks" rather than "12 them grey
      // blocks" -- and the unit written to the movement matches the one
      // written to the catalogue row.
      unit: item.unit ?? item.newMaterial?.unit ?? null,
      landedUnitCost: price?.landedUnitCost ?? null,
      priceIsStale: price?.isStale ?? false,
      priceObservedAt: price?.observedAt ?? null,
    }
  })

  return {
    view: { items, projectName, projectNote, location },
    items,
    projectId,
    projectFailure,
    jobCandidates,
    location,
  }
}
