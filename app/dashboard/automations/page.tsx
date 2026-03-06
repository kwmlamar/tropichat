"use client"

import { useState, useEffect } from "react"
import {
  ArrowRight,
  Plus,
  Zap,
  MoreVertical,
  Edit2,
  Trash2,
  Play,
  Pause,
  MessageSquare,
  Tag,
  Clock,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
} from "@/lib/supabase"
import { formatDistanceToNow, cn } from "@/lib/utils"
import { toast } from "sonner"
import type { AutomationRule, TriggerType, ActionType } from "@/types/database"

const triggerOptions = [
  { value: "keyword", label: "Keyword Match" },
  { value: "new_conversation", label: "New Conversation" },
  { value: "business_hours", label: "During Business Hours" },
  { value: "after_hours", label: "After Business Hours" },
  { value: "all_messages", label: "All Messages" },
]

const actionOptions = [
  { value: "send_message", label: "Send Message" },
  { value: "send_template", label: "Send Template" },
  { value: "add_tag", label: "Add Tag" },
  { value: "mark_resolved", label: "Mark as Resolved" },
]

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAutomation, setEditingAutomation] = useState<Partial<AutomationRule> | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch automations
  useEffect(() => {
    async function fetchAutomations() {
      setLoading(true)
      const { data, error } = await getAutomations()

      if (error) {
        toast.error("Failed to load automations")
      } else {
        setAutomations(data)
      }

      setLoading(false)
    }

    fetchAutomations()
  }, [])

  const handleCreateAutomation = () => {
    setEditingAutomation({
      name: "",
      trigger_type: "keyword" as TriggerType,
      trigger_value: "",
      action_type: "send_message" as ActionType,
      action_value: "",
      is_enabled: true,
    })
    setIsModalOpen(true)
  }

  const handleEditAutomation = (automation: AutomationRule) => {
    setEditingAutomation(automation)
    setIsModalOpen(true)
  }

  const handleToggleAutomation = async (automation: AutomationRule) => {
    const { error } = await updateAutomation(automation.id, {
      is_enabled: !automation.is_enabled,
    })

    if (error) {
      toast.error("Failed to update automation")
    } else {
      setAutomations((prev) =>
        prev.map((a) =>
          a.id === automation.id ? { ...a, is_enabled: !a.is_enabled } : a
        )
      )
      toast.success(
        automation.is_enabled ? "Automation disabled" : "Automation enabled"
      )
    }
  }

  const handleSaveAutomation = async () => {
    if (!editingAutomation?.name || !editingAutomation?.action_value) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSaving(true)

    if (editingAutomation.id) {
      // Update existing
      const { error } = await updateAutomation(editingAutomation.id, editingAutomation)

      if (error) {
        toast.error("Failed to update automation")
      } else {
        setAutomations((prev) =>
          prev.map((a) =>
            a.id === editingAutomation.id ? { ...a, ...editingAutomation } : a
          )
        )
        toast.success("Automation updated")
        setIsModalOpen(false)
      }
    } else {
      // Create new
      const { data, error } = await createAutomation(editingAutomation as AutomationRule)

      if (error) {
        toast.error("Failed to create automation")
      } else if (data) {
        setAutomations((prev) => [...prev, data])
        toast.success("Automation created")
        setIsModalOpen(false)
      }
    }

    setIsSaving(false)
  }

  const handleDeleteAutomation = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this automation?")) {
      return
    }

    const { error } = await deleteAutomation(id)

    if (error) {
      toast.error("Failed to delete automation")
    } else {
      setAutomations((prev) => prev.filter((a) => a.id !== id))
      toast.success("Automation deleted")
    }
  }

  const getTriggerIcon = (type: TriggerType) => {
    switch (type) {
      case "keyword":
        return <MessageSquare className="h-4 w-4" />
      case "new_conversation":
        return <User className="h-4 w-4" />
      case "business_hours":
      case "after_hours":
        return <Clock className="h-4 w-4" />
      default:
        return <Zap className="h-4 w-4" />
    }
  }

  const getTriggerLabel = (type: TriggerType, value: string | null) => {
    switch (type) {
      case "keyword":
        return `When message contains "${value}"`
      case "new_conversation":
        return "When a new conversation starts"
      case "business_hours":
        return "During business hours"
      case "after_hours":
        return "After business hours"
      case "all_messages":
        return "On every message"
      default:
        return type
    }
  }

  const getActionLabel = (type: ActionType, value: string) => {
    switch (type) {
      case "send_message":
        return `Send: "${value.substring(0, 50)}${value.length > 50 ? "..." : ""}"`
      case "send_template":
        return `Send template: ${value}`
      case "add_tag":
        return `Add tag: ${value}`
      case "mark_resolved":
        return "Mark conversation as resolved"
      default:
        return value
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full bg-mesh-gradient bg-noise">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#213138] font-[family-name:var(--font-poppins)]">
            Automations
          </h1>
          <p className="text-gray-500 font-medium tracking-wide">
            Create powerful workflows to automate your customer communication
          </p>
        </div>

        <Button
          className="bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-xl shadow-[0_4px_14px_rgba(58,155,159,0.3)] hover-lift btn-press font-semibold transition-all group px-6 py-6 h-auto"
          onClick={handleCreateAutomation}
        >
          <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
          New Automation
        </Button>
      </div>

      {/* Quick Stats Banner? Or just go straight to cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {[
          { label: "Active Automations", value: automations.filter(a => a.is_enabled).length, icon: Zap, color: "teal" },
          { label: "Total Triggers", value: automations.reduce((acc, a) => acc + (a.times_triggered || 0), 0), icon: MessageSquare, color: "coral" },
          { label: "Hours Saved", value: Math.floor(automations.reduce((acc, a) => acc + (a.times_triggered || 0), 0) * 0.1), icon: Clock, color: "teal" },
        ].map((stat, i) => (
          <div key={i} className="bg-white/60 border border-white/40 backdrop-blur-sm p-4 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className={cn("p-2.5 rounded-xl", stat.color === 'teal' ? "bg-[#3A9B9F]/10 text-[#3A9B9F]" : "bg-[#FF8B66]/10 text-[#FF8B66]")}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400">{stat.label}</div>
              <div className="text-xl font-black text-[#213138] mt-0.5">
                {loading ? <Skeleton className="h-6 w-12" /> : stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Automations List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : automations.length === 0 ? (
        <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white p-12 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover-lift transition-all">
          <div className="flex flex-col items-center max-w-sm mx-auto">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-[#3A9B9F]/20 blur-2xl rounded-full" />
              <div className="relative rounded-3xl bg-white p-6 shadow-xl border border-gray-50 transform group-hover:scale-110 transition-transform">
                <Zap className="h-12 w-12 text-[#3A9B9F]" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-[#213138] mb-2 font-[family-name:var(--font-poppins)]">Ready to automate?</h3>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Automations help you handle common requests instantly, keeping your response time low and your customers happy.
            </p>
            <Button
              className="bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-xl shadow-[0_4px_14px_rgba(58,155,159,0.3)] hover-lift btn-press font-semibold transition-all px-8 py-6 h-auto"
              onClick={handleCreateAutomation}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Automation
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6">
          {automations.map((automation) => (
            <div
              key={automation.id}
              className={cn(
                "group bg-white rounded-3xl border border-gray-100 p-6 transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover-lift",
                !automation.is_enabled && "bg-gray-50/50 border-transparent shadow-none grayscale-[0.5]"
              )}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "rounded-2xl p-3.5 transition-colors duration-300",
                        automation.is_enabled
                          ? "bg-[#3A9B9F]/10 text-[#3A9B9F] shadow-[0_4px_12px_rgba(58,155,159,0.1)]"
                          : "bg-gray-200 text-gray-500"
                      )}
                    >
                      {getTriggerIcon(automation.trigger_type)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-[#213138] group-hover:text-[#3A9B9F] transition-colors truncate">
                        {automation.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {automation.is_enabled ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-green-600/80">Active</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                            <span className="text-[10px] font-bold uppercase tracking-widest ">Paused</span>
                          </div>
                        )}
                        <span className="text-gray-300 text-[10px]">•</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          {automation.times_triggered || 0} executed
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={automation.is_enabled}
                      onCheckedChange={() => handleToggleAutomation(automation)}
                      className="data-[state=checked]:bg-[#3A9B9F]"
                    />
                    <Dropdown
                      align="right"
                      trigger={
                        <button className="p-2 rounded-xl text-gray-400 hover:text-[#3A9B9F] hover:bg-[#3A9B9F]/5 transition-all outline-none">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      }
                    >
                      <DropdownItem
                        icon={<Edit2 className="h-4 w-4" />}
                        onClick={() => handleEditAutomation(automation)}
                      >
                        Edit Details
                      </DropdownItem>
                      <DropdownSeparator />
                      <DropdownItem
                        icon={<Trash2 className="h-4 w-4" />}
                        destructive
                        onClick={() => handleDeleteAutomation(automation.id)}
                      >
                        Delete Permanent
                      </DropdownItem>
                    </Dropdown>
                  </div>
                </div>

                {/* Workflow Visualization */}
                <div className="mt-auto bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50 flex flex-col gap-3 group-hover:bg-white transition-colors duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 text-xs font-bold border border-gray-100 shadow-sm">IF</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Trigger</p>
                      <p className="text-sm font-medium text-[#213138] truncate uppercase">
                        {getTriggerLabel(automation.trigger_type, automation.trigger_value)}
                      </p>
                    </div>
                  </div>

                  <div className="ml-4 h-4 border-l-2 border-dashed border-gray-200" />

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#3A9B9F] flex items-center justify-center text-white text-xs font-bold shadow-[0_4px_12px_rgba(58,155,159,0.3)]">THEN</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Action</p>
                      <p className="text-sm font-medium text-[#213138] truncate capitalize">
                        {getActionLabel(automation.action_type, automation.action_value)}
                      </p>
                    </div>
                  </div>
                </div>

                {automation.last_triggered_at && (
                  <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-400 font-medium px-1">
                    <Clock className="h-3 w-3" />
                    Last executed {formatDistanceToNow(automation.last_triggered_at)} ago
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingAutomation(null)
        }}
        title={editingAutomation?.id ? "Edit Automation" : "Create Automation"}
        size="lg"
      >
        {editingAutomation && (
          <div className="space-y-4">
            <div>
              <Label>Automation Name *</Label>
              <Input
                value={editingAutomation.name || ""}
                onChange={(e) =>
                  setEditingAutomation({ ...editingAutomation, name: e.target.value })
                }
                placeholder="e.g., Welcome Message"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Trigger Type *</Label>
                <SimpleSelect
                  value={editingAutomation.trigger_type || "keyword"}
                  onValueChange={(value) =>
                    setEditingAutomation({
                      ...editingAutomation,
                      trigger_type: value as TriggerType,
                    })
                  }
                  options={triggerOptions}
                  className="mt-1"
                />
              </div>

              {editingAutomation.trigger_type === "keyword" && (
                <div>
                  <Label>Keyword *</Label>
                  <Input
                    value={editingAutomation.trigger_value || ""}
                    onChange={(e) =>
                      setEditingAutomation({
                        ...editingAutomation,
                        trigger_value: e.target.value,
                      })
                    }
                    placeholder="e.g., hello, pricing"
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            <div>
              <Label>Action Type *</Label>
              <SimpleSelect
                value={editingAutomation.action_type || "send_message"}
                onValueChange={(value) =>
                  setEditingAutomation({
                    ...editingAutomation,
                    action_type: value as ActionType,
                  })
                }
                options={actionOptions}
                className="mt-1"
              />
            </div>

            <div>
              <Label>
                {editingAutomation.action_type === "send_message"
                  ? "Message *"
                  : editingAutomation.action_type === "add_tag"
                    ? "Tag Name *"
                    : editingAutomation.action_type === "send_template"
                      ? "Template Name *"
                      : "Value *"}
              </Label>
              {editingAutomation.action_type === "send_message" ? (
                <Textarea
                  value={editingAutomation.action_value || ""}
                  onChange={(e) =>
                    setEditingAutomation({
                      ...editingAutomation,
                      action_value: e.target.value,
                    })
                  }
                  placeholder="Enter your automated message..."
                  className="mt-1 min-h-[100px]"
                />
              ) : (
                <Input
                  value={editingAutomation.action_value || ""}
                  onChange={(e) =>
                    setEditingAutomation({
                      ...editingAutomation,
                      action_value: e.target.value,
                    })
                  }
                  placeholder={
                    editingAutomation.action_type === "add_tag"
                      ? "e.g., VIP"
                      : "Enter value..."
                  }
                  className="mt-1"
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={editingAutomation.is_enabled ?? true}
                onCheckedChange={(checked) =>
                  setEditingAutomation({ ...editingAutomation, is_enabled: checked })
                }
              />
              <Label className="cursor-pointer">Enable automation</Label>
            </div>

            <ModalFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingAutomation(null)
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#3A9B9F]"
                onClick={handleSaveAutomation}
                disabled={isSaving}
              >
                {isSaving
                  ? "Saving..."
                  : editingAutomation.id
                    ? "Save Changes"
                    : "Create Automation"}
              </Button>
            </ModalFooter>
          </div>
        )}
      </Modal>
    </div>
  )
}
