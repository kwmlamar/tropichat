"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CircleNotch, CheckCircle, XCircle } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface HandleInputProps {
  value: string
  onChange: (value: string) => void
  onAvailabilityChange?: (available: boolean | null) => void
}

type AvailabilityState = "idle" | "checking" | "available" | "taken" | "invalid"

export function HandleInput({ value, onChange, onAvailabilityChange }: HandleInputProps) {
  const [availability, setAvailability] = useState<AvailabilityState>("idle")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!value || value.length < 2) {
      setAvailability("idle")
      onAvailabilityChange?.(null)
      return
    }

    if (!/^[a-z0-9_-]+$/.test(value)) {
      setAvailability("invalid")
      onAvailabilityChange?.(false)
      return
    }

    setAvailability("checking")
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/bookings/handle/check?handle=${encodeURIComponent(value)}`)
        const json = await res.json()
        if (json.available) {
          setAvailability("available")
          onAvailabilityChange?.(true)
        } else {
          setAvailability("taken")
          onAvailabilityChange?.(false)
        }
      } catch {
        setAvailability("idle")
        onAvailabilityChange?.(null)
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "")
    onChange(cleaned)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-white/50">People book you at:</p>

      {/* Split input */}
      <div className="flex items-center rounded-xl border border-white/15 bg-[#1E293B] overflow-hidden focus-within:ring-2 focus-within:ring-[#F4C430]/50">
        <span className="px-3 py-2.5 text-sm text-white/40 border-r border-white/10 select-none whitespace-nowrap">
          tropichat.com/
        </span>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="yourname"
          maxLength={60}
          className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none"
          aria-label="Booking handle"
          aria-describedby="handle-status"
        />
        <div className="px-3 flex-shrink-0">
          {availability === "checking" && (
            <CircleNotch className="h-4 w-4 text-white/40 animate-spin" />
          )}
          {availability === "available" && (
            <CheckCircle weight="fill" className="h-4 w-4 text-[#0D9488]" />
          )}
          {(availability === "taken" || availability === "invalid") && (
            <XCircle weight="fill" className="h-4 w-4 text-red-400" />
          )}
        </div>
      </div>

      {/* Status message */}
      <AnimatePresence mode="wait">
        {availability !== "idle" && availability !== "checking" && (
          <motion.p
            id="handle-status"
            key={availability}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "text-xs font-semibold",
              availability === "available" ? "text-[#0D9488]" : "text-red-400"
            )}
          >
            {availability === "available" && "✓ Available"}
            {availability === "taken" && "✗ Already taken — try a different handle"}
            {availability === "invalid" && "✗ Letters, numbers, hyphens, and underscores only"}
          </motion.p>
        )}
      </AnimatePresence>

      <p className="text-[11px] text-white/30">Letters, numbers, hyphens, underscores · 2–60 characters</p>
    </div>
  )
}
