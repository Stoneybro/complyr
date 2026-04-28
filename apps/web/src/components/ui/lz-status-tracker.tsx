"use client";

import { CheckCircle2, CircleDashed, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type BridgeStatus = "idle" | "tx_pending" | "confirmed" | "error";

interface LZStatusTrackerProps {
  status: BridgeStatus;
  title?: string;
  className?: string;
}

export function LZStatusTracker({ status, title = "Compliance Wallet Deployment", className }: LZStatusTrackerProps) {
  if (status === "idle") return null;

  const steps = [
    {
      id: "base",
      label: "Deploying on Sepolia ETH",
      activeStates: ["tx_pending"],
      completedStates: ["confirmed"],
      icon: CircleDashed,
    },
    {
      id: "compliance",
      label: "Compliance Registry Initialization",
      activeStates: [],
      completedStates: ["confirmed"],
      icon: ShieldCheck,
    },
  ];

  return (
    <div className={cn("p-6 rounded-xl border bg-card text-card-foreground shadow-sm animate-in fade-in zoom-in duration-300", className)}>
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-indigo-500" />
        {title}
      </h3>
      
      <div className="space-y-6 relative">
        {/* Connecting Line */}
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-muted-foreground/20 z-0"></div>

        {steps.map((step, index) => {
          const isActive = step.activeStates.includes(status);
          const isCompleted = step.completedStates.includes(status);
          const isError = status === "error" && isActive;

          return (
            <div key={step.id} className="relative z-10 flex items-start gap-4">
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-500",
                  isCompleted ? "bg-green-500/20 border-green-500 text-green-500" :
                  isActive ? "bg-indigo-500/20 border-indigo-500 text-indigo-500 animate-pulse" :
                  isError ? "bg-red-500/20 border-red-500 text-red-500" :
                  "bg-background border-muted-foreground/30 text-muted-foreground/50"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : isActive ? (
                  <step.icon className="w-4 h-4 animate-spin-slow" />
                ) : (
                  <step.icon className="w-4 h-4" />
                )}
              </div>
              
              <div className="flex flex-col pt-1">
                <span className={cn(
                  "text-sm font-medium transition-colors",
                  isCompleted ? "text-foreground" :
                  isActive ? "text-indigo-500" :
                  "text-muted-foreground"
                )}>
                  {step.label}
                </span>
                {isActive && (
                  <span className="text-xs text-muted-foreground mt-1">
                    {index === 0 && "Waiting for transaction confirmation..."}
                    {index === 1 && "Finalizing verification..."}
                  </span>
                )}
                {isCompleted && (
                  <span className="text-xs text-green-600/80 mt-1 flex items-center gap-1">
                    <span>Confirmed</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
