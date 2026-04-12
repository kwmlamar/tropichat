"use client"
import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import {
  Sparkles,
  ArrowUp,
  MessageSquare,
  TrendingUp,
  Users,
  Calendar,
  Zap,
  ChevronRight,
  Clock,
  LayoutDashboard,
  ArrowLeft,
  RefreshCcw,
  Loader2,
  Copy,
  Check,
  X,
  History
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { getSupabase } from "@/lib/supabase"

interface AssistantLog {
  id: string
  query: string
  response: string
  category: string
  created_at: string
}

interface ConversationEntry {
  query: string
  response: string
}

interface AIAssistantViewProps {
  businessName?: string
  recentLogs?: AssistantLog[]
  onRefreshLogs?: () => void
}

export function AIAssistantView({
  businessName = "TropiChat",
  recentLogs = [],
  onRefreshLogs
}: AIAssistantViewProps) {
  const [query, setQuery] = useState("")
  const [isChatting, setIsChatting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [conversation, setConversation] = useState<ConversationEntry[]>([])
  const [pendingQuery, setPendingQuery] = useState("")
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation, loading])

  const suggestions = [
    {
      title: "Analyze & Summarize",
      items: [
        { label: "Summarize today's chat queries", Icon: MessageSquare, category: 'analyze' },
        { label: "Identify any frustrated customers", Icon: Users, category: 'analyze' },
        { label: "Highlight top booking requests", Icon: Calendar, category: 'analyze' }
      ]
    },
    {
      title: "Sales & Growth",
      items: [
        { label: "Draft a re-engagement message", Icon: Zap, category: 'sales' },
        { label: "Analyze sales performance this week", Icon: TrendingUp, category: 'sales' },
        { label: "Who are my most loyal customers?", Icon: Users, category: 'sales' }
      ]
    }
  ]

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = (now.getTime() - date.getTime()) / 1000
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return date.toLocaleDateString()
  }

  const handleQuery = async (customQuery?: string, category?: string) => {
    const targetQuery = customQuery || query
    if (!targetQuery.trim() || loading) return

    setLoading(true)
    setIsChatting(true)
    setPendingQuery(targetQuery)
    setQuery("")

    // Build history from current conversation for context
    const historyPayload = conversation.flatMap(h => ([
      { role: 'user' as const, content: h.query },
      { role: 'ai' as const, content: h.response }
    ]))

    try {
      const { data: { session } } = await getSupabase().auth.getSession()
      const res = await fetch('/api/ai/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ query: targetQuery, category, history: historyPayload })
      })

      const data = await res.json()
      if (data.response) {
        setConversation(prev => [...prev, { query: targetQuery, response: data.response }])
        onRefreshLogs?.()
      } else {
        toast.error("Assistant is busy. Try again?")
      }
    } catch {
      toast.error("Something went wrong.")
    } finally {
      setLoading(false)
      setPendingQuery("")
    }
  }

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const goBack = () => {
    setIsChatting(false)
    setConversation([])
    setPendingQuery("")
  }

  const loadLog = (log: AssistantLog) => {
    setConversation([{ query: log.query, response: log.response }])
    setIsChatting(true)
    setIsHistoryOpen(false)
  }

  if (isChatting) {
    return (
      <div className="w-full max-w-4xl mx-auto px-6 py-12 min-h-[80vh] flex flex-col">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={goBack}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-[#3A9B9F] transition-colors mb-10"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Quest
        </motion.button>

        <div className="flex-1 space-y-12">
          {conversation.map((entry, index) => (
            <React.Fragment key={index}>
              {/* Divider between turns */}
              {index > 0 && (
                <div className="border-t border-gray-100 dark:border-[#1C1C1C]" />
              )}

              {/* User Query */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4"
              >
                <div className="h-10 w-10 rounded-2xl bg-gray-100 dark:bg-[#111] flex items-center justify-center shrink-0 border border-gray-200 dark:border-[#1C1C1C]">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <div className="pt-1.5">
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Your Query</h4>
                  <p className="text-xl font-bold text-[#213138] dark:text-white leading-relaxed">
                    {entry.query}
                  </p>
                </div>
              </motion.div>

              {/* AI Response */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4"
              >
                <div className="h-10 w-10 rounded-2xl bg-[#3A9B9F] flex items-center justify-center shrink-0 shadow-lg shadow-[#3A9B9F]/20">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 pt-1.5 min-w-0">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[11px] font-black text-[#3A9B9F] uppercase tracking-widest">Assistant Response</h4>
                    <button
                      onClick={() => handleCopy(entry.response, index)}
                      className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 hover:text-[#3A9B9F] uppercase tracking-widest transition-colors"
                    >
                      {copiedIndex === index ? (
                        <><Check className="h-3 w-3 text-green-500" /> Copied</>
                      ) : (
                        <><Copy className="h-3 w-3" /> Copy</>
                      )}
                    </button>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:font-semibold prose-p:leading-relaxed prose-p:text-[#213138] dark:prose-p:text-gray-200 prose-headings:text-[#213138] dark:prose-headings:text-white prose-strong:text-[#213138] dark:prose-strong:text-white prose-ul:list-disc prose-li:font-semibold prose-li:text-[#213138] dark:prose-li:text-gray-200 prose-ol:list-decimal">
                    <ReactMarkdown>{entry.response}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            </React.Fragment>
          ))}

          {/* Loading — show pending query + skeleton */}
          {loading && (
            <>
              {conversation.length > 0 && (
                <div className="border-t border-gray-100 dark:border-[#1C1C1C]" />
              )}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4"
              >
                <div className="h-10 w-10 rounded-2xl bg-gray-100 dark:bg-[#111] flex items-center justify-center shrink-0 border border-gray-200 dark:border-[#1C1C1C]">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <div className="pt-1.5">
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Your Query</h4>
                  <p className="text-xl font-bold text-[#213138] dark:text-white leading-relaxed">{pendingQuery}</p>
                </div>
              </motion.div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-2xl bg-[#3A9B9F] flex items-center justify-center shrink-0 shadow-lg shadow-[#3A9B9F]/20">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 pt-1.5 min-w-0">
                  <h4 className="text-[11px] font-black text-[#3A9B9F] uppercase tracking-widest mb-4">Assistant Response</h4>
                  <div className="flex flex-col gap-4 animate-pulse">
                    <div className="h-4 bg-gray-100 dark:bg-[#111] rounded-full w-3/4" />
                    <div className="h-4 bg-gray-100 dark:bg-[#111] rounded-full w-1/2" />
                    <div className="h-4 bg-gray-100 dark:bg-[#111] rounded-full w-5/6" />
                  </div>
                </div>
              </div>
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Follow-up bar */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 pt-8 border-t border-gray-100 dark:border-[#1C1C1C]"
          >
            <div className="relative flex items-center bg-gray-50 dark:bg-[#080808] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl p-2 pr-4 shadow-sm focus-within:border-[#3A9B9F]/50 transition-all">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                placeholder="Ask a follow up..."
                className="flex-1 bg-transparent py-3 px-4 text-sm font-bold outline-none dark:text-white"
                autoFocus
              />
              <button
                onClick={() => handleQuery()}
                disabled={!query.trim()}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  query.trim()
                    ? "bg-[#3A9B9F] text-white shadow-lg shadow-[#3A9B9F]/10 hover:bg-[#2F8488]"
                    : "bg-gray-100 dark:bg-[#111] text-gray-400 opacity-40"
                )}
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="h-16 w-16 bg-[#3A9B9F]/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[#3A9B9F]/20 shadow-inner">
            <Sparkles className="h-8 w-8 text-[#3A9B9F]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[#213138] dark:text-white tracking-tight">
            What&apos;s our quest today?
          </h1>
          <p className="text-gray-500 dark:text-[#525252] font-bold mt-2 uppercase tracking-widest text-[11px]">
            Your AI Sales Assistant for {businessName}
          </p>
        </motion.div>

        {/* Main Search Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#3A9B9F]/5 to-[#FF8B66]/5 blur-xl group-focus-within:opacity-100 opacity-0 transition-opacity" />
          <div className="relative flex items-center bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-[32px] p-2 pr-4 shadow-2xl shadow-black/5 group-focus-within:border-[#3A9B9F]/50 transition-all">
            <div className="pl-6 pr-4">
              <Sparkles className="h-6 w-6 text-[#3A9B9F]" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
              placeholder="Ask anything about your chats, customers, or sales..."
              className="flex-1 bg-transparent py-4 text-lg font-bold outline-none dark:text-white placeholder:text-gray-300 dark:placeholder:text-[#333]"
            />
            <div className="flex items-center gap-2">
              {loading ? (
                <div className="p-3">
                  <Loader2 className="h-5 w-5 animate-spin text-[#3A9B9F]" />
                </div>
              ) : (
                <button
                  onClick={() => handleQuery()}
                  disabled={!query.trim()}
                  className={cn(
                    "p-3 rounded-2xl transition-all",
                    query.trim()
                      ? "bg-[#3A9B9F] text-white shadow-lg shadow-[#3A9B9F]/20 hover:bg-[#2F8488]"
                      : "bg-gray-100 dark:bg-[#111] text-gray-400 opacity-40"
                  )}
                >
                  <ArrowUp className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Suggestions and Recent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full mt-16 px-4">
          {/* Left: Recent Queries */}
          <motion.div
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Recent Business Queries</h3>
              </div>
              {onRefreshLogs && (
                <button onClick={onRefreshLogs} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#111] rounded-lg transition-colors">
                  <RefreshCcw className="h-3 w-3 text-gray-400" />
                </button>
              )}
            </div>
            <div className="space-y-3">
              {recentLogs.length > 0 ? recentLogs.map((log) => (
                <button
                  key={log.id}
                  onClick={() => loadLog(log)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-[#1C1C1C] hover:border-[#3A9B9F]/30 hover:bg-[#3A9B9F]/5 transition-all group text-left"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <MessageSquare className="h-4 w-4 text-gray-400 group-hover:text-[#3A9B9F] shrink-0" />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">{log.query}</span>
                  </div>
                  <span className="text-[10px] font-black text-gray-300 dark:text-[#333] shrink-0 uppercase tracking-tighter ml-2">
                    {formatTimestamp(log.created_at)}
                  </span>
                </button>
              )) : (
                <div className="p-8 text-center bg-gray-50/50 dark:bg-white/5 rounded-[32px] border border-dashed border-gray-200 dark:border-[#1C1C1C]">
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">No recent queries yet</p>
                </div>
              )}
              {recentLogs.length > 0 && (
                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className="text-[11px] font-black text-[#3A9B9F] uppercase tracking-widest mt-4 flex items-center gap-2 hover:gap-3 transition-all ml-4"
                >
                  View All History <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Right: Suggested Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-10"
          >
            {suggestions.map((section) => (
              <div key={section.title}>
                <div className="flex items-center gap-2 mb-6">
                  <LayoutDashboard className="h-4 w-4 text-gray-400" />
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{section.title}</h3>
                </div>
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleQuery(item.label, item.category)}
                      className="w-full flex items-center gap-3 p-4 rounded-2xl border border-gray-100 dark:border-[#1C1C1C] hover:border-[#3A9B9F]/30 hover:bg-[#3A9B9F]/5 transition-all group text-left"
                    >
                      <div className="h-8 w-8 rounded-xl bg-gray-50 dark:bg-[#111] flex items-center justify-center group-hover:bg-[#3A9B9F]/10 transition-colors">
                        <item.Icon className="h-4 w-4 text-gray-400 group-hover:text-[#3A9B9F]" />
                      </div>
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Footer / Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 pt-10 border-t border-gray-100 dark:border-[#1C1C1C] w-full flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assistant Online</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-amber-500" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Powered by Gemini 2.5 Flash</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 text-center max-w-md leading-relaxed font-medium">
            Tropi AI Assistant analyzes your WhatsApp, Instagram, and Messenger chats to provide business insights, draft messages, and manage bookings.
          </p>
        </motion.div>
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0C0C0C] rounded-3xl shadow-2xl border border-gray-100 dark:border-[#1C1C1C] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-[#1C1C1C]">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-[#3A9B9F]/10 rounded-xl flex items-center justify-center border border-[#3A9B9F]/20">
                    <History className="h-4 w-4 text-[#3A9B9F]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#213138] dark:text-white uppercase tracking-widest">Query History</h3>
                    <p className="text-[10px] font-bold text-gray-400">{recentLogs.length} recent queries</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#111] transition-colors"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-2">
                {recentLogs.length > 0 ? recentLogs.map((log) => (
                  <button
                    key={log.id}
                    onClick={() => loadLog(log)}
                    className="w-full flex items-start gap-3 p-4 rounded-2xl border border-gray-100 dark:border-[#1C1C1C] hover:border-[#3A9B9F]/30 hover:bg-[#3A9B9F]/5 transition-all group text-left"
                  >
                    <div className="h-8 w-8 rounded-xl bg-gray-50 dark:bg-[#111] flex items-center justify-center shrink-0 group-hover:bg-[#3A9B9F]/10 transition-colors mt-0.5">
                      <MessageSquare className="h-4 w-4 text-gray-400 group-hover:text-[#3A9B9F]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">{log.query}</p>
                      <p className="text-[10px] font-black text-gray-300 dark:text-[#444] mt-1 uppercase tracking-tighter">{formatTimestamp(log.created_at)}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#3A9B9F] shrink-0 mt-1 transition-colors" />
                  </button>
                )) : (
                  <div className="p-8 text-center">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">No history yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
