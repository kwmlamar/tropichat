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
          { name: 'Goal: $51k Revenue', value: `$${revenueMetrics.currentMRR}`, icon: TrendingUp, color: "text-[#007B85]", bg: "bg-teal-50 dark:bg-teal-950/20", href: "/admin/revenue" },
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

      {/* Recent Activity & Tools Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C] overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-[#1C1C1C]">
            <h3 className="text-xl font-bold text-[#213138] dark:text-white flex items-center gap-2 font-poppins">
              <Database weight="bold" className="h-5 w-5 text-[#3A9B9F]" />
              Quick Actions
            </h3>
          </div>
          <div className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-[#525252] ml-1">Mission Source</p>
                  <div className="flex gap-1">
                    {[
                      { id: 'google', icon: Globe, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                      { id: 'facebook', icon: FacebookLogo, color: 'text-[#1877F2]', bg: 'bg-[#1877F2]/10' },
                      { id: 'instagram', icon: InstagramLogo, color: 'text-[#E4405F]', bg: 'bg-[#E4405F]/10' }
                    ].map(s => (
                      <button
                        key={s.id}
                        onClick={() => setScrapeSource(s.id)}
                        className={cn(
                          "p-2 rounded-lg border transition-all",
                          scrapeSource === s.id 
                            ? `border-transparent ${s.bg} ${s.color} shadow-sm`
                            : "border-transparent text-gray-400 hover:text-white"
                        )}
                        title={s.id.toUpperCase()}
                      >
                        <s.icon weight="bold" className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-[#525252] ml-1">Mission Query</p>
                    <input 
                        type="text"
                        value={scrapeQuery}
                        onChange={(e) => setScrapeQuery(e.target.value)}
                        placeholder="e.g. Boutiques Nassau"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-white/5 rounded-2xl text-sm font-bold text-[#213138] dark:text-white focus:ring-1 focus:ring-[#3A9B9F] outline-none transition-all"
                    />
                </div>
            
            <button 
              onClick={runScraper}
              disabled={isScraping}
              className="w-full flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/5 hover:border-[#007B85] transition-all text-left group disabled:opacity-50 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className={cn("p-2.5 rounded-xl text-white transition-all", isScraping ? "bg-amber-500 animate-pulse" : "bg-[#007B85]")}>
                  <TrendingUp weight="bold" className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-[#213138] dark:text-white text-[13px] uppercase tracking-tight">{isScraping ? "Scanning Satellite..." : "Launch Discovery Mission"}</div>
                  <div className="text-[11px] font-bold text-gray-500 dark:text-[#525252] uppercase tracking-widest mt-0.5">{isScraping ? "Processing Google Maps Data" : "Find Real Nassau Prospects"}</div>
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-[#007B85]/10 flex items-center justify-center text-[#007B85] opacity-0 group-hover:opacity-100 transition-all">
                <TrendingUp weight="bold" className="h-4 w-4" />
              </div>
            </button>
            <button 
              onClick={handleBlast}
              className="w-full flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/5 hover:border-[#EA580C] transition-all text-left group shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-tr from-[#EA580C] to-[#F97316] text-white shadow-lg shadow-[#EA580C]/20">
                  <TrendingUp weight="bold" className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-[#213138] dark:text-white text-[13px] uppercase tracking-tight">Cold Outreach Blast</div>
                  <div className="text-[11px] font-bold text-gray-500 dark:text-[#525252] uppercase tracking-widest mt-0.5">Automated Regional Dispatch</div>
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-[#EA580C]/10 flex items-center justify-center text-[#EA580C] opacity-0 group-hover:opacity-100 transition-all">
                <TrendingUp weight="bold" className="h-4 w-4" />
              </div>
            </button>
          </div>

          {/* Outreach Hub */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-400 dark:text-[#525252] uppercase tracking-widest pl-1 text-[11px]">Outreach Intelligence</h3>
            <Link href="/admin/outreach" className="block w-full group">
              <div className="w-full flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/5 hover:border-[#FEDA77] transition-all text-left shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#FEDA77] to-[#F58529] text-white">
                    <ChatCircleDots weight="bold" className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-[#213138] dark:text-white text-[13px] uppercase tracking-tight">Outreach Command</div>
                    <div className="text-[11px] font-bold text-gray-500 dark:text-[#525252] uppercase tracking-widest mt-0.5">Scripts, Calling & DMs</div>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-[#FEDA77]/10 flex items-center justify-center text-[#FEDA77] opacity-0 group-hover:opacity-100 transition-all">
                  <CaretRight weight="bold" className="h-4 w-4" />
                </div>
              </div>
            </Link>

            <h3 className="text-[10px] font-black text-gray-400 dark:text-[#525252] uppercase tracking-widest pl-1 text-[11px] pt-4">Capital Growth</h3>
            <Link href="/admin/revenue" className="block w-full group">
              <div className="w-full flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-[#111111] border border-gray-100 dark:border-white/5 hover:border-[#007B85] transition-all text-left shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#007B85] to-[#2F8488] text-white shadow-lg shadow-teal-500/20">
                    <TrendingUp weight="bold" className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-[#213138] dark:text-white text-[13px] uppercase tracking-tight">Revenue Dashboard</div>
                    <div className="text-[11px] font-bold text-gray-500 dark:text-[#525252] uppercase tracking-widest mt-0.5">Track the $51k Capital Goal</div>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-[#007B85]/10 flex items-center justify-center text-[#007B85] opacity-0 group-hover:opacity-100 transition-all">
                  <CaretRight weight="bold" className="h-4 w-4" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C] overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-[#1C1C1C]">
            <h3 className="text-xl font-bold text-[#213138] dark:text-white flex items-center gap-2 font-poppins">
              <BarChart3 weight="bold" className="h-5 w-5 text-[#3A9B9F]" />
              Dev Ops
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-2xl border-l-4 border-l-green-500 bg-gray-50 dark:bg-[#111111] text-gray-700 dark:text-[#A3A3A3] text-sm font-medium">
                System status: <span className="font-black uppercase ml-1 text-green-600">Healthy</span>
            </div>
            <div className="p-4 rounded-2xl border-l-4 border-l-[#3A9B9F] bg-gray-50 dark:bg-[#111111] text-gray-700 dark:text-[#A3A3A3] text-sm font-medium">
                Database: <span className="font-black uppercase ml-1 text-[#3A9B9F]">Online</span>
            </div>
            <div className="p-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-[#525252] text-[11px] font-bold uppercase tracking-widest">
                Latest Deployment: <span className="font-mono ml-1 text-gray-900 dark:text-white">v0.1.0-alpha-nas</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
