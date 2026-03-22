"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Sparkle as Sparkles,
  FacebookLogo as Facebook,
  InstagramLogo as Instagram,
  ChatCircleDots as MessageCircle,
  Phone,
  MagnifyingGlass as Search,
  Gear as Settings,
  Users,
  Tag,
  Checks as CheckCheck,
  Circle,
  SquaresFour as LayoutDashboard,
  PaperPlaneRight as Send,
  CaretLeft as ChevronLeft,
  DotsThreeVertical as MoreVertical,
  VideoCamera as Video,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

// ─── Shared data ─────────────────────────────────────────────────────────────

const conversations = [
  {
    name: "Maria Santos",
    preview: "Hey, is the birthday cake ready for...",
    time: "9:41 AM",
    unread: 2,
    channel: "wa",
    avatar: "MS",
    avatarColor: "bg-emerald-500",
  },
  {
    name: "Caribbean Tours",
    preview: "Can we book 4 spots for Friday?",
    time: "9:30 AM",
    unread: 0,
    channel: "ig",
    avatar: "CT",
    avatarColor: "bg-pink-500",
  },
  {
    name: "Nathan Adams",
    preview: "I'm looking forward to it!",
    time: "8:55 AM",
    unread: 0,
    channel: "fb",
    avatar: "NA",
    avatarColor: "bg-blue-500",
  },
  {
    name: "Alaska Young",
    preview: "That's great to hear, thanks!",
    time: "7:12 AM",
    unread: 0,
    channel: "wa",
    avatar: "AY",
    avatarColor: "bg-violet-500",
  },
  {
    name: "Brandon Khan",
    preview: "You're absolutely right 👍",
    time: "Yesterday",
    unread: 0,
    channel: "ig",
    avatar: "BK",
    avatarColor: "bg-orange-500",
  },
  {
    name: "Lucas Maguire",
    preview: "Taking care of ourselves is essent...",
    time: "Monday",
    unread: 0,
    channel: "fb",
    avatar: "LM",
    avatarColor: "bg-teal-500",
  },
]

const ChannelDot = ({ channel }: { channel: string }) => {
  const map: Record<string, string> = {
    wa: "bg-[#25D366]",
    ig: "bg-gradient-to-br from-pink-500 to-purple-600",
    fb: "bg-[#0084FF]",
  }
  return (
    <span
      className={cn(
        "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-black",
        map[channel] ?? "bg-gray-400"
      )}
    />
  )
}

// ─── Desktop / Tablet mockup ─────────────────────────────────────────────────

function DesktopAppMockup() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-white dark:bg-black font-sans text-[13px]">
      {/* Sidebar — collapsed icon rail */}
      <div className="flex w-14 flex-col items-center gap-4 border-r border-slate-100 dark:border-[#222222] bg-[#213138] dark:bg-[#0A0A0A] py-4">
        {/* Logo mark */}
        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-[#3A9B9F]">
          <MessageCircle weight="bold" className="h-4 w-4 text-white" />
        </div>
        {[LayoutDashboard, Users, Tag, Settings].map((Icon, i) => (
          <button
            key={i}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${i === 0 ? "bg-[#3A9B9F]/20 text-[#3A9B9F]" : "text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
          >
            <Icon weight="bold" className="h-4 w-4" />
          </button>
        ))}
      </div>

      {/* Conversation list */}
      <div className="flex w-[220px] flex-col border-r border-slate-100 dark:border-[#222222] bg-white dark:bg-black">
        {/* Header */}
        <div className="border-b border-slate-100 dark:border-[#222222] px-3 py-3">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-[#111111] px-2.5 py-1.5">
            <Search weight="bold" className="h-3.5 w-3.5 text-slate-400 dark:text-gray-500" />
            <span className="text-[11px] text-slate-400">Search conversations…</span>
          </div>
          {/* Tab pills */}
          <div className="mt-2.5 flex gap-1">
            {["All", "Open", "Done"].map((tab, i) => (
              <button
                key={tab}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${i === 0
                    ? "bg-[#213138] dark:bg-[#3A9B9F] text-white"
                    : "text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-[#111111]"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-hidden">
          {conversations.map((c, i) => (
            <div
              key={i}
              className={`flex cursor-pointer items-start gap-2.5 px-3 py-2.5 transition-colors ${i === 0 ? "bg-teal-50/60 dark:bg-[#3A9B9F]/10" : "hover:bg-slate-50 dark:hover:bg-[#111111]"
                }`}
            >
              <div className="relative mt-0.5 shrink-0">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${c.avatarColor} text-[10px] font-bold text-white`}
                >
                  {c.avatar}
                </div>
                <ChannelDot channel={c.channel} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className={`truncate font-semibold ${i === 0 ? "text-[#213138] dark:text-white" : "text-slate-700 dark:text-gray-300"} text-[11px]`}>
                    {c.name}
                  </span>
                  <span className="ml-1 shrink-0 text-[9px] text-slate-400 dark:text-gray-500">{c.time}</span>
                </div>
                <p className="truncate text-[10px] text-slate-500 dark:text-gray-400">{c.preview}</p>
              </div>
              {c.unread > 0 && (
                <div className="ml-1 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#3A9B9F] text-[9px] font-bold text-white">
                  {c.unread}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat panel */}
      <div className="flex flex-1 flex-col bg-slate-50/40 dark:bg-white/[0.02]">
        {/* Chat header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222222] bg-white dark:bg-black px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white">
                MS
              </div>
              <ChannelDot channel="wa" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#213138] dark:text-white">Maria Santos</p>
              <p className="text-[10px] text-slate-400 dark:text-gray-500">via WhatsApp · Active now</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {["VIP", "Payment Pending"].map((tag) => (
              <span key={tag} className="rounded-full border border-slate-200 dark:border-[#222222] bg-slate-50 dark:bg-[#111111] px-2 py-0.5 text-[9px] font-semibold text-slate-500 dark:text-gray-400">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex flex-1 flex-col justify-end gap-2 overflow-hidden px-5 py-4">
          {/* Date divider */}
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-slate-200 dark:bg-[#222222]" />
            <span className="text-[9px] text-slate-400 dark:text-gray-500">Today</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-[#222222]" />
          </div>

          {/* Inbound */}
          <div className="flex items-end gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white">MS</div>
            <div className="max-w-[60%] rounded-2xl rounded-bl-sm bg-white dark:bg-[#111111] px-3 py-2 shadow-sm ring-1 ring-slate-100 dark:ring-[#222222]">
              <p className="text-[11px] text-slate-700 dark:text-gray-200">Hey, is the birthday cake ready for Saturday? We need it by 2 PM</p>
              <p className="mt-1 text-[9px] text-slate-400 dark:text-gray-500">9:38 AM</p>
            </div>
          </div>

          {/* Outbound */}
          <div className="flex items-end justify-end gap-2">
            <div className="max-w-[60%] rounded-2xl rounded-br-sm bg-gradient-to-br from-[#3A9B9F] to-[#2F8488] px-3 py-2 shadow-sm">
              <p className="text-[11px] text-white">Hi Maria! Yes, your order is confirmed for Saturday at 2 PM. We'll have it ready for pickup! 🎂</p>
              <div className="mt-1 flex items-center justify-end gap-1">
                <p className="text-[9px] text-white/70">9:41 AM</p>
                <CheckCheck weight="bold" className="h-3 w-3 text-white/70" />
              </div>
            </div>
          </div>

          {/* Inbound — typing */}
          <div className="flex items-end gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white">MS</div>
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100">
              <Circle weight="fill" className="h-1.5 w-1.5 animate-bounce text-slate-400" style={{ animationDelay: "0ms" }} />
              <Circle weight="fill" className="h-1.5 w-1.5 animate-bounce text-slate-400" style={{ animationDelay: "150ms" }} />
              <Circle weight="fill" className="h-1.5 w-1.5 animate-bounce text-slate-400" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="border-t border-slate-100 dark:border-[#222222] bg-white dark:bg-black px-4 py-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-[#222222] bg-slate-50 dark:bg-[#111111] px-3 py-2">
            <span className="flex-1 text-[11px] text-slate-400 dark:text-gray-500">Type a message…</span>
            <button className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#3A9B9F] transition-colors hover:bg-[#2F8488]">
              <Send weight="bold" className="h-3 w-3 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Contact detail panel */}
      <div className="hidden w-[170px] flex-col border-l border-slate-100 dark:border-[#222222] bg-white dark:bg-black xl:flex">
        <div className="border-b border-slate-100 dark:border-[#222222] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">Contact</p>
        </div>
        <div className="flex flex-col items-center gap-2 px-4 pt-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">MS</div>
          <p className="text-center text-[11px] font-bold text-[#213138] dark:text-white">Maria Santos</p>
          <span className="rounded-full bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 text-[9px] font-semibold text-amber-600 dark:text-amber-500">VIP Customer</span>
        </div>
        <div className="mt-4 space-y-3 px-4">
          {[
            { label: "Channels", value: "WA · IG" },
            { label: "Orders", value: "12 total" },
            { label: "Last seen", value: "Active now" },
          ].map((r) => (
            <div key={r.label}>
              <p className="text-[9px] font-semibold uppercase text-slate-400 dark:text-gray-500">{r.label}</p>
              <p className="text-[11px] font-semibold text-[#213138] dark:text-gray-200">{r.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Mobile mockup ───────────────────────────────────────────────────────────

function MobileAppMockup() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white dark:bg-black font-sans text-[11px]">
      {/* Status bar */}
      <div className="flex items-center justify-between bg-white dark:bg-black px-4 pt-2 pb-1">
        <span className="text-[10px] font-semibold text-[#213138] dark:text-white">9:41</span>
        <div className="flex items-center gap-1">
          <div className="flex gap-0.5">
            {[3, 4, 4, 3].map((h, i) => (
              <div key={i} className="w-1 rounded-sm bg-[#213138] dark:bg-white" style={{ height: `${h * 2}px` }} />
            ))}
          </div>
          <div className="ml-0.5 h-2.5 w-4 rounded-sm border border-[#213138] dark:border-white p-0.5">
            <div className="h-full w-[70%] rounded-[1px] bg-[#213138] dark:bg-white" />
          </div>
        </div>
      </div>

      {/* Chat header */}
      <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-[#222222] px-3 py-2">
        <button className="text-[#3A9B9F]">
          <ChevronLeft weight="bold" className="h-4 w-4" />
        </button>
        <div className="relative">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
            MS
          </div>
          <ChannelDot channel="wa" />
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-bold text-[#213138] dark:text-white">Maria Santos</p>
          <p className="text-[9px] text-slate-400 dark:text-gray-500">WhatsApp · Online</p>
        </div>
        <button className="text-slate-400">
          <Video weight="bold" className="h-4 w-4" />
        </button>
        <button className="text-slate-400">
          <MoreVertical weight="bold" className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col justify-end gap-2 overflow-hidden bg-slate-50/50 dark:bg-white/[0.02] px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-slate-200 dark:bg-[#222222]" />
          <span className="text-[8px] text-slate-400 dark:text-gray-500">Today</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-[#222222]" />
        </div>

        {/* Inbound */}
        <div className="flex items-end gap-1.5">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[7px] font-bold text-white">MS</div>
          <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-white dark:bg-[#111111] px-2.5 py-1.5 shadow-sm ring-1 ring-slate-100 dark:ring-[#222222]">
            <p className="text-[10px] leading-relaxed text-slate-700 dark:text-gray-200">Is the birthday cake ready for Saturday? Need it by 2 PM!</p>
            <p className="mt-0.5 text-[8px] text-slate-400 dark:text-gray-500">9:38 AM</p>
          </div>
        </div>

        {/* Outbound */}
        <div className="flex items-end justify-end gap-1.5">
          <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-gradient-to-br from-[#3A9B9F] to-[#2F8488] px-2.5 py-1.5 shadow-sm">
            <p className="text-[10px] leading-relaxed text-white">Hi Maria! Yes, confirmed for Saturday 2 PM. Ready for pickup!</p>
            <div className="mt-0.5 flex items-center justify-end gap-1">
              <p className="text-[8px] text-white/70">9:41 AM</p>
              <CheckCheck weight="bold" className="h-2.5 w-2.5 text-white/70" />
            </div>
          </div>
        </div>

        {/* Second inbound */}
        <div className="flex items-end gap-1.5">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[7px] font-bold text-white">MS</div>
          <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-white px-2.5 py-1.5 shadow-sm ring-1 ring-slate-100">
            <p className="text-[10px] leading-relaxed text-slate-700">Perfect, thank you so much!</p>
            <p className="mt-0.5 text-[8px] text-slate-400">9:42 AM</p>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 dark:border-[#222222] bg-white dark:bg-black px-3 py-2">
        <div className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-[#222222] bg-slate-50 dark:bg-[#111111] px-3 py-1.5">
          <span className="flex-1 text-[10px] text-slate-400 dark:text-gray-500">Message…</span>
          <button className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3A9B9F]">
            <Send weight="bold" className="h-2.5 w-2.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Hero Section ────────────────────────────────────────────────────────

export function HeroSection() {
  const scrollToWaitlist = () => {
    const waitlistSection = document.getElementById("waitlist")
    waitlistSection?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="relative overflow-hidden bg-white dark:bg-black pt-32 pb-20 md:pt-40 md:pb-24">
      {/* Background Rings & Glow */}
      <div className="absolute left-1/2 top-0 -z-10 h-[1200px] w-full -translate-x-1/2 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,transparent_20%,white_70%)] dark:bg-[radial-gradient(ellipse_at_top_center,transparent_20%,#121212_70%)] z-10" />
        <div className="absolute left-1/2 top-[10%] -translate-x-1/2 -translate-y-1/2">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-slate-200/60 dark:border-[#222222]"
              style={{ width: `${(i + 1) * 220}px`, height: `${(i + 1) * 220}px` }}
            />
          ))}
        </div>
      </div>

      {/* Brand Glowing Orbs */}
      <div className="absolute left-1/2 top-[15%] -z-10 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 opacity-40 pointer-events-none">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-[#3A9B9F]/20 blur-[100px]" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-[#FF8B66]/10 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
        {/* Top Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-teal-200 dark:border-teal-900/30 bg-teal-50 dark:bg-teal-900/10 px-4 py-1.5 text-sm font-semibold text-teal-800 dark:text-teal-400 shadow-sm transition-all hover:bg-teal-100 dark:hover:bg-teal-900/20"
        >
          <Sparkles weight="bold" className="h-4 w-4 text-[#3A9B9F]" />
          <span>#1 MULTI-CHANNEL INBOX</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mb-6 max-w-4xl  text-5xl font-bold tracking-tight text-[#213138] dark:text-white md:text-6xl lg:text-7xl leading-[1.1]"
        >
          The best messaging system <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3A9B9F] to-[#2F8488]">
            for your entire team
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-10 max-w-2xl  text-lg text-slate-600 dark:text-gray-400 md:text-xl leading-relaxed"
        >
          Bring WhatsApp, Instagram, and Facebook Messenger into one delightful app.{" "}
          <span className="font-medium text-slate-800 dark:text-gray-200">
            Work anywhere, across all devices.
          </span>
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 items-center justify-center"
        >
          <Button
            onClick={scrollToWaitlist}
            className="group relative rounded-full bg-[#3A9B9F] px-8 py-7 text-lg font-semibold text-white shadow-[0_8px_30px_-8px_rgba(58,155,159,0.5)] transition-all hover:scale-105 hover:bg-[#2F8488] hover:shadow-[0_12px_40px_-8px_rgba(58,155,159,0.6)] btn-press"
          >
            Start Free 14-Day Trial
            <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        </motion.div>

        {/* ── Devices Mockup ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="relative mt-20 w-full max-w-5xl"
        >
          {/* ── Desktop / Tablet Frame ── */}
          <div className="relative z-10 rounded-2xl border border-slate-200/80 dark:border-[#222222] bg-white dark:bg-[#0A0A0A] p-2 shadow-[0_20px_80px_-15px_rgba(0,0,0,0.09)] sm:rounded-[2rem] sm:p-3">
            <div className="overflow-hidden rounded-xl bg-white dark:bg-black ring-1 ring-slate-200 dark:ring-[#222222] sm:rounded-2xl">
              {/* Window chrome */}
              <div className="flex h-9 items-center gap-2 border-b border-slate-100 dark:border-[#222222] bg-white dark:bg-[#0A0A0A] px-4">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <div className="ml-3 flex-1 rounded-md bg-slate-100 dark:bg-black px-3 py-1 text-[11px] text-slate-400 dark:text-gray-500">
                  app.tropichat.com
                </div>
              </div>
              {/* App UI */}
              <div className="h-[340px] sm:h-[420px] lg:h-[480px]">
                <DesktopAppMockup />
              </div>
            </div>
          </div>

          {/* ── Phone Frame ── */}
          <div className="absolute -bottom-10 -right-3 z-20 w-[30%] min-w-[130px] max-w-[230px] sm:-bottom-14 sm:-right-6 lg:-right-10">
            <div className="relative rounded-[2rem] border-[3px] border-slate-300 dark:border-white/20 bg-slate-800 p-1.5 shadow-[0_30px_80px_-10px_rgba(0,0,0,0.25)] sm:rounded-[2.5rem] sm:border-[4px] sm:p-2">
              {/* Dynamic island */}
              <div className="absolute left-1/2 top-3 z-10 h-3 w-[35%] -translate-x-1/2 rounded-full bg-slate-800 sm:top-3.5 sm:h-3.5" />
              {/* Screen */}
              <div className="overflow-hidden rounded-[1.6rem] bg-white dark:bg-black">
                <div className="h-[280px] sm:h-[380px] lg:h-[420px]">
                  <MobileAppMockup />
                </div>
              </div>
              {/* Home bar */}
              <div className="mx-auto mt-1 h-1 w-[40%] rounded-full bg-slate-600 sm:mt-1.5" />
            </div>
          </div>
        </motion.div>

        {/* Bottom Integrations */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-32 w-full pt-10"
        >
          <p className="mb-8 text-sm font-semibold tracking-wider text-slate-400">
            INTEGRATES SEAMLESSLY WITH
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100">
            <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-gray-300 text-lg md:text-xl transition-colors hover:text-[#25D366]">
              <MessageCircle weight="bold" className="h-6 w-6" />
              WhatsApp
            </div>
            <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-gray-300 text-lg md:text-xl transition-colors hover:text-[#0084FF]">
              <Facebook weight="bold" className="h-6 w-6" />
              Messenger
            </div>
            <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-gray-300 text-lg md:text-xl transition-colors hover:text-[#E1306C]">
              <Instagram weight="bold" className="h-6 w-6" />
              Instagram
            </div>
            <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-gray-300 text-lg md:text-xl transition-colors hover:text-[#3A9B9F]">
              <Phone weight="bold" className="h-6 w-6" />
              SMS
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
