"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { 
  TrendingUp, 
  Users, 
  Target, 
  DollarSign, 
  ArrowUpRight, 
  Calendar,
  Zap,
  ChevronRight,
  ChevronLeft
} from "lucide-react"

import { getSupabase } from "@/lib/supabase"
import { useEffect, useState } from "react"

// Real-world missionary tier pricing
const TIER_PRICING = {
  free: 0,
  starter: 15,
  medium: 25,
  pro: 45,
  elite: 99
}

const monthlyProjections = [
  { month: "Apr", mrr: 1500, growth: "+21%" },
  { month: "May", mrr: 3200, growth: "+113%" },
  { month: "Jun", mrr: 5800, growth: "+81%" },
  { month: "Jul", mrr: 9200, growth: "+58%" },
  { month: "Aug", mrr: 14500, growth: "+57%" },
  { month: "Sep", mrr: 19800, growth: "+36%" },
  { month: "Oct", mrr: 24500, growth: "+23%" },
  { month: "Nov", mrr: 28200, growth: "+15%" },
  { month: "Dec", mrr: 31500, growth: "+11%" },
]

export default function RevenueDashboard() {
  const [metrics, setMetrics] = useState({
    currentMRR: 0,
    goalMRR: 30000,
    totalCapital: 51000,
    customers: 0,
    avgRevenuePerUser: 0,
    tierCounts: { starter: 0, medium: 0, pro: 0, elite: 0, free: 0 }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRevenue() {
      const client = getSupabase()
      
      const { data: customers } = await client
        .from('customers')
        .select('plan, status')
        .neq('id', '29227a12-ca82-4796-a9c4-30ec0c6fa0e4')

      if (customers) {
        const counts = { starter: 0, medium: 0, pro: 0, elite: 0, free: 0 }
        let totalMRR = 0
        let activeCount = 0

        customers.forEach(c => {
          const planKey = (c.plan?.toLowerCase() || 'free') as keyof typeof TIER_PRICING
          if (c.status === 'active') {
            totalMRR += TIER_PRICING[planKey] || 0
            activeCount++
          }
          if (counts.hasOwnProperty(planKey)) {
             // @ts-ignore
             counts[planKey]++
          }
        })

        setMetrics(prev => ({
          ...prev,
          currentMRR: totalMRR,
          customers: customers.length,
          avgRevenuePerUser: activeCount > 0 ? totalMRR / activeCount : 0,
          tierCounts: counts
        }))
      }
      setLoading(false)
    }
    fetchRevenue()
  }, [])
  return (
    <div className="min-h-screen bg-[#F8FAFB] dark:bg-[#080808] p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link 
              href="/admin"
              className="p-3 rounded-2xl bg-white dark:bg-[#0C0C0C] border border-slate-200 dark:border-[#1A1A1A] text-slate-500 dark:text-gray-500 hover:text-[#007B85] transition-all active:scale-95 shadow-sm"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#007B85] mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#007B85] animate-pulse" />
                Growth Engine Live
              </div>
              <h1 className="text-3xl font-black text-[#213138] dark:text-white tracking-tight">
                Revenue Command Center
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white dark:bg-[#111] p-1.5 rounded-2xl border border-slate-200 dark:border-[#1A1A1A] shadow-sm">
            <div className="px-4 py-2 text-sm font-bold text-[#213138] dark:text-gray-300 bg-slate-50 dark:bg-[#0A0A0A] rounded-xl">
              Yearly Goal: $51,000
            </div>
            <button className="p-2 text-slate-400 hover:text-[#007B85] transition-colors">
              <Calendar className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Core Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            label="Current MRR" 
            value={`$${metrics.currentMRR.toLocaleString()}`} 
            subValue="Target: $30k"
            accent="#007B85"
            icon={<DollarSign className="h-5 w-5" />}
          />
          <StatCard 
            label="Yearly Target" 
            value={`$${metrics.totalCapital.toLocaleString()}`} 
            subValue="By Dec 31st"
            accent="#FF7E36"
            icon={<Target className="h-5 w-5" />}
          />
          <StatCard 
            label="Pipeline Users" 
            value={metrics.customers.toString()} 
            subValue="Goal: 1,000"
            accent="#007B85"
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard 
            label="ARPU" 
            value={`$${metrics.avgRevenuePerUser.toFixed(2)}`} 
            subValue="Avg per customer"
            accent="#8B5CF6"
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Main Growth Chart Area */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white dark:bg-[#0C0C0C] border border-slate-200 dark:border-[#1A1A1A] rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-[#213138] dark:text-white">Monthly MRR Projection</h2>
                  <p className="text-sm text-slate-500 dark:text-gray-500">The road to $30k MRR</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 dark:bg-teal-900/20 text-[#007B85] rounded-full text-xs font-bold">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  AGRESSIVE GROWTH
                </div>
              </div>

              {/* Custom Bar Chart for MRR Projection */}
              <div className="flex items-end justify-between gap-1 h-64">
                {monthlyProjections.map((p, i) => {
                  const height = (p.mrr / 32000) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full group">
                      <div className="flex-1 w-full flex flex-col justify-end">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ duration: 0.8, delay: i * 0.05 }}
                          className={`w-full rounded-t-xl transition-all duration-300 ${p.month === 'Dec' ? 'bg-[#007B85]' : 'bg-slate-100 dark:bg-[#1A1A1A] group-hover:bg-[#007B85]/20'}`}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-gray-600 uppercase mb-1">{p.month}</p>
                        <p className="text-[9px] font-black text-[#007B85]">{p.growth}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Strategic Milestones */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-[#0C0C0C] border border-slate-200 dark:border-[#1A1A1A] rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#213138] dark:text-white mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500 fill-amber-500" /> Key Milestones
                </h3>
                <div className="space-y-4">
                  <MilestoneItem label="First 10 LTDs Sold" completed date="May 01" />
                  <MilestoneItem label="100 Active Users" completed={false} date="Aug 15" />
                  <MilestoneItem label="Caribbean Ad Scaling" completed={false} date="Oct 01" />
                  <MilestoneItem label="$10k MRR Pivot" completed={false} date="Nov 10" />
                </div>
              </div>

              <div className="bg-white dark:bg-[#0C0C0C] border border-slate-200 dark:border-[#1A1A1A] rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#213138] dark:text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#007B85]" /> Tier Breakdown
                </h3>
                <div className="space-y-4">
                  <TierProgress label="Starter ($15/mo)" value={metrics.customers > 0 ? Math.round((metrics.tierCounts.starter / metrics.customers) * 100) : 0} color="#007B85" />
                  <TierProgress label="Medium ($25/mo)" value={metrics.customers > 0 ? Math.round((metrics.tierCounts.medium / metrics.customers) * 100) : 0} color="#FF7E36" />
                  <TierProgress label="Pro ($45/mo)" value={metrics.customers > 0 ? Math.round((metrics.tierCounts.pro / metrics.customers) * 100) : 0} color="#8B5CF6" />
                  <TierProgress label="Elite ($99+)" value={metrics.customers > 0 ? Math.round((metrics.tierCounts.elite / metrics.customers) * 100) : 0} color="#F43F5E" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Action & Summary */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white dark:bg-[#111] text-[#213138] dark:text-white rounded-3xl p-8 relative overflow-hidden shadow-sm border border-slate-200 dark:border-[#1A1A1A]">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <TrendingUp size={120} strokeWidth={3} className="text-[#007B85]" />
              </div>
              
              <div className="relative z-10">
                <h2 className="text-2xl font-black mb-2 leading-tight">Dec 31st Goal</h2>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-5xl font-black text-[#007B85]">$30,000</span>
                  <span className="text-sm font-bold opacity-60">MRR</span>
                </div>
                
                <div className="space-y-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="h-2 flex-1 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#007B85]" style={{ width: `${(metrics.currentMRR / metrics.goalMRR) * 100}%` }} />
                    </div>
                    <span className="text-sm font-bold text-slate-500 dark:text-white">{Math.round((metrics.currentMRR / metrics.goalMRR) * 100)}%</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed font-medium">
                    You need to add <span className="text-[#213138] dark:text-white font-black">~110 users</span> per month to stay on track for the $30k MRR aggressive growth goal.
                  </p>
                </div>

                <button className="w-full bg-[#007B85] hover:bg-[#2F8488] text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-[#007B85]/20 flex items-center justify-center gap-2">
                   View Sales Roadmap <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-3xl p-6">
              <h4 className="text-amber-800 dark:text-amber-400 font-bold mb-2 flex items-center gap-2 text-sm">
                💡 Revenue Strategy Tip
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-500/80 leading-relaxed">
                The ManyChat model thrives on low-friction entry. Focus on getting 100 "Starter" users as fast as possible. Their natural list growth will do the heavy lifting for your MRR expansion.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

function StatCard({ label, value, subValue, accent, icon }: any) {
  return (
    <div 
      className="bg-white dark:bg-[#0C0C0C] border border-slate-200 dark:border-[#1A1A1A] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl" style={{ color: accent }}>
          {icon}
        </div>
      </div>
      <p className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-[#213138] dark:text-white mb-1 tabular-nums">{value}</p>
      <p className="text-xs font-medium text-slate-500 dark:text-gray-400">{subValue}</p>
    </div>
  )
}

function MilestoneItem({ label, completed, date }: any) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${completed ? 'bg-[#007B85] border-[#007B85]' : 'border-slate-200 dark:border-gray-800 group-hover:border-[#007B85]'}`}>
          {completed && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
        </div>
        <span className={`text-sm font-semibold ${completed ? 'text-slate-900 dark:text-gray-200' : 'text-slate-400 dark:text-gray-600'}`}>
          {label}
        </span>
      </div>
      <span className="text-[10px] font-bold text-slate-300 dark:text-gray-700 uppercase">{date}</span>
    </div>
  )
}

function TierProgress({ label, value, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-slate-600 dark:text-gray-300">{label}</span>
        <span className="font-black text-slate-400">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}
