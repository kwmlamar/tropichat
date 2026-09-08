import type { Tool } from './types'
import { removeTeamMember } from './write-high/remove-team-member'
import { removeService } from './write-high/remove-service'
import { removePricingTier } from './write-high/remove-pricing-tier'
import { removeBlackoutDate } from './write-high/remove-blackout-date'
import { sendReply } from './write-high/send-reply'
import { sendPaymentLink } from './write-high/send-payment-link'
import { confirmBooking } from './write-high/confirm-booking'
import { rescheduleBooking } from './write-high/reschedule-booking'
import { cancelBooking } from './write-high/cancel-booking'
import { sendOutreachBatch } from './write-high/send-outreach-batch'
import { draftInInbox } from './write-high/draft-in-inbox'
import { createCustomerBooking } from './write-high/create-customer-booking'
import { expandOutreachTarget } from './write-high/expand-outreach-target'
import { sendFreightDocumentTool } from './write-high/send-freight-document'
import { logCrewDay } from './write-high/log-crew-day'
import { logInvoiceSent } from './write-high/log-invoice-sent'
import { recordPayment } from './write-high/record-payment'
import { logReceipt } from './write-high/log-receipt'
import { attributeReceipt } from './write-high/attribute-receipt'
import { createMaterial } from './write-high/create-material'
import { recordInstalledItem } from './write-high/record-installed-item'
import { captureVendorQuote } from './write-high/capture-vendor-quote'
import { recordYardReturn } from './write-high/record-yard-return'

/**
 * The UNGATED high-risk tools, in one place.
 *
 * Two consumers need this list and neither may import the other:
 *   - registry.ts wraps each in gateHighRisk() for the agent's tool list.
 *   - write-high/confirm-pending-action.ts executes the original directly,
 *     using args read back from the staged caye_pending_actions row.
 *
 * Keeping the list here rather than in registry.ts is what breaks the
 * import cycle (registry → confirm_pending_action → registry).
 *
 * A tool must be in this list to be confirmable. That's deliberate: it
 * means confirm_pending_action can never be pointed at something that was
 * never gated in the first place.
 */
type AnyTool = Tool<never>

export const HIGH_RISK_TOOLS: AnyTool[] = [
  logCrewDay as AnyTool,
  logInvoiceSent as AnyTool,
  recordPayment as AnyTool,
  logReceipt as AnyTool,
  // The materials write path (2026-09-07). Each is one reviewable decision:
  // attaching spend to a house, adding a thing to the catalogue with the
  // price that justifies it, and recording what was physically installed.
  attributeReceipt as AnyTool,
  createMaterial as AnyTool,
  recordInstalledItem as AnyTool,
  // Registered 2026-09-07, after TropiTrack PR #34. It was deliberately absent
  // until then: `materials.unit_cost` had no defined basis, so a captured
  // FOB/USD quote would have overwritten a landed BSD cost on any of the 219
  // materials won by a tier 4/5 observation. `unit_cost` is now landed BSD
  // computed through `landed_cost()`, stamped `unit_cost_basis`, so is_landed
  // is a distinction the ledger acts on. See that file's history section — if
  // the column or the function is reverted, this line comes back out.
  captureVendorQuote as AnyTool,
  // Yard put-away (2026-09-08). The only capture point ODS's yard ledger has:
  // material coming off a site and being put down is a physical event, and it
  // cannot be derived from takeoffs minus receipts because nobody tracks
  // consumption that finely. Staged like every other ledger write, but the
  // staged summary is a receipt with a value on it (see describePendingAction)
  // rather than an echo of the arguments -- a put-away is agreed to by someone
  // standing next to the material, and a form they cannot check is a form they
  // will stop answering.
  recordYardReturn as AnyTool,
  sendReply as AnyTool,
  sendPaymentLink as AnyTool,
  confirmBooking as AnyTool,
  rescheduleBooking as AnyTool,
  cancelBooking as AnyTool,
  removeService as AnyTool,
  removePricingTier as AnyTool,
  removeBlackoutDate as AnyTool,
  removeTeamMember as AnyTool,
  sendFreightDocumentTool as AnyTool,
  // Batch-approved first-touch outreach sends (2026-08-01) — step 3 of the
  // 2026-07-21 staged-autonomy roadmap. Step 4 (fully autonomous, no review)
  // stays permanently off; this only ever sends threads the operator already
  // reviewed via get_pending_quotes, behind the same confirmation round-trip
  // as every other high-risk tool here.
  sendOutreachBatch as AnyTool,
  // Raised from low-risk (2026-08-17, Pam Ott incident) — see
  // write-high/draft-in-inbox.ts's doc comment. Filing something into the
  // operator's own external inbox is reversible for the customer (nothing
  // is sent) but pulls the operator out of the channel they're managing
  // Caye from, so it gets the same confirm-before-it-happens checkpoint as
  // every other consequential action here.
  draftInInbox as AnyTool,
  createCustomerBooking as AnyTool,
  expandOutreachTarget as AnyTool,
]

export function findHighRiskTool(name: string): AnyTool | undefined {
  return HIGH_RISK_TOOLS.find((t) => t.name === name)
}
