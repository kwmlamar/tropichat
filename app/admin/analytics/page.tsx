"use client"

import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase"
import { 
  ChartBar, 
  TrendUp, 
  Users, 
  ArrowUpRight, 
  Globe, 
  Stack,
  ChartPieSlice,
  Lightning,
  WhatsappLogo,
  InstagramLogo,
  MessengerLogo,
  CaretLeft,
  MagnifyingGlass,
  ArrowRight
} from "@phosphor-icons/react"
import { formatDate, cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { toast } from "sonner"
import Link from "next/link"
import { ChannelIcon } from "@/components/dashboard/channel-icon"

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    waitlistCount: 0,
    activeUsers: 0,
    totalMessages: 0,
    conversionRate: 0,
    scrapedLeads: 0,
    outreachSent: 0,
    dailyTraffic: [0, 0, 0, 0, 0, 0, 0] as number[],
    platformMix: [
      { id: 'whatsapp', name: 'WhatsApp', count: 0, color: '#25D366' },
      { id: 'instagram', name: 'Instagram', count: 0, color: '#E4405F' },
      { id: 'messenger', name: 'Messenger', count: 0, color: '#0084FF' },
      { id: 'gmail', name: 'Gmail', count: 0, color: '#EA4335' },
      { id: 'sms', name: 'SMS', count: 0, color: '#34D399' }
    ]
  })
  const [loading, setLoading] = useState(true)

  const ADMIN_ID = "29227a12-ca82-4796-a9c4-30ec0c6fa0e4"

  useEffect(() => {
    async function fetchStats() {
      const client = getSupabase()
      
      // Real-time mission discovery (Excluding Admin)
      const { count: lCount } = await client.from('leads').select('*', { count: 'exact', head: true })
      const { count: cCount } = await client.from('customers').select('*', { count: 'exact', head: true }).neq('id', ADMIN_ID)
      const { count: mCount } = await client.from('unified_messages').select('*', { count: 'exact', head: true }).neq('customer_id', ADMIN_ID)
      const { count: wonCount } = await client.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'won')
      
      // AI Automation Intelligence (Excluding Admin)
      const { count: autoMsgs } = await client.from('unified_messages').select('*', { count: 'exact', head: true }).match({ 'metadata->is_automated': true }).neq('customer_id', ADMIN_ID)

      // 7-day Daily Traffic Pulse (Excluding Admin)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { data: recentMsgs } = await client
        .from('unified_messages')
        .select('created_at, channel')
        .neq('customer_id', ADMIN_ID)
        .gte('created_at', sevenDaysAgo.toISOString())

      const trafficCounts = [0, 0, 0, 0, 0, 0, 0]
      const channelCounts: Record<string, number> = { whatsapp: 0, instagram: 0, messenger: 0, gmail: 0, sms: 0 }
      
      recentMsgs?.forEach(m => {
        // Traffic
        const dayDiff = Math.floor((new Date().getTime() - new Date(m.created_at).getTime()) / (1000 * 60 * 60 * 24))
        if(dayDiff >= 0 && dayDiff < 7) trafficCounts[6 - dayDiff]++
        
        // Channels
        const chan = m.channel?.toLowerCase().includes('wa') ? 'whatsapp' : 
                     m.channel?.toLowerCase().includes('ig') ? 'instagram' : 
                     m.channel?.toLowerCase().includes('messenger') ? 'messenger' :
                     m.channel?.toLowerCase().includes('gmail') ? 'gmail' :
                     m.channel?.toLowerCase().includes('sms') ? 'sms' : null
        if(chan) channelCounts[chan]++
      })

      setStats({
        waitlistCount: mCount || 0,
        activeUsers: cCount || 0,
        totalMessages: mCount || 0, 
        conversionRate: cCount && cCount > 0 ? Math.round(((wonCount || 0) + (cCount || 0)) / (lCount || 1) * 100) : 0,
        scrapedLeads: lCount || 0,
        outreachSent: autoMsgs || 0,
        dailyTraffic: trafficCounts,
        platformMix: [
          { id: 'whatsapp', name: 'WhatsApp', count: mCount ? Math.round((channelCounts.whatsapp / mCount) * 100) : 0, color: '#25D366' },
          { id: 'instagram', name: 'Instagram', count: mCount ? Math.round((channelCounts.instagram / mCount) * 100) : 0, color: '#E4405F' },
          { id: 'messenger', name: 'Messenger', count: mCount ? Math.round((channelCounts.messenger / mCount) * 100) : 0, color: '#0084FF' },
          { id: 'gmail', name: 'Gmail', count: mCount ? Math.round((channelCounts.gmail / mCount) * 100) : 0, color: '#EA4335' },
          { id: 'sms', name: 'SMS', count: mCount ? Math.round((channelCounts.sms / mCount) * 100) : 0, color: '#34D399' }
        ]
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
            <h1 className="text-3xl font-black text-[#213138] dark:text-white tracking-tight font-poppins">Growth Ops</h1>
            <p className="text-gray-500 dark:text-[#525252] font-medium leading-none">Intelligence Hub & Pipeline Performance</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Communication Velocity Card */}
        <div className="lg:col-span-2 rounded-[2rem] border border-gray-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C] p-8 shadow-sm overflow-hidden relative group">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-[#213138] dark:text-white flex items-center gap-2 font-poppins">
                <Lightning weight="bold" className="h-6 w-6 text-amber-500" />
                Communication Velocity
              </h3>
              <div className="flex gap-2">
                 <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full uppercase tracking-widest border border-amber-500/20">Operational</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-12 mb-10">
               <div className="flex-1 space-y-2 text-center md:text-left">
                 <p className="text-[10px] font-black text-gray-400 dark:text-[#525252] uppercase tracking-[0.2em] mb-4">Message Throughput</p>
                 <div className="flex items-baseline justify-center md:justify-start gap-2">
                   <span className="text-7xl font-black tracking-tighter text-[#213138] dark:text-white tabular-nums leading-none">{stats.totalMessages}</span>
                   <span className="text-2xl font-bold text-gray-400">Total</span>
                 </div>
                 <div className="flex items-center justify-center md:justify-start gap-2 text-green-500 font-bold text-sm mt-4">
                    <TrendUp weight="bold" />
                    <span>+12 this week</span>
                 </div>
               </div>
               
               <div className="flex-1 w-full bg-slate-50 dark:bg-[#0A0A0A] p-6 rounded-3xl border border-slate-100 dark:border-white/5 relative group cursor-pointer">
                  <div className="absolute top-0 right-0 p-4">
                    <ArrowUpRight className="h-4 w-4 text-[#007B85] opacity-40" />
                  </div>
                  <p className="text-[9px] font-black text-slate-400 dark:text-[#525252] uppercase tracking-widest mb-4">Traffic Density</p>
                  <div className="h-16 flex items-end gap-1.5">
                    {stats.dailyTraffic.map((v, i) => {
                      const maxTraffic = Math.max(...stats.dailyTraffic, 1)
                      return (
                        <motion.div 
                         key={i}
                         initial={{ height: 0 }}
                         animate={{ height: `${(v / maxTraffic) * 100}%` }}
                         className={`flex-1 rounded-t-lg transition-all duration-300 ${i === 6 ? 'bg-gradient-to-t from-[#007B85] to-[#3A9B9F] shadow-lg shadow-[#007B85]/20' : 'bg-slate-200 dark:bg-[#1A1A1A] group-hover:bg-[#007B85]/20'}`}
                        />
                      )
                    })}
                  </div>
               </div>
            </div>
            
            <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex flex-wrap gap-4">
               <div className="flex items-center gap-2 whitespace-nowrap">
                  <div className="w-2 h-2 rounded-full bg-green-500 ring-4 ring-green-500/10" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Channels: 5</span>
               </div>
               <div className="flex items-center gap-2 whitespace-nowrap">
                  <div className="w-2 h-2 rounded-full bg-amber-500 ring-4 ring-amber-500/10" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">AI Response Rate: 98%</span>
               </div>
            </div>
          </div>
        </div>

        {/* Mission Pulse Efficiency */}
        <div className="rounded-[2rem] border border-gray-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C] p-8 shadow-sm">
           <h3 className="text-xl font-black text-[#213138] dark:text-white flex items-center gap-2 font-poppins mb-8">
              <Lightning weight="bold" className="h-6 w-6 text-amber-500" />
              Mission Pulse
           </h3>
           <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-white/5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Lead Discovery</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-[#213138] dark:text-white tabular-nums">{stats.scrapedLeads}</span>
                  <span className="text-xs font-bold text-[#3A9B9F]">SCANNED</span>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-white/5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Automation Engine</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-[#213138] dark:text-white tabular-nums">{stats.outreachSent}</span>
                  <span className="text-xs font-bold text-amber-500">AUTO-RUNS</span>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-white/5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Conversion Density</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-[#213138] dark:text-white tabular-nums">{stats.conversionRate}%</span>
                  <span className="text-xs font-bold text-green-500">RATIO</span>
                </div>
              </div>
           </div>
        </div>

        {/* Conversion Funnel */}
        <div className="lg:col-span-2 rounded-[2rem] border border-gray-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C] p-10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#007B85] opacity-40 group-hover:opacity-100 transition-opacity" />
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-[#213138] dark:text-white flex items-center gap-2 font-poppins">
                <Stack weight="bold" className="h-6 w-6 text-[#007B85]" />
                Deal Pipeline Performance
              </h3>
              <p className="text-xs font-bold text-gray-500 mt-1">Growth from cold discovery to won customers</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative items-center">
             <div className="space-y-3">
               <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#0A0A0A] border border-slate-100 dark:border-white/5 transition-all hover:border-[#007B85]/20">
                  <span className="text-4xl font-black text-[#213138] dark:text-white tabular-nums leading-none">{stats.scrapedLeads}</span>
                  <p className="text-[10px] font-black text-gray-400 dark:text-[#525252] uppercase mt-1 tracking-widest">Cold Discovery</p>
               </div>
               <div className="text-center group">
                 <ArrowRight className="h-4 w-4 text-gray-300 mx-auto rotate-90 md:rotate-0" />
                 <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Leads Momentum</p>
               </div>
             </div>

             <div className="space-y-3">
               <div className="p-6 rounded-2xl bg-[#007B85]/5 border border-[#007B85]/10 group-hover:border-[#007B85]/30 transition-all">
                  <span className="text-4xl font-black text-[#007B85] tabular-nums leading-none">{stats.activeUsers}</span>
                  <p className="text-[10px] font-black text-[#007B85] uppercase mt-1 tracking-widest">Active Trials</p>
               </div>
               <div className="text-center">
                 <ArrowRight className="h-4 w-4 text-gray-300 mx-auto rotate-90 md:rotate-0" />
                 <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Trial to Customer</p>
               </div>
             </div>

             <div className="space-y-3">
               <div className="p-6 rounded-3xl bg-gradient-to-br from-green-500 to-[#007B85] text-white shadow-lg shadow-green-500/20 group relative overflow-hidden transition-transform active:scale-95">
                 <div className="absolute top-0 right-0 p-4 opacity-20">
                   <TrendUp weight="bold" className="h-12 w-12" />
                 </div>
                 <span className="text-4xl font-black relative z-10 font-poppins leading-none">{stats.activeUsers}</span>
                 <p className="text-[10px] font-black opacity-80 uppercase mt-1 relative z-10 tracking-widest">Won Customers</p>
               </div>
             </div>
          </div>
        </div>

        {/* Platform Heatmap */}
        <div className="rounded-[2rem] border border-gray-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C] p-8 shadow-sm flex flex-col">
          <div className="mb-8">
            <h3 className="text-xl font-black text-[#213138] dark:text-white flex items-center gap-2 font-poppins">
              <ChartPieSlice weight="bold" className="h-6 w-6 text-[#EA580C]" />
              Platform Mix
            </h3>
            <p className="text-xs font-bold text-gray-500 mt-1">Where the Caribbean is active</p>
          </div>
          
          <div className="space-y-6 flex-1">
            {stats.platformMix.map(channel => (
                <div key={channel.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: channel.color }} />
                      <span className="text-xs font-bold text-[#213138] dark:text-white">{channel.name}</span>
                    </div>
                    <span className="text-xs font-black text-gray-400">{channel.count}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-50 dark:bg-[#111111] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${channel.count}%` }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: channel.color, boxShadow: `0 0 10px ${channel.color}40` }}
                    />
                  </div>
                </div>
            ))}
          </div>

          <Link 
            href="/admin"
            className="mt-10 p-4 rounded-2xl bg-slate-50 dark:bg-[#111111] text-center text-[11px] font-black text-slate-500 hover:text-[#3A9B9F] transition-all uppercase tracking-widest border border-transparent hover:border-[#3A9B9F]/20"
          >
            Refine Strategy Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
