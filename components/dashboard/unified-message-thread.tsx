"use client"

import { useState, useRef, useEffect } from "react"
import {
  AlertCircle,
  Archive,
  AtSign,
  CalendarPlus,
  Check,
  CheckCheck,
  Clock,
  Camera,
  FileText,
  Image as ImageIcon,
  Inbox,
  Maximize2,
  Mic,
  MoreVertical,
  Paperclip,
  Plus,
  Send,
  Shield,
  Smile,
  ChevronLeft,
} from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown"
import { SkeletonMessage } from "@/components/ui/skeleton"
import { ChannelIcon, getChannelLabel } from "./channel-icon"
import { cn, formatMessageTime, formatDateDivider, getConversationDisplayName } from "@/lib/utils"
import type { UnifiedMessage, ConversationWithAccount, MessageDeliveryStatus } from "@/types/unified-inbox"

interface UnifiedMessageThreadProps {
  conversation: ConversationWithAccount | null
  messages: UnifiedMessage[]
  loading?: boolean
  onSendMessage: (message: string) => void
  onArchive?: () => void
  onLoadMore?: () => void
  hasMore?: boolean
  onCreateBooking?: () => void
  customerName?: string | null
  onBack?: () => void
}


export function UnifiedMessageThread({
  conversation,
  messages,
  loading,
  onSendMessage,
  onArchive,
  onLoadMore,
  hasMore,
  onCreateBooking,
  customerName,
  onBack,
}: UnifiedMessageThreadProps) {
  const [messageText, setMessageText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
  }, [messages])

  // Sync reason state when conversation changes
  useEffect(() => {
  }, [conversation?.id])

  const handleSend = async () => {
    if (!messageText.trim() || isSending) return
    const text = messageText.trim()
    setMessageText("")
    setIsSending(true)
    await onSendMessage(text)
    setIsSending(false)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
    }
  }, [messageText])


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

  // Modern Welcome Empty state
  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-black p-8 text-center relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 bg-dot-pattern opacity-5 dark:opacity-[0.02] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative z-10 max-w-lg w-full"
        >
          <div className="bg-white/40 dark:bg-[#1A1A1A]/40 backdrop-blur-xl rounded-[40px] border border-gray-100/50 dark:border-[#222222]/50 p-12 shadow-2xl shadow-sky-900/5 dark:shadow-black/20">
            <div className="mb-10 relative">
              <div className="relative inline-block">
                <div className="relative rounded-full bg-white dark:bg-[#111111]/50 p-8 shadow-2xl shadow-teal-500/20 dark:shadow-[#3A9B9F]/20 border border-teal-50/50 dark:border-[#3A9B9F]/20">
                  <Image
                    src="/tropichat-logo.png"
                    alt="TropiChat"
                    width={96}
                    height={96}
                    className="h-24 w-24 object-contain scale-110"
                  />
                </div>
                {/* Subtle pulse effect */}
                <div className="absolute inset-0 rounded-full animate-ping-slow bg-[#3A9B9F]/10 -z-10" />
              </div>
            </div>

            <h3 className="text-3xl font-bold text-[#213138] dark:text-gray-100 mb-4 tracking-tight" style={{ fontFamily: 'var(--font-poppins)' }}>
              Select a conversation
            </h3>
            <p className="text-[17px] text-gray-500 dark:text-gray-400 mb-10 leading-relaxed max-w-sm mx-auto">
              Choose a customer from the list to start chatting. Your responses will be sent via their original platform.
            </p>

            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-[#222222] transition-all hover:bg-white dark:hover:bg-[#333333]">
              <div className="p-1.5 rounded-lg bg-[#3A9B9F]/10 text-[#3A9B9F]">
                <Inbox className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-[0.2em]">Unified Inbox</span>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }


  return (
    <div className="flex flex-col h-full bg-white dark:bg-black relative overflow-hidden h-[100dvh]">

      {/* Header */}
      <div className="fixed lg:sticky top-0 left-0 right-0 lg:left-auto lg:right-auto z-30 flex-shrink-0 bg-white dark:bg-black border-b border-gray-100 dark:border-[#222222] shadow-sm">
        <div className="h-[env(safe-area-inset-top)] w-full" />
        <div className="flex items-center justify-between px-4 lg:px-6 py-2.5 lg:py-4">
          <div className="flex items-center gap-2 lg:gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="lg:hidden p-2 -ml-2 mr-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <div className="relative">
            <Avatar
              src={conversation.customer_avatar_url}
              fallback={getConversationDisplayName(conversation)}
              size="md"
            />
            <div className="absolute -bottom-0.5 -right-0.5">
              <ChannelIcon channel={conversation.channel_type} size="sm" />
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-[#213138] dark:text-gray-100 text-[15px] lg:text-[16px] truncate leading-tight">
              {getConversationDisplayName(conversation)}
            </h2>
            <p className="text-[11px] text-[#3A9B9F] font-bold uppercase tracking-wider">
              {getChannelLabel(conversation.channel_type)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Create Booking button */}
          {onCreateBooking && (
            <button
              onClick={onCreateBooking}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#3A9B9F]/10 text-[#3A9B9F] hover:bg-[#3A9B9F]/20 transition-colors text-xs font-medium"
              title="Create a booking from this conversation"
            >
              <CalendarPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Book</span>
            </button>
          )}


          <Dropdown
            align="right"
            trigger={
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                <MoreVertical className="h-5 w-5 text-gray-500 dark:text-gray-400" />
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
    </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 pt-[72px] lg:pt-4 relative z-10 scrollbar-hide overscroll-contain">
        {loading && messages.length === 0 ? (
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
                  <span className="px-3 py-1 bg-gray-100 dark:bg-[#111111] rounded-full text-xs text-gray-500 dark:text-gray-400">
                    {formatDateDivider(group.date)}
                  </span>
                </div>

                <div className="space-y-4">
                  {group.messages.map((message) => {
                    const isOutbound = message.sender_type === "business"
                    const mediaUrl = message.metadata?.media_url as string | undefined
                    const mediaMime = message.metadata?.media_mime_type as string | undefined

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
                            "max-w-[85%] sm:max-w-[75%] rounded-[20px] px-4 py-2 transition-all",
                            isOutbound
                              ? "bg-[#3A9B9F] text-white rounded-br-sm shadow-sm"
                              : "bg-slate-100 dark:bg-[#111111] text-slate-900 dark:text-white rounded-bl-sm border border-slate-200/50 dark:border-[#222222] shadow-sm"
                          )}
                        >

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
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium text-inherit">
                              {message.content}
                            </p>
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
                              "flex items-center gap-1 mt-1 text-[10px]",
                              isOutbound
                                ? "text-white/70 justify-end"
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

      {/* Message Input Area (Improved for Mobile) */}
      <div className="flex-shrink-0 bg-white dark:bg-black border-t border-gray-100 dark:border-[#222222] relative z-20 pb-safe">
        <div className="p-2 lg:p-3 flex items-end gap-2">
        <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors shrink-0 mb-0.5">
          <Plus className="w-6 h-6 transition-transform hover:rotate-90" strokeWidth={1.5} />
        </button>

        <div className="flex-1 bg-white dark:bg-[#111111] rounded-3xl border border-gray-300/60 dark:border-[#222222] flex items-end pl-1 pr-1.5 shadow-sm min-h-[40px] focus-within:ring-1 focus-within:ring-[#3A9B9F] focus-within:border-[#3A9B9F]">
          <Textarea
            ref={textareaRef}
            placeholder=""
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-0 focus-visible:ring-0 shadow-none px-3 py-[9px] min-h-[40px] max-h-[120px] resize-none bg-transparent text-[15px] dark:text-white leading-snug overflow-y-auto"
            rows={1}
            style={{ height: "40px" }}
          />
          <button className="p-2 mb-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0" title="Stickers / Attachments">
            <Paperclip className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {messageText.trim() ? (
          <button
            onClick={handleSend}
            disabled={isSending}
            className="mb-1 p-2.5 bg-[#0084FF] text-white rounded-full shrink-0 flex items-center justify-center transition-all hover:bg-[#0073E6] active:scale-95 shadow-md disabled:bg-gray-300"
          >
            <Send className="w-5 h-5 ml-0.5" strokeWidth={2} />
          </button>
        ) : (
          <div className="flex items-center gap-1 shrink-0 mb-0.5">
            <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors">
              <Camera className="w-6 h-6" strokeWidth={1.5} />
            </button>
            <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors">
              <Mic className="w-6 h-6" strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
)
}
