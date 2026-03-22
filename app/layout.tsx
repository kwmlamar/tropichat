import * as React from "react";
import type { Metadata, Viewport } from "next";
import { Lexend, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/toaster-wrapper";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-lexend",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tropichat.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "TropiChat - Run Your Business Like a Pro, Right From WhatsApp",
  description: "Turn WhatsApp chaos into organized success. Label customers, save responses, track orders. Never lose a conversation. Built for Caribbean small businesses. Try free for 14 days.",
  keywords: ["WhatsApp Business", "Caribbean", "Small Business", "Customer Management", "CRM", "Business Tools", "WhatsApp CRM", "Bahamas", "Jamaica", "Trinidad", "Barbados", "Caribbean business tools"],
  authors: [{ name: "TropiTech Solutions" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/tropichat-logo.png", type: "image/png", sizes: "32x32" },
      { url: "/tropichat-icon-dark-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TropiChat",
  },
  openGraph: {
    title: "TropiChat - Run Your Business Like a Pro, Right From WhatsApp",
    description: "Turn WhatsApp chaos into organized success. Label customers, save responses, track orders. Built for Caribbean small businesses.",
    url: "https://tropichat.com",
    siteName: "TropiChat",
    locale: "en_US",
    type: "website",
    images: ["/tropichat-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "TropiChat - WhatsApp Business Tools for Caribbean SMBs",
    description: "Turn WhatsApp chaos into organized success. Label customers, track orders, save responses. Try free for 14 days.",
    images: ["/tropichat-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#E1F0F1", // Matches the top of the mobile inbox gradient
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${lexend.variable} ${plusJakartaSans.variable} font-sans antialiased text-brand-dark`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
        {/* Service Worker Registration */}
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.error('SW registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
