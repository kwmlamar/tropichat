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
      <div className="flex flex-col items-center justify-center h-full bg-[#F8FAFB] p-8 text-center relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-white to-transparent opacity-60 z-0" />
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-teal-500/5 blur-[120px] rounded-full z-0 animate-float" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-coral-500/5 blur-[120px] rounded-full z-0 animate-float-delayed" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 max-w-lg w-full"
        >
          {/* Main Card */}
          <div className="bg-white/70 backdrop-blur-xl rounded-[32px] border border-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-100">
            <div className="mb-8 relative inline-block">
              <div className="absolute inset-0 bg-teal-500/20 blur-2xl rounded-full" />
              <div className="relative rounded-3xl bg-gradient-to-br from-[#3A9B9F] to-[#2F8488] p-5 shadow-lg shadow-teal-500/20">
                <Image
                  src="/tropichat-logo.png"
                  alt="TropiChat"
                  width={64}
                  height={64}
                  unoptimized
                  className="h-14 w-14 object-contain brightness-0 invert"
                />
              </div>
            </div>

            <h3 className="text-3xl font-extrabold text-[#213138] mb-3 tracking-tight font-[family-name:var(--font-poppins)]">
              Welcome Back{customerName ? `, ${customerName}` : ""}!
            </h3>
            <p className="text-base text-gray-500 mb-8 leading-relaxed max-w-xs mx-auto">
              Ready to grow your business today? Select a conversation from the sidebar to start chatting.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-gray-100">
              <div className="text-left p-4 rounded-2xl bg-gray-50/50 border border-gray-100/50 flex flex-col gap-1 items-start">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-600 mb-1">
                  <Inbox className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Unified Inbox</span>
                <span className="text-sm font-semibold text-gray-700">All messages in one view</span>
              </div>
              <div className="text-left p-4 rounded-2xl bg-gray-50/50 border border-gray-100/50 flex flex-col gap-1 items-start">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600 mb-1">
                  <Shield className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Business Pro</span>
                <span className="text-sm font-semibold text-gray-700">Enterprise Security</span>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Inbox is connected and synchronized
          </motion.div>
        </motion.div>
      </div>
    )
  }


  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Soft teal gradient background on mobile */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#3A9B9F]/15 via-[#3A9B9F]/5 to-transparent lg:hidden pointer-events-none z-0" />

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 lg:px-6 py-2.5 lg:py-4 border-b border-gray-100/50 bg-white/60 backdrop-blur-xl relative z-20 pt-[calc(env(safe-area-inset-top)+0.25rem)] lg:pt-4">
        <div className="flex items-center gap-1.5 lg:gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="lg:hidden p-2 -ml-2 mr-1 text-gray-500 hover:text-gray-900 transition-colors"
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
            <h2 className="font-bold text-[#213138] text-[15px] lg:text-[16px] truncate leading-tight">
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


      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 relative z-10 custom-scrollbar">
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
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
                    {formatDateDivider(group.date)}
                  </span>
                </div>

                <div className="space-y-4">
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
                            "max-w-[75%] rounded-[24px] px-[18px] py-[10px] transition-all",
                            isOutbound
                              ? "bg-gradient-to-br from-[#3A9B9F] to-[#2F8488] text-white rounded-br-sm shadow-md shadow-[#3A9B9F]/20"
                              : "bg-slate-50 text-slate-900 rounded-bl-sm border border-slate-200/60 shadow-sm"
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
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium text-inherit drop-shadow-sm">
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
                              "flex items-center gap-1 mt-1 text-xs",
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

      {/* Message Input Area (Anchored to bottom) */}
      <div className="flex-shrink-0 p-2 lg:p-3 bg-white/80 backdrop-blur-xl border-t border-gray-100/50 flex items-end gap-2 relative z-20 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] lg:pb-3">
        <button className="p-2 text-gray-500 hover:text-gray-800 transition-colors shrink-0 mb-0.5">
          <Plus className="w-6 h-6 transition-transform hover:rotate-90" strokeWidth={1.5} />
        </button>

        <div className="flex-1 bg-white rounded-3xl border border-gray-300/60 flex items-end pl-1 pr-1.5 shadow-sm min-h-[40px] focus-within:ring-1 focus-within:ring-[#3A9B9F] focus-within:border-[#3A9B9F]">
          <Textarea
            ref={textareaRef}
            placeholder=""
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-0 focus-visible:ring-0 shadow-none px-3 py-[9px] min-h-[40px] max-h-[120px] resize-none bg-transparent text-[15px] leading-snug overflow-y-auto"
            rows={1}
            style={{ height: "40px" }}
          />
          <button className="p-2 mb-0.5 text-gray-400 hover:text-gray-600 transition-colors shrink-0" title="Stickers / Attachments">
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
            <button className="p-2 text-gray-500 hover:text-gray-800 transition-colors">
              <Camera className="w-6 h-6" strokeWidth={1.5} />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-800 transition-colors">
              <Mic className="w-6 h-6" strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
