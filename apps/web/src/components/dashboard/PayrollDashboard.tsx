"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Download, Users, Globe, DollarSign, Calendar } from "lucide-react";
import { useWalletHistory, TransactionItemProps } from "@/hooks/useWalletHistory";
import { ActivityType } from "@/lib/envio/client";
import { formatDistanceToNow } from "date-fns";

interface PayrollDashboardProps {
    walletAddress?: `0x${string}`;
}

// Jurisdiction display config
const JURISDICTION_CONFIG: Record<string, { label: string; flag: string; color: string }> = {
    "US-CA": { label: "California, US", flag: "🇺🇸", color: "bg-blue-100 text-blue-800" },
    "US-NY": { label: "New York, US", flag: "🇺🇸", color: "bg-blue-100 text-blue-800" },
    "US-TX": { label: "Texas, US", flag: "🇺🇸", color: "bg-blue-100 text-blue-800" },
    "UK": { label: "United Kingdom", flag: "🇬🇧", color: "bg-purple-100 text-purple-800" },
    "EU-DE": { label: "Germany", flag: "🇩🇪", color: "bg-yellow-100 text-yellow-800" },
    "EU-FR": { label: "France", flag: "🇫🇷", color: "bg-indigo-100 text-indigo-800" },
    "NG": { label: "Nigeria", flag: "🇳🇬", color: "bg-green-100 text-green-800" },
};

// Category display config
const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
    "W2": { label: "Employee (W2)", color: "bg-blue-100 text-blue-800" },
    "CONTRACTOR": { label: "Contractor", color: "bg-orange-100 text-orange-800" },
    "BONUS": { label: "Bonus", color: "bg-purple-100 text-purple-800" },
};

interface PayrollIntent {
    id: string;
    name: string;
    recipients: string[];
    amounts: string[];
    totalAmount: number;
    jurisdiction?: string;
    taxCategory?: string;
    periodId?: string;
    employeeId?: string;
    timestamp: string;
    status: "active" | "completed" | "cancelled";
}

export function PayrollDashboard({ walletAddress }: PayrollDashboardProps) {
    const { transactions, isLoading } = useWalletHistory(walletAddress);
    const [periodFilter, setPeriodFilter] = useState<string>("all");

    // Extract payroll intents from transaction history
    const payrollIntents = useMemo<PayrollIntent[]>(() => {
        if (!transactions) return [];

        return transactions
            .filter((tx: TransactionItemProps) =>
                tx.type === ActivityType.INTENT_CREATED ||
                tx.type === ActivityType.INTENT_EXECUTION
            )
            .map((tx: TransactionItemProps) => {
                const details = tx.details || {};
                return {
                    id: tx.id,
                    name: details.scheduleName || "Untitled",
                    recipients: details.recipients || [],
                    amounts: details.amounts || [],
                    totalAmount: parseFloat(details.totalAmount || "0"),
                    jurisdiction: details.payroll?.jurisdiction || details.jurisdiction || "",
                    taxCategory: details.payroll?.taxCategory || details.taxCategory || "",
                    periodId: details.payroll?.periodId || details.periodId || "",
                    employeeId: details.payroll?.employeeId || details.employeeId || "",
                    timestamp: tx.timestamp,
                    status: tx.type === ActivityType.INTENT_CREATED ? "active" : "completed",
                };
            });
    }, [transactions]);

    // Summary by jurisdiction
    const byJurisdiction = useMemo(() => {
        const summary: Record<string, { count: number; total: number }> = {};
        payrollIntents.forEach((intent) => {
            const key = intent.jurisdiction || "Unknown";
            if (!summary[key]) summary[key] = { count: 0, total: 0 };
            summary[key].count++;
            summary[key].total += intent.totalAmount;
        });
        return summary;
    }, [payrollIntents]);

    // Summary by category
    const byCategory = useMemo(() => {
        const summary: Record<string, { count: number; total: number }> = {};
        payrollIntents.forEach((intent) => {
            const key = intent.taxCategory || "Uncategorized";
            if (!summary[key]) summary[key] = { count: 0, total: 0 };
            summary[key].count++;
            summary[key].total += intent.totalAmount;
        });
        return summary;
    }, [payrollIntents]);

    // Total payroll stats
    const totalStats = useMemo(() => {
        return {
            totalPayments: payrollIntents.length,
            totalAmount: payrollIntents.reduce((sum, i) => sum + i.totalAmount, 0),
            uniqueRecipients: new Set(payrollIntents.flatMap((i) => i.recipients)).size,
        };
    }, [payrollIntents]);

    // Export to CSV
    const handleExport = () => {
        const headers = ["Date", "Name", "Amount", "Tax Category", "Jurisdiction", "Period", "Status"];
        const rows = payrollIntents.map((intent) => [
            new Date(intent.timestamp).toISOString().split("T")[0],
            intent.name,
            intent.totalAmount.toFixed(2),
            intent.taxCategory || "",
            intent.jurisdiction || "",
            intent.periodId || "",
            intent.status,
        ]);

        const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `payroll-report-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-muted-foreground">Loading payroll data...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 py-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Payroll Dashboard</h2>
                    <p className="text-muted-foreground">
                        Track payments by jurisdiction and tax category
                    </p>
                </div>
                <Button onClick={handleExport} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalStats.totalAmount.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            {totalStats.totalPayments} payment{totalStats.totalPayments !== 1 ? "s" : ""}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Recipients</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalStats.uniqueRecipients}</div>
                        <p className="text-xs text-muted-foreground">Unique addresses</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Jurisdictions</CardTitle>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Object.keys(byJurisdiction).length}</div>
                        <p className="text-xs text-muted-foreground">Countries/regions tracked</p>
                    </CardContent>
                </Card>
            </div>

            {/* Jurisdiction Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">By Jurisdiction</CardTitle>
                        <CardDescription>Payment totals by region</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {Object.keys(byJurisdiction).length === 0 ? (
                            <p className="text-muted-foreground text-sm">No jurisdiction data yet</p>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(byJurisdiction).map(([key, data]) => {
                                    const config = JURISDICTION_CONFIG[key] || { label: key, flag: "🌍", color: "bg-gray-100 text-gray-800" };
                                    return (
                                        <div key={key} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{config.flag}</span>
                                                <span className="font-medium">{config.label}</span>
                                                <Badge variant="secondary" className="text-xs">
                                                    {data.count}
                                                </Badge>
                                            </div>
                                            <span className="font-semibold">${data.total.toFixed(2)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">By Category</CardTitle>
                        <CardDescription>Payment totals by tax category</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {Object.keys(byCategory).length === 0 ? (
                            <p className="text-muted-foreground text-sm">No category data yet</p>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(byCategory).map(([key, data]) => {
                                    const config = CATEGORY_CONFIG[key] || { label: key, color: "bg-gray-100 text-gray-800" };
                                    return (
                                        <div key={key} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge className={config.color}>{config.label}</Badge>
                                                <Badge variant="secondary" className="text-xs">
                                                    {data.count}
                                                </Badge>
                                            </div>
                                            <span className="font-semibold">${data.total.toFixed(2)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Payroll Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Recent Payroll Transactions</CardTitle>
                    <CardDescription>
                        {payrollIntents.length === 0
                            ? "Create payroll payments to see them here"
                            : `Showing ${payrollIntents.length} transaction${payrollIntents.length !== 1 ? "s" : ""}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {payrollIntents.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No payroll transactions found</p>
                            <p className="text-sm">Use Chat or Form to create payments with payroll metadata</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Jurisdiction</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payrollIntents.slice(0, 10).map((intent) => (
                                    <TableRow key={intent.id}>
                                        <TableCell className="font-medium">{intent.name}</TableCell>
                                        <TableCell>${intent.totalAmount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            {intent.taxCategory ? (
                                                <Badge className={CATEGORY_CONFIG[intent.taxCategory]?.color || "bg-gray-100"}>
                                                    {intent.taxCategory}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {intent.jurisdiction ? (
                                                <span>
                                                    {JURISDICTION_CONFIG[intent.jurisdiction]?.flag || "🌍"}{" "}
                                                    {intent.jurisdiction}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDistanceToNow(new Date(intent.timestamp), { addSuffix: true })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
