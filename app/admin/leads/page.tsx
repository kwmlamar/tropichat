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
  CaretLeft
} from "@phosphor-icons/react"
import { getSupabase } from "@/lib/supabase"
import { formatDate, formatDistanceToNow, cn } from "@/lib/utils"
import { useDebounce } from "@/lib/hooks"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Modal } from "@/components/ui/modal"
import Link from "next/link" // Added Link import

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

import { 
  Globe,
  FacebookLogo,
  InstagramLogo
} from "@phosphor-icons/react"

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
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

      {/* Search & Stats */}
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
            <div className="flex-1 bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl px-5 flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active</span>
                <span className="text-sm font-black text-[#213138] dark:text-white">{leads.length}</span>
            </div>
            <div className="flex-1 bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl px-5 flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-green-500">Won</span>
                <span className="text-sm font-black text-[#213138] dark:text-white">{leads.filter(l => l.status === 'won').length}</span>
            </div>
        </div>
      </div>

      {/* Data Core */}
      <div className="rounded-[2rem] border border-gray-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-[#1C1C1C] bg-gray-50/50 dark:bg-[#080808]">
                    <th scope="col" className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-[#525252]">Business</th>
                    <th scope="col" className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-[#525252]">Mission / Type</th>
                    <th scope="col" className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-[#525252]">Contact Intelligence</th>
                    <th scope="col" className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-[#525252]">Origin</th>
                    <th scope="col" className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-[#525252]">Mission Link</th>
                    <th scope="col" className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-[#525252]">Pipeline Status</th>
                    <th scope="col" className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-[#525252]">Action Plan</th>
                  </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#1C1C1C]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-[#525252]">
                    <div className="flex items-center justify-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-[#3A9B9F] animate-bounce" />
                       <span className="w-2 h-2 rounded-full bg-[#3A9B9F] animate-bounce [animation-delay:0.2s]" />
                       <span className="w-2 h-2 rounded-full bg-[#3A9B9F] animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-[#525252] font-medium italic">
                    No leads found. Run the prospector script to find some!
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="group hover:bg-gray-50/50 dark:hover:bg-[#111111] transition-all">
                    <td className="px-8 py-6">
                      <div>
                        <div className="font-black text-[#213138] dark:text-white uppercase tracking-tight text-base">{lead.business_name}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Local Discovery</div>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-poppins text-xs font-bold text-gray-600 dark:text-[#A3A3A3]">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-[#525252] border border-gray-100 dark:border-white/5">
                            {lead.category || "General"}
                        </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="text-sm text-[#213138] dark:text-gray-200 font-black tracking-tight">
                        {lead.instagram_handle ? `@${lead.instagram_handle.replace('@', '')}` : (lead.contact_phone || 'Scan for phone...')}
                      </div>
                      <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-0.5 opacity-80">{lead.contact_email || 'No email decoded'}</div>
                    </td>
                    <td className="px-6 py-6 font-poppins text-xs font-bold text-gray-600 dark:text-[#A3A3A3]">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-[#323232] border border-gray-100 dark:border-white/5">
                            {lead.source}
                        </span>
                    </td>
                    <td className="px-6 py-6">
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
                    <td className="px-6 py-6">
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
                    <td className="px-6 py-6">
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
