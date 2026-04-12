"use client"

import { useState, useRef, useEffect } from "react"
import {
  WarningCircle as AlertCircle,
  Archive,
  At as AtSign,
  CalendarPlus,
  Check,
  Checks as CheckCheck,
  Clock,
  Camera,
  FileText,
  Image as ImageIcon,
  Tray as Inbox,
  ArrowsOut as Maximize2,
  Microphone as Mic,
  DotsThreeVertical as MoreVertical,
  Paperclip,
  Plus,
  PaperPlaneRight as Send,
  Shield,
  Smiley as Smile,
  CaretLeft as ChevronLeft,
  Sparkle,
  Trash,
} from "@phosphor-icons/react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown"
import { SkeletonMessage } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { ChannelIcon, getChannelLabel } from "./channel-icon"
import { cn, formatMessageTime, formatDateDivider, getConversationDisplayName } from "@/lib/utils"
import { getAIResponseSuggestion } from "@/lib/unified-inbox"
import { PlanGate } from "@/components/billing/PlanGate"
import { Tag } from "@/types/unified-inbox"
import type { UnifiedMessage, ConversationWithAccount, MessageDeliveryStatus } from "@/types/unified-inbox"
import { Tag as TagIcon, X } from "@phosphor-icons/react"

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
  plan?: string
  onBack?: () => void
  allTags?: Tag[]
  onAddTag?: (tagId: string) => void
  onRemoveTag?: (tagId: string) => void
  onCreateTag?: (name: string, color: string) => void
  onDeleteTag?: (tagId: string) => void
  onMarkAsUnread?: () => void
  onStatusChange?: (status: import("@/types/unified-inbox").ConversationStatus) => void
  onOpenContactDrawer?: () => void
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
  plan,
  onBack,
  allTags = [],
  onAddTag,
  onRemoveTag,
  onCreateTag,
  onDeleteTag,
  onMarkAsUnread,
  onStatusChange,
  onOpenContactDrawer,
}: UnifiedMessageThreadProps) {
  const [messageText, setMessageText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" })
  }, [messages])

  const [newTagName, setNewTagName] = useState("")
  const [selectedColor, setSelectedColor] = useState("#3A9B9F")
  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const [showCannedResponses, setShowCannedResponses] = useState(false)
  const [cannedSearch, setCannedSearch] = useState("")

  const CANNED_STORAGE_KEY = "tropichat_canned_responses"
  const [cannedResponses, setCannedResponses] = useState<{ id: string; title: string; body: string }[]>(() => {
    if (typeof window === "undefined") return []
    try {
      return JSON.parse(localStorage.getItem(CANNED_STORAGE_KEY) || "[]")
    } catch { return [] }
  })
  const [isAddingCanned, setIsAddingCanned] = useState(false)
  const [newCannedTitle, setNewCannedTitle] = useState("")
  const [newCannedBody, setNewCannedBody] = useState("")

  const saveCannedResponses = (updated: typeof cannedResponses) => {
    setCannedResponses(updated)
    localStorage.setItem(CANNED_STORAGE_KEY, JSON.stringify(updated))
  }

  const handleAddCanned = () => {
    if (!newCannedTitle.trim() || !newCannedBody.trim()) return
    saveCannedResponses([...cannedResponses, { id: Date.now().toString(), title: newCannedTitle.trim(), body: newCannedBody.trim() }])
    setNewCannedTitle("")
    setNewCannedBody("")
    setIsAddingCanned(false)
  }

  const handleDeleteCanned = (id: string) => {
    saveCannedResponses(cannedResponses.filter(r => r.id !== id))
  }

  const filteredCanned = cannedSearch
    ? cannedResponses.filter(r => r.title.toLowerCase().includes(cannedSearch.toLowerCase()) || r.body.toLowerCase().includes(cannedSearch.toLowerCase()))
    : cannedResponses

  const tagColors = ['#3A9B9F', '#FF7E36', '#9B59B6', '#E74C3C', '#2ECC71', '#F1C40F', '#007B85', '#E1306C', '#0084FF']

  // Sync reason state when conversation changes

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
  
  const handleGenerateAISuggestion = async () => {
    if (!conversation || isGeneratingAI) return
    
    setIsGeneratingAI(true)
    const { suggestion, error } = await getAIResponseSuggestion(conversation.id)
    setIsGeneratingAI(false)
    
    if (error) {
      toast.error(error)
    } else if (suggestion) {
      setMessageText(suggestion)
      // Focus textarea after a short delay to allow state to settle
      setTimeout(() => textareaRef.current?.focus(), 50)
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
        return <CheckCheck className="h-3 w-3 text-[#0084FF]" />
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

  // Welcome empty state
  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-black p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-5 dark:opacity-[0.02] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative z-10 max-w-lg w-full"
        >
          <div className="bg-white/40 dark:bg-[#1A1A1A]/40 backdrop-blur-xl rounded-[40px] border border-gray-100/50 dark:border-[#222222]/50 p-12 shadow-2xl shadow-sky-900/5 dark:shadow-black/20">
            <div className="mb-10 relative">
              <div className="relative inline-block">
                <Image
                  src="/tropichat-logo.png"
                  alt="TropiChat"
                  width={96}
                  height={96}
                  className="h-24 w-24 object-contain scale-110"
                />
              </div>
            </div>

            <h3 className="text-3xl font-bold text-[#213138] dark:text-gray-100 mb-4 tracking-tight" style={{ fontFamily: 'var(--font-lexend)' }}>
              Select a conversation
            </h3>
            <p className="text-[17px] text-gray-500 dark:text-gray-400 mb-8 leading-relaxed max-w-sm mx-auto">
              Choose a customer from the list to start chatting. Your responses will be sent via their original platform.
            </p>

            {/* Quick action hints */}
            <div className="grid grid-cols-2 gap-2 mb-6 text-left">
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-[#222]">
                <div className="p-1.5 rounded-lg bg-[#007B85]/10 text-[#007B85] flex-shrink-0 mt-0.5">
                  <Inbox className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-700 dark:text-gray-200">Browse inbox</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Pick any conversation on the left</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-[#222]">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 flex-shrink-0 mt-0.5">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-700 dark:text-gray-200">Quick replies</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Save templates in the compose bar</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-[#222]">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 flex-shrink-0 mt-0.5">
                  <Sparkle className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-700 dark:text-gray-200">AI smart reply</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Tap ✦ to generate a reply</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-[#222]">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 flex-shrink-0 mt-0.5">
                  <Shield className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-700 dark:text-gray-200">Keyboard nav</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">↑ ↓ to browse · Esc to close</p>
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-[#222222]">
              <div className="p-1.5 rounded-lg bg-[#007B85]/10 text-[#007B85]">
                <Inbox className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-[0.2em]">Unified Inbox</span>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }


  return (
    <div className="flex flex-col h-full bg-white dark:bg-black relative overflow-hidden h-[100dvh]">

      {/* Header */}
      <div className="fixed lg:sticky top-0 left-0 right-0 lg:left-auto lg:right-auto z-30 flex-shrink-0 bg-white dark:bg-black border-b border-gray-100 dark:border-[#222222] shadow-sm">
        <div className="h-[env(safe-area-inset-top)] w-full" />
        <div className="flex items-center justify-between px-4 lg:px-6 py-2.5 lg:py-4">
          <div className="flex items-center gap-2 lg:gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="lg:hidden p-2 -ml-2 mr-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
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
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-[#213138] dark:text-gray-100 text-[15px] lg:text-[16px] truncate leading-tight">
                {getConversationDisplayName(conversation)}
              </h2>
              {conversation.status && conversation.status !== 'open' && (
                <span className={cn(
                  "flex-shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter",
                  conversation.status === 'pending'
                    ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                )}>
                  {conversation.status}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#007B85] font-bold uppercase tracking-wider">
              {getChannelLabel(conversation.channel_type)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Create Booking button */}
          {onCreateBooking && (
            <PlanGate plan={plan} feature="canUseBookingPage" variant="inline">
              <button
                onClick={onCreateBooking}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#3A9B9F]/10 text-[#3A9B9F] hover:bg-[#3A9B9F]/20 transition-colors text-xs font-black uppercase tracking-widest"
                title="Create a booking from this conversation"
              >
                <CalendarPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Book</span>
              </button>
            </PlanGate>
          )}

          {/* Tags Dropdown */}
          <Dropdown
            align="right"
            trigger={
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-xs font-black uppercase tracking-widest">
                <TagIcon weight="bold" className="h-4 w-4" />
                <span className="hidden sm:inline">Tags</span>
              </button>
            }
          >
            <div className="p-2 min-w-[220px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-2 flex justify-between items-center">
                <span>Assign Tags</span>
                {isCreatingTag && (
                  <button onClick={() => setIsCreatingTag(false)} className="text-[9px] text-[#007B85] hover:underline">Cancel</button>
                )}
              </p>
              
              {!isCreatingTag ? (
                <>
                  <div className="space-y-0.5 mb-2 max-h-[200px] overflow-y-auto no-scrollbar">
                    {allTags.map(tag => {
                      const isAssigned = conversation.tags?.some(t => t.id === tag.id)
                      return (
                        <div key={tag.id} className="group/tag flex items-center gap-1">
                          <button
                            onClick={() => isAssigned ? onRemoveTag?.(tag.id) : onAddTag?.(tag.id)}
                            className={cn(
                              "flex-1 flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-all text-left",
                              isAssigned ? "bg-[#007B85]/5 dark:bg-[#007B85]/10 font-bold" : "hover:bg-gray-50 dark:hover:bg-white/5"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: tag.color }} />
                              <span className="text-gray-700 dark:text-gray-300 text-[13px]">{tag.name}</span>
                            </div>
                            {isAssigned && <Check weight="bold" className="h-3 w-3 text-[#007B85]" />}
                          </button>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); if(confirm(`Delete tag "${tag.name}"?`)) onDeleteTag?.(tag.id) }}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover/tag:opacity-100 transition-all"
                            title="Delete this tag"
                          >
                            <Trash weight="bold" className="h-3 w-3" />
                          </button>
                        </div>
                      )
                    })}
                    {allTags.length === 0 && (
                      <p className="text-[11px] text-gray-400 px-2 py-4 text-center italic">No tags created yet</p>
                    )}
                  </div>
                  <DropdownSeparator />
                  <button 
                    onClick={() => setIsCreatingTag(true)}
                    className="w-full flex items-center gap-2 px-2 py-2 text-xs font-bold text-[#007B85] hover:bg-[#007B85]/5 rounded-lg transition-all"
                  >
                    <Plus weight="bold" className="h-3 w-3" />
                    New Tag
                  </button>
                </>
              ) : (
                <div className="space-y-3 p-1">
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Tag Name</p>
                    <input 
                      autoFocus
                      placeholder="e.g. Follow-up"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border-transparent focus:border-[#007B85] rounded-lg px-2 py-1.5 text-xs text-gray-900 dark:text-white outline-none border transition-all"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Color</p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {tagColors.map(color => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center",
                            selectedColor === color ? "border-gray-900 dark:border-white scale-110 shadow-sm" : "border-transparent hover:scale-105"
                          )}
                          style={{ backgroundColor: color }}
                        >
                          {selectedColor === color && <Check weight="bold" className="h-2.5 w-2.5 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button 
                    disabled={!newTagName.trim()}
                    onClick={() => {
                      onCreateTag?.(newTagName.trim(), selectedColor)
                      setNewTagName("")
                      setIsCreatingTag(false)
                    }}
                    className="w-full py-2 bg-[#007B85] text-white text-[11px] font-black uppercase tracking-widest rounded-lg shadow-sm hover:bg-[#00666D] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Create Tag
                  </button>
                </div>
              )}
            </div>
          </Dropdown>


          {/* Contact details button — visible on md, hidden on lg (panel always shown there) */}
          <button
            onClick={onOpenContactDrawer}
            className="hidden md:flex lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            title="Contact details"
          >
            <Shield className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>

          <Dropdown
            align="right"
            trigger={
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                <MoreVertical className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            }
          >
            {/* Status options */}
            {onStatusChange && (
              <>
                {conversation.status !== 'open' && (
                  <DropdownItem onClick={() => onStatusChange('open')}>
                    Reopen conversation
                  </DropdownItem>
                )}
                {conversation.status !== 'pending' && (
                  <DropdownItem onClick={() => onStatusChange('pending')}>
                    Mark as pending
                  </DropdownItem>
                )}
                {conversation.status !== 'resolved' && (
                  <DropdownItem onClick={() => onStatusChange('resolved')}>
                    Mark as resolved
                  </DropdownItem>
                )}
                <DropdownSeparator />
              </>
            )}
            {onMarkAsUnread && (
              <DropdownItem onClick={onMarkAsUnread}>
                Mark as unread
              </DropdownItem>
            )}
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
    </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 pt-[72px] lg:pt-4 relative z-10 scrollbar-hide overscroll-contain">
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
                  className="text-sm text-[#007B85] hover:underline"
                >
                  Load earlier messages
                </button>
              </div>
            )}

            {/* Date divider */}
            {groupedMessages.map((group) => (
              <div key={group.date}>
                <div className="flex items-center justify-center my-4">
                  <span className="px-3 py-1 bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#1C1C1C] rounded-full text-[11px] font-medium text-gray-500 dark:text-[#525252]">
                    {formatDateDivider(group.date)}
                  </span>
                </div>

                <div className="space-y-4">
                  {group.messages.map((message) => {
                    const isOutbound = message.sender_type === "business"
                    const mediaUrl = message.metadata?.media_url as string | undefined
                    const mediaMime = message.metadata?.media_mime_type as string | undefined
                    const isImage = mediaMime?.startsWith("image/") || message.message_type === "image"
                    const cleanContent = message.content?.replace(/^\[image\]$|^\[sticker\]$|^\[video\]$/i, "").trim()
                    const isImageOnly = isImage && !cleanContent

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex mb-1",
                          isOutbound ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "relative transition-all overflow-hidden",
                            isImageOnly 
                              ? "rounded-[18px] group shadow-sm hover:shadow-md border border-gray-100 dark:border-[#1C1C1C]" 
                              : cn(
                                  "max-w-[85%] sm:max-w-[75%] rounded-[20px] px-4 py-2 shadow-sm",
                                  isOutbound
                                    ? "bg-[#007B85] text-white rounded-br-sm"
                                    : "bg-slate-100 dark:bg-[#111] text-slate-900 dark:text-white rounded-bl-sm border border-slate-200/50 dark:border-[#1C1C1C]"
                                )
                          )}
                        >

                          {/* Media preview */}
                          {mediaUrl && (
                            <div className={cn(isImageOnly ? "" : "mb-2")}>
                              {isImage ? (
                                <div className="relative">
                                  <img
                                    src={mediaUrl}
                                    alt="Media"
                                    className={cn(
                                      "max-w-full block",
                                      isImageOnly ? "max-h-[320px] w-full object-cover" : "rounded-lg"
                                    )}
                                  />
                                  {isImageOnly && (
                                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-md text-white/90 text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                      <span>{formatMessageTime(message.sent_at)}</span>
                                      {isOutbound && getStatusIcon(message.status)}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <a
                                  href={mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm underline py-1"
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
                            <div className="mb-1 py-1 px-4">
                              <ImageIcon className="h-8 w-8 opacity-60" />
                            </div>
                          )}

                          {message.message_type === "location" && (
                            <div className="mb-1 text-sm opacity-80 pt-1 px-4">
                              📍 {message.metadata?.location_name || "Location"}
                            </div>
                          )}

                          {/* Message content */}
                          {cleanContent && (
                            <div className={cn("pb-1", isImageOnly ? "px-4 pt-1" : "")}>
                              <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium text-inherit">
                                {cleanContent}
                              </p>
                            </div>
                          )}

                          {/* Failed indicator */}
                          {message.status === "failed" && message.error_message && (
                            <p
                              className={cn(
                                "text-xs mt-1 px-4 pb-2",
                                isOutbound ? "text-red-200" : "text-red-500"
                              )}
                            >
                              ⚠ {message.error_message}
                            </p>
                          )}

                          {/* Footer: time + status (Hidden if image only as it's overlaid) */}
                          {!isImageOnly && (
                            <div
                              className={cn(
                                "flex items-center gap-1 mt-1 text-[10px]",
                                isOutbound
                                  ? "text-white/70 justify-end"
                                  : "text-gray-500"
                              )}
                            >
                              <span>{formatMessageTime(message.sent_at)}</span>
                              {isOutbound && getStatusIcon(message.status)}
                            </div>
                          )}
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
      <div className="flex-shrink-0 bg-white dark:bg-black border-t border-gray-100 dark:border-[#222222] relative z-20 pb-safe">
        <div className="p-2 lg:p-3 flex items-end gap-2">
          {/* Canned Responses Dropdown */}
          <Dropdown
            align="left"
            trigger={
              <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-[#007B85] transition-colors shrink-0 mb-0.5" title="Quick replies">
                <FileText className="w-6 h-6" />
              </button>
            }
          >
            <div className="w-72 p-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2 mb-2 flex items-center justify-between">
                <span>Quick Replies</span>
                <button
                  onClick={() => setIsAddingCanned(v => !v)}
                  className="text-[#007B85] hover:underline text-[9px]"
                >
                  {isAddingCanned ? "Cancel" : "+ New"}
                </button>
              </p>

              {isAddingCanned && (
                <div className="mb-2 space-y-1.5 p-1">
                  <input
                    autoFocus
                    placeholder="Title (e.g. Tour info)"
                    value={newCannedTitle}
                    onChange={e => setNewCannedTitle(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-[#007B85] rounded-lg px-2 py-1.5 text-xs text-gray-900 dark:text-white outline-none transition-all"
                  />
                  <textarea
                    placeholder="Message body…"
                    value={newCannedBody}
                    onChange={e => setNewCannedBody(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-[#007B85] rounded-lg px-2 py-1.5 text-xs text-gray-900 dark:text-white outline-none transition-all resize-none"
                  />
                  <button
                    onClick={handleAddCanned}
                    disabled={!newCannedTitle.trim() || !newCannedBody.trim()}
                    className="w-full py-1.5 bg-[#007B85] text-white text-[11px] font-black uppercase tracking-widest rounded-lg disabled:opacity-40"
                  >
                    Save
                  </button>
                </div>
              )}

              {!isAddingCanned && cannedResponses.length > 3 && (
                <input
                  placeholder="Search replies…"
                  value={cannedSearch}
                  onChange={e => setCannedSearch(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border-transparent rounded-lg px-2 py-1.5 text-xs mb-1.5 outline-none dark:text-white"
                />
              )}

              <div className="max-h-52 overflow-y-auto space-y-0.5">
                {filteredCanned.map(r => (
                  <div key={r.id} className="group/cr flex items-start gap-1">
                    <button
                      onClick={() => {
                        setMessageText(r.body)
                        setShowCannedResponses(false)
                        setTimeout(() => textareaRef.current?.focus(), 50)
                      }}
                      className="flex-1 text-left px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                    >
                      <p className="text-[12px] font-bold text-gray-800 dark:text-gray-200 leading-tight">{r.title}</p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">{r.body}</p>
                    </button>
                    <button
                      onClick={() => handleDeleteCanned(r.id)}
                      className="p-1.5 mt-1 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg opacity-0 group-hover/cr:opacity-100 transition-all"
                    >
                      <Trash weight="bold" className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {filteredCanned.length === 0 && (
                  <p className="text-[11px] text-gray-400 text-center py-4 italic">
                    {cannedSearch ? "No matches" : "No quick replies yet — add one above"}
                  </p>
                )}
              </div>
            </div>
          </Dropdown>

          <div className="flex-1 bg-white dark:bg-[#0C0C0C] rounded-3xl border border-gray-300/60 dark:border-[#1C1C1C] flex items-end pl-1 pr-1.5 shadow-sm min-h-[40px] focus-within:ring-1 focus-within:ring-[#007B85] focus-within:border-[#007B85]">
            <Textarea
              ref={textareaRef}
              placeholder=""
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 border-0 focus-visible:ring-0 shadow-none px-3 py-[9px] min-h-[40px] max-h-[120px] resize-none bg-transparent text-[15px] dark:text-white leading-snug overflow-y-auto"
              rows={1}
              style={{ height: "40px" }}
            />
            <button className="p-2 mb-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0" title="Attachments">
              <Paperclip className="w-5 h-5" />
            </button>
          </div>

          {messageText.trim() ? (
            <button
              onClick={handleSend}
              disabled={isSending}
              className="mb-1 p-2.5 bg-[#0084FF] text-white rounded-full shrink-0 flex items-center justify-center transition-all hover:bg-[#0073E6] active:scale-95 shadow-md disabled:bg-gray-300"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          ) : (
            <div className="flex items-center gap-1 shrink-0 mb-0.5">
              <PlanGate plan={plan} feature="canUseSmartReply" variant="inline">
                <button
                  onClick={handleGenerateAISuggestion}
                  disabled={isGeneratingAI}
                  className={cn(
                    "p-2 text-[#3A9B9F] hover:text-[#2F8488] transition-all relative overflow-hidden group rounded-xl",
                    isGeneratingAI && "animate-pulse opacity-50"
                  )}
                  title="Generate Smart Reply"
                >
                  {isGeneratingAI ? (
                    <div className="flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        <Sparkle weight="bold" className="w-6 h-6" />
                      </motion.div>
                    </div>
                  ) : (
                    <Sparkle weight="bold" className="w-6 h-6 group-hover:scale-110 group-active:scale-90" />
                  )}
                </button>
              </PlanGate>
              <button
                onClick={() => toast.info("Camera coming soon")}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                title="Send photo"
              >
                <Camera className="w-6 h-6" />
              </button>
              <button
                onClick={() => toast.info("Voice messages coming soon")}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                title="Voice message"
              >
                <Mic className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
