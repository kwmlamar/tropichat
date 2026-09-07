import 'server-only'

import { createBedrockAdapter, BedrockConnectionMissingError } from '@/lib/domain-adapters/bedrock'
import { bedrockConnectionErrorResult } from './find-job'
import type { Tool } from '../types'

/**
 * The receipts nobody has said a job for yet.
 *
 * This is the read half of closing the attribution loop: `attribute_receipt`
 * needs a receipt id, and an operator does not have one — they have "that
 * Kelly's run from Tuesday". This turns the gap into a short, answerable list.
 *
 * Six live receipts are in this state. Each one is money that was spent on a
 * house and cannot be counted against it, and a price that cannot be tied to
 * anything. That is worth surfacing plainly rather than leaving for somebody
 * to go looking for.
 *
 * Read-only, so no confirmation gate — it changes nothing.
 */

export interface GetReceiptsNeedingAttributionInput {
  limit?: number
}

export interface GetReceiptsNeedingAttributionDeps {
  getAdapter: typeof createBedrockAdapter
}

export function makeGetReceiptsNeedingAttribution(
  deps: Partial<GetReceiptsNeedingAttributionDeps> = {}
): Tool<GetReceiptsNeedingAttributionInput> {
  const getAdapter = deps.getAdapter ?? createBedrockAdapter

  return {
    name: 'get_receipts_needing_attribution',
    description:
      'List receipts that are recorded but have no job attached, so their spend is not counted against ' +
      'any house. Use this before asking the team which job a receipt was for, and to get the receipt id ' +
      'that attribute_receipt needs.',
    risk: 'read',
    roles: ['owner', 'staff', 'founder'],
    modes: ['back-office'],
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'How many to return. Defaults to 25.' },
      },
      required: [],
    },

    async execute(args, ctx) {
      const limit = Math.min(Math.max(args.limit ?? 25, 1), 100)
      try {
        const receipts = await getAdapter().listUnattributedReceipts(ctx.workspaceId, 200)
        const shown = receipts.slice(0, limit)
        return {
          ok: true,
          data: {
            count: receipts.length,
            receipts: shown.map(receipt => ({
              receipt_id: receipt.id,
              vendor: receipt.vendorNameSnapshot,
              receipt_date: receipt.receiptDate,
              total: receipt.totalAmount,
              status: receipt.status,
            })),
            note: receipts.length === 0
              ? 'Every recorded receipt is attached to a job.'
              : `${receipts.length} receipt${receipts.length === 1 ? '' : 's'} with no job attached. Until each one names a job, its spend is not counted against any house.`,
          },
        }
      } catch (error) {
        if (error instanceof BedrockConnectionMissingError) return bedrockConnectionErrorResult()
        return { ok: false, error: error instanceof Error ? error.message : 'Could not read the receipt list.' }
      }
    },
  }
}

export const getReceiptsNeedingAttribution: Tool<GetReceiptsNeedingAttributionInput> =
  makeGetReceiptsNeedingAttribution()
