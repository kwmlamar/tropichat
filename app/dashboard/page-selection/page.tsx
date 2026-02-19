"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle,
  Loader2,
  Users,
  Link2,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar } from "@/components/ui/avatar"
import { fetchFacebookPages, type FacebookPage } from "@/lib/meta-connections"
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

    setConnecting(true)

    // Simulate connection (in production this would call the Meta API)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        is_connected: p.id === selectedPageId,
      }))
    )

    toast.success("Page connected successfully!")
    setConnecting(false)
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (pages.length === 0) {
    return (
      <div className="p-6 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Connect a Facebook Page</h1>
        <p className="text-gray-500 mb-8">Select a Facebook Page to connect for Messenger</p>

        <Card>
          <CardContent className="p-12 text-center">
            <div className="rounded-full bg-yellow-50 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">No Pages Found</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
              Connect your Meta account first to see the Facebook Pages you manage.
            </p>
            <Button
              onClick={() => router.push("/dashboard/settings?tab=integrations")}
              className="bg-[#3A9B9F] hover:bg-[#2F8488]"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Go to Integrations
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl overflow-y-auto h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Connect a Facebook Page</h1>
        <p className="text-gray-500 mt-1">
          Select a Page you manage to receive and respond to Messenger conversations
        </p>
      </div>

      {/* Page List */}
      <div className="space-y-3 mb-8">
        {pages.map((page) => {
          const isSelected = selectedPageId === page.id

          return (
            <button
              key={page.id}
              onClick={() => setSelectedPageId(page.id)}
              className={`w-full text-left rounded-xl border-2 transition-all p-5 ${
                isSelected
                  ? "border-[#0084FF] bg-blue-50/50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Radio indicator */}
                <div
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? "border-[#0084FF]" : "border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <div className="h-3 w-3 rounded-full bg-[#0084FF]" />
                  )}
                </div>

                {/* Page Avatar */}
                <Avatar
                  src={page.profile_picture_url}
                  fallback={page.name}
                  size="lg"
                />

                {/* Page Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {page.name}
                    </h3>
                    {page.is_connected && (
                      <Badge variant="success" size="sm" className="gap-1 flex-shrink-0">
                        <CheckCircle className="h-3 w-3" />
                        Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{page.category}</p>
                  {page.follower_count > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <Users className="h-3 w-3" />
                      <span>{page.follower_count.toLocaleString()} followers</span>
                    </div>
                  )}
                </div>

                {/* Messenger icon */}
                <div className="flex-shrink-0 rounded-lg bg-[#0084FF] p-2 text-white">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.259L19.752 8.2l-6.561 6.763z" />
                  </svg>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Connect Button */}
      <div className="flex items-center justify-between pb-8">
        <p className="text-sm text-gray-500">
          {selectedPageId
            ? `Selected: ${pages.find((p) => p.id === selectedPageId)?.name}`
            : "Select a Page to connect"}
        </p>
        <Button
          onClick={handleConnect}
          disabled={!selectedPageId || connecting}
          className="bg-[#0084FF] hover:bg-[#0073E6] px-8"
        >
          {connecting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4 mr-2" />
              Connect Selected Page
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
