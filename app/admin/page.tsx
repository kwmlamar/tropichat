"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase"
import Link from "next/link"
import {
  Tray as Inbox,
  UserPlus,
  Users,
  SquaresFour as LayoutDashboard,
  Database,
  TrendUp as TrendingUp,
  Calendar,
  ChartBar as BarChart3,
  Terminal,
  Copy,
  ChatCircleDots,
  CaretRight,
  Globe,
  FacebookLogo,
  InstagramLogo,
  Clock,
  CheckCircle,
  Phone,
  WhatsappLogo,
  Notebook
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { cn, formatDate, formatDistanceToNow } from "@/lib/utils"

export default function AdminDashboard() {
  const [waitlistCount, setWaitlistCount] = useState(0)
  const [leadsCount, setLeadsCount] = useState(0)
  const [usersCount, setUsersCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [callToday, setCallToday] = useState<any[]>([])
  const [calledTodayCount, setCalledTodayCount] = useState(0)
  const [revenueMetrics, setRevenueMetrics] = useState({ currentMRR: 0 })

  useEffect(() => {
    async function init() {
      await fetchAdminStats()
      await fetchAdminStats()
      await fetchCallToday()
    }
    init()
  }, [])

  async function fetchAdminStats() {
    const client = getSupabase()

    const { count: wCount } = await client
      .from("waitlist")
      .select("*", { count: "exact", head: true })

    const { count: lCount } = await client
      .from("leads")
      .select("*", { count: "exact", head: true })

    const { count: wDealsCount } = await client
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "won")

    setWaitlistCount(wCount || 0)
    setLeadsCount(lCount || 0)
    setUsersCount(wDealsCount || 0)
    setLoading(false)
  }

  const fetchCallToday = async () => {
    const client = getSupabase()
    const today = new Date().toLocaleDateString("en-CA")

    const { data } = await client
      .from("leads")
      .select("*")
      .lte("call_today_date" as any, today)
      .is("called_at" as any, null)
      .order("call_today_date" as any, { ascending: true })

    const { count } = await (client.from("leads") as any)
      .select("*", { count: "exact", head: true })
      .eq("call_today_date" as any, today)
      .not("called_at" as any, "is", null)

    setCallToday(data || [])
    setCalledTodayCount(count || 0)
  }

  const markAsCalled = async (lead: any) => {
    const client = getSupabase()
    const { error } = await (client.from("leads") as any)
      .update({
        called_at: new Date().toISOString(),
        status: "contacted",
        last_contacted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any)
      .eq("id" as any, lead.id)

    if (error) {
      toast.error("Failed to mark as called")
    } else {
      toast.success(`${lead.business_name} marked as called!`)
      setCallToday(prev => prev.filter(l => l.id !== lead.id))
      setCalledTodayCount(prev => prev + 1)
    }
  }





  const handleBlast = async () => {
    const toastId = toast.loading("Launching Strategic Blast Mission... 🚀🇧🇸")

    try {
      const supabase = getSupabase()

      const { data: scripts } = await supabase
        .from("outreach_scripts")
        .select("id")
        .eq("status", "ready")
        .eq("category", "email")
        .limit(1)

      if (!scripts || scripts.length === 0) {
        toast.error("No EMAIL scripts are MISSION READY. Check Outreach Command. 🛰️", { id: toastId })
        return
      }

      const { data: coldLeads } = await supabase
        .from("leads")
        .select("id")
        .eq("status", "cold")
        .limit(25)

      if (!coldLeads || coldLeads.length === 0) {
        toast.error("No cold prospects available. Launch a Discovery Mission first! 🔎", { id: toastId })
        return
      }

      const res = await fetch("/api/admin/outreach/send", {
        method: "POST",
        body: JSON.stringify({
          leadIds: coldLeads.map(l => l.id),
          scriptId: scripts[0].id,
          adminName: "Lamar"
        })
      })

      const data = await res.json()

      if (data.success) {
        toast.success(`Mission Success! ${data.stats.sent} prospects blasted across the islands. 🌴🇧🇸`, {
          id: toastId,
          description: `Total: ${data.stats.total} | Sent: ${data.stats.sent} | Failed: ${data.stats.failed}`
        })
      } else {
        toast.error(`Mission Failed: ${data.error}`, { id: toastId })
      }
    } catch {
      toast.error("Satellite Communication Failure. 🛰️", { id: toastId })
    }
  }

  const waStatusConfig: Record<string, { label: string; className: string }> = {
    verified: { label: "WA ✓", className: "bg-green-500/10 border-green-500/20 text-green-500" },
    likely:   { label: "Likely", className: "bg-amber-500/10 border-amber-500/20 text-amber-500" },
    no_phone: { label: "No #", className: "bg-red-500/10 border-red-500/20 text-red-400" },
    unchecked:{ label: "?", className: "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400" }
  }

  const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
  const progressPct = Math.min((calledTodayCount / 20) * 100, 100)

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#213138] dark:text-white font-poppins">Conversion Command Center</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-gray-500 dark:text-[#525252] font-black uppercase tracking-widest text-[11px]">Mission: Converting Inquiries into Bookings / Bahamas</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { name: "Active Pipelines", value: leadsCount.toString(), icon: Inbox, color: "text-[#3A9B9F]", bg: "bg-gray-50 dark:bg-[#111111]", href: "/admin/leads" },
          { name: "Revenue Target", value: `$${revenueMetrics.currentMRR}`, icon: TrendingUp, color: "text-[#007B85]", bg: "bg-teal-50 dark:bg-teal-950/20", href: "/admin/revenue" },
          { name: "Successful Bookings", value: usersCount.toString(), icon: Users, color: "text-[#FF8B66]", bg: "bg-gray-50 dark:bg-[#111111]", href: "/admin/analytics" },
          { name: "Conversion Rate", value: `${leadsCount > 0 ? Math.round((usersCount / leadsCount) * 100) : 0}%`, icon: TrendingUp, color: "text-green-500", bg: "bg-gray-50 dark:bg-[#111111]", href: "/admin/analytics" }
        ].map(item => (
          <Link
            key={item.name}
            href={item.href}
            className="relative overflow-hidden rounded-[2rem] border border-gray-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C] p-8 transition-all hover:border-[#3A9B9F] group shadow-sm"
          >
            <div className="flex flex-col gap-6">
              <div className={`w-fit p-3 rounded-2xl ${item.bg} ${item.color} border border-gray-100 dark:border-white/5 group-hover:scale-110 transition-transform`}>
                <item.icon weight="bold" className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-[#525252] mb-1">{item.name}</p>
                <p className="text-3xl font-black text-[#213138] dark:text-white tabular-nums tracking-tighter">{item.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* MISSION CONTROL GRID */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-stretch text-left">

        {/* LEFT: CALL TODAY (Focal Point) */}
        <div className="lg:col-span-5 h-full">
          <div className="rounded-[2.5rem] border border-gray-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C] overflow-hidden shadow-xl shadow-black/5 flex flex-col h-full border-t-4 border-t-[#3A9B9F]">

            {/* Header */}
            <div className="p-7 border-b border-gray-100 dark:border-[#1C1C1C] flex items-center justify-between bg-gray-50/50 dark:bg-[#080808]/40">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#3A9B9F]/10 rounded-2xl shadow-inner">
                  <Phone weight="bold" className="h-6 w-6 text-[#3A9B9F]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#213138] dark:text-white font-poppins uppercase tracking-tight">Call Today</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{todayLabel}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-[#213138] dark:text-white tabular-nums leading-none tracking-tighter">
                  {calledTodayCount}
                  <span className="text-sm text-gray-400 font-bold ml-1">/20</span>
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest text-[#3A9B9F] mt-1 italic">Calls Completed</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-gray-100 dark:bg-white/5 relative">
              <div
                className={cn(
                  "h-full transition-all duration-1000 ease-out",
                  progressPct >= 100 ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "bg-[#3A9B9F] shadow-[0_0_8px_rgba(58,155,159,0.3)]"
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* List */}
            <div className="p-6 flex-1 max-h-[780px] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-20 grayscale opacity-50">
                  <div className="h-8 w-8 border-4 border-[#3A9B9F]/20 border-t-[#3A9B9F] rounded-full animate-spin" />
                  <div className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Encrypting Queue...</div>
                </div>
              ) : callToday.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div className="h-16 w-16 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-gray-100 dark:border-white/5 rotate-3">
                    {calledTodayCount >= 20
                      ? <CheckCircle weight="fill" className="text-green-400 h-8 w-8" />
                      : <Phone weight="bold" className="text-gray-200 h-8 w-8" />
                    }
                  </div>
                  <h4 className="text-sm font-black text-[#213138] dark:text-white mb-2 uppercase tracking-tight">
                    {calledTodayCount >= 20 ? "Mission Accomplished" : "Queue Empty"}
                  </h4>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed max-w-[200px] mx-auto opacity-70">
                    {calledTodayCount >= 20
                      ? "The 20-call quota for today has been secured. 🌴"
                      : "Tropi AI is hunting for new leads. Check back shortly."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {callToday.map(lead => {
                    const wa = waStatusConfig[lead.whatsapp_status as string] || waStatusConfig.unchecked
                    return (
                      <div
                        key={lead.id}
                        className="group relative p-5 bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/5 rounded-3xl hover:border-[#3A9B9F]/40 hover:shadow-xl hover:shadow-[#3A9B9F]/5 transition-all duration-300 active:scale-[0.99]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                wa.className
                              )}>
                                <WhatsappLogo weight="fill" className="h-3 w-3" />
                                {wa.label}
                              </span>
                              {lead.category && (
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-[9px] font-black uppercase tracking-widest text-[#525252] border border-gray-200 dark:border-white/10">
                                  {lead.category}
                                </span>
                              )}
                            </div>
                            
                            <Link href={`/admin/leads/${lead.id}`}>
                              <h4 className="text-base font-black text-[#213138] dark:text-white truncate group-hover:text-[#3A9B9F] transition-colors leading-tight tracking-tight">
                                {lead.business_name}
                              </h4>
                            </Link>

                            <div className="mt-2 flex items-center gap-3">
                              <p className="text-xs font-black text-gray-400 dark:text-gray-500 font-mono tracking-tighter">
                                {lead.contact_phone || "No phone discovered"}
                              </p>
                            </div>

                            {lead.notes && (
                              <div className="mt-3 flex gap-2">
                                <Notebook weight="bold" className="h-3 w-3 text-[#3A9B9F] flex-shrink-0 mt-0.5 opacity-50" />
                                <p className="text-[10px] text-gray-500 font-bold italic line-clamp-1 leading-relaxed">
                                  {lead.notes}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => markAsCalled(lead)}
                              className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl text-gray-400 hover:text-white hover:bg-green-500 transition-all border border-gray-100 dark:border-white/10 shadow-sm"
                            >
                              <CheckCircle weight="fill" className="h-5 w-5" />
                            </button>
                            {lead.contact_phone && (
                                <a
                                  href={`https://wa.me/${lead.contact_phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl text-gray-400 hover:text-white hover:bg-[#25D366] transition-all border border-gray-100 dark:border-white/10 shadow-sm"
                                >
                                  <WhatsappLogo weight="fill" className="h-5 w-5" />
                                </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="p-7 bg-gray-50/30 dark:bg-[#080808]/30 border-t border-gray-100 dark:border-[#1C1C1C]">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#3A9B9F]/5 border border-[#3A9B9F]/10">
                <div className="p-1.5 bg-[#3A9B9F] rounded-lg text-white">
                  <Database weight="bold" className="h-3 w-3" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#3A9B9F] mb-1">Autonomous Protocol</div>
                  <div className="text-[10px] font-bold text-gray-500 dark:text-[#666] leading-relaxed">
                    Tropi AI refreshes this queue daily. We prioritize businesses that need faster replies to capture more bookings.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: OUTREACH TOOLS (High Velocity Center) */}
        <div className="lg:col-span-7 space-y-8">
          
          <div className="rounded-[2.5rem] border border-gray-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C] overflow-hidden shadow-2xl shadow-black/5 dark:shadow-none p-1">
             <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-[#1C1C1C]">
                <div className="flex-1 p-8 space-y-6 text-left">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-500/10 rounded-2xl">
                            <TrendingUp weight="bold" className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-[#213138] dark:text-white font-poppins tracking-tight uppercase leading-none">Booking acceleration</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">High-Velocity Conversion Control</p>
                        </div>
                    </div>

                    <button
                        onClick={handleBlast}
                        className="w-full relative group flex flex-col items-center justify-center p-10 rounded-[2rem] bg-gradient-to-tr from-[#EA580C] to-[#F97316] hover:brightness-110 text-white transition-all shadow-xl shadow-orange-500/20 active:scale-[0.98] overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Inbox weight="bold" className="h-32 w-32 -mr-12 -mt-12" />
                        </div>
                        <div className="p-5 rounded-[1.5rem] bg-white/20 mb-5 transition-all group-hover:scale-110 shadow-lg backdrop-blur-md text-center">
                            <Inbox weight="bold" className="h-10 w-10 text-white mx-auto" />
                        </div>
                        <div className="text-center">
                            <div className="font-black text-[18px] uppercase tracking-wider mb-1">Accelerate Bookings</div>
                            <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Targets: 25 High-Intent Leads 📡</div>
                        </div>
                    </button>
                    
                    <div className="p-5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-2">
                        <div className="flex items-center gap-2">
                            <Clock weight="bold" className="h-3.5 w-3.5 text-orange-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#213138] dark:text-white">Active Operational Strategy</span>
                        </div>
                        <p className="text-[11px] font-bold text-gray-500 dark:text-[#777] leading-relaxed">
                          Your acceleration mission uses high-conversion "Lamar Standard" scripts designed to turn inquiries into confirmed bookings.
                        </p>
                    </div>
                </div>

                <div className="w-full md:w-[320px] p-8 bg-gray-50/40 dark:bg-[#080808]/40 space-y-8 text-left">
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 px-2">Mission Intelligence</p>
                        <div className="space-y-3">
                            <Link href="/admin/outreach" className="flex items-center gap-4 p-5 rounded-[1.8rem] bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/10 hover:border-[#FEDA77] hover:shadow-lg hover:shadow-[#FEDA77]/5 transition-all group">
                                <div className="p-3 bg-[#FEDA77]/10 text-[#FEDA77] rounded-xl group-hover:bg-[#FEDA77] group-hover:text-white transition-all shadow-inner">
                                    <ChatCircleDots weight="bold" className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="text-[12px] font-black uppercase tracking-tight text-[#213138] dark:text-white group-hover:text-[#FEDA77]">Outreach Scripts</div>
                                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Tactical Comms</div>
                                </div>
                            </Link>

                            <Link href="/admin/leads" className="flex items-center gap-4 p-5 rounded-[1.8rem] bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/10 hover:border-[#3A9B9F] hover:shadow-lg hover:shadow-[#3A9B9F]/5 transition-all group">
                                <div className="p-3 bg-[#3A9B9F]/10 text-[#3A9B9F] rounded-xl group-hover:bg-[#3A9B9F] group-hover:text-white transition-all shadow-inner">
                                    <Database weight="bold" className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="text-[12px] font-black uppercase tracking-tight text-[#213138] dark:text-white group-hover:text-[#3A9B9F]">Master Pipeline</div>
                                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Full Reconnaissance</div>
                                </div>
                            </Link>

                            <Link href="/admin/revenue" className="flex items-center gap-4 p-5 rounded-[1.8rem] bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/10 hover:border-green-500 hover:shadow-lg hover:shadow-green-500/5 transition-all group">
                                <div className="p-3 bg-green-500/10 text-green-500 rounded-xl group-hover:bg-green-500 group-hover:text-white transition-all shadow-inner">
                                    <TrendingUp weight="bold" className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="text-[12px] font-black uppercase tracking-tight text-[#213138] dark:text-white group-hover:text-green-500">Revenue Hub</div>
                                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Growth Metrics</div>
                                </div>
                            </Link>
                        </div>
                     </div>

                     <div className="pt-4 border-t border-gray-200 dark:border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#3A9B9F] px-2 mb-3">Live Network Status</p>
                        <div className="px-4 py-3 rounded-2xl bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/5">
                             <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-500 uppercase">Latency</span>
                                <span className="text-[10px] font-black text-green-500 uppercase tracking-tighter">12ms (Optimal)</span>
                             </div>
                             <div className="w-full h-1 bg-gray-50 dark:bg-white/5 rounded-full mt-2 overflow-hidden">
                                <div className="w-4/5 h-full bg-green-500" />
                             </div>
                        </div>
                     </div>
                </div>
             </div>
          </div>

          {/* ADDED: MISSION SCRIPTS (QUICK REFERENCE) */}
          <div className="rounded-[2.5rem] border border-gray-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C] p-8 shadow-sm text-left">
             <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-teal-500/10 rounded-2xl">
                    <ChatCircleDots weight="bold" className="h-6 w-6 text-teal-500" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-[#213138] dark:text-white font-poppins tracking-tight uppercase leading-none">Script Reference</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Live Copy for Calling</p>
                </div>
             </div>
             
             <div className="space-y-6">
                <div className="p-6 rounded-[2rem] bg-gray-50 dark:bg-[#080808] border border-gray-100 dark:border-white/5 relative group">
                    <div className="absolute top-4 right-6 flex items-center gap-2">
                       <span className="px-2 py-0.5 rounded-full bg-[#3A9B9F]/10 text-[#3A9B9F] text-[8px] font-black uppercase tracking-widest border border-[#3A9B9F]/20">Tour Operator Primary</span>
                    </div>
                    <div className="space-y-4 text-sm font-bold text-[#213138] dark:text-gray-200 leading-relaxed italic">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        <p>“Quick one — I help tour operators turn messages and inquiries into more bookings.”</p>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-60">
                         <span className="text-[9px] uppercase tracking-widest text-[#3A9B9F] not-italic font-black px-1 bg-[#3A9B9F]/5 rounded-sm">Stop talking / Listen</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <p>“Most places already get people asking about tours, but a lot of them disappear before booking.”</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <p>“You getting most of your bookings through WhatsApp, Instagram, or your website?”</p>
                      </div>

                      <div className="flex items-center gap-2 text-[#EA580C]">
                        <span>🔥</span>
                        <p>“Yeah, that’s where people usually drop off. They ask a few questions then never come back.”</p>
                      </div>

                      <div className="flex items-center gap-2 text-[#007B85]">
                        <span>💰</span>
                        <p>“What I do is help you reply faster and follow up with people so more of those inquiries actually turn into bookings.”</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText('“Quick one — I help tour operators turn messages and inquiries into more bookings.”');
                                toast.success('Opener copied!');
                            }}
                            className="flex-1 py-2 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 text-[9px] font-black uppercase tracking-widest text-[#213138] dark:text-white hover:border-[#3A9B9F] transition-all"
                        >
                            Copy Opener
                        </button>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText('“What I do is help you reply faster and follow up with people so more of those inquiries actually turn into bookings.”');
                                toast.success('The Pitch copied!');
                            }}
                            className="flex-1 py-2 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 text-[9px] font-black uppercase tracking-widest text-[#213138] dark:text-white hover:border-[#3A9B9F] transition-all"
                        >
                            Copy THE PITCH 💰
                        </button>
                    </div>
                </div>
             </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
