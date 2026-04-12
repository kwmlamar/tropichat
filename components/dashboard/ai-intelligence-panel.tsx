"use client"

import { useState, useEffect, useRef } from "react"
import {
  Brain,
  Lightning,
  Target,
  CheckCircle,
  WarningCircle,
  CaretRight,
  ArrowUp,
  Copy,
  Check,
  CaretDown,
  CaretUp,
  Sparkle,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getSupabase } from "@/lib/supabase"
import type { ConversationWithAccount } from "@/types/unified-inbox"
import ReactMarkdown from "react-markdown"
import { motion, AnimatePresence } from "framer-motion"

interface AIIntelligencePanelProps {
  conversation: ConversationWithAccount
  onRefreshCache?: () => void
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

const STARTER_PROMPTS = [
  "What's this lead's budget?",
  "Are they ready to book?",
  "Draft a follow-up message",
  "What tours did they ask about?",
  "Summarise the conversation",
  "What's the next best action?",
]

export function AIIntelligencePanel({ conversation, onRefreshCache }: AIIntelligencePanelProps) {
  // ── Analysis state ───────────────────────────────────────────────
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [summary, setSummary] = useState<any>(conversation.ai_summary || null)
  const [analysisOpen, setAnalysisOpen] = useState(true)

  // ── Chat state ───────────────────────────────────────────────────
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [query, setQuery] = useState("")
  const [loadingChat, setLoadingChat] = useState(false)
  const [pendingQuery, setPendingQuery] = useState("")
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset chat when conversation changes
  useEffect(() => {
    setChatHistory([])
    setQuery("")
    setPendingQuery("")
    setSummary(conversation.ai_summary || null)
    setAnalysisOpen(true)
  }, [conversation.id])

  useEffect(() => {
    setSummary(conversation.ai_summary || null)
  }, [conversation.ai_summary])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory, loadingChat])

  // Collapse analysis once chat starts
  useEffect(() => {
    if (chatHistory.length === 1) setAnalysisOpen(false)
  }, [chatHistory.length])

  const needsRefresh = () => {
    if (!conversation.ai_summary_updated_at || !conversation.last_message_at) return true
    return (
      new Date(conversation.last_message_at).getTime() >
      new Date(conversation.ai_summary_updated_at).getTime() + 5000
    )
  }

  // ── Handlers ────────────────────────────────────────────────────

  const handleGenerateAnalysis = async () => {
    setLoadingAnalysis(true)
    try {
      const { data: { session } } = await getSupabase().auth.getSession()
      const res = await fetch("/api/ai/intelligence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ conversationId: conversation.id }),
      })
      const data = await res.json()
      if (res.ok && data.intelligence) {
        setSummary(data.intelligence)
        setAnalysisOpen(true)
        toast.success("Analysis updated")
        onRefreshCache?.()
      } else {
        throw new Error(data.error || "Failed to generate")
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoadingAnalysis(false)
    }
  }

  const handleChat = async (customQuery?: string) => {
    const q = (customQuery ?? query).trim()
    if (!q || loadingChat) return

    setQuery("")
    setLoadingChat(true)
    setPendingQuery(q)

    const historyPayload = chatHistory.flatMap((m) => [
      { role: m.role === "user" ? ("user" as const) : ("ai" as const), content: m.content },
    ])

    try {
      const { data: { session } } = await getSupabase().auth.getSession()
      const res = await fetch("/api/ai/assistant/conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          conversationId: conversation.id,
          query: q,
          history: historyPayload,
        }),
      })
      const data = await res.json()
      if (data.response) {
        setChatHistory((prev) => [...prev, { role: "user", content: q }, { role: "assistant", content: data.response }])
      } else {
        toast.error("Assistant couldn't respond. Try again.")
      }
    } catch {
      toast.error("Something went wrong.")
    } finally {
      setLoadingChat(false)
      setPendingQuery("")
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    toast.success("Copied")
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Analysis Section ── */}
      <div className="flex-shrink-0 border-b border-gray-100 dark:border-[#1C1C1C]">

        {/* Outdated banner */}
        {summary && needsRefresh() && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/20 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <WarningCircle weight="fill" className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">New messages since last analysis</span>
            </div>
            <button
              onClick={handleGenerateAnalysis}
              disabled={loadingAnalysis}
              className="text-[10px] font-black text-amber-600 dark:text-amber-400 hover:underline uppercase tracking-wider"
            >
              Refresh
            </button>
          </div>
        )}

        {/* Analysis header row */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#007B85]/10 flex items-center justify-center flex-shrink-0">
              <Brain weight="duotone" className="h-3.5 w-3.5 text-[#007B85]" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-[#525252]">
              Lead Analysis
            </span>
          </div>
          <div className="flex items-center gap-1">
            {!summary ? (
              <button
                onClick={handleGenerateAnalysis}
                disabled={loadingAnalysis}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#007B85] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#006A73] disabled:opacity-50 transition-colors"
              >
                {loadingAnalysis ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Sparkle weight="fill" className="h-3 w-3" />
                  </motion.div>
                ) : (
                  <Lightning weight="fill" className="h-3 w-3" />
                )}
                Analyse
              </button>
            ) : (
              <>
                <button
                  onClick={handleGenerateAnalysis}
                  disabled={loadingAnalysis}
                  title="Regenerate analysis"
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 disabled:opacity-40 transition-colors"
                >
                  <Lightning weight="fill" className={cn("h-3.5 w-3.5", loadingAnalysis && "animate-pulse text-[#007B85]")} />
                </button>
                <button
                  onClick={() => setAnalysisOpen((v) => !v)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors"
                  title={analysisOpen ? "Collapse" : "Expand"}
                >
                  {analysisOpen ? <CaretUp weight="bold" className="h-3.5 w-3.5" /> : <CaretDown weight="bold" className="h-3.5 w-3.5" />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Analysis body */}
        <AnimatePresence initial={false}>
          {summary && analysisOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {loadingAnalysis ? (
                <div className="px-4 pb-4 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ) : (
                <div className="px-4 pb-4 space-y-3">
                  {/* Headline */}
                  <div className="bg-gradient-to-br from-[#007B85]/8 to-transparent border border-[#007B85]/15 rounded-xl p-3 relative overflow-hidden">
                    <div className="absolute top-1 right-2 opacity-10">
                      <Brain weight="fill" className="h-10 w-10 text-[#007B85]" />
                    </div>
                    <p className="text-[10px] text-[#007B85] uppercase tracking-widest font-black mb-1 flex items-center gap-1">
                      <Target className="h-2.5 w-2.5" /> Focus
                    </p>
                    <p className="text-[12px] font-semibold text-gray-800 dark:text-gray-200 leading-snug relative z-10">
                      {summary.headline}
                    </p>
                  </div>

                  {/* Lead details grid */}
                  {summary.leadDetails?.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {summary.leadDetails.map((d: any, i: number) => (
                        <div key={i} className="bg-gray-50 dark:bg-[#0C0C0C] border border-gray-100 dark:border-[#1C1C1C] rounded-lg p-2.5">
                          <p className="text-[9px] text-gray-400 dark:text-[#525252] uppercase tracking-wider font-bold mb-0.5">{d.label}</p>
                          <p className="text-[11px] font-semibold text-gray-900 dark:text-white truncate" title={d.value}>{d.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action plan */}
                  {summary.strategicContext && (
                    <div className="bg-gray-50 dark:bg-[#0C0C0C] border border-gray-100 dark:border-[#1C1C1C] rounded-xl p-3">
                      <p className="text-[9px] text-gray-400 dark:text-[#525252] uppercase tracking-widest font-black mb-1.5 flex items-center gap-1">
                        <CheckCircle weight="fill" className="h-2.5 w-2.5" /> Action Plan
                      </p>
                      <p className="text-[11px] text-gray-600 dark:text-[#A0A0A0] leading-relaxed">
                        {summary.strategicContext}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prompt to analyse if no summary yet */}
        {!summary && !loadingAnalysis && (
          <p className="px-4 pb-4 text-[11px] text-gray-400 dark:text-[#525252] leading-relaxed">
            Generate a lead snapshot, or jump straight into asking questions below.
          </p>
        )}
      </div>

      {/* ── Chat Section ── */}
      <div className="flex flex-col flex-1 min-h-0">

        {/* Chat header */}
        <div className="flex-shrink-0 px-4 py-2.5 flex items-center gap-2 border-b border-gray-100 dark:border-[#1C1C1C]">
          <div className="w-5 h-5 rounded-md bg-[#3A9B9F]/10 flex items-center justify-center flex-shrink-0">
            <Sparkle weight="duotone" className="h-3 w-3 text-[#3A9B9F]" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-[#525252]">
            Ask about this lead
          </span>
          {chatHistory.length > 0 && (
            <button
              onClick={() => setChatHistory([])}
              className="ml-auto text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Chat messages / empty state */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">

          {/* Empty state — starter prompts */}
          {chatHistory.length === 0 && !loadingChat && (
            <div className="space-y-2">
              <p className="text-[10px] text-gray-400 dark:text-[#525252] uppercase tracking-widest font-black mb-3">
                Suggested
              </p>
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleChat(prompt)}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl border border-gray-100 dark:border-[#1C1C1C] hover:border-[#3A9B9F]/40 hover:bg-[#3A9B9F]/5 transition-all group"
                >
                  <CaretRight weight="bold" className="h-3 w-3 text-gray-300 group-hover:text-[#3A9B9F] flex-shrink-0 transition-colors" />
                  <span className="text-[12px] font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                    {prompt}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Chat turns */}
          {chatHistory.map((msg, i) =>
            msg.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] bg-[#007B85] text-white rounded-2xl rounded-br-sm px-3 py-2">
                  <p className="text-[13px] font-medium leading-snug">{msg.content}</p>
                </div>
              </div>
            ) : (
              <div key={i} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#3A9B9F] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-[#3A9B9F]/20">
                  <Sparkle weight="fill" className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0 bg-gray-50 dark:bg-[#0C0C0C] border border-gray-100 dark:border-[#1C1C1C] rounded-2xl rounded-tl-sm px-3 py-2.5">
                  <div className="prose prose-xs dark:prose-invert max-w-none
                    prose-p:text-[12px] prose-p:leading-relaxed prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:my-1
                    prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-bold
                    prose-ul:my-1 prose-ul:pl-4 prose-li:text-[12px] prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:my-0.5
                    prose-headings:text-[12px] prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white prose-headings:my-1
                    prose-code:text-[11px] prose-code:bg-gray-100 dark:prose-code:bg-[#111] prose-code:px-1 prose-code:rounded">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  <button
                    onClick={() => handleCopy(msg.content, i)}
                    className="mt-2 flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {copiedIndex === i ? (
                      <><Check className="h-2.5 w-2.5 text-green-500" /><span className="text-green-500">Copied</span></>
                    ) : (
                      <><Copy className="h-2.5 w-2.5" /> Copy</>
                    )}
                  </button>
                </div>
              </div>
            )
          )}

          {/* Loading — show pending query + skeleton */}
          {loadingChat && (
            <>
              <div className="flex justify-end">
                <div className="max-w-[85%] bg-[#007B85] text-white rounded-2xl rounded-br-sm px-3 py-2">
                  <p className="text-[13px] font-medium leading-snug">{pendingQuery}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#3A9B9F] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-[#3A9B9F]/20">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}>
                    <Sparkle weight="fill" className="h-3.5 w-3.5 text-white" />
                  </motion.div>
                </div>
                <div className="flex-1 bg-gray-50 dark:bg-[#0C0C0C] border border-gray-100 dark:border-[#1C1C1C] rounded-2xl rounded-tl-sm px-3 py-3 space-y-2 animate-pulse">
                  <div className="h-2.5 bg-gray-200 dark:bg-[#1C1C1C] rounded-full w-4/5" />
                  <div className="h-2.5 bg-gray-200 dark:bg-[#1C1C1C] rounded-full w-2/3" />
                  <div className="h-2.5 bg-gray-200 dark:bg-[#1C1C1C] rounded-full w-3/4" />
                </div>
              </div>
            </>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input bar ── */}
        <div className="flex-shrink-0 border-t border-gray-100 dark:border-[#1C1C1C] p-3">
          <div className={cn(
            "flex items-center gap-2 bg-gray-50 dark:bg-[#0C0C0C] border rounded-2xl px-3 py-1.5 transition-all",
            "border-gray-200 dark:border-[#1C1C1C] focus-within:border-[#3A9B9F]/50 focus-within:ring-1 focus-within:ring-[#3A9B9F]/20"
          )}>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleChat()}
              placeholder={chatHistory.length > 0 ? "Ask a follow-up…" : "Ask anything about this lead…"}
              className="flex-1 bg-transparent py-1.5 text-[13px] font-medium outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#525252]"
            />
            <button
              onClick={() => handleChat()}
              disabled={!query.trim() || loadingChat}
              className={cn(
                "w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                query.trim() && !loadingChat
                  ? "bg-[#3A9B9F] text-white shadow-sm shadow-[#3A9B9F]/20 hover:bg-[#2F8488] active:scale-95"
                  : "bg-gray-200 dark:bg-[#1C1C1C] text-gray-400 opacity-50"
              )}
            >
              <ArrowUp weight="bold" className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[9px] text-gray-300 dark:text-[#333] text-center mt-1.5 font-medium">
            Context-aware · scoped to this conversation
          </p>
        </div>

      </div>
    </div>
  )
}
