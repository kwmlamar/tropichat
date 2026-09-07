/**
 * Shared, pure helpers for the materials write path — catalogue identity,
 * line-to-material matching, company-scoped vendor resolution, and the
 * honesty rules the staged summaries depend on.
 *
 * Pure on purpose. Everything here is a decision an operator will be shown
 * and asked to confirm ("this line matched THAT catalogue item, medium
 * confidence"), so it has to be testable without a ledger, a model, or a
 * network. The tools own the I/O; this file owns the judgement.
 */

/**
 * CSI division code -> the real division name, exactly as the 236 live
 * catalogue rows spell it: the bare name, with no number appended.
 *
 * This table exists to make ONE string impossible: `division_name` was
 * previously being filled with 'From Receipt'. That is a source flag, not a
 * taxonomy, and putting it in a taxonomy field is what collapsed CSI grouping
 * — every receipt-derived material landed in a division that does not exist,
 * so no division total was true. A caller supplies the code; the name is
 * looked up here and can never be free text.
 */
export const CSI_DIVISIONS: Record<string, string> = {
  '03': 'Concrete',
  '04': 'Masonry',
  '05': 'Metals',
  '06': 'Wood & Plastics',
  '07': 'Thermal & Moisture',
  '08': 'Openings',
  '09': 'Finishes',
  '22': 'Plumbing',
  '23': 'HVAC',
  '26': 'Electrical',
  '31': 'Earthwork',
  '32': 'Exterior Improvements',
}

/** Where a thing came from, which is what decides whether duty applies. */
export const MATERIAL_ORIGINS = ['FL', 'NASSAU', 'ELEUTHERA', 'MIXED', 'UNKNOWN'] as const
export type MaterialOrigin = (typeof MATERIAL_ORIGINS)[number]

/**
 * Duty categories, which key `landed_cost_rules`. There is no CHECK
 * constraint on the live column, so an invented value would be accepted by
 * the database and then silently match no rule — a material whose landed cost
 * can never be computed. Validated here instead.
 */
export const DUTY_CATEGORIES = [
  'cement', 'concrete_block', 'aggregate', 'steel', 'lumber', 'plywood', 'millwork',
  'roofing_shingle', 'roofing_metal', 'roofing_other', 'building_chemicals',
  'windows_aluminium', 'windows_vinyl', 'doors', 'tile_ceramic', 'stone', 'paint',
  'finishes_other', 'pipe_pvc', 'plumbing_fixtures', 'water_heater', 'hvac_unit',
  'hvac_parts', 'wire_cable', 'breakers', 'electrical_other', 'lighting_fixtures',
  'appliances', 'fasteners', 'tools', 'pool_equipment', 'solar', 'site_improvements',
  'general',
] as const
export type DutyCategory = (typeof DUTY_CATEGORIES)[number]

export type MatchConfidence = 'high' | 'medium' | 'low' | 'none'

export interface CatalogueEntry {
  id: string
  name: string
  unit?: string | null
}

export interface VendorEntry {
  id: string
  name: string
}

/**
 * A catalogue id in the scheme the existing rows use: `R<epoch_ms>_<index>`.
 *
 * `materials.id` is text, NOT NULL, with no default — the caller must
 * generate it or the insert fails. The index disambiguates several materials
 * created from one document in the same millisecond.
 */
export function generateMaterialId(now: Date, index: number): string {
  return `R${now.getTime()}_${index}`
}

/** The real CSI name for a code, or null if the code is not one we know. */
export function divisionNameFor(divisionCode: string): string | null {
  return CSI_DIVISIONS[divisionCode.trim()] ?? null
}

export function isMaterialOrigin(value: string): value is MaterialOrigin {
  return (MATERIAL_ORIGINS as readonly string[]).includes(value)
}

export function isDutyCategory(value: string): value is DutyCategory {
  return (DUTY_CATEGORIES as readonly string[]).includes(value)
}

/**
 * `true` when a price already includes Bahamian duty/VAT/freight.
 *
 * Any local purchase (Nassau, Eleuthera) and any paid receipt is landed by
 * definition — the money has already been spent at a Bahamian till. A Florida
 * quote is FOB and is not. Getting this wrong in either direction corrupts
 * vendor comparison, because it compares a shelf price against a delivered
 * one.
 */
export function isLandedFor(source: 'receipt' | 'quote', origin: MaterialOrigin | null): boolean {
  if (source === 'receipt') return true
  return origin === 'NASSAU' || origin === 'ELEUTHERA'
}

const NAME_STOPWORDS = new Set(['the', 'a', 'an', 'of', 'and', 'for', 'with', 'x', 'in', 'pc', 'pcs', 'ea'])

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function tokens(value: string): string[] {
  return normalise(value)
    .split(' ')
    .filter(t => t.length > 1 && !NAME_STOPWORDS.has(t))
}

export interface LineMatch {
  materialId: string | null
  confidence: MatchConfidence
  /** Operator-readable reason, for the staged summary. */
  reason: string
  /** Populated when several catalogue rows matched equally well. */
  ambiguousWith: string[]
}

/**
 * Match one line of text read off a receipt or quote to a catalogue material.
 *
 * The confidence returned here is not decoration. TropiTrack's
 * `receipt_line_to_price` trigger copies it straight onto the price
 * observation's `confidence`, so calling a guess 'high' puts an unearned
 * claim into what ODS believes things cost. The rules are therefore
 * deliberately mean:
 *
 *   high   — the names are the same once punctuation and case are removed.
 *   medium — one name's significant words are all present in the other, and
 *            exactly one catalogue row does that.
 *   low    — exactly one row shares most of its words, but not all.
 *   none   — nothing matched, or several rows matched equally well.
 *
 * Ambiguity resolves to `none`, never to a coin-flip. An unmatched line is
 * still recorded as evidence (`material_id` null); it simply produces no price
 * observation, and the operator is told so rather than left to assume the
 * price landed.
 */
export function matchMaterialLine(catalogue: CatalogueEntry[], receiptName: string): LineMatch {
  const target = normalise(receiptName)
  if (!target) return { materialId: null, confidence: 'none', reason: 'the line had no readable name', ambiguousWith: [] }

  const exact = catalogue.filter(entry => normalise(entry.name) === target)
  if (exact.length === 1) {
    return { materialId: exact[0].id, confidence: 'high', reason: `exact name match: "${exact[0].name}"`, ambiguousWith: [] }
  }
  if (exact.length > 1) {
    return {
      materialId: null,
      confidence: 'none',
      reason: `${exact.length} catalogue items share that exact name, so none was chosen`,
      ambiguousWith: exact.map(e => e.name),
    }
  }

  const targetTokens = tokens(receiptName)
  if (targetTokens.length === 0) {
    return { materialId: null, confidence: 'none', reason: 'the line name had no significant words', ambiguousWith: [] }
  }

  const scored = catalogue
    .map(entry => {
      const entryTokens = tokens(entry.name)
      if (entryTokens.length === 0) return { entry, overlap: 0, contained: false }
      const shared = entryTokens.filter(t => targetTokens.includes(t)).length
      const contained =
        (shared === entryTokens.length && entryTokens.length > 0) ||
        targetTokens.every(t => entryTokens.includes(t))
      return { entry, overlap: shared / entryTokens.length, contained }
    })
    .filter(candidate => candidate.overlap > 0)

  const containing = scored.filter(c => c.contained)
  if (containing.length === 1) {
    return {
      materialId: containing[0].entry.id,
      confidence: 'medium',
      reason: `matched "${containing[0].entry.name}" on every significant word`,
      ambiguousWith: [],
    }
  }
  if (containing.length > 1) {
    return {
      materialId: null,
      confidence: 'none',
      reason: `${containing.length} catalogue items match that line equally well, so none was chosen`,
      ambiguousWith: containing.map(c => c.entry.name),
    }
  }

  const best = scored.filter(c => c.overlap >= 0.5).sort((a, b) => b.overlap - a.overlap)
  if (best.length === 1 || (best.length > 1 && best[0].overlap > best[1].overlap)) {
    return {
      materialId: best[0].entry.id,
      confidence: 'low',
      reason: `closest catalogue item is "${best[0].entry.name}", on a partial word match`,
      ambiguousWith: [],
    }
  }
  if (best.length > 1) {
    return {
      materialId: null,
      confidence: 'none',
      reason: `several catalogue items are equally close, so none was chosen`,
      ambiguousWith: best.slice(0, 5).map(c => c.entry.name),
    }
  }

  return { materialId: null, confidence: 'none', reason: 'no catalogue item resembles that line', ambiguousWith: [] }
}

export interface VendorResolution {
  vendorId: string | null
  vendorName: string | null
  note: string | null
}

/**
 * Resolve a vendor name printed on a document to a `vendors.id`, from a
 * COMPANY-SCOPED list the caller already fetched.
 *
 * Deliberately not TropiTrack's `resolve_vendor_id(text)`. That function
 * matches a two-directional prefix LIKE with no company filter and orders by
 * name length, so it can return another tenant's vendor and can match a
 * one-word fragment to an unrelated supplier. Resolving here, from a list
 * already scoped to the resolved company, is the right behaviour whether or
 * not the database function is safe — and passing an explicit `vendor_id`
 * also bypasses the `receipts_resolve_vendor` BEFORE trigger, which only
 * fires when the column is left null.
 *
 * Ambiguity resolves to null with a note, never to the shortest name.
 */
export function resolveVendorFromList(vendors: VendorEntry[], printedName: string | null | undefined): VendorResolution {
  const name = printedName?.trim()
  if (!name) return { vendorId: null, vendorName: null, note: null }

  const target = normalise(name)
  const exact = vendors.filter(v => normalise(v.name) === target)
  if (exact.length === 1) return { vendorId: exact[0].id, vendorName: exact[0].name, note: null }
  if (exact.length > 1) {
    return { vendorId: null, vendorName: null, note: `Several vendors are named "${name}", so none was attached.` }
  }

  const prefix = vendors.filter(v => normalise(v.name).startsWith(target) || target.startsWith(normalise(v.name)))
  if (prefix.length === 1) return { vendorId: prefix[0].id, vendorName: prefix[0].name, note: null }
  if (prefix.length > 1) {
    return {
      vendorId: null,
      vendorName: null,
      note: `"${name}" could be ${prefix.map(v => v.name).join(' or ')}, so no vendor was attached. Say which.`,
    }
  }

  return { vendorId: null, vendorName: null, note: `No vendor on file matches "${name}", so none was attached.` }
}

/**
 * How complete an installed-item record honestly is.
 *
 * 'complete' requires manufacturer AND model, plus a serial where one is
 * expected. Never inferred upward: an owner who orders the wrong part off a
 * guessed model number is a worse outcome than a blank field, so anything
 * short of that is 'partial', and an item with no identification at all is a
 * 'placeholder'.
 */
export function installedItemDataQuality(input: {
  manufacturer: string | null
  modelNo: string | null
  serialNo: string | null
  serialExpected: boolean
}): 'complete' | 'partial' | 'placeholder' {
  const hasManufacturer = Boolean(input.manufacturer?.trim())
  const hasModel = Boolean(input.modelNo?.trim())
  const hasSerial = Boolean(input.serialNo?.trim())
  if (hasManufacturer && hasModel && (!input.serialExpected || hasSerial)) return 'complete'
  if (hasManufacturer || hasModel) return 'partial'
  return 'placeholder'
}

export interface StagedLine {
  receipt_name: string
  qty: number | null
  unit: string | null
  unit_cost: number | null
  match: LineMatch
}

/**
 * The line-by-line block of a staged summary.
 *
 * Every line says whether it will produce a price observation, because the
 * trigger is silent about the ones it skips. A confirmed receipt that records
 * eight lines and prices five must say so; implying that eight prices reached
 * the history is the same wrong-confidence failure the match rules above
 * exist to avoid.
 */
export function describeStagedLines(lines: StagedLine[]): string {
  if (lines.length === 0) return 'No lines were read off this document.'
  const rendered = lines.map(line => {
    const qty = line.qty == null ? '?' : String(line.qty)
    const unit = line.unit ? ` ${line.unit}` : ''
    const cost = line.unit_cost == null ? 'price unreadable' : `$${line.unit_cost.toFixed(2)} each`
    const priced = willProduceObservation(line)
      ? `matched ${line.match.confidence} — ${line.match.reason}`
      : `no catalogue match — recorded as evidence, no price captured (${line.match.reason})`
    return `• ${qty}${unit} ${line.receipt_name} — ${cost}; ${priced}`
  })
  const priceable = lines.filter(willProduceObservation).length
  return `${rendered.join('\n')}\n\n${lines.length} line${lines.length === 1 ? '' : 's'}, ${priceable} of which will add a price to the history.`
}

/**
 * Whether this line will actually cause TropiTrack's `receipt_line_to_price`
 * trigger to write an observation. Mirrors the trigger's own guard: it needs a
 * material, and a unit cost above zero.
 */
export function willProduceObservation(line: StagedLine): boolean {
  return Boolean(line.match.materialId) && line.unit_cost != null && line.unit_cost > 0
}
