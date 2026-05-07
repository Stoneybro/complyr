
import type { Metadata } from "next";
import { Provider } from "./provider";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script";

export const metadata: Metadata = {
  title: "Complyr | Confidential Onchain Finance",
  description: "Confidential audit infrastructure for onchain business finance built on Ethereum Sepolia.",
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
    <html lang="en" className={cn("font-sans")} suppressHydrationWarning>
      <body
        className="antialiased font-sans"
        suppressHydrationWarning
      >
        <Script 
          src="/relayer-sdk-js.umd.cjs" 
          strategy="beforeInteractive" 
        />
        <Provider>{children}</Provider>
        <Analytics />
      </body>
    </html>
  );
}
