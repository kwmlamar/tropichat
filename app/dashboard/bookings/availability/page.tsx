"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, Clock, Users, DollarSign, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, X, Check, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  getServices, createService, updateService, deleteService,
  getAvailabilitySlots, createAvailabilitySlot, updateAvailabilitySlot, deleteAvailabilitySlot,
} from "@/lib/bookings"
import type { BookingService, AvailabilitySlot, CreateServiceInput, CreateAvailabilitySlotInput } from "@/types/bookings"
import { DAY_LABELS } from "@/types/bookings"
import { toast } from "sonner"

const PRESET_COLORS = [
  '#3A9B9F', '#FF8B66', '#7C3AED', '#10B981', '#F59E0B',
  '#EF4444', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6',
]

// ============================================================
// Service form
// ============================================================
function ServiceForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<CreateServiceInput & { id: string; active: boolean }>
  onSave: (data: CreateServiceInput & { active?: boolean }) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [duration, setDuration] = useState(String(initial?.duration_minutes ?? 60))
  const [capacity, setCapacity] = useState(String(initial?.max_capacity ?? 10))
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : '')
  const [color, setColor] = useState(initial?.color ?? '#3A9B9F')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !duration || !capacity) { toast.error('Name, duration and capacity are required'); return }
    setSaving(true)
    await onSave({
      name,
      description: description || undefined,
      duration_minutes: parseInt(duration),
      max_capacity: parseInt(capacity),
      price: price ? parseFloat(price) : undefined,
      color,
    })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Service Name *</label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Sunset Cruise"
            required
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Short description of the tour…"
            rows={2}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#3A9B9F]/40 focus:border-[#3A9B9F]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Duration (minutes) *</label>
          <Input type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Max Capacity *</label>
          <Input type="number" min="1" value={capacity} onChange={e => setCapacity(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            <DollarSign className="h-3 w-3 inline" /> Price (display only)
          </label>
          <Input type="number" min="0" step="0.01" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            <Palette className="h-3 w-3 inline mr-1" />Color
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "h-6 w-6 rounded-full border-2 transition-transform",
                  color === c ? "border-gray-800 scale-110" : "border-transparent"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="bg-[#3A9B9F] hover:bg-[#2F8488] text-white">
          <Check className="h-4 w-4 mr-1" />
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

// ============================================================
// Availability slot form
// ============================================================
function SlotForm({
  serviceId,
  onSave,
  onCancel,
}: {
  serviceId: string
  onSave: (data: CreateAvailabilitySlotInput) => Promise<void>
  onCancel: () => void
}) {
  const [isRecurring, setIsRecurring] = useState(true)
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [specificDate, setSpecificDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [maxBookings, setMaxBookings] = useState('1')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave({
      service_id: serviceId,
      is_recurring: isRecurring,
      day_of_week: isRecurring ? dayOfWeek : undefined,
      specific_date: !isRecurring ? specificDate : undefined,
      start_time: startTime,
      end_time: endTime,
      max_bookings: parseInt(maxBookings) || 1,
    })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 bg-blue-50 rounded-xl border border-blue-200 mt-2">
      <p className="text-xs font-semibold text-blue-800">New Availability Slot</p>

      {/* Recurring vs one-time */}
      <div className="flex rounded-lg overflow-hidden border border-blue-200 w-fit">
        <button
          type="button"
          onClick={() => setIsRecurring(true)}
          className={cn("px-3 py-1.5 text-xs font-medium transition-colors",
            isRecurring ? "bg-[#3A9B9F] text-white" : "bg-white text-gray-600 hover:bg-gray-50"
          )}
        >
          Weekly (recurring)
        </button>
        <button
          type="button"
          onClick={() => setIsRecurring(false)}
          className={cn("px-3 py-1.5 text-xs font-medium transition-colors",
            !isRecurring ? "bg-[#3A9B9F] text-white" : "bg-white text-gray-600 hover:bg-gray-50"
          )}
        >
          One-time date
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {isRecurring ? (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Day of Week</label>
            <select
              value={dayOfWeek}
              onChange={e => setDayOfWeek(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3A9B9F]/40"
            >
              {DAY_LABELS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={specificDate}
              onChange={e => setSpecificDate(e.target.value)}
              required={!isRecurring}
              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A9B9F]/40"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Max simultaneous bookings</label>
          <Input
            type="number"
            min="1"
            value={maxBookings}
            onChange={e => setMaxBookings(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Start time</label>
          <input
            type="time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A9B9F]/40"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">End time</label>
          <input
            type="time"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A9B9F]/40"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="bg-[#3A9B9F] hover:bg-[#2F8488] text-white text-xs h-8">
          <Check className="h-3.5 w-3.5 mr-1" />
          {saving ? 'Saving…' : 'Add Slot'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="text-xs h-8">Cancel</Button>
      </div>
    </form>
  )
}

// ============================================================
// Main page
// ============================================================
export default function AvailabilityPage() {
  const [services, setServices] = useState<BookingService[]>([])
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)

  const [addingService, setAddingService] = useState(false)
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null)
  const [addingSlotForService, setAddingSlotForService] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [{ data: s }, { data: sl }] = await Promise.all([
      getServices(false),
      getAvailabilitySlots(),
    ])
    setServices(s)
    setSlots(sl)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ---- SERVICE ACTIONS ----
  const handleAddService = async (data: CreateServiceInput) => {
    const { data: s, error } = await createService(data)
    if (error || !s) { toast.error(error ?? 'Failed to create'); return }
    setServices(prev => [...prev, s])
    setAddingService(false)
    toast.success(`"${s.name}" added`)
    setExpandedServiceId(s.id)
  }

  const handleUpdateService = async (id: string, data: Partial<CreateServiceInput & { active: boolean }>) => {
    const { data: s, error } = await updateService(id, data)
    if (error || !s) { toast.error(error ?? 'Failed to update'); return }
    setServices(prev => prev.map(sv => sv.id === id ? s : sv))
    setEditingServiceId(null)
    toast.success('Service updated')
  }

  const handleToggleActive = async (service: BookingService) => {
    const { data: s, error } = await updateService(service.id, { active: !service.active })
    if (error || !s) { toast.error(error ?? 'Failed'); return }
    setServices(prev => prev.map(sv => sv.id === service.id ? s : sv))
    toast.success(s.active ? 'Service activated' : 'Service deactivated')
  }

  const handleDeleteService = async (service: BookingService) => {
    if (!confirm(`Archive "${service.name}"? Existing bookings will be preserved.`)) return
    const { error } = await deleteService(service.id)
    if (error) { toast.error(error); return }
    setServices(prev => prev.filter(s => s.id !== service.id))
    toast.success('Service archived')
  }

  // ---- SLOT ACTIONS ----
  const handleAddSlot = async (data: CreateAvailabilitySlotInput) => {
    const { data: slot, error } = await createAvailabilitySlot(data)
    if (error || !slot) { toast.error(error ?? 'Failed'); return }
    setSlots(prev => [...prev, slot])
    setAddingSlotForService(null)
    toast.success('Availability slot added')
  }

  const handleToggleSlot = async (slot: AvailabilitySlot) => {
    const { data: updated, error } = await updateAvailabilitySlot(slot.id, { is_available: !slot.is_available })
    if (error || !updated) { toast.error(error ?? 'Failed'); return }
    setSlots(prev => prev.map(s => s.id === slot.id ? updated : s))
  }

  const handleDeleteSlot = async (slot: AvailabilitySlot) => {
    const { error } = await deleteAvailabilitySlot(slot.id)
    if (error) { toast.error(error); return }
    setSlots(prev => prev.filter(s => s.id !== slot.id))
    toast.success('Slot removed')
  }

  const slotsForService = (serviceId: string) => slots.filter(s => s.service_id === serviceId)

  const formatSlotLabel = (slot: AvailabilitySlot) => {
    const t = (s: string) => {
      const [h, m] = s.split(':').map(Number)
      return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`
    }
    if (slot.is_recurring && slot.day_of_week !== null) {
      return `${DAY_LABELS[slot.day_of_week]}s · ${t(slot.start_time)} – ${t(slot.end_time)}`
    }
    const d = new Date(slot.specific_date! + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
    return `${d} · ${t(slot.start_time)} – ${t(slot.end_time)}`
  }

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Availability & Services</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your tours and when they run</p>
          </div>
          <Button
            onClick={() => setAddingService(true)}
            className="bg-[#3A9B9F] hover:bg-[#2F8488] text-white"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Service
          </Button>
        </div>

        {/* Add service form */}
        {addingService && (
          <ServiceForm
            onSave={handleAddService}
            onCancel={() => setAddingService(false)}
          />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3A9B9F] border-t-transparent" />
          </div>
        ) : services.length === 0 && !addingService ? (
          <div className="text-center py-20 text-gray-400">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No services yet</p>
            <p className="text-sm mt-1">Add your first tour or activity above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map(service => {
              const expanded = expandedServiceId === service.id
              const editing  = editingServiceId === service.id
              const serviceSlots = slotsForService(service.id)

              return (
                <div key={service.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {/* Service header */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: service.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{service.name}</p>
                        {!service.active && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {service.duration_minutes} min · max {service.max_capacity} people
                        {service.price ? ` · $${service.price}/person` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Active toggle */}
                      <button
                        onClick={() => handleToggleActive(service)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
                        title={service.active ? 'Deactivate' : 'Activate'}
                      >
                        {service.active
                          ? <ToggleRight className="h-5 w-5 text-[#3A9B9F]" />
                          : <ToggleLeft className="h-5 w-5" />
                        }
                      </button>
                      <button
                        onClick={() => setEditingServiceId(editing ? null : service.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
                        title="Archive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setExpandedServiceId(expanded ? null : service.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
                      >
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Edit form */}
                  {editing && (
                    <div className="px-4 pb-4">
                      <ServiceForm
                        initial={{ ...service, description: service.description ?? undefined, price: service.price ?? undefined }}
                        onSave={(data) => handleUpdateService(service.id, data)}
                        onCancel={() => setEditingServiceId(null)}
                      />
                    </div>
                  )}

                  {/* Expanded: availability slots */}
                  {expanded && !editing && (
                    <div className="border-t border-gray-100 px-4 py-3">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Availability Slots
                        </p>
                        <button
                          onClick={() => setAddingSlotForService(addingSlotForService === service.id ? null : service.id)}
                          className="text-xs text-[#3A9B9F] font-medium hover:underline flex items-center gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add slot
                        </button>
                      </div>

                      {addingSlotForService === service.id && (
                        <SlotForm
                          serviceId={service.id}
                          onSave={handleAddSlot}
                          onCancel={() => setAddingSlotForService(null)}
                        />
                      )}

                      {serviceSlots.length === 0 && addingSlotForService !== service.id && (
                        <p className="text-xs text-gray-400 italic">
                          No slots defined yet — add one to enable bookings for this service.
                        </p>
                      )}

                      <div className="space-y-1.5 mt-2">
                        {serviceSlots.map(slot => (
                          <div
                            key={slot.id}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg text-xs",
                              slot.is_available ? "bg-gray-50" : "bg-red-50 opacity-70"
                            )}
                          >
                            <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span className={cn("flex-1", !slot.is_available && "line-through text-gray-400")}>
                              {formatSlotLabel(slot)}
                            </span>
                            <span className="text-gray-400">×{slot.max_bookings}</span>
                            <button
                              onClick={() => handleToggleSlot(slot)}
                              title={slot.is_available ? 'Block this slot' : 'Unblock'}
                              className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
                            >
                              {slot.is_available
                                ? <ToggleRight className="h-4 w-4 text-[#3A9B9F]" />
                                : <ToggleLeft className="h-4 w-4" />
                              }
                            </button>
                            <button
                              onClick={() => handleDeleteSlot(slot)}
                              className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
