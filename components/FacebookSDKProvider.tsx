"use client"

import { useEffect } from "react"

const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ""

// Global flag that facebook-auth.ts checks before calling FB.login()
declare global {
  interface Window {
    __fbInitialized?: boolean
  }
}

export default function FacebookSDKProvider() {
  useEffect(() => {
    if (window.__fbInitialized) return
    if (document.getElementById("facebook-jssdk")) return

    window.fbAsyncInit = () => {
      window.FB?.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: false,
        version: "v22.0",
      })
      window.__fbInitialized = true
      console.log("[FB SDK] Initialized successfully with app ID:", FACEBOOK_APP_ID)
    }

    const script = document.createElement("script")
    script.id = "facebook-jssdk"
    script.src = "https://connect.facebook.net/en_US/sdk.js"
    script.async = true
    script.defer = true
    document.body.appendChild(script)
  }, [])

  return null
}
