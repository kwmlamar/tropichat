"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { UnifiedConversationList } from "@/components/dashboard/unified-conversation-list"
import { UnifiedMessageThread } from "@/components/dashboard/unified-message-thread"
import { UnifiedContactDetails } from "@/components/dashboard/unified-contact-details"
import { CreateBookingModal } from "@/components/bookings/create-booking-modal"
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
  const [showArchived, setShowArchived] = useState(false)
  const [bookingModalOpen, setBookingModalOpen] = useState(false)

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
      const { data, error } = await getUnifiedConversations(channelFilter, debouncedSearch, 50, showArchived)
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
  }, [channelFilter, debouncedSearch, showArchived])

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

  // Stable ref to fetchConversations so the realtime subscription
  // doesn't re-subscribe when filters change.
  const fetchConversationsRef = useRef(fetchConversations)
  useEffect(() => {
    fetchConversationsRef.current = fetchConversations
  }, [fetchConversations])

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
            fetchConversationsRef.current()
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

        // Also update selectedConversation if it's the one that changed
        setSelectedConversation((prev) => {
          if (!prev || prev.id !== updatedConv.id) return prev
          return { ...prev, ...updatedConv }
        })
      }
    )

    return unsubscribe
  }, [accountIds])

  // Send message handler
  const handleSendMessage = async (messageText: string) => {
    if (!selectedConversation) return

    const isHumanAgent = selectedConversation.human_agent_enabled

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
      metadata: isHumanAgent ? { human_agent_tag: true } : {},
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

    // Send via API (pass human_agent_tag flag)
    const { data, error } = await sendUnifiedMessage(
      selectedConversation.id,
      messageText,
      "text",
      undefined,
      isHumanAgent
    )

    if (error) {
      toast.error("Failed to send message")
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempMessage.id ? { ...m, status: "failed" as const } : m
        )
      )
    } else if (data) {
      // Show success toast for human agent messages
      if (isHumanAgent) {
        toast.success("Sent with Human Agent tag (7-day window)")
      }

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

  // Human Agent toggle handler
  const handleToggleHumanAgent = async (enabled: boolean, reason?: string) => {
    if (!selectedConversation) return

    const updates: Record<string, unknown> = {
      human_agent_enabled: enabled,
      human_agent_reason: enabled ? (reason || null) : null,
      human_agent_marked_at: enabled ? new Date().toISOString() : null,
    }

    const { error } = await updateUnifiedConversation(selectedConversation.id, updates as never)

    if (error) {
      toast.error("Failed to update Human Agent mode")
    } else {
      // Update local state
      const updatedConv = { ...selectedConversation, ...updates } as ConversationWithAccount
      setSelectedConversation(updatedConv)
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConversation.id ? { ...c, ...updates } as ConversationWithAccount : c))
      )

      if (enabled) {
        toast.success("Human Agent mode enabled — 7 days to respond")
      } else {
        toast.success("Human Agent mode disabled")
      }
    }
  }

  // Archive / Unarchive handler
  const handleArchive = async () => {
    if (!selectedConversation) return
    const willArchive = !selectedConversation.is_archived
    const { error } = await updateUnifiedConversation(selectedConversation.id, {
      is_archived: willArchive,
    })
    if (error) {
      toast.error(willArchive ? "Failed to archive conversation" : "Failed to unarchive conversation")
    } else {
      toast.success(willArchive ? "Conversation archived" : "Conversation unarchived")
      setSelectedConversation(null)
      fetchConversations()
    }
  }

  // Toggle between inbox and archived view
  const handleToggleArchived = () => {
    setShowArchived((prev) => !prev)
    setSelectedConversation(null)
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
          showArchived={showArchived}
          onToggleArchived={handleToggleArchived}
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
            onToggleHumanAgent={handleToggleHumanAgent}
            onCreateBooking={() => setBookingModalOpen(true)}
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

      {/* Create Booking Modal — opened from conversation thread */}
      <CreateBookingModal
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        onCreated={(booking) => {
          toast.success(`Booking created for ${booking.customer_name}`)
          setBookingModalOpen(false)
        }}
        prefill={selectedConversation ? {
          customerName: selectedConversation.customer_name ?? undefined,
          conversationId: selectedConversation.id,
        } : undefined}
        onSendConfirmation={(message) => {
          if (selectedConversation) {
            handleSendMessage(message)
          }
        }}
      />
    </div>
  )
}
