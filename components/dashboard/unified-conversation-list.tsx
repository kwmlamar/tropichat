"use client"

import { useState } from "react"
import { Search, Inbox, Shield, ArchiveX } from "lucide-react"
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
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Search + Archived toggle */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-2">
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

      {/* Channel filters (Expandable Tabs) */}
      {!showArchived && (
        <div className="px-4 py-3 border-b border-gray-100/50 flex">
          <ExpandableTabs
            tabs={channelFilters}
            activeColor={
              currentChannelFilter === "whatsapp" ? "text-[#25D366]" :
                currentChannelFilter === "instagram" ? "text-[#DD2A7B]" :
                  currentChannelFilter === "messenger" ? "text-[#0084FF]" :
                    "text-[#3A9B9F]"
            }
            className="w-full border-none shadow-none bg-gray-100/80 p-1.5 rounded-2xl"
            onChange={(index) => {
              if (index === null) {
                onChannelFilter("all");
              } else {
                onChannelFilter(channelFilters[index].value);
              }
            }}
            selectedIndex={channelFilters.findIndex(f => f.value === currentChannelFilter)}
          />
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
                        "w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all border border-transparent group relative",
                        selectedId === conversation.id
                          ? "bg-white shadow-sm ring-1 ring-gray-200/50 z-10"
                          : "hover:bg-gray-50"
                      )}
                    >
                      {/* Avatar with channel badge */}
                      <div className="relative flex-shrink-0">
                        <Avatar
                          src={conversation.customer_avatar_url}
                          fallback={getConversationDisplayName(conversation)}
                          size="md"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <ChannelIcon channel={conversation.channel_type} size="sm" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-gray-900 truncate">
                            {getConversationDisplayName(conversation)}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap uppercase tracking-wider">
                            {conversation.last_message_at
                              ? formatDistanceToNow(conversation.last_message_at)
                              : ""}
                          </span>
                        </div>

                        <p className="text-sm text-gray-500 truncate mt-0.5 leading-snug">
                          {conversation.last_message_preview || "No messages yet"}
                        </p>

                        <div className="flex items-center gap-1.5 mt-2">
                          {conversation.human_agent_enabled && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 ring-1 ring-amber-200/50">
                              <Shield className="h-2.5 w-2.5" />
                              7D ACTIVE
                            </span>
                          )}

                          {conversation.unread_count > 0 && (
                            <Badge className="bg-[#FF8B66] hover:bg-[#ff7b52] text-white border-none text-[10px] px-1.5 h-4.5 flex items-center justify-center font-black min-w-[20px] rounded-full">
                              {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
                            </Badge>
                          )}
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
