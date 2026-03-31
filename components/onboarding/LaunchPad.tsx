"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "@phosphor-icons/react"
import { LaunchStep, type StepStatus } from "./LaunchStep"
import { HandleInput } from "./HandleInput"
import { ServiceQuickAdd } from "./ServiceQuickAdd"
import { BookingPagePreview } from "./BookingPagePreview"
import { LaunchCelebration } from "./LaunchCelebration"
import { getSupabase } from "@/lib/supabase"
import { toast } from "sonner"

interface LaunchPadProps {
  businessName: string
  existingHandle?: string | null
  onClose: () => void
}

type StepId = "account" | "handle" | "service" | "preview" | "done"

const STEPS: { id: StepId; title: string }[] = [
  { id: "account", title: "Create your account" },
  { id: "handle", title: "Set your booking link" },
  { id: "service", title: "Add your first service" },
  { id: "preview", title: "Preview your page" },
]

const STORAGE_KEY = "launchpad_completed"

function markCompleted() {
  try { localStorage.setItem(STORAGE_KEY, "1") } catch {/* ignore */}
}

export function shouldShowLaunchPad(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "1"
  } catch {
    return false
  }
}

export function LaunchPad({ businessName, existingHandle, onClose }: LaunchPadProps) {
  const [currentStep, setCurrentStep] = useState<StepId>(existingHandle ? "service" : "handle")
  const [handle, setHandle] = useState(existingHandle ?? "")
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(existingHandle ? true : null)
  const [savingHandle, setSavingHandle] = useState(false)
  const [firstService, setFirstService] = useState<{
    name: string; durationMinutes: number; price: number
  } | null>(null)

  const completedSteps: StepId[] = ["account"]
  if (currentStep === "service" || currentStep === "preview" || currentStep === "done") completedSteps.push("handle")
  if (currentStep === "preview" || currentStep === "done") completedSteps.push("service")
  if (currentStep === "done") completedSteps.push("preview")

  const getStepStatus = (stepId: StepId): StepStatus => {
    if (completedSteps.includes(stepId)) return "completed"
    if (stepId === currentStep) return "active"
    return "upcoming"
  }

  // Progress 0–1
  const progress = completedSteps.length / STEPS.length

  const handleSaveHandle = useCallback(async () => {
    if (!handle || !handleAvailable) return
    setSavingHandle(true)
    try {
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { toast.error("Not authenticated"); return }

      const res = await fetch("/api/bookings/handle", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ handle }),
      })
      const json = await res.json()
      if (json.handle) {
        setCurrentStep("service")
      } else {
        toast.error(json.error || "Failed to save handle")
      }
    } catch {
      toast.error("Something went wrong.")
    } finally {
      setSavingHandle(false)
    }
  }, [handle, handleAvailable])

  const handleAddService = useCallback(async (service: { name: string; durationMinutes: number; price: number }) => {
    const supabase = getSupabase()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { toast.error("Not authenticated"); return }

    const res = await fetch("/api/services", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        name: service.name,
        duration_minutes: service.durationMinutes,
        price: service.price,
        price_type: "fixed",
      }),
    })
    if (!res.ok) {
      const json = await res.json()
      toast.error(json.error || "Failed to add service")
      return
    }
    setFirstService(service)
    setCurrentStep("preview")
  }, [])

  const handleSkipService = useCallback(() => {
    setCurrentStep("preview")
  }, [])

  const handleLaunch = useCallback(() => {
    setCurrentStep("done")
    markCompleted()
  }, [])

  const handleGoToDashboard = useCallback(() => {
    markCompleted()
    onClose()
  }, [onClose])

  if (currentStep === "done") {
    return (
      <LaunchCelebration
        handle={handle}
        businessName={businessName}
        onGoToDashboard={handleGoToDashboard}
      />
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-black text-white">You&apos;re almost live! 🏝️</h2>
          <p className="text-sm text-white/50 mt-0.5">
            {STEPS.length - completedSteps.length} quick step{STEPS.length - completedSteps.length !== 1 ? "s" : ""} to launch.
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-[11px] text-white/40 font-semibold mb-1.5">
          <span>{Math.round(progress * 100)}% complete</span>
          <span>{completedSteps.length} / {STEPS.length}</span>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#F4C430] rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        <LaunchStep stepNumber={1} title="Create your account" status={getStepStatus("account")} />

        <LaunchStep stepNumber={2} title="Set your booking link" status={getStepStatus("handle")}>
          <div className="space-y-3">
            <HandleInput
              value={handle}
              onChange={setHandle}
              onAvailabilityChange={setHandleAvailable}
            />
            <button
              onClick={handleSaveHandle}
              disabled={!handle || !handleAvailable || savingHandle}
              className="w-full bg-[#F4C430] text-[#0F172A] font-black py-2.5 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]"
            >
              {savingHandle ? "Saving…" : "Save My Link →"}
            </button>
          </div>
        </LaunchStep>

        <LaunchStep stepNumber={3} title="Add your first service" status={getStepStatus("service")}>
          <ServiceQuickAdd onAdd={handleAddService} onSkip={handleSkipService} />
        </LaunchStep>

        <LaunchStep stepNumber={4} title="Preview your page" status={getStepStatus("preview")}>
          <BookingPagePreview
            handle={handle}
            businessName={businessName}
            firstServiceName={firstService?.name}
            firstServiceDuration={firstService?.durationMinutes}
            firstServicePrice={firstService?.price}
            onLaunch={handleLaunch}
          />
        </LaunchStep>
      </div>
    </div>
  )
}
