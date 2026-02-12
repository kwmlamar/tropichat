"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Search,
  FileText,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Modal, ModalFooter } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SimpleSelect } from "@/components/ui/dropdown"
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/lib/supabase"
import { formatDistanceToNow, parseTemplateVariables } from "@/lib/utils"
import { toast } from "sonner"
import type { MessageTemplate, TemplateCategory } from "@/types/database"

const categoryOptions = [
  { value: "utility", label: "Utility" },
  { value: "marketing", label: "Marketing" },
  { value: "authentication", label: "Authentication" },
]

const statusFilters = [
  { value: "all", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
]

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Partial<MessageTemplate> | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch templates
  useEffect(() => {
    async function fetchTemplates() {
      setLoading(true)
      const { data, error } = await getTemplates(
        undefined,
        statusFilter === "all" ? undefined : statusFilter
      )

      if (error) {
        toast.error("Failed to load templates")
      } else {
        setTemplates(data)
      }

      setLoading(false)
    }

    fetchTemplates()
  }, [statusFilter])

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.body.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateTemplate = () => {
    setEditingTemplate({
      name: "",
      category: "utility" as TemplateCategory,
      language: "en",
      body: "",
    })
    setIsModalOpen(true)
  }

  const handleEditTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template)
    setIsModalOpen(true)
  }

  const handleSaveTemplate = async () => {
    if (!editingTemplate?.name || !editingTemplate?.body) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSaving(true)

    const variables = parseTemplateVariables(editingTemplate.body)

    if (editingTemplate.id) {
      // Update existing
      const { error } = await updateTemplate(editingTemplate.id, {
        name: editingTemplate.name,
        category: editingTemplate.category,
        body: editingTemplate.body,
        variables,
      })

      if (error) {
        toast.error("Failed to update template")
      } else {
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === editingTemplate.id
              ? { ...t, ...editingTemplate, variables }
              : t
          )
        )
        toast.success("Template updated")
        setIsModalOpen(false)
      }
    } else {
      // Create new
      const { data, error } = await createTemplate({
        ...editingTemplate,
        variables,
      } as MessageTemplate)

      if (error) {
        toast.error("Failed to create template")
      } else if (data) {
        setTemplates((prev) => [data, ...prev])
        toast.success("Template created")
        setIsModalOpen(false)
      }
    }

    setIsSaving(false)
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this template?")) {
      return
    }

    const { error } = await deleteTemplate(id)

    if (error) {
      toast.error("Failed to delete template")
    } else {
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      toast.success("Template deleted")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="danger" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Message Templates</h1>
          <p className="text-gray-500 mt-1">
            Create and manage your message templates
          </p>
        </div>

        <Button
          className="bg-[#3A9B9F] hover:bg-[#2F8488]"
          onClick={handleCreateTemplate}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === filter.value
                  ? "bg-[#3A9B9F]/10 text-[#3A9B9F]"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-20 w-full mb-4" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">No templates found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery
                ? "Try a different search term"
                : "Create your first template to get started"}
            </p>
            <Button
              className="bg-[#3A9B9F] hover:bg-[#2F8488]"
              onClick={handleCreateTemplate}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">
                    {template.category}
                  </p>
                </div>
                <Dropdown
                  align="right"
                  trigger={
                    <button className="p-1 rounded hover:bg-gray-100">
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </button>
                  }
                >
                  <DropdownItem
                    icon={<Edit2 className="h-4 w-4" />}
                    onClick={() => handleEditTemplate(template)}
                  >
                    Edit
                  </DropdownItem>
                  <DropdownItem
                    icon={<Copy className="h-4 w-4" />}
                    onClick={() => {
                      navigator.clipboard.writeText(template.body)
                      toast.success("Copied to clipboard")
                    }}
                  >
                    Copy text
                  </DropdownItem>
                  <DropdownSeparator />
                  <DropdownItem
                    icon={<Trash2 className="h-4 w-4" />}
                    destructive
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    Delete
                  </DropdownItem>
                </Dropdown>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-700 line-clamp-3">
                  {template.body}
                </p>
              </div>

              <div className="flex items-center justify-between">
                {getStatusBadge(template.approval_status)}
                <span className="text-xs text-gray-500">
                  Used {template.times_used} times
                </span>
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
          setEditingTemplate(null)
        }}
        title={editingTemplate?.id ? "Edit Template" : "Create Template"}
        size="lg"
      >
        {editingTemplate && (
          <div className="space-y-4">
            <div>
              <Label>Template Name *</Label>
              <Input
                value={editingTemplate.name || ""}
                onChange={(e) =>
                  setEditingTemplate({ ...editingTemplate, name: e.target.value })
                }
                placeholder="e.g., Welcome Message"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Category *</Label>
              <SimpleSelect
                value={editingTemplate.category || "utility"}
                onValueChange={(value) =>
                  setEditingTemplate({
                    ...editingTemplate,
                    category: value as TemplateCategory,
                  })
                }
                options={categoryOptions}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Message Body *</Label>
              <Textarea
                value={editingTemplate.body || ""}
                onChange={(e) =>
                  setEditingTemplate({ ...editingTemplate, body: e.target.value })
                }
                placeholder="Type your message here. Use {{variable}} for dynamic content."
                className="mt-1 min-h-[150px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use {"{{name}}"}, {"{{date}}"}, etc. for variables
              </p>
            </div>

            {editingTemplate.body && (
              <div>
                <Label>Preview</Label>
                <div className="mt-1 bg-[#3A9B9F]/10 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {editingTemplate.body}
                  </p>
                </div>
              </div>
            )}

            <ModalFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingTemplate(null)
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#3A9B9F]"
                onClick={handleSaveTemplate}
                disabled={isSaving}
              >
                {isSaving
                  ? "Saving..."
                  : editingTemplate.id
                  ? "Save Changes"
                  : "Create Template"}
              </Button>
            </ModalFooter>
          </div>
        )}
      </Modal>
    </div>
  )
}
