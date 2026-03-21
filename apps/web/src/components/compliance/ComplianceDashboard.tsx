
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComplianceOverview } from "@/components/compliance/ComplianceOverview";
import { TaxReportGenerator } from "@/components/compliance/TaxReportGenerator";
import { AuditTrail } from "@/components/compliance/AuditTrail";
import { useComplianceData } from "@/hooks/useComplianceData";

interface ComplianceDashboardProps {
    walletAddress?: string;
}

export function ComplianceDashboard({ walletAddress }: ComplianceDashboardProps) {
    const { data, isLoading } = useComplianceData(walletAddress);

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold tracking-tight">Compliance Dashboard</h2>
                <p className="text-muted-foreground">
                    Monitor compliance health, generate tax reports, and audit payment history.
                </p>
            </div>

            {isLoading ? (
                <div className="py-12 text-center text-muted-foreground">Loading compliance data...</div>
            ) : (
                <Tabs defaultValue="overview" className="space-y-4 h-full flex flex-col">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="reports">Tax Reports</TabsTrigger>
                        <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-auto">
                        <TabsContent value="overview" className="space-y-4 m-0">
                            <ComplianceOverview stats={data?.stats || null} />
                        </TabsContent>

                        <TabsContent value="reports" className="space-y-4 m-0 h-full">
                            <TaxReportGenerator data={data?.transactions || []} />
                        </TabsContent>

                        <TabsContent value="audit" className="space-y-4 m-0 h-full">
                            <AuditTrail data={data?.transactions || []} />
                        </TabsContent>
                    </div>
                </Tabs>
            )}
        </div>
    );
}
