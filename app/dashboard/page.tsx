"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { UnifiedConversationList } from "@/components/dashboard/unified-conversation-list"
import { UnifiedMessageThread } from "@/components/dashboard/unified-message-thread"
import { UnifiedContactDetails } from "@/components/dashboard/unified-contact-details"
import {
  getUnifiedConversations,
  getUnifiedMessages,
  sendUnifiedMessage,
  updateUnifiedConversation,
  subscribeToUnifiedMessages,
  subscribeToUnifiedConversations,
  getConnectedAccounts,
} from "@/lib/unified-inbox"
import { useDebounce } from "@/lib/hooks"
import { generateId } from "@/lib/utils"
import { toast } from "sonner"
import type {
  ConversationWithAccount,
  UnifiedMessage,
  UnifiedConversation,
  ChannelType,
} from "@/types/unified-inbox"

export default function InboxPage() {
  // State
  const [conversations, setConversations] = useState<ConversationWithAccount[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithAccount | null>(null)
  const [messages, setMessages] = useState<UnifiedMessage[]>([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [channelFilter, setChannelFilter] = useState<ChannelType | "all">("all")
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [accountIds, setAccountIds] = useState<string[]>([])

  const debouncedSearch = useDebounce(searchQuery, 300)

  // Track mount status for async safety
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Fetch connected account IDs for realtime subscriptions
  useEffect(() => {
    let ignore = false
    async function fetchAccounts() {
      try {
        const { data } = await getConnectedAccounts()
        if (!ignore) setAccountIds(data.map((a) => a.id))
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return
        console.error("Failed to fetch accounts:", err)
      }
    }
    fetchAccounts()
    return () => { ignore = true }
  }, [])

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!mountedRef.current) return
    setLoadingConversations(true)
    try {
      const { data, error } = await getUnifiedConversations(channelFilter, debouncedSearch)
      if (!mountedRef.current) return

      if (error) {
        toast.error("Failed to load conversations")
        console.error(error)
      } else {
        setConversations(data)
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
      console.error("Failed to fetch conversations:", err)
    }
    if (mountedRef.current) setLoadingConversations(false)
  }, [channelFilter, debouncedSearch])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([])
      return
    }

    let ignore = false

    async function fetchMessages() {
      setLoadingMessages(true)
      try {
        const { data, error } = await getUnifiedMessages(selectedConversation!.id)
        if (ignore) return

        if (error) {
          toast.error("Failed to load messages")
          console.error(error)
        } else {
          setMessages(data)
          setHasMoreMessages(data.length === 50)
        }
        setLoadingMessages(false)

        // Mark conversation as read
        if (selectedConversation!.unread_count > 0) {
          await updateUnifiedConversation(selectedConversation!.id, { unread_count: 0 })
          if (!ignore) {
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === selectedConversation!.id ? { ...conv, unread_count: 0 } : conv
              )
            )
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return
        console.error("Failed to fetch messages:", err)
        if (!ignore) setLoadingMessages(false)
      }
    }

    fetchMessages()
    return () => { ignore = true }
  }, [selectedConversation?.id])

  // Real-time subscription for messages in the selected conversation
  useEffect(() => {
    if (!selectedConversation) return

    const unsubscribe = subscribeToUnifiedMessages(
      selectedConversation.id,
      (message, eventType) => {
        setMessages((prev) => {
          if (eventType === "UPDATE") {
            return prev.map((m) => (m.id === message.id ? message : m))
          }

          // INSERT — handle race with optimistic update
          const existingIdx = prev.findIndex(
            (m) =>
              m.id === message.id ||
              (m.channel_message_id && m.channel_message_id === message.channel_message_id)
          )
          if (existingIdx >= 0) {
            return prev.map((m, i) => (i === existingIdx ? message : m))
          }

          // Replace optimistic message
          const optimisticIdx = prev.findIndex(
            (m) =>
              m.sender_type === "business" &&
              m.status === "sending" &&
              m.content === message.content &&
              Math.abs(new Date(m.sent_at).getTime() - new Date(message.sent_at).getTime()) < 30000
          )
          if (optimisticIdx >= 0) {
            return prev.map((m, i) => (i === optimisticIdx ? message : m))
          }

          // Dedupe & sort
          const merged = [...prev, message]
          const byId = new Map(merged.map((m) => [m.id, m]))
          return Array.from(byId.values()).sort(
            (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
          )
        })
      }
    )

    return unsubscribe
  }, [selectedConversation?.id])

  // Real-time subscription for conversation list updates
  useEffect(() => {
    if (accountIds.length === 0) return

    const unsubscribe = subscribeToUnifiedConversations(
      accountIds,
      (updatedConv: UnifiedConversation) => {
        setConversations((prev) => {
          const index = prev.findIndex((c) => c.id === updatedConv.id)
          if (index === -1) {
            // New conversation — refetch to get full data with joins
            fetchConversations()
            return prev
          }
          return prev
            .map((c) => (c.id === updatedConv.id ? { ...c, ...updatedConv } : c))
            .sort(
              (a, b) =>
                new Date(b.last_message_at || b.created_at).getTime() -
                new Date(a.last_message_at || a.created_at).getTime()
            )
        })
      }
    )

    return unsubscribe
  }, [accountIds, fetchConversations])

  // Send message handler
  const handleSendMessage = async (messageText: string) => {
    if (!selectedConversation) return

    // Optimistic update
    const tempMessage: UnifiedMessage = {
      id: generateId(),
      conversation_id: selectedConversation.id,
      channel_message_id: null,
      sender_type: "business",
      content: messageText,
      message_type: "text",
      sent_at: new Date().toISOString(),
      delivered_at: null,
      read_at: null,
      failed_at: null,
      status: "sending",
      error_message: null,
      metadata: {},
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, tempMessage])

    // Update conversation preview
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              last_message_at: tempMessage.sent_at,
              last_message_preview: messageText.substring(0, 100),
            }
          : conv
      )
    )

    // Send via API
    const { data, error } = await sendUnifiedMessage(selectedConversation.id, messageText)

    if (error) {
      toast.error("Failed to send message")
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempMessage.id ? { ...m, status: "failed" as const } : m
        )
      )
    } else if (data) {
      // Replace temp with real message, dedupe
      setMessages((prev) => {
        const updated = prev.map((m) => (m.id === tempMessage.id ? data : m))
        const byId = new Map(updated.map((m) => [m.id, m]))
        return Array.from(byId.values()).sort(
          (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
        )
      })
    }
  }

  // Archive handler
  const handleArchive = async () => {
    if (!selectedConversation) return
    const { error } = await updateUnifiedConversation(selectedConversation.id, {
      is_archived: !selectedConversation.is_archived,
    })
    if (error) {
      toast.error("Failed to archive conversation")
    } else {
      toast.success(
        selectedConversation.is_archived ? "Conversation unarchived" : "Conversation archived"
      )
      setSelectedConversation(null)
      fetchConversations()
    }
  }

  // Load more messages
  const handleLoadMore = async () => {
    if (!selectedConversation || messages.length === 0) return
    const { data, error } = await getUnifiedMessages(
      selectedConversation.id,
      50,
      messages[0].sent_at
    )
    if (error) {
      toast.error("Failed to load more messages")
    } else {
      setMessages((prev) => [...data, ...prev])
      setHasMoreMessages(data.length === 50)
    }
  }

  return (
    <div className="flex h-full">
      {/* Conversation List */}
      <div className="w-full md:w-80 lg:w-96 flex-shrink-0">
        <UnifiedConversationList
          conversations={conversations}
          selectedId={selectedConversation?.id || null}
          onSelect={setSelectedConversation}
          loading={loadingConversations}
          onSearch={setSearchQuery}
          onChannelFilter={setChannelFilter}
          currentChannelFilter={channelFilter}
        />
      </div>

      {/* Message Thread */}
      <div
        className={`hidden md:flex flex-1 min-w-0 ${!selectedConversation ? "bg-gray-50" : ""}`}
      >
        <div className="flex flex-col w-full h-full">
          <UnifiedMessageThread
            conversation={selectedConversation}
            messages={messages}
            loading={loadingMessages}
            onSendMessage={handleSendMessage}
            onArchive={handleArchive}
            onLoadMore={handleLoadMore}
            hasMore={hasMoreMessages}
          />
        </div>
      </div>

      {/* Contact Details */}
      <div className="hidden lg:block w-80 flex-shrink-0 border-l border-gray-200">
        <UnifiedContactDetails
          conversation={selectedConversation}
          messageCount={messages.length}
          onArchive={handleArchive}
        />
      </div>
    </div>
  )
}
