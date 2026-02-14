import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tropichat.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "TropiChat - Run Your Business Like a Pro, Right From WhatsApp",
  description: "Turn WhatsApp chaos into organized success. Label customers, save responses, track orders. Never lose a conversation. Built for Caribbean small businesses. Try free for 14 days.",
  keywords: ["WhatsApp Business", "Caribbean", "Small Business", "Customer Management", "CRM", "Business Tools", "WhatsApp CRM", "Bahamas", "Jamaica", "Trinidad", "Barbados", "Caribbean business tools"],
  authors: [{ name: "TropiTech Solutions" }],
  icons: {
    icon: [
      { url: "/tropichat-logo-transparent.png", type: "image/png", sizes: "32x32" },
      { url: "/tropichat-logo-transparent.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/tropichat-logo-transparent.png",
  },
  openGraph: {
    title: "TropiChat - Run Your Business Like a Pro, Right From WhatsApp",
    description: "Turn WhatsApp chaos into organized success. Label customers, save responses, track orders. Built for Caribbean small businesses.",
    url: "https://tropichat.com",
    siteName: "TropiChat",
    locale: "en_US",
    type: "website",
    images: ["/tropichat-logo-transparent.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "TropiChat - WhatsApp Business Tools for Caribbean SMBs",
    description: "Turn WhatsApp chaos into organized success. Label customers, track orders, save responses. Try free for 14 days.",
    images: ["/tropichat-logo-transparent.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${plusJakarta.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
