"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle,
  Loader2,
  Users,
  Link2,
  AlertTriangle,
  Facebook,
  ArrowRight,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar } from "@/components/ui/avatar"
import { fetchFacebookPages, selectFacebookPage, type FacebookPage } from "@/lib/meta-connections"
import { toast } from "sonner"

export default function PageSelectionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pages, setPages] = useState<FacebookPage[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    async function init() {
      setLoading(true)
      const { data, error } = await fetchFacebookPages()
      if (error) {
        toast.error(error)
      } else {
        setPages(data)
        // Auto-select the currently connected page
        const connected = data.find((p) => p.is_connected)
        if (connected) {
          setSelectedPageId(connected.id)
        }
      }
      setLoading(false)
    }

    init()
  }, [])

  const handleConnect = async () => {
    if (!selectedPageId) {
      toast.error("Please select a Page to connect")
      return
    }

    const page = pages.find((p) => p.id === selectedPageId)
    setConnecting(true)

    const { error } = await selectFacebookPage({
      pageId: selectedPageId,
      pageName: page?.name,
      profilePictureUrl: page?.profile_picture_url ?? undefined,
    })

    if (error) {
      toast.error(error)
      setConnecting(false)
      return
    }

    const { data } = await fetchFacebookPages()
    setPages(data)

    toast.success("Page connected successfully!")
    setConnecting(false)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto h-full flex flex-col">
        <div className="mb-10">
          <Skeleton className="h-10 w-64 mb-3 rounded-lg" />
          <Skeleton className="h-5 w-96 rounded-lg" />
        </div>
        <div className="space-y-4 flex-1">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-[24px]" />
          ))}
        </div>
      </div>
    )
  }

  if (pages.length === 0) {
    return (
      <div className="relative min-h-[80vh] flex items-center justify-center p-8 overflow-hidden">
        {/* Decorative Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#3A9B9F]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#FF8B66]/5 blur-[120px] rounded-full" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 max-w-lg w-full text-center"
        >
          <div className="bg-white/70 backdrop-blur-2xl rounded-[40px] border border-white p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-100">
            <div className="mb-8 relative inline-block">
              <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
              <div className="relative rounded-[2rem] bg-gradient-to-br from-amber-400 to-orange-500 p-6 shadow-xl shadow-amber-500/20">
                <AlertTriangle className="h-10 w-10 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-extrabold text-[#213138] mb-4 tracking-tight font-[family-name:var(--font-poppins)]">
              No Pages Found
            </h2>
            <p className="text-gray-500 mb-10 leading-relaxed text-lg">
              We couldn't find any Facebook Pages. Make sure you've connected your Meta account and granted the necessary permissions.
            </p>

            <Button
              onClick={() => router.push("/dashboard/settings?tab=integrations")}
              className="bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-2xl h-14 px-8 text-base font-semibold transition-all shadow-lg shadow-teal-500/20 group"
            >
              <Link2 className="h-5 w-5 mr-3 transition-transform group-hover:rotate-12" />
              Go to Integrations
              <ArrowRight className="h-4 w-4 ml-3 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative min-h-full p-8 overflow-y-auto">
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[5%] right-[5%] w-[600px] h-[600px] bg-[#3A9B9F]/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[5%] left-[5%] w-[600px] h-[600px] bg-[#FF8B66]/5 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto flex flex-col h-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Facebook className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-extrabold text-[#213138] tracking-tight font-[family-name:var(--font-poppins)]">
              Connect Facebook Page
            </h1>
          </div>
          <p className="text-gray-500 text-lg max-w-2xl">
            Select the Page you'd like to manage. We'll synchronize your Messenger conversations automatically.
          </p>
        </motion.div>

        {/* Page List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 mb-12"
        >
          {pages.map((page) => {
            const isSelected = selectedPageId === page.id

            return (
              <motion.button
                key={page.id}
                variants={itemVariants}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedPageId(page.id)}
                className={`w-full group text-left rounded-[28px] border-2 transition-all p-6 relative overflow-hidden h-28 ${isSelected
                    ? "border-[#3A9B9F] bg-white shadow-[0_12px_40px_rgba(58,155,159,0.08)] ring-1 ring-[#3A9B9F]"
                    : "border-gray-100 bg-white/50 backdrop-blur-sm hover:border-gray-200 hover:bg-white hover:shadow-xl hover:shadow-gray-200/40"
                  }`}
              >
                {/* Selected Accent */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#3A9B9F]" />
                )}

                <div className="flex items-center gap-6 relative z-10">
                  {/* Radio Indicator */}
                  <div
                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? "border-[#3A9B9F] bg-[#3A9B9F]" : "border-gray-200 group-hover:border-[#3A9B9F]/50"
                      }`}
                  >
                    {isSelected && (
                      <CheckCircle className="h-4 w-4 text-white" />
                    )}
                  </div>

                  {/* Avatar with Glow */}
                  <div className="relative">
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#3A9B9F]/20 blur-xl rounded-full" />
                    )}
                    <Avatar
                      src={page.profile_picture_url}
                      fallback={page.name}
                      size="lg"
                      className="h-14 w-14 border-2 border-white shadow-sm ring-1 ring-gray-100"
                    />
                  </div>

                  {/* Page Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className={`text-lg font-bold truncate transition-colors ${isSelected ? "text-[#213138]" : "text-gray-700 font-semibold"}`}>
                        {page.name}
                      </h3>
                      {page.is_connected && (
                        <Badge className="bg-teal-50 text-teal-700 border-teal-100 px-3 py-1 rounded-full text-xs font-bold gap-1.5 flex-shrink-0">
                          <CheckCircle className="h-3 w-3" />
                          Live
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm font-medium text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {page.follower_count.toLocaleString()}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-200" />
                      <span className="truncate">{page.category}</span>
                    </div>
                  </div>

                  {/* Platform Indicator */}
                  <div className={`p-3 rounded-2xl transition-all ${isSelected ? "bg-blue-50 text-[#0084FF]" : "bg-gray-50 text-gray-300"}`}>
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.259L19.752 8.2l-6.561 6.763z" />
                    </svg>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </motion.div>

        {/* Action Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-8 mt-auto"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-[32px] border border-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.06)] flex items-center justify-between ring-1 ring-gray-100">
            <div className="flex flex-col px-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Current Selection</span>
              <p className="text-sm font-bold text-[#213138]">
                {selectedPageId
                  ? pages.find((p) => p.id === selectedPageId)?.name
                  : "No page selected"}
              </p>
            </div>

            <Button
              onClick={handleConnect}
              disabled={!selectedPageId || connecting}
              className="bg-[#3A9B9F] hover:bg-[#2F8488] text-white rounded-[20px] h-14 px-10 text-base font-bold transition-all shadow-xl shadow-teal-500/20 active:scale-95 disabled:opacity-50"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="h-5 w-5 mr-3" />
                  Connect Page
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
