"use client";

import { useState } from "react";
import { AuditDashboard } from "@/components/records/AuditDashboard";

export default function RecordsPage() {
    const [address] = useState<string | undefined>(() => {
        if (typeof window === "undefined") return undefined;
        return localStorage.getItem("wallet-deployed") ?? undefined;
    });

    return (
        <div className="flex flex-col h-full w-full p-6">
            <AuditDashboard walletAddress={address} />
        </div>
    );
}
