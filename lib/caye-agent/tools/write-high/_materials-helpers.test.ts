import { describe, expect, it } from 'vitest'

import {
  describeStagedLines,
  divisionNameFor,
  generateMaterialId,
  installedItemDataQuality,
  isDutyCategory,
  isLandedFor,
  isMaterialOrigin,
  matchMaterialLine,
  resolveVendorFromList,
  willProduceObservation,
} from './_materials-helpers'

/**
 * A slice of the real ODS catalogue shape: several near-neighbours, because
 * the interesting failures are all about telling similar things apart rather
 * than finding an obvious match.
 */
const CATALOGUE = [
  { id: 'R1_0', name: 'Portland Cement 94lb', unit: 'bag' },
  { id: 'R2_0', name: 'Rebar #4 20ft', unit: 'ea' },
  { id: 'R3_0', name: 'Rebar #5 20ft', unit: 'ea' },
  { id: 'R4_0', name: 'Plywood 3/4 CDX', unit: 'sheet' },
]

describe('catalogue identity', () => {
  it('generates ids in the scheme the live rows already use', () => {
    // materials.id is text, NOT NULL, with no default — an id that does not
    // look like the existing 236 makes the catalogue harder to read by hand,
    // which is how these get audited.
    expect(generateMaterialId(new Date('2026-09-07T12:00:00Z'), 0)).toMatch(/^R\d+_0$/)
    expect(generateMaterialId(new Date('2026-09-07T12:00:00Z'), 2)).toMatch(/^R\d+_2$/)
  })

  it('resolves a division code to the real CSI name and refuses anything else', () => {
    expect(divisionNameFor('03')).toBe('Concrete')
    expect(divisionNameFor('07')).toBe('Thermal & Moisture')
    // The whole point of the lookup: 'From Receipt' is a source flag, and it
    // corrupted CSI grouping when it reached this field. There is no code that
    // yields it because it is not a division.
    expect(divisionNameFor('From Receipt')).toBeNull()
    expect(divisionNameFor('99')).toBeNull()
  })

  it('validates origin and duty category against what the ledger can actually use', () => {
    expect(isMaterialOrigin('FL')).toBe(true)
    expect(isMaterialOrigin('MIAMI')).toBe(false)
    expect(isDutyCategory('cement')).toBe(true)
    // No CHECK constraint exists on the live column, so an invented value
    // would be accepted by the database and then match no landed_cost_rules
    // row — a material whose landed cost can never be computed.
    expect(isDutyCategory('cementish')).toBe(false)
  })
})

describe('landed vs FOB', () => {
  it('treats every paid receipt as landed, wherever it was bought', () => {
    expect(isLandedFor('receipt', 'FL')).toBe(true)
    expect(isLandedFor('receipt', 'NASSAU')).toBe(true)
  })

  it('treats a Florida quote as FOB and a local quote as landed', () => {
    // This is the distinction vendor comparison depends on: comparing a
    // Florida shelf price against a Nassau delivered price without saying so
    // makes the Florida vendor look cheaper than it is.
    expect(isLandedFor('quote', 'FL')).toBe(false)
    expect(isLandedFor('quote', 'NASSAU')).toBe(true)
    expect(isLandedFor('quote', 'ELEUTHERA')).toBe(true)
    expect(isLandedFor('quote', 'UNKNOWN')).toBe(false)
  })
})

describe('matching a document line to the catalogue', () => {
  it('calls an exact name match high', () => {
    const match = matchMaterialLine(CATALOGUE, 'Portland Cement 94lb')
    expect(match).toMatchObject({ materialId: 'R1_0', confidence: 'high' })
  })

  it('ignores punctuation and case, which receipts print inconsistently', () => {
    expect(matchMaterialLine(CATALOGUE, 'PORTLAND CEMENT 94LB').confidence).toBe('high')
    expect(matchMaterialLine(CATALOGUE, 'portland-cement 94lb').materialId).toBe('R1_0')
  })

  it('calls a full-word match medium, not high', () => {
    const match = matchMaterialLine(CATALOGUE, 'PLYWOOD 3/4 CDX 4x8')
    expect(match).toMatchObject({ materialId: 'R4_0', confidence: 'medium' })
  })

  it('refuses to choose between equally good candidates', () => {
    // "Rebar 20ft" fits #4 and #5 equally. Picking one would attribute a price
    // to the wrong material, and the confidence would flow straight onto the
    // observation as if it were known.
    const match = matchMaterialLine(CATALOGUE, 'Rebar 20ft')
    expect(match.materialId).toBeNull()
    expect(match.confidence).toBe('none')
    expect(match.ambiguousWith.length).toBeGreaterThan(1)
  })

  it('returns none rather than a guess when nothing resembles the line', () => {
    const match = matchMaterialLine(CATALOGUE, 'Coffee and two donuts')
    expect(match).toMatchObject({ materialId: null, confidence: 'none' })
  })

  it('handles an unreadable line name without throwing', () => {
    expect(matchMaterialLine(CATALOGUE, '   ').confidence).toBe('none')
    expect(matchMaterialLine([], 'Portland Cement 94lb').confidence).toBe('none')
  })
})

describe('resolving a vendor, company-scoped', () => {
  const VENDORS = [
    { id: 'v-1', name: 'Sutton Brick' },
    { id: 'v-2', name: 'Sutton Stone & Tile' },
    { id: 'v-3', name: 'ADI Metal' },
  ]

  it('matches an exact name', () => {
    expect(resolveVendorFromList(VENDORS, 'ADI Metal')).toMatchObject({ vendorId: 'v-3' })
  })

  it('matches a unique prefix', () => {
    expect(resolveVendorFromList(VENDORS, 'ADI')).toMatchObject({ vendorId: 'v-3' })
  })

  it('refuses an ambiguous prefix instead of taking the shortest name', () => {
    // TropiTrack's own resolve_vendor_id() orders by length(name) and would
    // silently return Sutton Brick here. Attaching a price to the wrong
    // supplier is what makes vendor comparison lie.
    const resolved = resolveVendorFromList(VENDORS, 'Sutton')
    expect(resolved.vendorId).toBeNull()
    expect(resolved.note).toContain('Sutton Brick')
    expect(resolved.note).toContain('Sutton Stone & Tile')
  })

  it('says plainly when no vendor is on file, and stays quiet when no name was printed', () => {
    expect(resolveVendorFromList(VENDORS, 'Mikro').note).toContain('No vendor on file')
    expect(resolveVendorFromList(VENDORS, undefined)).toMatchObject({ vendorId: null, note: null })
  })
})

describe('how complete an installed-item record honestly is', () => {
  it('is complete only with manufacturer and model, plus a serial where one is expected', () => {
    expect(
      installedItemDataQuality({ manufacturer: 'Rheem', modelNo: 'XE50', serialNo: 'Q12345', serialExpected: true })
    ).toBe('complete')
    expect(
      installedItemDataQuality({ manufacturer: 'Rheem', modelNo: 'XE50', serialNo: null, serialExpected: false })
    ).toBe('complete')
  })

  it('will not call a record complete when the serial it should have is missing', () => {
    expect(
      installedItemDataQuality({ manufacturer: 'Rheem', modelNo: 'XE50', serialNo: null, serialExpected: true })
    ).toBe('partial')
  })

  it('falls to partial or placeholder rather than rounding up', () => {
    expect(installedItemDataQuality({ manufacturer: 'Rheem', modelNo: null, serialNo: null, serialExpected: true })).toBe('partial')
    expect(installedItemDataQuality({ manufacturer: null, modelNo: null, serialNo: null, serialExpected: false })).toBe('placeholder')
    // Whitespace is not data.
    expect(installedItemDataQuality({ manufacturer: '  ', modelNo: '  ', serialNo: null, serialExpected: false })).toBe('placeholder')
  })
})

describe('what the operator is told about the lines', () => {
  const line = (over: Partial<Parameters<typeof willProduceObservation>[0]> = {}) => ({
    receipt_name: 'Portland Cement 94lb',
    qty: 10,
    unit: 'bag',
    unit_cost: 12.5,
    match: matchMaterialLine(CATALOGUE, 'Portland Cement 94lb'),
    ...over,
  })

  it('counts a line as priced only when the trigger would actually write an observation', () => {
    expect(willProduceObservation(line())).toBe(true)
    // Mirrors trg_receipt_line_to_price's own guard exactly.
    expect(willProduceObservation(line({ unit_cost: null }))).toBe(false)
    expect(willProduceObservation(line({ unit_cost: 0 }))).toBe(false)
    expect(willProduceObservation(line({ match: matchMaterialLine(CATALOGUE, 'Coffee') }))).toBe(false)
  })

  it('says how many lines will add a price, not how many lines there were', () => {
    // The trigger is silent about what it skips. A summary that implies four
    // prices landed when two did is the wrong-confidence failure this whole
    // path exists to avoid.
    const summary = describeStagedLines([
      line(),
      line({ receipt_name: 'Coffee', match: matchMaterialLine(CATALOGUE, 'Coffee') }),
    ])
    expect(summary).toContain('2 lines, 1 of which will add a price')
    expect(summary).toContain('no catalogue match')
  })

  it('does not pretend an empty document had lines', () => {
    expect(describeStagedLines([])).toContain('No lines')
  })
})
