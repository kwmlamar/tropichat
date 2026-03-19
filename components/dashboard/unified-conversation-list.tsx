"use client"

import { useState } from "react"
import { Search, Inbox, Shield, ArchiveX, Bell, Plus, MoreVertical, Camera } from "lucide-react"
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
  { title: "Facebook", icon: MessengerIcon, value: "messenger" },
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
  const [isScrolled, setIsScrolled] = useState(false)

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 30)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    onSearch(e.target.value)
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#121212] lg:border-r border-gray-200 dark:border-[#2A2A2A] relative overflow-hidden">

      {/* Mobile Sticky Top Header (Fixed at the very top) */}
      <div className={cn(
        "lg:hidden fixed top-0 left-0 right-0 z-30 px-6 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2 transition-all duration-300 bg-transparent",
        isScrolled ? "bg-white/95 dark:bg-[#121212]/95 backdrop-blur-md border-b border-gray-100 dark:border-[#2A2A2A] shadow-sm" : "border-b border-transparent"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button className="h-9 w-9 flex items-center justify-center -ml-2 text-[#213138] dark:text-gray-100">
              <MoreVertical className="h-6 w-6 rotate-90" />
            </button>
          </div>
          
          <h2 className={cn(
            "text-[17px] font-bold text-[#213138] dark:text-gray-100 transition-all duration-300 transform absolute left-1/2 -translate-x-1/2",
            isScrolled ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
          )}>
            Chats
          </h2>
 
          <div className="flex items-center gap-5">
            <button className="text-[#213138] dark:text-gray-100">
              <Camera className="h-6 w-6" strokeWidth={1.5} />
            </button>
            <button className="h-8 w-8 bg-[#3A9B9F] flex items-center justify-center text-white rounded-full">
              <Plus className="h-5 w-5" strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Conversation Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto relative z-10 pt-[calc(env(safe-area-inset-top)+1rem)]" onScroll={onScroll}>
        {/* Large WhatsApp-style Sidebar Title */}
        <div className="lg:hidden px-6 pt-10 pb-4">
          <h1 className="text-[34px] font-bold text-[#213138] dark:text-gray-100 tracking-tight font-heading">Chats</h1>
        </div>

        {/* Mobile Search Bar (Directly below Title) */}
        <div className="lg:hidden px-6 pb-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-500 dark:text-gray-500" />
            <Input
              placeholder="Ask Meta AI or Search"
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-12 h-11 bg-gray-100 dark:bg-[#1F1F1F] border-transparent dark:border-transparent focus-visible:ring-0 focus:ring-0 transition-all rounded-[12px] text-[16px] dark:text-white dark:placeholder:text-gray-500 font-medium"
            />
          </div>
        </div>

        {/* Desktop Header Content (Kept hidden on mobile now as we have the scrollable one) */}
        <div className="hidden lg:flex p-4 border-b border-gray-200 dark:border-[#2A2A2A] items-center gap-2 relative z-10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9 bg-gray-100/50 dark:bg-[#262626] border-transparent dark:border-[#2A2A2A] hover:bg-gray-100 dark:hover:bg-white/5 focus:bg-white dark:focus:bg-[#121212] focus:border-gray-200 dark:focus:border-[#3A9B9F] focus:ring-0 transition-all rounded-xl dark:text-white dark:placeholder:text-gray-500"
            />
          </div>
          <button
            onClick={onToggleArchived}
            title={showArchived ? "Back to inbox" : "View archived"}
            className={cn(
              "p-2 rounded-lg transition-colors flex-shrink-0",
              showArchived
                ? "bg-[#3A9B9F]/10 text-[#3A9B9F] dark:bg-[#3A9B9F]/20"
                : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400"
            )}
          >
            <ArchiveX className="h-4 w-4" />
          </button>
        </div>

        {/* Horizontal Filter Tabs (Part of scrollable area on mobile) */}
        {!showArchived && (
          <div className="px-6 py-3 lg:border-b border-gray-100 dark:border-[#2A2A2A] flex items-center overflow-x-auto no-scrollbar gap-5">
            {channelFilters.map((filter) => {
              const isActive = currentChannelFilter === filter.value
              return (
                <button
                  key={filter.value}
                  onClick={() => onChannelFilter(filter.value)}
                  className={cn(
                    "whitespace-nowrap font-medium transition-all duration-200 relative py-1 flex items-center justify-center",
                    filter.value === "all" ? "text-[15px]" : "px-1",
                    isActive ? "text-[#3A9B9F]" : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100"
                  )}
                >
                  {filter.value === "all" ? filter.title : <filter.icon />}
                  {isActive && (
                    <motion.div
                      layoutId="active-tab"
                      className="absolute inset-0 bg-white dark:bg-[#1E1E1E] rounded-xl -z-10 shadow-[0_2px_12px_rgba(58,155,159,0.15)] border border-white/50 dark:border-[#2A2A2A]"
                      style={{ padding: '0 16px', margin: '0 -16px' }}
                    />
                  )}
                </button>
              )
            })}
            <button className="hidden lg:flex ml-auto flex-shrink-0 w-8 h-8 items-center justify-center text-gray-400 hover:text-[#3A9B9F] transition-colors rounded-full hover:bg-white/50">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Archived label (WhatsApp Style) */}
        {!loading && !searchQuery && (
          <button 
            onClick={onToggleArchived}
            className="w-full flex items-center gap-6 py-3 px-6 text-left hover:bg-gray-50 dark:hover:bg-[#1E1E1E] transition-colors group"
          >
            <div className="flex-shrink-0 w-8 flex justify-center">
              <ArchiveX className="h-5 w-5 text-gray-400 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" strokeWidth={1.5} />
            </div>
            <span className="text-[16px] font-semibold text-gray-900 dark:text-gray-200">
              {showArchived ? "Back to Chats" : "Archived"}
            </span>
            {showArchived && conversations.length > 0 && (
              <span className="ml-auto text-[14px] font-medium text-[#25D366]">
                {conversations.length}
              </span>
            )}
          </button>
        ) }

        {/* Conversation list container */}
        <div className={cn(
          "transition-all duration-300",
          loading && conversations.length > 0 ? "opacity-60 grayscale-[20%]" : "opacity-100"
        )}>
          {conversations.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center pt-20">
              <div className="rounded-full bg-gray-100 dark:bg-[#262626] p-4 mb-4">
                <Inbox className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                {showArchived ? "No archived conversations" : "No conversations"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
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
                          "w-full flex items-center gap-4 py-3.5 px-6 text-left transition-all relative border-b border-gray-100 dark:border-[#2A2A2A]/20 active:bg-gray-100 dark:active:bg-[#1F1F1F]",
                          selectedId === conversation.id ? "bg-gray-50 dark:bg-[#1E1E1E]" : "bg-white dark:bg-[#121212]"
                        )}
                      >
                      {/* Avatar with unread indicator dot like WhatsApp image */}
                      <div className="relative flex-shrink-0">
                        <Avatar
                          src={conversation.customer_avatar_url}
                          fallback={getConversationDisplayName(conversation)}
                          size="md"
                          className="h-[52px] w-[52px] rounded-full border-none"
                        />
                         <div className="absolute -bottom-0.5 -right-0.5">
                           <ChannelIcon channel={conversation.channel_type} size="sm" />
                         </div>
                      </div>
 
                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-[17px] text-[#213138] dark:text-white truncate pr-2">
                            {getConversationDisplayName(conversation)}
                          </span>
                          <span className={cn(
                            "text-[12px] font-medium whitespace-nowrap",
                            conversation.unread_count > 0 ? "text-[#25D366]" : "text-gray-400"
                          )}>
                            {conversation.last_message_at
                              ? new Date(conversation.last_message_at).toLocaleDateString() === new Date().toLocaleDateString()
                                ? new Date(conversation.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : new Date(conversation.last_message_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
                              : ""}
                          </span>
                        </div>
 
                        <div className="flex items-center justify-between">
                          <p className={cn(
                            "text-[15px] truncate leading-[1.3] pr-4",
                            conversation.unread_count > 0 ? "text-gray-900 dark:text-white font-medium" : "text-gray-500 dark:text-gray-400"
                          )}>
                            {conversation.last_message_preview || "No messages yet"}
                          </p>
 
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                             {conversation.unread_count > 0 && (
                              <div className="h-5 min-w-[20px] rounded-full bg-[#25D366] flex items-center justify-center px-1.5">
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
