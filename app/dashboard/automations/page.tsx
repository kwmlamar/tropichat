"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  Lightning as Zap,
  DotsThreeVertical as MoreVertical,
  PencilSimple as Edit2,
  Trash as Trash2,
  ChatCircleDots as MessageSquare,
  Clock,
  User,
  ArrowRight,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Modal, ModalFooter } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SimpleSelect } from "@/components/ui/dropdown"
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getAutomations,
  createAutomation,
  updateAutomation,
  deleteAutomation,
  getCurrentCustomer,
} from "@/lib/supabase"
import { formatDistanceToNow, cn } from "@/lib/utils"
import { toast } from "sonner"
import { motion } from "framer-motion"
import type { AutomationRule, TriggerType, ActionType } from "@/types/database"

const triggerOptions = [
  { value: "keyword",          label: "Keyword Match"         },
  { value: "new_conversation", label: "New Conversation"      },
  { value: "business_hours",   label: "During Business Hours" },
  { value: "after_hours",      label: "After Business Hours"  },
  { value: "all_messages",     label: "All Messages"          },
]

const actionOptions = [
  { value: "send_message",  label: "Send Message"           },
  { value: "send_template", label: "Send Template"          },
  { value: "add_tag",       label: "Add Tag"                },
  { value: "mark_resolved", label: "Mark as Resolved"       },
]

// ─── Trigger icon map ─────────────────────────────────────────────────────────
function TriggerIcon({ type }: { type: TriggerType }) {
  const cls = "h-4 w-4"
  switch (type) {
    case "keyword":          return <MessageSquare weight="bold" className={cls} />
    case "new_conversation": return <User          weight="bold" className={cls} />
    case "business_hours":
    case "after_hours":      return <Clock         weight="bold" className={cls} />
    default:                 return <Zap           weight="bold" className={cls} />
  }
}

function getTriggerLabel(type: TriggerType, value: string | null) {
  switch (type) {
    case "keyword":          return `"${value}"`
    case "new_conversation": return "New conversation"
    case "business_hours":   return "Business hours"
    case "after_hours":      return "After hours"
    case "all_messages":     return "All messages"
    default:                 return type
  }
}

function getActionLabel(type: ActionType, value: string) {
  switch (type) {
    case "send_message":  return value.substring(0, 60) + (value.length > 60 ? "…" : "")
    case "send_template": return `Template: ${value}`
    case "add_tag":       return `Tag: ${value}`
    case "mark_resolved": return "Mark resolved"
    default:              return value
  }
}

// ─── Automation card ──────────────────────────────────────────────────────────
// The IF → THEN pipeline is the identity of this page.
// Each connector is a distinct visual affordance, NOT just text.
function AutomationCard({
  automation,
  onToggle,
  onEdit,
  onDelete,
}: {
  automation: AutomationRule
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const active = automation.is_enabled

  return (
    <div
      className={cn(
        "group bg-white dark:bg-[#0C0C0C] border rounded-2xl p-5 transition-all duration-200 hover:border-gray-300 dark:hover:border-[#2A2A2A]",
        active
          ? "border-gray-200 dark:border-[#1C1C1C]"
          : "border-gray-100 dark:border-[#181818] opacity-60"
      )}
    >
      {/* Top row: name + controls */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h3 className="font-semibold text-[15px] text-[#213138] dark:text-white font-[family-name:var(--font-poppins)] truncate">
            {automation.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {active ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3A9B9F]" />
                <span className="text-[10px] font-medium uppercase tracking-widest text-[#3A9B9F]">Active</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-[#333]" />
                <span className="text-[10px] font-medium uppercase tracking-widest text-gray-400 dark:text-[#525252]">Paused</span>
              </span>
            )}
            {automation.times_triggered > 0 && (
              <>
                <span className="text-gray-200 dark:text-[#2A2A2A]">·</span>
                <span className="text-[10px] text-gray-400 dark:text-[#525252] tabular-nums">
                  {automation.times_triggered} runs
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Switch
            checked={active}
            onCheckedChange={onToggle}
            className="data-[state=checked]:bg-[#3A9B9F] scale-90"
          />
          <Dropdown
            align="right"
            trigger={
              <button className="p-1.5 rounded-lg text-gray-400 dark:text-[#525252] hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1C1C1C] transition-colors duration-200 outline-none">
                <MoreVertical weight="bold" className="h-4 w-4" />
              </button>
            }
          >
            <DropdownItem icon={<Edit2 weight="bold" className="h-4 w-4" />} onClick={onEdit}>
              Edit
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem icon={<Trash2 weight="bold" className="h-4 w-4" />} destructive onClick={onDelete}>
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      {/* IF → THEN pipeline — the page's signature element */}
      <div className="space-y-0">
        {/* IF */}
        <div className="flex items-stretch gap-3">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-md bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] flex items-center justify-center shrink-0">
              <span className="text-[9px] font-black text-gray-400 dark:text-[#525252] tracking-widest">IF</span>
            </div>
            {/* connector line */}
            <div className="w-px flex-1 border-l border-dashed border-gray-200 dark:border-[#222] my-1" />
          </div>
          <div className="flex-1 min-w-0 pb-3">
            <p className="text-[10px] font-medium text-gray-400 dark:text-[#525252] uppercase tracking-widest mb-0.5">
              Trigger
            </p>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 dark:text-[#525252]">
                <TriggerIcon type={automation.trigger_type} />
              </span>
              <p className="text-[13px] font-medium text-gray-700 dark:text-[#A3A3A3] truncate">
                {getTriggerLabel(automation.trigger_type, automation.trigger_value)}
              </p>
            </div>
          </div>
        </div>

        {/* THEN */}
        <div className="flex items-stretch gap-3">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-md bg-[#3A9B9F] flex items-center justify-center shrink-0">
              <span className="text-[9px] font-black text-white tracking-widest">DO</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-gray-400 dark:text-[#525252] uppercase tracking-widest mb-0.5">
              Action
            </p>
            <p className="text-[13px] font-medium text-gray-700 dark:text-[#A3A3A3] truncate">
              {getActionLabel(automation.action_type, automation.action_value)}
            </p>
          </div>
        </div>
      </div>

      {/* Last run */}
      {automation.last_triggered_at && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-[#1C1C1C] flex items-center gap-1.5">
          <Clock weight="regular" className="h-3 w-3 text-gray-300 dark:text-[#333]" />
          <span className="text-[11px] text-gray-400 dark:text-[#525252]">
            Last run {formatDistanceToNow(automation.last_triggered_at)} ago
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AutomationsPage() {
  const [automations, setAutomations] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAutomation, setEditingAutomation] = useState<Partial<AutomationRule> | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [customerPlan, setCustomerPlan] = useState<string>("free")
  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const { data: customer } = await getCurrentCustomer()
      if (customer) setCustomerPlan(customer.plan)
      if (customer?.plan === "free") { setLoading(false); return }
      const { data, error } = await getAutomations()
      if (error) toast.error("Failed to load automations")
      else setAutomations(data)
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleCreateAutomation = () => {
    setEditingAutomation({
      name: "", trigger_type: "keyword" as TriggerType,
      trigger_value: "", action_type: "send_message" as ActionType,
      action_value: "", is_enabled: true,
    })
    setIsModalOpen(true)
  }

  const handleToggleAutomation = async (automation: AutomationRule) => {
    const { error } = await updateAutomation(automation.id, { is_enabled: !automation.is_enabled })
    if (error) { toast.error("Failed to update automation"); return }
    setAutomations(prev => prev.map(a => a.id === automation.id ? { ...a, is_enabled: !a.is_enabled } : a))
    toast.success(automation.is_enabled ? "Automation paused" : "Automation enabled")
  }

  const handleSaveAutomation = async () => {
    if (!editingAutomation?.name || !editingAutomation?.action_value) {
      toast.error("Please fill in all required fields"); return
    }
    setIsSaving(true)
    if (editingAutomation.id) {
      const { error } = await updateAutomation(editingAutomation.id, editingAutomation)
      if (error) toast.error("Failed to update automation")
      else {
        setAutomations(prev => prev.map(a => a.id === editingAutomation.id ? { ...a, ...editingAutomation } : a))
        toast.success("Automation updated"); setIsModalOpen(false)
      }
    } else {
      const { data, error } = await createAutomation(editingAutomation as AutomationRule)
      if (error) toast.error("Failed to create automation")
      else if (data) {
        setAutomations(prev => [...prev, data])
        toast.success("Automation created"); setIsModalOpen(false)
      }
    }
    setIsSaving(false)
  }

  const handleDeleteAutomation = async (id: string) => {
    if (!window.confirm("Delete this automation?")) return
    const { error } = await deleteAutomation(id)
    if (error) toast.error("Failed to delete automation")
    else { setAutomations(prev => prev.filter(a => a.id !== id)); toast.success("Deleted") }
  }

  const activeCount = automations.filter(a => a.is_enabled).length
  const totalRuns   = automations.reduce((acc, a) => acc + (a.times_triggered || 0), 0)

  return (
    <div className="p-8 min-h-screen overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6"
        >
          <div>
            <p className="text-[11px] text-gray-400 dark:text-[#525252] uppercase tracking-widest font-medium mb-1.5 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#3A9B9F] inline-block" />
              Automations
            </p>
            <h1 className="text-3xl font-bold text-[#213138] dark:text-white font-[family-name:var(--font-poppins)] tracking-tight">
              Workflows
            </h1>
          </div>

          {customerPlan !== "free" && (
            <button
              onClick={handleCreateAutomation}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#3A9B9F] hover:bg-[#2F8488] text-white text-sm font-semibold rounded-xl transition-colors duration-200 self-start sm:self-auto"
            >
              <Plus weight="bold" className="h-4 w-4" />
              New Automation
            </button>
          )}
        </motion.div>

        {/* ── Paywall ─────────────────────────────────────────────────────── */}
        {!loading && customerPlan === "free" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 }}
            className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl p-12 text-center"
            style={{ borderLeftColor: "#FF8B66", borderLeftWidth: 2 }}
          >
            <div className="max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-xl bg-[#FF8B66]/10 flex items-center justify-center mx-auto mb-5">
                <Zap className="h-5 w-5 text-[#FF8B66]" />
              </div>
              <h3 className="text-xl font-bold text-[#213138] dark:text-white font-[family-name:var(--font-poppins)] mb-2">
                Professional Feature
              </h3>
              <p className="text-[14px] text-gray-500 dark:text-[#525252] mb-8 leading-relaxed">
                Unlock automations to auto-reply, route conversations, and trigger campaigns while you sleep.
              </p>
              <button
                onClick={() => router.push("/dashboard/settings?tab=billing")}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#213138] dark:bg-[#3A9B9F] hover:bg-[#1a272e] dark:hover:bg-[#2F8488] text-white text-sm font-semibold rounded-xl transition-colors duration-200 mx-auto"
              >
                Upgrade to Professional
                <ArrowRight weight="bold" className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {!loading && customerPlan !== "free" && (
          <>
            {/* ── Stats row ─────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.06 }}
              className="grid grid-cols-3 gap-4"
            >
              {[
                { label: "Active",     value: activeCount,                    accent: "#3A9B9F" },
                { label: "Total Runs", value: totalRuns,                      accent: "#FF8B66" },
                { label: "Hours Saved",value: Math.floor(totalRuns * 0.1),   accent: "#3A9B9F" },
              ].map((s, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl p-5 hover:border-gray-300 dark:hover:border-[#2A2A2A] transition-colors duration-200"
                  style={{ borderLeftColor: s.accent, borderLeftWidth: 2 }}
                >
                  <p className="text-[11px] text-gray-500 dark:text-[#525252] uppercase tracking-widest font-medium mb-2">
                    {s.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-poppins)] tabular-nums">
                    {s.value}
                  </p>
                </div>
              ))}
            </motion.div>

            {/* ── Automation cards ──────────────────────────────────────── */}
            {loading ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl p-5 space-y-4">
                    <Skeleton className="h-4 w-40 bg-slate-100 dark:bg-[#1A1A1A] rounded" />
                    <Skeleton className="h-3 w-24 bg-slate-100 dark:bg-[#1A1A1A] rounded" />
                    <div className="pt-2 space-y-3">
                      <Skeleton className="h-8 w-full bg-slate-100 dark:bg-[#1A1A1A] rounded-lg" />
                      <Skeleton className="h-8 w-full bg-slate-100 dark:bg-[#1A1A1A] rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : automations.length === 0 ? (
              /* ── Empty state ─────────────────────────────────────────── */
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.12 }}
                className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl p-16 text-center"
              >
                <div className="max-w-xs mx-auto">
                  {/* Mini pipeline preview — teases the IF/THEN design */}
                  <div className="inline-flex flex-col items-start gap-0 mb-8 text-left">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2A2A2A] flex items-center justify-center">
                        <span className="text-[8px] font-black text-gray-400 dark:text-[#525252]">IF</span>
                      </div>
                      <span className="text-[13px] text-gray-400 dark:text-[#525252]">message contains "hi"</span>
                    </div>
                    <div className="ml-3 h-4 border-l border-dashed border-gray-200 dark:border-[#222]" />
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-[#3A9B9F] flex items-center justify-center">
                        <span className="text-[8px] font-black text-white">DO</span>
                      </div>
                      <span className="text-[13px] text-gray-400 dark:text-[#525252]">send a welcome message</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-[#213138] dark:text-white font-[family-name:var(--font-poppins)] mb-2">
                    No automations yet
                  </h3>
                  <p className="text-[13px] text-gray-500 dark:text-[#525252] mb-6 leading-relaxed">
                    Build rules that respond for you — 24 hours a day.
                  </p>
                  <button
                    onClick={handleCreateAutomation}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#3A9B9F] hover:bg-[#2F8488] text-white text-sm font-semibold rounded-xl transition-colors duration-200 mx-auto"
                  >
                    <Plus weight="bold" className="h-4 w-4" />
                    Create your first automation
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.12 }}
                className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5"
              >
                {automations.map((automation, i) => (
                  <motion.div
                    key={automation.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <AutomationCard
                      automation={automation}
                      onToggle={() => handleToggleAutomation(automation)}
                      onEdit={() => { setEditingAutomation(automation); setIsModalOpen(true) }}
                      onDelete={() => handleDeleteAutomation(automation.id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        )}

        {/* ── Create / Edit modal ──────────────────────────────────────────── */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingAutomation(null) }}
          title={editingAutomation?.id ? "Edit Automation" : "New Automation"}
          size="lg"
        >
          {editingAutomation && (
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={editingAutomation.name || ""}
                  onChange={(e) => setEditingAutomation({ ...editingAutomation, name: e.target.value })}
                  placeholder="e.g., Welcome Message"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Trigger *</Label>
                  <SimpleSelect
                    value={editingAutomation.trigger_type || "keyword"}
                    onValueChange={(v) => setEditingAutomation({ ...editingAutomation, trigger_type: v as TriggerType })}
                    options={triggerOptions}
                    className="mt-1"
                  />
                </div>
                {editingAutomation.trigger_type === "keyword" && (
                  <div>
                    <Label>Keyword *</Label>
                    <Input
                      value={editingAutomation.trigger_value || ""}
                      onChange={(e) => setEditingAutomation({ ...editingAutomation, trigger_value: e.target.value })}
                      placeholder="e.g., hello, pricing"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Action *</Label>
                <SimpleSelect
                  value={editingAutomation.action_type || "send_message"}
                  onValueChange={(v) => setEditingAutomation({ ...editingAutomation, action_type: v as ActionType })}
                  options={actionOptions}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>
                  {editingAutomation.action_type === "send_message" ? "Message *"
                    : editingAutomation.action_type === "add_tag" ? "Tag Name *"
                    : editingAutomation.action_type === "send_template" ? "Template Name *"
                    : "Value *"}
                </Label>
                {editingAutomation.action_type === "send_message" ? (
                  <Textarea
                    value={editingAutomation.action_value || ""}
                    onChange={(e) => setEditingAutomation({ ...editingAutomation, action_value: e.target.value })}
                    placeholder="Enter your automated message..."
                    className="mt-1 min-h-[100px]"
                  />
                ) : (
                  <Input
                    value={editingAutomation.action_value || ""}
                    onChange={(e) => setEditingAutomation({ ...editingAutomation, action_value: e.target.value })}
                    placeholder={editingAutomation.action_type === "add_tag" ? "e.g., VIP" : "Enter value..."}
                    className="mt-1"
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={editingAutomation.is_enabled ?? true}
                  onCheckedChange={(v) => setEditingAutomation({ ...editingAutomation, is_enabled: v })}
                  className="data-[state=checked]:bg-[#3A9B9F]"
                />
                <Label className="cursor-pointer">Enable automation</Label>
              </div>

              <ModalFooter>
                <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditingAutomation(null) }}>
                  Cancel
                </Button>
                <Button
                  className="bg-[#3A9B9F] hover:bg-[#2F8488] text-white"
                  onClick={handleSaveAutomation}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving…" : editingAutomation.id ? "Save Changes" : "Create"}
                </Button>
              </ModalFooter>
            </div>
          )}
        </Modal>

      </div>
    </div>
  )
}
