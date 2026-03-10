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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
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
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">
                {getConversationDisplayName(conversation)}
              </h2>
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


      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
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

      {/* Message Input Area */}
      <div className="p-4 bg-white">

        <div className="relative flex flex-col rounded-[20px] bg-white border border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all focus-within:ring-2 focus-within:ring-[#3A9B9F]/10 focus-within:border-[#3A9B9F]/30">
          {/* Main Text Input Part */}
          <div className="relative p-2 pb-0">
            <Textarea
              ref={textareaRef}
              placeholder="Type your message"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="resize-none border-0 focus-visible:ring-0 shadow-none px-3 py-2 bg-transparent text-sm overflow-y-auto"
              style={{ minHeight: "60px", maxHeight: "160px" }}
              rows={1}
            />

            {/* Maximize Icon */}
            <button className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors">
              <Maximize2 className="h-4 w-4" />
            </button>
            <div className="absolute right-4 bottom-0 text-[10px] text-gray-300 pointer-events-none">
              {messageText.length}/1000
            </div>
          </div>

          {/* Toolbar & Send Button */}
          <div className="flex items-center justify-between px-3 py-3 mt-1">
            <div className="flex items-center gap-1 text-gray-400">
              <button className="p-1.5 hover:bg-gray-100 hover:text-gray-600 rounded-lg transition-colors" title="Add">
                <Plus className="h-[18px] w-[18px]" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 hover:text-gray-600 rounded-lg transition-colors" title="Emoji">
                <Smile className="h-[18px] w-[18px]" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 hover:text-gray-600 rounded-lg transition-colors" title="Mention">
                <AtSign className="h-[18px] w-[18px]" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 hover:text-gray-600 rounded-lg transition-colors" title="Attach file">
                <Paperclip className="h-[18px] w-[18px]" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 hover:text-gray-600 rounded-lg transition-colors" title="Voice message">
                <Mic className="h-[18px] w-[18px]" />
              </button>
            </div>

            <Button
              onClick={handleSend}
              disabled={!messageText.trim() || isSending}
              className="h-9 w-9 p-0 rounded-full shadow-sm transition-all flex items-center justify-center bg-[#3A9B9F] hover:bg-[#2F8488] disabled:bg-gray-200 disabled:text-gray-400 text-white"
            >
              <Send className="h-[18px] w-[18px] ml-0.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
