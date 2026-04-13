
import type { Metadata } from "next";
import { Outfit, Geist_Mono, Geist } from "next/font/google";
import { Provider } from "./provider";
import "./globals.css";
import { cn } from "@/lib/utils";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next"

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Complyr | Confidential Onchain Finance",
  description: "Confidential audit infrastructure for onchain business finance built on HashKey Chain.",
  icons: {
    icon: "/complyrlogo.ico",
    shortcut: "/complyrlogo.ico",
    apple: "/complyrlogo.ico",
  },
  openGraph: {
    title: "Complyr",
    description: "Confidential audit infrastructure for onchain business finance.",
    url: "https://usecomplyr.vercel.app",
    siteName: "Complyr",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Complyr",
    description: "Confidential audit infrastructure for onchain business finance.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${geistMono.variable} antialiased font-sans`}
        suppressHydrationWarning
      >
        <Provider>{children}</Provider>
        <Analytics />
      </body>
    </html>
  );
}
