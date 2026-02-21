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
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-8 text-center">
        <div className="rounded-full bg-gray-100 p-4 mb-4">
          <User className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="font-medium text-gray-900 mb-1">No contact selected</h3>
        <p className="text-sm text-gray-500">
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
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      {/* Contact Header */}
      <div className="p-6 border-b border-gray-200 text-center">
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
          <h2 className="text-lg font-semibold text-gray-900">
            {getConversationDisplayName(conversation)}
          </h2>
          <div className="text-sm text-gray-500 mt-0.5 flex items-center justify-center gap-1.5">
            <ChannelIcon channel={conversation.channel_type} size="sm" />
            {getChannelLabel(conversation.channel_type)}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-6 space-y-6">
        {/* Customer ID */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gray-100 p-2">
            <Hash className="h-4 w-4 text-gray-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500">
              {conversation.channel_type === "whatsapp"
                ? "Phone Number"
                : conversation.channel_type === "instagram"
                  ? "Instagram ID"
                  : "Messenger ID"}
            </p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {conversation.customer_id}
            </p>
          </div>
        </div>

        {/* Connected Account */}
        {conversation.connected_account && (
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <ExternalLink className="h-4 w-4 text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Connected Account</p>
              <p className="text-sm font-medium text-gray-900 truncate">
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
          <p className="text-xs font-medium text-gray-500 uppercase mb-3">Statistics</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-3 w-3 text-gray-400" />
                <p className="text-xs text-gray-500">First Message</p>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {conversation.created_at
                  ? formatDate(conversation.created_at)
                  : "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-3 w-3 text-gray-400" />
                <p className="text-xs text-gray-500">Messages</p>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {messageCount}
              </p>
            </div>
          </div>
          {conversation.last_message_at && (
            <p className="text-xs text-gray-400 mt-2">
              Last active {formatDistanceToNow(conversation.last_message_at)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-gray-200 space-y-2">
          {onArchive && (
            <Button
              variant="outline"
              className="w-full justify-start"
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
