"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  UserPlus, 
  MagnifyingGlass as Search, 
  Plus,
  DotsThreeVertical as MoreVertical, 
  TrendUp,
  Notebook,
  Trash,
  CaretLeft,
  Funnel,
  Eye,
  EyeSlash,
  Gear,
  Globe,
  FacebookLogo,
  InstagramLogo,
  Check,
  Copy
} from "@phosphor-icons/react"
import { getSupabase } from "@/lib/supabase"
import { formatDate, formatDistanceToNow, cn } from "@/lib/utils"
import { useDebounce } from "@/lib/hooks"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { Modal } from "@/components/ui/modal"
import Link from "next/link"

type Lead = {
  id: string
  business_name: string
  contact_email: string | null
  contact_phone: string | null
  whatsapp_number: string | null
  instagram_handle: string | null
  facebook_page: string | null
  external_link: string | null
  source: string
  status: 'cold' | 'contacted' | 'demo' | 'callback' | 'won' | 'lost'
  notes: string | null
  category: string | null
  created_at: string
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false)
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false)
  const [customerEmails, setCustomerEmails] = useState<Set<string>>(new Set())
  
  // Persistent Settings
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("leads_visible_columns")
      return saved ? JSON.parse(saved) : ['business', 'type', 'notes', 'intelligence', 'status', 'plan']
    }
    return ['business', 'type', 'notes', 'intelligence', 'status', 'plan']
  })

  const [activeSourceFilter, setActiveSourceFilter] = useState('all')
  const [activeStatusFilter, setActiveStatusFilter] = useState('all')

  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [newLead, setNewLead] = useState({
    business_name: "",
    contact_phone: "",
    contact_email: "",
    instagram_handle: "",
    category: "Boutique",
    status: "cold"
  })
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Persist column changes
  useEffect(() => {
    localStorage.setItem("leads_visible_columns", JSON.stringify(visibleColumns))
  }, [visibleColumns])

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const client = getSupabase()
    
    let query = client
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (debouncedSearch) {
      query = query.or(`business_name.ilike.%${debouncedSearch}%,contact_phone.ilike.%${debouncedSearch}%,notes.ilike.%${debouncedSearch}%`)
    }

    const { data, error } = await query
    
    if (error) {
      toast.error("Failed to load leads")
      console.error(error)
    } else {
      setLeads(data || [])
      
      // Fetch customers to cross-reference
      const { data: customerData } = await client.from('customers').select('contact_email')
      if (customerData) {
        setCustomerEmails(new Set(customerData.map(c => c.contact_email?.toLowerCase() || '')))
      }
    }
    setLoading(false)
  }, [debouncedSearch])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const updateLeadStatus = async (id: string, newStatus: Lead['status']) => {
    const client = getSupabase()
    const { error } = await client
      .from('leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast.error("Failed to update status")
    } else {
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l))
      toast.success(`Lead moved to ${newStatus}`)
    }
  }

  const deleteLead = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return
    
    const client = getSupabase()
    const { error } = await client
      .from('leads')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error("Failed to delete lead")
    } else {
      setLeads(prev => prev.filter(l => l.id !== id))
      toast.success(`Leads purged: ${name}`)
    }
  }

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLead) return
    const client = getSupabase()
    
    const { error } = await client
      .from('leads')
      .update({
        business_name: editingLead.business_name,
        contact_phone: editingLead.contact_phone,
        contact_email: editingLead.contact_email,
        instagram_handle: editingLead.instagram_handle,
        category: editingLead.category
      })
      .eq('id', editingLead.id)

    if (error) {
      toast.error("Failed to update lead")
    } else {
      setLeads(prev => prev.map(l => l.id === editingLead.id ? editingLead : l))
      setIsEditModalOpen(false)
      setEditingLead(null)
      toast.success("Lead intelligence updated!")
    }
  }

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault()
    const client = getSupabase()
    
    const { data, error } = await client
      .from('leads')
      .insert([newLead])
      .select()

    if (error) {
      toast.error("Failed to add lead")
    } else {
      if (data) setLeads(prev => [data[0], ...prev])
      setIsAddModalOpen(false)
      setNewLead({
        business_name: "",
        contact_phone: "",
        contact_email: "",
        instagram_handle: "",
        category: "Boutique",
        status: "cold"
      })
      toast.success("Lead added to pipeline!")
    }
  }

  const toggleColumn = (col: string) => {
    setVisibleColumns(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    )
  }

  // Filter Logic
  const filteredLeads = leads.filter(l => {
    const matchesSource = activeSourceFilter === 'all' || (l.source && l.source.toLowerCase().includes(activeSourceFilter))
    const matchesStatus = activeStatusFilter === 'all' || l.status === activeStatusFilter
    return matchesSource && matchesStatus
  })

  const getNextStep = (status: Lead['status']) => {
    const steps = {
      cold: "Initial Reachout",
      contacted: "Follow up / Setup Demo",
      demo: "Close Deal / Terms",
      callback: "Final Follow up",
      won: "Onboarded",
      lost: "Review / Archive"
    }
    return steps[status] || "Discovery"
  }

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-4">
            <Link 
                href="/admin"
                className="p-3 rounded-2xl bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] text-gray-500 dark:text-[#525252] hover:text-[#3A9B9F] transition-all active:scale-90"
            >
                <CaretLeft weight="bold" className="h-5 w-5" />
            </Link>
            <div>
                <h1 className="text-3xl font-black text-[#213138] dark:text-white tracking-tight font-poppins">Leads Pipeline</h1>
                <p className="text-gray-500 dark:text-[#525252] mt-1 font-medium italic">Private Reconnaissance & Outreach Command</p>
            </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-[#111111] text-gray-600 dark:text-white text-[13px] font-semibold border border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-[#1C1C1C] transition-all active:scale-95 shadow-sm"
            >
                <Plus weight="bold" className="h-4 w-4 text-[#007B85]" />
                Add Lead
            </button>
            <button
                onClick={() => fetchLeads()}
                disabled={loading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#007B85] hover:bg-[#2F8488] text-white rounded-xl text-[13px] font-semibold transition-all active:scale-95 disabled:opacity-50"
            >
                <TrendUp weight="bold" className="h-4 w-4" />
                Refetch Leads
            </button>
        </div>
      </div>

      {/* Search & Stats & Filters */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 h-14 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#3A9B9F] transition-colors" weight="bold" />
            <input 
              type="text"
              placeholder="Search leads by name, phone or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-full pl-12 pr-6 bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl text-sm font-bold text-[#213138] dark:text-white outline-none focus:ring-1 focus:ring-[#3A9B9F] transition-all"
            />
          </div>
          <div className="flex items-center gap-2 h-14">
              <button 
                onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                className={cn(
                  "flex-1 bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl px-4 h-full flex items-center justify-center gap-2 hover:border-[#3A9B9F] transition-all group",
                  isColumnMenuOpen && "ring-1 ring-[#3A9B9F] border-[#3A9B9F]"
                )}
              >
                <Gear weight="bold" className="h-4 w-4 text-gray-400 group-hover:text-[#3A9B9F]" />
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest group-hover:text-[#3A9B9F]">Columns</span>
              </button>
              <button 
                onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                className={cn(
                  "flex-1 bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl px-4 h-full flex items-center justify-center gap-2 hover:border-[#3A9B9F] transition-all group",
                  isFilterMenuOpen && "ring-1 ring-[#3A9B9F] border-[#3A9B9F]"
                )}
              >
                <Funnel weight="bold" className="h-4 w-4 text-gray-400 group-hover:text-[#3A9B9F]" />
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest group-hover:text-[#3A9B9F]">Source</span>
              </button>
          </div>
        </div>

        {/* Visibility & Source Filter Badges */}
        <AnimatePresence>
          {(isColumnMenuOpen || isFilterMenuOpen) && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-[#0C0C0C]/50 border border-gray-100 dark:border-white/5 rounded-2xl p-4 overflow-hidden"
            >
              {isColumnMenuOpen && (
                <div className="space-y-3">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Columns</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'business', label: 'Business' },
                      { id: 'type', label: 'Mission / Type' },
                      { id: 'notes', label: 'Research Notes' },
                      { id: 'intelligence', label: 'Contact Intelligence' },
                      { id: 'origin', label: 'Origin' },
                      { id: 'link', label: 'Mission Link' },
                      { id: 'status', label: 'Pipeline Status' },
                      { id: 'plan', label: 'Action Plan' }
                    ].map(col => (
                      <button
                        key={col.id}
                        onClick={() => toggleColumn(col.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight border transition-all flex items-center gap-2",
                          visibleColumns.includes(col.id) 
                            ? "bg-[#007B85]/10 border-[#007B85]/20 text-[#007B85]"
                            : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-400"
                        )}
                      >
                        {visibleColumns.includes(col.id) ? <Eye weight="bold" className="h-3 w-3" /> : <EyeSlash weight="bold" className="h-3 w-3" />}
                        {col.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isFilterMenuOpen && (
                <div className={cn("space-y-6", isColumnMenuOpen && "mt-6 pt-6 border-t border-gray-100 dark:border-white/5")}>
                  <div className="space-y-3">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Discovery Origin</div>
                    <div className="flex flex-wrap gap-2">
                      {['all', 'google', 'instagram', 'facebook', 'notion', 'manual'].map(src => (
                        <button
                          key={src}
                          onClick={() => setActiveSourceFilter(src)}
                          className={cn(
                            "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all",
                            activeSourceFilter === src 
                              ? "bg-[#007B85]/10 border-[#007B85]/20 text-[#007B85]"
                              : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-400"
                          )}
                        >
                          {src}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pipeline Mission Status</div>
                    <div className="flex flex-wrap gap-2">
                      {['all', 'cold', 'contacted', 'demo', 'callback', 'won', 'lost'].map(status => (
                        <button
                          key={status}
                          onClick={() => setActiveStatusFilter(status)}
                          className={cn(
                            "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all",
                            activeStatusFilter === status 
                              ? (status === 'won' ? "bg-green-500/10 border-green-500/20 text-green-500" :
                                 status === 'contacted' ? "bg-[#EA580C]/10 border-[#EA580C]/20 text-[#EA580C]" :
                                 "bg-[#007B85]/10 border-[#007B85]/20 text-[#007B85]")
                              : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-400"
                          )}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: leads.length, color: 'text-gray-400' },
          { label: 'Won', value: leads.filter(l => l.status === 'won').length, color: 'text-green-500' },
          { label: 'Contacted', value: leads.filter(l => l.status === 'contacted').length, color: 'text-[#EA580C]' },
          { label: 'Cold', value: leads.filter(l => l.status === 'cold').length, color: 'text-blue-400' }
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm">
            <span className={cn("text-[10px] font-black uppercase tracking-widest", stat.color)}>{stat.label}</span>
            <span className="text-lg font-black text-[#213138] dark:text-white leading-none">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Data Core */}
      <div className="rounded-[2rem] border border-gray-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-[#1C1C1C] bg-gray-50/50 dark:bg-[#080808]">
                    { visibleColumns.includes('business') && <th scope="col" className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-[#525252]">Business</th>}
                    { visibleColumns.includes('type') && <th scope="col" className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-[#525252]">Mission / Type</th>}
                    { visibleColumns.includes('notes') && <th scope="col" className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-[#525252]">Research Notes</th>}
                    { visibleColumns.includes('intelligence') && <th scope="col" className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-[#525252]">Contact Intelligence</th>}
                    { visibleColumns.includes('origin') && <th scope="col" className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-[#525252]">Origin</th>}
                    { visibleColumns.includes('link') && <th scope="col" className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-[#525252]">Mission Link</th>}
                    { visibleColumns.includes('status') && <th scope="col" className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-[#525252]">Pipeline Status</th>}
                    { visibleColumns.includes('plan') && <th scope="col" className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-[#525252]">Action Plan</th>}
                  </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#1C1C1C]">
              {loading ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="px-6 py-12 text-center text-gray-500 dark:text-[#525252]">
                    <div className="flex items-center justify-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-[#3A9B9F] animate-bounce" />
                       <span className="w-2 h-2 rounded-full bg-[#3A9B9F] animate-bounce [animation-delay:0.2s]" />
                       <span className="w-2 h-2 rounded-full bg-[#3A9B9F] animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} className="px-6 py-12 text-center text-gray-500 dark:text-[#525252] font-medium italic text-xs uppercase tracking-widest font-black">
                    {activeSourceFilter !== 'all' ? `No ${activeSourceFilter} Leads Detected` : "No Leads Found in Pipeline"}
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="group hover:bg-gray-50/50 dark:hover:bg-[#111111] transition-all">
                    {visibleColumns.includes('business') && (
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 group/name">
                          <Link href={`/admin/leads/${lead.id}`} className="hover:underline decoration-[#007B85] decoration-2 underline-offset-4">
                            <div className="font-black text-[#213138] dark:text-white uppercase tracking-tight text-base hover:text-[#007B85] transition-colors">{lead.business_name}</div>
                          </Link>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(lead.business_name);
                              toast.success(`Business name copied: ${lead.business_name}`);
                            }}
                            className="p-1.5 rounded-lg bg-gray-50 dark:bg-[#111111] text-gray-400 hover:text-[#007B85] transition-all opacity-0 group-hover/name:opacity-100"
                            title="Copy business name"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Local Discovery</div>
                          {lead.contact_email && customerEmails.has(lead.contact_email.toLowerCase()) && (
                            <div className="px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded text-[8px] font-black border border-green-500/20 animate-pulse">
                              SIGNUP DETECTED
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    {visibleColumns.includes('type') && (
                      <td className="px-6 py-6 transition-all">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-[#525252] border border-gray-100 dark:border-white/5">
                              {lead.category || "General"}
                          </span>
                      </td>
                    )}
                    {visibleColumns.includes('notes') && (
                      <td className="px-6 py-6 transition-all min-w-[200px]">
                        <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 line-clamp-2 max-w-[250px]" title={lead.notes || ""}>
                          {lead.notes || <span className="opacity-30 italic font-black text-[9px] tracking-widest uppercase">No Intel Logged</span>}
                        </div>
                      </td>
                    )}
                    {visibleColumns.includes('intelligence') && (
                      <td className="px-6 py-6 transition-all">
                        <div className="flex items-center gap-2 group/contact">
                          <div className="text-sm text-[#213138] dark:text-gray-200 font-black tracking-tight">
                            {lead.instagram_handle ? `@${lead.instagram_handle.replace('@', '')}` : (lead.contact_phone || 'Scan for phone...')}
                          </div>
                          {(lead.instagram_handle || (lead.contact_phone && lead.contact_phone !== 'Scan for phone...')) && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const text = lead.instagram_handle ? `@${lead.instagram_handle.replace('@', '')}` : (lead.contact_phone || '');
                                navigator.clipboard.writeText(text);
                                toast.success(`Contact copied: ${text}`);
                              }}
                              className="p-1 rounded-lg bg-gray-50 dark:bg-[#111111] text-gray-400 hover:text-[#007B85] transition-all opacity-0 group-hover/contact:opacity-100"
                              title="Copy contact"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5 opacity-80">{lead.contact_email || 'No email decoded'}</div>
                      </td>
                    )}
                    {visibleColumns.includes('origin') && (
                      <td className="px-6 py-6 transition-all">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-[#323232] border border-gray-100 dark:border-white/5">
                              {lead.source}
                          </span>
                      </td>
                    )}
                    {visibleColumns.includes('link') && (
                      <td className="px-6 py-6 transition-all">
                        {lead.external_link ? (
                          <a 
                            href={lead.external_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={cn(
                              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all hover:scale-105 active:scale-95 text-[10px] font-black uppercase tracking-widest shadow-sm",
                              lead.source.toLowerCase().includes('facebook') ? "bg-[#1877F2]/10 border-[#1877F2]/20 text-[#1877F2]" :
                              lead.source.toLowerCase().includes('instagram') ? "bg-[#E4405F]/10 border-[#E4405F]/20 text-[#E4405F]" :
                              "bg-blue-500/10 border-blue-500/20 text-blue-500"
                            )}
                          >
                            {lead.source.toLowerCase().includes('facebook') ? <FacebookLogo weight="bold" className="h-4 w-4" /> :
                             lead.source.toLowerCase().includes('instagram') ? <InstagramLogo weight="bold" className="h-4 w-4" /> :
                             <Globe weight="bold" className="h-4 w-4" />}
                            Open Profile
                          </a>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-[#323232] italic opacity-50">Discovery Hub</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes('status') && (
                      <td className="px-6 py-6 transition-all">
                        <select 
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value as Lead['status'])}
                          className="bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#3A9B9F] cursor-pointer transition-all"
                        >
                          <option value="cold">Cold</option>
                          <option value="contacted">Contacted</option>
                          <option value="demo">Demo</option>
                          <option value="callback">Callback</option>
                          <option value="won">Won</option>
                          <option value="lost">Lost</option>
                        </select>
                      </td>
                    )}
                    {visibleColumns.includes('plan') && (
                      <td className="px-6 py-6 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="text-[10px] font-black text-[#3A9B9F] bg-[#3A9B9F]/10 px-3 py-1.5 rounded-full uppercase tracking-widest">
                            {getNextStep(lead.status)}
                          </div>
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                              onClick={() => { setEditingLead(lead); setIsEditModalOpen(true); }}
                              className="p-2 bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-white/5 rounded-xl hover:text-[#3A9B9F] transition-all"
                              >
                              <Notebook className="h-4 w-4" />
                              </button>
                              <button 
                              onClick={() => deleteLead(lead.id, lead.business_name)}
                              className="p-2 bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-white/5 rounded-xl hover:text-red-500 transition-all"
                              >
                              <Trash className="h-4 w-4" />
                              </button>
                          </div>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Add Lead Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Ingest New Prospect"
        description="Add a cold lead manually to your pipeline"
      >
        <form onSubmit={handleAddLead} className="space-y-6 pt-4">
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#525252]">Business Name</label>
                    <input 
                        required
                        type="text" 
                        value={newLead.business_name}
                        onChange={(e) => setNewLead({...newLead, business_name: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-white/5 rounded-xl text-sm font-bold text-[#213138] dark:text-white outline-none focus:ring-1 focus:ring-[#3A9B9F]"
                        placeholder="e.g. Nassau Boutique"
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#525252]">Mission / Category</label>
                        <input 
                            type="text" 
                            value={newLead.category}
                            onChange={(e) => setNewLead({...newLead, category: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-white/5 rounded-xl text-sm font-bold text-[#213138] dark:text-white outline-none focus:ring-1 focus:ring-[#3A9B9F]"
                            placeholder="e.g. Boutique"
                        />
                    </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#525252]">Instagram</label>
                        <input 
                            type="text" 
                            value={newLead.instagram_handle}
                            onChange={(e) => setNewLead({...newLead, instagram_handle: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-white/5 rounded-xl text-sm font-bold text-[#213138] dark:text-white outline-none focus:ring-1 focus:ring-[#3A9B9F]"
                            placeholder="@handle"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#525252]">Phone / WhatsApp</label>
                    <input 
                        type="text" 
                        value={newLead.contact_phone}
                        onChange={(e) => setNewLead({...newLead, contact_phone: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-white/5 rounded-xl text-sm font-bold text-[#213138] dark:text-white outline-none focus:ring-1 focus:ring-[#3A9B9F]"
                        placeholder="+1 242..."
                    />
                </div>
            </div>

              <button 
                  type="submit"
                  className="w-full px-5 py-2.5 bg-[#007B85] hover:bg-[#2F8488] text-white text-[13px] font-semibold rounded-xl transition-all shadow-sm active:scale-95"
              >
                  Confirm Ingestion
              </button>
        </form>
      </Modal>

      {/* Manual Edit Lead Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => { setIsEditModalOpen(false); setEditingLead(null); }}
        title="Refine Lead Intelligence"
        description="Update contact details and category for this boutique"
      >
        {editingLead && (
          <form onSubmit={handleUpdateLead} className="space-y-6 pt-4">
              <div className="space-y-4">
                  <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#525252]">Business Name</label>
                      <input 
                          required
                          type="text" 
                          value={editingLead.business_name}
                          onChange={(e) => setEditingLead({...editingLead, business_name: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-white/5 rounded-xl text-sm font-bold text-[#213138] dark:text-white outline-none focus:ring-1 focus:ring-[#3A9B9F]"
                      />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#525252]">Category</label>
                          <input 
                              type="text" 
                              value={editingLead.category || ""}
                              onChange={(e) => setEditingLead({...editingLead, category: e.target.value})}
                              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-white/5 rounded-xl text-sm font-bold text-[#213138] dark:text-white outline-none focus:ring-1 focus:ring-[#3A9B9F]"
                          />
                      </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#525252]">Instagram</label>
                          <input 
                              type="text" 
                              value={editingLead.instagram_handle || ""}
                              onChange={(e) => setEditingLead({...editingLead, instagram_handle: e.target.value})}
                              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-white/5 rounded-xl text-sm font-bold text-[#213138] dark:text-white outline-none focus:ring-1 focus:ring-[#3A9B9F]"
                          />
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#525252]">Phone</label>
                        <input 
                            type="text" 
                            value={editingLead.contact_phone || ""}
                            onChange={(e) => setEditingLead({...editingLead, contact_phone: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-white/5 rounded-xl text-sm font-bold text-[#213138] dark:text-white outline-none focus:ring-1 focus:ring-[#3A9B9F]"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#525252]">Email</label>
                        <input 
                            type="email" 
                            value={editingLead.contact_email || ""}
                            onChange={(e) => setEditingLead({...editingLead, contact_email: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-white/5 rounded-xl text-sm font-bold text-[#213138] dark:text-white outline-none focus:ring-1 focus:ring-[#3A9B9F]"
                        />
                    </div>
                  </div>
              </div>

              <button 
                  type="submit"
                  className="w-full px-5 py-2.5 bg-[#007B85] hover:bg-[#2F8488] text-white text-[13px] font-semibold rounded-xl transition-all shadow-sm active:scale-95"
              >
                  Save Intelligence
              </button>
          </form>
        )}
      </Modal>
    </div>
  )
}
