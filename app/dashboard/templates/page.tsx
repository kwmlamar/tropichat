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
  ChevronRight,
  MessageSquare,
  Globe,
  Tag,
  Info,
  Calendar,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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
import { cn } from "@/lib/utils"
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 text-[10px] font-black uppercase tracking-widest border border-teal-500/20">
            <CheckCircle className="h-3 w-3" />
            Approved
          </div>
        )
      case "PENDING":
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral-500/10 text-coral-600 text-[10px] font-black uppercase tracking-widest border border-coral-500/20">
            <Clock className="h-3 w-3" />
            Pending
          </div>
        )
      case "REJECTED":
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-600 text-[10px] font-black uppercase tracking-widest border border-red-500/20">
            <XCircle className="h-3 w-3" />
            Rejected
          </div>
        )
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-500/10 text-gray-600 text-[10px] font-black uppercase tracking-widest border border-gray-500/20">
            {status}
          </div>
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
      <div className="p-8 space-y-8 min-h-[calc(100vh-100px)] relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-teal-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-coral-500/5 blur-[100px] rounded-full" />

        <div className="relative z-10 text-center max-w-2xl mx-auto pt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center justify-center h-24 w-24 rounded-[32px] bg-white shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-white mb-8"
          >
            <AlertTriangle className="h-10 w-10 text-coral-500" />
          </motion.div>

          <h1 className="text-4xl font-extrabold text-[#213138] leading-tight mb-4 font-[family-name:var(--font-poppins)] tracking-tight">
            WhatsApp Not Connected
          </h1>
          <p className="text-lg text-gray-500 mb-10 leading-relaxed font-medium">
            Connect your Meta account with WhatsApp Business permissions to manage message templates.
            Templates are synced directly with Meta's API.
          </p>

          <Button
            onClick={() => router.push("/dashboard/settings?tab=integrations")}
            className="h-14 px-10 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-bold shadow-xl shadow-teal-500/20 hover-lift transition-all ring-offset-2 focus:ring-2 focus:ring-teal-500 border-none"
          >
            <Link2 className="h-5 w-5 mr-3" />
            Set Up WhatsApp Integration
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 relative min-h-[calc(100vh-80px)] overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/[0.03] blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-coral-500/[0.03] blur-[100px] rounded-full pointer-events-none" />

      {/* Header Section */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-gray-100/50">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 text-[10px] font-black uppercase tracking-widest mb-3">
            <MessageSquare className="h-3 w-3" />
            Meta Integration
          </div>
          <h1 className="text-4xl font-extrabold text-[#213138] leading-tight font-[family-name:var(--font-poppins)] tracking-tight">
            WhatsApp Templates
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            Standardized messages for marketing, utility, and authentication.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-12 px-6 rounded-2xl border-gray-200 bg-white/50 backdrop-blur-sm hover:bg-white text-gray-600 font-bold transition-all hover:shadow-md active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Sync from Meta
          </Button>
          <Button
            onClick={handleCreateTemplate}
            className="h-12 px-6 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-bold shadow-lg shadow-teal-500/20 hover-lift transition-all border-none"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New
          </Button>
        </div>
      </div>

      {/* Search & Tabs Controls */}
      <div className="relative z-10 flex flex-col xl:flex-row gap-4">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-teal-500 transition-colors" />
          </div>
          <Input
            placeholder="Search templates by name or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-14 pl-12 pr-4 bg-white/70 backdrop-blur-md rounded-2xl border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all text-gray-900 font-medium placeholder:text-gray-400"
          />
        </div>

        <div className="flex bg-gray-100/50 backdrop-blur-sm p-1.5 rounded-2xl border border-gray-200/50 self-start">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 relative",
                statusFilter === filter.value
                  ? "bg-white text-navy-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900 hover:bg-white/50"
              )}
            >
              {filter.label}
              {statusFilter === filter.value && (
                <motion.div
                  layoutId="activeFilter"
                  className="absolute inset-0 rounded-xl border border-gray-100 pointer-events-none"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white/50 backdrop-blur-sm rounded-3xl border border-white p-8 shadow-sm flex flex-col h-[280px]"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-3/4 rounded-lg" />
                  <Skeleton className="h-4 w-1/2 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-8 rounded-xl" />
              </div>
              <Skeleton className="flex-1 w-full rounded-2xl mb-6" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/50 backdrop-blur-xl rounded-[40px] border border-white p-20 text-center shadow-[0_32px_64px_rgba(0,0,0,0.06)]"
        >
          <div className="flex flex-col items-center max-w-sm mx-auto">
            <div className="h-24 w-24 rounded-full bg-gray-50 flex items-center justify-center mb-8 border border-gray-100">
              <FileText className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-2xl font-black text-[#213138] mb-3">No Templates Found</h3>
            <p className="text-gray-500 font-medium mb-10">
              {searchQuery
                ? "We couldn't find any templates matching your search criteria."
                : "Your template library is empty. Start by creating your first standardized message."}
            </p>
            <Button
              className="h-14 px-8 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-bold shadow-xl shadow-teal-500/20 hover-lift transition-all border-none"
              onClick={handleCreateTemplate}
            >
              <Plus className="h-5 w-5 mr-3" />
              Create Template
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredTemplates.map((template, index) => (
              <motion.div
                layout
                key={`${template.name}-${template.language}`}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group relative bg-white/70 backdrop-blur-xl rounded-[32px] border border-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:shadow-[0_24px_48px_rgba(0,0,0,0.08)] transition-all flex flex-col h-full hover:-translate-y-1"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="min-w-0 pr-4">
                    <h3 className="text-lg font-extrabold text-[#213138] truncate group-hover:text-teal-600 transition-colors">
                      {template.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <Tag className="h-3 w-3" />
                        {template.category}
                      </div>
                      <span className="h-1 w-1 rounded-full bg-gray-200" />
                      <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <Globe className="h-3 w-3" />
                        {template.language}
                      </div>
                    </div>
                  </div>

                  <Dropdown
                    align="right"
                    trigger={
                      <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50/50 border border-gray-100 text-gray-400 hover:text-navy-900 hover:bg-white transition-all">
                        <MoreVertical className="h-5 w-5" />
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
                      Copy Plain Text
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem
                      icon={<Trash2 className="h-4 w-4" />}
                      destructive
                      onClick={() => handleDeleteTemplate(template.name)}
                    >
                      Delete Forever
                    </DropdownItem>
                  </Dropdown>
                </div>

                {/* Message Preview (Bubble Style) */}
                <div className="flex-1 relative mb-6">
                  <div className="absolute inset-0 bg-teal-50/30 rounded-2xl -z-10 group-hover:bg-teal-50/50 transition-colors" />
                  <div className="p-4 h-full flex flex-col">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 leading-relaxed line-clamp-4">
                        {getBodyText(template) || <span className="text-gray-400 italic">No body text content</span>}
                      </p>
                    </div>

                    {/* Variable Highlight Hint */}
                    {getBodyText(template).includes('{{') && (
                      <div className="mt-3 pt-3 border-t border-teal-500/10 flex items-center gap-2 text-[10px] font-bold text-teal-600 tracking-tight">
                        <Info className="h-3 w-3" />
                        Contains dynamic variables
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between pt-2">
                  {getStatusBadge(template.status)}
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">ID: {template.id?.slice(-8)}</span>
                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Template Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Draft Template"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Unique Template Name*</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value.toLowerCase().replace(/\s/g, '_'))}
              placeholder="e.g., promotional_offer_july"
              className="mt-2 h-12 bg-white border-gray-100 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 shadow-sm transition-all"
            />
            <p className="text-[11px] text-gray-400 mt-2 ml-1 flex items-center gap-1.5">
              <Info className="h-3 w-3" />
              Lowercase, numbers, and underscores only.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category*</Label>
              <SimpleSelect
                value={newCategory}
                onValueChange={setNewCategory}
                options={categoryOptions}
                className="mt-2 h-12 bg-white border-gray-100 rounded-2xl shadow-sm"
              />
            </div>
            <div>
              <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Language*</Label>
              <SimpleSelect
                value={newLanguage}
                onValueChange={setNewLanguage}
                options={languageOptions}
                className="mt-2 h-12 bg-white border-gray-100 rounded-2xl shadow-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Content Body*</Label>
            <Textarea
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              placeholder="Draft your message... Use {{1}} for variables."
              className="mt-2 min-h-[140px] bg-white border-gray-100 rounded-2xl p-4 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 shadow-sm resize-none transition-all"
            />
            <div className="flex items-center gap-3 mt-3 ml-1">
              <div className="px-2 py-0.5 rounded bg-amber-50 text-[10px] font-bold text-amber-600 border border-amber-100">
                Variable Hint: {"{{1}}"}
              </div>
              <p className="text-[11px] text-gray-400 uppercase tracking-tight font-bold">Requires Meta review</p>
            </div>
          </div>

          {/* Real-time Preview */}
          <AnimatePresence>
            {newBody && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-3"
              >
                <Label className="text-[10px] font-black text-teal-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                  Live Mobile Preview
                </Label>
                <div className="bg-[#DCF8C6]/40 backdrop-blur-sm rounded-[24px_24px_24px_4px] p-6 border border-[#DCF8C6]/50 shadow-[0_8px_32px_rgba(37,211,102,0.06)] relative max-w-[90%]">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {newBody.split(/(\{\{\d+\}\})/).map((part, i) =>
                      part.match(/\{\{\d+\}\}/) ? (
                        <span key={i} className="bg-teal-500/10 text-teal-700 font-bold px-1.5 py-0.5 rounded border border-teal-500/20 mx-0.5">
                          {part}
                        </span>
                      ) : part
                    )}
                  </p>
                  <div className="mt-4 flex items-center justify-end gap-1.5">
                    <span className="text-[9px] font-bold text-gray-400/80 uppercase tracking-tighter">12:00 PM</span>
                    <CheckCircle className="h-3 w-3 text-teal-400" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ModalFooter className="pt-6 gap-3 border-t border-gray-100 px-0 mt-8">
            <Button
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              className="h-12 px-6 rounded-xl font-bold text-gray-400 hover:text-navy-900 hover:bg-gray-50 flex-1 sm:flex-none"
            >
              Discard Draft
            </Button>
            <Button
              className="h-12 px-8 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex-1 sm:flex-none"
              onClick={handleSaveTemplate}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Requesting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  )
}
