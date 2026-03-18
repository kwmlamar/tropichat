"use client"

import { useState, useEffect } from "react"
import {
  Zap,
  User,
  Search,
  Plus,
  MoreVertical,
  Phone,
  Mail,
  Tag,
  Trash2,
  Download,
  Filter,
  MessageCircle,
  Instagram,
  Facebook,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Modal, ModalFooter } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown"
import { Skeleton } from "@/components/ui/skeleton"
import { getContacts, updateContact } from "@/lib/supabase"
import { formatDate, formatDistanceToNow, cn } from "@/lib/utils"
import { useDebounce } from "@/lib/hooks"
import { toast } from "sonner"
import type { Contact } from "@/types/database"

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const debouncedSearch = useDebounce(searchQuery, 300)

  // Fetch contacts
  useEffect(() => {
    async function fetchContacts() {
      setLoading(true)
      const { data, error } = await getContacts(debouncedSearch)

      if (error) {
        toast.error("Failed to load contacts")
      } else {
        setContacts(data)
      }

      setLoading(false)
    }

    fetchContacts()
  }, [debouncedSearch])

  const handleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(contacts.map((c) => c.id))
    }
  }

  const handleSelectContact = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    )
  }

  const handleBlockContact = async (contact: Contact) => {
    const { error } = await updateContact(contact.id, {
      is_blocked: !contact.is_blocked,
    })

    if (error) {
      toast.error("Failed to update contact")
    } else {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === contact.id ? { ...c, is_blocked: !c.is_blocked } : c
        )
      )
      toast.success(
        contact.is_blocked ? "Contact unblocked" : "Contact blocked"
      )
    }
  }

  const handleExportContacts = () => {
    const dataToExport = selectedContacts.length > 0
      ? contacts.filter((c) => selectedContacts.includes(c.id))
      : contacts

    const csv = [
      ["Name", "Phone", "Channel", "Email", "Tags", "First Contact", "Last Contact", "Messages"],
      ...dataToExport.map((c) => [
        c.name || "",
        c.phone_number || "",
        c.channel_type || "whatsapp",
        c.email || "",
        (c.tags || []).join(", "),
        c.first_message_at ? formatDate(c.first_message_at) : "",
        c.last_message_at ? formatDate(c.last_message_at) : "",
        (c.total_messages_sent || 0) + (c.total_messages_received || 0),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "contacts.csv"
    a.click()
    URL.revokeObjectURL(url)

    toast.success("Contacts exported")
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full bg-mesh-gradient bg-noise">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#213138] font-[family-name:var(--font-poppins)]">
            Contacts
          </h1>
          <p className="text-gray-500 font-medium tracking-wide">
            Manage and view all your customer interactions in one place
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedContacts.length > 0 && (
            <Button
              variant="outline"
              onClick={handleExportContacts}
              className="border-gray-200 hover:bg-gray-50 text-[#213138] rounded-xl hover-lift btn-press shadow-sm"
            >
              <Download className="h-4 w-4 mr-2 text-gray-500" />
              Export ({selectedContacts.length})
            </Button>
          )}
          <Button className="bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-xl shadow-[0_4px_14px_rgba(58,155,159,0.3)] hover-lift btn-press font-semibold transition-all">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total Contacts", value: contacts.length, icon: User, color: "teal" },
          { label: "Active Recently", value: contacts.filter(c => c.last_message_at).length, icon: Zap, color: "coral" },
          { label: "WhatsApp", value: contacts.filter(c => c.channel_type === 'whatsapp').length, icon: MessageCircle, color: "teal" },
          { label: "Instagram", value: contacts.filter(c => c.channel_type === 'instagram').length, icon: Instagram, color: "coral" },
          { label: "Facebook", value: contacts.filter(c => c.channel_type === 'messenger').length, icon: Facebook, color: "teal" },
        ].map((stat, i) => (
          <div
            key={i}
            className="p-5 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/50 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover-lift"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-400">{stat.label}</div>
                <div className="text-2xl font-bold text-[#213138] mt-1">
                  {loading ? <Skeleton className="h-8 w-12" /> : stat.value}
                </div>
              </div>
              <div
                className={cn(
                  "p-3 rounded-xl",
                  stat.color === 'teal' ? "bg-[#3A9B9F]/10 text-[#3A9B9F]" : "bg-[#FF8B66]/10 text-[#FF8B66]"
                )}
              >
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-white/40 p-1.5 rounded-2xl border border-white/40 backdrop-blur-md shadow-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#3A9B9F] transition-colors" />
          <Input
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 bg-white border-transparent focus:border-[#3A9B9F]/30 focus:ring-4 focus:ring-[#3A9B9F]/5 rounded-xl transition-all shadow-sm"
          />
        </div>
        <Button variant="outline" className="h-11 px-5 border-transparent bg-white hover:bg-gray-50 rounded-xl shadow-sm hover-lift text-gray-600 font-medium">
          <Filter className="h-4 w-4 mr-2 text-gray-400" />
          Filter Categories
        </Button>
      </div>

      {/* Contacts Table Container */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-12 px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedContacts.length === contacts.length && contacts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-[#3A9B9F] focus:ring-[#3A9B9F] h-4 w-4 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">
                  Contact info
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em]">
                  Phone & Channel
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] hidden md:table-cell">
                  Last Active
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] hidden lg:table-cell">
                  Messages
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] hidden lg:table-cell">
                  Tags & Status
                </th>
                <th className="w-16 px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-4" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24 mt-1" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <Skeleton className="h-4 w-12" />
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <Skeleton className="h-5 w-16" />
                    </td>
                    <td className="px-4 py-4">
                      <Skeleton className="h-8 w-8" />
                    </td>
                  </tr>
                ))
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-gray-100 p-4 mb-4">
                        <Phone className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">
                        No contacts found
                      </h3>
                      <p className="text-sm text-gray-500">
                        {searchQuery
                          ? "Try a different search term"
                          : "Contacts will appear here when customers message you"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="group hover:bg-[#3A9B9F]/[0.02] transition-colors duration-200 border-b border-gray-50 last:border-0"
                  >
                    <td className="px-6 py-5">
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={() => handleSelectContact(contact.id)}
                        className="rounded border-gray-300 text-[#3A9B9F] focus:ring-[#3A9B9F] h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar
                            src={contact.avatar_url ?? undefined}
                            fallback={contact.name || contact.phone_number || contact.channel_id || "?"}
                            size="md"
                            className="ring-2 ring-white shadow-sm"
                          />
                          <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ring-1 ring-gray-100",
                            contact.last_message_at && (new Date().getTime() - new Date(contact.last_message_at).getTime() < 3600000 * 24)
                              ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                              : "bg-gray-300"
                          )} title={contact.last_message_at ? "Recently active" : "Inactive"} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-semibold text-[#213138] truncate text-sm">
                              {contact.name || "Unknown Customer"}
                            </p>
                            {contact.is_blocked && (
                              <Badge variant="danger" className="py-0 px-1 text-[10px] leading-tight bg-red-50 text-red-500 border-red-100">
                                Blocked
                              </Badge>
                            )}
                          </div>
                          {contact.email && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {contact.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "p-1.5 rounded-lg text-white shadow-sm",
                          contact.channel_type === 'whatsapp' ? "bg-[#25D366]" :
                            contact.channel_type === 'messenger' ? "bg-[#0084FF]" :
                              contact.channel_type === 'instagram' ? "bg-gradient-to-tr from-[#FFB700] via-[#FF0069] to-[#7638FA]" :
                                "bg-gray-400"
                        )}>
                          {contact.channel_type === 'whatsapp' ? <MessageCircle className="h-3 w-3" /> :
                            contact.channel_type === 'messenger' ? <MessageCircle className="h-3 w-3" /> :
                              contact.channel_type === 'instagram' ? <Instagram className="h-3 w-3" /> :
                                <Phone className="h-3 w-3" />}
                        </div>
                        <span className="text-sm font-medium text-[#213138]">
                          {contact.phone_number || (
                            <span className="text-gray-400 italic text-xs">
                              {contact.channel_type ? (contact.channel_type.charAt(0).toUpperCase() + contact.channel_type.slice(1)) : 'Unknown'}
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-5 hidden md:table-cell">
                      <div className="flex flex-col">
                        <span className="text-sm text-[#213138] font-medium">
                          {contact.last_message_at
                            ? formatDistanceToNow(contact.last_message_at)
                            : "Never"}
                        </span>
                        {contact.last_message_at && (
                          <span className="text-[10px] text-gray-400">
                            {formatDate(contact.last_message_at)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-5 hidden lg:table-cell">
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-xs font-semibold text-[#213138]">
                        {(contact.total_messages_sent || 0) +
                          (contact.total_messages_received || 0)}
                      </div>
                    </td>
                    <td className="px-4 py-5 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1.5 slice-tags">
                        {contact.tags?.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="bg-white border-gray-100 text-gray-600 shadow-sm text-[10px] px-2 py-0">
                            {tag}
                          </Badge>
                        ))}
                        {(contact.tags?.length || 0) > 2 && (
                          <Badge variant="outline" className="border-gray-100 text-gray-400 text-[10px] px-1.5 py-0">
                            +{contact.tags!.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Dropdown
                        align="right"
                        trigger={
                          <button className="p-2 rounded-xl text-gray-400 hover:text-[#3A9B9F] hover:bg-[#3A9B9F]/5 transition-all outline-none">
                            <MoreVertical className="h-5 w-5" />
                          </button>
                        }
                      >
                        <DropdownItem
                          icon={<Phone className="h-4 w-4" />}
                          onClick={() => { }}
                        >
                          View conversation
                        </DropdownItem>
                        <DropdownItem
                          icon={<Tag className="h-4 w-4" />}
                          onClick={() => {
                            setEditingContact(contact)
                            setIsModalOpen(true)
                          }}
                        >
                          Edit tags
                        </DropdownItem>
                        <DropdownSeparator />
                        <DropdownItem
                          onClick={() => handleBlockContact(contact)}
                        >
                          {contact.is_blocked ? "Unblock" : "Block"}
                        </DropdownItem>
                      </Dropdown>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingContact(null)
        }}
        title="Edit Contact"
        size="md"
      >
        {editingContact && (
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={editingContact.name || ""}
                onChange={(e) =>
                  setEditingContact({ ...editingContact, name: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={editingContact.email || ""}
                onChange={(e) =>
                  setEditingContact({ ...editingContact, email: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <ModalFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#3A9B9F]"
                onClick={async () => {
                  const { error } = await updateContact(editingContact.id, {
                    name: editingContact.name,
                    email: editingContact.email,
                  })
                  if (error) {
                    toast.error("Failed to update contact")
                  } else {
                    setContacts((prev) =>
                      prev.map((c) =>
                        c.id === editingContact.id ? editingContact : c
                      )
                    )
                    toast.success("Contact updated")
                    setIsModalOpen(false)
                  }
                }}
              >
                Save Changes
              </Button>
            </ModalFooter>
          </div>
        )}
      </Modal>
    </div>
  )
}
