"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

    toast.success("Welcome back!")
    router.push("/dashboard")
  }

  const handleOAuth = async (provider: 'google') => {
    setOauthLoading(provider)

    const { error } = await signInWithOAuth(provider)

    if (error) {
      toast.error(error)
      setOauthLoading(null)
    }
    // On success, Supabase redirects to the provider — no need to handle here
  }

  const anyLoading = isLoading || oauthLoading !== null

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#3A9B9F] to-teal-700 p-12 flex-col justify-between">
        <div className="flex items-center">
          <Image
            src="/tropichat-full-logo2.png"
            alt="TropiChat"
            width={220}
            height={60}
            unoptimized
            className="h-14 w-auto object-contain"
          />
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Manage all your customer conversations in one place
          </h1>
          <p className="text-lg text-white/80">
            Organize customers, automate replies, and never miss a message again.
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm text-white/60">
          <span>🇧🇸 Built in the Bahamas • Now in Early Access</span>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Image
              src="/tropichat-full-logo2.png"
              alt="TropiChat"
              width={220}
              height={60}
              unoptimized
              className="h-14 w-auto object-contain"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-500 mt-2">Sign in to your account</p>
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <Button
                type="button"
                onClick={() => handleOAuth("google")}
                disabled={anyLoading}
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50 text-gray-700 py-6 h-auto text-base font-semibold"
              >
                {oauthLoading === "google" ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Connecting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <GoogleIcon className="h-5 w-5" />
                    Continue with Google
                  </span>
                )}
              </Button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-400">or sign in with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-[#3A9B9F] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={anyLoading}
                className="w-full bg-[#3A9B9F] hover:bg-[#2F8488] text-white py-6 h-auto text-base font-semibold"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-[#3A9B9F] font-medium hover:underline"
              >
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
