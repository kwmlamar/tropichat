"use client"

import { useEffect } from "react"

const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ""

export default function FacebookSDKProvider() {
  useEffect(() => {
    if (window.FB) return
    if (document.getElementById("facebook-jssdk")) return

    window.fbAsyncInit = () => {
      window.FB?.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: false,
        version: "v22.0",
      })
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
