import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "TropiChat - Run Your Business Like a Pro, Right From WhatsApp",
  description: "Turn WhatsApp chaos into organized success. Label customers, save responses, track orders. Never lose a conversation. Built for Caribbean small businesses. Try free for 14 days.",
  keywords: ["WhatsApp Business", "Caribbean", "Small Business", "Customer Management", "CRM", "Business Tools", "WhatsApp CRM", "Bahamas", "Jamaica", "Trinidad", "Barbados", "Caribbean business tools"],
  authors: [{ name: "TropiTech Solutions" }],
  openGraph: {
    title: "TropiChat - Run Your Business Like a Pro, Right From WhatsApp",
    description: "Turn WhatsApp chaos into organized success. Label customers, save responses, track orders. Built for Caribbean small businesses.",
    url: "https://tropichat.com",
    siteName: "TropiChat",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TropiChat - WhatsApp Business Tools for Caribbean SMBs",
    description: "Turn WhatsApp chaos into organized success. Label customers, track orders, save responses. Try free for 14 days.",
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
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
