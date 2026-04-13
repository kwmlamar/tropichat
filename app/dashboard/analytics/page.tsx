"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import {
  Users,
  Lightning,
  ChatCircleDots,
  ArrowRight,
  Clock,
  Target,
  ChartLineUp,
  CaretRight,
  CheckCircle,
  Circle,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { getSupabase } from "@/lib/supabase"
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayData {
  label: string
  date: string
  inbound: number
  outbound: number
}

interface AnalyticsStats {
  channels: number
  contacts: number
  newContacts: number
  totalMessages: number
  automatedMessages: number
  avgResponseMinutes: number | null
  messagesByDay: DayData[]
}

interface CustomerData {
  ai_autopilot_enabled: boolean
  auto_reply_enabled: boolean
  has_onboarded: boolean
}

// ─── Mini Bar Chart ────────────────────────────────────────────────────────────

function MiniBarChart({ data }: { data: DayData[] }) {
  const max = Math.max(...data.flatMap((d) => [d.inbound, d.outbound]), 1)

  return (
    <div className="mt-6">
      <div className="flex items-end gap-1.5 h-32">
        {data.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center group">
            <div className="flex items-end gap-0.5 w-full h-32">
              <div
                className="flex-1 rounded-t bg-[#007B85]/70 transition-all group-hover:bg-[#007B85] min-h-[2px]"
                style={{ height: `${Math.max((day.inbound / max) * 128, 2)}px` }}
                title={`${day.inbound} inbound`}
              />
              <div
                className="flex-1 rounded-t bg-[#FF8B66]/70 transition-all group-hover:bg-[#FF8B66] min-h-[2px]"
                style={{ height: `${Math.max((day.outbound / max) * 128, 2)}px` }}
                title={`${day.outbound} outbound`}
              />
            </div>
          </div>
        ))}
      </div>
      {/* X axis labels */}
      <div className="flex gap-1.5 mt-2">
        {data.map((day, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[9px] font-black text-gray-400 uppercase tracking-wider"
          >
            {day.label}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm bg-[#007B85]" />
          <span className="text-[10px] font-bold text-gray-500">Inbound</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm bg-[#FF8B66]" />
          <span className="text-[10px] font-bold text-gray-500">Outbound</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [userName, setUserName] = useState("there")
  const [stats, setStats] = useState<AnalyticsStats>({
    channels: 0,
    contacts: 0,
    newContacts: 0,
    totalMessages: 0,
    automatedMessages: 0,
    avgResponseMinutes: null,
    messagesByDay: [],
  })
  const [customer, setCustomer] = useState<CustomerData>({
    ai_autopilot_enabled: false,
    auto_reply_enabled: false,
    has_onboarded: false,
  })
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0) // 0 = current 7 days, -1 = previous, etc.

  // Build date range from weekOffset
  const dateRange = useMemo(() => {
    const end = new Date()
    end.setDate(end.getDate() + weekOffset * 7)
    end.setHours(23, 59, 59, 999)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }, [weekOffset])

  const rangeLabel = useMemo(() => {
    if (weekOffset === 0) return "Last 7 days"
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    return `${fmt(dateRange.start)} – ${fmt(dateRange.end)}`
  }, [weekOffset, dateRange])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const supabase = getSupabase()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name.split(" ")[0])
      }

      const { start, end } = dateRange

      const [channelRes, contactRes, newContactRes, messagesRes, customerRes] =
        await Promise.all([
          supabase
            .from("connected_accounts")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true),
          supabase
            .from("contacts")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("contacts")
            .select("*", { count: "exact", head: true })
            .gte("created_at", start.toISOString())
            .lte("created_at", end.toISOString()),
          supabase
            .from("messages")
            .select("direction, is_automated, sent_at, conversation_id")
            .gte("sent_at", start.toISOString())
            .lte("sent_at", end.toISOString())
            .order("sent_at", { ascending: true }),
          supabase
            .from("customers")
            .select("ai_autopilot_enabled, auto_reply_enabled, has_onboarded")
            .single(),
        ])

      const messages = messagesRes.data || []

      // Build per-day breakdown for the chart
      const dayMap: Record<string, { inbound: number; outbound: number }> = {}
      for (let i = 6; i >= 0; i--) {
        const d = new Date(end)
        d.setDate(d.getDate() - i)
        const key = d.toISOString().split("T")[0]
        dayMap[key] = { inbound: 0, outbound: 0 }
      }
      for (const msg of messages) {
        const key = msg.sent_at.split("T")[0]
        if (dayMap[key]) {
          if (msg.direction === "inbound") dayMap[key].inbound++
          else dayMap[key].outbound++
        }
      }
      const messagesByDay: DayData[] = Object.entries(dayMap).map(
        ([date, counts]) => ({
          date,
          label: new Date(date + "T12:00:00").toLocaleDateString("en-US", {
            weekday: "short",
          }),
          ...counts,
        })
      )

      // Compute avg response time: find inbound → outbound pairs per conversation
      const byConversation: Record<string, typeof messages> = {}
      for (const msg of messages) {
        if (!byConversation[msg.conversation_id])
          byConversation[msg.conversation_id] = []
        byConversation[msg.conversation_id].push(msg)
      }
      const responseTimes: number[] = []
      for (const convMsgs of Object.values(byConversation)) {
        for (let i = 0; i < convMsgs.length - 1; i++) {
          if (
            convMsgs[i].direction === "inbound" &&
            convMsgs[i + 1].direction === "outbound"
          ) {
            const diff =
              new Date(convMsgs[i + 1].sent_at).getTime() -
              new Date(convMsgs[i].sent_at).getTime()
            // Only count responses within 24 hours (avoid skewing with old threads)
            if (diff > 0 && diff < 86400000) {
              responseTimes.push(diff / 60000) // in minutes
            }
          }
        }
      }
      const avgResponseMinutes =
        responseTimes.length > 0
          ? Math.round(
              responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
            )
          : null

      const automatedMessages = messages.filter(
        (m) => m.is_automated && m.direction === "outbound"
      ).length

      setStats({
        channels: channelRes.count || 0,
        contacts: contactRes.count || 0,
        newContacts: newContactRes.count || 0,
        totalMessages: messages.length,
        automatedMessages,
        avgResponseMinutes,
        messagesByDay,
      })

      if (customerRes.data) {
        setCustomer(customerRes.data)
      }

      setLoading(false)
    }

    fetchData()
  }, [dateRange])

  // Dynamic onboarding items based on real customer state
  const onboardingItems = [
    {
      title: "Connect Your WhatsApp",
      completed: stats.channels > 0,
      href: "/dashboard/profile",
    },
    {
      title: "Set Up AI Auto-Reply",
      completed: customer.ai_autopilot_enabled || customer.auto_reply_enabled,
      href: "/dashboard/ai",
    },
    {
      title: "Add Your First Contact",
      completed: stats.contacts > 0,
      href: "/dashboard/contacts",
    },
  ]
  const completedCount = onboardingItems.filter((i) => i.completed).length
  const progressPct = Math.round(
    (completedCount / onboardingItems.length) * 100
  )

  // Time saved: assume 2 min saved per automated reply
  const timeSavedMinutes = stats.automatedMessages * 2
  const timeSavedDisplay =
    timeSavedMinutes >= 60
      ? `${Math.floor(timeSavedMinutes / 60)}h ${timeSavedMinutes % 60}m`
      : `${timeSavedMinutes}m`

  // Avg response display
  const avgResponseDisplay =
    stats.avgResponseMinutes !== null
      ? stats.avgResponseMinutes >= 60
        ? `${Math.floor(stats.avgResponseMinutes / 60)}h ${stats.avgResponseMinutes % 60}m`
        : `${stats.avgResponseMinutes}m`
      : null

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-black p-6 lg:p-10 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#213138] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[#213138] dark:text-white shadow-sm border border-gray-100 dark:border-none dark:shadow-lg overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#007B85]/5 dark:bg-[#007B85]/20 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-[#007B85]/10 dark:bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Lightning weight="fill" className="h-6 w-6 text-[#FF7E36]" />
            </div>
            <div>
              <h3 className="font-bold text-lg">
                TropiChat × Gemini. Now we&apos;re talking.
              </h3>
              <p className="text-gray-500 dark:text-white/70 text-sm font-medium">
                Discover new AI-powered opportunities for your audience.
              </p>
            </div>
          </div>
          <Link href="/dashboard/ai" className="relative z-10">
            <Button className="bg-[#007B85] hover:bg-[#2F8488] text-white rounded-xl px-6 font-bold border-none">
              Discover
              <ArrowRight weight="bold" className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

        {/* Greeting */}
        <div>
          <h1 className="text-4xl font-black text-[#213138] dark:text-white tracking-tight">
            Hello, {userName}!
          </h1>
          <div className="flex items-center gap-4 mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              {stats.channels} connected{" "}
              {stats.channels === 1 ? "channel" : "channels"}
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
            <Link
              href="/dashboard/contacts"
              className="flex items-center gap-1.5 hover:text-[#007B85] transition-colors"
            >
              {stats.contacts} contacts
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#213138] dark:text-gray-100">
              Start here
            </h2>
            <Link
              href="/dashboard/automations"
              className="text-sm font-bold text-[#007B85] hover:underline flex items-center gap-1"
            >
              Explore all Templates{" "}
              <CaretRight weight="bold" className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/dashboard/automations">
              <QuickActionCard
                title="Auto-DM from Comments"
                tag="Popular"
                icon={
                  <ChatCircleDots
                    weight="duotone"
                    className="h-6 w-6 text-[#007B85]"
                  />
                }
              />
            </Link>
            <Link href="/dashboard/automations">
              <QuickActionCard
                title="Generate Leads with Stories"
                icon={
                  <Lightning
                    weight="duotone"
                    className="h-6 w-6 text-[#007B85]"
                  />
                }
              />
            </Link>
            <Link href="/dashboard/automations">
              <QuickActionCard
                title="Respond to all your DMs"
                icon={
                  <Users weight="duotone" className="h-6 w-6 text-[#007B85]" />
                }
              />
            </Link>
          </div>
        </section>

        {/* Onboarding checklist */}
        <section className="bg-white dark:bg-[#0C0C0C] rounded-2xl border border-gray-100 dark:border-[#1C1C1C] p-8 shadow-sm">
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold text-[#213138] dark:text-gray-100 mb-2">
              Your next best moves
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {completedCount === onboardingItems.length
                ? "You're all set! All setup steps are complete."
                : "Complete these steps to get the most out of TropiChat."}
            </p>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#007B85] uppercase tracking-wider">
                  {completedCount} of {onboardingItems.length} completed
                </span>
                <span className="text-xs font-bold text-gray-400">
                  {progressPct}%
                </span>
              </div>
              <Progress
                value={progressPct}
                className="h-2 bg-gray-100 dark:bg-[#1A1A1A]"
              />
            </div>

            <div className="space-y-4">
              {onboardingItems.map((item) => (
                <OnboardingItem
                  key={item.title}
                  title={item.title}
                  completed={item.completed}
                  href={item.href}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Message Volume + Stats */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#213138] dark:text-gray-100">
              {rangeLabel}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset((o) => o - 1)}
                className="p-1.5 rounded-full border border-gray-200 dark:border-[#222222] hover:bg-gray-50 dark:hover:bg-[#111] transition-colors"
                aria-label="Previous week"
              >
                <CaretRight weight="bold" className="h-4 w-4 rotate-180" />
              </button>
              <button
                onClick={() => setWeekOffset((o) => Math.min(o + 1, 0))}
                disabled={weekOffset === 0}
                className="p-1.5 rounded-full border border-gray-200 dark:border-[#222222] hover:bg-gray-50 dark:hover:bg-[#111] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next week"
              >
                <CaretRight weight="bold" className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Message volume chart — spans 2 cols */}
            <div className="md:col-span-2 bg-white dark:bg-[#0C0C0C] border border-gray-100 dark:border-[#1C1C1C] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-8 w-8 bg-[#007B85]/5 rounded-lg flex items-center justify-center">
                  <ChartLineUp className="h-5 w-5 text-[#007B85]" />
                </div>
                <h3 className="font-bold text-[#213138] dark:text-gray-100 text-sm">
                  Message Volume
                </h3>
              </div>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
                {loading
                  ? "Loading..."
                  : `${stats.totalMessages} total messages`}
              </p>
              {loading ? (
                <div className="h-32 mt-6 bg-gray-50 dark:bg-[#111] rounded-xl animate-pulse" />
              ) : (
                <MiniBarChart data={stats.messagesByDay} />
              )}
            </div>

            {/* Right column: 3 stat cards */}
            <div className="flex flex-col gap-6">
              <StatsCard
                title="Time Saved"
                value={
                  loading
                    ? null
                    : stats.automatedMessages > 0
                      ? timeSavedDisplay
                      : "0m"
                }
                description={
                  loading
                    ? "Loading..."
                    : stats.automatedMessages > 0
                      ? `${stats.automatedMessages} auto-replies sent`
                      : "No automated replies yet"
                }
                icon={<Clock className="h-5 w-5 text-[#007B85]" />}
                href="/dashboard/automations"
                hrefLabel="Set up automations"
                showLink={!loading && stats.automatedMessages === 0}
              />
              <StatsCard
                title="New Contacts"
                value={loading ? null : String(stats.newContacts)}
                description={
                  loading
                    ? "Loading..."
                    : stats.newContacts > 0
                      ? "New leads this period"
                      : "No new contacts yet"
                }
                icon={<Target className="h-5 w-5 text-[#007B85]" />}
                href="/dashboard/contacts"
                hrefLabel="View contacts"
                showLink={!loading && stats.newContacts === 0}
              />
              <StatsCard
                title="Avg. Response Time"
                value={loading ? null : avgResponseDisplay ?? "—"}
                description={
                  loading
                    ? "Loading..."
                    : stats.avgResponseMinutes !== null
                      ? "Time to first reply"
                      : "Reply to messages to see this"
                }
                icon={<ChartLineUp className="h-5 w-5 text-[#007B85]" />}
                href="/dashboard"
                hrefLabel="Go to inbox"
                showLink={!loading && stats.avgResponseMinutes === null}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function QuickActionCard({
  title,
  tag,
  icon,
}: {
  title: string
  tag?: string
  icon: React.ReactNode
}) {
  return (
    <div className="group bg-white dark:bg-[#0C0C0C] border border-gray-100 dark:border-[#1C1C1C] rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#007B85]/20 transition-all cursor-pointer relative overflow-hidden h-full">
      {tag && (
        <span className="absolute top-4 right-4 text-[10px] font-black text-white bg-[#FF7E36] px-2 py-0.5 rounded uppercase tracking-widest">
          {tag}
        </span>
      )}
      <div className="mb-4 h-10 w-10 bg-[#007B85]/5 rounded-xl flex items-center justify-center group-hover:bg-[#007B85]/10 transition-colors">
        {icon}
      </div>
      <h3 className="font-bold text-[#213138] dark:text-gray-100 leading-tight mb-2">
        {title}
      </h3>
      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
        <Lightning weight="fill" className="h-3 w-3" />
        Quick Automation
      </p>
    </div>
  )
}

function OnboardingItem({
  title,
  completed,
  href,
}: {
  title: string
  completed: boolean
  href: string
}) {
  const inner = (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-xl border transition-all group",
        completed
          ? "bg-gray-50/50 dark:bg-[#050505] border-gray-100 dark:border-[#111] opacity-60 cursor-default"
          : "bg-white dark:bg-[#0C0C0C] border-gray-100 dark:border-[#1C1C1C] hover:border-[#007B85]/30 hover:shadow-sm cursor-pointer"
      )}
    >
      <div className="flex items-center gap-3">
        {completed ? (
          <CheckCircle weight="fill" className="h-6 w-6 text-[#007B85]" />
        ) : (
          <Circle className="h-6 w-6 text-gray-300 dark:text-gray-700 group-hover:text-[#007B85] transition-colors" />
        )}
        <span
          className={cn(
            "text-sm font-bold",
            completed
              ? "text-gray-500 line-through"
              : "text-[#213138] dark:text-gray-200"
          )}
        >
          {title}
        </span>
      </div>
      {!completed && (
        <CaretRight className="h-4 w-4 text-gray-300 group-hover:text-[#007B85] transition-colors" />
      )}
    </div>
  )

  return completed ? inner : <Link href={href}>{inner}</Link>
}

function StatsCard({
  title,
  value,
  description,
  icon,
  href,
  hrefLabel,
  showLink,
}: {
  title: string
  value: string | null
  description: string
  icon: React.ReactNode
  href: string
  hrefLabel: string
  showLink: boolean
}) {
  return (
    <div className="bg-white dark:bg-[#0C0C0C] border border-gray-100 dark:border-[#1C1C1C] rounded-2xl p-6 shadow-sm flex-1 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 bg-[#007B85]/5 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-bold text-[#213138] dark:text-gray-100 text-sm">
          {title}
        </h3>
      </div>
      {value !== null ? (
        <p className="text-3xl font-black text-[#213138] dark:text-white tracking-tight mb-1">
          {value}
        </p>
      ) : (
        <div className="h-9 w-16 bg-gray-100 dark:bg-[#111] rounded-lg animate-pulse mb-1" />
      )}
      <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium flex-1">
        {description}
      </p>
      {showLink && (
        <Link
          href={href}
          className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#007B85] hover:underline"
        >
          {hrefLabel} <CaretRight weight="bold" className="h-2.5 w-2.5" />
        </Link>
      )}
    </div>
  )
}
