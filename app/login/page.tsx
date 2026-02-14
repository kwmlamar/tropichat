"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "@/lib/supabase"
import { handleFacebookLogin } from "@/lib/facebook-auth"
import { toast } from "sonner"

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFacebookLoading, setIsFacebookLoading] = useState(false)

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

  const onFacebookLogin = async () => {
    setIsFacebookLoading(true)

    try {
      const result = await handleFacebookLogin()

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(result.isNewUser ? "Account created! Welcome to TropiChat!" : "Welcome back!")
      router.push("/dashboard")
    } catch (err) {
      toast.error("Something went wrong with Facebook login. Please try again.")
      console.error("Facebook login error:", err)
    } finally {
      setIsFacebookLoading(false)
    }
  }

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

            {/* Facebook Login Button */}
            <Button
              type="button"
              onClick={onFacebookLogin}
              disabled={isFacebookLoading || isLoading}
              className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white py-6 h-auto text-base font-semibold mb-6"
            >
              {isFacebookLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FacebookIcon className="h-5 w-5" />
                  Continue with Facebook
                </span>
              )}
            </Button>

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
                disabled={isLoading || isFacebookLoading}
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
