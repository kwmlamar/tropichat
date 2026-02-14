"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const processed = useRef(false)

  useEffect(() => {
    const client = getSupabase()

    // Listen for the auth state change — Supabase fires this after it
    // exchanges the OAuth code/token fragment in the URL for a session.
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[OAuth Callback] Auth event:", event, "Session:", !!session)

        // Only handle SIGNED_IN and only once
        if (event !== "SIGNED_IN" || !session || processed.current) return
        processed.current = true

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
            ? meta.provider_id || null
            : null

          const { error: insertError } = await client.from("customers").insert({
            id: user.id,
            business_name: businessName,
            contact_email: user.email || `${providerName}_${user.id}@tropichat.local`,
            status: "trial",
            plan: "free",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            facebook_id: facebookId,
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
    )

    // Fallback: if the session is already established (e.g. page refresh),
    // onAuthStateChange may fire INITIAL_SESSION instead of SIGNED_IN.
    // Check after a short delay.
    const fallbackTimer = setTimeout(async () => {
      if (processed.current) return

      const { data: { session } } = await client.auth.getSession()
      if (session) {
        console.log("[OAuth Callback] Fallback: session found, redirecting")
        processed.current = true
        router.push("/dashboard")
      } else {
        console.log("[OAuth Callback] Fallback: no session, redirecting to login")
        router.push("/login")
      }
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(fallbackTimer)
    }
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
