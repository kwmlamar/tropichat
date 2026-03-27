"use client"

import { useState, useEffect } from "react"
import { 
  PhoneCall, 
  ChatCircleDots, 
  EnvelopeSimple, 
  CaretLeft, 
  Plus, 
  Copy, 
  PencilSimple, 
  Check,
  Funnel,
  CaretDown,
  Trash,
  TrendUp
} from "@phosphor-icons/react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { getSupabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Modal } from "@/components/ui/modal"

type ScriptCategory = 'calling' | 'messaging' | 'email'

interface OutreachScript {
  id: string
  category: ScriptCategory
  industry: string
  title: string
  content: string
  status?: string
}

export default function OutreachPage() {
  const [scripts, setScripts] = useState<OutreachScript[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ScriptCategory>('calling')
  const [activeIndustry, setActiveIndustry] = useState('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingScript, setEditingScript] = useState<OutreachScript | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    industry: 'general',
    subject: '',
    status: 'ready',
    content: ''
  })

  useEffect(() => {
    fetchScripts()
  }, [])

  async function fetchScripts() {
    setLoading(true)
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('outreach_scripts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error("Failed to load scripts")
    } else {
      setScripts(data || [])
    }
    setLoading(false)
  }

  const filteredScripts = scripts.filter(s => 
    s.category === activeTab && (activeIndustry === 'all' || s.industry === activeIndustry)
  )

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Script copied to clipboard")
  }

  async function handleAddOrUpdate(e: React.FormEvent) {
    e.preventDefault()
    const supabase = getSupabase()
    
    const finalContent = activeTab === 'email' 
      ? `Subject: ${formData.subject}\n\n${formData.content}`
      : formData.content

    if (isEditing && editingScript) {
      const { error } = await supabase
        .from('outreach_scripts')
        .update({
          title: formData.title,
          industry: formData.industry,
          content: finalContent,
          status: formData.status
        })
        .eq('id', editingScript.id)

      if (error) toast.error("Update failed")
      else {
        toast.success("Script updated")
        setIsAddModalOpen(false)
        setIsEditing(false)
        fetchScripts()
      }
    } else {
      const { error } = await supabase
        .from('outreach_scripts')
        .insert({
          category: activeTab,
          industry: formData.industry,
          title: formData.title,
          content: finalContent,
          status: formData.status
        })

      if (error) toast.error("Creation failed")
      else {
        toast.success("New script added")
        setIsAddModalOpen(false)
        setFormData({ title: '', industry: 'general', subject: '', status: 'ready', content: '' })
        fetchScripts()
      }
    }
  }

  function openEdit(script: OutreachScript) {
    setEditingScript(script)
    setIsEditing(true)
    
    let extractedSubject = ""
    let extractedContent = (script.content || "").replace(/\\n/g, '\n')
    
    if (script.category === 'email' && extractedContent.toLowerCase().includes('subject:')) {
      const lines = extractedContent.split('\n')
      extractedSubject = lines[0].replace(/subject:\s*/gi, '')
      extractedContent = lines.slice(1).join('\n').trim()
    }

    setFormData({
      title: script.title,
      industry: script.industry,
      subject: extractedSubject,
      status: script.status || 'ready',
      content: extractedContent
    })
    setIsAddModalOpen(true)
  }

  async function deleteScript(id: string) {
    if (!confirm("Are you sure you want to delete this script?")) return
    const supabase = getSupabase()
    const { error } = await supabase.from('outreach_scripts').delete().eq('id', id)
    if (error) toast.error("Delete failed")
    else {
      toast.success("Script deleted")
      fetchScripts()
    }
  }

  const handleBlast = async () => {
    if (scripts.filter(s => s.status === 'ready' && s.category === 'email').length === 0) {
      toast.error("No EMAIL scripts are currently MISSION READY. Upgrade your strategy first! 🛰️")
      return
    }

    const toastId = toast.loading("Launching Strategic Blast Mission... 🚀🇧🇸")
    
    try {
      const supabase = getSupabase()
      // 1. Fetch COLD leads for the blast mission
      const { data: coldLeads } = await supabase
        .from('leads')
        .select('id')
        .eq('status', 'cold')
        .limit(25) // High-volume target

      if (!coldLeads || coldLeads.length === 0) {
        toast.error("No cold prospects available for this mission. Launch a Discovery Mission first! 🔎", { id: toastId })
        return
      }

      // 2. Select the first READY script for this blast
      const readyScript = scripts.find(s => s.status === 'ready' && s.category === 'email')
      if (!readyScript) return

      // 3. Dispatch the Mission to the Satellite API
      const res = await fetch("/api/admin/outreach/send", {
        method: "POST",
        body: JSON.stringify({
          leadIds: coldLeads.map(l => l.id),
          scriptId: readyScript.id,
          adminName: "Lamar"
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success(`Mission Success! ${data.stats.sent} prospects blasted across the islands. 🌴🇧🇸`, { 
          id: toastId,
          description: `Total: ${data.stats.total} | Sent: ${data.stats.sent} | Failed: ${data.stats.failed}`
        })
        fetchScripts()
      } else {
        toast.error(`Mission Failed: ${data.error}`, { id: toastId })
      }
    } catch (err: any) {
      toast.error("Satellite Communication Failure. Check your Resend API Key. 🛰️", { id: toastId })
    }
  }

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-2">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <button className="h-10 w-10 flex items-center justify-center bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/5 rounded-xl text-gray-400 hover:text-white transition-all shadow-sm">
              <CaretLeft weight="bold" className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-[#213138] dark:text-white tracking-tight">Outreach Command</h1>
            <p className="text-[12px] font-black text-gray-400 dark:text-[#525252] uppercase tracking-widest mt-1">High-Conversion Intellectual Assets</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBlast}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-tr from-[#EA580C] to-[#F97316] hover:brightness-110 text-white rounded-xl text-[13px] font-bold transition-all shadow-lg shadow-[#EA580C]/20 active:scale-95 group"
          >
            <TrendUp weight="bold" className="h-4 w-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
            Cold Outreach Blast
          </button>
          <button 
            onClick={() => { setIsEditing(false); setFormData({ title: '', industry: 'general', subject: '', status: 'ready', content: '' }); setIsAddModalOpen(true) }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#007B85] hover:bg-[#2F8488] text-white rounded-xl text-[13px] font-semibold transition-all shadow-sm active:scale-95"
          >
            <Plus weight="bold" className="h-4 w-4" />
            Add New Script
          </button>
        </div>
      </div>

      {/* Growth Intelligence Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#007B85] rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-[#007B85]/20">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <TrendUp weight="bold" className="h-4 w-4" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">Monthly Recurring Revenue</span>
            </div>
            <div className="flex items-baseline gap-3">
              <h2 className="text-5xl font-black tracking-tighter">$12,450.00</h2>
              <span className="text-xl font-bold opacity-60">/ $51,000.00 Target</span>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/10 backdrop-blur-md">
                <div className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-0.5">Growth Velocity</div>
                <div className="text-[14px] font-bold">+24% This Month</div>
              </div>
              <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/10 backdrop-blur-md">
                <div className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-0.5">Active Subscribers</div>
                <div className="text-[14px] font-bold">142 Island Partners</div>
              </div>
            </div>
          </div>
          {/* Abstract background flare */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-black/10 rounded-full blur-[60px]" />
        </div>

        <div className="bg-white dark:bg-[#0C0C0C] border border-gray-100 dark:border-white/5 rounded-3xl p-8 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-black text-gray-400 dark:text-[#525252] uppercase tracking-[0.2em] mb-4">Total Platform Revenue</div>
            <h3 className="text-3xl font-black text-[#213138] dark:text-white tracking-tight">$84,920.45</h3>
          </div>
          <div className="space-y-3 mt-8">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-gray-400 font-bold uppercase tracking-widest">Payout Status</span>
              <span className="text-[#007B85] font-black uppercase">Mission Ready ✅</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 dark:bg-[#1A1A1A] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "24%" }}
                className="h-full bg-[#007B85]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button 
          onClick={() => setActiveTab('calling')}
          className={cn(
            "p-6 rounded-2xl border transition-all text-left group",
            activeTab === 'calling' 
              ? "bg-[#007B85] border-[#007B85] text-white shadow-lg shadow-[#007B85]/20" 
              : "bg-white dark:bg-[#111111] border-gray-100 dark:border-white/5 text-gray-500 dark:text-[#525252] hover:border-[#007B85]/50"
          )}
        >
          <PhoneCall weight="bold" className="h-8 w-8 mb-4 transition-transform group-hover:scale-110" />
          <div className="font-black text-[13px] uppercase tracking-tight">Cold Calling</div>
          <div className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">Verbal Persuasion</div>
        </button>

        <button 
          onClick={() => setActiveTab('messaging')}
          className={cn(
            "p-6 rounded-2xl border transition-all text-left group",
            activeTab === 'messaging' 
              ? "bg-[#007B85] border-[#007B85] text-white shadow-lg shadow-[#007B85]/20" 
              : "bg-white dark:bg-[#111111] border-gray-100 dark:border-white/5 text-gray-500 dark:text-[#525252] hover:border-[#007B85]/50"
          )}
        >
          <ChatCircleDots weight="bold" className="h-8 w-8 mb-4 transition-transform group-hover:scale-110" />
          <div className="font-black text-[13px] uppercase tracking-tight">DM Outreach</div>
          <div className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">IG & WhatsApp Socials</div>
        </button>

        <button 
          onClick={() => setActiveTab('email')}
          className={cn(
            "p-6 rounded-2xl border transition-all text-left group",
            activeTab === 'email' 
              ? "bg-[#007B85] border-[#007B85] text-white shadow-lg shadow-[#007B85]/20" 
              : "bg-white dark:bg-[#111111] border-gray-100 dark:border-white/5 text-gray-500 dark:text-[#525252] hover:border-[#007B85]/50"
          )}
        >
          <EnvelopeSimple weight="bold" className="h-8 w-8 mb-4 transition-transform group-hover:scale-110" />
          <div className="font-black text-[13px] uppercase tracking-tight">Cold Email</div>
          <div className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">Corporate Lead Gen</div>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
        <Funnel weight="bold" className="text-gray-400 h-4 w-4 shrink-0" />
        {['all', 'retail', 'food', 'tourism', 'general', 'realestate'].map(ind => (
          <button
            key={ind}
            onClick={() => setActiveIndustry(ind)}
            className={cn(
              "px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
              activeIndustry === ind
                ? "bg-[#007B85] border-[#007B85] text-white"
                : "bg-white dark:bg-[#111111] border-gray-100 dark:border-white/5 text-gray-400 hover:text-white"
            )}
          >
            {ind}
          </button>
        ))}
      </div>

      {/* Scripts Display */}
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <div key="loading" className="text-center py-20">
              <div className="h-8 w-8 border-2 border-[#007B85] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Accessing Intelligence...</p>
            </div>
          ) : filteredScripts.length === 0 ? (
            <div key="empty" className="text-center py-20 bg-white/50 dark:bg-[#111111]/50 border border-dashed border-gray-200 dark:border-white/5 rounded-3xl">
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No Scripts Found in this Sector</p>
            </div>
          ) : (
            <div key="list" className="grid grid-cols-1 gap-6">
              {filteredScripts.map((script, idx) => (
                <motion.div
                  key={script.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white dark:bg-[#0C0C0C] border border-gray-100 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-[#007B85]/10 text-[#007B85] rounded-full text-[10px] font-black uppercase tracking-widest">
                          {script.industry}
                        </div>
                        <h3 className="text-lg font-black text-[#213138] dark:text-white tracking-tight">{script.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openEdit(script)}
                          className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#111111] text-gray-400 hover:text-[#007B85] transition-all shadow-sm"
                        >
                          <PencilSimple className="h-4 w-4" />
                        </button>
                        <button 
                           onClick={() => copyToClipboard(script.content)}
                           className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#111111] text-gray-400 hover:text-[#007B85] transition-all shadow-sm"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button 
                           onClick={() => deleteScript(script.id)}
                           className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#111111] text-red-500/50 hover:text-red-500 transition-all shadow-sm"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-50/50 dark:bg-[#050505] border border-gray-100 dark:border-white/5 rounded-2xl p-6 relative">
                      {script.category === 'email' ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-white/5">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest min-w-[60px]">Subject:</span>
                            <span className="text-[14px] font-bold text-[#213138] dark:text-white truncate">
                              {script.content.toLowerCase().includes('subject:') 
                                ? script.content.replace(/\\n/g, '\n').split('\n')[0].replace(/subject:\s*/gi, '') 
                                : script.title}
                            </span>
                          </div>
                          <pre className="text-[16px] font-medium text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-sans">
                            {script.content.toLowerCase().includes('subject:')
                              ? script.content.replace(/\\n/g, '\n').split('\n').slice(1).join('\n').trim()
                              : script.content.replace(/\\n/g, '\n')}
                          </pre>
                          <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                            <div className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg inline-block border shadow-sm",
                              script.status === 'ready' 
                                ? "bg-[#007B85]/10 text-[#007B85] border-[#007B85]/20"
                                : "bg-gray-100 dark:bg-white/5 text-gray-400 border-gray-200 dark:border-white/5"
                            )}>
                              STATUS: {script.status === 'ready' ? "READY FOR BLAST" : "DRAFT: REFINING"}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <pre className="text-[17px] font-medium text-gray-700 dark:text-white leading-relaxed whitespace-pre-wrap font-sans">
                            {script.content.replace(/\\n/g, '\n')}
                          </pre>
                          <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                            <div className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg inline-block border shadow-sm",
                              script.status === 'ready'
                                ? "bg-[#007B85]/10 text-[#007B85] border-[#007B85]/20"
                                : "bg-gray-100 dark:bg-white/5 text-gray-400 border-gray-200 dark:border-white/5"
                            )}>
                              STATUS: {script.status === 'ready' 
                                ? (script.category === 'messaging' ? "DIRECT MISSION READY" : "OPTIMIZED FOR CONVERSION")
                                : "DRAFT: INTEL REFINING"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title={isEditing ? "Update Script Intelligence" : "Add New Strategy"}
      >
        <form onSubmit={handleAddOrUpdate} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-gray-400 dark:text-[#525252] uppercase tracking-widest">
                Strategy Name
              </label>
              <div 
                onClick={() => setFormData({ ...formData, status: formData.status === 'ready' ? 'draft' : 'ready' })}
                className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full border cursor-pointer transition-all",
                  formData.status === 'ready' 
                    ? "bg-[#007B85] border-[#007B85] text-white"
                    : "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-400"
                )}
              >
                <div className={cn("h-1.5 w-1.5 rounded-full", formData.status === 'ready' ? "bg-white animate-pulse" : "bg-gray-400")} />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  {formData.status === 'ready' ? "Ready for Mission" : "In Draft"}
                </span>
              </div>
            </div>
            <input 
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. 24/7 Concierge"
              required
              className="w-full h-11 bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-white/5 rounded-xl px-4 text-sm focus:border-[#007B85] outline-none transition-all"
            />
            {activeTab === 'email' && (
              <div>
                <label className="text-[10px] font-black text-gray-400 dark:text-[#525252] uppercase tracking-widest mb-1.5 block">
                  Email Subject
                </label>
                <input 
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Stop losing bookings..."
                  required
                  className="w-full h-11 bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-white/5 rounded-xl px-4 text-sm focus:border-[#007B85] outline-none transition-all"
                />
              </div>
             )}
            <div>
              <label className="text-[10px] font-black text-gray-400 dark:text-[#525252] uppercase tracking-widest mb-1.5 block">Target Industry</label>
              <select 
                value={formData.industry}
                onChange={e => setFormData({ ...formData, industry: e.target.value })}
                className="w-full h-11 bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-white/5 rounded-xl px-4 text-sm focus:border-[#007B85] outline-none transition-all appearance-none"
              >
                {['general', 'retail', 'food', 'tourism', 'realestate'].map(ind => (
                  <option key={ind} value={ind}>{ind.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 dark:text-[#525252] uppercase tracking-widest mb-1.5 block">
                {activeTab === 'email' ? "Email Body" : "Script Content"}
              </label>
              <textarea 
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                placeholder="Paste the strategy here..."
                required
                rows={activeTab === 'email' ? 6 : 8}
                className="w-full bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-white/5 rounded-xl p-4 text-[16px] focus:border-[#007B85] outline-none transition-all resize-none"
              />
              <p className="text-[10px] text-gray-500 mt-2 italic">
                {activeTab === 'email' ? "Tip: Use [Name] to personalize while sending." : "Tip: Use [Name] or [Business Name] placeholders to personalize."}
              </p>
            </div>
          </div>
          <button 
            type="submit"
            className="w-full h-12 bg-[#007B85] hover:bg-[#2F8488] text-white rounded-xl font-bold text-[14px] transition-all shadow-sm active:scale-95"
          >
            {isEditing ? "Synchronize Updates" : "Deploy Strategy"}
          </button>
        </form>
      </Modal>
    </div>
  )
}
