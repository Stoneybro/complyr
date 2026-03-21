
import type { Metadata } from "next";
import { Outfit, Geist_Mono, Geist } from "next/font/google";
import { Provider } from "./provider";
import "./globals.css";
import { cn } from "@/lib/utils";

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
  title: "Complyr",
  description: "Compliance-ready payment Infrastructure",
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
      </body>
    </html>
  );
}
