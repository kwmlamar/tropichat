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
import { Gift, Sparkles, CheckCircle2 } from "lucide-react"

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
          // Duplicate email
          toast.error("This email is already on the waitlist!")
        } else {
          throw error
        }
      } else {
        setIsSuccess(true)
        toast.success("Welcome to the waitlist! 🎉")
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
        className="bg-gradient-to-br from-[#25D366] to-emerald-600 py-20 md:py-28"
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl text-center"
          >
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-white">
              <CheckCircle2 className="h-10 w-10 text-[#25D366]" />
            </div>
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              You're on the list! 🎉
            </h2>
            <p className="mb-8 text-lg text-green-50">
              We'll send you an email as soon as TropiChat is ready to launch.
              Keep an eye on your inbox!
            </p>
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
              <p className="text-green-50">
                <Gift className="mb-2 inline-block h-5 w-5" /> As one of our
                first 100 signups, you'll get{" "}
                <span className="font-bold text-white">
                  3 months at 50% off
                </span>{" "}
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
      className="relative overflow-hidden bg-gradient-to-br from-[#25D366] to-emerald-600 py-20 md:py-28"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-1/4 top-0 h-96 w-96 rounded-full bg-white opacity-10 blur-3xl" />
        <div className="absolute -left-1/4 bottom-0 h-96 w-96 rounded-full bg-white opacity-10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              Limited Early Access
            </div>
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              Be Among the First to Try TropiChat
            </h2>
            <p className="text-lg text-green-50">
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
              className="rounded-2xl bg-white p-8 shadow-2xl md:p-10"
            >
              <div className="space-y-6">
                {/* Name Field */}
                <div>
                  <Label htmlFor="name" className="text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    {...register("name")}
                    className="mt-2"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <Label htmlFor="email" className="text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    {...register("email")}
                    className="mt-2"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Business Type Field */}
                <div>
                  <Label htmlFor="business_type" className="text-gray-700">
                    Business Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => setValue("business_type", value)}
                    value={businessType}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select your business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.business_type && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.business_type.message}
                    </p>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <Label htmlFor="phone" className="text-gray-700">
                    Phone Number (Optional)
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (242) 555-0123"
                    {...register("phone")}
                    className="mt-2"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#25D366] text-lg font-semibold text-white hover:bg-[#20BD5B] py-6 h-auto shadow-lg hover:shadow-xl hover:shadow-[#25D366]/25 transition-all duration-300 btn-press hover-shine overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Joining...
                    </span>
                  ) : "Get Early Access"}
                </Button>
              </div>
            </form>

            {/* Incentive Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-6 text-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm">
                <Gift className="h-5 w-5" />
                First 100 signups get 3 months at 50% off
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
