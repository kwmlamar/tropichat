"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  getSession,
  getUser,
  getCurrentCustomer,
  getConversations,
  getMessages,
  subscribeToMessages,
  subscribeToConversations,
} from './supabase'
import type {
  Customer,
  Message,
  Conversation,
  ConversationWithContact,
} from '@/types/database'
import type { User, Session } from '@supabase/supabase-js'

// ==================== AUTH HOOKS ====================

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadAuth() {
      const { session: s } = await getSession()
      const { user: u } = await getUser()
      setSession(s)
      setUser(u)
      setLoading(false)
    }
    loadAuth()
  }, [])

  const requireAuth = useCallback(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  return { user, session, loading, requireAuth }
}

export function useCustomer() {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomer = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await getCurrentCustomer()
    setCustomer(data)
    setError(err)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCustomer()
  }, [fetchCustomer])

  return { customer, loading, error, refetch: fetchCustomer }
}

// ==================== CONVERSATION HOOKS ====================

export function useConversations(status?: string, search?: string) {
  const [conversations, setConversations] = useState<ConversationWithContact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await getConversations(status, search)
    setConversations(data)
    setError(err)
    setLoading(false)
  }, [status, search])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Real-time updates
  useEffect(() => {
    // Subscribe to conversation updates when needed
    // This would be implemented with subscribeToConversations in production
  }, [])

  return { conversations, loading, error, refetch: fetchConversations, setConversations }
}

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const fetchMessages = useCallback(async (before?: string) => {
    if (!conversationId) {
      setMessages([])
      return
    }

    setLoading(true)
    const { data, error: err } = await getMessages(conversationId, 50, before)

    if (before) {
      // Prepend older messages
      setMessages(prev => [...data, ...prev])
    } else {
      setMessages(data)
    }

    setHasMore(data.length === 50)
    setError(err)
    setLoading(false)
  }, [conversationId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Real-time subscription for new messages
  useEffect(() => {
    if (!conversationId) return

    const unsubscribe = subscribeToMessages(conversationId, (newMessage) => {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === newMessage.id)) {
          return prev
        }
        return [...prev, newMessage]
      })
    })

    return unsubscribe
  }, [conversationId])

  const addOptimisticMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message])
  }, [])

  const updateMessageStatus = useCallback((messageId: string, status: Message['status']) => {
    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, status } : m))
    )
  }, [])

  const loadMore = useCallback(() => {
    if (messages.length > 0 && hasMore) {
      fetchMessages(messages[0].sent_at)
    }
  }, [messages, hasMore, fetchMessages])

  return {
    messages,
    loading,
    error,
    hasMore,
    refetch: fetchMessages,
    addOptimisticMessage,
    updateMessageStatus,
    loadMore,
  }
}

// ==================== UTILITY HOOKS ====================

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(error)
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(error)
    }
  }

  return [storedValue, setValue] as const
}

export function useOnClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  handler: (event: MouseEvent | TouchEvent) => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }
      handler(event)
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}

export function useIntersectionObserver(
  ref: React.RefObject<HTMLElement | null>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [ref, options])

  return isIntersecting
}

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean } = {}
) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        !!modifiers.ctrl === event.ctrlKey &&
        !!modifiers.shift === event.shiftKey &&
        !!modifiers.alt === event.altKey &&
        !!modifiers.meta === event.metaKey
      ) {
        event.preventDefault()
        callback()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [key, callback, modifiers])
}

export function useScrollToBottom(dep: unknown) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, [dep])

  return ref
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}
