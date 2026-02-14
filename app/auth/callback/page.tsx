"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabase, getUser } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    async function handleCallback() {
      const client = getSupabase()

      // Supabase automatically exchanges the code in the URL hash for a session.
      // We just need to wait for it, then ensure a customer record exists.
      const { data: { session }, error: sessionError } = await client.auth.getSession()

      if (sessionError || !session) {
        console.error("[OAuth Callback] No session:", sessionError?.message)
        router.push("/login")
        return
      }

      const user = session.user
      const providerName = user.app_metadata?.provider || "oauth"
      const meta = user.user_metadata || {}

      console.log(`[OAuth Callback] ${providerName} user:`, user.id, meta.full_name || meta.name)

      // Check if a customer record already exists
      const { data: existing } = await client
        .from("customers")
        .select("id")
        .eq("id", user.id)
        .single()

      if (!existing) {
        // First OAuth login — create the customer record
        const businessName = meta.full_name || meta.name || meta.email?.split("@")[0] || "My Business"
        const avatarUrl = meta.avatar_url || meta.picture || null
        const facebookId = providerName === "facebook"
          ? meta.provider_id || user.app_metadata?.providers?.includes("facebook") && user.id
          : null

        const { error: insertError } = await client.from("customers").insert({
          id: user.id,
          business_name: businessName,
          contact_email: user.email || `${providerName}_${user.id}@tropichat.local`,
          status: "trial",
          plan: "free",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          facebook_id: facebookId || null,
          avatar_url: avatarUrl,
        })

        if (insertError) {
          console.error("[OAuth Callback] Customer insert error:", insertError)
        } else {
          console.log("[OAuth Callback] Customer record created")
        }
      } else {
        console.log("[OAuth Callback] Existing customer, skipping insert")
      }

      router.push("/dashboard")
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#3A9B9F] mx-auto mb-4" />
        <p className="text-gray-600">Signing you in...</p>
      </div>
    </div>
  )
}
