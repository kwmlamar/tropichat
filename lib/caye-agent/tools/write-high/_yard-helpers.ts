/**
 * Pure helpers for yard put-away capture — where "the yard" is, which
 * catalogue item a spoken line means, and what the operator is shown before
 * they say yes.
 *
 * Pure on purpose, for the same reason `_materials-helpers.ts` is: every
 * decision here ends up in a sentence a person reads with dusty hands at the
 * end of a work day and either agrees with or does not. It has to be testable
 * without a ledger, and it has to produce the SAME text in the staged
 * confirmation and in the result after the write, or the two drift apart and
 * the confirmation stops meaning anything.
 */

import { divisionNameFor, matchMaterialLine, type CatalogueEntry, type LineMatch } from './_materials-helpers'

/**
 * The string that means "the main yard", exactly.
 *
 * Not a display label — a key. `stock_items` has a unique constraint on
 * `(company_id, material_id, location)` and its column default is `'Yard'`,
 * and `stock_movements_apply` COALESCEs a null movement location to `'Yard'`
 * before touching it. So `'yard'`, `'Yard '` and `'Main Yard'` are three
 * SEPARATE shelves as far as the database is concerned, and material put away
 * under two spellings is material nobody can find. Everything funnels through
 * {@link normaliseYardLocation}.
 */
export const MAIN_YARD = 'Yard'

/**
 * Spellings of the main yard that must not open a second stock location.
 * Anything else is taken at face value — ODS may genuinely have material
 * sitting at a second site, and refusing to record that would be worse than
 * recording it.
 */
const MAIN_YARD_ALIASES = new Set([
  'yard',
  'the yard',
  'main yard',
  'the main yard',
  'shop',
  'the shop',
  'shop yard',
  'store',
  'storage',
  'warehouse',
])

/**
 * Resolve whatever somebody said into a stock location.
 *
 * Defaults to the main yard rather than asking. "Which yard?" is one of the
 * two questions this feature cannot afford, and ODS has one yard — a second
 * location is the exception, and an exception is what someone volunteers.
 */
export function normaliseYardLocation(input: string | null | undefined): string {
  const raw = input?.trim()
  if (!raw) return MAIN_YARD
  if (MAIN_YARD_ALIASES.has(raw.toLowerCase().replace(/\s+/g, ' '))) return MAIN_YARD
  return raw
}

/**
 * A catalogue entry, plus the one extra fact a yard match needs.
 */
export interface YardCatalogueEntry extends CatalogueEntry {
  isCore: boolean
}

/**
 * Match what somebody said came off a truck to a catalogue material.
 *
 * Starts from {@link matchMaterialLine}, which is deliberately mean and
 * resolves ambiguity to nothing rather than to a coin flip. That is right for
 * a receipt line, and it is right here too — except in one specific case that
 * a yard put-away hits constantly and a receipt does not.
 *
 * A receipt line is printed: `3/4" CDX PLYWOOD 4X8`. A yard line is spoken:
 * "8 sheets of ply". The spoken form routinely ties across several catalogue
 * rows that differ only in a dimension nobody said out loud, and every one of
 * those ties currently resolves to "no match" — which means no price, no
 * shelf balance, and a feature that quietly records nothing useful.
 *
 * So: when and only when the full catalogue tied, and exactly ONE of the tied
 * candidates is `is_core`, that one wins at MEDIUM confidence. This is not a
 * bias toward core items — a core item never beats a better non-core match,
 * because the tie-break only runs on an outcome that was already going to be
 * nothing. It is the observation that of two things ODS has in its catalogue,
 * the one it restocks is overwhelmingly the one coming back off a site, and
 * the other is a one-off somebody ordered once.
 *
 * It never returns HIGH. A tie broken by a heuristic is not the same claim as
 * two strings being identical, and the confidence travels downstream.
 */
export function matchYardLine(catalogue: YardCatalogueEntry[], spokenName: string): LineMatch {
  const direct = matchMaterialLine(catalogue, spokenName)
  if (direct.confidence !== 'none' || direct.ambiguousWith.length < 2) return direct

  const tied = new Set(direct.ambiguousWith.map(name => name.trim().toLowerCase()))
  const core = catalogue.filter(entry => entry.isCore && tied.has(entry.name.trim().toLowerCase()))
  if (core.length !== 1) return direct

  return {
    materialId: core[0].id,
    confidence: 'medium',
    reason: `${direct.ambiguousWith.length} catalogue items fit "${spokenName}"; "${core[0].name}" is the one ODS actually restocks`,
    ambiguousWith: direct.ambiguousWith,
  }
}

/**
 * Whether a match is good enough to attach a landed cost to.
 *
 * 'low' is excluded deliberately. It means "one row shares most of its words",
 * which for a spoken line is as likely to be 1/2" plywood as 3/4" — and a
 * wrong match does not merely mislabel the row, it stamps a wrong
 * `unit_cost_landed` onto the shelf and values the yard incorrectly from then
 * on. An unmatched movement is recorded in full with its description intact
 * and costs nothing to correct later; a wrongly-valued one is a number nobody
 * knows to doubt.
 */
export function isConfidentYardMatch(match: LineMatch): boolean {
  return match.confidence === 'high' || match.confidence === 'medium'
}

/**
 * Where a yard-created catalogue row lands when nobody has classified it yet.
 *
 * `materials.division_code`, `division_name` and `category` are all NOT NULL,
 * so an unidentified return has to go SOMEWHERE. `99` is deliberately OUTSIDE
 * CSI MasterFormat: it is not a division, it is the absence of one, and the UI
 * renders an unknown code as "Division 99". There is no CHECK constraint on
 * the column, so nothing blocks it.
 *
 * WHY NOT 01. Division 01 is General Requirements and has real scope --
 * supervision, temporary facilities, bonds. Parking unidentified material
 * there would silently inflate a division that ODS actually estimates and
 * reports against, corrupting every roll-up that reads it. A code with no
 * scope cannot corrupt a total, because nothing legitimately belongs to it.
 * This is the same failure as `division_name = 'From Receipt'` -- a source
 * flag sitting in a taxonomy field -- one step subtler, because 01 looks
 * plausible.
 *
 * Deliberately NOT added to `CSI_DIVISIONS`. That map is the set of divisions
 * `create_material` will accept from a model reading a document, and every one
 * of ODS's 236 live catalogue rows is in it. Widening it would let a
 * document-derived material be filed as unclassified, which is a different and
 * worse thing than a yard return that genuinely has not been identified.
 */
export const UNCLASSIFIED_DIVISION = { code: '99', name: 'Unclassified — needs review' } as const

/** Grouping for a thing nobody has classified yet. */
export const UNCLASSIFIED_CATEGORY = 'Unclassified'

/** `materials.unit` is NOT NULL and a count of things is the safest default. */
export const UNKNOWN_UNIT = 'EA'

/**
 * The `materials` row to create for a return nothing in the catalogue matched.
 *
 * WHY THIS EXISTS AT ALL
 *
 * `stock_items` is keyed on `(company_id, material_id, location)`, so a null
 * material cannot form a shelf, and `stock_movements_apply` returns early
 * rather than trying. That made the COMMON yard case -- a crew member
 * describing something not in the catalogue -- the one case that recorded
 * history and moved no balance, so the yard view would have understated what
 * is actually standing in it. Creating the catalogue row first means the
 * movement always carries a material and the balance is always right.
 *
 * WHY IT COSTS ZERO
 *
 * `materials.unit_cost` is NOT NULL and now means landed BSD (TropiTrack PR
 * #34, `unit_cost_basis`), and it feeds estimates. A yard return carries no
 * purchase price -- nobody knows what the leftover plywood cost, and asking
 * breaks the fifteen seconds this feature has. So the cost is 0 and
 * `needs_review` is true. A zero that is flagged is a known gap; a guess is a
 * wrong number in an estimate that nobody knows to doubt.
 *
 * The consequence is real and deliberate: these items enter the yard at zero
 * value, so recovery is under-stated until somebody attaches a cost.
 */
export interface YardMaterialDraft {
  name: string
  divisionCode: string
  divisionName: string
  category: string
  unit: string
  origin: 'UNKNOWN'
  reviewNote: string
}

export function draftYardMaterial(input: {
  description: string
  unit?: string | null
  divisionCode?: string | null
  category?: string | null
}): YardMaterialDraft {
  const divisionName = input.divisionCode ? divisionNameFor(input.divisionCode) : null
  return {
    name: input.description.trim().replace(/\s+/g, ' '),
    divisionCode: divisionName ? input.divisionCode!.trim() : UNCLASSIFIED_DIVISION.code,
    divisionName: divisionName ?? UNCLASSIFIED_DIVISION.name,
    category: input.category?.trim() || UNCLASSIFIED_CATEGORY,
    unit: input.unit?.trim() || UNKNOWN_UNIT,
    // A yard return was bought at some point by somebody, on some island, and
    // the record of that is exactly what is missing. UNKNOWN is a value the
    // live CHECK constraint accepts and is the truth.
    origin: 'UNKNOWN',
    reviewNote:
      'Created from an unidentified yard return. No cost basis: unit_cost is 0 because a put-away carries ' +
      'no purchase price. Needs a real division, category and landed cost before it is used in an estimate.',
  }
}

/** One line of a put-away, after matching and pricing. */
export interface YardReturnItemView {
  description: string
  quantity: number
  unit: string | null
  /** An EXISTING catalogue row this matched. Null when a new one will be made. */
  materialId: string | null
  materialName: string | null
  matchReason: string
  /**
   * The catalogue row that will be created for this line, when nothing
   * matched. Mutually exclusive with `materialId`: exactly one of the two is
   * always set, which is what guarantees the movement always carries a
   * material and therefore always moves the shelf.
   */
  newMaterial: YardMaterialDraft | null
  landedUnitCost: number | null
  priceIsStale: boolean
  priceObservedAt: string | null
}

/** Everything the operator is asked to agree to, in one object. */
export interface YardReturnView {
  items: YardReturnItemView[]
  projectName: string | null
  projectNote: string | null
  location: string
}

function money(value: number): string {
  return `$${value.toFixed(2)}`
}

/** The value of one line, or null when the material carries no price. */
export function lineValue(item: YardReturnItemView): number | null {
  if (item.landedUnitCost == null) return null
  return Math.round(item.landedUnitCost * item.quantity * 100) / 100
}

/** The total of the lines that have a value at all. Never treats a missing price as zero. */
export function totalValue(items: YardReturnItemView[]): number {
  return Math.round(items.reduce((sum, item) => sum + (lineValue(item) ?? 0), 0) * 100) / 100
}

/**
 * The staged confirmation, written as a receipt rather than a form.
 *
 * The shape is deliberate. A man holding a phone in a yard will read the first
 * line and the last line and nothing in between, so the first line says what
 * is being put away and where it came from, and the last line says what it is
 * worth. The per-item detail sits between them for the case where he does
 * look.
 *
 * Every line that will NOT reach the shelf says so on its own line. TropiTrack's
 * `stock_movements_apply` trigger returns early on a null `material_id`, so an
 * unmatched line is recorded as real history and changes no balance — silently.
 * Reporting eight sheets put away when the yard total will not move by one is
 * the same false-completion this whole system exists not to do.
 */
export function renderYardReturnReceipt(view: YardReturnView): string {
  const from = view.projectName ? `off ${view.projectName}` : 'off a job nobody has named yet'
  const head = `Put away ${view.items.length === 1 ? '' : `${view.items.length} things `}${from}, into ${
    view.location === MAIN_YARD ? 'the yard' : view.location
  }:`

  const lines = view.items.map(item => {
    const qty = `${item.quantity}${item.unit ? ` ${item.unit}` : ''}`
    const what = item.materialName ?? item.description
    const value = lineValue(item)
    const priced =
      value == null
        ? item.newMaterial
          ? "no catalog match — I'll add it as a new item for review, at no value"
          : 'no price on file, so no value recorded'
        : `${money(item.landedUnitCost!)} each — ${money(value)}${item.priceIsStale ? ' (price is stale)' : ''}`
    return `  • ${qty} ${what} — ${priced}`
  })

  const total = totalValue(view.items)
  const valued = view.items.filter(item => lineValue(item) != null).length
  const tail =
    valued === 0
      ? 'Nothing here carries a price, so no value goes back on the shelf.'
      : valued === view.items.length
        ? `${money(total)} back on the shelf.`
        : `${money(total)} back on the shelf, from the ${valued} of ${view.items.length} that carry a price.`

  // Say what will be ADDED to the catalogue, not merely that something did
  // not match. The operator is agreeing to two things in one yes -- the
  // put-away and a new catalogue row -- and the second one is the part they
  // would not otherwise expect.
  const created = view.items.filter(item => item.newMaterial != null).map(item => item.description)
  const unmatchedNote = created.length
    ? `\n\nNo catalog match for ${created.join(', ')} — ${
        created.length === 1 ? "I'll add it as a new item" : "I'll add them as new items"
      } for review, so the yard count is right. No cost on ${
        created.length === 1 ? 'it' : 'them'
      } yet, and nothing to price now.`
    : ''

  const projectNote = view.projectNote ? `\n\n${view.projectNote}` : ''

  return `${head}\n${lines.join('\n')}\n\n${tail}${unmatchedNote}${projectNote}`
}
