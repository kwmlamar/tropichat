"use client"

import { cn } from "@/lib/utils"
import type { ChannelType } from "@/types/unified-inbox"

interface ChannelIconProps {
  channel: ChannelType
  size?: "sm" | "md" | "lg" | "xl" | "2xl"
  className?: string
  showLabel?: boolean
}

import React, { useId } from "react"

function InstaSvg({ className }: { className: string }) {
  const id = useId()
  const gradId = `insta-${id}`
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="5" fill={`url(#${gradId})`} />
      <path d="M12 6.8c-2.8 0-5.1 2.3-5.1 5.2s2.3 5.2 5.1 5.2 5.1-2.3 5.1-5.2S14.8 6.8 12 6.8zm0 8.4c-1.8 0-3.3-1.5-3.3-3.2 0-1.8 1.5-3.2 3.3-3.2s3.3 1.4 3.3 3.2c0 1.7-1.4 3.2-3.3 3.2zM18.8 6.9c0 .6-.5 1.1-1.1 1.1-.6 0-1.1-.5-1.1-1.1 0-.6.5-1.1 1.1-1.1.6 0 1.1.5 1.1 1.1z" fill="white" />
      <path d="M12 2c-2.7 0-3.1 0-4.1.1-1 .1-1.7.3-2.3.5-.6.2-1.1.6-1.6 1.1-.5.5-.9 1-1.1 1.6-.2.6-.4 1.3-.5 2.3-.1 1-.1 1.4-.1 4.1s0 3.1.1 4.1c.1 1 .3 1.7.5 2.3.2.6.6 1.1 1.1 1.6.5.5 1 1 1.6 1.1.6.2 1.3.4 2.3.5 1 .1 1.4.1 4.1.1s3.1 0 4.1-.1c1-.1 1.7-.3 2.3-.5.6-.2 1.1-.6 1.6-1.1.5-.5.9-1 1.1-1.6.2-.6.4-1.3.5-2.3.1-1 .1-1.4.1-4.1s0-3.1-.1-4.1c-.1-1-.3-1.7-.5-2.3-.2-.6-.6-1.1-1.1-1.6-.5-.5-1-1-1.6-1.1-.6-.2-1.3-.4-2.3-.5C15.1 2 14.7 2 12 2zm0 1.8c2.7 0 3 0 4 .1.9.1 1.4.2 1.7.3.4.2.7.4 1 .7.3.3.5.6.7 1 .1.3.3.8.4 1.7.1 1 .1 1.3.1 4s0 3-.1 4c-.1.9-.2 1.4-.3 1.7-.2.4-.4.7-.7 1-.3.3-.6.5-1 .7-.3.1-.8.3-1.7.4-1 .1-1.3-.1-4 .1s-3 0-4-.1c-.9-.1-1.4-.2-1.7-.3-.4-.2-.7-.4-1-.7-.3-.3-.5-.6-.7-1-.1-.3-.3-.8-.4-1.7-.1-1-.1-1.3-.1-4s0-3 .1-4c.1-.9.2-1.4.3-1.7.2-.4.4-.7.7-1 .3-.3.6-.5 1-.7.3-.1.8-.3 1.7-.4 1-.1 1.3-.1 4-.1z" fill="white" />
      <defs>
        <linearGradient id={gradId} x1="2.5" y1="21.5" x2="21.6" y2="2.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F58529" />
          <stop offset="0.1" stopColor="#FEDA77" />
          <stop offset="0.5" stopColor="#DD2A7B" />
          <stop offset="1" stopColor="#8134AF" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function MessengerSvg({ className }: { className: string }) {
  const id = useId()
  const gradId = `messenger-${id}`
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.5C6.75 2.5 2.5 6.4 2.5 11.2C2.5 13.9 3.8 16.3 6 17.9C6.2 18 6.3 18.2 6.3 18.5L6.3 20.6C6.3 20.8 6.5 21 6.7 20.9L9 19.6C9.1 19.5 9.3 19.5 9.4 19.5C10.2 19.7 11.1 19.9 12 19.9C17.25 19.9 21.5 16 21.5 11.2C21.5 6.4 17.25 2.5 12 2.5Z" fill={`url(#${gradId})`} />
      <path d="M6.5 12.8L9.6 7.8C9.9 7.4 10.5 7.3 10.9 7.6L13.8 9.8C14 10 14.2 10 14.4 9.8L17.9 7.2C18.1 7 18.4 7.2 18.4 7.5L15.3 12.5C14.9 13.1 14.3 13.2 13.9 12.9L11 10.7C10.8 10.5 10.6 10.5 10.4 10.7L6.9 13.3C6.7 13.5 6.4 13.3 6.4 13.1C6.4 13.1 6.4 12.9 6.5 12.8Z" fill="white" />
      <defs>
        <linearGradient id={gradId} x1="12" y1="19.9" x2="12" y2="2.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0084FF" />
          <stop offset="1" stopColor="#00C6FF" />
        </linearGradient>
      </defs>
    </svg>
  )
}

const channelConfig = {
  whatsapp: {
    label: "WhatsApp",
    color: "text-[#25D366]",
    bg: "bg-[#25D366]/10",
    borderColor: "border-[#25D366]/20",
    icon: (className: string) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.072 1.761C6.462 1.761 1.9 6.323 1.9 11.933c0 1.79.467 3.538 1.353 5.074L1 22.423l5.589-1.465a10.124 10.124 0 004.483 1.056h.004c5.61 0 10.172-4.562 10.172-10.172 0-2.72-1.059-5.276-2.981-7.198a10.116 10.116 0 00-7.2-2.983z" fill="#25D366" />
        <path d="M17.472 14.382c-.301-.15-1.767-.872-2.04-.971-.272-.099-.47-.149-.669.15-.198.299-.769.971-.942 1.171-.173.199-.347.225-.648.075-.301-.15-1.272-.469-2.422-1.496-.893-.797-1.495-1.782-1.67-2.081-.174-.3-.018-.462.13-.61.137-.133.3-.349.45-.523.15-.174.199-.298.298-.497.1-.199.05-.374-.025-.523-.075-.15-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.011c-.198 0-.52.074-.792.373-.272.299-1.04 1.016-1.04 2.479 0 1.463 1.065 2.877 1.213 3.076.149.199 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.766-.721 2.015-1.419.25-.699.25-1.296.174-1.419-.075-.123-.276-.199-.577-.349z" fill="white" />
      </svg>
    ),
  },
  instagram: {
    label: "Instagram",
    color: "text-[#DD2A7B]",
    bg: "bg-[#DD2A7B]/10",
    borderColor: "border-[#DD2A7B]/20",
    icon: (className: string) => <InstaSvg className={className} />,
  },
  messenger: {
    label: "Messenger",
    color: "text-[#0084FF]",
    bg: "bg-[#0084FF]/10",
    borderColor: "border-[#0084FF]/20",
    icon: (className: string) => <MessengerSvg className={className} />,
  },
}

const sizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
  xl: "h-12 w-12",
  "2xl": "h-16 w-16",
}

const badgeSizeMap = {
  sm: "p-1",
  md: "p-1.5",
  lg: "p-2",
  xl: "p-0",
  "2xl": "p-0",
}

export function ChannelIcon({ channel, size = "md", className, showLabel }: ChannelIconProps) {
  const config = channelConfig[channel]
  if (!config) return null

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center p-0.5",
          badgeSizeMap[size]
        )}
        title={config.label}
      >
        {config.icon(cn(sizeMap[size]))}
      </div>
      {showLabel && (
        <span className={cn("text-xs font-medium", config.color)}>{config.label}</span>
      )}
    </div>
  )
}

export function getChannelLabel(channel: ChannelType): string {
  return channelConfig[channel]?.label ?? channel
}

export { channelConfig }
