import 'server-only'

import {
  createBedrockAdapter,
  createBedrockWriteProvider,
  BedrockConnectionMissingError,
} from '@/lib/domain-adapters/bedrock'
import { resolveJob } from '../read/find-job'
import type { Tool } from '../types'

/**
 * Attach a receipt that is already in the ledger to the job it was for.
 *
 * WHAT THIS FIXES
 *
 * Six live receipts have no `project_id`. Until a receipt names a job its
 * spend cannot be costed and the price on it cannot be tied to a house, so
 * the material half of job costing stays missing even though the money was
 * spent and the paper was filed. The team already answers "which job was
 * that for?" over WhatsApp; this is what turns that answer into a record
 * instead of a message nobody acts on.
 *
 * WHY IT IS AN UPDATE, AND WHY THAT IS FENCED
 *
 * The receipt row already exists, so there is nothing to insert. This is one
 * of exactly two update paths in `BedrockWriteProvider` -- see that class's
 * comment. Its entire column allowlist is `project_id`: it cannot touch the
 * total, the vendor, or the status, and a receipt already attached to a
 * DIFFERENT job is refused rather than silently re-pointed. Moving spend
 * between houses changes both houses' numbers and is not something to do
 * quietly on an operator's one-word reply.
 *
 * WHY A WRONG JOB IS WORSE THAN NO JOB
 *
 * Same restraint `log_receipt` already shows: a name that resolves to zero or
 * several jobs is reported back, never guessed at. An unattributed receipt is
 * a known gap; a misattributed one is a false number in a house's costs that
 * nobody will ever go looking for.
 */

export interface AttributeReceiptInput {
  receipt_id: string
  project: string
}

export interface AttributeReceiptDeps {
  getWriteProvider: typeof createBedrockWriteProvider
  getAdapter: typeof createBedrockAdapter
  resolveJobBy: typeof resolveJob
}

export function makeAttributeReceipt(deps: Partial<AttributeReceiptDeps> = {}): Tool<AttributeReceiptInput> {
  const getWriteProvider = deps.getWriteProvider ?? createBedrockWriteProvider
  const getAdapter = deps.getAdapter ?? createBedrockAdapter
  const resolveJobBy = deps.resolveJobBy ?? resolveJob

  return {
    name: 'attribute_receipt',
    description:
      'Attach an already-recorded receipt to the job it was for. Use this when somebody answers "which ' +
      'job was that receipt for?". Find the receipt first with get_receipts_needing_attribution. If the ' +
      'job name is ambiguous, ask which one — do not pick. This changes what a house is believed to have ' +
      'cost, so it is staged for explicit confirmation first.',
    risk: 'high',
    roles: ['owner', 'staff', 'founder'],
    modes: ['back-office'],
    inputSchema: {
      type: 'object',
      properties: {
        receipt_id: { type: 'string', description: 'The receipt id, from get_receipts_needing_attribution.' },
        project: { type: 'string', description: 'The job, however it was named in conversation.' },
      },
      required: ['receipt_id', 'project'],
    },

    async execute(args, ctx) {
      if (!args.receipt_id?.trim()) return { ok: false, error: 'Which receipt? Use get_receipts_needing_attribution to find it.' }
      if (!args.project?.trim()) return { ok: false, error: 'Which job is this receipt for?' }

      let write: Awaited<ReturnType<typeof createBedrockWriteProvider>>
      try {
        write = await getWriteProvider(ctx.workspaceId)
      } catch (error) {
        if (error instanceof BedrockConnectionMissingError) {
          return { ok: false, error: 'This workspace is not connected to a construction ledger.' }
        }
        return { ok: false, error: error instanceof Error ? error.message : 'Could not reach the ledger.' }
      }

      // Resolved here, never guessed. Unlike log_receipt -- where an
      // unresolved job still leaves a useful record -- this tool has nothing
      // else to do, so an ambiguous name is a refusal rather than a note.
      let job
      try {
        job = await resolveJobBy(getAdapter(), ctx.workspaceId, args.project)
      } catch {
        return { ok: false, error: 'Could not check the job list, so nothing was changed. Try again shortly.' }
      }
      if (job.match === 'none') {
        return { ok: false, error: `No job matched "${args.project}", so nothing was changed. What is the job called?` }
      }
      if (job.match === 'many') {
        return {
          ok: false,
          error: `"${args.project}" matches ${job.count} jobs (${job.candidates.map(c => c.name).join(', ')}). Which one?`,
        }
      }

      const project = job.candidates[0]
      const result = await write.provider.updateReceiptAttribution(write.companyId, args.receipt_id, project.id)

      if (!result.ok) {
        return {
          ok: false,
          error:
            result.previousProjectId && result.previousProjectId !== project.id
              ? `That receipt is already attached to a different job. Moving spend between houses is not done here — say so explicitly and it can be handled properly.`
              : `Nothing was changed. ${result.failedRows.map(f => f.error).join('; ')}`,
        }
      }

      return {
        ok: true,
        data: {
          receipt_id: args.receipt_id,
          project_id: project.id,
          project_name: project.name,
          already_attached: result.previousProjectId === project.id,
          audit_recorded: result.auditLogWritten,
          note:
            result.previousProjectId === project.id
              ? `That receipt was already on ${project.name}. Nothing changed.`
              : `Attached to ${project.name}. Its spend now counts against that job, and any price on it is tied to that house.`,
        },
      }
    },
  }
}

export const attributeReceipt: Tool<AttributeReceiptInput> = makeAttributeReceipt()
