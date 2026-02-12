"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Plus,
  MoreVertical,
  Phone,
  Mail,
  Tag,
  Trash2,
  Download,
  Filter,
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
import { formatDate, formatDistanceToNow } from "@/lib/utils"
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
      ["Name", "Phone", "Email", "Tags", "First Contact", "Last Contact", "Messages"],
      ...dataToExport.map((c) => [
        c.name || "",
        c.phone_number,
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
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-500 mt-1">
            {contacts.length} total contacts
          </p>
        </div>

        <div className="flex gap-3">
          {selectedContacts.length > 0 && (
            <Button variant="outline" onClick={handleExportContacts}>
              <Download className="h-4 w-4 mr-2" />
              Export ({selectedContacts.length})
            </Button>
          )}
          <Button className="bg-[#3A9B9F] hover:bg-[#2F8488]">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedContacts.length === contacts.length && contacts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Last Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Messages
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Tags
                </th>
                <th className="w-12 px-4 py-3"></th>
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
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={() => handleSelectContact(contact.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          fallback={contact.name || contact.phone_number}
                          size="md"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {contact.name || "Unknown"}
                          </p>
                          {contact.email && (
                            <p className="text-sm text-gray-500">
                              {contact.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {contact.phone_number}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 hidden md:table-cell">
                      {contact.last_message_at
                        ? formatDistanceToNow(contact.last_message_at)
                        : "Never"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 hidden lg:table-cell">
                      {(contact.total_messages_sent || 0) +
                        (contact.total_messages_received || 0)}
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags?.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" size="sm">
                            {tag}
                          </Badge>
                        ))}
                        {(contact.tags?.length || 0) > 2 && (
                          <Badge variant="outline" size="sm">
                            +{contact.tags!.length - 2}
                          </Badge>
                        )}
                        {contact.is_blocked && (
                          <Badge variant="danger" size="sm">
                            Blocked
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Dropdown
                        align="right"
                        trigger={
                          <button className="p-2 rounded-lg hover:bg-gray-100">
                            <MoreVertical className="h-4 w-4 text-gray-500" />
                          </button>
                        }
                      >
                        <DropdownItem
                          icon={<Phone className="h-4 w-4" />}
                          onClick={() => {}}
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
