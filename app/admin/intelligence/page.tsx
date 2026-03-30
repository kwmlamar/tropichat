"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Robot, 
  Cpu, 
  Lightning, 
  CheckCircle, 
  Target, 
  TrendUp, 
  Clock, 
  ChatCircleText,
  ShieldCheck,
  Brain,
  CaretRight,
  Terminal,
  ArrowsClockwise,
  Users
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import Link from "next/link"

// This would eventually fetch from the Paperclip API (Port 3100)
// For now, it's a high-fidelity "live" mockup that reflects the current state of the agents.
const INITIAL_AGENTS = [
  {
    id: "ceo",
    name: "CEO",
    status: "thinking",
    currentTask: "Recalculating Revenue Math for $5,000 MRR Phase 1 target.",
    lastActive: "2 mins ago",
    color: "bg-amber-500",
    icon: Target
  },
  {
    id: "cmo",
    name: "CMO",
    status: "done",
    currentTask: "Finalized Top 20 Bahamas Lead List & Outreach Scripts.",
    lastActive: "15 mins ago",
    color: "bg-blue-500",
    icon: ChatCircleText
  },
  {
    id: "cto-2",
    name: "CTO 2",
    status: "executing",
    currentTask: "Deploying Intelligence Hub UI & Admin API integrations.",
    lastActive: "Just now",
    color: "bg-teal-500",
    icon: Cpu
  },
  {
    id: "ux",
    name: "UX Designer",
    status: "idle",
    currentTask: "Awaiting review on Public Booking Page design polish.",
    lastActive: "1 hour ago",
    color: "bg-purple-500",
    icon: Brain
  }
]

const LOG_ENTRIES = [
  { time: "11:58", agent: "CTO 2", action: "Updated database schema for Coconut/Tropic/Island Pro pricing." },
  { time: "11:57", agent: "CTO 2", action: "Applied 3-column pricing grid to landing page." },
  { time: "11:50", agent: "CMO", action: "Generated 'Salon Closer' script for Nassau outreach." },
  { time: "11:45", agent: "CEO", action: "Updated company North Star to $30,000 MRR." },
  { time: "11:30", agent: "CEO", action: "Approved CMO's 'Bahamas-First' strategy document." },
  { time: "10:15", agent: "UX", action: "Analyzed mobile booking flow for high-fidelity cleanup." },
]

export default function IntelligenceHub() {
  const [mrr, setMrr] = useState(0)
  const [targetMrr] = useState(5000)
  const [northStar] = useState(30000)

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      
      {/* Header & Goal Radar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#007B85]/20 text-[#007B85]">
              <Brain weight="fill" className="h-6 w-6" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-[#213138] dark:text-white">Intelligence Hub</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[11px] flex items-center gap-2 pl-1">
             Autonomous Workforce Status: <span className="text-green-500 animate-pulse">Running Full Power</span>
          </p>
        </div>

        {/* Goal Radar */}
        <div className="bg-white dark:bg-[#0C0C0C] rounded-[2rem] border border-gray-100 dark:border-[#1C1C1C] p-6 flex items-center gap-8 shadow-sm">
           <div className="relative h-24 w-24">
              <svg className="h-24 w-24 transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100 dark:text-[#111]" />
                <motion.circle 
                  cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                  initial={{ strokeDasharray: "251.2", strokeDashoffset: "251.2" }}
                  animate={{ strokeDashoffset: 251.2 - (251.2 * 0.12) }} 
                  className="text-[#007B85]" 
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                 <p className="text-sm font-black text-[#213138] dark:text-white">12%</p>
              </div>
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Phase 1 Target</p>
              <p className="text-2xl font-black text-[#213138] dark:text-white mb-1">$5,000 <span className="text-sm text-gray-400 font-bold tracking-tight">MRR</span></p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-[#007B85]">
                 <TrendUp weight="bold" /> 30% increase vs last month
              </div>
           </div>
           <div className="h-12 w-px bg-gray-100 dark:bg-[#1C1C1C]" />
           <div className="hidden sm:block">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/50 mb-1">North Star</p>
              <p className="text-xl font-black text-[#213138] dark:text-white opacity-50">$30,000 <span className="text-xs">MRR</span></p>
           </div>
        </div>
      </div>

      {/* Agent Roster */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {INITIAL_AGENTS.map((agent) => (
          <motion.div
            key={agent.id}
            whileHover={{ y: -5 }}
            className="group relative overflow-hidden bg-white dark:bg-[#0C0C0C] border border-gray-100 dark:border-[#1C1C1C] rounded-[2.5rem] p-8 shadow-sm hover:border-[#007B85]/50 transition-all"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={cn("p-3 rounded-2xl text-white shadow-lg", agent.color)}>
                <agent.icon weight="fill" className="h-6 w-6" />
              </div>
              <div className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                agent.status === "thinking" ? "bg-amber-100 text-amber-600 animate-pulse" :
                agent.status === "executing" ? "bg-teal-100 text-teal-600" :
                agent.status === "done" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"
              )}>
                {agent.status}
              </div>
            </div>

            <h3 className="text-xl font-black text-[#213138] dark:text-white mb-2">{agent.name}</h3>
            <p className="text-[13px] font-bold text-gray-500 dark:text-[#A3A3A3] leading-relaxed mb-6 h-12 overflow-hidden line-clamp-2">
              {agent.currentTask}
            </p>

            <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-[#1C1C1C]">
              <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1.5">
                <Clock weight="bold" /> {agent.lastActive}
              </span>
              <Link href="http://localhost:3100" target="_blank" className="text-[#007B85] hover:underline text-[10px] font-black uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Board <CaretRight weight="bold" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Live Thinking Feed (Terminal) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Memory Termimal */}
        <div className="lg:col-span-8 bg-[#0D0D0D] rounded-[2.5rem] border border-[#1C1C1C] shadow-2xl overflow-hidden flex flex-col h-[500px]">
           <div className="flex items-center justify-between px-6 py-4 border-b border-[#1C1C1C] bg-[#0A0A0A]">
              <div className="flex items-center gap-3">
                 <Terminal weight="fill" className="text-[#3A9B9F] h-4 w-4" />
                 <span className="text-[11px] font-black uppercase tracking-widest text-gray-500">Paperclip Audit Log — Live</span>
              </div>
              <div className="flex gap-1.5">
                 <div className="h-2 w-2 rounded-full bg-red-500/50" />
                 <div className="h-2 w-2 rounded-full bg-amber-500/50" />
                 <div className="h-2 w-2 rounded-full bg-green-500/50" />
              </div>
           </div>
           <div className="flex-1 overflow-y-auto p-8 font-mono text-[13px] space-y-4 scrollbar-hide">
              {LOG_ENTRIES.map((log, i) => (
                <div key={i} className="flex gap-4 group">
                  <span className="text-[#333] font-bold shrink-0">{log.time}</span>
                  <span className="text-[#007B85] font-black shrink-0">[{log.agent}]</span>
                  <span className="text-gray-400 group-hover:text-gray-200 transition-colors">{log.action}</span>
                </div>
              ))}
              <div className="flex gap-4 animate-pulse">
                <span className="text-[#333] font-bold shrink-0">12:27</span>
                <span className="text-teal-500 font-black">● [ANTIGRAVITY]</span>
                <span className="text-white font-bold italic">Building Intelligence Hub UI... 🚀</span>
              </div>
           </div>
        </div>

        {/* Quick Missions Card */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white dark:bg-[#0C0C0C] rounded-[2.5rem] border border-gray-100 dark:border-[#1C1C1C] p-8 shadow-sm">
              <h3 className="text-lg font-black text-[#213138] dark:text-white mb-6 flex items-center gap-3">
                 <Lightning weight="fill" className="text-amber-500" /> Open Missions
              </h3>
              <div className="space-y-4">
                 {[
                   { title: "Public Booking Page", status: "In Progress", type: "UX/CTO" },
                   { title: "Bahamas Call List", status: "Done", type: "CMO" },
                   { title: "Service Catalog Backend", status: "In Progress", type: "CTO" },
                   { title: "Revenue Pivot ($5k MRR)", status: "Active", type: "CEO" }
                 ].map((mission, i) => (
                   <div key={i} className="p-4 rounded-2xl bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-white/5 flex items-center justify-between group cursor-default">
                      <div>
                         <p className="text-sm font-bold text-[#213138] dark:text-white mb-0.5">{mission.title}</p>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{mission.type}</p>
                      </div>
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        mission.status === "Done" ? "bg-green-500" : "bg-amber-500 animate-pulse"
                      )} />
                   </div>
                 ))}
              </div>
              <button className="w-full mt-6 py-4 rounded-2xl bg-[#213138] dark:bg-white dark:text-[#0C0C0C] text-white font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all">
                 Launch New Mission
              </button>
           </div>

           <div className="bg-gradient-to-br from-[#007B85] to-[#2F8488] rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 h-32 w-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700" />
              <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                 <ShieldCheck weight="fill" /> Advisor Note
              </h4>
              <p className="text-sm font-bold italic opacity-90 leading-relaxed">
                 "You are ahead of 99% of founders in the Caribbean right now. Execute the 10-user plan tomorrow and let the agents handle the polish."
              </p>
           </div>
        </div>
      </div>

    </div>
  )
}
