"use client"

import { useState, useEffect, useCallback } from "react"
import { ConversationList } from "@/components/dashboard/conversation-list"
import { MessageThread } from "@/components/dashboard/message-thread"
import { ContactDetails } from "@/components/dashboard/contact-details"
import {
  getConversations,
  getMessages,
  sendMessage,
  updateConversation,
  updateContact,
  getUser,
  subscribeToMessages,
  subscribeToConversations,
} from "@/lib/supabase"
import { useDebounce } from "@/lib/hooks"
import { generateId } from "@/lib/utils"
import { toast } from "sonner"
import type {
  ConversationWithContact,
  Message,
  ConversationStatus,
  Contact,
} from "@/types/database"

export default function InboxPage() {
  // State
  const [conversations, setConversations] = useState<ConversationWithContact[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithContact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const debouncedSearch = useDebounce(searchQuery, 300)

  // Fetch user ID
  useEffect(() => {
    async function fetchUser() {
      const { user } = await getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    fetchUser()
  }, [])

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    setLoadingConversations(true)
    const { data, error } = await getConversations(statusFilter, debouncedSearch)

    if (error) {
      toast.error("Failed to load conversations")
      console.error(error)
    } else {
      setConversations(data)
    }

    setLoadingConversations(false)
  }, [statusFilter, debouncedSearch])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([])
      return
    }

    async function fetchMessages() {
      setLoadingMessages(true)
      const { data, error } = await getMessages(selectedConversation!.id)

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
        await updateConversation(selectedConversation!.id, { unread_count: 0 })
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === selectedConversation!.id ? { ...conv, unread_count: 0 } : conv
          )
        )
      }
    }

    fetchMessages()
  }, [selectedConversation?.id])

  // Real-time subscription for messages
  useEffect(() => {
    if (!selectedConversation) return

    const unsubscribe = subscribeToMessages(selectedConversation.id, (message, eventType) => {
      setMessages((prev) => {
        if (eventType === 'UPDATE') {
          // Update existing message (e.g., status change: sent -> delivered -> read)
          return prev.map((m) => (m.id === message.id ? message : m))
        }

        // INSERT event - only add if not already in list (avoid duplicates from optimistic updates)
        if (prev.some((m) => m.id === message.id || m.twilio_message_sid === message.twilio_message_sid)) {
          // Replace optimistic message with real one
          return prev.map((m) =>
            m.id === message.id || m.twilio_message_sid === message.twilio_message_sid
              ? message
              : m
          )
        }
        return [...prev, message]
      })
    })

    return unsubscribe
  }, [selectedConversation?.id])

  // Real-time subscription for conversations
  useEffect(() => {
    if (!userId) return

    const unsubscribe = subscribeToConversations(userId, (updatedConv) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === updatedConv.id)
        if (index === -1) {
          // New conversation - refetch to get contact data
          fetchConversations()
          return prev
        }
        // Update existing conversation
        return prev.map((c) =>
          c.id === updatedConv.id ? { ...c, ...updatedConv } : c
        )
      })
    })

    return unsubscribe
  }, [userId, fetchConversations])

  // Handle sending a message
  const handleSendMessage = async (messageText: string) => {
    if (!selectedConversation || !userId) return

    // Optimistic update - add message to UI immediately
    const tempMessage: Message = {
      id: generateId(),
      conversation_id: selectedConversation.id,
      customer_id: userId,
      twilio_message_sid: null,
      whatsapp_message_id: null,
      direction: "outbound",
      from_number: "",
      to_number: selectedConversation.contact?.phone_number || "",
      body: messageText,
      media_url: null,
      media_type: null,
      status: "sending",
      template_name: null,
      is_automated: false,
      sent_by: userId,
      sent_at: new Date().toISOString(),
      delivered_at: null,
      read_at: null,
      error_message: null,
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

    // Send the actual message
    const { data, error } = await sendMessage(
      selectedConversation.id,
      messageText,
      userId
    )

    if (error) {
      toast.error("Failed to send message")
      // Update message status to failed
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempMessage.id ? { ...m, status: "failed" } : m
        )
      )
    } else if (data) {
      // Replace temp message with real one
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMessage.id ? data : m))
      )
    }
  }

  // Handle status change
  const handleStatusChange = async (status: ConversationStatus) => {
    if (!selectedConversation) return

    const { error } = await updateConversation(selectedConversation.id, { status })

    if (error) {
      toast.error("Failed to update status")
    } else {
      // Update local state
      setSelectedConversation((prev) => (prev ? { ...prev, status } : null))
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation.id ? { ...conv, status } : conv
        )
      )
      toast.success(`Conversation marked as ${status}`)
    }
  }

  // Handle contact update
  const handleUpdateContact = async (updates: Partial<Contact>) => {
    if (!selectedConversation?.contact) return

    const { error } = await updateContact(selectedConversation.contact.id, updates)

    if (error) {
      toast.error("Failed to update contact")
    } else {
      // Update local state
      setSelectedConversation((prev) =>
        prev
          ? {
              ...prev,
              contact: { ...prev.contact!, ...updates },
            }
          : null
      )
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation.id
            ? { ...conv, contact: { ...conv.contact!, ...updates } }
            : conv
        )
      )
      toast.success("Contact updated")
    }
  }

  // Handle loading more messages
  const handleLoadMore = async () => {
    if (!selectedConversation || messages.length === 0) return

    const { data, error } = await getMessages(
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
    <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen">
      {/* Conversation List - 25% */}
      <div className="w-full md:w-80 lg:w-96 flex-shrink-0">
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversation?.id || null}
          onSelect={setSelectedConversation}
          loading={loadingConversations}
          onSearch={setSearchQuery}
          onFilterChange={setStatusFilter}
          currentFilter={statusFilter}
        />
      </div>

      {/* Message Thread - 50% (hidden on mobile when no conversation) */}
      <div className={`hidden md:flex flex-1 ${!selectedConversation ? "bg-gray-50" : ""}`}>
        <MessageThread
          conversation={selectedConversation}
          messages={messages}
          loading={loadingMessages}
          onSendMessage={handleSendMessage}
          onStatusChange={handleStatusChange}
          onLoadMore={handleLoadMore}
          hasMore={hasMoreMessages}
        />
      </div>

      {/* Contact Details - 25% (hidden on smaller screens) */}
      <div className="hidden lg:block w-80 flex-shrink-0">
        <ContactDetails
          conversation={selectedConversation}
          onUpdateContact={handleUpdateContact}
        />
      </div>
    </div>
  )
}
