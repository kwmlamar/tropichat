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

// Simple chart components (in production, use recharts or similar)
function SimpleBarChart({ data, height = 200 }: { data: { label: string; value: number }[]; height?: number }) {
  const maxValue = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <div
            className="w-full bg-[#25D366]/20 rounded-t-md transition-all hover:bg-[#25D366]/30"
            style={{
              height: `${(item.value / maxValue) * 100}%`,
              minHeight: item.value > 0 ? 4 : 0,
            }}
          >
            <div
              className="w-full bg-[#25D366] rounded-t-md"
              style={{ height: "100%" }}
            />
          </div>
          <span className="text-xs text-gray-500 truncate w-full text-center">
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
      label: "Messages Sent",
      value: analyticsData?.messagesSent || 0,
      icon: MessageSquare,
      change: "+12%",
      positive: true,
    },
    {
      label: "Messages Received",
      value: analyticsData?.messagesReceived || 0,
      icon: MessageSquare,
      change: "+8%",
      positive: true,
    },
    {
      label: "Total Conversations",
      value: analyticsData?.totalConversations || 0,
      icon: TrendingUp,
      change: "+15%",
      positive: true,
    },
    {
      label: "Active Contacts",
      value: analyticsData?.activeContacts || 0,
      icon: Users,
      change: "+5%",
      positive: true,
    },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">
            Track your messaging performance
          </p>
        </div>

        <div className="flex gap-2">
          {[
            { value: "7d", label: "7 days" },
            { value: "30d", label: "30 days" },
            { value: "90d", label: "90 days" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setDateRange(option.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                dateRange === option.value
                  ? "bg-[#25D366]/10 text-[#25D366]"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {loading
          ? [...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </CardContent>
              </Card>
            ))
          : metrics.map((metric, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">{metric.label}</span>
                    <metric.icon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {metric.value.toLocaleString()}
                  </div>
                  <div
                    className={`flex items-center text-sm ${
                      metric.positive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {metric.positive ? (
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 mr-1" />
                    )}
                    {metric.change} vs last period
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Messages Over Time */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Messages Over Time
            </h3>
            {loading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <SimpleBarChart data={dailyMessages} />
            )}
          </CardContent>
        </Card>

        {/* Conversations by Status */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Conversations by Status
            </h3>
            {loading ? (
              <div className="flex items-center gap-6">
                <Skeleton className="h-32 w-32 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            ) : (
              <SimplePieChart data={conversationsByStatus} />
            )}
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Average Response Time
            </h3>
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-[#25D366]/10 p-4">
                <Clock className="h-8 w-8 text-[#25D366]" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">2.5 min</p>
                <p className="text-sm text-gray-500">
                  Average time to first response
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Peak Hours</h3>
            <div className="space-y-3">
              {[
                { hour: "9:00 AM - 10:00 AM", messages: 45 },
                { hour: "2:00 PM - 3:00 PM", messages: 38 },
                { hour: "5:00 PM - 6:00 PM", messages: 32 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.hour}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#25D366] rounded-full"
                        style={{ width: `${(item.messages / 50) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">
                      {item.messages}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
