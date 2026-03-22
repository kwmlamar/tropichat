"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle,
  CircleNotch as Loader2,
  Link as Link2,
  Warning as AlertTriangle,
  FacebookLogo as Facebook,
  ArrowRight,
  Phone,
  WifiHigh as Signal,
  InstagramLogo as Instagram,
  ChatCircle as MessageCircle,
  CaretDown as ChevronDown,
  CaretUp as ChevronUp,
} from "@phosphor-icons/react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar } from "@/components/ui/avatar"
import {
  fetchFacebookPages,
  selectFacebookPage,
  fetchInstagramAccounts,
  selectInstagramAccount,
  fetchWhatsAppNumbers,
  selectWhatsAppNumber,
  getMetaStatus,
  type FacebookPage,
  type InstagramAccount,
  type WhatsAppPhoneNumber,
} from "@/lib/meta-connections"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type ChannelKey = "messenger" | "instagram" | "whatsapp"

interface ChannelState<T> {
  items: T[]
  selectedId: string | null
  loading: boolean
  saving: boolean
  connected: boolean
  open: boolean
}

// ─── Quality signal dot for WhatsApp numbers ──────────────────────────────────
function QualityDot({ rating }: { rating: string | null }) {
  const color =
    rating === "GREEN"  ? "bg-[#3A9B9F]" :
    rating === "YELLOW" ? "bg-amber-400"  :
    rating === "RED"    ? "bg-red-500"    :
    "bg-gray-300 dark:bg-[#333]"
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} title={rating || "Unknown"} />
}

// ─── Selectable row card ─────────────────────────────────────────────────────
// Identity of this page: clean radio-select rows, not checkbox grids.
// Selected state uses a teal left border + subtle bg lift.
interface SelectableCardProps {
  isSelected: boolean
  onClick: () => void
  avatar: React.ReactNode
  title: string
  subtitle: string
  badge?: React.ReactNode
  trailing?: React.ReactNode
}

function SelectableCard({ isSelected, onClick, avatar, title, subtitle, badge, trailing }: SelectableCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border transition-all duration-200 p-4 flex items-center gap-3 relative overflow-hidden",
        isSelected
          ? "border-[#3A9B9F] bg-[#3A9B9F]/[0.04] dark:bg-[#3A9B9F]/[0.06]"
          : "border-gray-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C] hover:border-gray-300 dark:hover:border-[#2A2A2A]"
      )}
    >
      {/* Left accent bar on selected */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#3A9B9F]" />
      )}

      {/* Radio indicator */}
      <div
        className={cn(
          "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200",
          isSelected
            ? "border-[#3A9B9F] bg-[#3A9B9F]"
            : "border-gray-300 dark:border-[#333]"
        )}
      >
        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>

      {avatar}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[14px] font-semibold truncate",
            isSelected ? "text-[#213138] dark:text-white" : "text-gray-700 dark:text-[#A3A3A3]"
          )}>
            {title}
          </span>
          {badge}
        </div>
        <p className="text-[12px] text-gray-400 dark:text-[#525252] truncate mt-0.5">{subtitle}</p>
      </div>

      {trailing}
    </button>
  )
}

// ─── Not connected state (inline, no full page takeover) ─────────────────────
function NotConnectedState({ channel, onSetup }: { channel: string; onSetup: () => void }) {
  return (
    <div className="py-6 text-center">
      <AlertTriangle weight="bold" className="h-5 w-5 text-amber-400 mx-auto mb-3" />
      <p className="text-[13px] font-medium text-gray-700 dark:text-[#A3A3A3] mb-1">{channel} not connected</p>
      <p className="text-[12px] text-gray-400 dark:text-[#525252] mb-4 max-w-xs mx-auto">
        Connect your Meta account to manage {channel} conversations.
      </p>
      <button
        onClick={onSetup}
        className="flex items-center gap-1.5 text-[12px] font-semibold text-[#3A9B9F] hover:text-[#2F8488] transition-colors mx-auto"
      >
        <Link2 weight="bold" className="h-3.5 w-3.5" />
        Go to Integrations
        <ArrowRight weight="bold" className="h-3 w-3" />
      </button>
    </div>
  )
}

// ─── Channel panel ────────────────────────────────────────────────────────────
// Each channel is its own collapsible section card.
// The channel's platform color (blue/pink/green) appears ONLY in the icon — nowhere else.
function ChannelPanel({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  isConnected,
  isOpen,
  onToggle,
  children,
  saveButton,
}: {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  title: string
  subtitle: string
  isConnected: boolean
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  saveButton?: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl overflow-hidden hover:border-gray-300 dark:hover:border-[#2A2A2A] transition-colors duration-200">
      {/* Header toggle */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          {/* Platform icon — only place platform color lives */}
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
            <span className={iconColor}>{icon}</span>
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-[#213138] dark:text-white">{title}</h2>
            <p className="text-[12px] text-gray-400 dark:text-[#525252] mt-0.5">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isConnected && (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3A9B9F]" />
              <span className="text-[10px] font-medium uppercase tracking-widest text-[#3A9B9F]">Active</span>
            </span>
          )}
          {isOpen
            ? <ChevronUp weight="bold" className="h-4 w-4 text-gray-400 dark:text-[#525252]" />
            : <ChevronDown weight="bold" className="h-4 w-4 text-gray-400 dark:text-[#525252]" />
          }
        </div>
      </button>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 dark:border-[#1C1C1C] px-5 pb-5 pt-4 space-y-2">
              {children}
              {saveButton && <div className="flex justify-end pt-2">{saveButton}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-[#1C1C1C] p-4 flex items-center gap-3 bg-gray-50 dark:bg-[#0C0C0C]">
      <Skeleton className="h-4 w-4 rounded-full bg-slate-100 dark:bg-[#1A1A1A]" />
      <Skeleton className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-[#1A1A1A]" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-36 bg-slate-100 dark:bg-[#1A1A1A] rounded" />
        <Skeleton className="h-3 w-24 bg-slate-100 dark:bg-[#1A1A1A] rounded" />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PageSelectionPage() {
  const router = useRouter()

  const [messenger, setMessenger] = useState<ChannelState<FacebookPage>>({
    items: [], selectedId: null, loading: true, saving: false, connected: false, open: true,
  })
  const [instagram, setInstagram] = useState<ChannelState<InstagramAccount>>({
    items: [], selectedId: null, loading: true, saving: false, connected: false, open: true,
  })
  const [whatsapp, setWhatsapp] = useState<ChannelState<WhatsAppPhoneNumber>>({
    items: [], selectedId: null, loading: true, saving: false, connected: false, open: true,
  })

  useEffect(() => {
    async function init() {
      const { data: status } = await getMetaStatus()

      if (status?.messenger?.connected !== false) {
        const { data } = await fetchFacebookPages()
        const connected = data.find((p) => p.is_connected)
        setMessenger(s => ({ ...s, items: data, selectedId: connected?.id ?? null, loading: false, connected: data.length > 0 }))
      } else {
        setMessenger(s => ({ ...s, loading: false, connected: false }))
      }

      if (status?.instagram?.connected !== false) {
        const { data } = await fetchInstagramAccounts()
        const connected = data.find((a) => a.is_connected)
        setInstagram(s => ({ ...s, items: data, selectedId: connected?.id ?? null, loading: false, connected: data.length > 0 }))
      } else {
        setInstagram(s => ({ ...s, loading: false, connected: false }))
      }

      if (status?.whatsapp?.connected !== false) {
        const { data } = await fetchWhatsAppNumbers()
        const connected = data.find((n) => n.is_connected)
        setWhatsapp(s => ({ ...s, items: data, selectedId: connected?.id ?? null, loading: false, connected: data.length > 0 }))
      } else {
        setWhatsapp(s => ({ ...s, loading: false, connected: false }))
      }
    }
    init()
  }, [])

  const handleSaveMessenger = async () => {
    if (!messenger.selectedId) return
    setMessenger(s => ({ ...s, saving: true }))
    const page = messenger.items.find(p => p.id === messenger.selectedId)
    const { error } = await selectFacebookPage({ pageId: messenger.selectedId, pageName: page?.name, profilePictureUrl: page?.profile_picture_url ?? undefined })
    if (error) toast.error(error)
    else { toast.success(`Switched to "${page?.name}"`); const { data } = await fetchFacebookPages(); setMessenger(s => ({ ...s, items: data })) }
    setMessenger(s => ({ ...s, saving: false }))
  }

  const handleSaveInstagram = async () => {
    if (!instagram.selectedId) return
    setInstagram(s => ({ ...s, saving: true }))
    const account = instagram.items.find(a => a.id === instagram.selectedId)
    const { error } = await selectInstagramAccount({ accountId: instagram.selectedId, accountName: account?.name, profilePictureUrl: account?.profile_picture_url ?? undefined, username: account?.username })
    if (error) toast.error(error)
    else { toast.success(`Switched to "${account?.name}"`); const { data } = await fetchInstagramAccounts(); setInstagram(s => ({ ...s, items: data })) }
    setInstagram(s => ({ ...s, saving: false }))
  }

  const handleSaveWhatsApp = async () => {
    if (!whatsapp.selectedId) return
    setWhatsapp(s => ({ ...s, saving: true }))
    const number = whatsapp.items.find(n => n.id === whatsapp.selectedId)
    const { error } = await selectWhatsAppNumber({ phoneNumberId: whatsapp.selectedId, displayNumber: number?.display_number, verifiedName: number?.verified_name })
    if (error) toast.error(error)
    else { toast.success(`Switched to "${number?.display_number}"`); const { data } = await fetchWhatsAppNumbers(); setWhatsapp(s => ({ ...s, items: data })) }
    setWhatsapp(s => ({ ...s, saving: false }))
  }

  const goToIntegrations = () => router.push("/dashboard/settings?tab=integrations")

  const isDirty = (state: ChannelState<{ id: string; is_connected: boolean }>) =>
    state.selectedId !== null && !state.items.find(i => i.id === state.selectedId)?.is_connected

  const SaveBtn = ({ saving, onClick }: { saving: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 px-4 py-2 bg-[#3A9B9F] hover:bg-[#2F8488] disabled:opacity-50 text-white text-[13px] font-semibold rounded-lg transition-colors duration-200"
    >
      {saving ? <><Loader2 weight="bold" className="h-3.5 w-3.5 animate-spin" />Saving…</> : "Save Selection"}
    </button>
  )

  return (
    <div className="p-8 min-h-screen overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-[11px] text-gray-400 dark:text-[#525252] uppercase tracking-widest font-medium mb-1.5 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-[#3A9B9F] inline-block" />
            Channels
          </p>
          <h1 className="text-3xl font-bold text-[#213138] dark:text-white  tracking-tight">
            Connected Accounts
          </h1>
          <p className="text-[14px] text-gray-500 dark:text-[#525252] mt-2">
            Choose which account to use for each channel.
          </p>
        </motion.div>

        {/* ── Channel panels ─────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Messenger */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}>
            <ChannelPanel
              icon={<Facebook weight="bold" className="h-4 w-4" />}
              iconBg="bg-blue-50 dark:bg-blue-900/10"
              iconColor="text-blue-600 dark:text-blue-400"
              title="Facebook / Messenger"
              subtitle={
                messenger.loading ? "Loading…" :
                !messenger.connected ? "Not connected" :
                `${messenger.items.length} page${messenger.items.length !== 1 ? "s" : ""} available`
              }
              isConnected={!!messenger.items.find(p => p.is_connected)}
              isOpen={messenger.open}
              onToggle={() => setMessenger(s => ({ ...s, open: !s.open }))}
              saveButton={messenger.connected && isDirty(messenger as ChannelState<{ id: string; is_connected: boolean }>)
                ? <SaveBtn saving={messenger.saving} onClick={handleSaveMessenger} />
                : undefined
              }
            >
              {messenger.loading ? (
                <><SkeletonRow /><SkeletonRow /></>
              ) : !messenger.connected ? (
                <NotConnectedState channel="Messenger" onSetup={goToIntegrations} />
              ) : (
                messenger.items.map(page => (
                  <SelectableCard
                    key={page.id}
                    isSelected={messenger.selectedId === page.id}
                    onClick={() => setMessenger(s => ({ ...s, selectedId: page.id }))}
                    avatar={
                      <Avatar src={page.profile_picture_url} fallback={page.name} size="md"
                        className="h-10 w-10 rounded-xl border border-gray-100 dark:border-[#222] shrink-0" />
                    }
                    title={page.name}
                    subtitle={`${page.follower_count.toLocaleString()} followers · ${page.category}`}
                    badge={page.is_connected
                      ? <span className="text-[10px] font-medium text-[#3A9B9F] flex items-center gap-1"><CheckCircle weight="bold" className="h-3 w-3" />Live</span>
                      : undefined
                    }
                    trailing={<MessageCircle weight="bold" className={cn("h-4 w-4 shrink-0", messenger.selectedId === page.id ? "text-blue-400" : "text-gray-300 dark:text-[#333]")} />}
                  />
                ))
              )}
            </ChannelPanel>
          </motion.div>

          {/* Instagram */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.10 }}>
            <ChannelPanel
              icon={<Instagram weight="bold" className="h-4 w-4" />}
              iconBg="bg-pink-50 dark:bg-pink-900/10"
              iconColor="text-pink-600 dark:text-pink-400"
              title="Instagram"
              subtitle={
                instagram.loading ? "Loading…" :
                !instagram.connected ? "Not connected" :
                `${instagram.items.length} account${instagram.items.length !== 1 ? "s" : ""} available`
              }
              isConnected={!!instagram.items.find(a => a.is_connected)}
              isOpen={instagram.open}
              onToggle={() => setInstagram(s => ({ ...s, open: !s.open }))}
              saveButton={instagram.connected && isDirty(instagram as ChannelState<{ id: string; is_connected: boolean }>)
                ? <SaveBtn saving={instagram.saving} onClick={handleSaveInstagram} />
                : undefined
              }
            >
              {instagram.loading ? (
                <><SkeletonRow /><SkeletonRow /></>
              ) : !instagram.connected ? (
                <NotConnectedState channel="Instagram" onSetup={goToIntegrations} />
              ) : (
                instagram.items.map(account => (
                  <SelectableCard
                    key={account.id}
                    isSelected={instagram.selectedId === account.id}
                    onClick={() => setInstagram(s => ({ ...s, selectedId: account.id }))}
                    avatar={
                      <Avatar src={account.profile_picture_url} fallback={account.name} size="md"
                        className="h-10 w-10 rounded-xl border border-gray-100 dark:border-[#222] shrink-0" />
                    }
                    title={account.name}
                    subtitle={`@${account.username} · ${account.follower_count.toLocaleString()} followers`}
                    badge={account.is_connected
                      ? <span className="text-[10px] font-medium text-[#3A9B9F] flex items-center gap-1"><CheckCircle weight="bold" className="h-3 w-3" />Live</span>
                      : undefined
                    }
                    trailing={<Instagram weight="bold" className={cn("h-4 w-4 shrink-0", instagram.selectedId === account.id ? "text-pink-400" : "text-gray-300 dark:text-[#333]")} />}
                  />
                ))
              )}
            </ChannelPanel>
          </motion.div>

          {/* WhatsApp */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.14 }}>
            <ChannelPanel
              icon={<Phone weight="bold" className="h-4 w-4" />}
              iconBg="bg-green-50 dark:bg-green-900/10"
              iconColor="text-green-600 dark:text-green-400"
              title="WhatsApp Business"
              subtitle={
                whatsapp.loading ? "Loading…" :
                !whatsapp.connected ? "Not connected" :
                `${whatsapp.items.length} number${whatsapp.items.length !== 1 ? "s" : ""} available`
              }
              isConnected={!!whatsapp.items.find(n => n.is_connected)}
              isOpen={whatsapp.open}
              onToggle={() => setWhatsapp(s => ({ ...s, open: !s.open }))}
              saveButton={whatsapp.connected && isDirty(whatsapp as ChannelState<{ id: string; is_connected: boolean }>)
                ? <SaveBtn saving={whatsapp.saving} onClick={handleSaveWhatsApp} />
                : undefined
              }
            >
              {whatsapp.loading ? (
                <><SkeletonRow /><SkeletonRow /></>
              ) : !whatsapp.connected ? (
                <NotConnectedState channel="WhatsApp" onSetup={goToIntegrations} />
              ) : (
                whatsapp.items.map(number => (
                  <SelectableCard
                    key={number.id}
                    isSelected={whatsapp.selectedId === number.id}
                    onClick={() => setWhatsapp(s => ({ ...s, selectedId: number.id }))}
                    avatar={
                      <div className={cn(
                        "h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors duration-200",
                        whatsapp.selectedId === number.id
                          ? "bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20 text-green-600 dark:text-green-400"
                          : "bg-gray-50 dark:bg-[#111] border-gray-100 dark:border-[#1C1C1C] text-gray-400 dark:text-[#525252]"
                      )}>
                        <Phone weight="bold" className="h-4 w-4" />
                      </div>
                    }
                    title={number.display_number}
                    subtitle={number.verified_name}
                    badge={number.is_connected
                      ? <span className="text-[10px] font-medium text-[#3A9B9F] flex items-center gap-1"><CheckCircle className="h-3 w-3" />Live</span>
                      : undefined
                    }
                    trailing={
                      <div className="flex items-center gap-2">
                        <QualityDot rating={number.quality_rating} />
                        <Signal weight="bold" className={cn("h-4 w-4 shrink-0", whatsapp.selectedId === number.id ? "text-green-400" : "text-gray-300 dark:text-[#333]")} />
                      </div>
                    }
                  />
                ))
              )}
            </ChannelPanel>
          </motion.div>
        </div>

      </div>
    </div>
  )
}
