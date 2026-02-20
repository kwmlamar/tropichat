"use client"

import { useState, useRef, useEffect } from "react"
import {
  Send,
  Paperclip,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Archive,
  UserCog,
  Shield,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown"
import { SkeletonMessage } from "@/components/ui/skeleton"
import { ChannelIcon, getChannelLabel } from "./channel-icon"
import { cn, formatMessageTime, formatDateDivider } from "@/lib/utils"
import type { UnifiedMessage, ConversationWithAccount, MessageDeliveryStatus } from "@/types/unified-inbox"

interface UnifiedMessageThreadProps {
  conversation: ConversationWithAccount | null
  messages: UnifiedMessage[]
  loading?: boolean
  onSendMessage: (message: string) => void
  onArchive?: () => void
  onLoadMore?: () => void
  hasMore?: boolean
  onToggleHumanAgent?: (enabled: boolean, reason?: string) => void
}

/** Calculate days remaining from a marked-at timestamp (7-day window) */
function getDaysRemaining(markedAt: string | null): number | null {
  if (!markedAt) return null
  const marked = new Date(markedAt)
  const deadline = new Date(marked.getTime() + 7 * 24 * 60 * 60 * 1000)
  const now = new Date()
  const remaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, remaining)
}

export function UnifiedMessageThread({
  conversation,
  messages,
  loading,
  onSendMessage,
  onArchive,
  onLoadMore,
  hasMore,
  onToggleHumanAgent,
}: UnifiedMessageThreadProps) {
  const [messageText, setMessageText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [showHumanAgentPanel, setShowHumanAgentPanel] = useState(false)
  const [humanAgentReason, setHumanAgentReason] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Sync reason state when conversation changes
  useEffect(() => {
    setHumanAgentReason(conversation?.human_agent_reason || "")
    setShowHumanAgentPanel(false)
  }, [conversation?.id])

  const handleSend = async () => {
    if (!messageText.trim() || isSending) return
    setIsSending(true)
    await onSendMessage(messageText.trim())
    setMessageText("")
    setIsSending(false)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleEnableHumanAgent = () => {
    onToggleHumanAgent?.(true, humanAgentReason || undefined)
    setShowHumanAgentPanel(false)
  }

  const handleDisableHumanAgent = () => {
    onToggleHumanAgent?.(false)
    setHumanAgentReason("")
    setShowHumanAgentPanel(false)
  }

  const getStatusIcon = (status: MessageDeliveryStatus) => {
    switch (status) {
      case "sending":
        return <Clock className="h-3 w-3 text-gray-400" />
      case "sent":
        return <Check className="h-3 w-3 text-gray-400" />
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-gray-400" />
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      case "failed":
        return <AlertCircle className="h-3 w-3 text-red-500" />
      default:
        return null
    }
  }

  // Group messages by date
  const groupedMessages = messages.reduce<{ date: string; messages: UnifiedMessage[] }[]>(
    (groups, message) => {
      const date = new Date(message.sent_at).toDateString()
      const lastGroup = groups[groups.length - 1]
      if (lastGroup && lastGroup.date === date) {
        lastGroup.messages.push(message)
      } else {
        groups.push({ date, messages: [message] })
      }
      return groups
    },
    []
  )

  // Empty state
  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-8 text-center">
        <div className="rounded-full bg-gray-100 p-6 mb-4">
          <FileText className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Select a conversation from the list to view messages and start chatting
        </p>
      </div>
    )
  }

  const isHumanAgentEnabled = conversation.human_agent_enabled
  const daysRemaining = getDaysRemaining(conversation.human_agent_marked_at)

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar
              src={conversation.customer_avatar_url}
              fallback={conversation.customer_name || conversation.customer_id}
              size="md"
            />
            <div className="absolute -bottom-0.5 -right-0.5">
              <ChannelIcon channel={conversation.channel_type} size="sm" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">
                {conversation.customer_name || conversation.customer_id}
              </h2>
              {isHumanAgentEnabled && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  <Shield className="h-3 w-3" />
                  Human Agent
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <ChannelIcon channel={conversation.channel_type} size="sm" />
              <span>{getChannelLabel(conversation.channel_type)}</span>
              {conversation.connected_account && (
                <>
                  <span className="text-gray-300">·</span>
                  <span>{conversation.connected_account.channel_account_name || "Connected"}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Human Agent Toggle Button */}
          <button
            onClick={() => setShowHumanAgentPanel(!showHumanAgentPanel)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isHumanAgentEnabled
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                : "hover:bg-gray-100 text-gray-500"
            )}
            title={isHumanAgentEnabled ? "Human Agent mode active" : "Enable Human Agent mode (7-day window)"}
          >
            <UserCog className="h-5 w-5" />
          </button>

          <Dropdown
            align="right"
            trigger={
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <MoreVertical className="h-5 w-5 text-gray-500" />
              </button>
            }
          >
            {onArchive && (
              <DropdownItem
                icon={<Archive className="h-4 w-4" />}
                onClick={onArchive}
              >
                {conversation.is_archived ? "Unarchive conversation" : "Archive conversation"}
              </DropdownItem>
            )}
            <DropdownSeparator />
            <DropdownItem destructive>Block customer</DropdownItem>
          </Dropdown>
        </div>
      </div>

      {/* Human Agent Banner - shown when enabled */}
      {isHumanAgentEnabled && (
        <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-100 p-1.5">
              <Shield className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-900">
                Human Agent Mode — {daysRemaining !== null ? `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining` : "7-day window"}
              </p>
              {conversation.human_agent_reason && (
                <p className="text-xs text-amber-700 mt-0.5">
                  Reason: {conversation.human_agent_reason}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleDisableHumanAgent}
            className="text-amber-700 hover:text-amber-900 p-1 rounded-lg hover:bg-amber-100 transition-colors"
            title="Disable Human Agent mode"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Human Agent Setup Panel - shown when toggling */}
      {showHumanAgentPanel && !isHumanAgentEnabled && (
        <div className="px-6 py-4 bg-amber-50 border-b border-amber-200">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-amber-100 p-2 mt-0.5">
              <UserCog className="h-5 w-5 text-amber-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900">Enable Human Agent Response</h3>
              <p className="text-xs text-amber-700 mt-1">
                Extends your response window from 24 hours to 7 days. Use this for complex inquiries that need more time to resolve.
              </p>
              <div className="mt-3">
                <Input
                  placeholder="Reason (optional) — e.g., Need to coordinate with caterer"
                  value={humanAgentReason}
                  onChange={(e) => setHumanAgentReason(e.target.value)}
                  className="bg-white border-amber-300 text-sm placeholder:text-amber-400"
                />
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={handleEnableHumanAgent}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-sm h-8 px-4"
                >
                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                  Enable Human Agent Mode
                </Button>
                <Button
                  onClick={() => setShowHumanAgentPanel(false)}
                  variant="outline"
                  className="text-sm h-8 px-4 border-amber-300 text-amber-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="space-y-4">
            <SkeletonMessage direction="inbound" />
            <SkeletonMessage direction="outbound" />
            <SkeletonMessage direction="inbound" />
            <SkeletonMessage direction="outbound" />
          </div>
        ) : (
          <>
            {/* Load more */}
            {hasMore && (
              <div className="text-center mb-4">
                <button
                  onClick={onLoadMore}
                  className="text-sm text-[#3A9B9F] hover:underline"
                >
                  Load earlier messages
                </button>
              </div>
            )}

            {/* Messages grouped by date */}
            {groupedMessages.map((group) => (
              <div key={group.date}>
                <div className="flex items-center justify-center my-4">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
                    {formatDateDivider(group.date)}
                  </span>
                </div>

                <div className="space-y-3">
                  {group.messages.map((message) => {
                    const isOutbound = message.sender_type === "business"
                    const mediaUrl = message.metadata?.media_url as string | undefined
                    const mediaMime = message.metadata?.media_mime_type as string | undefined
                    const hasHumanAgentTag = message.metadata?.human_agent_tag === true

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          isOutbound ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2",
                            isOutbound
                              ? hasHumanAgentTag
                                ? "bg-amber-600 text-white rounded-br-md"
                                : "bg-[#3A9B9F] text-white rounded-br-md"
                              : "bg-gray-100 text-gray-900 rounded-bl-md"
                          )}
                        >
                          {/* Human Agent tag indicator on message */}
                          {hasHumanAgentTag && isOutbound && (
                            <div className="flex items-center gap-1 mb-1 text-xs text-amber-200">
                              <Shield className="h-3 w-3" />
                              <span>Human Agent</span>
                            </div>
                          )}

                          {/* Media preview */}
                          {mediaUrl && (
                            <div className="mb-2">
                              {mediaMime?.startsWith("image/") ||
                              message.message_type === "image" ? (
                                <img
                                  src={mediaUrl}
                                  alt="Media"
                                  className="rounded-lg max-w-full"
                                />
                              ) : (
                                <a
                                  href={mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm underline"
                                >
                                  <Paperclip className="h-4 w-4" />
                                  {message.message_type === "video"
                                    ? "Video"
                                    : message.message_type === "audio"
                                      ? "Audio"
                                      : "Attachment"}
                                </a>
                              )}
                            </div>
                          )}

                          {/* Sticker / location indicators */}
                          {message.message_type === "sticker" && !mediaUrl && (
                            <div className="mb-1">
                              <ImageIcon className="h-8 w-8 opacity-60" />
                            </div>
                          )}

                          {message.message_type === "location" && (
                            <div className="mb-1 text-sm opacity-80">
                              📍 {message.metadata?.location_name || "Location"}
                            </div>
                          )}

                          {/* Message content */}
                          {message.content && (
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          )}

                          {/* Failed indicator */}
                          {message.status === "failed" && message.error_message && (
                            <p
                              className={cn(
                                "text-xs mt-1",
                                isOutbound ? "text-red-200" : "text-red-500"
                              )}
                            >
                              ⚠ {message.error_message}
                            </p>
                          )}

                          {/* Footer: time + status */}
                          <div
                            className={cn(
                              "flex items-center gap-1 mt-1 text-xs",
                              isOutbound
                                ? hasHumanAgentTag
                                  ? "text-amber-200 justify-end"
                                  : "text-white/70 justify-end"
                                : "text-gray-500"
                            )}
                          >
                            <span>{formatMessageTime(message.sent_at)}</span>
                            {isOutbound && getStatusIcon(message.status)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        {/* Human agent indicator above input */}
        {isHumanAgentEnabled && (
          <div className="flex items-center gap-1.5 mb-2 text-xs text-amber-700">
            <Shield className="h-3 w-3" />
            <span>Messages will be sent with Human Agent tag (7-day window)</span>
          </div>
        )}

        <div className="flex items-end gap-3">
          <div className="flex gap-1">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
              <Paperclip className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder={`Message via ${getChannelLabel(conversation.channel_type)}...`}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                "min-h-[44px] max-h-32 resize-none pr-16",
                isHumanAgentEnabled && "border-amber-300 focus:border-amber-400 focus:ring-amber-400/20"
              )}
              rows={1}
            />
            <div className="absolute right-3 bottom-3 text-xs text-gray-400 pointer-events-none">
              {messageText.length}/1000
            </div>
          </div>

          <Button
            onClick={handleSend}
            disabled={!messageText.trim() || isSending}
            className={cn(
              "h-11 w-11 p-0",
              isHumanAgentEnabled
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-[#3A9B9F] hover:bg-[#2F8488]"
            )}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
