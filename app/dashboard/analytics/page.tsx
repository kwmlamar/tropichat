"use client"

import { useState, useEffect, useMemo } from "react"
import {
  MessageSquare,
  TrendingUp,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getAnalytics } from "@/lib/supabase"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

// Simple chart components (in production, use recharts or similar)
function SimpleBarChart({ data, height = 240 }: { data: { label: string; value: number }[]; height?: number }) {
  const maxValue = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="flex items-end justify-between gap-3 pt-6" style={{ height }}>
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full group">
          <div className="flex-1 w-full flex flex-col justify-end">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(item.value / maxValue) * 100}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
              className="w-full bg-[#3A9B9F]/10 rounded-t-xl transition-all relative overflow-hidden group-hover:bg-[#3A9B9F]/20"
              style={{
                minHeight: item.value > 0 ? 4 : 0,
              }}
            >
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#3A9B9F] to-[#3A9B9F]/80 rounded-t-xl"
              />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-1 bg-white/20 rounded-full mt-1 blur-[1px]" />
            </motion.div>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate w-full text-center group-hover:text-[#3A9B9F] transition-colors">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function SimplePieChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {data.reduce<{ offset: number; elements: React.ReactNode[] }>(
            (acc, item, i) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0
              const circumference = 2 * Math.PI * 40

              acc.elements.push(
                <circle
                  key={i}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="20"
                  strokeDasharray={`${(percentage / 100) * circumference} ${circumference}`}
                  strokeDashoffset={-acc.offset}
                />
              )
              acc.offset += (percentage / 100) * circumference
              return acc
            },
            { offset: 0, elements: [] }
          ).elements}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{total}</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-gray-600">
              {item.label}: {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("7d")
  const [analyticsData, setAnalyticsData] = useState<{
    messagesSent: number
    messagesReceived: number
    totalConversations: number
    resolvedConversations: number
    activeContacts: number
    messages: { direction: string; sent_at: string }[]
    conversations: { status: string; created_at: string }[]
  } | null>(null)

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const end = new Date()
    const start = new Date()

    switch (dateRange) {
      case "7d":
        start.setDate(start.getDate() - 7)
        break
      case "30d":
        start.setDate(start.getDate() - 30)
        break
      case "90d":
        start.setDate(start.getDate() - 90)
        break
      default:
        start.setDate(start.getDate() - 7)
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    }
  }, [dateRange])

  // Fetch analytics
  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)
      const { data, error } = await getAnalytics(startDate, endDate)

      if (error) {
        toast.error("Failed to load analytics")
      } else {
        setAnalyticsData(data)
      }

      setLoading(false)
    }

    fetchAnalytics()
  }, [startDate, endDate])

  // Process data for charts
  const dailyMessages = useMemo(() => {
    if (!analyticsData?.messages) return []

    const days: Record<string, number> = {}
    const numDays = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90

    // Initialize all days
    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const key = date.toLocaleDateString("en-US", { weekday: "short" })
      days[key] = 0
    }

    // Count messages per day
    analyticsData.messages.forEach((msg) => {
      const date = new Date(msg.sent_at)
      const key = date.toLocaleDateString("en-US", { weekday: "short" })
      if (days[key] !== undefined) {
        days[key]++
      }
    })

    return Object.entries(days).map(([label, value]) => ({ label, value }))
  }, [analyticsData, dateRange])

  const conversationsByStatus = useMemo(() => {
    if (!analyticsData?.conversations) {
      return [
        { label: "Open", value: 0, color: "#22C55E" },
        { label: "Pending", value: 0, color: "#F59E0B" },
        { label: "Resolved", value: 0, color: "#6B7280" },
      ]
    }

    const statusCount: Record<string, number> = {
      open: 0,
      pending: 0,
      resolved: 0,
    }

    analyticsData.conversations.forEach((conv) => {
      if (statusCount[conv.status] !== undefined) {
        statusCount[conv.status]++
      }
    })

    return [
      { label: "Open", value: statusCount.open, color: "#22C55E" },
      { label: "Pending", value: statusCount.pending, color: "#F59E0B" },
      { label: "Resolved", value: statusCount.resolved, color: "#6B7280" },
    ]
  }, [analyticsData])

  const metrics = [
    {
      label: "Sent",
      value: analyticsData?.messagesSent || 0,
      icon: MessageSquare,
      change: "+12%",
      positive: true,
      color: "#3A9B9F",
      bg: "bg-teal-50/50"
    },
    {
      label: "Received",
      value: analyticsData?.messagesReceived || 0,
      icon: MessageSquare,
      change: "+8%",
      positive: true,
      color: "#FF8B66",
      bg: "bg-coral-50/50"
    },
    {
      label: "Conversations",
      value: analyticsData?.totalConversations || 0,
      icon: TrendingUp,
      change: "+15%",
      positive: true,
      color: "#3A9B9F",
      bg: "bg-teal-50/50"
    },
    {
      label: "Contacts",
      value: analyticsData?.activeContacts || 0,
      icon: Users,
      change: "+5%",
      positive: true,
      color: "#FF8B66",
      bg: "bg-coral-50/50"
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="relative min-h-screen p-8 overflow-y-auto bg-transparent">
      {/* Decorative Orbs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[10%] left-[10%] w-[600px] h-[600px] bg-[#3A9B9F]/5 blur-[120px] rounded-full animate-float-slow" />
        <div className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-[#FF8B66]/5 blur-[120px] rounded-full animate-float" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-[#3A9B9F]/10 text-[#3A9B9F]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-[#3A9B9F]">Market Performance</p>
            </div>
            <h1 className="text-4xl font-extrabold text-[#213138] dark:text-gray-100 tracking-tight font-[family-name:var(--font-poppins)]">
              Analytics Overview
            </h1>
            <p className="text-gray-500 text-lg mt-2 font-medium">
              Real-time insights for your Caribbean business ecosystem.
            </p>
          </div>

          <div className="bg-white/50 dark:bg-[#1E1E1E]/50 backdrop-blur-xl p-1.5 rounded-[20px] border border-white dark:border-[#2A2A2A] shadow-sm flex gap-1 ring-1 ring-black/5">
            {[
              { value: "7d", label: "7D" },
              { value: "30d", label: "30D" },
              { value: "90d", label: "90D" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setDateRange(option.value)}
                className={cn(
                  "px-6 py-2.5 text-xs font-bold rounded-[14px] transition-all duration-300",
                  dateRange === option.value
                    ? "bg-[#213138] dark:bg-[#3A9B9F] text-white shadow-lg shadow-navy-900/20"
                    : "text-gray-500 hover:text-[#213138] dark:hover:text-white hover:bg-white dark:hover:bg-[#262626]"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10"
        >
          {loading
            ? Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-white/50 dark:bg-[#1E1E1E]/50 backdrop-blur-md rounded-[32px] border border-white dark:border-[#2A2A2A] animate-pulse" />
            ))
            : metrics.map((metric, i) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-2xl rounded-[32px] border border-white dark:border-[#2A2A2A] p-7 shadow-[0_8px_30px_rgba(0,0,0,0.02)] ring-1 ring-black/5 relative overflow-hidden group transition-all hover:shadow-xl hover:shadow-[#3A9B9F]/5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("p-3 rounded-2xl text-white shadow-lg", i % 2 === 0 ? "bg-[#3A9B9F]" : "bg-[#FF8B66]")}>
                    <metric.icon className="h-5 w-5" />
                  </div>
                  <div className={cn(
                    "flex items-center text-xs font-bold px-2.5 py-1 rounded-full",
                    metric.positive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                  )}>
                    {metric.change}
                  </div>
                </div>

                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{metric.label}</p>
                <h3 className="text-3xl font-extrabold text-[#213138] dark:text-gray-100 font-[family-name:var(--font-poppins)]">
                  {metric.value.toLocaleString()}
                </h3>

                {/* Subtle underline gradient */}
                <div className={cn(
                  "absolute bottom-0 left-0 right-0 h-1 transition-opacity opacity-0 group-hover:opacity-100",
                  i % 2 === 0 ? "bg-[#3A9B9F]" : "bg-[#FF8B66]"
                )} />
              </motion.div>
            ))}
        </motion.div>

        {/* Main Charts */}
        <div className="grid gap-8 lg:grid-cols-2 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-2xl rounded-[40px] border border-white dark:border-[#2A2A2A] p-10 shadow-[0_8px_40px_rgba(0,0,0,0.03)] ring-1 ring-black/5"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-[#213138] dark:text-gray-100 font-[family-name:var(--font-poppins)]">Message Volume</h3>
                <p className="text-sm text-gray-400 font-medium tracking-tight mt-1">Daily engagement trends across Bahamas & Caribbean</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-teal-50 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-[#3A9B9F]" />
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-[240px] w-full rounded-2xl" />
            ) : (
              <SimpleBarChart data={dailyMessages} />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-2xl rounded-[40px] border border-white dark:border-[#2A2A2A] p-10 shadow-[0_8px_40px_rgba(0,0,0,0.03)] ring-1 ring-black/5"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-[#213138] dark:text-gray-100 font-[family-name:var(--font-poppins)]">Conversion Funnel</h3>
                <p className="text-sm text-gray-400 font-medium tracking-tight mt-1">Status distribution of unified conversations</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-coral-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-[#FF8B66]" />
              </div>
            </div>
            {loading ? (
              <div className="flex items-center gap-10 h-[240px]">
                <Skeleton className="h-40 w-40 rounded-full" />
                <div className="space-y-4 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[240px]">
                <SimplePieChart data={conversationsByStatus} />
              </div>
            )}
          </motion.div>
        </div>

        {/* Secondary Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-8 md:grid-cols-2"
        >
          <motion.div
            variants={itemVariants}
            className="bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-2xl rounded-[40px] border border-white dark:border-[#2A2A2A] p-10 shadow-[0_8px_40px_rgba(0,0,0,0.03)] ring-1 ring-black/5 flex items-center gap-10 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-[#3A9B9F]/20 blur-2xl rounded-full scale-150 animate-pulse" />
              <div className="relative h-24 w-24 rounded-[32px] bg-gradient-to-br from-[#3A9B9F] to-[#2F8488] flex items-center justify-center shadow-xl shadow-teal-500/20 rotate-3 group-hover:rotate-0 transition-transform">
                <Clock className="h-10 w-10 text-white" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Responsiveness</p>
              <h3 className="text-4xl font-extrabold text-[#213138] dark:text-gray-100 font-[family-name:var(--font-poppins)] mb-1">
                2.5 <span className="text-lg">min</span>
              </h3>
              <p className="text-sm font-medium text-gray-500">Average time to Bahamas first response</p>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-white/80 dark:bg-[#1E1E1E]/80 backdrop-blur-2xl rounded-[40px] border border-white dark:border-[#2A2A2A] p-10 shadow-[0_8px_40px_rgba(0,0,0,0.03)] ring-1 ring-black/5"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-[#213138] dark:text-gray-100 font-[family-name:var(--font-poppins)] tracking-tight">Prime Interaction Slots</h3>
              <Calendar className="h-5 w-5 text-coral-500" />
            </div>
            <div className="space-y-4">
              {[
                { hour: "9:00 AM - 10:00 AM", messages: 45, color: "#3A9B9F" },
                { hour: "2:00 PM - 3:00 PM", messages: 38, color: "#FF8B66" },
                { hour: "5:00 PM - 6:00 PM", messages: 32, color: "#3A9B9F" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between group cursor-default">
                  <span className="text-sm font-bold text-gray-500 group-hover:text-[#213138] transition-colors">{item.hour}</span>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner ring-1 ring-black/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.messages / 50) * 100}%` }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 + (i * 0.1) }}
                        className="h-full rounded-full shadow-lg"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                    <span className="text-sm font-black text-[#213138] dark:text-gray-100 w-8">
                      {item.messages}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
