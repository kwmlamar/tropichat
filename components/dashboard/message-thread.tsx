"use client"

import { useState, useRef, useEffect } from "react"
import {
  Send,
  Paperclip,
  FileText,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  ChevronDown,
  Image as ImageIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown"
import { SimpleSelect } from "@/components/ui/dropdown"
import { SkeletonMessage } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { formatMessageTime, formatDateDivider } from "@/lib/utils"
import type { Message, ConversationWithContact, ConversationStatus } from "@/types/database"

interface MessageThreadProps {
  conversation: ConversationWithContact | null
  messages: Message[]
  loading?: boolean
  onSendMessage: (message: string) => void
  onStatusChange: (status: ConversationStatus) => void
  onLoadMore?: () => void
  hasMore?: boolean
}

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "archived", label: "Archived" },
]

export function MessageThread({
  conversation,
  messages,
  loading,
  onSendMessage,
  onStatusChange,
  onLoadMore,
  hasMore,
}: MessageThreadProps) {
  const [messageText, setMessageText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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

  const getStatusIcon = (status: Message["status"]) => {
    switch (status) {
      case "queued":
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
  const groupedMessages = messages.reduce<{ date: string; messages: Message[] }[]>(
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Avatar
            fallback={conversation.contact?.name || conversation.contact?.phone_number}
            size="md"
          />
          <div>
            <h2 className="font-semibold text-gray-900">
              {conversation.contact?.name || conversation.contact?.phone_number || "Unknown"}
            </h2>
            <p className="text-sm text-gray-500">
              {conversation.contact?.phone_number}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SimpleSelect
            value={conversation.status}
            onValueChange={(value) => onStatusChange(value as ConversationStatus)}
            options={statusOptions}
            className="w-32"
          />

          <Dropdown
            align="right"
            trigger={
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <MoreVertical className="h-5 w-5 text-gray-500" />
              </button>
            }
          >
            <DropdownItem>Mark as spam</DropdownItem>
            <DropdownItem>Block contact</DropdownItem>
            <DropdownSeparator />
            <DropdownItem destructive>Delete conversation</DropdownItem>
          </Dropdown>
        </div>
      </div>

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
            {/* Load more button */}
            {hasMore && (
              <div className="text-center mb-4">
                <button
                  onClick={onLoadMore}
                  className="text-sm text-[#25D366] hover:underline"
                >
                  Load earlier messages
                </button>
              </div>
            )}

            {/* Messages grouped by date */}
            {groupedMessages.map((group) => (
              <div key={group.date}>
                {/* Date divider */}
                <div className="flex items-center justify-center my-4">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
                    {formatDateDivider(group.date)}
                  </span>
                </div>

                {/* Messages */}
                <div className="space-y-3">
                  {group.messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.direction === "outbound" ? "justify-end " : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2",
                          message.direction === "outbound"
                            ? "bg-[#25D366] text-white rounded-br-md"
                            : "bg-gray-100 text-gray-900 rounded-bl-md"
                        )}
                      >
                        {/* Media */}
                        {message.media_url && (
                          <div className="mb-2">
                            {message.media_type?.startsWith("image/") ? (
                              <img
                                src={message.media_url}
                                alt="Media"
                                className="rounded-lg max-w-full"
                              />
                            ) : (
                              <a
                                href={message.media_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm underline"
                              >
                                <Paperclip className="h-4 w-4" />
                                View attachment
                              </a>
                            )}
                          </div>
                        )}

                        {/* Message body */}
                        {message.body && (
                          <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                        )}

                        {/* Footer */}
                        <div
                          className={cn(
                            "flex items-center gap-1 mt-1 text-xs",
                            message.direction === "outbound"
                              ? "text-white/70 justify-end"
                              : "text-gray-500"
                          )}
                        >
                          <span>{formatMessageTime(message.sent_at)}</span>
                          {message.direction === "outbound" && getStatusIcon(message.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-end gap-3">
          <div className="flex gap-1">
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
              <Paperclip className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
              <FileText className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[44px] max-h-32 resize-none pr-16"
              rows={1}
            />
            <div className="absolute right-3 bottom-3 text-xs text-gray-400 pointer-events-none">
              {messageText.length}/1000
            </div>
          </div>

          <Button
            onClick={handleSend}
            disabled={!messageText.trim() || isSending}
            className="bg-[#25D366] hover:bg-[#20BD5B] h-11 w-11 p-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
