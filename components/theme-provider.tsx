"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { usePathname } from "next/navigation"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const pathname = usePathname()
  
  // Public-facing marketing and legal pages should ALWAYS be in light mode
  // regardless of the user preference for the dashboard.
  const isMarketingPage = 
    pathname === "/" || 
    pathname?.startsWith("/login") || 
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/terms") ||
    pathname?.startsWith("/privacy")

  return (
    <NextThemesProvider 
      {...props} 
      // forcedTheme strictly applies the theme to these routes 
      // without updating the saved preference in local storage.
      forcedTheme={isMarketingPage ? "light" : undefined}
    >
      {children}
    </NextThemesProvider>
  )
}
