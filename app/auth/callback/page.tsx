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
            
            // Notify ADMIN (Lamar) about the new signage
            const ADMIN_ID = "29227a12-ca82-4796-a9c4-30ec0c6fa0e4"
            if (user.id !== ADMIN_ID) {
              await client.from("notifications").insert({
                customer_id: ADMIN_ID,
                type: "system",
                title: "New TropiChat Explorer! 🌴",
                message: `${businessName} just signed up for TropiChat! 🚀`,
                link: "/admin/leads",
                metadata: {
                  signup_id: user.id,
                  email: user.email
                }
              })
            }
          }
        } else {
          console.log("[OAuth Callback] Existing customer, skipping insert")
        }

        // Extract plan intent from the callback URL itself (carried from sign-up)
        const params = new URLSearchParams(window.location.search)
        const plan = params.get("plan")
        const billing = params.get("billing")
        const queryString = (plan || billing) ? `?${params.toString()}` : ""

        // If they need to onboard, the dashboard layout will handle it, 
        // but we'll try to target onboarding directly if they are new.
        if (!existing) {
          router.push(`/onboarding${queryString}`)
        } else {
          router.push(`/dashboard${queryString}`)
        }
      }
    )

    // Fallback: if the session is already established
    const fallbackTimer = setTimeout(async () => {
      if (processed.current) return

      const { data: { session } } = await client.auth.getSession()
      if (session) {
        console.log("[OAuth Callback] Fallback: session found, redirecting")
        processed.current = true
        const params = new URLSearchParams(window.location.search)
        const queryString = (params.get("plan") || params.get("billing")) ? `?${params.toString()}` : ""
        router.push(`/dashboard${queryString}`)
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
        <Loader2 className="h-8 w-8 animate-spin text-[#007B85] mx-auto mb-4" />
        <p className="text-gray-600">Signing you in...</p>
      </div>
    </div>
  )
}
