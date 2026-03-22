"use client"

import { useState, useEffect, useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { getAnalytics } from "@/lib/supabase"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

// ─── Bar Chart ─────────────────────────────────────────────────────────────────
// Design system: inactive bars bg-slate-100 dark:bg-[#1E1E1E], latest bar teal.
// Slim gaps, rounded-t-sm tops, muted axis labels — light + dark.
function BarChart({
  data,
  height = 160,
}: {
  data: { label: string; value: number }[]
  height?: number
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const latestIndex = data.length - 1

  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((item, i) => {
        const pct = (item.value / maxValue) * 100
        const isLatest = i === latestIndex
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full group">
            <div className="flex-1 w-full flex flex-col justify-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(pct, item.value > 0 ? 4 : 0)}%` }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.04 }}
                className={cn(
                  "w-full rounded-t-sm transition-colors duration-200",
                  isLatest
                    ? "bg-[#3A9B9F]"
                    : "bg-slate-100 dark:bg-[#1E1E1E] group-hover:bg-slate-200 dark:group-hover:bg-[#2A2A2A]"
                )}
              />
            </div>
            <span className="text-[10px] text-gray-400 dark:text-[#525252] uppercase tracking-wider font-medium">
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Donut Chart ───────────────────────────────────────────────────────────────
// Design system: teal / coral / neutral segments. Track adapts to mode.
// Center: number only. Legend: small dots + text.
function DonutChart({
  data,
}: {
  data: { label: string; value: number; color: string }[]
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const r = 38
  const circ = 2 * Math.PI * r
  let offset = 0

  return (
    <div className="flex items-center gap-8">
      <div className="relative w-24 h-24 shrink-0">
        <svg viewBox="0 0 100 100" className="-rotate-90 w-full h-full">
          {/* track — light: slate-200, dark: #1A1A1A */}
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="12"
            className="text-slate-200 dark:text-[#1A1A1A]"
          />
          {data.map((item, i) => {
            const pct = total > 0 ? item.value / total : 0
            const dash = pct * circ
            const el = (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={r}
                fill="transparent"
                stroke={item.color}
                strokeWidth="12"
                strokeDasharray={`${dash} ${circ}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            )
            offset += dash
            return el
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-poppins)] tabular-nums">
            {total}
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-[13px] text-gray-500 dark:text-[#A3A3A3]">
              {item.label}
            </span>
            <span className="text-[13px] font-semibold text-gray-900 dark:text-white tabular-nums ml-auto pl-4">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
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

  const { startDate, endDate } = useMemo(() => {
    const end = new Date()
    const start = new Date()
    switch (dateRange) {
      case "7d":  start.setDate(start.getDate() - 7);  break
      case "30d": start.setDate(start.getDate() - 30); break
      case "90d": start.setDate(start.getDate() - 90); break
    }
    return { startDate: start.toISOString(), endDate: end.toISOString() }
  }, [dateRange])

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)
      const { data, error } = await getAnalytics(startDate, endDate)
      if (error) toast.error("Failed to load analytics")
      else setAnalyticsData(data)
      setLoading(false)
    }
    fetchAnalytics()
  }, [startDate, endDate])

  // Build daily bar chart data
  const dailyMessages = useMemo(() => {
    const numDays = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90
    const days: Record<string, number> = {}
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString("en-US", {
        weekday: numDays <= 7 ? "short" : undefined,
        month: numDays > 7 ? "numeric" : undefined,
        day: numDays > 7 ? "numeric" : undefined,
      })
      days[key] = 0
    }
    analyticsData?.messages.forEach((msg) => {
      const key = new Date(msg.sent_at).toLocaleDateString("en-US", {
        weekday: numDays <= 7 ? "short" : undefined,
        month: numDays > 7 ? "numeric" : undefined,
        day: numDays > 7 ? "numeric" : undefined,
      })
      if (days[key] !== undefined) days[key]++
    })
    return Object.entries(days).map(([label, value]) => ({ label, value }))
  }, [analyticsData, dateRange])

  const conversationSegments = useMemo(() => {
    const counts = { open: 0, pending: 0, resolved: 0 }
    analyticsData?.conversations.forEach((c) => {
      if (c.status in counts) counts[c.status as keyof typeof counts]++
    })
    return [
      { label: "Open",     value: counts.open,     color: "#3A9B9F" },
      { label: "Pending",  value: counts.pending,  color: "#FF8B66" },
      // neutral: visible in both light (#D1D5DB) and dark (#333333) would need JS-side
      // using a mid-gray that works in both modes
      { label: "Resolved", value: counts.resolved, color: "#9CA3AF" },
    ]
  }, [analyticsData])

  const metrics = [
    { label: "Messages Sent",     value: analyticsData?.messagesSent      ?? 0, delta: "+12%", accent: "#3A9B9F" },
    { label: "Messages Received", value: analyticsData?.messagesReceived  ?? 0, delta: "+8%",  accent: "#FF8B66" },
    { label: "Conversations",     value: analyticsData?.totalConversations ?? 0, delta: "+15%", accent: "#3A9B9F" },
    { label: "Active Contacts",   value: analyticsData?.activeContacts    ?? 0, delta: "+5%",  accent: "#FF8B66" },
  ]

  const peakHours = [
    { time: "9:00 AM – 10:00 AM", count: 45, pct: 90 },
    { time: "2:00 PM – 3:00 PM",  count: 38, pct: 76 },
    { time: "5:00 PM – 6:00 PM",  count: 32, pct: 64 },
  ]

  return (
    <div className="min-h-screen p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6"
        >
          <div>
            <p className="text-[11px] text-gray-400 dark:text-[#525252] uppercase tracking-widest font-medium mb-1.5 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#3A9B9F] inline-block" />
              Analytics
            </p>
            <h1 className="text-3xl font-bold text-[#213138] dark:text-white font-[family-name:var(--font-poppins)] tracking-tight">
              Overview
            </h1>
          </div>

          {/* Segmented date control — light: bg-gray-100 white active / dark: bg-[#111] #1C1C1C active */}
          <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-[#111111] rounded-xl p-1 border border-gray-200 dark:border-[#1C1C1C]">
            {[
              { value: "7d",  label: "7D"  },
              { value: "30d", label: "30D" },
              { value: "90d", label: "90D" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                className={cn(
                  "px-5 py-2 text-xs font-semibold rounded-lg transition-all duration-200",
                  dateRange === opt.value
                    ? "bg-white dark:bg-[#1C1C1C] text-gray-900 dark:text-white shadow-sm dark:shadow-none"
                    : "text-gray-400 dark:text-[#525252] hover:text-gray-700 dark:hover:text-[#A3A3A3]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Metric Cards ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {loading
            ? Array(4).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="h-28 bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl animate-pulse"
                />
              ))
            : metrics.map((m) => (
                <div
                  key={m.label}
                  className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl p-6 hover:border-gray-300 dark:hover:border-[#2A2A2A] transition-colors duration-200 relative overflow-hidden"
                  style={{ borderLeftColor: m.accent, borderLeftWidth: 2 }}
                >
                  <p className="text-[11px] text-gray-500 dark:text-[#525252] uppercase tracking-widest font-medium mb-3">
                    {m.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-poppins)] tabular-nums">
                    {m.value.toLocaleString()}
                  </p>
                  <p className="text-[12px] font-medium mt-2 text-[#3A9B9F]">
                    {m.delta}
                  </p>
                </div>
              ))}
        </motion.div>

        {/* ── Charts ──────────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Bar chart */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl p-6 hover:border-gray-300 dark:hover:border-[#2A2A2A] transition-colors duration-200"
          >
            <div className="mb-6">
              <h2 className="text-[15px] font-semibold text-[#213138] dark:text-white font-[family-name:var(--font-poppins)]">
                Message Volume
              </h2>
              <p className="text-[13px] text-gray-500 dark:text-[#525252] mt-0.5">
                Daily activity across channels
              </p>
            </div>
            {loading ? (
              <Skeleton className="h-40 w-full bg-slate-100 dark:bg-[#1A1A1A] rounded-lg" />
            ) : (
              <BarChart data={dailyMessages} height={160} />
            )}
          </motion.div>

          {/* Donut chart */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
            className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl p-6 hover:border-gray-300 dark:hover:border-[#2A2A2A] transition-colors duration-200"
          >
            <div className="mb-6">
              <h2 className="text-[15px] font-semibold text-[#213138] dark:text-white font-[family-name:var(--font-poppins)]">
                Conversations
              </h2>
              <p className="text-[13px] text-gray-500 dark:text-[#525252] mt-0.5">
                Status breakdown
              </p>
            </div>
            {loading ? (
              <div className="flex items-center gap-8">
                <Skeleton className="w-24 h-24 rounded-full bg-slate-100 dark:bg-[#1A1A1A] shrink-0" />
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-3 w-full bg-slate-100 dark:bg-[#1A1A1A] rounded" />
                  <Skeleton className="h-3 w-3/4 bg-slate-100 dark:bg-[#1A1A1A] rounded" />
                  <Skeleton className="h-3 w-1/2 bg-slate-100 dark:bg-[#1A1A1A] rounded" />
                </div>
              </div>
            ) : (
              <DonutChart data={conversationSegments} />
            )}
          </motion.div>
        </div>

        {/* ── Bottom Row ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.24 }}
          className="grid lg:grid-cols-3 gap-6"
        >
          {/* Avg response time — typographic hero, no icon */}
          <div
            className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl p-8 hover:border-gray-300 dark:hover:border-[#2A2A2A] transition-colors duration-200 flex flex-col justify-between"
            style={{ borderLeftColor: "#3A9B9F", borderLeftWidth: 2 }}
          >
            <p className="text-[11px] text-gray-500 dark:text-[#525252] uppercase tracking-widest font-medium mb-4">
              Avg. Response Time
            </p>
            <div>
              <p className="text-5xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-poppins)] tabular-nums leading-none">
                2.5
                <span className="text-xl font-medium text-gray-400 dark:text-[#525252] ml-1.5">min</span>
              </p>
              <p className="text-[13px] text-gray-500 dark:text-[#525252] mt-3">
                First response to a new conversation
              </p>
            </div>
          </div>

          {/* Peak hours */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl p-6 hover:border-gray-300 dark:hover:border-[#2A2A2A] transition-colors duration-200">
            <div className="mb-6">
              <h2 className="text-[15px] font-semibold text-[#213138] dark:text-white font-[family-name:var(--font-poppins)]">
                Peak Hours
              </h2>
              <p className="text-[13px] text-gray-500 dark:text-[#525252] mt-0.5">
                Highest engagement windows
              </p>
            </div>
            <div className="space-y-5">
              {peakHours.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-[13px] text-gray-500 dark:text-[#A3A3A3] w-36 shrink-0">
                    {item.time}
                  </span>
                  <div className="flex-1 h-1.5 bg-slate-100 dark:bg-[#1A1A1A] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.4 + i * 0.1 }}
                      className="h-full bg-[#3A9B9F] rounded-full"
                    />
                  </div>
                  <span className="text-[13px] font-semibold text-gray-900 dark:text-white tabular-nums w-8 text-right">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
