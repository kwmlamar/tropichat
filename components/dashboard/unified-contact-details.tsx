"use client"

import {
  User,
  Calendar,
  MessageSquare,
  Archive,
  Hash,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ChannelIcon, getChannelLabel } from "./channel-icon"
import { formatDate, formatDistanceToNow, getConversationDisplayName } from "@/lib/utils"
import type { ConversationWithAccount, UnifiedMessage } from "@/types/unified-inbox"

interface UnifiedContactDetailsProps {
  conversation: ConversationWithAccount | null
  messageCount?: number
  onArchive?: () => void
  loading?: boolean
}

export function UnifiedContactDetails({
  conversation,
  messageCount = 0,
  onArchive,
  loading,
}: UnifiedContactDetailsProps) {
  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-black border-l border-gray-100 dark:border-[#1C1C1C] p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-[#3A9B9F]/10 flex items-center justify-center mb-4">
          <User className="h-5 w-5 text-[#3A9B9F]" />
        </div>
        <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-1">No contact selected</h3>
        <p className="text-[13px] text-gray-400 dark:text-[#525252]">
          Select a conversation to view contact details
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col items-center">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-6 w-32 mt-3" />
          <Skeleton className="h-4 w-24 mt-1" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black overflow-y-auto border-l border-gray-100 dark:border-[#1C1C1C]">
      {/* Contact Header */}
      <div className="p-6 border-b border-gray-100 dark:border-[#1C1C1C] text-center">
        <div className="relative inline-block">
          <Avatar
            src={conversation.customer_avatar_url}
            fallback={getConversationDisplayName(conversation)}
            size="xl"
            className="mx-auto"
          />
          <div className="absolute -bottom-1 -right-1">
            <ChannelIcon channel={conversation.channel_type} size="md" />
          </div>
        </div>

        <div className="mt-4">
          <h2 className="text-[16px] font-bold text-gray-900 dark:text-white font-[family-name:var(--font-poppins)] tracking-tight">
            {getConversationDisplayName(conversation)}
          </h2>
          <div className="text-[12px] text-gray-400 dark:text-[#525252] mt-1 flex items-center justify-center gap-1.5">
            <ChannelIcon channel={conversation.channel_type} size="sm" />
            {getChannelLabel(conversation.channel_type)}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-6 space-y-6">
        {/* Customer ID */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gray-100 dark:bg-[#111] p-2 flex-shrink-0">
            <Hash className="h-4 w-4 text-gray-400 dark:text-[#525252]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-gray-400 dark:text-[#525252] uppercase tracking-widest font-medium">
              {conversation.channel_type === "whatsapp"
                ? "Phone Number"
                : conversation.channel_type === "instagram"
                  ? "Instagram ID"
                  : "Messenger ID"}
            </p>
            <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">
              {conversation.customer_id}
            </p>
          </div>
        </div>

        {/* Connected Account */}
        {conversation.connected_account && (
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 dark:bg-[#111] p-2 flex-shrink-0">
              <ExternalLink className="h-4 w-4 text-gray-400 dark:text-[#525252]" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-400 dark:text-[#525252] uppercase tracking-widest font-medium">Connected Account</p>
              <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">
                {conversation.connected_account.channel_account_name || "—"}
              </p>
            </div>
          </div>
        )}

        {/* Channel badge */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" size="sm" className="capitalize">
            {conversation.channel_type}
          </Badge>
          {conversation.is_archived && (
            <Badge variant="warning" size="sm">Archived</Badge>
          )}
        </div>

        {/* Stats */}
        <div>
          <p className="text-[10px] text-gray-400 dark:text-[#525252] uppercase tracking-widest font-medium mb-3 flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-[#3A9B9F] inline-block" />Statistics</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 dark:bg-[#0C0C0C] rounded-xl border border-gray-100 dark:border-[#1C1C1C] p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="h-3 w-3 text-gray-400 dark:text-[#525252]" />
                <p className="text-[10px] text-gray-400 dark:text-[#525252] uppercase tracking-wide font-medium">First Message</p>
              </div>
              <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
                {conversation.created_at
                  ? formatDate(conversation.created_at)
                  : "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-[#0C0C0C] rounded-xl border border-gray-100 dark:border-[#1C1C1C] p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <MessageSquare className="h-3 w-3 text-gray-400 dark:text-[#525252]" />
                <p className="text-[10px] text-gray-400 dark:text-[#525252] uppercase tracking-wide font-medium">Messages</p>
              </div>
              <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
                {messageCount}
              </p>
            </div>
          </div>
          {conversation.last_message_at && (
            <p className="text-[11px] text-gray-400 dark:text-[#525252] mt-2">
              Last active {formatDistanceToNow(conversation.last_message_at)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-gray-100 dark:border-[#1C1C1C] space-y-2">
          {onArchive && (
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl border-gray-200 dark:border-[#1C1C1C]"
              size="sm"
              onClick={onArchive}
            >
              <Archive className="h-4 w-4 mr-2" />
              {conversation.is_archived ? "Unarchive conversation" : "Archive conversation"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
