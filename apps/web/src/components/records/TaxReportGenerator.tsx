
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuditData } from "@/hooks/useAuditData";
import { Download, FileText } from "lucide-react";
import { getJurisdictionOptions, getCategoryOptions } from "@/lib/audit-enums";

interface TaxReportGeneratorProps {
    data: AuditData[];
}

export function TaxReportGenerator({ data }: TaxReportGeneratorProps) {
    const price = 1;
    const [jurisdiction, setJurisdiction] = useState<string>("all");
    const [category, setCategory] = useState<string>("all");
    const [timePeriod, setTimePeriod] = useState<string>("all");

    // Dynamic Period Generation
    const periods = useMemo(() => {
        const uniqueYears = new Set<number>();
        const uniqueQuarters = new Set<string>();

        data.forEach(item => {
            const date = new Date(item.date);
            const year = date.getFullYear();
            const month = date.getMonth();
            const quarter = Math.floor(month / 3) + 1;

            uniqueYears.add(year);
            uniqueQuarters.add(`${year}-Q${quarter}`);
        });

        const sortedYears = Array.from(uniqueYears).sort((a, b) => b - a);
        const sortedQuarters = Array.from(uniqueQuarters).sort().reverse();

        return { years: sortedYears, quarters: sortedQuarters };
    }, [data]);

    // Filter Logic
    const filteredData = data.filter(item => {
        if (jurisdiction !== "all") {
            const selectedJur = getJurisdictionOptions().find(o => o.value === jurisdiction)?.label;
            if (item.jurisdiction !== selectedJur) return false;
        }

        if (category !== "all") {
            const selectedCat = getCategoryOptions().find(o => o.value === category)?.label;
            if (item.category !== selectedCat) return false;
        }

        if (timePeriod !== "all") {
            const date = new Date(item.date);
            const year = date.getFullYear();
            const month = date.getMonth();
            const quarter = Math.floor(month / 3) + 1;
            const quarterKey = `${year}-Q${quarter}`;

            if (timePeriod.startsWith("YEAR-")) {
                const targetYear = parseInt(timePeriod.split("-")[1]);
                if (year !== targetYear) return false;
            } else {
                if (quarterKey !== timePeriod) return false;
            }
        }

        return true;
    });

    const handleExport = () => {
        const headers = ["Date", "Recipient", "Amount (USDC)", "USD Value (APRO)", "Jurisdiction", "Category", "Transaction Hash", "Reference"];
        const rows = filteredData.map(item => {
            return [
                item.date.toISOString().split('T')[0],
                item.recipientAddress,
                item.formattedAmount.toString(),
                price ? (item.formattedAmount * price).toFixed(2) : "N/A",
                item.jurisdiction,
                item.category,
                item.txHash,
                item.reference
            ];
        });

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `private_audit_report_${jurisdiction}_${category}.csv`;
        a.click();
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Private Report Generator
                </CardTitle>
                <div className="text-sm text-muted-foreground mt-1 font-medium">
                    Generate decrypted internal reports from encrypted audit context.
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Reporting Period</label>
                        <Select value={timePeriod} onValueChange={setTimePeriod}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                {periods.years.map(year => (
                                    <SelectItem key={`year-${year}`} value={`YEAR-${year}`}>
                                        {year} Full Year
                                    </SelectItem>
                                ))}
                                {periods.quarters.map(q => (
                                    <SelectItem key={q} value={q}>
                                        {q.replace('-', ' ')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Jurisdiction</label>
                        <Select value={jurisdiction} onValueChange={setJurisdiction}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select jurisdiction" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Jurisdictions</SelectItem>
                                {getJurisdictionOptions().map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Payment Category</label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {getCategoryOptions().map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-4 border border-muted-foreground/10">
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Private Report Preview</h3>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto hidden md:block mt-4">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] uppercase bg-muted/50 sticky top-0 text-muted-foreground">
                                <tr>
                                    <th className="px-3 py-2">Date</th>
                                    <th className="px-3 py-2">Recipient</th>
                                    <th className="px-3 py-2 text-right">USDC</th>
                                    <th className="px-3 py-2 text-right">USD (APRO)</th>
                                    <th className="px-3 py-2">Jur.</th>
                                    <th className="px-3 py-2">Cat.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredData.slice(0, 50).map((row, i) => {
                                    return (
                                        <tr key={i} className="hover:bg-muted/20 text-xs">
                                            <td className="px-3 py-2 font-mono">{row.date.toISOString().split('T')[0]}</td>
                                            <td className="px-3 py-2 font-mono truncate max-w-[100px]">{row.recipientAddress.slice(0, 6)}...{row.recipientAddress.slice(-4)}</td>
                                            <td className="px-3 py-2 text-right font-mono font-medium">{row.formattedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="px-3 py-2 text-right font-mono text-primary">
                                                {price ? `$${(row.formattedAmount * price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "---"}
                                            </td>
                                            <td className="px-3 py-2 truncate max-w-[80px]">{row.jurisdiction}</td>
                                            <td className="px-3 py-2 truncate max-w-[80px]">{row.category}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Button className="w-full" onClick={handleExport} disabled={filteredData.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV Report
                </Button>
            </CardContent>
        </Card>
    );
}
