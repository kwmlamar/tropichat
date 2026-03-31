"use client"

import { useState } from "react"
import { CircleNotch } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120]

interface ServiceQuickAddProps {
  onAdd: (service: { name: string; durationMinutes: number; price: number }) => Promise<void>
  onSkip: () => void
}

export function ServiceQuickAdd({ onAdd, onSkip }: ServiceQuickAddProps) {
  const [name, setName] = useState("")
  const [duration, setDuration] = useState(60)
  const [price, setPrice] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedPrice = parseFloat(price)
    if (!name.trim()) { setError("Service name is required"); return }
    if (isNaN(parsedPrice) || parsedPrice < 0) { setError("Enter a valid price"); return }
    setError(null)
    setLoading(true)
    try {
      await onAdd({ name: name.trim(), durationMinutes: duration, price: parsedPrice })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Service name */}
      <div>
        <label className="block text-xs font-semibold text-white/60 mb-1.5">
          Service name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='e.g. "Braids & Locs"'
          className="w-full bg-[#1E293B] border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[#F4C430]/50"
        />
      </div>

      {/* Duration + Price */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1.5">Duration</label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full bg-[#1E293B] border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F4C430]/50 appearance-none"
          >
            {DURATION_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d} min
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1.5">Price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/40">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="50"
              className="w-full bg-[#1E293B] border border-white/15 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[#F4C430]/50"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* CTA */}
      <button
        type="submit"
        disabled={loading}
        className={cn(
          "w-full bg-[#F4C430] text-[#0F172A] font-black py-3 rounded-xl text-sm transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4C430]",
          loading && "opacity-70 cursor-not-allowed"
        )}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <CircleNotch className="h-4 w-4 animate-spin" />
            Saving…
          </span>
        ) : (
          "Add Service →"
        )}
      </button>

      <button
        type="button"
        onClick={onSkip}
        className="w-full text-sm text-white/30 hover:text-white/50 transition-colors py-1.5 focus-visible:outline-none"
      >
        Skip for now →
      </button>
    </form>
  )
}
