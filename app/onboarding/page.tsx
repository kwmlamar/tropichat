"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { 
  InstagramLogo, 
  WhatsappLogo, 
  MessengerLogo, 
  EnvelopeSimple, 
  DeviceMobile, 
  CheckCircle,
  ArrowRight,
  CaretRight,
  House,
  Sparkle,
  Globe,
  CircleNotch,
  MagicWand,
  ChatCircleText,
  IdentificationCard,
  Target,
  ShieldCheck
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { getSession, getCurrentCustomer, getSupabase, getWorkspaceId, updateCustomer } from "@/lib/supabase"
import type { Customer } from "@/types/database"
import { initiateMetaConnect, getMetaStatus } from "@/lib/meta-connections"
import { toast } from "sonner"
import { SplashLoader } from "@/components/splash-loader"

type Step = "welcome" | "profile" | "channels" | "meta" | "complete"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("welcome")
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [businessName, setBusinessName] = useState("")
  const [businessDescription, setBusinessDescription] = useState("")
  const [profilePicUrl, setProfilePicUrl] = useState("")
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["instagram", "whatsapp", "messenger"])
  const [connecting, setConnecting] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)

  useEffect(() => {
    async function load() {
      const { session } = await getSession()
      if (!session) {
        router.push("/login")
        return
      }

      const { data } = await getCurrentCustomer()
      if (data) {
        setCustomer(data)
        setBusinessName(data.business_name || "")
        setProfilePicUrl(data.avatar_url || "")
        // If they already onboarded, send them to dashboard
        if (data.has_onboarded) {
          router.push("/dashboard")
          return
        }
      }

      const supabase = getSupabase()
      const { customerId } = await getWorkspaceId()
      if (customerId) {
        const { data: connectedAccount } = await supabase
          .from("connected_accounts")
          .select("id")
          .eq("user_id", customerId)
          .eq("channel_type", "whatsapp")
          .eq("is_active", true)
          .maybeSingle()

        if (connectedAccount?.id) {
          const { data: businessProfile } = await supabase
            .from("business_profiles")
            .select("business_name,business_description,profile_picture_url")
            .eq("connected_account_id", connectedAccount.id)
            .maybeSingle()

          if (businessProfile) {
            setBusinessName(businessProfile.business_name || data?.business_name || "")
            setBusinessDescription(businessProfile.business_description || "")
            setProfilePicUrl(businessProfile.profile_picture_url || data?.avatar_url || "")
          }
        }
      }

      // Check URL for plan selection or step override
      const params = new URLSearchParams(window.location.search)
      const planParam = params.get("plan")
      const billingParam = params.get("billing")

      // Catch and apply plan intent (especially for Social Auth users)
      if (planParam && data && data.plan === 'free') {
          try {
            await updateCustomer({ 
                plan: planParam as any,
                billing_period: (billingParam || 'monthly') as any 
            })
            // Update local state to reflect the change immediately
            setCustomer(prev => prev ? { ...prev, plan: planParam as any } : null)
            toast.success(`Welcome to the ${planParam} plan trial!`)
          } catch (e) {
            console.error("Failed to auto-provision plan:", e)
          }
      }

      if (params.get("meta") === "connected") {
        setStep("complete")
      } else if (params.get("step") === "meta") {
        setStep("meta")
      } else if (params.get("step") === "channels") {
        setStep("channels")
      } else if (params.get("step") === "profile") {
        setStep("profile")
      }

      setLoading(false)
    }
    load()
  }, [router])

  const handleNextStep = () => {
    if (step === "welcome") setStep("profile")
    else if (step === "profile") setStep("channels")
    else if (step === "channels") setStep("meta")
  }

  const handleConnect = async () => {
    setConnecting(true)
    const { url, error } = await initiateMetaConnect()
    if (url) {
      window.location.href = url
    } else {
      toast.error(error || "Failed to initiate Meta connection")
      setConnecting(false)
    }
  }

  const handleFinish = async () => {
    setIsFinishing(true)
    try {
      const { error: customerError } = await updateCustomer({
        has_onboarded: true,
        business_name: businessName,
        avatar_url: profilePicUrl || null,
        status: customer?.status || 'trial',
        trial_ends_at: customer?.trial_ends_at || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      })

      if (customerError) {
        throw new Error(customerError)
      }

      const supabase = getSupabase()
      const { customerId, error: workspaceError } = await getWorkspaceId()
      if (workspaceError) {
        throw new Error(workspaceError)
      }

      if (customerId) {
        const { data: connectedAccount, error: accountError } = await supabase
          .from("connected_accounts")
          .select("id")
          .eq("user_id", customerId)
          .eq("channel_type", "whatsapp")
          .eq("is_active", true)
          .maybeSingle()

        if (accountError) {
          throw new Error(accountError.message)
        }

        if (connectedAccount?.id) {
          const { error: profileError } = await supabase
            .from("business_profiles")
            .upsert(
              {
                connected_account_id: connectedAccount.id,
                business_name: businessName,
                business_description: businessDescription || null,
                profile_picture_url: profilePicUrl || null
              },
              { onConflict: "connected_account_id" }
            )

          if (profileError) {
            throw new Error(profileError.message)
          }
        }
      }

      toast.success("Welcome to TropiChat!")
      router.push("/dashboard?launchpad=true")
    } catch (error) {
      console.error("Onboarding finish failed:", error)
      toast.error("Failed to finish onboarding. Please try again.")
    } finally {
      setIsFinishing(false)
    }
  }

  if (loading) return <SplashLoader isLoading={true} />

  const steps = [
    { id: "welcome", label: "Identity" },
    { id: "profile", label: "Profile" },
    { id: "channels", label: "Channels" },
    { id: "meta", label: "Connect" },
    { id: "complete", label: "Finalize" }
  ]

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-[#007B85]/5 to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#007B85]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-pink-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Progress Indicator */}
      <div className="fixed top-12 flex items-center gap-2 z-20">
         {steps.map((s, i) => (
            <div 
               key={s.id} 
               className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  steps.findIndex(x => x.id === step) >= i 
                    ? "w-12 bg-[#007B85]" 
                    : "w-4 bg-gray-200 dark:bg-white/5"
               )}
            />
         ))}
      </div>

      <main className="w-full max-w-xl relative z-10">
        <AnimatePresence mode="wait">
          {step === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 text-center"
            >
              <div className="space-y-4">
                <div className="h-20 w-20 bg-white dark:bg-[#080808] border border-gray-100 dark:border-white/5 shadow-2xl rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce-slow">
                   <Sparkle weight="fill" className="h-10 w-10 text-[#007B85]" />
                </div>
                <h1 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight">
                   Welcome to the <br /> <span className="text-[#007B85]">Future of Chat</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium max-w-sm mx-auto">
                   Let&apos;s set up your workspace and connect your first customer channels.
                </p>
              </div>

              <div className="space-y-2 text-left bg-white dark:bg-[#080808] p-8 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-xl">
                 <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 block">Company Name</Label>
                 <Input 
                   value={businessName}
                   onChange={e => setBusinessName(e.target.value)}
                   placeholder="e.g. Island Breeze Boutique"
                   className="h-14 rounded-2xl border-gray-100 dark:border-white/10 dark:bg-[#111] text-lg font-bold"
                 />
                 <p className="text-[11px] text-gray-400 font-medium mt-2">This is how your workspace will be identified.</p>
              </div>

              <Button 
                onClick={handleNextStep}
                disabled={!businessName}
                className="w-full h-16 bg-[#007B85] hover:bg-[#2F8488] text-white rounded-3xl text-lg font-black shadow-xl shadow-[#007B85]/20 group transition-all"
              >
                Get Started
                <ArrowRight weight="bold" className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          )}

          {step === "channels" && (
            <motion.div
              key="channels"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="text-center space-y-3">
                <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Choose your channels</h2>
                <p className="text-gray-500 font-medium">Select the platforms you use to engage with customers.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 {[
                   { id: "instagram", name: "Instagram", icon: InstagramLogo, color: "bg-pink-500" },
                   { id: "whatsapp", name: "WhatsApp", icon: WhatsappLogo, color: "bg-green-500" },
                   { id: "messenger", name: "Messenger", icon: MessengerLogo, color: "bg-blue-500" },
                   { id: "email", name: "Email", icon: EnvelopeSimple, color: "bg-teal-500" },
                   { id: "sms", name: "SMS", icon: DeviceMobile, color: "bg-orange-500" },
                   { id: "website", name: "Web Chat", icon: Globe, color: "bg-purple-500" }
                 ].map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => setSelectedChannels(prev => 
                        prev.includes(ch.id) ? prev.filter(x => x !== ch.id) : [...prev, ch.id]
                      )}
                      className={cn(
                        "p-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-4 text-center group",
                        selectedChannels.includes(ch.id)
                          ? "border-[#007B85] bg-[#007B85]/5 shadow-lg shadow-[#007B85]/5"
                          : "border-gray-100 dark:border-white/5 bg-white dark:bg-[#080808] hover:border-gray-200 dark:hover:border-white/10"
                      )}
                    >
                       <div className={cn(
                         "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                         selectedChannels.includes(ch.id) ? ch.color : "bg-gray-100 dark:bg-white/5"
                       )}>
                          <ch.icon weight="fill" className={cn("h-6 w-6", selectedChannels.includes(ch.id) ? "text-white" : "text-gray-400")} />
                       </div>
                       <div className="flex flex-col">
                          <span className={cn("text-sm font-black", selectedChannels.includes(ch.id) ? "text-[#007B85]" : "text-gray-400")}>
                             {ch.name}
                          </span>
                       </div>
                       <div className={cn(
                         "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                         selectedChannels.includes(ch.id) ? "border-[#007B85] bg-[#007B85]" : "border-gray-200 dark:border-white/10"
                       )}>
                          {selectedChannels.includes(ch.id) && <CheckCircle weight="fill" className="h-3 w-3 text-white" />}
                       </div>
                    </button>
                 ))}
              </div>

              <div className="flex gap-4 pt-4">
                 <Button 
                   variant="ghost" 
                   onClick={() => setStep("welcome")}
                   className="flex-1 h-14 rounded-2xl font-black text-gray-400"
                 >
                   Back
                 </Button>
                 <Button 
                   onClick={handleNextStep}
                   className="flex-[2] h-14 bg-[#007B85] hover:bg-[#2F8488] text-white rounded-2xl font-black shadow-xl shadow-[#007B85]/20"
                 >
                   Next Step
                 </Button>
              </div>
            </motion.div>
          )}

          {step === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              <div className="text-center space-y-3">
                <div className="h-16 w-16 bg-white dark:bg-[#080808] border border-gray-100 dark:border-white/5 shadow-xl rounded-3xl flex items-center justify-center mx-auto">
                  <IdentificationCard weight="fill" className="h-8 w-8 text-[#007B85]" />
                </div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Build your brand profile</h2>
                <p className="text-gray-500 font-medium max-w-md mx-auto">
                  Add a short business description and logo URL so customers recognize your brand instantly.
                </p>
              </div>

              <div className="space-y-5 bg-white dark:bg-[#080808] p-8 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-xl">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Business Description</Label>
                  <textarea
                    value={businessDescription}
                    onChange={e => setBusinessDescription(e.target.value)}
                    placeholder="What makes your business special?"
                    className="w-full h-28 resize-none rounded-2xl border border-gray-100 dark:border-white/10 dark:bg-[#111] p-4 text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#007B85]/40"
                  />
                  <p className="text-[11px] text-gray-400 font-medium">Shown on your connected business profile.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Profile Picture URL</Label>
                  <Input
                    value={profilePicUrl}
                    onChange={e => setProfilePicUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="h-14 rounded-2xl border-gray-100 dark:border-white/10 dark:bg-[#111] text-sm font-medium"
                  />
                </div>

                <motion.div
                  initial={{ opacity: 0.5, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-3xl border border-[#007B85]/20 bg-[#007B85]/5 p-5 flex items-center gap-4"
                >
                  <div className="h-14 w-14 rounded-2xl bg-white border border-[#007B85]/20 overflow-hidden flex items-center justify-center">
                    {profilePicUrl ? (
                      <Image
                        src={profilePicUrl}
                        alt="Business profile preview"
                        width={56}
                        height={56}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <House weight="fill" className="h-6 w-6 text-[#007B85]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-800 dark:text-gray-100 truncate">{businessName || "Your Business Name"}</p>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 line-clamp-2">
                      {businessDescription || "Your business description preview will appear here."}
                    </p>
                  </div>
                </motion.div>
              </div>

              <div className="flex gap-4 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setStep("welcome")}
                  className="flex-1 h-14 rounded-2xl font-black text-gray-400"
                >
                  Back
                </Button>
                <Button
                  onClick={handleNextStep}
                  disabled={!businessDescription.trim()}
                  className="flex-[2] h-14 bg-[#007B85] hover:bg-[#2F8488] text-white rounded-2xl font-black shadow-xl shadow-[#007B85]/20"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {step === "meta" && (
            <motion.div
              key="meta"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-12 text-center"
            >
               <div className="space-y-4">
                  <div className="flex items-center justify-center -space-x-4 mb-8">
                     <div className="h-16 w-16 bg-pink-500 rounded-3xl flex items-center justify-center shadow-xl rotate-[-6deg] relative z-20 border-4 border-[#FDFDFD] dark:border-[#050505]">
                        <InstagramLogo weight="fill" className="h-8 w-8 text-white" />
                     </div>
                     <div className="h-16 w-16 bg-green-500 rounded-3xl flex items-center justify-center shadow-xl relative z-30 border-4 border-[#FDFDFD] dark:border-[#050505]">
                        <WhatsappLogo weight="fill" className="h-8 w-8 text-white" />
                     </div>
                     <div className="h-16 w-16 bg-blue-500 rounded-3xl flex items-center justify-center shadow-xl rotate-[6deg] relative z-20 border-4 border-[#FDFDFD] dark:border-[#050505]">
                        <MessengerLogo weight="fill" className="h-8 w-8 text-white" />
                     </div>
                  </div>
                  <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Sync your Meta Channels</h2>
                  <p className="text-gray-500 font-medium max-w-sm mx-auto">
                    TropiChat is an official Meta partner. Connect once and manage everything on auto-pilot.
                  </p>
               </div>

               <div className="space-y-4">
                  <Button 
                    onClick={handleConnect}
                    disabled={connecting}
                    className="w-full h-18 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-[24px] text-lg font-black shadow-2xl flex items-center justify-center gap-4 py-8 group transition-all active:scale-[0.98]"
                  >
                    {connecting ? <CircleNotch className="h-6 w-6 animate-spin" /> : (
                      <>
                        <svg className="h-7 w-7 fill-white" viewBox="0 0 24 24">
                          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                        </svg>
                        Continue with Meta
                      </>
                    )}
                  </Button>
                  <button 
                    onClick={() => setStep("complete")}
                    className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors"
                  >
                    Set up manually later
                  </button>
               </div>

               <div className="grid grid-cols-2 gap-6 pt-4">
                  <div className="flex items-center gap-3 text-left">
                     <ShieldCheck weight="fill" className="h-5 w-5 text-green-500" />
                     <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Secure <br /> Connection</span>
                  </div>
                  <div className="flex items-center gap-3 text-left">
                     <MagicWand weight="fill" className="h-5 w-5 text-amber-500" />
                     <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Instant <br /> Syncing</span>
                  </div>
               </div>
            </motion.div>
          )}

          {step === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-12 text-center"
            >
               <div className="relative">
                  <div className="absolute inset-0 bg-[#007B85]/20 blur-[100px] rounded-full scale-[2] pointer-events-none" />
                  <div className="h-32 w-32 bg-[#007B85] rounded-[40px] shadow-2xl flex items-center justify-center mx-auto mb-10 relative z-10 border-4 border-white/20">
                     <CheckCircle weight="fill" className="h-16 w-16 text-white" />
                  </div>
               </div>

               <div className="space-y-3">
                  <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">You&apos;re all set!</h2>
                  <p className="text-gray-500 font-medium max-w-[280px] mx-auto leading-relaxed">
                    Your workspace is ready. Time to dive in and start growing your business.
                  </p>
               </div>

               <Button 
                 onClick={handleFinish}
                 disabled={isFinishing}
                 className="w-full h-18 bg-[#007B85] hover:bg-[#2F8488] text-white rounded-3xl text-xl font-black shadow-2xl shadow-[#007B85]/20 h-20"
               >
                 {isFinishing ? <CircleNotch className="h-6 w-6 animate-spin" /> : "Enter Dashboard"}
               </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <div className="fixed bottom-12 flex flex-col items-center gap-2">
         <Image src="/tropichat-logo.png" alt="TropiChat" width={24} height={24} unoptimized className="opacity-40 grayscale" />
         <span className="text-[10px] font-bold text-gray-300 dark:text-white/10 uppercase tracking-[0.3em]">TropiChat Ecosystem</span>
      </div>
    </div>
  )
}
