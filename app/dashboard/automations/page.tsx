"use client"

import { useState, useEffect } from "react"
import {
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
import { formatDistanceToNow } from "@/lib/utils"
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
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automations</h1>
          <p className="text-gray-500 mt-1">
            Set up automatic responses and actions
          </p>
        </div>

        <Button
          className="bg-[#25D366] hover:bg-[#20BD5B]"
          onClick={handleCreateAutomation}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Automation
        </Button>
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
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <Zap className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">No automations yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Create automations to save time on repetitive tasks
            </p>
            <Button
              className="bg-[#25D366] hover:bg-[#20BD5B]"
              onClick={handleCreateAutomation}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Automation
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {automations.map((automation) => (
            <div
              key={automation.id}
              className={`bg-white rounded-xl border border-gray-200 p-6 transition-opacity ${
                !automation.is_enabled ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`rounded-lg p-2.5 ${
                    automation.is_enabled
                      ? "bg-[#25D366]/10 text-[#25D366]"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {getTriggerIcon(automation.trigger_type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {automation.name}
                    </h3>
                    {automation.is_enabled ? (
                      <Badge variant="success" size="sm">Active</Badge>
                    ) : (
                      <Badge variant="secondary" size="sm">Paused</Badge>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-gray-500">
                    <p>
                      <span className="font-medium">Trigger:</span>{" "}
                      {getTriggerLabel(automation.trigger_type, automation.trigger_value)}
                    </p>
                    <p>
                      <span className="font-medium">Action:</span>{" "}
                      {getActionLabel(automation.action_type, automation.action_value)}
                    </p>
                  </div>

                  <p className="text-xs text-gray-400 mt-2">
                    Triggered {automation.times_triggered} times
                    {automation.last_triggered_at && (
                      <> • Last: {formatDistanceToNow(automation.last_triggered_at)}</>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={automation.is_enabled}
                    onCheckedChange={() => handleToggleAutomation(automation)}
                  />

                  <Dropdown
                    align="right"
                    trigger={
                      <button className="p-2 rounded-lg hover:bg-gray-100">
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </button>
                    }
                  >
                    <DropdownItem
                      icon={<Edit2 className="h-4 w-4" />}
                      onClick={() => handleEditAutomation(automation)}
                    >
                      Edit
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem
                      icon={<Trash2 className="h-4 w-4" />}
                      destructive
                      onClick={() => handleDeleteAutomation(automation.id)}
                    >
                      Delete
                    </DropdownItem>
                  </Dropdown>
                </div>
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
                className="bg-[#25D366]"
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
