"use client"

import { useState } from "react"
import { Search, Inbox } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { ChannelIcon } from "./channel-icon"
import { cn, formatDistanceToNow } from "@/lib/utils"
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
}

const channelFilters: { value: ChannelType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "messenger", label: "Messenger" },
]

export function UnifiedConversationList({
  conversations,
  selectedId,
  onSelect,
  loading,
  onSearch,
  onChannelFilter,
  currentChannelFilter,
}: UnifiedConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    onSearch(e.target.value)
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="p-2 space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9 bg-gray-50 border-gray-200"
          />
        </div>
      </div>

      {/* Channel filters */}
      <div className="px-4 py-2 border-b border-gray-200 flex gap-1.5 overflow-x-auto">
        {channelFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onChannelFilter(filter.value)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5",
              currentChannelFilter === filter.value
                ? "bg-[#3A9B9F]/10 text-[#3A9B9F]"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            {filter.value !== "all" && (
              <ChannelIcon channel={filter.value} size="sm" />
            )}
            {filter.value === "all" ? filter.label : ""}
          </button>
        ))}
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <Inbox className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">No conversations</h3>
            <p className="text-sm text-gray-500">
              {searchQuery
                ? "No conversations match your search"
                : "Messages from WhatsApp, Instagram, and Messenger will appear here"}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => onSelect(conversation)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                  selectedId === conversation.id
                    ? "bg-[#3A9B9F]/10"
                    : "hover:bg-gray-50"
                )}
              >
                {/* Avatar with channel badge */}
                <div className="relative flex-shrink-0">
                  <Avatar
                    src={conversation.customer_avatar_url}
                    fallback={conversation.customer_name || conversation.customer_id}
                    size="md"
                  />
                  {/* Channel indicator overlaid on avatar */}
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <ChannelIcon channel={conversation.channel_type} size="sm" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {conversation.customer_name || conversation.customer_id}
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {conversation.last_message_at
                        ? formatDistanceToNow(conversation.last_message_at)
                        : ""}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 truncate mt-0.5">
                    {conversation.last_message_preview || "No messages yet"}
                  </p>

                  {/* Unread badge */}
                  {conversation.unread_count > 0 && (
                    <div className="mt-1.5">
                      <Badge variant="success" size="sm">
                        {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
                      </Badge>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
