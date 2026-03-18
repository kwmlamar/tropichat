import type { Metadata, Viewport } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Script from "next/script";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

import { Plus_Jakarta_Sans } from "next/font/google";

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
      { url: "/tropichat-logo.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/tropichat-logo.png",
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
    <html lang="en" className="scroll-smooth">
      <body className={`${poppins.variable} ${inter.variable} ${plusJakartaSans.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            className: "tropichat-toast",
            style: {
              borderRadius: "20px",
              padding: "16px 20px",
              fontSize: "0.9375rem",
              fontWeight: "500",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(12px)",
              background: "rgba(255, 255, 255, 0.8)",
              color: "#213138",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.04)",
            },
          }}
        />
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
