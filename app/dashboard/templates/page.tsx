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
  MessageSquare,
  Globe,
  Tag,
  Info,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Modal, ModalFooter } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SimpleSelect } from "@/components/ui/dropdown"
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
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
  { value: "UTILITY",        label: "Utility"        },
  { value: "MARKETING",      label: "Marketing"      },
  { value: "AUTHENTICATION", label: "Authentication" },
]

const languageOptions = [
  { value: "en",    label: "English"          },
  { value: "en_US", label: "English (US)"     },
  { value: "es",    label: "Spanish"          },
  { value: "fr",    label: "French"           },
  { value: "pt_BR", label: "Portuguese (BR)"  },
  { value: "nl",    label: "Dutch"            },
]

const statusFilters = [
  { value: "all",      label: "All"      },
  { value: "APPROVED", label: "Approved" },
  { value: "PENDING",  label: "Pending"  },
  { value: "REJECTED", label: "Rejected" },
]

// ─── Status badge ─────────────────────────────────────────────────────────────
// Identity of this page: approval status is the key signal.
// Three distinct looks — approved teal, pending amber, rejected muted.
function StatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#3A9B9F] uppercase tracking-widest">
      <CheckCircle className="h-3 w-3" />Approved
    </span>
  )
  if (status === "PENDING") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-500 uppercase tracking-widest">
      <Clock className="h-3 w-3" />Pending
    </span>
  )
  if (status === "REJECTED") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-400 uppercase tracking-widest">
      <XCircle className="h-3 w-3" />Rejected
    </span>
  )
  return <span className="text-[10px] text-gray-400 dark:text-[#525252] uppercase tracking-widest">{status}</span>
}

function getBodyText(template: WhatsAppMetaTemplate): string {
  return template.components?.find(c => c.type === "BODY")?.text || ""
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates]               = useState<WhatsAppMetaTemplate[]>([])
  const [loading, setLoading]                   = useState(true)
  const [searchQuery, setSearchQuery]           = useState("")
  const [statusFilter, setStatusFilter]         = useState("all")
  const [isModalOpen, setIsModalOpen]           = useState(false)
  const [isSaving, setIsSaving]                 = useState(false)
  const [isRefreshing, setIsRefreshing]         = useState(false)
  const [whatsappConnected, setWhatsappConnected] = useState<boolean | null>(null)

  const [newName,     setNewName]     = useState("")
  const [newCategory, setNewCategory] = useState("UTILITY")
  const [newLanguage, setNewLanguage] = useState("en")
  const [newBody,     setNewBody]     = useState("")

  useEffect(() => {
    async function init() {
      setLoading(true)
      const { data: status } = await getMetaStatus()
      const connected = status?.whatsapp?.connected ?? false
      setWhatsappConnected(connected)
      if (connected) await loadTemplates()
      setLoading(false)
    }
    init()
  }, [])

  const loadTemplates = async () => {
    const { data, error } = await fetchMetaTemplates()
    if (error) toast.error(error)
    else setTemplates(data)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadTemplates()
    setIsRefreshing(false)
    toast.success("Templates refreshed")
  }

  const filteredTemplates = templates.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.components?.some(c => c.text?.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === "all" || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreateTemplate = () => {
    setNewName(""); setNewCategory("UTILITY"); setNewLanguage("en"); setNewBody("")
    setIsModalOpen(true)
  }

  const handleSaveTemplate = async () => {
    if (!newName.trim() || !newBody.trim()) { toast.error("Please fill in template name and body"); return }
    setIsSaving(true)
    const { data, error } = await createMetaTemplate({ name: newName, category: newCategory, language: newLanguage, body: newBody })
    if (error) toast.error(error)
    else if (data) { toast.success(`"${data.name}" submitted`); setIsModalOpen(false); await loadTemplates() }
    setIsSaving(false)
  }

  const handleDeleteTemplate = async (name: string) => {
    if (!window.confirm(`Delete template "${name}"? This cannot be undone.`)) return
    const { error } = await deleteMetaTemplate(name)
    if (error) toast.error(error)
    else { setTemplates(prev => prev.filter(t => t.name !== name)); toast.success("Template deleted") }
  }

  // ── Not connected ─────────────────────────────────────────────────────────
  if (!loading && whatsappConnected === false) {
    return (
      <div className="p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl p-12 text-center mt-12"
            style={{ borderLeftColor: "#FF8B66", borderLeftWidth: 2 }}
          >
            <div className="max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-xl bg-[#FF8B66]/10 flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="h-5 w-5 text-[#FF8B66]" />
              </div>
              <h3 className="text-xl font-bold text-[#213138] dark:text-white font-[family-name:var(--font-poppins)] mb-2">
                WhatsApp Not Connected
              </h3>
              <p className="text-[14px] text-gray-500 dark:text-[#525252] mb-8 leading-relaxed">
                Connect WhatsApp Business to manage message templates synced directly with Meta's API.
              </p>
              <button
                onClick={() => router.push("/dashboard/settings?tab=integrations")}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#213138] dark:bg-[#3A9B9F] hover:bg-[#1a272e] dark:hover:bg-[#2F8488] text-white text-sm font-semibold rounded-xl transition-colors duration-200 mx-auto"
              >
                <Link2 className="h-4 w-4" />
                Set Up WhatsApp Integration
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 min-h-screen overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6"
        >
          <div>
            <p className="text-[11px] text-gray-400 dark:text-[#525252] uppercase tracking-widest font-medium mb-1.5 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#3A9B9F] inline-block" />
              WhatsApp
            </p>
            <h1 className="text-3xl font-bold text-[#213138] dark:text-white font-[family-name:var(--font-poppins)] tracking-tight">
              Templates
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] hover:border-gray-300 dark:hover:border-[#2A2A2A] text-gray-600 dark:text-[#A3A3A3] text-[13px] font-medium rounded-xl transition-colors duration-200 disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
              Sync
            </button>
            <button
              onClick={handleCreateTemplate}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#3A9B9F] hover:bg-[#2F8488] text-white text-[13px] font-semibold rounded-xl transition-colors duration-200"
            >
              <Plus className="h-4 w-4" />
              New Template
            </button>
          </div>
        </motion.div>

        {/* ── Search + filter row ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-[#525252]" />
            <input
              type="text"
              placeholder="Search by name or content…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-xl text-[13px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#525252] focus:outline-none focus:border-[#3A9B9F] transition-colors duration-200"
            />
          </div>

          {/* Status filter segmented control */}
          <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-[#111111] rounded-xl p-1 border border-gray-200 dark:border-[#1C1C1C]">
            {statusFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200",
                  statusFilter === f.value
                    ? "bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white shadow-sm dark:shadow-none"
                    : "text-gray-400 dark:text-[#525252] hover:text-gray-700 dark:hover:text-[#A3A3A3]"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Content ────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl p-5 h-52 flex flex-col gap-3">
                <Skeleton className="h-4 w-36 bg-slate-100 dark:bg-[#1A1A1A] rounded" />
                <Skeleton className="h-3 w-24 bg-slate-100 dark:bg-[#1A1A1A] rounded" />
                <Skeleton className="flex-1 w-full bg-slate-100 dark:bg-[#1A1A1A] rounded-lg" />
                <Skeleton className="h-3 w-20 bg-slate-100 dark:bg-[#1A1A1A] rounded" />
              </div>
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl p-16 text-center"
          >
            <div className="max-w-xs mx-auto">
              <FileText className="h-8 w-8 text-gray-300 dark:text-[#333] mx-auto mb-4" />
              <h3 className="text-[15px] font-semibold text-[#213138] dark:text-white font-[family-name:var(--font-poppins)] mb-2">
                {searchQuery ? "No templates found" : "No templates yet"}
              </h3>
              <p className="text-[13px] text-gray-500 dark:text-[#525252] mb-6">
                {searchQuery
                  ? "Try a different search term."
                  : "Create your first standardized message for WhatsApp."}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleCreateTemplate}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#3A9B9F] hover:bg-[#2F8488] text-white text-sm font-semibold rounded-xl transition-colors duration-200 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  Create Template
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            <AnimatePresence mode="popLayout">
              {filteredTemplates.map((template, i) => {
                const body = getBodyText(template)
                const hasVars = body.includes("{{")
                return (
                  <motion.div
                    layout
                    key={`${template.name}-${template.language}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    className="group bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl p-5 flex flex-col hover:border-gray-300 dark:hover:border-[#2A2A2A] transition-colors duration-200"
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <h3 className="text-[14px] font-semibold text-[#213138] dark:text-white truncate">
                          {template.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-[#525252] uppercase tracking-wider">
                            <Tag className="h-2.5 w-2.5" />{template.category}
                          </span>
                          <span className="text-gray-200 dark:text-[#222]">·</span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-[#525252] uppercase tracking-wider">
                            <Globe className="h-2.5 w-2.5" />{template.language}
                          </span>
                        </div>
                      </div>

                      <Dropdown
                        align="right"
                        trigger={
                          <button className="p-1.5 rounded-lg text-gray-400 dark:text-[#525252] hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1C1C1C] transition-colors duration-200 outline-none shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        }
                      >
                        <DropdownItem
                          icon={<Copy className="h-4 w-4" />}
                          onClick={() => { navigator.clipboard.writeText(body); toast.success("Copied") }}
                        >
                          Copy Text
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

                    {/* Message preview — the signature element of this page: a WhatsApp-style bubble */}
                    <div className="flex-1 mb-4 bg-gray-50 dark:bg-[#111] rounded-xl p-4 border border-gray-100 dark:border-[#1A1A1A]">
                      {body ? (
                        <p className="text-[13px] text-gray-700 dark:text-[#A3A3A3] leading-relaxed line-clamp-4">
                          {body.split(/({{[\d]+}})/).map((part, j) =>
                            part.match(/{{[\d]+}}/) ? (
                              <span key={j} className="text-[#3A9B9F] font-medium">{part}</span>
                            ) : part
                          )}
                        </p>
                      ) : (
                        <p className="text-[13px] text-gray-300 dark:text-[#333] italic">No body text</p>
                      )}
                      {hasVars && (
                        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-[#1C1C1C]">
                          <Info className="h-3 w-3 text-gray-400 dark:text-[#525252]" />
                          <span className="text-[10px] text-gray-400 dark:text-[#525252]">Has dynamic variables</span>
                        </div>
                      )}
                    </div>

                    {/* Footer: status only */}
                    <StatusBadge status={template.status} />
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}

      </div>

      {/* ── Create template modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Template"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <Label>Template Name *</Label>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value.toLowerCase().replace(/\s/g, "_"))}
              placeholder="e.g., welcome_message"
              className="mt-1"
            />
            <p className="text-[11px] text-gray-400 dark:text-[#525252] mt-1.5 flex items-center gap-1">
              <Info className="h-3 w-3" />Lowercase, numbers, and underscores only.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category *</Label>
              <SimpleSelect value={newCategory} onValueChange={setNewCategory} options={categoryOptions} className="mt-1" />
            </div>
            <div>
              <Label>Language *</Label>
              <SimpleSelect value={newLanguage} onValueChange={setNewLanguage} options={languageOptions} className="mt-1" />
            </div>
          </div>

          <div>
            <Label>Message Body *</Label>
            <Textarea
              value={newBody}
              onChange={e => setNewBody(e.target.value)}
              placeholder="Type your message… Use {{1}} for variables."
              className="mt-1 min-h-[120px]"
            />
            <p className="text-[11px] text-gray-400 dark:text-[#525252] mt-1.5">
              Use <code className="text-[#3A9B9F]">{"{{1}}"}</code> for dynamic values. Requires Meta review.
            </p>
          </div>

          {/* Live preview */}
          <AnimatePresence>
            {newBody && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
              >
                <Label className="text-[10px] text-[#3A9B9F] uppercase tracking-widest">
                  Preview
                </Label>
                {/* WhatsApp bubble — signature element of templates page */}
                <div className="mt-2 bg-[#DCF8C6]/30 dark:bg-[#0C0C0C] border border-[#DCF8C6] dark:border-[#1C1C1C] rounded-2xl rounded-tl-sm p-4 max-w-[85%]">
                  <p className="text-[13px] text-gray-800 dark:text-[#A3A3A3] leading-relaxed whitespace-pre-wrap">
                    {newBody.split(/({{[\d]+}})/).map((part, i) =>
                      part.match(/{{[\d]+}}/) ? (
                        <span key={i} className="text-[#3A9B9F] font-medium">{part}</span>
                      ) : part
                    )}
                  </p>
                  <div className="flex justify-end mt-2">
                    <span className="text-[9px] text-gray-400 dark:text-[#525252]">12:00 PM ✓✓</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ModalFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#3A9B9F] hover:bg-[#2F8488] text-white"
              onClick={handleSaveTemplate}
              disabled={isSaving}
            >
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting…</> : "Submit for Review"}
            </Button>
          </ModalFooter>
        </div>
      </Modal>

    </div>
  )
}
