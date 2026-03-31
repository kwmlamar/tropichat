"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Envelope as Mail, 
  Lock, 
  Eye, 
  EyeSlash as EyeOff, 
  CircleNotch as Loader2, 
  CaretLeft,
  Translate,
  Star
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signUp, signInWithOAuth, type CustomerPlan } from "@/lib/supabase"
import { toast } from "sonner"

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" fill="#1877F2"/>
    </svg>
  )
}

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [useEmail, setUseEmail] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Get plan and billing from search params
    const planParam = searchParams.get('plan') as CustomerPlan | null
    const billingParam = searchParams.get('billing') as 'monthly' | 'annual' | null
    
    const { error } = await signUp(
      email, 
      password, 
      "", 
      fullName, 
      planParam || 'free', 
      billingParam || 'monthly'
    )
    
    if (error) {
      toast.error(error)
      setIsLoading(false)
      return
    }
    toast.success("Account created! Please check your email to verify.")
    router.push("/login")
  }

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setOauthLoading(provider)
    
    // Get current selection to carry over during social login
    const planParam = searchParams.get('plan') || 'free'
    const billingParam = searchParams.get('billing') || 'monthly'
    
    const { error } = await signInWithOAuth(provider, {
      redirectTo: `${window.location.origin}/onboarding?plan=${planParam}&billing=${billingParam}`
    })
    
    if (error) {
      toast.error(error)
      setOauthLoading(null)
    }
  }

  const anyLoading = isLoading || oauthLoading !== null
  const selectedPlan = searchParams.get('plan')
  const selectedBilling = searchParams.get('billing')

  return (
    <div className="lg:h-screen flex flex-col lg:flex-row bg-white overflow-hidden">
      
      {/* ─── LEFT COLUMN: BRANDING & ILLUSTRATION ────────────────────────────── */}
      <div className="hidden lg:flex w-full lg:w-[40%] xl:w-[45%] bg-[#007B85] flex-col p-8 relative overflow-hidden">
        
        {/* Decorative subtle background texture */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
           <div className="absolute -top-24 -right-24 w-96 h-96 bg-white blur-[120px] rounded-full" />
           <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#FF7E36] blur-[120px] rounded-full" />
        </div>

        {/* Brand Logo */}
        <div className="mb-10 relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 group">
             <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl border border-white/20">
               <Image
                 src="/tropichat-logo.png"
                 alt="TropiChat"
                 width={40}
                 height={40}
                 unoptimized
                 className="h-8 w-8 object-contain transition-transform group-hover:rotate-12"
               />
             </div>
             <span className="text-xl font-black tracking-tighter text-white">TropiChat</span>
          </Link>
        </div>

        {/* Content Centered */}
        <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.8 }}
             className="relative w-full max-w-[400px] aspect-square mb-8 bg-white rounded-[3rem] shadow-2xl shadow-black/10 overflow-hidden group"
           >
              <Image 
                src="/tropichat_signup_illustration.png" 
                alt="Manage all your chats in one place"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
           </motion.div>

           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
           >
             <h1 className="text-4xl font-black text-white leading-[1.1] tracking-tighter mb-3">
                Sign up for <br /> TropiChat
             </h1>
             <p className="text-base text-white/70 font-medium max-w-[280px]">
                Here for the first time? <br /> Let&#39;s get you settled in
             </p>
           </motion.div>
        </div>

        {/* Bottom Back Button */}
        <div className="mt-auto relative z-10">
           <Link 
             href="/" 
             className="inline-flex items-center gap-2 text-sm font-black text-white/60 hover:text-white transition-colors"
           >
              <CaretLeft weight="bold" /> Back
           </Link>
        </div>
      </div>

      {/* ─── RIGHT COLUMN: AUTH ACTIONS ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white overflow-y-auto">
        
        {/* Top Navigation */}
        <div className="p-6 flex justify-between lg:justify-end items-center gap-6">
           {/* Mobile Only: Site Logo */}
           <div className="lg:hidden">
              <Image
                src="/tropichat-logo.png"
                alt="TropiChat"
                width={32}
                height={32}
                unoptimized
              />
           </div>

           <div className="flex items-center gap-4">
              <button className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#213138]">
                 <Translate weight="bold" /> English
              </button>
              <Button 
                asChild
                variant="outline" 
                className="rounded-full border-[#007B85] text-[#007B85] hover:bg-[#007B85] hover:text-white px-8 h-12 text-[10px] font-black uppercase tracking-widest"
              >
                 <Link href="/login">SIGN IN</Link>
              </Button>
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
           <div className="w-full max-w-sm space-y-8">
              
              {/* Plan Selection Badge */}
              <AnimatePresence mode="wait">
                {selectedPlan && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center text-center space-y-2 mb-2 bg-[#007B85]/5 border border-[#007B85]/20 p-5 rounded-[2rem] relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                       <Star weight="fill" className="h-12 w-12 text-[#007B85]" />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#007B85] text-white rounded-full shadow-lg shadow-[#007B85]/20 z-10">
                      <Star weight="fill" className="h-3 w-3 text-amber-300" />
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] leading-none">
                        14-Day Free Trial
                      </span>
                    </div>
                    <div className="flex flex-col z-10">
                      <span className="text-2xl font-black text-[#213138] capitalize tracking-tighter">
                        {selectedPlan} <span className="text-[#007B85]">Tier</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em] mt-1">
                        Renews {selectedBilling === 'annual' ? 'Annually' : 'Monthly'} thereafter
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!useEmail ? (
                /* ─── Social Logins Area ─── */
                <div className="space-y-4">
                   <h2 className="lg:hidden text-3xl font-black text-center mb-8">Sign up for TropiChat</h2>

                   <Button
                     onClick={() => handleOAuth("google")}
                     disabled={anyLoading}
                     className="w-full h-14 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl flex items-center justify-center gap-3 transition-all"
                   >
                      <GoogleIcon className="h-5 w-5" />
                      Continue with Google
                   </Button>

                   <Button
                     onClick={() => handleOAuth("facebook")}
                     disabled={anyLoading}
                     className="w-full h-14 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl flex items-center justify-center gap-3 transition-all"
                   >
                      <FacebookIcon className="h-5 w-5" />
                      Continue with Facebook
                   </Button>

                   <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-100" />
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
                        <span className="bg-white px-4 tracking-widest leading-none">Or use email</span>
                      </div>
                   </div>

                   <Button
                     onClick={() => setUseEmail(true)}
                     variant="ghost"
                     className="w-full h-12 text-slate-400 hover:text-[#007B85] font-black uppercase tracking-widest text-[10px]"
                   >
                      Use your email address
                   </Button>
                </div>
              ) : (
                /* ─── Email Form Area ─── */
                <motion.form
                   onSubmit={handleSubmit}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="space-y-6"
                >
                   <div className="flex items-center justify-between mb-4">
                      <button 
                        type="button"
                        onClick={() => setUseEmail(false)}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#007B85] flex items-center gap-1"
                      >
                         <CaretLeft weight="bold" /> Other options
                      </button>
                   </div>

                   <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Full Name</Label>
                        <Input 
                          placeholder="Your full name" 
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="h-14 rounded-xl border-slate-200 focus:ring-[#007B85] focus:border-[#007B85] font-medium"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Work Email</Label>
                        <Input 
                          type="email"
                          placeholder="name@company.com" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-14 rounded-xl border-slate-200 focus:ring-[#007B85] focus:border-[#007B85] font-medium"
                          required 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Create Password</Label>
                        <Input 
                          type="password"
                          placeholder="Min 8 characters" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-14 rounded-xl border-slate-200 focus:ring-[#007B85] focus:border-[#007B85] font-medium"
                          required
                          minLength={8}
                        />
                      </div>
                   </div>

                   <Button
                     type="submit"
                     disabled={isLoading}
                     className="w-full h-14 bg-[#007B85] hover:bg-[#2F8488] text-white font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#007B85]/20"
                   >
                      {isLoading ? <Loader2 className="animate-spin" /> : "CREATE ACCOUNT"}
                   </Button>
                </motion.form>
              )}

              {/* Legal Footer */}
              <p className="text-[10px] text-center text-slate-400 font-medium leading-relaxed">
                 By signing up, you agree to TropiChat&#39;s <br />
                 <Link href="/terms" className="text-[#007B85] hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-[#007B85] hover:underline">Privacy Policy</Link>
              </p>
           </div>
        </div>

        {/* Footer Navigation (Mobile) */}
        <div className="p-6 lg:hidden flex justify-center text-[10px] font-black uppercase tracking-widest text-slate-400 gap-6">
           <Link href="/privacy">Privacy</Link>
           <Link href="/terms">Terms</Link>
           <Link href="/help">Help</Link>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 text-[#007B85] animate-spin" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
