import 'server-only'

import {
  createBedrockAdapter,
  createBedrockWriteProvider,
  BedrockConnectionMissingError,
} from '@/lib/domain-adapters/bedrock'
import { resolveJob } from '../read/find-job'
import type { Tool } from '../types'
import { installedItemDataQuality, resolveVendorFromList } from './_materials-helpers'

/**
 * Record what physically went into a house, from a photo of its data plate.
 *
 * WHAT THIS IS FOR
 *
 * At close-out somebody has to say which water heater is in the house, who
 * made it, and what its model number is — for warranty claims, for spares,
 * and for the owner's manual pack. Today that lives in a phone gallery. A
 * crew member photographing a data plate on the wall is the only step anybody
 * will reliably do, so this turns that photo into a record.
 *
 * NEVER INVENT A MODEL OR SERIAL NUMBER
 *
 * This is the rule the whole tool is built around. A model number is used to
 * order a replacement part; a wrong one sends the wrong part to an island,
 * costs a freight cycle, and is discovered weeks later. A blank field says
 * "go look at the plate again", which is cheap. So anything not legible is
 * left out, and `data_quality` is computed from what is actually present
 * rather than declared by the caller:
 *
 *   complete    — manufacturer and model, plus a serial where one is expected
 *   partial     — identified, but plate data is missing
 *   placeholder — neither manufacturer nor model
 *
 * CREATE OR COMPLETE
 *
 * A second, clearer photo of the same plate should finish the record rather
 * than create a rival one. Passing `installed_item_id` routes to
 * `completeInstalledItem`, which is one of exactly two update paths in
 * `BedrockWriteProvider` (see that class's comment) and only fills fields
 * that are still NULL. A field that already holds a DIFFERENT value is not
 * overwritten — that is two people disagreeing about a serial number, and it
 * comes back as a conflict for a person to settle. No money column is
 * reachable from either path.
 */

export interface RecordInstalledItemInput {
  installed_item_id?: string
  project?: string
  description?: string
  manufacturer?: string
  model_no?: string
  serial_no?: string
  tag?: string
  location?: string
  install_date?: string
  finish_color?: string
  size_spec?: string
  quantity?: number
  unit?: string
  vendor?: string
  warranty_months?: number
  serial_expected?: boolean
  notes?: string
}

export interface RecordInstalledItemDeps {
  getWriteProvider: typeof createBedrockWriteProvider
  getAdapter: typeof createBedrockAdapter
  resolveJobBy: typeof resolveJob
}

export function makeRecordInstalledItem(deps: Partial<RecordInstalledItemDeps> = {}): Tool<RecordInstalledItemInput> {
  const getWriteProvider = deps.getWriteProvider ?? createBedrockWriteProvider
  const getAdapter = deps.getAdapter ?? createBedrockAdapter
  const resolveJobBy = deps.resolveJobBy ?? resolveJob

  return {
    name: 'record_installed_item',
    description:
      'Record a piece of equipment installed in a house — water heater, AC unit, door, fixture — from a ' +
      'photo of its data plate or from what somebody tells you. Fill in ONLY what is actually legible. ' +
      'Never guess or complete a model or serial number: a wrong one gets the wrong part ordered, which ' +
      'is worse than a blank field. Pass installed_item_id to finish a record that already exists. This ' +
      'writes to the construction ledger, so it is staged for explicit confirmation first.',
    risk: 'high',
    roles: ['owner', 'staff', 'founder'],
    modes: ['back-office'],
    inputSchema: {
      type: 'object',
      properties: {
        installed_item_id: { type: 'string', description: 'Only when finishing a record that already exists. Omit to create a new one.' },
        project: { type: 'string', description: 'Which house, however it was named. Required when creating.' },
        description: { type: 'string', description: 'What the thing is, e.g. "50 gal electric water heater". Required when creating.' },
        manufacturer: { type: 'string', description: 'Maker, exactly as printed on the plate. Omit if not legible.' },
        model_no: { type: 'string', description: 'Model number exactly as printed. Omit if not fully legible — never complete a partial one.' },
        serial_no: { type: 'string', description: 'Serial exactly as printed. Omit if not fully legible — never complete a partial one.' },
        tag: { type: 'string', description: 'Schedule mark, e.g. "D01", "WH-1". Omit if none.' },
        location: { type: 'string', description: 'Where in the house it is, e.g. "utility room", "master ensuite".' },
        install_date: { type: 'string', description: 'When it went in, YYYY-MM-DD. Omit if unknown.' },
        finish_color: { type: 'string', description: 'Finish or colour, when it matters for matching later.' },
        size_spec: { type: 'string', description: 'Size or capacity, e.g. "50 gal", "36x80".' },
        quantity: { type: 'number', description: 'How many, when more than one identical unit.' },
        unit: { type: 'string', description: 'Unit for quantity, e.g. "ea".' },
        vendor: { type: 'string', description: 'Who supplied it, as named. Omit if unknown.' },
        warranty_months: { type: 'number', description: 'Warranty length in months, if stated.' },
        serial_expected: {
          type: 'boolean',
          description:
            'True for equipment that carries a serial (appliances, HVAC, water heaters). False for things ' +
            'that do not (a door, a tile). Decides whether a missing serial keeps the record short of complete.',
        },
        notes: { type: 'string', description: 'Anything else worth recording, including what was unreadable.' },
      },
      required: [],
    },

    async execute(args, ctx) {
      if (args.install_date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(args.install_date)) {
        return { ok: false, error: 'install_date must be YYYY-MM-DD.' }
      }
      if (args.quantity !== undefined && (!Number.isFinite(args.quantity) || args.quantity <= 0)) {
        return { ok: false, error: 'Quantity has to be a positive number. Leave it out if you are not sure.' }
      }
      if (args.warranty_months !== undefined && (!Number.isInteger(args.warranty_months) || args.warranty_months <= 0)) {
        return { ok: false, error: 'Warranty length has to be a whole number of months. Leave it out if it is not stated.' }
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

      let vendorId: string | null = null
      let vendorNote: string | null = null
      if (args.vendor?.trim()) {
        try {
          const resolved = resolveVendorFromList(await adapter.listVendors(ctx.workspaceId, { limit: 500 }), args.vendor)
          vendorId = resolved.vendorId
          vendorNote = resolved.note
        } catch {
          vendorNote = 'Could not check the vendor list, so no supplier was attached.'
        }
      }

      const dataQuality = installedItemDataQuality({
        manufacturer: args.manufacturer?.trim() || null,
        modelNo: args.model_no?.trim() || null,
        serialNo: args.serial_no?.trim() || null,
        serialExpected: args.serial_expected ?? false,
      })

      // FINISH AN EXISTING RECORD
      if (args.installed_item_id?.trim()) {
        const result = await write.provider.completeInstalledItem(write.companyId, args.installed_item_id, {
          manufacturer: args.manufacturer?.trim() || undefined,
          model_no: args.model_no?.trim() || undefined,
          serial_no: args.serial_no?.trim() || undefined,
          tag: args.tag?.trim() || undefined,
          location: args.location?.trim() || undefined,
          install_date: args.install_date || undefined,
          finish_color: args.finish_color?.trim() || undefined,
          size_spec: args.size_spec?.trim() || undefined,
          quantity: args.quantity,
          unit: args.unit?.trim() || undefined,
          vendor_id: vendorId ?? undefined,
          warranty_months: args.warranty_months,
          notes: args.notes?.trim() || undefined,
          data_quality: dataQuality,
        })

        if (result.conflicts.length > 0) {
          return {
            ok: false,
            error:
              `That record already says ${result.conflicts
                .map(c => `${c.field.replace(/_/g, ' ')} is "${String(c.existing)}"`)
                .join(', ')}, not what this photo shows. Nothing was changed. Somebody needs to look at the plate and say which is right — I will not overwrite one with the other.`,
          }
        }
        if (!result.ok && result.attemptedCount > 0) {
          return { ok: false, error: `Nothing was changed. ${result.failedRows.map(f => f.error).join('; ')}` }
        }

        return {
          ok: true,
          data: {
            installed_item_id: args.installed_item_id,
            filled: result.filledFields,
            data_quality: dataQuality,
            vendor_note: vendorNote,
            audit_recorded: result.auditLogWritten,
            note: result.filledFields.length
              ? `Filled in ${result.filledFields.map(f => f.replace(/_/g, ' ')).join(', ')}. The record is now ${dataQuality}.`
              : 'That record already had everything this photo shows. Nothing changed.',
          },
        }
      }

      // CREATE A NEW RECORD
      const description = args.description?.trim()
      if (!description) return { ok: false, error: 'What is it? An installed item needs a description — "50 gal electric water heater".' }
      if (!args.project?.trim()) return { ok: false, error: 'Which house is this in? An installed item has to name a job.' }

      let job
      try {
        job = await resolveJobBy(adapter, ctx.workspaceId, args.project)
      } catch {
        return { ok: false, error: 'Could not check the job list, so nothing was recorded. Try again shortly.' }
      }
      if (job.match === 'none') {
        return { ok: false, error: `No job matched "${args.project}", so nothing was recorded. What is the house called?` }
      }
      if (job.match === 'many') {
        return {
          ok: false,
          error: `"${args.project}" matches ${job.count} jobs (${job.candidates.map(c => c.name).join(', ')}). Which one?`,
        }
      }
      const project = job.candidates[0]

      const result = await write.provider.insertInstalledItem(write.companyId, {
        project_id: project.id,
        material_id: null,
        description,
        tag: args.tag?.trim() || null,
        location: args.location?.trim() || null,
        quantity: args.quantity ?? null,
        unit: args.unit?.trim() || null,
        manufacturer: args.manufacturer?.trim() || null,
        model_no: args.model_no?.trim() || null,
        serial_no: args.serial_no?.trim() || null,
        finish_color: args.finish_color?.trim() || null,
        size_spec: args.size_spec?.trim() || null,
        vendor_id: vendorId,
        install_date: args.install_date || null,
        warranty_months: args.warranty_months ?? null,
        // Deliberately null: this tool does not store the plate photo. Storing
        // it would need a document path, and inventing one would be a claim
        // that a file exists somewhere when it does not.
        spec_sheet_path: null,
        photo_path: null,
        data_quality: dataQuality,
        notes: args.notes?.trim() || null,
        company_id: write.companyId,
      })

      if (!result.ok) {
        return { ok: false, error: `Nothing was recorded. ${result.failedRows.map(f => f.error).join('; ')}` }
      }

      const missing = [
        args.manufacturer?.trim() ? null : 'manufacturer',
        args.model_no?.trim() ? null : 'model number',
        (args.serial_expected ?? false) && !args.serial_no?.trim() ? 'serial number' : null,
        args.location?.trim() ? null : 'location',
        args.install_date ? null : 'install date',
      ].filter(Boolean)

      return {
        ok: true,
        data: {
          installed_item_id: result.insertedIds[0] ?? null,
          project_id: project.id,
          project_name: project.name,
          description,
          data_quality: dataQuality,
          not_recorded: missing,
          vendor_note: vendorNote,
          audit_recorded: result.auditLogWritten,
          note: missing.length
            ? `Recorded on ${project.name} as ${dataQuality}. Still missing: ${missing.join(', ')}. Another photo of the plate can fill those in.`
            : `Recorded on ${project.name}. The plate data is complete.`,
        },
      }
    },
  }
}

export const recordInstalledItem: Tool<RecordInstalledItemInput> = makeRecordInstalledItem()
