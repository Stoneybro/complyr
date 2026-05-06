import { AuditorsPortalClient } from "./AuditorsPortalClient";
import Image from "next/image";

export default async function AuditorPage({
    params,
}: {
    params: Promise<{ proxyAccount: string }>;
}) {
    const resolvedParams = await params;

    return (
        <div className="min-h-screen bg-muted/40">
            {/* Minimal Header */}
            <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10 w-full">
                <div className="px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Image src="/complyrlogo.svg" alt="Complyr" width={100} height={24} className="h-5 w-auto" />
                        <span className="font-mono font-normal text-muted-foreground text-[10px] uppercase tracking-widest hidden sm:inline-block border-l pl-4 border-muted-foreground/20">
                            External Auditor Portal
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Workspace */}
            <main className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <AuditorsPortalClient proxyAccount={resolvedParams.proxyAccount} />
            </main>
        </div>
    );
}
