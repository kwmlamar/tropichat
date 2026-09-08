import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { selectToolSurface } from './execute'
import type { ToolContext } from './tools/types'

const contextFor = (callerRole: ToolContext['callerRole']): ToolContext => ({
  workspaceId: 'ws_test',
  callerRole,
  requestId: `req_${callerRole}`,
})

describe('production tool surface', () => {
  it('reports deterministic role-specific production counts', () => {
    const owner = selectToolSurface({ ctx: contextFor('owner'), mode: 'back-office' }).metrics
    const founder = selectToolSurface({ ctx: contextFor('founder'), mode: 'back-office' }).metrics
    const staff = selectToolSurface({ ctx: contextFor('staff'), mode: 'back-office' }).metrics
    // The numbers make the concrete optimization reviewable: owners lose
    // founder-only schemas; staff see only schemas they could execute.
    //
    // These are a DRIFT DETECTOR, not a target. They had gone stale on main
    // well before CAY-194 (owner excludedByRoleCount was asserted as 4 while
    // the real value was already 29, and founder exposedToolCount as 77
    // against a real 99), so the test had stopped failing informatively and
    // started failing constantly. Refreshed here to the true post-CAY-194
    // values. If a change moves these, update them deliberately and say why
    // in the PR — do not "fix" the test by loosening the assertion.
    //
    // Refreshed again 2026-09-03 (repository audit dispatch): the tool
    // registry grew by 11 since the last refresh — the construction-ledger
    // (Bedrock/TropiTrack) tools registered in lib/caye-agent/tools/registry.ts
    // and high-risk-registry.ts (findJob, getJob, getJobLabor, previewCrewDay,
    // getPayrollStatus, getPayrollOwed, getReceivables, setConstructionPolicy,
    // logCrewDay, logInvoiceSent, recordPayment). Unlike CAY-194's founder-only
    // batch, most of these ARE owner- and several are staff-visible (roles:
    // ['owner','staff','founder'] for the job/crew-day tools, ['owner','founder']
    // for payroll/receivables/invoicing/policy), so exposedToolCount moves for
    // every role this time — owner and founder each gain all 11, staff gains
    // only the 5 job/crew-day tools it has roles for. Owner's own
    // excludedByRoleCount/excludedToolSchemaBytes are unchanged because none
    // of the 11 new tools are founder-only (nothing new becomes invisible to
    // an owner). Still an exact, unweakened toMatchObject assertion.
    // Refreshed again 2026-09-03, later the same day: staff's
    // excludedToolSchemaBytes only, 114255 -> 114516. No tool was added or
    // removed — every other number here is unchanged, including all three
    // exposedToolCounts and both excludedByRoleCounts.
    //
    // Cause, accounted for exactly rather than re-baselined: #467 added one
    // sentence to get_receivables' tool `description` (the "If
    // `nothing_recorded` is true, NOTHING HAS BEEN ENTERED..." instruction
    // that stops an empty register being reported as nothing owed). That
    // string is 261 bytes and the drift is 261 bytes.
    //
    // Only staff moves because get_receivables is roles ['owner','founder']
    // (get-receivables.ts:67): it is excluded from staff, so staff's excluded
    // total grows, and it is visible to an owner, so owner's excluded total
    // does not. That asymmetry is the detector working — it is what makes
    // the number diagnostic instead of just noisy.
    // Refreshed 2026-09-03 for log_receipt: every exposedToolCount +1
    // (owner 87->88, founder 140->141, staff 21->22) and NOTHING else moves.
    // The tool is roles ['owner','staff','founder'], so it is visible to all
    // three and becomes invisible to none — which is exactly why both
    // excludedByRoleCounts and both excludedToolSchemaBytes are unchanged.
    // A new tool that moved an excluded number would mean it was hidden from
    // somebody, and would be worth a second look.
    //
    // Refreshed again 2026-09-04 for the three freight tools, and here an
    // excluded number DOES move — deliberately, unlike log_receipt above.
    // get_freight_workflows (read) and prepare_freight_document (write-low)
    // are roles ['owner','staff','founder']; send_freight_document is
    // roles ['owner','founder'], because actually emailing a forwarder an
    // attachment built from this workspace's purchase evidence is an owner
    // decision. So:
    //   owner   88->91  (+3, all three visible), excluded 53 unchanged
    //   founder 141->144 (+3, sees everything), still 0/0
    //   staff   22->24  (+2 only), excludedByRoleCount 119->120 and
    //                   excludedToolSchemaBytes 114516->115784
    // That single +1 on staff's excluded count IS send_freight_document being
    // hidden from staff. It is the intended authority boundary, not drift.
    //
    // Refreshed again 2026-09-05 for reject_pending_action (payment watcher:
    // the counterpart to confirm_pending_action for the "no" branch — decline
    // a staged high-risk action instead of confirming it). Deliberately
    // roles ['owner','founder'], identical to confirm_pending_action's own
    // roles: if staff cannot confirm a staged high-risk action, staff must
    // not be able to decline one either — the same authority boundary,
    // extended consistently rather than left half-covered. So this moves an
    // excluded number on purpose, the same shape send_freight_document did
    // above, not the log_receipt shape where nothing excluded moved:
    //   owner   91->92  (+1 visible), excluded 53 / 34528 unchanged
    //   founder 144->145 (+1, sees everything), still 0 / 0
    //   staff   24 unchanged (correctly hidden — reject_pending_action is not
    //           staff-visible), excludedByRoleCount 120->121 and
    //           excludedToolSchemaBytes 115784->116452
    // The staff byte delta (+668) is reject_pending_action's own serialized
    // {name, description, input_schema} (667 bytes) plus 1 for the joining
    // array comma — schemaBytes() joins every excluded-by-role/read-only
    // tool's asAnthropicTool() output into one JSON array before measuring.
    // That +1 on staff's excluded count IS reject_pending_action being hidden
    // from staff. It is the intended authority boundary, not drift.
    //
    // Refreshed 2026-09-07 for the ODS materials write path: five tools, and
    // NOTHING excluded moves — the log_receipt shape above, not the
    // send_freight_document shape. All five are roles
    // ['owner','staff','founder'], so each is visible to all three roles and
    // hidden from none:
    //   get_receipts_needing_attribution (read)   — which receipts have no job
    //   attribute_receipt (write-high)            — attach one to a job
    //   create_material (write-high)              — catalogue row + first price
    //   record_installed_item (write-high)        — what went into a house
    //   capture_vendor_quote (write-high)         — quoted prices, for comparison
    //   owner   92->97  (+5), excluded 53 / 34528 unchanged
    //   founder 145->150 (+5, sees everything), still 0 / 0
    //   staff   24->29  (+5), excluded 121 / 116452 unchanged
    // Both excluded numbers holding still across all five IS the check: any
    // movement would mean one of them was hidden from somebody, which none of
    // them is meant to be. These are consequential ledger writes, but they are
    // consequential for the crew who do the work, so the confirmation gate is
    // what constrains them, not role visibility.
    //
    // capture_vendor_quote is in this count deliberately. It was written
    // unregistered — see write-high/capture-vendor-quote.ts — because
    // `materials.unit_cost` had no defined basis and a captured FOB/USD quote
    // would have overwritten a landed BSD cost. TropiTrack PR #34 fixed that
    // (unit_cost is now landed BSD via landed_cost(), stamped
    // unit_cost_basis), verified live before registering it here.
    //
    // Refreshed 2026-09-08 for record_yard_return (yard put-away capture: the
    // only point at which leftover material coming off a job is recorded, so
    // it stops being re-bought). Exactly the log_receipt shape again — one
    // tool, roles ['owner','staff','founder'], visible to all three and hidden
    // from none, so every exposedToolCount moves by one and NOTHING excluded
    // moves:
    //   owner   97->98   (+1), excluded 53 / 34528 unchanged
    //   founder 150->151 (+1, sees everything), still 0 / 0
    //   staff   29->30   (+1), excluded 121 / 116452 unchanged
    // Staff visibility is deliberate and is the whole point: the person who
    // carries the plywood off the truck is the person who reports it. The
    // confirmation gate is what constrains this write, not role visibility.
    expect(owner).toMatchObject({ exposedToolCount: 98, excludedByRoleCount: 53, excludedToolSchemaBytes: 34528 })
    expect(founder).toMatchObject({ exposedToolCount: 151, excludedByRoleCount: 0, excludedToolSchemaBytes: 0 })
    expect(staff).toMatchObject({ exposedToolCount: 30, excludedByRoleCount: 121, excludedToolSchemaBytes: 116452 })
  })

  it.each(['owner', 'staff', 'founder', 'driver'] as const)('only exposes schemas executable by %s', (callerRole) => {
    const { tools } = selectToolSurface({ ctx: contextFor(callerRole), mode: 'back-office' })
    expect(tools.every((tool) => tool.roles.includes(callerRole))).toBe(true)
  })

  it('retains the owner authority and confirmation surface', () => {
    const names = selectToolSurface({ ctx: contextFor('owner'), mode: 'back-office' }).tools.map((tool) => tool.name)
    expect(names).toEqual(expect.arrayContaining([
      'get_held_queue',
      'get_customer',
      'send_reply',
      'confirm_pending_action',
      'create_customer_booking',
      'send_payment_link',
    ]))
  })
})
