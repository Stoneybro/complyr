"use client";

import { useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuditOverview } from "@/components/records/AuditOverview";
import { TaxReportGenerator } from "@/components/records/TaxReportGenerator";
import { AuditTrail } from "@/components/records/AuditTrail";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { Button } from "@/components/ui/button";
import { Loader2, LockIcon, UnlockIcon, RefreshCw, AlertTriangle } from "lucide-react";
import { AuditStats, AuditData } from "@/hooks/useAuditData";

interface AuditDashboardProps {
    walletAddress?: string;
}

export function AuditDashboard({ walletAddress }: AuditDashboardProps) {
    const {
        records,
        isLoading,
        isDecrypting,
        fetchLogs,
        decryptLedger
    } = useAuditLogs(walletAddress);

    useEffect(() => {
        if (walletAddress) {
            fetchLogs();
        }
    }, [walletAddress, fetchLogs]);

    // Transform AuditRecord[] into flat AuditData[] for children
    const parsedData = useMemo(() => {
        const flat: AuditData[] = [];
        const stats: AuditStats = {
            totalCategorized: 0,
            totalUncategorized: 0,
            byJurisdiction: {},
            byCategory: {},
            healthScore: 0
        };

        records.forEach(record => {
            record.recipients.forEach((recipient, i) => {
                const amountTokens = parseFloat(record.amounts[i]);
                const cat = record.decrypted && record.categories ? record.categories[i] : "Encrypted";
                const jur = record.decrypted && record.jurisdictions ? record.jurisdictions[i] : "Encrypted";
                const ref = record.decrypted && record.referenceIds ? record.referenceIds[i] : "Encrypted Record";
                
                // For TaxReport generator compatibility, multiply by 1e18 since it divides by 1e18
                const amountWei = (amountTokens * 1e18).toString();

                flat.push({
                    date: record.timestamp,
                    txHash: record.txHash,
                    amount: amountWei,
                    formattedAmount: amountTokens,
                    currency: "USDC",
                    entityId: "ComplyrLedger",
                    jurisdiction: jur,
                    category: cat,
                    periodId: "N/A",
                    reference: ref,
                    details: {},
                    recipientAddress: recipient
                });

                if (record.decrypted) {
                    if (jur !== "Not Specified" && jur !== "Unknown") {
                        if (!stats.byJurisdiction[jur]) stats.byJurisdiction[jur] = { count: 0, amount: 0 };
                        stats.byJurisdiction[jur].count++;
                        stats.byJurisdiction[jur].amount += amountTokens;
                    }
                    if (cat !== "Not Specified" && cat !== "Unknown") {
                        if (!stats.byCategory[cat]) stats.byCategory[cat] = { count: 0, amount: 0 };
                        stats.byCategory[cat].count++;
                        stats.byCategory[cat].amount += amountTokens;
                    }
                    if (jur !== "Not Specified" || cat !== "Not Specified") {
                        stats.totalCategorized++;
                    } else {
                        stats.totalUncategorized++;
                    }
                } else {
                    stats.totalUncategorized++;
                }
            });
        });

        const isAnyRecord = records.length > 0;
        const totalTx = stats.totalCategorized + stats.totalUncategorized;
        stats.healthScore = totalTx > 0 ? Math.round((stats.totalCategorized / totalTx) * 100) : (isAnyRecord ? 0 : 100);

        return { flat, stats };
    }, [records]);

    const recordCount = records.length;
    const allDecrypted = recordCount > 0 && records.every(r => r.decrypted);

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold tracking-tight">
                        Records
                    </h2>
                    <p className="text-muted-foreground">
                        Internal view of every payment your account has made, with all encrypted audit records. Decrypt to see the details.
                    </p>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={fetchLogs} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button 
                        variant={allDecrypted ? "outline" : "default"} 
                        onClick={decryptLedger} 
                        disabled={isDecrypting || recordCount === 0 || allDecrypted}
                        className={allDecrypted ? "border-muted-foreground/30" : ""}
                    >
                        {isDecrypting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : allDecrypted ? (
                            <UnlockIcon className="h-4 w-4 mr-2" />
                        ) : (
                            <LockIcon className="h-4 w-4 mr-2" />
                        )}
                        {allDecrypted ? "Records Decrypted" : "Decrypt Records"}
                    </Button>
                </div>
            </div>

            <div className="flex items-start gap-3 px-4 py-3 bg-muted/30 border text-muted-foreground rounded-lg text-xs leading-relaxed">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                    Payment context is cryptographically secured and linked to executed transfers. Private fields remain encrypted by default and can only be decrypted by authorized addresses.
                </p>
            </div>

            {isLoading && records.length === 0 ? (
                <div className="py-12 flex flex-col justify-center items-center text-muted-foreground gap-4">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Securing connection to the encrypted ledger...</p>
                </div>
            ) : (
                <Tabs defaultValue="overview" className="space-y-4 h-full flex flex-col">
                    <TabsList>
                        <TabsTrigger value="overview">Summary</TabsTrigger>
                        <TabsTrigger value="reports">Private Reports</TabsTrigger>
                        <TabsTrigger value="audit">Payments Trail</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-auto">
                        <TabsContent value="overview" className="space-y-4 m-0">
                            <AuditOverview stats={parsedData.stats} />
                        </TabsContent>

                        <TabsContent value="reports" className="space-y-4 m-0 h-full">
                            <TaxReportGenerator data={parsedData.flat} />
                        </TabsContent>

                        <TabsContent value="audit" className="space-y-4 m-0 h-full">
                            <AuditTrail walletAddress={walletAddress} recordsOverride={records} onDecrypt={decryptLedger} isDecrypting={isDecrypting} isLoading={isLoading} />
                        </TabsContent>
                    </div>
                </Tabs>
            )}
        </div>
    );
}
