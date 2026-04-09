"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Sliders, Power, PlayCircle } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

export function AdminScraperSettings() {
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isRunningScheduled, setIsRunningScheduled] = useState(false)
  const [scheduleSettings, setScheduleSettings] = useState<{
    enabled: boolean;
    days: string[];
    time: string;
    query_history: string[];
  }>({
    enabled: false,
    days: ["tuesday", "wednesday", "thursday"],
    time: "08:30",
    query_history: []
  })

  useEffect(() => {
    fetchScheduleSettings()
  }, [])

  const fetchScheduleSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings")
      if (res.ok) {
        const data = await res.json()
        setScheduleSettings({
          enabled: data.enabled ?? false,
          days: data.days || ["tuesday", "wednesday", "thursday"],
          time: data.time || "08:30",
          query_history: data.query_history || []
        })
      }
    } catch {
      // Use defaults (already set in initial state)
    }
  }

  const saveScheduleSettings = async () => {
    setIsSavingSettings(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleSettings)
      })
      if (res.ok) {
        toast.success("Schedule settings saved!")
      } else {
        toast.error("Failed to save settings")
      }
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setIsSavingSettings(false)
    }
  }

  const runScheduledScrape = async () => {
    setIsRunningScheduled(true)
    const id = toast.loading("Running scrape + building Call Today list...")
    try {
      const res = await fetch("/api/admin/cron/scrape", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        toast.success(`Done! ${data.newLeads} new leads scraped. Reloading queue...`, { id })
        if (typeof window !== 'undefined') {
          setTimeout(() => window.location.reload(), 1500)
        }
      } else {
        toast.error(data.reason || "Scrape failed", { id })
      }
    } catch {
      toast.error("Failed to reach scraping engine", { id })
    } finally {
      setIsRunningScheduled(false)
    }
  }

  const toggleDay = (day: string) => {
    setScheduleSettings(s => ({
      ...s,
      days: s.days.includes(day) ? s.days.filter(d => d !== day) : [...s.days, day]
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[15px] font-bold text-gray-900 dark:text-white mb-2">Platform Scrape System</h2>
        <p className="text-[13px] text-gray-500 dark:text-[#888] leading-relaxed max-w-2xl">
          Configure the automated Instagram/Facebook scraper. When enabled, this will automatically run the selected query,
          extract DMs/pages, and funnel them into the Call Today queue for your outreach teams.
        </p>
      </div>

      <div className="rounded-[2rem] border border-gray-200 dark:border-[#1C1C1C] bg-white dark:bg-[#0C0C0C] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 dark:border-[#1C1C1C] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-white/5 rounded-xl">
              <Sliders weight="bold" className="h-5 w-5 text-[#007B85]" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#213138] dark:text-white font-poppins uppercase tracking-tight">Scrape Schedule</h3>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Auto-populate Call Today</p>
            </div>
          </div>
          <button
            onClick={() => setScheduleSettings(s => ({ ...s, enabled: !s.enabled }))}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all",
              scheduleSettings.enabled
                ? "bg-[#007B85]/10 border-[#007B85]/40 text-[#007B85]"
                : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400 hover:border-gray-300"
            )}
          >
            <Power weight="bold" className="h-4 w-4" />
            {scheduleSettings.enabled ? "ON" : "OFF"}
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Days */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2.5">Days</p>
            <div className="flex flex-wrap gap-2">
              {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(day => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all",
                    scheduleSettings.days.includes(day)
                      ? "bg-[#007B85]/10 border-[#007B85]/40 text-[#007B85]"
                      : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400 hover:border-gray-300 dark:hover:border-white/20"
                  )}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Time & Query */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Time (CST)</p>
              <input
                type="time"
                value={scheduleSettings.time}
                onChange={e => setScheduleSettings(s => ({ ...s, time: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-[#213138] dark:text-white focus:border-[#007B85] outline-none transition-all"
              />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">AI Search History</p>
              {scheduleSettings.query_history?.length > 0 ? (
                <div className="w-full px-4 py-2 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-xl max-h-[140px] overflow-y-auto">
                  {scheduleSettings.query_history.map((q, idx) => (
                    <div key={idx} className="flex items-center gap-2 py-1.5 border-b border-gray-100 dark:border-white/5 last:border-0">
                      <div className="w-4 h-4 rounded-full bg-[#007B85]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[8px] font-bold text-[#007B85]">{scheduleSettings.query_history.length - idx}</span>
                      </div>
                      <span className="text-xs font-bold text-[#213138] dark:text-gray-300">{q}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-400 italic">
                  No history yet. Tropi AI will determine the first query.
                </div>
              )}
            </div>
          </div>

          {/* Save + Run Now */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={saveScheduleSettings}
              disabled={isSavingSettings}
              className="flex-1 py-2.5 bg-[#007B85] hover:bg-[#006A73] text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {isSavingSettings ? "Saving..." : "Save Settings"}
            </button>
            <button
              onClick={runScheduledScrape}
              disabled={isRunningScheduled}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-[#213138] dark:text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              <PlayCircle weight="fill" className={cn("h-4 w-4 text-[#007B85]", isRunningScheduled && "animate-spin")} />
              {isRunningScheduled ? "Running..." : "Run Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
