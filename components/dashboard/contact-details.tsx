"use client"

import { useState } from "react"
import {
  User,
  Phone,
  Mail,
  Tag,
  FileText,
  Calendar,
  MessageSquare,
  Ban,
  Download,
  Trash2,
  Plus,
  X,
  Edit2,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils"
import type { Contact, ConversationWithContact } from "@/types/database"

interface ContactDetailsProps {
  conversation: ConversationWithContact | null
  onUpdateContact: (updates: Partial<Contact>) => void
  loading?: boolean
}

export function ContactDetails({
  conversation,
  onUpdateContact,
  loading,
}: ContactDetailsProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editedNotes, setEditedNotes] = useState("")
  const [newTag, setNewTag] = useState("")

  const contact = conversation?.contact

  const handleSaveName = () => {
    if (editedName.trim() && contact) {
      onUpdateContact({ name: editedName.trim() })
    }
    setIsEditingName(false)
  }

  const handleSaveNotes = () => {
    if (contact) {
      onUpdateContact({ notes: editedNotes })
    }
    setIsEditingNotes(false)
  }

  const handleAddTag = () => {
    if (newTag.trim() && contact) {
      const currentTags = contact.tags || []
      if (!currentTags.includes(newTag.trim())) {
        onUpdateContact({ tags: [...currentTags, newTag.trim()] })
      }
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    if (contact) {
      const currentTags = contact.tags || []
      onUpdateContact({ tags: currentTags.filter((tag) => tag !== tagToRemove) })
    }
  }

  const handleBlockContact = () => {
    if (contact && window.confirm("Are you sure you want to block this contact?")) {
      onUpdateContact({ is_blocked: !contact.is_blocked })
    }
  }

  if (!conversation || !contact) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-8 text-center">
        <div className="rounded-full bg-gray-100 p-4 mb-4">
          <User className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="font-medium text-gray-900 mb-1">No contact selected</h3>
        <p className="text-sm text-gray-500">
          Select a conversation to view contact details
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col items-center">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-6 w-32 mt-3" />
          <Skeleton className="h-4 w-24 mt-1" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 overflow-y-auto">
      {/* Contact Header */}
      <div className="p-6 border-b border-gray-200 text-center">
        <Avatar
          fallback={contact.name || contact.phone_number}
          size="xl"
          className="mx-auto"
        />

        <div className="mt-4">
          {isEditingName ? (
            <div className="flex items-center justify-center gap-2">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="max-w-[200px] text-center"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                className="p-1 text-[#3A9B9F] hover:bg-teal-50 rounded"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                {contact.name || "Unknown"}
              </h2>
              <button
                onClick={() => {
                  setEditedName(contact.name || "")
                  setIsEditingName(true)
                }}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded"
              >
                <Edit2 className="h-3 w-3" />
              </button>
            </div>
          )}
          <p className="text-sm text-gray-500 mt-1">{contact.phone_number}</p>
        </div>

        {contact.is_blocked && (
          <Badge variant="danger" className="mt-2">
            Blocked
          </Badge>
        )}
      </div>

      {/* Contact Info */}
      <div className="p-6 space-y-6">
        {/* Phone */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gray-100 p-2">
            <Phone className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Phone</p>
            <p className="text-sm font-medium text-gray-900">{contact.phone_number}</p>
          </div>
        </div>

        {/* Email */}
        {contact.email && (
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <Mail className="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900">{contact.email}</p>
            </div>
          </div>
        )}

        {/* Tags */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-4 w-4 text-gray-400" />
            <p className="text-xs font-medium text-gray-500 uppercase">Tags</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {contact.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="group">
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <div className="flex items-center gap-1">
              <Input
                placeholder="Add tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                className="h-7 w-24 text-xs"
              />
              <button
                onClick={handleAddTag}
                className="p-1 text-[#3A9B9F] hover:bg-teal-50 rounded"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <p className="text-xs font-medium text-gray-500 uppercase">Notes</p>
            </div>
            {!isEditingNotes && (
              <button
                onClick={() => {
                  setEditedNotes(contact.notes || "")
                  setIsEditingNotes(true)
                }}
                className="text-xs text-[#3A9B9F] hover:underline"
              >
                Edit
              </button>
            )}
          </div>
          {isEditingNotes ? (
            <div className="space-y-2">
              <Textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                placeholder="Add notes about this contact..."
                className="min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveNotes} className="bg-[#3A9B9F]">
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingNotes(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              {contact.notes || "No notes yet"}
            </p>
          )}
        </div>

        {/* Stats */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-3">Statistics</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-3 w-3 text-gray-400" />
                <p className="text-xs text-gray-500">First Contact</p>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {contact.first_message_at
                  ? formatDate(contact.first_message_at)
                  : "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-3 w-3 text-gray-400" />
                <p className="text-xs text-gray-500">Messages</p>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {(contact.total_messages_sent || 0) + (contact.total_messages_received || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-gray-200 space-y-2">
          <Button variant="outline" className="w-full justify-start" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export conversation
          </Button>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start",
              contact.is_blocked ? "text-green-600" : "text-red-600"
            )}
            size="sm"
            onClick={handleBlockContact}
          >
            <Ban className="h-4 w-4 mr-2" />
            {contact.is_blocked ? "Unblock contact" : "Block contact"}
          </Button>
        </div>
      </div>
    </div>
  )
}
