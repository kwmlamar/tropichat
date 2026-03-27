"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase"
import { 
  ChartBar, 
  TrendUp, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Globe, 
  Stack,
  ChartPieSlice,
  Lightning,
  WhatsappLogo,
  InstagramLogo,
  MessengerLogo,
  CaretLeft
} from "@phosphor-icons/react"
import { formatDate, cn } from "@/lib/utils"
import { motion } from "framer-motion"
import Link from "next/link"
import { ChannelIcon } from "@/components/dashboard/channel-icon"

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    waitlistCount: 0,
    activeUsers: 0,
    totalMessages: 0,
    conversionRate: 0,
    currentMRR: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const client = getSupabase()
      
      const { count: lCount } = await client.from('leads').select('*', { count: 'exact', head: true })
      const { count: wonCount } = await client.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'won')

      setStats({
        waitlistCount: lCount || 0,
        activeUsers: wonCount || 0,
        totalMessages: (lCount || 0) * 12, 
        conversionRate: lCount && lCount > 0 ? Math.round((wonCount || 0) / lCount * 100) : 0,
        currentMRR: (wonCount || 0) * 29, 
      })
      setLoading(false)
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-10 pb-16 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-6">
        <Link 
            href="/admin"
            className="p-3 rounded-2xl bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] text-gray-500 dark:text-[#525252] hover:text-[#3A9B9F] transition-all active:scale-90"
        >
            <CaretLeft weight="bold" className="h-5 w-5" />
        </Link>
        <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-[#213138] dark:text-white tracking-tight font-poppins">Growth Engine</h1>
            <p className="text-gray-500 dark:text-[#525252] font-medium leading-none">Intelligence Hub & Performance Monitoring</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Conquest Card - March to December Target */}
        <div className="lg:col-span-3 rounded-[2rem] border border-[#EA580C]/20 bg-white dark:bg-[#0C0C0C] p-10 shadow-xl shadow-[#EA580C]/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Lightning weight="fill" className="h-40 w-40 text-[#EA580C]" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#EA580C]/10 border border-[#EA580C]/20 rounded-full">
                <TrendUp weight="bold" className="h-4 w-4 text-[#EA580C]" />
                <span className="text-[10px] font-black text-[#EA580C] uppercase tracking-[0.2em]">Strategic Revenue Target: Dec 2026</span>
              </div>
              <h2 className="text-5xl font-black text-[#213138] dark:text-white tracking-tighter tabular-nums">
                {stats.currentMRR > 0 ? (
                  <>${stats.currentMRR.toLocaleString()} / $51,000</>
                ) : (
                  <>$51,000</>
                )}
                <span className="text-2xl text-gray-400 ml-2">MRR</span>
              </h2>
              <p className="text-sm font-bold text-gray-500 max-w-md leading-relaxed uppercase tracking-tight">
                Projected monthly recurring revenue by the end of the year through <span className="text-[#EA580C]">Pan-Caribbean Outreach Dominance</span>.
              </p>
              
              <div className="flex items-center gap-8 pt-4">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Milestone</p>
                  <p className="text-xl font-black text-[#213138] dark:text-white">{stats.activeUsers} / 1,000 <span className="text-sm text-[#EA580C]">users</span></p>
                </div>
                <div className="w-px h-10 bg-gray-200 dark:bg-white/10" />
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Projected Annual Run-Rate</p>
                  <p className="text-xl font-black text-green-500">$612,000</p>
                </div>
              </div>
            </div>

            <div className="w-full md:w-80 space-y-6">
               {/* First 10 User Tracker */}
               <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-gray-400">Next Price Hike</span>
                    <span className={cn(stats.activeUsers >= 10 ? "text-red-500" : "text-[#EA580C]")}>
                      {stats.activeUsers >= 10 ? "MISSION UPDATE REQUIRED" : `${10 - stats.activeUsers} SLOTS LEFT`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-black text-[#213138] dark:text-white">Founder's Rate: $29</span>
                    <ArrowUpRight className="h-4 w-4 text-gray-400" />
                    <span className="text-[13px] font-black text-gray-400">Premium: $39</span>
                  </div>
                  <div className="h-1.5 w-full bg-white dark:bg-black rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (stats.activeUsers / 10) * 100)}%` }}
                      className="h-full bg-gradient-to-r from-[#EA580C] to-[#F97316] rounded-full"
                    />
                  </div>
                  <p className="text-[9px] text-gray-500 font-bold uppercase italic text-center">Automatic $10 increase after 10th conversion</p>
               </div>
            </div>
          </div>
        </div>

        {/* Conversion Card */}
        <div className="lg:col-span-2 rounded-[2rem] border border-gray-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black text-[#213138] dark:text-white flex items-center gap-2 font-poppins">
              <TrendUp weight="bold" className="h-6 w-6 text-[#3A9B9F]" />
              Conversion Funnel
            </h3>
            <span className="text-[10px] font-black text-[#3A9B9F] bg-[#3A9B9F]/10 px-3 py-1.5 rounded-full uppercase tracking-widest border border-[#3A9B9F]/20">Active Discovery</span>
          </div>

          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-[#525252]">Leads Captured</p>
                  <p className="text-2xl font-black text-[#213138] dark:text-white">{stats.waitlistCount} <span className="text-sm font-medium text-gray-400">prospects found</span></p>
                </div>
                <div className="text-[10px] font-black text-[#3A9B9F] bg-[#3A9B9F]/10 px-2 py-1 rounded">PIPELINE PHASE</div>
              </div>
              <div className="h-4 w-full bg-gray-50 dark:bg-[#111111] rounded-full overflow-hidden border border-gray-100 dark:border-white/5 p-1">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-[#3A9B9F] to-[#2F8488] rounded-full" 
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-[#525252]">Active Conversions</p>
                  <p className="text-2xl font-black text-[#213138] dark:text-white">{stats.activeUsers} <span className="text-sm font-medium text-gray-400">won deals</span></p>
                </div>
                <div className="flex items-center gap-2">
                    <TrendUp weight="bold" className="h-4 w-4 text-green-500" />
                    <span className="text-lg font-black text-green-500">{stats.conversionRate}%</span>
                </div>
              </div>
              <div className="h-4 w-full bg-gray-50 dark:bg-[#111111] rounded-full overflow-hidden border border-gray-100 dark:border-white/5 p-1">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, stats.conversionRate)}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-[#FF8B66] rounded-full" 
                />
              </div>
            </div>
          </div>

          <div className="mt-12 p-8 rounded-3xl bg-gray-50/50 dark:bg-white/5 flex items-center justify-around border border-gray-100 dark:border-[#1C1C1C]">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-[#525252] mb-1">Total API Calls</p>
              <p className="text-3xl font-black text-[#213138] dark:text-white tabular-nums">{stats.totalMessages.toLocaleString()}</p>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-[#1C1C1C]" />
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-[#525252] mb-1">System Latency</p>
              <p className="text-3xl font-black text-[#213138] dark:text-white tabular-nums">14ms</p>
            </div>
          </div>
        </div>

        {/* Distribution Card */}
        <div className="rounded-[2rem] border border-gray-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C] p-8 shadow-sm flex flex-col">
          <div className="mb-10">
            <h3 className="text-xl font-black text-[#213138] dark:text-white flex items-center gap-2 font-poppins">
              <ChartPieSlice weight="bold" className="h-6 w-6 text-[#EA580C]" />
              Channel Heat
            </h3>
            <p className="text-xs font-bold text-gray-500 dark:text-[#525252] mt-1">Platform dominance in Nassau</p>
          </div>
          
          <div className="space-y-6 flex-1">
            {[
              { id: 'whatsapp', name: 'WhatsApp', count: 120, percentage: 68 },
              { id: 'instagram', name: 'Instagram', count: 40, percentage: 22 },
              { id: 'messenger', name: 'Messenger', count: 18, percentage: 10 },
            ].map(channel => (
                <div 
                    key={channel.id} 
                    className="group bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-white/5 rounded-2xl p-5 hover:border-[#3A9B9F] transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <ChannelIcon channel={channel.id as any} size="xl" />
                    <span className="text-sm font-black text-[#213138] dark:text-white tabular-nums">{channel.count}</span>
                  </div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-[#525252] uppercase tracking-widest mb-3">{channel.name}</p>
                  <div className="h-1.5 w-full bg-white dark:bg-black rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${channel.percentage}%` }}
                      className="h-full bg-[#3A9B9F] rounded-full"
                    />
                  </div>
                </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-gray-100 dark:border-[#1C1C1C] text-center">
            <div className="inline-flex items-center gap-2 text-[#3A9B9F] font-black mb-1">
              <Lightning weight="fill" className="h-5 w-5" />
              <span>+24.8% GROWTH</span>
            </div>
            <p className="text-[11px] text-gray-400 uppercase tracking-widest font-black opacity-60">Week over Week</p>
          </div>
        </div>
      </div>
    </div>
  )
}
