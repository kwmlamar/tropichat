"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase, WaitlistEntry } from "@/lib/supabase"
import { toast } from "sonner"
import { Gift, Sparkles, CheckCircle2, Lock } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  business_type: z.string().min(1, "Please select your business type"),
  phone: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export function WaitlistSection() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const businessType = watch("business_type")

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)

    try {
      const entry: WaitlistEntry = {
        name: data.name,
        email: data.email,
        business_type: data.business_type,
        phone: data.phone || undefined,
      }

      const { error } = await supabase.from("waitlist").insert([entry])

      if (error) {
        if (error.code === "23505") {
          toast.error("This email is already on the waitlist!")
        } else {
          throw error
        }
      } else {
        setIsSuccess(true)
        toast.success("You're on the list!")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <section
        id="waitlist"
        className="relative overflow-hidden bg-gradient-to-br from-[#213138] to-[#1a4a50] py-24 md:py-32"
      >
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[#3A9B9F]/20 blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-lg text-center"
          >
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
              <CheckCircle2 className="h-10 w-10 text-[#3A9B9F]" />
            </div>
            <h2 className="mb-4 text-3xl font-bold text-white font-[family-name:var(--font-poppins)] md:text-4xl">
              You're on the list!
            </h2>
            <p className="mb-8 text-lg text-teal-100/80">
              We'll send you an email as soon as TropiChat is ready to launch. Keep an eye on your inbox!
            </p>
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm ring-1 ring-white/10">
              <p className="text-teal-100">
                <Gift className="mb-2 inline-block h-5 w-5" /> As one of our first 100 signups, you'll get{" "}
                <span className="font-bold text-white">3 months at 50% off</span>{" "}
                when we launch!
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section
      id="waitlist"
      className="relative overflow-hidden bg-gradient-to-br from-[#213138] to-[#1a4a50] py-24 md:py-32"
    >
      {/* Background glow */}
      <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[#3A9B9F]/20 blur-3xl pointer-events-none" />
      <div className="absolute -right-40 bottom-0 h-80 w-80 rounded-full bg-[#FF8B66]/10 blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white/80 backdrop-blur-sm ring-1 ring-white/20">
              <Sparkles className="h-4 w-4 text-[#3A9B9F]" />
              Limited Early Access
            </div>
            <h2 className="mb-4 text-4xl font-bold text-white font-[family-name:var(--font-poppins)] md:text-5xl leading-tight">
              Be among the first to
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3A9B9F] to-teal-300">
                try TropiChat
              </span>
            </h2>
            <p className="text-lg text-teal-100/80">
              Join our waitlist and get exclusive early access when we launch
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="rounded-2xl bg-white p-8 shadow-[0_32px_80px_rgba(0,0,0,0.3)] md:p-10"
            >
              <div className="space-y-5">
                {/* Name & Email row */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="name" className="text-sm font-semibold text-slate-700 mb-1.5 block">
                      Name <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Your full name"
                      {...register("name")}
                      className="rounded-xl border-slate-200 h-11 focus-visible:ring-[#3A9B9F]"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-700 mb-1.5 block">
                      Email <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      {...register("email")}
                      className="rounded-xl border-slate-200 h-11 focus-visible:ring-[#3A9B9F]"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                {/* Business Type & Phone row */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="business_type" className="text-sm font-semibold text-slate-700 mb-1.5 block">
                      Business Type <span className="text-red-400">*</span>
                    </Label>
                    <Select
                      onValueChange={(value) => setValue("business_type", value)}
                      value={businessType}
                    >
                      <SelectTrigger className="rounded-xl border-slate-200 h-11 focus:ring-[#3A9B9F]">
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restaurant">Restaurant</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="tour-operator">Tour Operator</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.business_type && (
                      <p className="mt-1 text-xs text-red-500">{errors.business_type.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-semibold text-slate-700 mb-1.5 block">
                      Phone <span className="text-xs font-normal text-slate-400">(Optional)</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (242) 555-0123"
                      {...register("phone")}
                      className="rounded-xl border-slate-200 h-11 focus-visible:ring-[#3A9B9F]"
                    />
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-[#3A9B9F] text-base font-semibold text-white hover:bg-[#2F8488] h-12 shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Joining...
                    </span>
                  ) : (
                    "Get Early Access"
                  )}
                </Button>

                <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <Lock className="h-3 w-3" />
                  No credit card required · Cancel anytime · Setup in 5 min
                </p>
              </div>
            </form>

            {/* Incentive Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-5 text-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium text-white/80 backdrop-blur-sm ring-1 ring-white/10">
                <Gift className="h-4 w-4 text-[#FF8B66]" />
                First 100 signups get 3 months at 50% off
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
