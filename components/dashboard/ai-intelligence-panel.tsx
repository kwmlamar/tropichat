"use client"

import { useState, useEffect } from "react"
import { Brain, Lightning, Target, CheckCircle, WarningCircle, CaretRight } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import type { ConversationWithAccount } from "@/types/unified-inbox"

interface AIIntelligencePanelProps {
  conversation: ConversationWithAccount;
  onRefreshCache?: () => void;
}

export function AIIntelligencePanel({ conversation, onRefreshCache }: AIIntelligencePanelProps) {
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<any>(conversation.ai_summary || null)
  
  // Sync if prop changes (e.g. from websocket update)
  useEffect(() => {
    setSummary(conversation.ai_summary || null)
  }, [conversation.ai_summary])

  const needsRefresh = () => {
    if (!conversation.ai_summary_updated_at || !conversation.last_message_at) return true;
    const cacheTime = new Date(conversation.ai_summary_updated_at).getTime()
    const lastMsgTime = new Date(conversation.last_message_at).getTime()
    // give 5 seconds buffer
    return lastMsgTime > cacheTime + 5000;
  }

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conversation.id })
      })
      const data = await res.json()
      if (res.ok && data.intelligence) {
        setSummary(data.intelligence)
        toast.success("Intelligence updated")
        if (onRefreshCache) onRefreshCache()
      } else {
        throw new Error(data.error || "Failed to generate")
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/3 mb-2" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  // Blank State / Outdated State
  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#007B85]/20 to-transparent flex items-center justify-center mb-4 border border-[#007B85]/20">
          <Brain weight="duotone" className="h-6 w-6 text-[#007B85]" />
        </div>
        <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white mb-2 tracking-tight">AI Intelligence</h3>
        <p className="text-[12px] text-gray-500 dark:text-[#888] mb-6 leading-relaxed max-w-[200px]">
          Generate an instant summary and lead details from this conversation.
        </p>
        <Button onClick={handleGenerate} className="w-full h-10 rounded-xl bg-[#007B85] hover:bg-[#006A73] text-white font-medium shadow-sm">
          <Lightning weight="fill" className="h-4 w-4 mr-2" />
          Analyze Lead
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Update Banner if outdated */}
      {needsRefresh() && (
        <div className="bg-[#007B85]/10 border-b border-[#007B85]/20 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WarningCircle className="h-4 w-4 text-[#007B85]" />
            <span className="text-[11px] text-[#007B85] font-medium tracking-wide">New messages since last analysis</span>
          </div>
          <Button onClick={handleGenerate} variant="ghost" size="sm" className="h-6 text-[11px] text-[#007B85] hover:bg-[#007B85]/20 px-2 rounded-md">
            Update
          </Button>
        </div>
      )}

      <div className="p-5 space-y-6">
        {/* Headline */}
        <div className="bg-gradient-to-br from-[#007B85]/10 via-transparent to-transparent border border-[#007B85]/20 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-20">
            <Brain weight="fill" className="h-16 w-16 text-[#007B85]" />
          </div>
          <p className="text-[10px] text-[#007B85] uppercase tracking-widest font-bold mb-2 flex items-center gap-1.5">
            <Target className="h-3 w-3" /> Focus
          </p>
          <p className="text-[13px] font-medium text-gray-900 dark:text-white relative z-10 leading-relaxed">
            {summary.headline}
          </p>
        </div>

        {/* Extracted Details */}
        <div>
          <p className="text-[10px] text-gray-400 dark:text-[#525252] uppercase tracking-widest font-medium mb-3 pl-1">
            Lead Breakdown
          </p>
          <div className="grid grid-cols-2 gap-2">
            {summary.leadDetails?.map((detail: any, i: number) => (
              <div key={i} className="bg-gray-50 dark:bg-[#0C0C0C] border border-gray-100 dark:border-[#1C1C1C] rounded-xl p-3 flex flex-col justify-center min-h-[64px]">
                <p className="text-[10px] text-gray-400 dark:text-[#525252] uppercase tracking-wide font-medium mb-0.5">{detail.label}</p>
                <p className="text-[12px] font-semibold text-gray-900 dark:text-white truncate" title={detail.value}>
                  {detail.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Context */}
        <div className="bg-gray-50 dark:bg-[#0C0C0C] border border-gray-100 dark:border-[#1C1C1C] rounded-xl p-4">
          <p className="text-[10px] text-gray-400 dark:text-[#525252] uppercase tracking-widest font-medium mb-2 flex items-center gap-1.5">
            <CheckCircle weight="fill" className="h-3 w-3 text-gray-400 dark:text-[#525252]" /> Action Plan
          </p>
          <p className="text-[12px] text-gray-600 dark:text-[#A0A0A0] leading-relaxed">
            {summary.strategicContext}
          </p>
        </div>

        {/* Future expansion: Chat Mini */}
        {/*
        <div className="mt-4 border-t border-gray-100 dark:border-[#1C1C1C] pt-4">
          <p className="text-[10px] text-gray-400 dark:text-[#525252] uppercase tracking-widest font-medium mb-2 pl-1">Ask AI</p>
          <div className="flex bg-gray-50 dark:bg-[#111] rounded-xl border border-gray-100 dark:border-[#222] p-1.5">
            <input type="text" placeholder="e.g. What price did I quote?" className="flex-1 bg-transparent text-[12px] px-2 outline-none text-gray-900 dark:text-white" />
            <Button size="icon" className="h-8 w-8 rounded-lg bg-[#007B85] hover:bg-[#006A73] text-white">
              <CaretRight weight="bold" />
            </Button>
          </div>
        </div>
        */}
      </div>
    </div>
  )
}
