"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle,
  Loader2,
  Users,
  Link2,
  AlertTriangle,
  Facebook,
  ArrowRight,
  Phone,
  Signal,
  Instagram,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

function QualityDot({ rating }: { rating: string | null }) {
  const color =
    rating === "GREEN"
      ? "bg-teal-500"
      : rating === "YELLOW"
      ? "bg-amber-400"
      : rating === "RED"
      ? "bg-red-500"
      : "bg-gray-300 dark:bg-gray-600"
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} title={rating || "Unknown"} />
}

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
    <motion.button
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={cn(
        "w-full group text-left rounded-[24px] border-2 transition-all p-5 relative overflow-hidden",
        isSelected
          ? "border-[#3A9B9F] bg-white dark:bg-[#0A0A0A] shadow-[0_8px_32px_rgba(58,155,159,0.10)] ring-1 ring-[#3A9B9F]"
          : "border-gray-100 dark:border-[#222222] bg-white/50 dark:bg-[#0A0A0A]/50 backdrop-blur-sm hover:border-gray-200 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-[#111111] dark:hover:shadow-none"
      )}
    >
      {/* Selected left accent bar */}
      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#3A9B9F] rounded-l-[22px]" />}

      <div className="flex items-center gap-4 relative z-10">
        {/* Radio dot */}
        <div
          className={cn(
            "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
            isSelected
              ? "border-[#3A9B9F] bg-[#3A9B9F]"
              : "border-gray-200 dark:border-gray-700 group-hover:border-[#3A9B9F]/50"
          )}
        >
          {isSelected && <CheckCircle className="h-3.5 w-3.5 text-white" />}
        </div>

        {/* Avatar */}
        {avatar}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn("text-base font-bold truncate transition-colors",
              isSelected ? "text-[#213138] dark:text-white" : "text-gray-700 dark:text-gray-300"
            )}>
              {title}
            </span>
            {badge}
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 truncate">{subtitle}</p>
        </div>

        {/* Trailing element */}
        {trailing}
      </div>
    </motion.button>
  )
}

function NotConnectedState({ channel, onSetup }: { channel: string; onSetup: () => void }) {
  return (
    <div className="py-8 text-center flex flex-col items-center gap-4">
      <div className="h-14 w-14 rounded-2xl bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-[#222222] flex items-center justify-center">
        <AlertTriangle className="h-6 w-6 text-amber-400" />
      </div>
      <div>
        <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">{channel} not connected</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs mx-auto">
          Connect your Meta account to manage {channel} conversations.
        </p>
      </div>
      <Button
        variant="outline"
        onClick={onSetup}
        className="h-10 px-5 rounded-xl border-gray-200 dark:border-[#222222] bg-white dark:bg-transparent text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-[#111111] text-sm"
      >
        <Link2 className="h-4 w-4 mr-2" />
        Go to Integrations
        <ArrowRight className="h-3.5 w-3.5 ml-2" />
      </Button>
    </div>
  )
}

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
      // Get overall connection status first
      const { data: status } = await getMetaStatus()

      // Load Messenger/Facebook pages
      if (status?.messenger?.connected !== false) {
        const { data } = await fetchFacebookPages()
        const connectedPage = data.find((p) => p.is_connected)
        setMessenger((s) => ({
          ...s,
          items: data,
          selectedId: connectedPage?.id ?? null,
          loading: false,
          connected: data.length > 0,
        }))
      } else {
        setMessenger((s) => ({ ...s, loading: false, connected: false }))
      }

      // Load Instagram accounts
      if (status?.instagram?.connected !== false) {
        const { data } = await fetchInstagramAccounts()
        const connectedAccount = data.find((a) => a.is_connected)
        setInstagram((s) => ({
          ...s,
          items: data,
          selectedId: connectedAccount?.id ?? null,
          loading: false,
          connected: data.length > 0,
        }))
      } else {
        setInstagram((s) => ({ ...s, loading: false, connected: false }))
      }

      // Load WhatsApp numbers
      if (status?.whatsapp?.connected !== false) {
        const { data } = await fetchWhatsAppNumbers()
        const connectedNumber = data.find((n) => n.is_connected)
        setWhatsapp((s) => ({
          ...s,
          items: data,
          selectedId: connectedNumber?.id ?? null,
          loading: false,
          connected: data.length > 0,
        }))
      } else {
        setWhatsapp((s) => ({ ...s, loading: false, connected: false }))
      }
    }

    init()
  }, [])

  const handleSaveMessenger = async () => {
    if (!messenger.selectedId) return
    setMessenger((s) => ({ ...s, saving: true }))
    const page = messenger.items.find((p) => p.id === messenger.selectedId)
    const { error } = await selectFacebookPage({
      pageId: messenger.selectedId,
      pageName: page?.name,
      profilePictureUrl: page?.profile_picture_url ?? undefined,
    })
    if (error) toast.error(error)
    else {
      toast.success(`Messenger switched to "${page?.name}"`)
      const { data } = await fetchFacebookPages()
      setMessenger((s) => ({ ...s, items: data, saving: false }))
      return
    }
    setMessenger((s) => ({ ...s, saving: false }))
  }

  const handleSaveInstagram = async () => {
    if (!instagram.selectedId) return
    setInstagram((s) => ({ ...s, saving: true }))
    const account = instagram.items.find((a) => a.id === instagram.selectedId)
    const { error } = await selectInstagramAccount({
      accountId: instagram.selectedId,
      accountName: account?.name,
      profilePictureUrl: account?.profile_picture_url ?? undefined,
      username: account?.username,
    })
    if (error) toast.error(error)
    else {
      toast.success(`Instagram switched to "${account?.name}"`)
      const { data } = await fetchInstagramAccounts()
      setInstagram((s) => ({ ...s, items: data, saving: false }))
      return
    }
    setInstagram((s) => ({ ...s, saving: false }))
  }

  const handleSaveWhatsApp = async () => {
    if (!whatsapp.selectedId) return
    setWhatsapp((s) => ({ ...s, saving: true }))
    const number = whatsapp.items.find((n) => n.id === whatsapp.selectedId)
    const { error } = await selectWhatsAppNumber({
      phoneNumberId: whatsapp.selectedId,
      displayNumber: number?.display_number,
      verifiedName: number?.verified_name,
    })
    if (error) toast.error(error)
    else {
      toast.success(`WhatsApp switched to "${number?.display_number}"`)
      const { data } = await fetchWhatsAppNumbers()
      setWhatsapp((s) => ({ ...s, items: data, saving: false }))
      return
    }
    setWhatsapp((s) => ({ ...s, saving: false }))
  }

  const goToIntegrations = () => router.push("/dashboard/settings?tab=integrations")

  const channelHasDirtySelection = (state: ChannelState<{ id: string; is_connected: boolean }>) =>
    state.selectedId !== null && !state.items.find((i) => i.id === state.selectedId)?.is_connected

  const SkeletonCard = () => (
    <div className="rounded-[24px] border border-gray-100 dark:border-[#222222] p-5 flex items-center gap-4 bg-white/50 dark:bg-[#0A0A0A]/50">
      <Skeleton className="h-5 w-5 rounded-full" />
      <Skeleton className="h-12 w-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2 rounded" />
        <Skeleton className="h-3 w-1/3 rounded" />
      </div>
    </div>
  )

  return (
    <div className="relative min-h-full p-6 md:p-8 overflow-y-auto bg-white dark:bg-black">
      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[5%] right-[5%] w-[600px] h-[600px] bg-[#3A9B9F]/5 dark:bg-[#3A9B9F]/2 blur-[150px] rounded-full" />
        <div className="absolute bottom-[5%] left-[5%] w-[600px] h-[600px] bg-[#FF8B66]/5 dark:bg-[#FF8B66]/2 blur-[150px] rounded-full" />
      </div>

      <div className="w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-3xl font-extrabold text-[#213138] dark:text-gray-100 tracking-tight font-[family-name:var(--font-poppins)]">
            Connected Accounts
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base mt-2 max-w-xl">
            Choose which account to use for each channel. Switch seamlessly between multiple pages, profiles, or numbers.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
          {/* ─── MESSENGER ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-[28px] border border-gray-100 dark:border-[#222222] bg-white/60 dark:bg-[#0A0A0A]/60 backdrop-blur-sm overflow-hidden"
          >
            {/* Section Header */}
            <button
              onClick={() => setMessenger((s) => ({ ...s, open: !s.open }))}
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400">
                  <Facebook className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h2 className="text-base font-bold text-[#213138] dark:text-gray-100">Facebook / Messenger</h2>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    {messenger.loading ? "Loading..." : messenger.items.length === 0 ? "Not connected" : `${messenger.items.length} page${messenger.items.length !== 1 ? "s" : ""} available`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {messenger.items.find((p) => p.is_connected) && (
                  <Badge className="bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-900/50 text-xs font-bold gap-1.5 px-2.5 py-1 rounded-full">
                    <CheckCircle className="h-3 w-3" /> Active
                  </Badge>
                )}
                {messenger.open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </div>
            </button>

            <AnimatePresence initial={false}>
              {messenger.open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 space-y-3">
                    <div className="h-px bg-gray-100 dark:bg-[#222222] mb-4" />
                    {messenger.loading ? (
                      <><SkeletonCard /><SkeletonCard /></>
                    ) : !messenger.connected ? (
                      <NotConnectedState channel="Messenger" onSetup={goToIntegrations} />
                    ) : (
                      messenger.items.map((page) => (
                        <SelectableCard
                          key={page.id}
                          isSelected={messenger.selectedId === page.id}
                          onClick={() => setMessenger((s) => ({ ...s, selectedId: page.id }))}
                          avatar={
                            <Avatar src={page.profile_picture_url} fallback={page.name} size="md"
                              className="h-12 w-12 border-2 border-white dark:border-[#0A0A0A] ring-1 ring-gray-100 dark:ring-[#222222] rounded-xl" />
                          }
                          title={page.name}
                          subtitle={`${page.follower_count.toLocaleString()} followers · ${page.category}`}
                          badge={page.is_connected ? (
                            <Badge className="bg-teal-50 dark:bg-teal-900/10 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/30 text-[10px] font-bold px-2 py-0.5 rounded-full gap-1">
                              <CheckCircle className="h-2.5 w-2.5" /> Live
                            </Badge>
                          ) : undefined}
                          trailing={
                            <div className={cn("p-2.5 rounded-xl transition-all", messenger.selectedId === page.id ? "bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400" : "bg-gray-50 dark:bg-[#333] text-gray-300 dark:text-gray-600")}>
                              <MessageCircle className="h-5 w-5" />
                            </div>
                          }
                        />
                      ))
                    )}

                    {messenger.connected && channelHasDirtySelection(messenger as ChannelState<{ id: string; is_connected: boolean }>) && (
                      <div className="flex justify-end pt-2">
                        <Button onClick={handleSaveMessenger} disabled={messenger.saving}
                          className="h-10 px-6 bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 border-none">
                          {messenger.saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Selection"}
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ─── INSTAGRAM ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-[28px] border border-gray-100 dark:border-[#222222] bg-white/60 dark:bg-[#0A0A0A]/60 backdrop-blur-sm overflow-hidden"
          >
            <button
              onClick={() => setInstagram((s) => ({ ...s, open: !s.open }))}
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-pink-50 dark:bg-pink-900/10 text-pink-600 dark:text-pink-400">
                  <Instagram className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h2 className="text-base font-bold text-[#213138] dark:text-gray-100">Instagram</h2>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    {instagram.loading ? "Loading..." : instagram.items.length === 0 ? "Not connected" : `${instagram.items.length} account${instagram.items.length !== 1 ? "s" : ""} available`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {instagram.items.find((a) => a.is_connected) && (
                  <Badge className="bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-900/50 text-xs font-bold gap-1.5 px-2.5 py-1 rounded-full">
                    <CheckCircle className="h-3 w-3" /> Active
                  </Badge>
                )}
                {instagram.open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </div>
            </button>

            <AnimatePresence initial={false}>
              {instagram.open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 space-y-3">
                    <div className="h-px bg-gray-100 dark:bg-[#222222] mb-4" />
                    {instagram.loading ? (
                      <><SkeletonCard /><SkeletonCard /></>
                    ) : !instagram.connected ? (
                      <NotConnectedState channel="Instagram" onSetup={goToIntegrations} />
                    ) : (
                      instagram.items.map((account) => (
                        <SelectableCard
                          key={account.id}
                          isSelected={instagram.selectedId === account.id}
                          onClick={() => setInstagram((s) => ({ ...s, selectedId: account.id }))}
                          avatar={
                            <Avatar src={account.profile_picture_url} fallback={account.name} size="md"
                              className="h-12 w-12 border-2 border-white dark:border-[#0A0A0A] ring-1 ring-gray-100 dark:ring-[#222222] rounded-xl" />
                          }
                          title={account.name}
                          subtitle={`${account.username} · ${account.follower_count.toLocaleString()} followers`}
                          badge={account.is_connected ? (
                            <Badge className="bg-teal-50 dark:bg-teal-900/10 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/30 text-[10px] font-bold px-2 py-0.5 rounded-full gap-1">
                              <CheckCircle className="h-2.5 w-2.5" /> Live
                            </Badge>
                          ) : undefined}
                          trailing={
                            <div className={cn("p-2.5 rounded-xl transition-all", instagram.selectedId === account.id ? "bg-pink-50 dark:bg-pink-900/20 text-pink-500 dark:text-pink-400" : "bg-gray-50 dark:bg-[#333] text-gray-300 dark:text-gray-600")}>
                              <Instagram className="h-5 w-5" />
                            </div>
                          }
                        />
                      ))
                    )}

                    {instagram.connected && channelHasDirtySelection(instagram as ChannelState<{ id: string; is_connected: boolean }>) && (
                      <div className="flex justify-end pt-2">
                        <Button onClick={handleSaveInstagram} disabled={instagram.saving}
                          className="h-10 px-6 bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 border-none">
                          {instagram.saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Selection"}
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ─── WHATSAPP ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-[28px] border border-gray-100 dark:border-[#222222] bg-white/60 dark:bg-[#0A0A0A]/60 backdrop-blur-sm overflow-hidden"
          >
            <button
              onClick={() => setWhatsapp((s) => ({ ...s, open: !s.open }))}
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h2 className="text-base font-bold text-[#213138] dark:text-gray-100">WhatsApp Business</h2>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    {whatsapp.loading ? "Loading..." : whatsapp.items.length === 0 ? "Not connected" : `${whatsapp.items.length} number${whatsapp.items.length !== 1 ? "s" : ""} available`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {whatsapp.items.find((n) => n.is_connected) && (
                  <Badge className="bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-900/50 text-xs font-bold gap-1.5 px-2.5 py-1 rounded-full">
                    <CheckCircle className="h-3 w-3" /> Active
                  </Badge>
                )}
                {whatsapp.open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </div>
            </button>

            <AnimatePresence initial={false}>
              {whatsapp.open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 space-y-3">
                    <div className="h-px bg-gray-100 dark:bg-[#222222] mb-4" />
                    {whatsapp.loading ? (
                      <><SkeletonCard /><SkeletonCard /></>
                    ) : !whatsapp.connected ? (
                      <NotConnectedState channel="WhatsApp" onSetup={goToIntegrations} />
                    ) : (
                      whatsapp.items.map((number) => (
                        <SelectableCard
                          key={number.id}
                          isSelected={whatsapp.selectedId === number.id}
                          onClick={() => setWhatsapp((s) => ({ ...s, selectedId: number.id }))}
                          avatar={
                            <div className={cn(
                              "h-12 w-12 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all",
                              whatsapp.selectedId === number.id
                                ? "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 text-green-600 dark:text-green-400"
                                : "bg-gray-50 dark:bg-[#111111] border-gray-100 dark:border-[#222222] text-gray-400 dark:text-gray-500"
                            )}>
                              <Phone className="h-5 w-5" />
                            </div>
                          }
                          title={number.display_number}
                          subtitle={number.verified_name}
                          badge={number.is_connected ? (
                            <Badge className="bg-teal-50 dark:bg-teal-900/10 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/30 text-[10px] font-bold px-2 py-0.5 rounded-full gap-1">
                              <CheckCircle className="h-2.5 w-2.5" /> Live
                            </Badge>
                          ) : undefined}
                          trailing={
                            <div className="flex items-center gap-2">
                              <QualityDot rating={number.quality_rating} />
                              <div className={cn("p-2.5 rounded-xl transition-all", whatsapp.selectedId === number.id ? "bg-green-50 dark:bg-green-900/20 text-green-500 dark:text-green-400" : "bg-gray-50 dark:bg-[#333] text-gray-300 dark:text-gray-600")}>
                                <Signal className="h-5 w-5" />
                              </div>
                            </div>
                          }
                        />
                      ))
                    )}

                    {whatsapp.connected && channelHasDirtySelection(whatsapp as ChannelState<{ id: string; is_connected: boolean }>) && (
                      <div className="flex justify-end pt-2">
                        <Button onClick={handleSaveWhatsApp} disabled={whatsapp.saving}
                          className="h-10 px-6 bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 border-none">
                          {whatsapp.saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Selection"}
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
