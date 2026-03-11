"use client"

import { useState } from "react"
import { Search, Inbox, Shield, ArchiveX, Bell, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { ChannelIcon, channelConfig } from "./channel-icon"
import { ExpandableTabs } from "@/components/ui/expandable-tabs"
import { cn, formatDistanceToNow, getConversationDisplayName } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import type { ConversationWithAccount } from "@/types/unified-inbox"
import type { ChannelType } from "@/types/unified-inbox"

interface UnifiedConversationListProps {
  conversations: ConversationWithAccount[]
  selectedId: string | null
  onSelect: (conversation: ConversationWithAccount) => void
  loading?: boolean
  onSearch: (query: string) => void
  onChannelFilter: (channel: ChannelType | "all") => void
  currentChannelFilter: ChannelType | "all"
  showArchived: boolean
  onToggleArchived: () => void
}

// Wrapper icons for ExpandableTabs
const AllIcon = () => <Inbox className="w-5 h-5" />
const WhatsAppIcon = () => channelConfig.whatsapp.icon("w-5 h-5")
const InstagramIcon = () => channelConfig.instagram.icon("w-5 h-5")
const MessengerIcon = () => channelConfig.messenger.icon("w-5 h-5")

const channelFilters: { title: string; icon: any; value: ChannelType | "all" }[] = [
  { title: "All", icon: AllIcon, value: "all" },
  { title: "WhatsApp", icon: WhatsAppIcon, value: "whatsapp" },
  { title: "Instagram", icon: InstagramIcon, value: "instagram" },
  { title: "Messenger", icon: MessengerIcon, value: "messenger" },
]

export function UnifiedConversationList({
  conversations,
  selectedId,
  onSelect,
  loading,
  onSearch,
  onChannelFilter,
  currentChannelFilter,
  showArchived,
  onToggleArchived,
}: UnifiedConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    onSearch(e.target.value)
  }

  return (
    <div className="flex flex-col h-full bg-white lg:border-r border-gray-200 relative">
      {/* Soft teal gradient background on mobile */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#3A9B9F]/15 via-[#3A9B9F]/5 to-transparent lg:hidden pointer-events-none z-0" />

      {/* Mobile Top Header (replaces the removed hamburger nav) */}
      <div className="lg:hidden relative z-10 flex items-center justify-between px-6 pt-12 pb-6">
        <div className="w-10" /> {/* spacer to center title */}
        <h1 className="text-[22px] font-bold text-[#213138] font-heading tracking-tight">Chats</h1>
        <button className="h-10 w-10 bg-white shadow-sm flex items-center justify-center text-[#213138] border border-gray-100 rounded-[14px]">
          <Bell className="h-5 w-5 text-[#475569]" strokeWidth={2} />
        </button>
      </div>

      {/* Search on Desktop, hidden on Mobile to match clean design (or kept subtle if needed) */}
      <div className="hidden lg:flex p-4 border-b border-gray-200 items-center gap-2 relative z-10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9 bg-gray-100/50 border-transparent hover:bg-gray-100 focus:bg-white focus:border-gray-200 focus:ring-0 transition-all rounded-xl"
          />
        </div>
        <button
          onClick={onToggleArchived}
          title={showArchived ? "Back to inbox" : "View archived"}
          className={cn(
            "p-2 rounded-lg transition-colors flex-shrink-0",
            showArchived
              ? "bg-[#3A9B9F]/10 text-[#3A9B9F]"
              : "hover:bg-gray-100 text-gray-500"
          )}
        >
          <ArchiveX className="h-4 w-4" />
        </button>
      </div>

      {/* Horizontal Filter Tabs (Matches the mobile design: All, Unread, Favorite, +) */}
      {!showArchived && (
        <div className="relative z-10 px-6 py-3 lg:border-b lg:border-gray-100 flex items-center overflow-x-auto no-scrollbar gap-5">
          {/* We'll map the channel filters to look like the text tabs in the design */}
          {channelFilters.map((filter) => {
            const isActive = currentChannelFilter === filter.value
            return (
              <button
                key={filter.value}
                onClick={() => onChannelFilter(filter.value)}
                className={cn(
                  "whitespace-nowrap font-medium transition-all duration-200 relative py-1 flex items-center justify-center",
                  filter.value === "all" ? "text-[15px]" : "px-1",
                  isActive ? "text-[#3A9B9F]" : "text-gray-500 hover:text-gray-800"
                )}
              >
                {filter.value === "all" ? filter.title : <filter.icon />}
                {isActive && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-white rounded-xl -z-10 shadow-[0_2px_12px_rgba(58,155,159,0.15)] border border-white/50"
                    style={{ padding: '0 16px', margin: '0 -16px' }}
                  />
                )}
              </button>
            )
          })}
          {/* Plus button from design */}
          <button className="ml-auto flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#3A9B9F] transition-colors rounded-full hover:bg-white/50">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}


      {/* Archived label */}
      {showArchived && (
        <div className="px-5 py-3 border-b border-gray-200 flex items-center gap-2 bg-gray-50/50">
          <ArchiveX className="h-4 w-4 text-gray-500" />
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Archived conversations</span>
        </div>
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto relative">
        <div className={cn(
          "transition-all duration-300",
          loading && conversations.length > 0 ? "opacity-60 grayscale-[20%]" : "opacity-100"
        )}>
          {conversations.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center pt-20">
              <div className="rounded-full bg-gray-100 p-4 mb-4">
                <Inbox className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">
                {showArchived ? "No archived conversations" : "No conversations"}
              </h3>
              <p className="text-sm text-gray-500">
                {searchQuery
                  ? "No conversations match your search"
                  : showArchived
                    ? "Conversations you archive will appear here"
                    : "Messages from WhatsApp, Instagram, and Messenger will appear here"}
              </p>
            </div>
          ) : conversations.length === 0 && loading ? (
            <div className="p-2 space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-transparent">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              <AnimatePresence initial={false} mode="popLayout">
                {conversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -5 }}
                    transition={{
                      opacity: { duration: 0.2 },
                      layout: { type: "spring", bounce: 0, duration: 0.4 }
                    }}
                  >
                    <button
                      onClick={() => onSelect(conversation)}
                      className={cn(
                        "w-full flex items-center gap-4 py-3.5 px-6 rounded-3xl text-left transition-all border border-transparent group relative bg-white/40 hover:bg-white/80",
                        selectedId === conversation.id
                          ? "bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] ring-1 ring-white/50 z-10"
                          : ""
                      )}
                    >
                      {/* Avatar with online dot / channel badge */}
                      <div className="relative flex-shrink-0">
                        <Avatar
                          src={conversation.customer_avatar_url}
                          fallback={getConversationDisplayName(conversation)}
                          size="md"
                          className="h-14 w-14 rounded-full border-2 border-white shadow-sm"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <ChannelIcon channel={conversation.channel_type} size="sm" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 py-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-[16px] text-[#213138] truncate tracking-tight pr-2">
                            {getConversationDisplayName(conversation)}
                          </span>
                          <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">
                            {conversation.last_message_at
                              ? new Date(conversation.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : ""}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-[14px] text-gray-500 truncate leading-snug pr-4">
                            {conversation.last_message_preview || "No messages yet"}
                          </p>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {conversation.human_agent_enabled && (
                              <span className="inline-flex items-center justify-center p-1 rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200/50" title="Human Agent 7D Active">
                                <Shield className="h-3 w-3" />
                              </span>
                            )}

                            {conversation.unread_count > 0 && (
                              <div className="h-5 min-w-[20px] rounded-full bg-[#3A9B9F] flex items-center justify-center px-1.5 shadow-[0_2px_8px_rgba(58,155,159,0.4)]">
                                <span className="text-[11px] font-bold text-white leading-none">
                                  {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
