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

      // 2. Link the team_members record to this new user.id and set to active
      // We look for any pending invite for this email
      const { data: member, error: memberError } = await client
        .from('team_members')
        .update({ 
          user_id: user.id, 
          status: 'active', 
          is_active: true,
          updated_at: new Date().toISOString() 
        })
        .eq('email', user.email?.toLowerCase())
        .eq('status', 'pending')
        .select()
        .maybeSingle()

      if (memberError) {
        console.error("Team activation error:", memberError)
        toast.error("Failed to activate team membership")
      } else if (member) {
        console.log("Team membership activated for:", user.email)
        toast.success("Welcome to the team!")
      } else {
        // Maybe already active? Check if any record exists for this user in team_members
        const { data: existing } = await client
          .from('team_members')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (existing) {
          console.log("Membership already active")
        } else {
          console.warn("No pending invite found for:", user.email)
        }
      }

      // 3. Ensure the personal customer profile exists
      // My getPersonalCustomer fix handles this too, but let's be sure
      const { data: profile } = await client
        .from('customers')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()
      
      if (!profile) {
        const name = user.user_metadata?.full_name || member?.name || user.email?.split('@')[0] || "User"
        await client.from('customers').insert({
          id: user.id,
          full_name: name,
          contact_email: user.email,
          business_name: user.user_metadata?.business_name || '',
          is_trial: true,
          status: 'trial'
        })
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
