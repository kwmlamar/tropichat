"use client"

import { useState, useEffect } from "react"
import { 
  User, 
  MagnifyingGlass as Search, 
  DownloadSimple as Download, 
  DotsThreeVertical as MoreVertical, 
  Phone, 
  Tag 
} from "@phosphor-icons/react"
import { Avatar } from "@/components/ui/avatar"
import { Modal, ModalFooter } from "@/components/ui/modal"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dropdown, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { getContacts, updateContact } from "@/lib/supabase"
import { formatDate, formatDistanceToNow, cn } from "@/lib/utils"
import { useDebounce } from "@/lib/hooks"
import { toast } from "sonner"
import { motion } from "framer-motion"
import type { Contact } from "@/types/database"

// ─── Channel dot — identity of this page ─────────────────────────────────────
// Platform color lives ONLY in a small dot. No colored icon boxes.
function ChannelPill({ type }: { type: string | null }) {
  const map: Record<string, { label: string; dot: string }> = {
    whatsapp:  { label: "WhatsApp",  dot: "bg-[#25D366]" },
    messenger: { label: "Messenger", dot: "bg-[#0084FF]" },
    instagram: { label: "Instagram", dot: "bg-[#E1306C]" },
  }
  const c = map[type ?? ""] ?? { label: type ?? "Unknown", dot: "bg-gray-300 dark:bg-[#333]" }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("w-2 h-2 rounded-full shrink-0", c.dot)} />
      <span className="text-[13px] text-gray-700 dark:text-[#A3A3A3]">{c.label}</span>
    </span>
  )
}

function PresenceDot({ lastMessageAt }: { lastMessageAt: string | null }) {
  const active = lastMessageAt && new Date().getTime() - new Date(lastMessageAt).getTime() < 86400000
  return (
    <span className={cn(
      "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#0C0C0C]",
      active ? "bg-[#007B85]" : "bg-gray-200 dark:bg-[#333]"
    )} />
  )
}

export default function ContactsPage() {
  const [contacts, setContacts]             = useState<Contact[]>([])
  const [loading, setLoading]               = useState(true)
  const [searchQuery, setSearchQuery]       = useState("")
  const [selectedContacts, setSelected]     = useState<string[]>([])
  const [editingContact, setEditing]        = useState<Contact | null>(null)
  const [isModalOpen, setIsModalOpen]       = useState(false)
  const debouncedSearch                     = useDebounce(searchQuery, 300)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      const { data, error } = await getContacts(debouncedSearch)
      if (error) toast.error("Failed to load contacts")
      else setContacts(data)
      setLoading(false)
    }
    fetch()
  }, [debouncedSearch])

  const toggleAll = () => setSelected(selectedContacts.length === contacts.length ? [] : contacts.map(c => c.id))
  const toggleOne = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const handleBlock = async (contact: Contact) => {
    const { error } = await updateContact(contact.id, { is_blocked: !contact.is_blocked })
    if (error) { toast.error("Failed to update contact"); return }
    setContacts(p => p.map(c => c.id === contact.id ? { ...c, is_blocked: !c.is_blocked } : c))
    toast.success(contact.is_blocked ? "Contact unblocked" : "Contact blocked")
  }

  const handleExport = () => {
    const rows = (selectedContacts.length > 0 ? contacts.filter(c => selectedContacts.includes(c.id)) : contacts)
    const csv = [["Name","Phone","Channel","Email","Tags"],
      ...rows.map(c => [c.name||"",c.phone_number||"",c.channel_type||"",c.email||"",(c.tags||[]).join("; ")])
    ].map(r => r.join(",")).join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = "contacts.csv"; a.click()
    toast.success("Contacts exported")
  }

  const stats = [
    { label: "Total",     value: contacts.length,                                    accent: "#007B85" },
    { label: "WhatsApp",  value: contacts.filter(c => c.channel_type==="whatsapp").length,  accent: "#25D366" },
    { label: "Instagram", value: contacts.filter(c => c.channel_type==="instagram").length,  accent: "#E1306C" },
    { label: "Messenger", value: contacts.filter(c => c.channel_type==="messenger").length,  accent: "#0084FF" },
  ]

  return (
    <div className="p-8 min-h-screen overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="text-[11px] text-gray-400 dark:text-[#525252] uppercase tracking-widest font-medium mb-1.5 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#007B85] inline-block" />CRM
            </p>
            <h1 className="text-3xl font-bold text-[#213138] dark:text-white  tracking-tight">Contacts</h1>
          </div>
          {selectedContacts.length > 0 && (
            <button onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] hover:border-gray-300 dark:hover:border-[#2A2A2A] text-gray-600 dark:text-[#A3A3A3] text-[13px] font-medium rounded-xl transition-colors duration-200 shadow-sm active:scale-95">
              <Download weight="bold" className="h-3.5 w-3.5 text-[#007B85]" />Export ({selectedContacts.length})
            </button>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl p-5 hover:border-gray-300 dark:hover:border-[#2A2A2A] transition-colors duration-200"
              style={{ borderLeftColor: s.accent, borderLeftWidth: 2 }}>
              <p className="text-[11px] text-gray-500 dark:text-[#525252] uppercase tracking-widest font-medium mb-2">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white  tabular-nums">
                {loading ? "—" : s.value}
              </p>
            </div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.10 }}>
          <div className="relative">
            <Search weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-[#525252]" />
            <input type="text" placeholder="Search by name, phone, or email…" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-xl text-[13px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#525252] focus:outline-none focus:border-[#007B85] transition-colors duration-200" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.14 }}
          className="bg-white dark:bg-[#0C0C0C] border border-gray-200 dark:border-[#1C1C1C] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#1C1C1C] bg-gray-50 dark:bg-[#111]">
                  <th className="w-12 px-5 py-3.5">
                    <Checkbox 
                      checked={selectedContacts.length === contacts.length && contacts.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  {[["Contact",""],["Channel",""],["Last Active","hidden md:table-cell"],["Messages","hidden lg:table-cell"],["Tags","hidden lg:table-cell"]].map(([col, cls]) => (
                    <th key={col} className={cn("px-4 py-3.5 text-left text-[10px] font-semibold text-gray-400 dark:text-[#525252] uppercase tracking-widest", cls)}>
                      {col}
                    </th>
                  ))}
                  <th className="w-12 px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-[#1A1A1A]">
                {loading ? Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><Skeleton className="h-3.5 w-3.5 bg-slate-100 dark:bg-[#1A1A1A] rounded" /></td>
                    <td className="px-4 py-4"><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full bg-slate-100 dark:bg-[#1A1A1A]" /><Skeleton className="h-3.5 w-28 bg-slate-100 dark:bg-[#1A1A1A] rounded" /></div></td>
                    <td className="px-4 py-4"><Skeleton className="h-3.5 w-24 bg-slate-100 dark:bg-[#1A1A1A] rounded" /></td>
                    <td className="px-4 py-4 hidden md:table-cell"><Skeleton className="h-3.5 w-16 bg-slate-100 dark:bg-[#1A1A1A] rounded" /></td>
                    <td className="px-4 py-4 hidden lg:table-cell"><Skeleton className="h-3.5 w-8 bg-slate-100 dark:bg-[#1A1A1A] rounded" /></td>
                    <td className="px-4 py-4 hidden lg:table-cell"><Skeleton className="h-5 w-14 bg-slate-100 dark:bg-[#1A1A1A] rounded-full" /></td>
                    <td className="px-4 py-4" />
                  </tr>
                )) : contacts.length === 0 ? (
                  <tr><td colSpan={7} className="py-16 text-center">
                    <User weight="bold" className="h-8 w-8 text-gray-200 dark:text-[#1A1A1A] mx-auto mb-3" />
                    <p className="text-[14px] text-gray-500 dark:text-[#525252]">
                      {searchQuery ? "No contacts match that search" : "Contacts appear when customers message you"}
                    </p>
                  </td></tr>
                ) : contacts.map(contact => (
                  <tr key={contact.id} className="group hover:bg-gray-50 dark:hover:bg-[#111] transition-colors duration-150">
                    <td className="px-5 py-4">
                      <Checkbox 
                        checked={selectedContacts.includes(contact.id)} 
                        onCheckedChange={() => toggleOne(contact.id)}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <Avatar src={contact.avatar_url ?? undefined} fallback={contact.name || contact.phone_number || "?"} size="md" className="h-9 w-9" />
                          <PresenceDot lastMessageAt={contact.last_message_at} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">
                              {contact.name || "Unknown"}
                            </p>
                            {contact.is_blocked && (
                              <span className="text-[9px] font-bold uppercase text-red-400 border border-red-200 dark:border-red-900/30 px-1.5 py-0.5 rounded">Blocked</span>
                            )}
                          </div>
                          {contact.email && <p className="text-[12px] text-gray-400 dark:text-[#525252] truncate">{contact.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <ChannelPill type={contact.channel_type ?? null} />
                      {contact.phone_number && <p className="text-[12px] text-gray-400 dark:text-[#525252] mt-0.5">{contact.phone_number}</p>}
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="text-[13px] text-gray-700 dark:text-[#A3A3A3]">
                        {contact.last_message_at ? formatDistanceToNow(contact.last_message_at) + " ago" : "Never"}
                      </p>
                      {contact.last_message_at && <p className="text-[11px] text-gray-400 dark:text-[#525252]">{formatDate(contact.last_message_at)}</p>}
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-[13px] font-semibold text-gray-900 dark:text-white tabular-nums">
                        {(contact.total_messages_sent || 0) + (contact.total_messages_received || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags?.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[10px] font-medium text-gray-500 dark:text-[#525252] border border-gray-200 dark:border-[#222] px-1.5 py-0.5 rounded">{tag}</span>
                        ))}
                        {(contact.tags?.length || 0) > 2 && <span className="text-[10px] text-gray-400 dark:text-[#525252]">+{contact.tags!.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Dropdown align="right" trigger={
                        <button className="p-1.5 rounded-lg text-gray-400 dark:text-[#525252] hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1C1C1C] transition-colors duration-200 outline-none opacity-0 group-hover:opacity-100">
                          <MoreVertical weight="bold" className="h-4 w-4" />
                        </button>
                      }>
                        <DropdownItem icon={<Phone weight="bold" className="h-4 w-4" />} onClick={() => {}}>View conversation</DropdownItem>
                        <DropdownItem icon={<Tag weight="bold" className="h-4 w-4" />} onClick={() => { setEditing(contact); setIsModalOpen(true) }}>Edit contact</DropdownItem>
                        <DropdownSeparator />
                        <DropdownItem onClick={() => handleBlock(contact)}>{contact.is_blocked ? "Unblock" : "Block"}</DropdownItem>
                      </Dropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && contacts.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-[#1C1C1C]">
              <p className="text-[11px] text-gray-400 dark:text-[#525252]">
                {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
                {selectedContacts.length > 0 && ` · ${selectedContacts.length} selected`}
              </p>
            </div>
          )}
        </motion.div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditing(null) }} title="Edit Contact" size="md">
        {editingContact && (
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={editingContact.name || ""} onChange={e => setEditing({ ...editingContact, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Email</Label><Input type="email" value={editingContact.email || ""} onChange={e => setEditing({ ...editingContact, email: e.target.value })} className="mt-1" /></div>
            <ModalFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button className="bg-[#007B85] hover:bg-[#2F8488] text-white" onClick={async () => {
                const { error } = await updateContact(editingContact.id, { name: editingContact.name, email: editingContact.email })
                if (error) toast.error("Failed to update contact")
                else { setContacts(p => p.map(c => c.id === editingContact.id ? editingContact : c)); toast.success("Contact updated"); setIsModalOpen(false) }
              }}>Save Changes</Button>
            </ModalFooter>
          </div>
        )}
      </Modal>
    </div>
  )
}
