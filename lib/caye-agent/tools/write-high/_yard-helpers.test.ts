import { describe, expect, it } from 'vitest'
import {
  MAIN_YARD,
  UNCLASSIFIED_CATEGORY,
  UNCLASSIFIED_DIVISION,
  UNKNOWN_UNIT,
  draftYardMaterial,
  isConfidentYardMatch,
  lineValue,
  matchYardLine,
  normaliseYardLocation,
  renderYardReturnReceipt,
  totalValue,
  type YardCatalogueEntry,
  type YardReturnItemView,
} from './_yard-helpers'
import { CSI_DIVISIONS, generateMaterialId } from './_materials-helpers'

function entry(id: string, name: string, isCore: boolean, unit: string | null = 'SHEET'): YardCatalogueEntry {
  return { id, name, unit, isCore }
}

// The four real plywood rows in ODS's catalogue on 2026-09-08, with their
// actual is_core flags. Using the live shape rather than invented names is
// the point: the tie this tests is one a crew member creates by saying "ply"
// instead of reading a printed line off a receipt.
const PLYWOOD: YardCatalogueEntry[] = [
  entry('S029', '1/2" CDX Plywood 4x8', true),
  entry('S028', '3/4" CDX Plywood 4x8', false),
  entry('S032', '1/4" Luan Plywood 4x8', false),
  entry('R1781188579464_2', 'BC PLYWOOD 3/8"', true),
]

describe('normaliseYardLocation', () => {
  it('defaults to the main yard rather than asking', () => {
    expect(normaliseYardLocation(undefined)).toBe(MAIN_YARD)
    expect(normaliseYardLocation('')).toBe(MAIN_YARD)
    expect(normaliseYardLocation('   ')).toBe(MAIN_YARD)
  })

  it('collapses the ways people say "the yard" onto one shelf', () => {
    // stock_items is unique on (company_id, material_id, location), so each of
    // these spellings would otherwise open a SEPARATE shelf holding part of
    // the same material.
    for (const spoken of ['yard', 'Yard', 'the yard', 'THE MAIN YARD', 'main  yard', 'the shop']) {
      expect(normaliseYardLocation(spoken)).toBe(MAIN_YARD)
    }
  })

  it('keeps a genuinely different location', () => {
    expect(normaliseYardLocation("Governor's Harbour lot")).toBe("Governor's Harbour lot")
  })
})

describe('matchYardLine', () => {
  it('takes an exact name at high confidence', () => {
    const match = matchYardLine(PLYWOOD, '3/4" CDX Plywood 4x8')
    expect(match).toMatchObject({ materialId: 'S028', confidence: 'high' })
  })

  it('breaks a spoken tie toward the item ODS restocks, at medium', () => {
    // "plywood" alone ties across all four rows. Exactly one of the tied
    // candidates being core is what makes this resolvable at all; without the
    // tie-break this records a description with no material and no value.
    const twoWay = [entry('S028', '3/4" CDX Plywood 4x8', false), entry('S029', '1/2" CDX Plywood 4x8', true)]
    const match = matchYardLine(twoWay, 'CDX Plywood 4x8')
    expect(match.materialId).toBe('S029')
    expect(match.confidence).toBe('medium')
    expect(match.reason).toContain('actually restocks')
  })

  it('never promotes a tie-break to high confidence', () => {
    const twoWay = [entry('S028', '3/4" CDX Plywood 4x8', false), entry('S029', '1/2" CDX Plywood 4x8', true)]
    expect(matchYardLine(twoWay, 'CDX Plywood 4x8').confidence).not.toBe('high')
  })

  it('refuses when several tied candidates are core', () => {
    // Two core rows tied means the heuristic has nothing to say. Guessing here
    // would stamp one material's landed cost onto the other's quantity.
    const both = [entry('S029', '1/2" CDX Plywood 4x8', true), entry('S028', '3/4" CDX Plywood 4x8', true)]
    const match = matchYardLine(both, 'CDX Plywood 4x8')
    expect(match.materialId).toBeNull()
    expect(match.confidence).toBe('none')
  })

  it('refuses when no tied candidate is core', () => {
    const neither = [entry('S028', '3/4" CDX Plywood 4x8', false), entry('S032', '3/4" CDX Plywood 4X8', false)]
    expect(matchYardLine(neither, '3/4" CDX Plywood 4x8').materialId).toBeNull()
  })

  it('does not let a core item beat a better non-core match', () => {
    // The tie-break only ever runs on an outcome that was already going to be
    // nothing. A decisive non-core match must survive untouched.
    const match = matchYardLine(PLYWOOD, '1/4" Luan Plywood 4x8')
    expect(match.materialId).toBe('S032')
    expect(match.confidence).toBe('high')
  })

  it('still refuses a line nothing resembles', () => {
    expect(matchYardLine(PLYWOOD, 'hurricane strap').materialId).toBeNull()
  })
})

describe('isConfidentYardMatch', () => {
  it('accepts high and medium, and refuses low', () => {
    // 'low' is "shares most of its words", which for a spoken line is as
    // likely to be 1/2" as 3/4". A wrong match stamps a wrong unit_cost_landed
    // onto the shelf, which is worse than no shelf entry at all.
    expect(isConfidentYardMatch({ materialId: 'a', confidence: 'high', reason: '', ambiguousWith: [] })).toBe(true)
    expect(isConfidentYardMatch({ materialId: 'a', confidence: 'medium', reason: '', ambiguousWith: [] })).toBe(true)
    expect(isConfidentYardMatch({ materialId: 'a', confidence: 'low', reason: '', ambiguousWith: [] })).toBe(false)
    expect(isConfidentYardMatch({ materialId: null, confidence: 'none', reason: '', ambiguousWith: [] })).toBe(false)
  })
})

function item(overrides: Partial<YardReturnItemView> = {}): YardReturnItemView {
  return {
    description: '3/4 ply',
    quantity: 8,
    unit: 'SHEET',
    materialId: 'S028',
    materialName: '3/4" CDX Plywood 4x8',
    matchReason: 'exact name match',
    newMaterial: null,
    landedUnitCost: 62.4,
    priceIsStale: false,
    priceObservedAt: '2026-08-01',
    ...overrides,
  }
}

describe('value arithmetic', () => {
  it('multiplies the landed cost by the count', () => {
    expect(lineValue(item())).toBe(499.2)
  })

  it('reports no value rather than zero when there is no price', () => {
    expect(lineValue(item({ landedUnitCost: null }))).toBeNull()
  })

  it('never counts an unpriced line as zero in the total', () => {
    // A total that silently absorbs unpriced lines reads as "this is what came
    // back", when it is only what the priced part came back as.
    const total = totalValue([item(), item({ landedUnitCost: null, quantity: 40 })])
    expect(total).toBe(499.2)
  })
})

describe('renderYardReturnReceipt', () => {
  it('leads with what and where, and ends with what it is worth', () => {
    const text = renderYardReturnReceipt({
      items: [item()],
      projectName: 'Blue Sky',
      projectNote: null,
      location: MAIN_YARD,
    })
    expect(text).toContain('off Blue Sky')
    expect(text).toContain('into the yard')
    expect(text).toContain('8 SHEET 3/4" CDX Plywood 4x8')
    expect(text).toContain('$62.40 each')
    expect(text.trim().endsWith('$499.20 back on the shelf.')).toBe(true)
  })

  it('says a new catalogue item will be created rather than that nothing matched', () => {
    // stock_items is keyed on (company_id, material_id, location), so a null
    // material cannot form a shelf. Creating the row is what keeps the yard
    // count right -- and the operator is agreeing to that in the same yes, so
    // the receipt has to say it.
    const text = renderYardReturnReceipt({
      items: [
        item({
          materialId: null,
          materialName: null,
          landedUnitCost: null,
          description: 'them grey blocks',
          newMaterial: draftYardMaterial({ description: 'them grey blocks' }),
        }),
      ],
      projectName: 'Blue Sky',
      projectNote: null,
      location: MAIN_YARD,
    })
    expect(text).toContain('no catalog match')
    expect(text).toContain("I'll add it as a new item")
    expect(text).toContain('them grey blocks')
    expect(text).toContain('no value goes back on the shelf')
    // The old wording promised the opposite. The shelf DOES move now.
    expect(text).not.toContain('yard stock will not move')
  })

  it('says how much of a mixed load carries a price', () => {
    const text = renderYardReturnReceipt({
      items: [
        item(),
        item({
          description: 'rebar offcuts',
          materialId: null,
          materialName: null,
          landedUnitCost: null,
          newMaterial: draftYardMaterial({ description: 'rebar offcuts' }),
        }),
      ],
      projectName: 'Blue Sky',
      projectNote: null,
      location: MAIN_YARD,
    })
    expect(text).toContain('from the 1 of 2 that carry a price')
  })

  it('flags a stale price rather than presenting it as current', () => {
    const text = renderYardReturnReceipt({
      items: [item({ priceIsStale: true })],
      projectName: 'Blue Sky',
      projectNote: null,
      location: MAIN_YARD,
    })
    expect(text).toContain('price is stale')
  })

  it('names a non-default location instead of calling it the yard', () => {
    const text = renderYardReturnReceipt({
      items: [item()],
      projectName: 'Blue Sky',
      projectNote: null,
      location: 'Palmetto Point lot',
    })
    expect(text).toContain('into Palmetto Point lot')
  })

  it('carries the unresolved-job question into the receipt', () => {
    const text = renderYardReturnReceipt({
      items: [item()],
      projectName: null,
      projectNote: '"Blue" matches 2 jobs — Blue Sky, Blue Hole. Which one?',
      location: MAIN_YARD,
    })
    expect(text).toContain('off a job nobody has named yet')
    expect(text).toContain('Which one?')
  })
})

describe('draftYardMaterial', () => {
  it('files an unidentified return outside CSI entirely, never into a real division', () => {
    // 99 is not a division, it is the absence of one. Parking unidentified
    // material in 01 General Requirements -- which has real scope ODS
    // estimates and reports against -- would silently inflate every roll-up
    // that reads it. A code with no scope cannot corrupt a total.
    const draft = draftYardMaterial({ description: 'them grey blocks' })
    expect(draft.divisionCode).toBe('99')
    expect(draft.divisionName).toBe('Unclassified — needs review')
    expect(draft.category).toBe(UNCLASSIFIED_CATEGORY)
    expect(draft.unit).toBe(UNKNOWN_UNIT)
    expect(draft.origin).toBe('UNKNOWN')
    expect(draft.name).toBe('them grey blocks')
  })

  it('keeps the unclassified division out of the map create_material accepts', () => {
    // Widening CSI_DIVISIONS would let a document-derived material be filed
    // as unclassified, which is a different and worse thing than a yard
    // return nobody has identified.
    expect(CSI_DIVISIONS[UNCLASSIFIED_DIVISION.code]).toBeUndefined()
  })

  it('uses a real division when the model supplied one', () => {
    const draft = draftYardMaterial({ description: '8in block', divisionCode: '04', category: 'Block', unit: 'EA' })
    expect(draft.divisionCode).toBe('04')
    expect(draft.divisionName).toBe('Masonry')
    expect(draft.category).toBe('Block')
  })

  it('falls back rather than trusting a division code it does not know', () => {
    const draft = draftYardMaterial({ description: 'something', divisionCode: '77' })
    expect(draft.divisionCode).toBe('99')
    expect(draft.divisionName).toBe('Unclassified — needs review')
  })

  it('never files an unidentified return into a division ODS actually reports on', () => {
    // The specific regression: 01 is General Requirements (supervision,
    // temporary facilities, bonds), so unidentified material there corrupts
    // a division total that means something.
    const draft = draftYardMaterial({ description: 'a pile of something' })
    expect(draft.divisionCode).not.toBe('01')
    expect(Object.keys(CSI_DIVISIONS)).not.toContain(draft.divisionCode)
  })

  it('says in the review note that there is no cost basis', () => {
    expect(draftYardMaterial({ description: 'x' }).reviewNote).toContain('No cost basis')
    expect(draftYardMaterial({ description: 'x' }).reviewNote).toContain('unit_cost is 0')
  })

  it('collapses whitespace in the name rather than tidying the words', () => {
    expect(draftYardMaterial({ description: '  them   grey  blocks ' }).name).toBe('them grey blocks')
  })
})

describe('generateMaterialId', () => {
  it('prefixes yard-created rows with Y so LIKE \'R%\' stays correct', () => {
    // 12 live rows are selected by LIKE 'R%' as document-derived. A yard row
    // in that set would assert a purchase price that does not exist.
    const at = new Date('2026-09-08T15:00:00.000Z')
    expect(generateMaterialId(at, 0, 'Y')).toBe(`Y${at.getTime()}_0`)
    expect(generateMaterialId(at, 2, 'Y').startsWith('R')).toBe(false)
    expect(generateMaterialId(at, 0)).toBe(`R${at.getTime()}_0`)
  })
})
