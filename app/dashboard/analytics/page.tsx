"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  House, 
  Users, 
  Lightning, 
  ChatCircleDots, 
  ArrowRight,
  Clock,
  Target,
  ChartLineUp,
  CaretRight,
  CheckCircle,
  Circle
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { getSupabase } from "@/lib/supabase"
import Link from "next/link"

export default function HomePage() {
  const [userName, setUserName] = useState("there")
  const [stats, setStats] = useState({ channels: 0, contacts: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name.split(' ')[0])
      }

      // Fetch basic stats
      const { count: channelCount } = await supabase
        .from('connected_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      
      const { count: contactCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })

      setStats({
        channels: channelCount || 0,
        contacts: contactCount || 0
      })
      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-black p-6 lg:p-10 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Banner Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#213138] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[#213138] dark:text-white shadow-sm border border-gray-100 dark:border-none dark:shadow-lg overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#007B85]/5 dark:bg-[#007B85]/20 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 bg-[#007B85]/10 dark:bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Lightning weight="fill" className="h-6 w-6 text-[#FF7E36]" />
            </div>
            <div>
              <h3 className="font-bold text-lg">TropiChat × Gemini. Now we're talking.</h3>
              <p className="text-gray-500 dark:text-white/70 text-sm font-medium">Discover new AI-powered opportunities for your audience.</p>
            </div>
          </div>
          <Button className="bg-[#007B85] hover:bg-[#2F8488] text-white rounded-xl px-6 relative z-10 font-bold border-none">
            Discover
            <ArrowRight weight="bold" className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>

        {/* Greeting Section */}
        <div>
          <h1 className="text-4xl font-black text-[#213138] dark:text-white tracking-tight">
            Hello, {userName}!
          </h1>
          <div className="flex items-center gap-4 mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              {stats.channels} connected {stats.channels === 1 ? 'channel' : 'channels'}
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
            <div className="flex items-center gap-1.5 hover:text-[#007B85] cursor-pointer transition-colors">
              {stats.contacts} contacts
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
            <Link href="/dashboard/analytics" className="text-[#007B85] font-bold hover:underline">See Insights</Link>
          </div>
        </div>

        {/* Start Here Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#213138] dark:text-gray-100">Start here</h2>
            <Link href="/dashboard/automations" className="text-sm font-bold text-[#007B85] hover:underline flex items-center gap-1">
              Explore all Templates <CaretRight weight="bold" className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <QuickActionCard 
              title="Auto-DM from Comments"
              tag="Popular"
              icon={<ChatCircleDots weight="duotone" className="h-6 w-6 text-[#007B85]" />}
            />
            <QuickActionCard 
              title="Generate Leads with Stories"
              icon={<Lightning weight="duotone" className="h-6 w-6 text-[#007B85]" />}
            />
            <QuickActionCard 
              title="Respond to all your DMs"
              icon={<Users weight="duotone" className="h-6 w-6 text-[#007B85]" />}
            />
          </div>
        </section>

        {/* Your next best moves (Onboarding) */}
        <section className="bg-white dark:bg-[#0C0C0C] rounded-2xl border border-gray-100 dark:border-[#1C1C1C] p-8 shadow-sm">
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold text-[#213138] dark:text-gray-100 mb-2">Your next best moves</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">You're nailing it! Keep your audience's attention with these steps.</p>
            
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#007B85] uppercase tracking-wider">1 of 3 completed</span>
                <span className="text-xs font-bold text-gray-400">33%</span>
              </div>
              <Progress value={33} className="h-2 bg-gray-100 dark:bg-[#1A1A1A]" />
            </div>

            <div className="space-y-4">
              <OnboardingItem 
                title="Send Affiliate Product Links" 
                completed={false} 
              />
              <OnboardingItem 
                title="Grow Followers from Comments" 
                completed={false} 
              />
              <OnboardingItem 
                title="Set Up Default AI Reply" 
                completed={true} 
              />
            </div>
          </div>
        </section>

        {/* Your last 7 days */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#213138] dark:text-gray-100">Your last 7 days</h2>
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded-full border border-gray-200 dark:border-[#222222] hover:bg-gray-50 dark:hover:bg-[#111] transition-colors">
                <CaretRight weight="bold" className="h-4 w-4 rotate-180" />
              </button>
              <button className="p-1.5 rounded-full border border-gray-200 dark:border-[#222222] hover:bg-gray-50 dark:hover:bg-[#111] transition-colors">
                <CaretRight weight="bold" className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard 
              title="Engagement Winners"
              description="Checking who loves you the most... check back soon"
              icon={<ChartLineUp className="h-5 w-5 text-[#007B85]" />}
            />
            <StatsCard 
              title="Time Saved"
              description="No data. Launch an automation and check back in 24h"
              icon={<Clock className="h-5 w-5 text-[#007B85]" />}
            />
            <StatsCard 
              title="Leads Collected"
              description="No data. Automate lead collection and check back in 24h"
              icon={<Target className="h-5 w-5 text-[#007B85]" />}
            />
          </div>
        </section>

      </div>
    </div>
  )
}

function QuickActionCard({ title, tag, icon }: { title: string, tag?: string, icon: React.ReactNode }) {
  return (
    <div className="group bg-white dark:bg-[#0C0C0C] border border-gray-100 dark:border-[#1C1C1C] rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
      {tag && (
        <span className="absolute top-4 right-4 text-[10px] font-black text-white bg-[#FF7E36] px-2 py-0.5 rounded uppercase tracking-widest">
          {tag}
        </span>
      )}
      <div className="mb-4 h-10 w-10 bg-[#007B85]/5 rounded-xl flex items-center justify-center group-hover:bg-[#007B85]/10 transition-colors">
        {icon}
      </div>
      <h3 className="font-bold text-[#213138] dark:text-gray-100 leading-tight mb-2">{title}</h3>
      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
        <Lightning weight="fill" className="h-3 w-3" />
        Quick Automation
      </p>
    </div>
  )
}

function OnboardingItem({ title, completed }: { title: string, completed: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group",
      completed 
        ? "bg-gray-50/50 dark:bg-[#050505] border-gray-100 dark:border-[#111] opacity-60" 
        : "bg-white dark:bg-[#0C0C0C] border-gray-100 dark:border-[#1C1C1C] hover:border-[#007B85]/30 hover:shadow-sm"
    )}>
      <div className="flex items-center gap-3">
        {completed ? (
          <CheckCircle weight="fill" className="h-6 w-6 text-[#007B85]" />
        ) : (
          <Circle className="h-6 w-6 text-gray-300 dark:text-gray-700 group-hover:text-[#007B85]" />
        )}
        <span className={cn("text-sm font-bold", completed ? "text-gray-500 line-through" : "text-[#213138] dark:text-gray-200")}>
          {title}
        </span>
      </div>
      {!completed && <CaretRight className="h-4 w-4 text-gray-300" />}
    </div>
  )
}

function StatsCard({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#0C0C0C] border border-gray-100 dark:border-[#1C1C1C] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 bg-[#007B85]/5 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-bold text-[#213138] dark:text-gray-100 text-sm">{title}</h3>
      </div>
      <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
        {description}
      </p>
      <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#007B85] hover:underline cursor-pointer">
        Explore templates <CaretRight weight="bold" className="h-2.5 w-2.5" />
      </div>
    </div>
  )
}
