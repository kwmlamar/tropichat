"use client"

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
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
import { getCurrentCustomer } from "@/lib/supabase"
import { useDebounce } from "@/lib/hooks"
import { generateId, cn } from "@/lib/utils"
import { toast } from "sonner"
import { AnimatePresence, motion } from "framer-motion"
import type {
  ConversationWithAccount,
  UnifiedMessage,
  UnifiedConversation,
  ChannelType,
} from "@/types/unified-inbox"

function InboxContent() {
  const router = useRouter()
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

  const [customerName, setCustomerName] = useState<string | null>(null)
  const [customerHandle, setCustomerHandle] = useState<string | null>(null)
  const [customerPlan, setCustomerPlan] = useState<string | undefined>(undefined)

  const debouncedSearch = useDebounce(searchQuery, 300)

  const searchParams = useSearchParams()
  const conversationIdParam = searchParams.get("conversation")

  // Track mount status for async safety
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Track selected conversation in a ref so realtime callbacks see the latest value
  const selectedConversationRef = useRef(selectedConversation)
  useEffect(() => {
    selectedConversationRef.current = selectedConversation
    
    // Toggle class on body to hide bottom nav on mobile when chat is open
    // Also smoothly transition the iOS PWA status bar color to match the UI!
    let metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta')
      metaThemeColor.setAttribute('name', 'theme-color')
      document.head.appendChild(metaThemeColor)
    }

    if (selectedConversation) {
      document.body.classList.add('mobile-chat-open')
      const isDark = document.documentElement.classList.contains('dark')
      metaThemeColor.setAttribute('content', isDark ? '#121212' : '#ffffff')
    } else {
      document.body.classList.remove('mobile-chat-open')
      const isDark = document.documentElement.classList.contains('dark')
      metaThemeColor.setAttribute('content', isDark ? '#121212' : '#ffffff')
    }
    
    return () => {
      document.body.classList.remove('mobile-chat-open')
    }
  }, [selectedConversation])

  // Fetch connected account IDs for realtime subscriptions
  useEffect(() => {
    let ignore = false
    async function fetchAccounts() {
      try {
        const { data: accountsData } = await getConnectedAccounts()
        if (!ignore) setAccountIds(accountsData.map((a) => a.id))

        const { data: customerData } = await getCurrentCustomer()
        if (!ignore) {
          setCustomerName(customerData?.business_name || null)
          setCustomerPlan(customerData?.plan)
          // Fetch booking handle
          try {
            const handleRes = await fetch("/api/bookings/handle", {
              headers: { "Content-Type": "application/json" }
            })
            if (handleRes.ok) {
              const handleJson = await handleRes.json()
              setCustomerHandle(handleJson.handle ?? null)
            }
          } catch {/* ignore */}
        }

      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return
        console.error("Failed to fetch dashboard data:", err)
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

  // Handle auto-selecting conversation from URL query parameter (e.g. from push notifications)
  useEffect(() => {
    if (conversationIdParam && conversations.length > 0 && !selectedConversation) {
      const conv = conversations.find(c => c.id === conversationIdParam)
      if (conv) {
        setSelectedConversation(conv)
      }
    }
  }, [conversationIdParam, conversations, selectedConversation])

  // Combined: Initial fetch + Real-time subscription for messages
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([])
      return
    }

    // Clear messages immediately when switching to a new conversation
    setMessages([])

    let isSubscribed = true
    const conversationId = selectedConversation.id

    // 1. Set up Real-time subscription first to catch any messages during fetch
    const unsubscribe = subscribeToUnifiedMessages(
      conversationId,
      (message, eventType) => {
        if (!isSubscribed) return

        setMessages((prev) => {
          if (eventType === "UPDATE" || eventType === "INSERT") {
            // Check if exact message exists
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
          }
          return prev
        })
      }
    )

    // 2. Fetch existing messages
    async function fetchMessages() {
      if (!isSubscribed) return
      setLoadingMessages(true)

      try {
        const { data, error } = await getUnifiedMessages(conversationId)
        if (!isSubscribed) return

        if (error) {
          toast.error("Failed to load messages")
          console.error(error)
        } else {
          // Merge with any realtime messages that arrived for THIS conversation while fetching
          setMessages((prev) => {
            // Filter out any lingering messages from a previous conversation just in case,
            // though the synchronous setMessages([]) should have handled it.
            const validPrev = prev.filter(m => m.conversation_id === conversationId)
            const merged = [...data, ...validPrev]
            const byId = new Map(merged.map((m) => [m.id, m]))
            return Array.from(byId.values()).sort(
              (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
            )
          })
          setHasMoreMessages(data.length === 50)
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err)
      } finally {
        if (isSubscribed) setLoadingMessages(false)
      }

      // Mark conversation as read (secondary task)
      if (isSubscribed && selectedConversation!.unread_count > 0) {
        await updateUnifiedConversation(conversationId, { unread_count: 0 })
        if (isSubscribed) {
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
            )
          )
        }
      }
    }

    fetchMessages()

    return () => {
      isSubscribed = false
      unsubscribe()
    }
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
        // Check if this update is for the conversation the user is currently viewing
        const isViewingThis = selectedConversationRef.current?.id === updatedConv.id

        // If the user is viewing this conversation and unread_count went up,
        // reset it to 0 — they've already seen the message
        if (isViewingThis && updatedConv.unread_count > 0) {
          updatedConv = { ...updatedConv, unread_count: 0 }
          // Fire-and-forget DB update to clear unread count
          updateUnifiedConversation(updatedConv.id, { unread_count: 0 })
        }

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
    const { data, error } = await sendUnifiedMessage(
      selectedConversation.id,
      messageText,
      "text"
    )

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
        // If the realtime UPDATE or INSERT already replaced this temp message, it won't exist here.
        // We only add/replace it if tempMessage.id still exists.
        const existsId = prev.some(m => m.id === data.id)
        if (existsId) {
          // Realtime already did its job and inserted the real UUID, do nothing to avoid reverting status back to 'sent'
          return prev
        }

        const updated = prev.map((m) => (m.id === tempMessage.id ? data : m))
        if (!updated.some(m => m.id === data.id)) {
          updated.push(data)
        }
        const byId = new Map(updated.map((m) => [m.id, m]))
        return Array.from(byId.values()).sort(
          (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
        )
      })
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
      setMessages((prev) => {
        const validPrev = prev.filter(m => m.conversation_id === selectedConversation.id)
        return [...data, ...validPrev]
      })
      setHasMoreMessages(data.length === 50)
    }
  }

  return (
    <div className="flex h-full">
      {/* Conversation List */}
      <div className={cn(
        "w-full md:w-80 lg:w-96 flex-shrink-0",
        selectedConversation ? "hidden md:block" : "block"
      )}>
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
        className={cn(
          "flex-1 min-w-0",
          selectedConversation ? "flex" : "hidden md:flex",
          !selectedConversation ? "bg-gray-50 dark:bg-black" : ""
        )}
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
            onCreateBooking={() => setBookingModalOpen(true)}
            customerName={customerName}
            plan={customerPlan}
            onBack={() => {
              setSelectedConversation(null)
              router.replace('/dashboard')
            }}
          />
        </div>
      </div>

      {/* Contact Details */}
      <div className="hidden lg:block w-80 flex-shrink-0 border-l border-gray-200 dark:border-white/5">
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

export default function InboxPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007B85]" />
      </div>
    }>
      <InboxContent />
    </Suspense>
  )
}
