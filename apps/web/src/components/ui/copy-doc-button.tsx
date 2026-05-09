"use client";
import React from "react";
import { Button } from "./button";
import { Copy, Check } from "lucide-react";

export function CopyDocButton({ content }: { content: string }) {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {}
  };

  return (
    <div className="mb-4 flex justify-end">
      <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-8 gap-1.5">
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Copied" : "Copy Doc"}
      </Button>
    </div>
  );
}
