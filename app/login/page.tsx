"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { 
  Envelope as Mail, 
  Lock, 
  Eye, 
  EyeSlash as EyeOff, 
  CircleNotch as Loader2, 
  CheckCircle 
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { signIn, signInWithOAuth } from "@/lib/supabase"
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

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.96.95-2.12 1.18-3.08 1.18-.99 0-1.85-.29-2.73-.29-.86 0-1.78.3-2.73.3-1.01 0-2.2-.33-3.23-1.35C3.12 18.02 2 14.73 2 11.23c0-3.66 2.11-5.71 4.29-5.71 1.14 0 2.04.38 2.76.78.6.35 1.25.75 2 .75s1.4-.4 2-.75c.7-.42 1.6-.78 2.76-.78 1.83 0 3.42 1.39 4.19 3-.47.28-1.12.75-1.12 2.22 0 1.89 1.49 2.58 1.95 2.78-.32 1.14-1.04 2.59-1.86 3.51-.62.69-1.28 1.34-2.16 1.34-.88-.02-1.12-.51-2.16-.51-1.05 0-1.32.48-2.16.51-.01.01-.01.01-.01.01zM12 5.03c-.02-1.83 1.5-3.53 3.39-3.53.18 0 .37.02.54.06.12 1.98-1.51 3.69-3.39 3.69-.18 0-.37-.02-.54-.06z" />
    </svg>
  )
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M13 1h10v10H13z" />
      <path fill="#05a6f0" d="M1 13h10v10H1z" />
      <path fill="#ffba08" d="M13 13h10v10H13z" />
    </svg>
  )
}

function WhatsAppBrandIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.072 1.761C6.462 1.761 1.9 6.323 1.9 11.933c0 1.79.467 3.538 1.353 5.074L1 22.423l5.589-1.465a10.124 10.124 0 004.483 1.056h.004c5.61 0 10.172-4.562 10.172-10.172 0-2.72-1.059-5.276-2.981-7.198a10.116 10.116 0 00-7.2-2.983z" fill="#25D366" />
      <path d="M17.472 14.382c-.301-.15-1.767-.872-2.04-.971-.272-.099-.47-.149-.669.15-.198.299-.769.971-.942 1.171-.173.199-.347.225-.648.075-.301-.15-1.272-.469-2.422-1.496-.893-.797-1.495-1.782-1.67-2.081-.174-.3-.018-.462.13-.61.137-.133.3-.349.45-.523.15-.174.199-.298.298-.497.1-.199.05-.374-.025-.523-.075-.15-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.011c-.198 0-.52.074-.792.373-.272.299-1.04 1.016-1.04 2.479 0 1.463 1.065 2.877 1.213 3.076.149.199 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.766-.721 2.015-1.419.25-.699.25-1.296.174-1.419-.075-.123-.276-.199-.577-.349z" fill="white" />
    </svg>
  )
}

function InstagramBrandIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="5" fill="url(#insta_gradient_2)" />
      <path d="M12 6.8c-2.8 0-5.1 2.3-5.1 5.2s2.3 5.2 5.1 5.2 5.1-2.3 5.1-5.2S14.8 6.8 12 6.8zm0 8.4c-1.8 0-3.3-1.5-3.3-3.2 0-1.8 1.5-3.2 3.3-3.2s3.3 1.4 3.3 3.2c0 1.7-1.4 3.2-3.3 3.2zM18.8 6.9c0 .6-.5 1.1-1.1 1.1-.6 0-1.1-.5-1.1-1.1 0-.6.5-1.1 1.1-1.1.6 0 1.1.5 1.1 1.1z" fill="white" />
      <path d="M12 2c-2.7 0-3.1 0-4.1.1-1 .1-1.7.3-2.3.5-.6.2-1.1.6-1.6 1.1-.5.5-.9 1-1.1 1.6-.2.6-.4 1.3-.5 2.3-.1 1-.1 1.4-.1 4.1s0 3.1.1 4.1c.1 1 .3 1.7.5 2.3.2.6.6 1.1 1.1 1.6.5.5 1 1 1.6 1.1.6.2 1.3.4 2.3.5 1 .1 1.4.1 4.1.1s3.1 0 4.1-.1c1-.1 1.7-.3 2.3-.5.6-.2 1.1-.6 1.6-1.1.5-.5.9-1 1.1-1.6.2-.6.4-1.3.5-2.3.1-1 .1-1.4.1-4.1s0-3.1-.1-4.1c-.1-1-.3-1.7-.5-2.3-.2-.6-.6-1.1-1.1-1.6-.5-.5-1-1-1.6-1.1-.6-.2-1.3-.4-2.3-.5C15.1 2 14.7 2 12 2zm0 1.8c2.7 0 3 0 4 .1.9.1 1.4.2 1.7.3.4.2.7.4 1 .7.3.3.5.6.7 1 .1.3.3.8.4 1.7.1 1 .1 1.3.1 4s0 3-.1 4c-.1.9-.2 1.4-.3 1.7-.2.4-.4.7-.7 1-.3.3-.6.5-1 .7-.3.1-.8.3-1.7.4-1 .1-1.3.1-4 .1s-3 0-4-.1c-.9-.1-1.4-.2-1.7-.3-.4-.2-.7-.4-1-.7-.3-.3-.5-.6-.7-1-.1-.3-.3-.8-.4-1.7-.1-1-.1-1.3-.1-4s0-3 .1-4c.1-.9.2-1.4.3-1.7.2-.4.4-.7.7-1 .3-.3.6-.5 1-.7.3-.1.8-.3 1.7-.4 1-.1 1.3-.1 4-.1z" fill="white" />
      <defs>
        <linearGradient id="insta_gradient_2" x1="2.5" y1="21.5" x2="21.6" y2="2.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F58529" />
          <stop offset="0.1" stopColor="#FEDA77" />
          <stop offset="1" stopColor="#DD2A7B" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function MessengerBrandIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.47715 2 2 6.14214 2 11.2462C2 14.1561 3.46014 16.7491 5.73693 18.4601C5.9318 18.6046 6.04907 18.8354 6.04907 19.0818L6.03541 21.2281C6.0289 21.464 6.27376 21.6247 6.4782 21.5061L8.9056 20.1098C9.04353 20.031 9.20818 20.0125 9.35914 20.0573C10.2081 20.3094 11.0877 20.4925 12 20.4925C17.5228 20.4925 22 16.3504 22 11.2462C22 6.14214 17.5228 2 12 2Z" fill="url(#messenger_gradient_2)" />
      <path d="M6.3 12.87l3.295-5.242a.858.858 0 0 1 1.233-.243l3.053 2.29a.428.428 0 0 0 .513 0l3.664-2.793a.286.286 0 0 1 .428.37l-3.295 5.242a.858.858 0 0 1-1.233.243l-3.053-2.29a.428.428 0 0 0-.513 0l-3.664 2.793a.286.286 0 0 1-.428-.37z" fill="white" />
      <defs>
        <linearGradient id="messenger_gradient_2" x1="12" y1="20.4925" x2="12" y2="2" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0084FF" />
          <stop offset="1" stopColor="#00C6FF" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { data, error } = await signIn(email, password)

    if (error) {
      toast.error(error)
      setIsLoading(false)
      return
    }

    router.push("/dashboard")
  }

  const handleOAuth = async (provider: 'google') => {
    setOauthLoading(provider)
    const { error } = await signInWithOAuth(provider)
    if (error) {
      toast.error(error)
      setOauthLoading(null)
    }
  }

  const anyLoading = isLoading || oauthLoading !== null

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAFB] dark:bg-[#0A0A0A]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-[#007B85]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-[#FF7E36]/10 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-[#222222] overflow-hidden flex flex-col lg:flex-row min-h-[700px]"
      >
        <div className="flex-1 p-8 lg:p-16 flex flex-col justify-center">
          <div className="mb-10 lg:mb-12">
            <Link href="/" className="inline-block">
              <Image
                src="/tropichat-logo.png"
                alt="TropiChat"
                width={64}
                height={64}
                unoptimized
                className="h-14 w-14 object-contain transition-transform duration-300 hover:scale-110"
              />
            </Link>
          </div>

          <div className="mb-10">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-500/10 shadow-sm ring-1 ring-teal-100 dark:ring-teal-500/20">
              <Lock weight="bold" className="h-7 w-7 text-[#007B85]" />
            </div>
            <h1 className="text-3xl font-bold text-[#213138] dark:text-white">
              Login to your account!
            </h1>
            <p className="text-slate-500 dark:text-gray-400 mt-2">
              Enter your registered email address and password to login!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-gray-300">Email</Label>
              <div className="relative group">
                <Mail weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#007B85] transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="eg. pixelcot@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 rounded-2xl border-slate-200 dark:border-white/10 focus-visible:ring-[#007B85] bg-slate-50/50 dark:bg-white/5 dark:text-white dark:placeholder-gray-500 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" title="Password" className="text-sm font-semibold text-slate-700 dark:text-gray-300">Password</Label>
              <div className="relative group">
                <Lock weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#007B85] transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 h-14 rounded-2xl border-slate-200 dark:border-white/10 focus-visible:ring-[#007B85] bg-slate-50/50 dark:bg-white/5 dark:text-white dark:placeholder-gray-500 transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff weight="bold" className="h-5 w-5" /> : <Eye weight="bold" className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-500 dark:text-gray-400 cursor-pointer"
                >
                  Remember me
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm font-bold text-[#007B85] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={anyLoading}
              className="w-full bg-[#007B85] hover:bg-[#2F8488] text-white h-14 rounded-2xl text-base font-bold shadow-lg shadow-teal-500/20 transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 weight="bold" className="h-5 w-5 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          <div className="mt-8">
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100 dark:border-[#222222]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold text-slate-400 dark:text-gray-500">
                <span className="bg-white dark:bg-[#0A0A0A] px-4">Or login with</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => handleOAuth("google")}
                className="h-14 rounded-2xl border-slate-200 dark:border-[#3A3A3A] bg-transparent hover:bg-slate-50 dark:hover:bg-[#222222] hover:border-slate-300 dark:hover:border-[#4A4A4A] transition-all hover:scale-[1.02]"
              >
                <GoogleIcon className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                className="h-14 rounded-2xl border-slate-200 dark:border-[#3A3A3A] bg-transparent hover:bg-slate-50 dark:hover:bg-[#222222] hover:border-slate-300 dark:hover:border-[#4A4A4A] transition-all hover:scale-[1.02]"
              >
                <AppleIcon className="h-6 w-6 dark:text-white text-black" />
              </Button>
              <Button
                variant="outline"
                className="h-14 rounded-2xl border-slate-200 dark:border-[#3A3A3A] bg-transparent hover:bg-slate-50 dark:hover:bg-[#222222] hover:border-slate-300 dark:hover:border-[#4A4A4A] transition-all hover:scale-[1.02]"
              >
                <MicrosoftIcon className="h-6 w-6" />
              </Button>
            </div>
          </div>

          <p className="mt-10 text-center text-sm text-slate-500 dark:text-gray-400">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-[#007B85] font-bold hover:underline"
            >
              Sign up for free
            </Link>
          </p>
        </div>

        <div className="hidden lg:flex w-[45%] bg-[#213138] p-12 flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#007B85]/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#FF7E36]/10 blur-[100px] rounded-full" />
          </div>

          <div className="relative flex-1 flex flex-col items-center justify-center">
            <h2 className="text-3xl font-bold text-white text-center mb-4">
              Manage All Messages <br />
              <span className="text-[#007B85]">in One Place</span>
            </h2>

            <div className="relative mt-8 flex items-center justify-center w-[400px] h-[400px]">
              <div className="absolute z-20 w-20 h-20 rounded-[2.1rem] bg-white dark:bg-[#162228] flex items-center justify-center shadow-[0_10px_40px_rgba(0,0,0,0.3)] ring-4 ring-[#213138] dark:ring-white/5">
                <div className="w-18 h-18 relative">
                  <Image
                    src="/tropichat-logo.png"
                    alt="TropiChat"
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="absolute w-44 h-44 rounded-full border border-white/10" />
              <div className="absolute w-72 h-72 rounded-full border border-white/20" />
              <div className="absolute w-[380px] h-[380px] rounded-full border border-white/10" />

              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute w-44 h-44"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white dark:bg-[#162228] shadow-xl flex items-center justify-center -rotate-[inherit] ring-1 ring-slate-100 dark:ring-white/5 p-1.5">
                  <WhatsAppBrandIcon className="w-full h-full" />
                </div>
              </motion.div>

              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute w-72 h-72"
              >
                <div className="absolute top-[14.6%] left-[85.4%] -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-white dark:bg-[#162228] shadow-xl flex items-center justify-center -rotate-[inherit] ring-1 ring-slate-100 dark:ring-white/5 p-2">
                  <InstagramBrandIcon className="w-full h-full" />
                </div>
                <div className="absolute top-[88%] left-[12%] -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-white dark:bg-[#162228] shadow-xl flex items-center justify-center -rotate-[inherit] ring-1 ring-slate-100 dark:ring-white/5 p-2">
                  <MessengerBrandIcon className="w-full h-full" />
                </div>
              </motion.div>

              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="absolute w-[380px] h-[380px]"
              >
                <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-white dark:bg-[#162228] shadow-xl flex items-center justify-center -rotate-[inherit] ring-1 ring-slate-100 dark:ring-white/5">
                  <CheckCircle weight="bold" className="w-7 h-7 text-[#007B85]" />
                </div>
                <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-xl bg-white dark:bg-[#162228] shadow-xl flex items-center justify-center -rotate-[inherit] ring-1 ring-slate-100 dark:ring-white/5">
                  <div className="flex flex-col items-center">
                    <div className="text-[10px] font-bold text-[#FF7E36]">VIP</div>
                    <div className="w-6 h-1 rounded-full bg-[#FF7E36]/20 mt-0.5" />
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-white/70 max-w-sm mx-auto text-sm leading-relaxed">
                Compatible with <span className="font-bold text-white">WhatsApp, Instagram, Facebook</span> and more for a smooth messaging experience.
              </p>
            </div>

            <div className="mt-12 flex justify-center gap-2">
              <div className="h-1.5 w-10 rounded-full bg-[#007B85]" />
              <div className="h-1.5 w-5 rounded-full bg-white/10" />
              <div className="h-1.5 w-5 rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
