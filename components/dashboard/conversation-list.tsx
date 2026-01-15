"use client"

import { useState } from "react"
import { Search, Filter, MoreVertical } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "@/lib/utils"
import type { ConversationWithContact, ConversationStatus } from "@/types/database"

interface ConversationListProps {
  conversations: ConversationWithContact[]
  selectedId: string | null
  onSelect: (conversation: ConversationWithContact) => void
  loading?: boolean
  onSearch: (query: string) => void
  onFilterChange: (status: string) => void
  currentFilter: string
}

const statusFilters = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
]

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  loading,
  onSearch,
  onFilterChange,
  currentFilter,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    onSearch(e.target.value)
  }

  const getStatusColor = (status: ConversationStatus) => {
    switch (status) {
      case "open":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "resolved":
        return "bg-gray-400"
      default:
        return "bg-gray-400"
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="p-2 space-y-2">
          {[...Array(5)].map((_, i) => (
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

      {/* Filters */}
      <div className="px-4 py-2 border-b border-gray-200 flex gap-2 overflow-x-auto">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors",
              currentFilter === filter.value
                ? "bg-[#25D366]/10 text-[#25D366]"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">No conversations</h3>
            <p className="text-sm text-gray-500">
              {searchQuery
                ? "No conversations match your search"
                : "Start a conversation to see it here"}
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
                    ? "bg-[#25D366]/10"
                    : "hover:bg-gray-50"
                )}
              >
                <div className="relative flex-shrink-0">
                  <Avatar
                    fallback={conversation.contact?.name || conversation.contact?.phone_number || "?"}
                    size="md"
                  />
                  <span
                    className={cn(
                      "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
                      getStatusColor(conversation.status)
                    )}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {conversation.contact?.name || conversation.contact?.phone_number || "Unknown"}
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

                  <div className="flex items-center gap-2 mt-1.5">
                    {conversation.unread_count > 0 && (
                      <Badge variant="success" size="sm">
                        {conversation.unread_count}
                      </Badge>
                    )}
                    {conversation.contact?.tags?.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
