"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Search,
  FileText,
  MoreVertical,
  Trash2,
  Copy,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Link2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Modal, ModalFooter } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SimpleSelect } from "@/components/ui/dropdown"
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import {
  fetchMetaTemplates,
  createMetaTemplate,
  deleteMetaTemplate,
  getMetaStatus,
} from "@/lib/meta-connections"
import { toast } from "sonner"
import type { WhatsAppMetaTemplate } from "@/types/database"

const categoryOptions = [
  { value: "UTILITY", label: "Utility" },
  { value: "MARKETING", label: "Marketing" },
  { value: "AUTHENTICATION", label: "Authentication" },
]

const languageOptions = [
  { value: "en", label: "English" },
  { value: "en_US", label: "English (US)" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "pt_BR", label: "Portuguese (BR)" },
  { value: "nl", label: "Dutch" },
]

const statusFilters = [
  { value: "all", label: "All" },
  { value: "APPROVED", label: "Approved" },
  { value: "PENDING", label: "Pending" },
  { value: "REJECTED", label: "Rejected" },
]

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<WhatsAppMetaTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [whatsappConnected, setWhatsappConnected] = useState<boolean | null>(null)

  // New template form
  const [newName, setNewName] = useState("")
  const [newCategory, setNewCategory] = useState("UTILITY")
  const [newLanguage, setNewLanguage] = useState("en")
  const [newBody, setNewBody] = useState("")

  // Check WhatsApp connection and fetch templates
  useEffect(() => {
    async function init() {
      setLoading(true)

      // Check if WhatsApp is connected
      const { data: status } = await getMetaStatus()
      const connected = status?.whatsapp?.connected ?? false
      setWhatsappConnected(connected)

      if (connected) {
        await loadTemplates()
      }

      setLoading(false)
    }

    init()
  }, [])

  const loadTemplates = async () => {
    const { data, error } = await fetchMetaTemplates()
    if (error) {
      toast.error(error)
    } else {
      setTemplates(data)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadTemplates()
    setIsRefreshing(false)
    toast.success("Templates refreshed")
  }

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.components?.some(c => c.text?.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === "all" || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreateTemplate = () => {
    setNewName("")
    setNewCategory("UTILITY")
    setNewLanguage("en")
    setNewBody("")
    setIsModalOpen(true)
  }

  const handleSaveTemplate = async () => {
    if (!newName.trim() || !newBody.trim()) {
      toast.error("Please fill in template name and body")
      return
    }

    setIsSaving(true)

    const { data, error } = await createMetaTemplate({
      name: newName,
      category: newCategory,
      language: newLanguage,
      body: newBody,
    })

    if (error) {
      toast.error(error)
    } else if (data) {
      toast.success(`Template "${data.name}" created with status: ${data.status}`)
      setIsModalOpen(false)
      // Refresh the full list from Meta
      await loadTemplates()
    }

    setIsSaving(false)
  }

  const handleDeleteTemplate = async (name: string) => {
    if (!window.confirm(`Delete template "${name}"? This will delete it from Meta and cannot be undone.`)) {
      return
    }

    const { error } = await deleteMetaTemplate(name)

    if (error) {
      toast.error(error)
    } else {
      setTemplates((prev) => prev.filter((t) => t.name !== name))
      toast.success("Template deleted")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        )
      case "PENDING":
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="danger" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            {status}
          </Badge>
        )
    }
  }

  const getBodyText = (template: WhatsAppMetaTemplate): string => {
    const bodyComponent = template.components?.find(c => c.type === "BODY")
    return bodyComponent?.text || ""
  }

  // Not connected state
  if (!loading && whatsappConnected === false) {
    return (
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp Templates</h1>
            <p className="text-gray-500 mt-1">
              Manage your WhatsApp message templates via Meta
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <div className="rounded-full bg-yellow-50 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              WhatsApp Not Connected
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
              Connect your Meta account with WhatsApp Business permissions to manage message templates.
              Templates are synced directly with Meta's API.
            </p>
            <Button
              onClick={() => router.push("/dashboard/settings?tab=integrations")}
              className="bg-[#3A9B9F] hover:bg-[#2F8488]"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Go to Integrations
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Templates</h1>
          <p className="text-gray-500 mt-1">
            Manage your WhatsApp message templates via Meta
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            className="bg-[#3A9B9F] hover:bg-[#2F8488]"
            onClick={handleCreateTemplate}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
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
                : "Create your first WhatsApp template to get started"}
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
              key={`${template.name}-${template.language}`}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500">
                    {template.category} &middot; {template.language}
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
                    icon={<Copy className="h-4 w-4" />}
                    onClick={() => {
                      navigator.clipboard.writeText(getBodyText(template))
                      toast.success("Copied to clipboard")
                    }}
                  >
                    Copy text
                  </DropdownItem>
                  <DropdownSeparator />
                  <DropdownItem
                    icon={<Trash2 className="h-4 w-4" />}
                    destructive
                    onClick={() => handleDeleteTemplate(template.name)}
                  >
                    Delete
                  </DropdownItem>
                </Dropdown>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-700 line-clamp-3">
                  {getBodyText(template) || "(No body text)"}
                </p>
              </div>

              <div className="flex items-center justify-between">
                {getStatusBadge(template.status)}
                <span className="text-xs text-gray-400">
                  ID: {template.id?.slice(-8)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Template Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create WhatsApp Template"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <Label>Template Name *</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., welcome_message"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lowercase letters, numbers, and underscores only. Spaces will be converted to underscores.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category *</Label>
              <SimpleSelect
                value={newCategory}
                onValueChange={setNewCategory}
                options={categoryOptions}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Language *</Label>
              <SimpleSelect
                value={newLanguage}
                onValueChange={setNewLanguage}
                options={languageOptions}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Message Body *</Label>
            <Textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Type your message here. Use {{1}}, {{2}}, etc. for variables."
              className="mt-1 min-h-[150px]"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use {"{{1}}"}, {"{{2}}"}, etc. for dynamic variables. Meta will review this template.
            </p>
          </div>

          {newBody && (
            <div>
              <Label>Preview</Label>
              <div className="mt-1 bg-[#3A9B9F]/10 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {newBody}
                </p>
              </div>
            </div>
          )}

          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#3A9B9F]"
              onClick={handleSaveTemplate}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit to Meta"
              )}
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  )
}
