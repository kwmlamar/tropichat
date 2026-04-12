"use client"
import React, { useState } from "react"
import { motion } from "framer-motion"
import {
  Building2,
  DollarSign,
  CreditCard,
  Calendar,
  Sparkles,
  Zap,
  AlertTriangle,
  Check,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { extractStyleFromSample } from "@/lib/ai-schema"
import type { AIVoiceProfile, BusinessBrief } from "@/lib/ai-schema"

interface AIConfigureViewProps {
  voiceProfile: AIVoiceProfile
  businessBrief: BusinessBrief
  autoPilot: boolean
  onAutoPilotChange: (enabled: boolean) => Promise<void>
  onSave: (patch: { voiceProfile?: AIVoiceProfile; businessBrief?: BusinessBrief }) => Promise<void>
  onResetVoiceProfile: () => void
}

// ─── Shared UI Primitives ───────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  description,
  children,
  delay = 0,
  defaultOpen = true
}: {
  icon: React.ReactNode
  title: string
  description: string
  children: React.ReactNode
  delay?: number
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white dark:bg-[#0C0C0C] border border-gray-100 dark:border-[#1C1C1C] rounded-3xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-7 py-5 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-[#3A9B9F]/10 border border-[#3A9B9F]/20 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="text-left">
            <h3 className="text-[13px] font-black text-[#213138] dark:text-white uppercase tracking-widest">{title}</h3>
            <p className="text-[11px] font-medium text-gray-400 mt-0.5">{description}</p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-7 pb-7 border-t border-gray-50 dark:border-[#1C1C1C]">
          {children}
        </div>
      )}
    </motion.div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{children}</label>
  )
}

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className={cn(
        "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
        saving
          ? "bg-gray-100 dark:bg-[#111] text-gray-400 cursor-wait"
          : "bg-[#3A9B9F] text-white hover:bg-[#2F8488] shadow-md shadow-[#3A9B9F]/20"
      )}
    >
      {saving ? (
        <RefreshCw className="h-3 w-3 animate-spin" />
      ) : (
        <Save className="h-3 w-3" />
      )}
      {saving ? "Saving…" : "Save"}
    </button>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AIConfigureView({
  voiceProfile,
  businessBrief,
  autoPilot,
  onAutoPilotChange,
  onSave,
  onResetVoiceProfile
}: AIConfigureViewProps) {

  // Local editable copies
  const [brief, setBrief] = useState<BusinessBrief>({ ...businessBrief })
  const [voice, setVoice] = useState<AIVoiceProfile>({ ...voiceProfile })
  const [pilotSaving, setPilotSaving] = useState(false)
  const [savingSection, setSavingSection] = useState<string | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const updateBrief = (patch: Partial<BusinessBrief>) =>
    setBrief(prev => ({ ...prev, ...patch }))

  const updateVoice = (patch: Partial<AIVoiceProfile>) =>
    setVoice(prev => ({ ...prev, ...patch }))

  const togglePayment = (method: string) => {
    const cur = brief.paymentMethods
    updateBrief({
      paymentMethods: cur.includes(method)
        ? cur.filter(m => m !== method)
        : [...cur, method]
    })
  }

  const saveSection = async (section: string, patch: Parameters<typeof onSave>[0]) => {
    setSavingSection(section)
    try {
      await onSave(patch)
      toast.success("Saved")
    } catch {
      toast.error("Failed to save")
    } finally {
      setSavingSection(null)
    }
  }

  const handlePilotToggle = async (enabled: boolean) => {
    setPilotSaving(true)
    await onAutoPilotChange(enabled)
    setPilotSaving(false)
  }

  const handleRetrainStyle = () => {
    if (!voice.sampleReply.trim()) {
      toast.error("Add a sample reply first")
      return
    }
    const extracted = extractStyleFromSample(voice.sampleReply)
    const updated: AIVoiceProfile = {
      ...voice,
      emojiUsage: extracted.emojiUsage,
      greeting: extracted.greeting || voice.greeting,
      responseLength: voice.sampleReply.split(/[.!?]/).length > 2 ? "medium" : "short",
    }
    setVoice(updated)
    toast.success("Style extracted from sample")
  }

  const BUSINESS_TYPES = [
    "Tours & Experiences", "Boutique / Retail", "Salon & Beauty", "Restaurant / Food",
    "Bakery", "Real Estate", "Auto Services", "Photography",
    "Boat Charter", "General Services", "Other"
  ]
  const PAYMENT_OPTIONS = ["Cash", "Zelle", "Card", "Wire Transfer", "WhatsApp Pay", "Pay Later"]
  const AI_GOALS = [
    { value: "book", label: "Book Appointments", desc: "Push every chat toward a confirmed booking" },
    { value: "sell", label: "Close Sales", desc: "Guide customers to purchase" },
    { value: "capture", label: "Capture Leads", desc: "Collect info and build pipeline" },
    { value: "faq", label: "Answer FAQs", desc: "Handle questions and triage to you" },
  ] as const

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-5">

      {/* ── Business Identity ── */}
      <SectionCard
        icon={<Building2 className="h-5 w-5 text-[#3A9B9F]" />}
        title="Business Identity"
        description="What your AI introduces itself as"
        delay={0.05}
      >
        <div className="pt-6 space-y-5">
          <div className="space-y-3">
            <Label>Business Type</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BUSINESS_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => updateBrief({ businessType: type })}
                  className={cn(
                    "px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all text-left border",
                    brief.businessType === type
                      ? "bg-[#3A9B9F] text-white border-[#3A9B9F]"
                      : "bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-[#1C1C1C] text-gray-700 dark:text-gray-300 hover:border-[#3A9B9F]/40"
                  )}
                >
                  {brief.businessType === type && <Check className="inline h-3 w-3 mr-1 mb-0.5" />}
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>One-Line Tagline</Label>
            <input
              value={brief.tagline}
              onChange={e => updateBrief({ tagline: e.target.value })}
              placeholder="e.g. Premium island tours from Nassau"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1C1C1C] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#3A9B9F] outline-none dark:text-white"
            />
          </div>

          <div className="flex justify-end pt-1">
            <SaveButton
              onClick={() => saveSection("identity", { businessBrief: brief })}
              saving={savingSection === "identity"}
            />
          </div>
        </div>
      </SectionCard>

      {/* ── Services & Pricing ── */}
      <SectionCard
        icon={<DollarSign className="h-5 w-5 text-[#3A9B9F]" />}
        title="Services & Pricing"
        description="Your AI quotes these exact prices to customers"
        delay={0.1}
      >
        <div className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Services & Prices</Label>
            <textarea
              value={brief.services}
              onChange={e => updateBrief({ services: e.target.value })}
              rows={7}
              placeholder={"Women's cuts $50\nBlowout $35\nBraids from $80\n\nOne service per line with its price."}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1C1C1C] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#3A9B9F] outline-none resize-none dark:text-white font-mono"
            />
            <p className="text-[11px] text-gray-400">One service per line. Include the price so the AI can quote it exactly.</p>
          </div>

          <div className="flex justify-end">
            <SaveButton
              onClick={() => saveSection("services", { businessBrief: brief })}
              saving={savingSection === "services"}
            />
          </div>
        </div>
      </SectionCard>

      {/* ── Payment & Logistics ── */}
      <SectionCard
        icon={<CreditCard className="h-5 w-5 text-[#3A9B9F]" />}
        title="Payment & Logistics"
        description="How your customers pay and receive their order"
        delay={0.15}
      >
        <div className="pt-6 space-y-5">
          <div className="space-y-3">
            <Label>Accepted Payment Methods</Label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_OPTIONS.map(method => (
                <button
                  key={method}
                  onClick={() => togglePayment(method)}
                  className={cn(
                    "px-4 py-2 rounded-full text-[12px] font-bold transition-all border",
                    brief.paymentMethods.includes(method)
                      ? "bg-[#3A9B9F] text-white border-[#3A9B9F]"
                      : "bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-[#1C1C1C] text-gray-600 dark:text-gray-300 hover:border-[#3A9B9F]/40"
                  )}
                >
                  {brief.paymentMethods.includes(method) && "✓ "}{method}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1C1C1C] rounded-xl">
            <div>
              <p className="text-[13px] font-bold dark:text-white">Delivery or Pickup</p>
              <p className="text-[11px] text-gray-500">AI mentions this when relevant</p>
            </div>
            <Switch checked={brief.hasDelivery} onCheckedChange={v => updateBrief({ hasDelivery: v })} />
          </div>

          <div className="flex justify-end">
            <SaveButton
              onClick={() => saveSection("payment", { businessBrief: brief })}
              saving={savingSection === "payment"}
            />
          </div>
        </div>
      </SectionCard>

      {/* ── Booking & AI Goal ── */}
      <SectionCard
        icon={<Calendar className="h-5 w-5 text-[#3A9B9F]" />}
        title="Booking & AI Goal"
        description="What your AI pushes every conversation toward"
        delay={0.2}
      >
        <div className="pt-6 space-y-5">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1C1C1C] rounded-xl">
            <div>
              <p className="text-[13px] font-bold dark:text-white">Takes Appointments / Bookings</p>
              <p className="text-[11px] text-gray-500">Turn on if customers schedule in advance</p>
            </div>
            <Switch checked={brief.takesBookings} onCheckedChange={v => updateBrief({ takesBookings: v })} />
          </div>

          {brief.takesBookings && (
            <div className="space-y-2">
              <Label>How do they book?</Label>
              <div className="grid grid-cols-2 gap-2">
                {["WhatsApp", "Phone Call", "Walk-in", "Online Link"].map(m => (
                  <button
                    key={m}
                    onClick={() => updateBrief({ bookingMethod: m })}
                    className={cn(
                      "px-3 py-2.5 rounded-xl text-[12px] font-bold border transition-all",
                      brief.bookingMethod === m
                        ? "bg-[#3A9B9F] text-white border-[#3A9B9F]"
                        : "bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-[#1C1C1C] text-gray-600 dark:text-gray-300 hover:border-[#3A9B9F]/40"
                    )}
                  >{m}</button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Typical Availability / Lead Time</Label>
            <input
              value={brief.availability}
              onChange={e => updateBrief({ availability: e.target.value })}
              placeholder="e.g. Usually available same week, book 24 hrs ahead"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1C1C1C] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#3A9B9F] outline-none dark:text-white"
            />
          </div>

          <div className="space-y-3">
            <Label>AI Primary Goal</Label>
            <div className="grid grid-cols-2 gap-2">
              {AI_GOALS.map(g => (
                <button
                  key={g.value}
                  onClick={() => updateBrief({ aiGoal: g.value })}
                  className={cn(
                    "p-3.5 rounded-2xl text-left border transition-all",
                    brief.aiGoal === g.value
                      ? "bg-[#3A9B9F]/10 border-[#3A9B9F] text-[#3A9B9F]"
                      : "bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-[#1C1C1C] text-gray-600 dark:text-gray-300 hover:border-[#3A9B9F]/40"
                  )}
                >
                  <p className="text-[12px] font-black">{g.label}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{g.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <SaveButton
              onClick={() => saveSection("booking", { businessBrief: brief })}
              saving={savingSection === "booking"}
            />
          </div>
        </div>
      </SectionCard>

      {/* ── Voice & Style ── */}
      <SectionCard
        icon={<Sparkles className="h-5 w-5 text-[#3A9B9F]" />}
        title="Voice & Style"
        description="How your AI sounds when it replies"
        delay={0.25}
      >
        <div className="pt-6 space-y-6">
          {/* Tone */}
          <div className="space-y-3">
            <Label>Tone</Label>
            <div className="flex flex-wrap gap-2">
              {(["casual", "professional", "direct", "expressive"] as AIVoiceProfile["tone"][]).map(t => (
                <button
                  key={t}
                  onClick={() => updateVoice({ tone: t })}
                  className={cn(
                    "px-4 py-2 rounded-full text-[12px] font-bold capitalize border transition-all",
                    voice.tone === t
                      ? "bg-[#3A9B9F] text-white border-[#3A9B9F]"
                      : "bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-[#1C1C1C] text-gray-600 dark:text-gray-300 hover:border-[#3A9B9F]/40"
                  )}
                >{t}</button>
              ))}
            </div>
          </div>

          {/* Response Length */}
          <div className="space-y-3">
            <Label>Response Length</Label>
            <div className="flex flex-wrap gap-2">
              {(["short", "medium", "detailed"] as AIVoiceProfile["responseLength"][]).map(l => (
                <button
                  key={l}
                  onClick={() => updateVoice({ responseLength: l })}
                  className={cn(
                    "px-4 py-2 rounded-full text-[12px] font-bold capitalize border transition-all",
                    voice.responseLength === l
                      ? "bg-[#3A9B9F] text-white border-[#3A9B9F]"
                      : "bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-[#1C1C1C] text-gray-600 dark:text-gray-300 hover:border-[#3A9B9F]/40"
                  )}
                >{l}</button>
              ))}
            </div>
          </div>

          {/* Emoji Usage */}
          <div className="space-y-3">
            <Label>Emoji Usage</Label>
            <div className="flex flex-wrap gap-2">
              {(["none", "light", "heavy"] as AIVoiceProfile["emojiUsage"][]).map(e => (
                <button
                  key={e}
                  onClick={() => updateVoice({ emojiUsage: e })}
                  className={cn(
                    "px-4 py-2 rounded-full text-[12px] font-bold capitalize border transition-all",
                    voice.emojiUsage === e
                      ? "bg-[#3A9B9F] text-white border-[#3A9B9F]"
                      : "bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-[#1C1C1C] text-gray-600 dark:text-gray-300 hover:border-[#3A9B9F]/40"
                  )}
                >
                  {e === "none" ? "None" : e === "light" ? "Light 😊" : "Heavy 🎉🔥"}
                </button>
              ))}
            </div>
          </div>

          {/* Greeting / Closer */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Greeting</Label>
              <input
                value={voice.greeting}
                onChange={e => updateVoice({ greeting: e.target.value })}
                placeholder="Hey there!"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1C1C1C] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#3A9B9F] outline-none dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Default Sign-Off</Label>
              <input
                value={voice.closer}
                onChange={e => updateVoice({ closer: e.target.value })}
                placeholder="Let me know!"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1C1C1C] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#3A9B9F] outline-none dark:text-white"
              />
            </div>
          </div>

          {/* Sample Reply + Retrain */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Training Sample Reply</Label>
              <button
                onClick={handleRetrainStyle}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#3A9B9F] hover:text-[#2F8488] transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Re-extract Style
              </button>
            </div>
            <textarea
              value={voice.sampleReply}
              onChange={e => updateVoice({ sampleReply: e.target.value })}
              rows={4}
              placeholder="Paste a real reply you'd send a customer — your AI copies your tone and emoji style from this."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#1C1C1C] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#3A9B9F] outline-none resize-none dark:text-white"
            />
            <p className="text-[11px] text-gray-400">Change this and hit "Re-extract Style" to update tone and emoji settings automatically.</p>
          </div>

          <div className="flex justify-end">
            <SaveButton
              onClick={() => saveSection("voice", { voiceProfile: voice })}
              saving={savingSection === "voice"}
            />
          </div>
        </div>
      </SectionCard>

      {/* ── Automation ── */}
      <SectionCard
        icon={<Zap className="h-5 w-5 text-[#3A9B9F]" />}
        title="Automation"
        description="Control when your AI replies automatically"
        delay={0.3}
      >
        <div className="pt-6 space-y-4">
          <div className={cn(
            "flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300",
            autoPilot
              ? "bg-[#3A9B9F]/5 border-[#3A9B9F]/30 shadow-lg shadow-[#3A9B9F]/5"
              : "bg-gray-50 dark:bg-[#080808] border-gray-200 dark:border-[#1C1C1C]"
          )}>
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
              autoPilot ? "bg-[#3A9B9F]" : "bg-gray-200 dark:bg-[#1C1C1C]"
            )}>
              <Zap className={cn("h-5 w-5", autoPilot ? "text-white" : "text-gray-400")} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-bold dark:text-white">Auto-Pilot</p>
                {autoPilot && (
                  <span className="text-[9px] font-black text-[#3A9B9F] bg-[#3A9B9F]/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider border border-[#3A9B9F]/20">
                    Live
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500">
                {autoPilot
                  ? "Replying automatically on WhatsApp, Instagram & Messenger"
                  : "Suggestions only — auto-reply is off"}
              </p>
            </div>
            <Switch
              checked={autoPilot}
              onCheckedChange={handlePilotToggle}
              disabled={pilotSaving}
            />
          </div>

          {autoPilot && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl"
            >
              <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Auto-Pilot is active. Your AI will reply to new messages without your review. Check the inbox regularly.
              </p>
            </motion.div>
          )}
        </div>
      </SectionCard>

      {/* ── Danger Zone ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white dark:bg-[#0C0C0C] border border-red-100 dark:border-red-900/30 rounded-3xl overflow-hidden"
      >
        <div className="px-7 py-5">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-[13px] font-black text-[#213138] dark:text-white uppercase tracking-widest">Danger Zone</h3>
              <p className="text-[11px] font-medium text-gray-400 mt-0.5">Irreversible actions — proceed carefully</p>
            </div>
          </div>
        </div>

        <div className="px-7 pb-7 border-t border-red-50 dark:border-red-900/20">
          <div className="pt-5 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-[#213138] dark:text-white">Reset Voice Profile</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Clears your AI's training. You'll need to run the setup wizard again.</p>
            </div>
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                Reset
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border border-gray-200 dark:border-[#1C1C1C] text-gray-500 hover:bg-gray-50 dark:hover:bg-[#111] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowResetConfirm(false); onResetVoiceProfile() }}
                  className="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-red-500 text-white hover:bg-red-600 transition-all"
                >
                  Confirm Reset
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
