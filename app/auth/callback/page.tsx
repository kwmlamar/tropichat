"use client"
// Vercel deployment re-trigger 2026-03-31T12:40:00

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const processed = useRef(false)

  useEffect(() => {
    const client = getSupabase()

    // Listen for the auth state change
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[OAuth Callback] Auth event:", event, "Session:", !!session)

        // Handle both INITIAL_SESSION and SIGNED_IN for maximum reliability
        if ((event !== "SIGNED_IN" && event !== "INITIAL_SESSION") || !session || processed.current) return
        processed.current = true

        const user = session.user
        const providerName = user.app_metadata?.provider || "oauth"
        const meta = user.user_metadata || {}

        // 1. Retrieve stored intent from localStorage
        const storedPlan = localStorage.getItem('tp_plan')
        const storedBilling = localStorage.getItem('tp_billing')
        
        // Clean up immediately
        localStorage.removeItem('tp_plan')
        localStorage.removeItem('tp_billing')

        console.log(`[OAuth Callback] ${providerName} login. Intent:`, storedPlan, storedBilling)

        // 2. Check if a customer record already exists
        const { data: existing } = await client
          .from("customers")
          .select("id")
          .eq("id", user.id)
          .maybeSingle()

        if (!existing) {
          // First OAuth login — create the customer record
          const businessName = meta.full_name || meta.name || meta.email?.split("@")[0] || "My Business"
          const avatarUrl = meta.avatar_url || meta.picture || null

          const { error: insertError } = await client.from("customers").insert({
            id: user.id,
            business_name: businessName,
            contact_email: user.email || `${providerName}_${user.id}@tropichat.local`,
            status: "trial",
            plan: (storedPlan || 'free') as any,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            facebook_id: providerName === "facebook" ? meta.provider_id || null : null,
            avatar_url: avatarUrl,
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          })

          if (insertError) {
            console.error("[OAuth Callback] Failed to create customer:", insertError)
          }

          // Create team_members owner record (mirrors email signUp flow)
          await client.from("team_members").insert({
            customer_id: user.id,
            user_id: user.id,
            role: "owner",
            name: businessName,
            email: user.email || "",
            status: "active",
            is_active: true,
          })
          
          console.log("[OAuth Callback] Customer + team_member records created with intent:", storedPlan)
        }

        // 3. Construct final redirect URL
        const queryString = (storedPlan || storedBilling) 
            ? `?plan=${storedPlan}&billing=${storedBilling}` 
            : ""

        if (!existing) {
          router.push(`/onboarding${queryString}`)
        } else {
          router.push(`/dashboard${queryString}`)
        }
      }
    )

    // Fallback: redirects to dashboard after short delay if session established
    const fallbackTimer = setTimeout(async () => {
      if (processed.current) return

      const { data: { session } } = await client.auth.getSession()
      if (session) {
        processed.current = true
        router.push("/dashboard")
      } else {
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
