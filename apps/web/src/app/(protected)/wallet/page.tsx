"use client";
import { AppSidebar } from "@/components/wallet/app-sidebar";
import { Dashboard } from "@/components/dashboard/dashboard";
import { AuditDashboard } from "@/components/records/AuditDashboard";
import { AuditorsManager } from "@/components/records/AuditorsManager";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { PaymentForm } from "@/components/payment-form/PaymentForm";
import { useState } from "react";

import Image from "next/image";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function Page() {
  const [walletAddress] = useState<`0x${string}` | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const saved = localStorage.getItem("wallet-deployed");
    return saved ? (saved as `0x${string}`) : undefined;
  });

  return (
    <SidebarProvider
      defaultOpen={true}
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <AppSidebar walletAddress={walletAddress} />
      <SidebarInset>
        <header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4 z-20">
          <SidebarTrigger className="-ml-1" />
          <div className="flex justify-center items-center w-full gap-1 mr-4">
            <Image src="/complyrlogo.svg" alt="Complyr" width={120} height={32} className="h-6 w-auto" />
            <div className="text-2xl font-bold">Complyr</div>
          </div>
        </header>
        <div className="flex  flex-1 flex-col gap-4 p-4">
          <div className="h-full w-full">
            <Tabs defaultValue="form" className="h-full w-full">
              <TabsList className="flex justify-center mx-auto">
                <TabsTrigger value="form">Payments</TabsTrigger>
                <TabsTrigger value="dashboard">Balance</TabsTrigger>
                <TabsTrigger value="audit">Records</TabsTrigger>
                <TabsTrigger value="review-access">Auditors</TabsTrigger>
              </TabsList>
              <TabsContent value="chat">

              </TabsContent>
              <TabsContent value="form">
                <PaymentForm walletAddress={walletAddress} />
              </TabsContent>
              <TabsContent value="dashboard">
                <Dashboard walletAddress={walletAddress!} />
              </TabsContent>
              <TabsContent value="audit">
                <AuditDashboard walletAddress={walletAddress!} />
              </TabsContent>
              <TabsContent value="review-access">
                <div className="flex justify-center py-4">
                  <AuditorsManager proxyAccount={walletAddress} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
