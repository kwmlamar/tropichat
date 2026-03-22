"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Plus, 
  PencilSimple as Pencil, 
  Trash, 
  Clock, 
  Users, 
  CurrencyDollar as DollarSign, 
  ToggleLeft, 
  ToggleRight, 
  CaretDown as ChevronDown, 
  CaretUp as ChevronUp, 
  X, 
  Check, 
  Palette, 
  CaretLeft as ArrowLeft,
  CircleNotch
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  const [priceType, setPriceType] = useState<'per_person' | 'fixed'>(initial?.price_type ?? 'per_person')
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
      price_type: priceType,
      color,
    })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5 bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-100 dark:border-[#222222] shadow-sm">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-[10px] font-black uppercase tracking-widest text-[#3A9B9F] mb-2 ml-1">Service Name *</label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Sunset Cruise"
            required
          />
        </div>
        <div className="col-span-2">
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 ml-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Short description of the tour…"
            rows={2}
            className="w-full rounded-xl border border-gray-100 dark:border-[#222222] bg-gray-50 dark:bg-[#111111] px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none focus:outline-none focus:ring-4 focus:ring-[#3A9B9F]/10 focus:border-[#3A9B9F] transition-all"
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
          <div className="flex gap-2">
            <Input type="number" min="0" step="0.01" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} className="flex-1" />
            <select
              value={priceType}
              onChange={e => setPriceType(e.target.value as 'per_person' | 'fixed')}
              className="rounded-xl border border-gray-100 dark:border-[#222222] bg-white dark:bg-[#0A0A0A] px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#3A9B9F]/20"
            >
              <option value="per_person">/ person</option>
              <option value="fixed">fixed total</option>
            </select>
          </div>
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
    <form onSubmit={handleSubmit} className="space-y-4 p-5 bg-[#F8FAFB] dark:bg-black rounded-2xl border border-gray-100 dark:border-[#222222] mt-4 shadow-inner">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#3A9B9F]">New Availability Slot</p>

      {/* Recurring vs one-time */}
      <div className="flex bg-gray-100 dark:bg-[#0A0A0A] p-1 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setIsRecurring(true)}
          className={cn("px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
            isRecurring ? "bg-[#3A9B9F] text-white shadow-md" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          )}
        >
          Weekly
        </button>
        <button
          type="button"
          onClick={() => setIsRecurring(false)}
          className={cn("px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
            !isRecurring ? "bg-[#3A9B9F] text-white shadow-md" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          )}
        >
          One-time
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {isRecurring ? (
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 ml-1">Day of Week</label>
            <select
              value={dayOfWeek}
              onChange={e => setDayOfWeek(Number(e.target.value))}
              className="w-full h-12 rounded-xl border border-gray-100 dark:border-[#222222] px-4 text-sm font-bold bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-[#3A9B9F]/10 transition-all appearance-none"
            >
              {DAY_LABELS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 ml-1">Date</label>
            <input
              type="date"
              value={specificDate}
              onChange={e => setSpecificDate(e.target.value)}
              required={!isRecurring}
              className="w-full h-12 rounded-xl border border-gray-100 dark:border-[#222222] px-4 text-sm font-bold bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-[#3A9B9F]/10 transition-all"
            />
          </div>
        )}

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 ml-1">Capacity</label>
          <Input
            type="number"
            min="1"
            value={maxBookings}
            onChange={e => setMaxBookings(e.target.value)}
            className="h-12 rounded-xl"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 ml-1">Start</label>
          <input
            type="time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            className="w-full h-12 rounded-xl border border-gray-100 dark:border-[#222222] px-4 text-sm font-bold bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-[#3A9B9F]/10 transition-all"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 ml-1">End</label>
          <input
            type="time"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            className="w-full h-12 rounded-xl border border-gray-100 dark:border-[#222222] px-4 text-sm font-bold bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-[#3A9B9F]/10 transition-all"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving} className="flex-1 bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-xl h-12 font-bold shadow-lg shadow-teal-500/10">
          <Check className="h-4 w-4 mr-2" />
          {saving ? 'Adding...' : 'Add Slot'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="bg-white dark:bg-[#0A0A0A] rounded-xl h-12 px-6 font-bold border-gray-100 dark:border-[#222222]">Cancel</Button>
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
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener("resize", check); return () => window.removeEventListener("resize", check)
  }, [])

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

  const router = useRouter()

  useEffect(() => {
    document.body.classList.add("bottom-nav-hidden")
    return () => {
      document.body.classList.remove("bottom-nav-hidden")
    }
  }, [])

  const handleBack = () => {
    if (window.history.length > 2) {
      router.back()
    } else {
      router.push('/dashboard/bookings')
    }
  }

  // ── Mobile ─────────────────────────────────────────────────────────────────
  if (isMobile) return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#F8FAFB] dark:bg-black overflow-hidden">
      {/* Mobile Header */}
      <div className="flex items-center gap-4 px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-3 border-b border-gray-100 dark:border-[#1C1C1C] bg-white dark:bg-[#0A0A0A]">
        <button 
          onClick={handleBack}
          className="h-9 w-9 flex shrink-0 items-center justify-center bg-gray-100 dark:bg-[#111] rounded-xl text-gray-400 hover:text-[#3A9B9F] transition-all active:scale-95"
        >
          <ArrowLeft weight="bold" className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-[18px] font-bold text-[#213138] dark:text-gray-100 tracking-tight font-[family-name:var(--font-poppins)] leading-none">Services</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <CircleNotch weight="bold" className="h-8 w-8 animate-spin text-[#3A9B9F]" />
          </div>
        ) : services.length === 0 && !addingService ? (
          <div className="text-center py-20 text-gray-400">
            <Clock weight="regular" className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No services yet</p>
            <p className="text-sm mt-1">Add your first tour or activity below</p>
          </div>
        ) : (
          <div className="space-y-3 pb-24">
            {addingService && (
              <ServiceForm
                onSave={handleAddService}
                onCancel={() => setAddingService(false)}
              />
            )}
            {services.map(service => {
              const expanded = expandedServiceId === service.id
              const editing  = editingServiceId === service.id
              const serviceSlots = slotsForService(service.id)

              return (
                <div key={service.id} className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-100 dark:border-[#222222] overflow-hidden shadow-sm">
                  {/* Service header */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: service.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-gray-100 text-[13px] tracking-tight truncate">{service.name}</p>
                      <p className="text-[11px] text-gray-400">
                        {service.duration_minutes}m · max {service.max_capacity}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleToggleActive(service)} className="p-1.5 text-gray-400">
                        {service.active ? <ToggleRight weight="bold" className="h-6 w-6 text-[#3A9B9F]" /> : <ToggleLeft weight="bold" className="h-6 w-6" />}
                      </button>
                      <button onClick={() => setEditingServiceId(editing ? null : service.id)} className="p-1.5 text-gray-400">
                        <Pencil weight="regular" className="h-4 w-4" />
                      </button>
                      <button onClick={() => setExpandedServiceId(expanded ? null : service.id)} className="p-1.5 text-gray-400">
                        {expanded ? <ChevronUp weight="bold" className="h-4 w-4" /> : <ChevronDown weight="bold" className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {editing && (
                    <div className="px-4 pb-4">
                      <ServiceForm
                        initial={{ ...service, description: service.description ?? undefined, price: service.price ?? undefined }}
                        onSave={(data) => handleUpdateService(service.id, data)}
                        onCancel={() => setEditingServiceId(null)}
                      />
                    </div>
                  )}

                  {expanded && !editing && (
                    <div className="border-t border-gray-100 dark:border-[#222222] px-4 py-4 bg-gray-50/50 dark:bg-[#111111]/30">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Availability Slots</p>
                        <button
                          onClick={() => setAddingSlotForService(addingSlotForService === service.id ? null : service.id)}
                          className="text-xs text-[#3A9B9F] font-bold flex items-center gap-1.5"
                        >
                          <Plus weight="bold" className="h-4 w-4" /> Add
                        </button>
                      </div>

                      {addingSlotForService === service.id && (
                        <SlotForm serviceId={service.id} onSave={handleAddSlot} onCancel={() => setAddingSlotForService(null)} />
                      )}

                      <div className="space-y-1.5">
                        {serviceSlots.map(slot => (
                          <div key={slot.id} className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold", slot.is_available ? "bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-[#222222] text-gray-600 dark:text-gray-300" : "opacity-40 line-through")}>
                            <Clock weight="regular" className="h-3.5 w-3.5 text-gray-400" />
                            <span className="flex-1">{formatSlotLabel(slot)}</span>
                            <button onClick={() => handleToggleSlot(slot)} className="p-1">{slot.is_available ? <ToggleRight weight="bold" className="h-5 w-5 text-[#3A9B9F]" /> : <ToggleLeft weight="bold" className="h-5 w-5" />}</button>
                            <button onClick={() => handleDeleteSlot(slot)} className="p-1"><X weight="bold" className="h-3.5 w-3.5" /></button>
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

      <div className="p-4 safe-area-bottom border-t border-gray-100 dark:border-[#1C1C1C] bg-white dark:bg-[#0A0A0A]">
        <button 
          onClick={() => {
            setAddingService(true)
            setTimeout(() => {
              const form = document.querySelector('form')
              form?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
          }}
          className="w-full h-12 bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-2xl font-bold text-[15px] shadow-lg shadow-teal-500/10 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Plus weight="bold" className="h-5 w-5" />
          Add Service
        </button>
      </div>
    </div>
  )

  // ── Desktop ────────────────────────────────────────────────────────────────
  return (
    <div className="h-full bg-[#F8FAFB] dark:bg-black flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBack}
              className="h-10 w-10 flex shrink-0 items-center justify-center bg-white dark:bg-[#0A0A0A] rounded-xl border border-gray-100 dark:border-[#222222] text-gray-400 hover:text-[#3A9B9F] transition-all"
            >
                <ArrowLeft weight="bold" className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-[#213138] dark:text-gray-100 tracking-tight font-[family-name:var(--font-poppins)] leading-none mb-1">Services</h1>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Configure your tours and availability</p>
            </div>
          </div>
          <Button
            onClick={() => setAddingService(true)}
            className="bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-xl"
          >
            <Plus weight="bold" className="h-4 w-4 mr-1.5" />
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
                <div key={service.id} className="bg-white dark:bg-[#0A0A0A] rounded-3xl border border-gray-100 dark:border-[#222222] overflow-hidden shadow-sm">
                  {/* Service header */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: service.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 dark:text-gray-100 text-sm tracking-tight">{service.name}</p>
                        {!service.active && (
                          <span className="text-[9px] font-black uppercase tracking-widest bg-gray-100 dark:bg-[#111111] text-gray-400 dark:text-gray-500 px-2.5 py-1 rounded-lg">Inactive</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {service.duration_minutes} min · max {service.max_capacity} people
                        {service.price ? ` · $${service.price}${service.price_type === 'per_person' ? '/person' : ' total'}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Active toggle */}
                      <button
                        onClick={() => handleToggleActive(service)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#111111] transition-colors text-gray-400"
                        title={service.active ? 'Deactivate' : 'Activate'}
                      >
                        {service.active
                          ? <ToggleRight className="h-5 w-5 text-[#3A9B9F]" />
                          : <ToggleLeft className="h-5 w-5" />
                        }
                      </button>
                      <button
                        onClick={() => setEditingServiceId(editing ? null : service.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#111111] transition-colors text-gray-400"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-gray-400 hover:text-red-500"
                        title="Archive"
                      >
                        <Trash weight="regular" className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setExpandedServiceId(expanded ? null : service.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#111111] transition-colors text-gray-400"
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
                    <div className="border-t border-gray-100 dark:border-[#222222] px-6 py-5 bg-gray-50/30 dark:bg-[#111111]/30">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                          Availability Slots
                        </p>
                        <button
                          onClick={() => setAddingSlotForService(addingSlotForService === service.id ? null : service.id)}
                          className="text-xs text-[#3A9B9F] font-bold hover:underline flex items-center gap-1.5 transition-all"
                        >
                          <Plus className="h-4 w-4" />
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
                              "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                              slot.is_available ? "bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-[#222222] text-gray-600 dark:text-gray-300 shadow-sm" : "bg-red-50/50 dark:bg-red-950/10 text-red-500/50 dark:text-red-500/30 line-through"
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

      {isMobile && (
        <div className="p-4 safe-area-bottom border-t border-gray-100 dark:border-[#1C1C1C] bg-white dark:bg-[#0A0A0A] mt-auto">
          <button 
            onClick={() => {
              setAddingService(true)
              setTimeout(() => {
                const form = document.querySelector('form')
                form?.scrollIntoView({ behavior: 'smooth' })
              }, 100)
            }}
            className="w-full h-12 bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-xl font-bold text-[14px] shadow-lg shadow-teal-500/10 flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        </div>
      )}
    </div>
  )
}
