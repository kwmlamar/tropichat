"use client"

import { useState, useEffect, use } from "react"
import { 
  CaretLeft, 
  Phone, 
  InstagramLogo, 
  EnvelopeSimple, 
  MapPin, 
  Calendar, 
  Clock, 
  Notebook,
  CheckCircle,
  XCircle,
  Globe,
  FacebookLogo,
  FloppyDisk,
  Link as LinkIcon
} from "@phosphor-icons/react"
import { getSupabase } from "@/lib/supabase"
import { formatDate, formatDistanceToNow, cn } from "@/lib/utils"
import { toast } from "sonner"
import Link from "next/link"
import { motion } from "framer-motion"

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
  location: string | null
  created_at: string
  updated_at: string
}

export default function LeadProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    fetchLead()
  }, [id])

  async function fetchLead() {
    setLoading(true)
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      toast.error("Failed to load lead intelligence")
    } else {
      setLead(data)
      setNotes(data.notes || "")
    }
    setLoading(false)
  }

  async function handleSaveNotes() {
    setSaving(true)
    const supabase = getSupabase()
    const { error } = await supabase
      .from('leads')
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast.error("Failed to synchronize notes")
    } else {
      toast.success("Intelligence Log Synchronized")
      if (lead) setLead({ ...lead, notes })
    }
    setSaving(false)
  }

  async function updateStatus(newStatus: Lead['status']) {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast.error("Failed to update status")
    } else {
      toast.success(`Mission Status: ${newStatus.toUpperCase()}`)
      if (lead) setLead({ ...lead, status: newStatus })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="h-10 w-10 border-4 border-[#007B85] border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Decrypting Lead Intel...</p>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="p-6 bg-red-50 dark:bg-red-950/20 rounded-3xl border border-red-100 dark:border-red-900/30">
          <XCircle size={48} className="text-red-500 mx-auto" weight="duotone" />
          <h2 className="text-xl font-black text-red-600 mt-4 uppercase tracking-tight">Mission Failed</h2>
          <p className="text-sm text-red-500/70 mt-1 uppercase tracking-widest font-bold">Target ID Not Found in Database</p>
        </div>
        <Link href="/admin/leads">
          <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">
            <CaretLeft weight="bold" /> Return to Command
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-8">
      {/* Top Navigation & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link href="/admin/leads">
            <button className="h-12 w-12 flex items-center justify-center bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl text-gray-400 hover:text-[#007B85] transition-all shadow-sm group">
              <CaretLeft weight="bold" className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 bg-[#007B85]/10 text-[#007B85] border border-[#007B85]/20 rounded text-[9px] font-black uppercase tracking-widest">
                ID: {lead.id.split('-')[0]}
              </span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Discovered {formatDistanceToNow(lead.created_at)} ago
              </span>
            </div>
            <h1 className="text-4xl font-black text-[#213138] dark:text-white tracking-tight mt-1">{lead.business_name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-[#0C0C0C] p-2 rounded-[1.5rem] border border-gray-200 dark:border-[#1C1C1C] shadow-sm">
          <div className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pipeline Status</div>
          <select 
            value={lead.status}
            onChange={(e) => updateStatus(e.target.value as Lead['status'])}
            className="bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-white/10 rounded-xl text-[11px] font-black uppercase tracking-widest px-4 py-2 outline-none focus:ring-1 focus:ring-[#007B85] cursor-pointer transition-all min-w-[140px]"
          >
            <option value="cold">❄️ Cold</option>
            <option value="contacted">📞 Contacted</option>
            <option value="demo">✨ Demo</option>
            <option value="callback">⏳ Callback</option>
            <option value="won">🏆 Won</option>
            <option value="lost">❌ Lost</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Intelligence Grid */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-[2rem] p-8 space-y-8 shadow-sm">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <CheckCircle weight="fill" className="text-[#007B85]" /> Contact Intel
            </h3>

            <div className="space-y-6">
              {[
                { icon: Phone, label: 'Phone', value: lead.contact_phone, color: 'text-green-500', link: lead.contact_phone ? `tel:${lead.contact_phone}` : null },
                { icon: InstagramLogo, label: 'Instagram', value: lead.instagram_handle ? `@${lead.instagram_handle.replace('@', '')}` : null, color: 'text-pink-500', link: lead.instagram_handle ? `https://instagram.com/${lead.instagram_handle.replace('@', '')}` : null },
                { icon: EnvelopeSimple, label: 'Email', value: lead.contact_email, color: 'text-[#007B85]', link: lead.contact_email ? `mailto:${lead.contact_email}` : null },
                { icon: FacebookLogo, label: 'Facebook', value: lead.facebook_page, color: 'text-blue-600', link: lead.facebook_page || null },
                { icon: Globe, label: 'Origin', value: lead.source, color: 'text-amber-500' },
                { icon: MapPin, label: 'Location', value: lead.location || 'Caribbean (Unknown)', color: 'text-red-400' }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 group">
                  <div className={cn("mt-1 p-2 rounded-xl bg-gray-50 dark:bg-white/5", item.color.replace('text-', 'bg-opacity-10 '))}>
                    <item.icon size={18} className={item.color} weight="bold" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                    {item.link && item.value ? (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[15px] font-bold text-[#213138] dark:text-white hover:text-[#007B85] transition-colors flex items-center gap-1.5 underline underline-offset-4 decoration-gray-200 dark:decoration-white/10 group-hover:decoration-[#007B85]">
                         {item.value} <LinkIcon size={12} className="opacity-40" />
                      </a>
                    ) : (
                      <p className="text-[15px] font-bold text-[#213138] dark:text-white opacity-80">{item.value || 'N/A'}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {lead.external_link && (
              <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                <a 
                  href={lead.external_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-3 py-4 bg-gray-50 dark:bg-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#007B85]/10 hover:text-[#007B85] transition-all border border-gray-100 dark:border-white/5"
                >
                  <LinkIcon weight="bold" /> View Mission Source
                </a>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-[2rem] p-8 space-y-6 shadow-sm">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Mission Control</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-3 text-gray-400">
                  <Calendar size={18} weight="bold" />
                  <span className="text-[11px] font-bold uppercase tracking-tight">Onboarded</span>
                </div>
                <span className="text-[11px] font-black text-[#213138] dark:text-white">{formatDate(lead.created_at)}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-3 text-gray-400">
                  <Clock size={18} weight="bold" />
                  <span className="text-[11px] font-bold uppercase tracking-tight">Last Update</span>
                </div>
                <span className="text-[11px] font-black text-[#213138] dark:text-white">{formatDistanceToNow(lead.updated_at)} ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Research & Notes */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-[2.5rem] flex flex-col flex-1 shadow-md overflow-hidden">
            <div className="px-10 py-8 border-b border-gray-100 dark:border-[#1C1C1C] flex items-center justify-between bg-gray-50/30 dark:bg-[#080808]/30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#007B85]/10 rounded-2xl">
                  <Notebook size={24} className="text-[#007B85]" weight="duotone" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#213138] dark:text-white tracking-tight">Research & Call Intel</h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mt-0.5">Record every detail for the perfect demo</p>
                </div>
              </div>
              <button 
                onClick={handleSaveNotes}
                disabled={saving}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-[#007B85]/20",
                  saving ? "bg-gray-100 text-gray-400 border border-gray-200" : "bg-[#007B85] hover:bg-[#2F8488] text-white"
                )}
              >
                {saving ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FloppyDisk weight="bold" className="h-4 w-4" />
                )}
                {saving ? "Syncing..." : "Save Intel"}
              </button>
            </div>
            
            <div className="p-10 flex-1 flex flex-col">
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Start typing call notes, objections, business goals, or tech stack details here..."
                className="w-full flex-1 bg-transparent text-lg font-medium text-[#213138] dark:text-gray-100 outline-none resize-none placeholder:text-gray-300 dark:placeholder:text-[#323232] leading-relaxed min-h-[400px]"
              />
              
              <div className="mt-10 pt-8 border-t border-gray-100 dark:border-[#1C1C1C] flex items-center justify-between opacity-60">
                 <div className="text-[10px] font-black uppercase tracking-widest text-[#007B85]">
                   Tip: Use bullets to track objections.
                 </div>
                 <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">
                  Pressing Save Intel synchronizes with Central Intelligence
                 </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#007B85]/5 dark:bg-[#007B85]/5 border border-[#007B85]/10 rounded-[2rem] p-8 space-y-4">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#007B85]">Quick Strategy</h4>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed italic">
                 "Focus on $399 Elite Managed value. Mention the 'Cash Machine' re-engagement specifically for their {lead.category || 'sector'} business."
              </p>
            </div>
            
            <div className="bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/10 rounded-[2rem] p-8 space-y-4">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">Reconnaissance Note</h4>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed italic">
                 Observe their {lead.source} presence. Mention how slow their current response time is to create a gap for AI.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
