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
  InstagramLogo
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function AdminDashboard() {
  const [waitlistCount, setWaitlistCount] = useState(0)
  const [leadsCount, setLeadsCount] = useState(0)
  const [usersCount, setUsersCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [revenueMetrics, setRevenueMetrics] = useState({ currentMRR: 0 })
  const [isScraping, setIsScraping] = useState(false)
  const [scrapeSource, setScrapeSource] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem("tropichat_last_source") || "google"
    return "google"
  })
  const [scrapeQuery, setScrapeQuery] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem("tropichat_last_query") || "Boutiques Nassau"
    return "Boutiques Nassau"
  })

  useEffect(() => {
    async function fetchAdminStats() {
      const client = getSupabase()

      // 1. Fetch Waitlist Signups count
      const { count: wCount } = await client
        .from('waitlist')
        .select('*', { count: 'exact', head: true })

      // 2. Fetch Leads count
      const { count: lCount } = await client
        .from('leads')
        .select('*', { count: 'exact', head: true })

      // 3. Fetch "Won" leads for outreach success calculation
      const { count: wDealsCount } = await client
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'won')

      setWaitlistCount(wCount || 0)
      setLeadsCount(lCount || 0)
      setUsersCount(wDealsCount || 0)
      setLoading(false)
    }

    fetchAdminStats()
  }, [])

  // Persist changes
  useEffect(() => {
    localStorage.setItem("tropichat_last_query", scrapeQuery)
  }, [scrapeQuery])

  useEffect(() => {
    localStorage.setItem("tropichat_last_source", scrapeSource)
  }, [scrapeSource])

  const runScraper = async () => {
    setIsScraping(true)
    const sourceLabel = scrapeSource.charAt(0).toUpperCase() + scrapeSource.slice(1)
    const toastId = toast.loading(`Launching ${sourceLabel} mission... hunting for ${scrapeQuery} 🔎`)
    
    try {
      const res = await fetch("/api/admin/scraper", {
        method: "POST",
        body: JSON.stringify({ query: scrapeQuery, source: scrapeSource }),
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success("Lead discovery complete! Fresh prospects added to your pipeline.", { id: toastId })
        // Refresh leads count
        const client = getSupabase()
        const { count } = await client.from('leads').select('*', { count: 'exact', head: true })
        setLeadsCount(count || 0)
      } else {
        toast.error(`Scraper error: ${data.error}`, { id: toastId })
      }
    } catch (err) {
      toast.error("Failed to reach scraping engine.", { id: toastId })
    } finally {
      setIsScraping(false)
    }
  }

  const handleBlast = async () => {
    const toastId = toast.loading("Launching Strategic Blast Mission... 🚀🇧🇸")
    
    try {
      const supabase = getSupabase()
      
      // 1. Fetch READY email strategy
      const { data: scripts } = await supabase
        .from('outreach_scripts')
        .select('id')
        .eq('status', 'ready')
        .eq('category', 'email')
        .limit(1)

      if (!scripts || scripts.length === 0) {
        toast.error("No EMAIL scripts are MISSION READY. Check Outreach Command. 🛰️", { id: toastId })
        return
      }

      // 2. Fetch COLD leads for this mission
      const { data: coldLeads } = await supabase
        .from('leads')
        .select('id')
        .eq('status', 'cold')
        .limit(25) // High-volume target

      if (!coldLeads || coldLeads.length === 0) {
        toast.error("No cold prospects available. Launch a Discovery Mission first! 🔎", { id: toastId })
        return
      }

      // 3. Dispatch to Satellite API
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
    } catch (err: any) {
      toast.error("Satellite Communication Failure. 🛰️", { id: toastId })
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[#213138] dark:text-white font-poppins">Admin Command Center</h1>
        <div className="flex items-center gap-2 mt-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-gray-500 dark:text-[#525252] font-black uppercase tracking-widest text-[11px]">System: Operational / Eleuthera, BS</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { name: 'Total Pipelines', value: leadsCount.toString(), icon: Inbox, color: "text-[#3A9B9F]", bg: "bg-gray-50 dark:bg-[#111111]", href: "/admin/leads" },
          { name: 'Goal: $60k Revenue', value: `$${revenueMetrics.currentMRR}`, icon: TrendingUp, color: "text-[#007B85]", bg: "bg-teal-50 dark:bg-teal-950/20", href: "/admin/revenue" },
          { name: 'Won Deals', value: usersCount.toString(), icon: Users, color: "text-[#FF8B66]", bg: "bg-gray-50 dark:bg-[#111111]", href: "/admin/analytics" },
          { name: 'Outreach Success', value: `${leadsCount > 0 ? Math.round((usersCount / leadsCount) * 100) : 0}%`, icon: TrendingUp, color: "text-green-500", bg: "bg-gray-50 dark:bg-[#111111]", href: "/admin/analytics" },
        ].map((item) => (
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

      {/* RECENT ACTIVITY & MISSION CONTROL GRID */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* QUICK ACTIONS COMMAND CENTER */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-[2.5rem] border border-gray-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C] overflow-hidden shadow-xl shadow-black/5 dark:shadow-none">
            <div className="p-8 border-b border-gray-100 dark:border-[#1C1C1C] flex items-center justify-between bg-gray-50/50 dark:bg-[#080808]/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#007B85]/10 rounded-2xl">
                  <Database weight="bold" className="h-6 w-6 text-[#007B85]" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#213138] dark:text-white font-poppins tracking-tight uppercase">Quick Actions</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">High-Velocity Mission Control</p>
                </div>
              </div>
              <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/5">
                {[
                  { id: 'google', icon: Globe, color: 'text-blue-500', activeBg: 'bg-white dark:bg-[#1A1A1A]' },
                  { id: 'facebook', icon: FacebookLogo, color: 'text-[#1877F2]', activeBg: 'bg-white dark:bg-[#1A1A1A]' },
                  { id: 'instagram', icon: InstagramLogo, color: 'text-[#E4405F]', activeBg: 'bg-white dark:bg-[#1A1A1A]' }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setScrapeSource(s.id)}
                    className={cn(
                      "p-2.5 rounded-lg transition-all flex items-center justify-center gap-2",
                      scrapeSource === s.id 
                        ? `${s.activeBg} ${s.color} shadow-sm ring-1 ring-black/5 dark:ring-white/10`
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-white"
                    )}
                  >
                    <s.icon weight="bold" className="h-5 w-5" />
                    {scrapeSource === s.id && <span className="text-[9px] font-black uppercase tracking-widest pr-1">{s.id}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Mission Input */}
              <div className="relative group">
                <p className="absolute -top-2.5 left-4 px-2 bg-white dark:bg-[#0C0C0C] text-[10px] font-black uppercase tracking-widest text-[#007B85] z-10">Discovery Query</p>
                <div className="relative flex items-center">
                  <Terminal weight="bold" className="absolute left-6 text-[#007B85] h-5 w-5 opacity-40 group-focus-within:opacity-100 transition-opacity" />
                  <input 
                    type="text"
                    value={scrapeQuery}
                    onChange={(e) => setScrapeQuery(e.target.value)}
                    placeholder="e.g. Boutiques Nassau"
                    className="w-full pl-16 pr-8 py-6 bg-gray-50/50 dark:bg-[#050505] border-2 border-gray-100 dark:border-white/5 rounded-[1.5rem] text-xl font-black text-[#213138] dark:text-white focus:border-[#007B85] outline-none transition-all shadow-inner placeholder:text-gray-300 dark:placeholder:text-[#1A1A1A]"
                  />
                </div>
              </div>

              {/* Action Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                  onClick={runScraper}
                  disabled={isScraping}
                  className="relative flex flex-col items-center justify-center p-8 rounded-[2rem] bg-[#007B85] hover:bg-[#2F8488] text-white transition-all group disabled:opacity-50 shadow-xl shadow-teal-500/20 active:scale-[0.98] overflow-hidden min-h-[160px]"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Globe weight="bold" className="h-24 w-24 -mr-8 -mt-8" />
                  </div>
                  <div className={cn("p-4 rounded-2xl bg-white/20 mb-4 transition-all group-hover:scale-110", isScraping && "animate-pulse")}>
                    <TrendingUp weight="bold" className="h-8 w-8" />
                  </div>
                  <div className="text-center">
                    <div className="font-black text-[14px] uppercase tracking-wider">{isScraping ? "📡 Scanning..." : "Discovery Mission"}</div>
                    <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">Satellite Lead Extraction</div>
                  </div>
                </button>

                <button 
                  onClick={handleBlast}
                  className="relative flex flex-col items-center justify-center p-8 rounded-[2rem] bg-gradient-to-tr from-[#EA580C] to-[#F97316] hover:brightness-110 text-white transition-all group shadow-xl shadow-orange-500/20 active:scale-[0.98] overflow-hidden min-h-[160px]"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Inbox weight="bold" className="h-24 w-24 -mr-8 -mt-8" />
                  </div>
                  <div className="p-4 rounded-2xl bg-white/20 mb-4 transition-all group-hover:scale-110">
                    <Inbox weight="bold" className="h-8 w-8" />
                  </div>
                  <div className="text-center">
                    <div className="font-black text-[14px] uppercase tracking-wider text-white">Outreach Blast</div>
                    <div className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">Mass Regional Dispatch</div>
                  </div>
                </button>
              </div>

              {/* Utility Hub */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
                <Link href="/admin/outreach" className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/5 hover:border-[#FEDA77] transition-all group">
                  <div className="p-2 bg-[#FEDA77]/10 text-[#FEDA77] rounded-xl group-hover:bg-[#FEDA77] group-hover:text-white transition-all">
                    <ChatCircleDots weight="bold" className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-tight text-[#213138] dark:text-white">Outreach Command</div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Scripts & Research</div>
                  </div>
                </Link>

                <Link href="/admin/revenue" className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/5 hover:border-green-500 transition-all group">
                  <div className="p-2 bg-green-500/10 text-green-500 rounded-xl group-hover:bg-green-500 group-hover:text-white transition-all">
                    <TrendingUp weight="bold" className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-tight text-[#213138] dark:text-white">Revenue Monitor</div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Growth Analytics</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* DEV OPS & METRICS */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-[2rem] border border-gray-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C] overflow-hidden shadow-sm">
            <div className="p-8 border-b border-gray-100 dark:border-[#1C1C1C]">
              <h3 className="text-xl font-black text-[#213138] dark:text-white flex items-center gap-3 font-poppins uppercase tracking-tight">
                <BarChart3 weight="bold" className="h-6 w-6 text-[#3A9B9F]" />
                Dev Ops
              </h3>
            </div>
            <div className="p-8 space-y-4">
              {[
                { label: 'System status', value: 'Healthy', color: 'text-green-600', border: 'border-l-green-500' },
                { label: 'Database', value: 'Online', color: 'text-[#3A9B9F]', border: 'border-l-[#3A9B9F]' },
                { label: 'Cloud Satellite', value: 'Connected', color: 'text-blue-500', border: 'border-l-blue-500' }
              ].map(stat => (
                <div key={stat.label} className={cn("p-5 rounded-2xl border-l-4 bg-gray-50 dark:bg-[#111111] text-gray-700 dark:text-[#A3A3A3] text-sm font-medium", stat.border)}>
                  {stat.label}: <span className={cn("font-black uppercase ml-1", stat.color)}>{stat.value}</span>
                </div>
              ))}
              <div className="pt-4">
                <div className="p-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 text-gray-500 dark:text-[#525252] text-[10px] font-black uppercase tracking-[0.2em] text-center">
                    CORE VERSION: <span className="font-mono ml-1 text-gray-900 dark:text-white">v0.1.0-ELITE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
