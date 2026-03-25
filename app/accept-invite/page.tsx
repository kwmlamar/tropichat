"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabase, getUser } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function AcceptInvitePage() {
  const router = useRouter()
  const processed = useRef(false)
  const [status, setStatus] = useState("Authenticating...")

  useEffect(() => {
    async function handleInvite() {
      if (processed.current) return
      processed.current = true

      const client = getSupabase()

      // 1. Ensure we have a session (Supabase handles the fragment automatically)
      const { user, error: authError } = await getUser()
      if (authError || !user) {
        console.error("No user found after invite accept")
        router.push("/login")
        return
      }

      setStatus("Activating your team membership...")

      // 2. Call the activation API (uses service role to bypass RLS)
      const { data: { session } } = await client.auth.getSession()
      if (!session) {
        console.error("No session found during activate")
        router.push("/login")
        return
      }

      const res = await fetch('/api/team/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      const json = await res.json()

      if (!res.ok) {
        console.error("Team activation API error:", json.error)
        toast.error(json.error || "Failed to activate team membership")
      } else {
        console.log("Team membership activated:", json)
        toast.success("Welcome to the team!")
      }

      // 4. Send to dashboard
      router.push("/dashboard")
    }

    handleInvite()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFB] dark:bg-[#0A0A0A]">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#007B85] mx-auto mb-6" />
        <h1 className="text-xl font-bold text-[#213138] dark:text-white mb-2">{status}</h1>
        <p className="text-slate-500 dark:text-gray-400">Please wait while we set up your account...</p>
      </div>
    </div>
  )
}
