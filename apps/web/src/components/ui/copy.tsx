"use client";
import { Check, Copy } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

interface CopyTextProps {
  text: string;
  className?: string;
}

export default function CopyText({ text, className }: CopyTextProps) {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button onClick={() => copyToClipboard(text)}>
     {!copied ? <Copy className={cn('w-3 h-3 cursor-pointer hover:text-foreground', className)} /> : <Check className={cn('w-3 h-3 cursor-pointer text-green-500', className)} />}
    </button>
  );
}
