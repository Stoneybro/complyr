
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComplianceData } from "@/hooks/useComplianceData";
import { Download, FileText, DollarSign, CheckCircle2, AlertTriangle } from "lucide-react";
import { getJurisdictionOptions, getCategoryOptions } from "@/lib/compliance-enums";
import { useAproOracle } from "@/hooks/useAproOracle";
import { useKycBatch } from "@/hooks/useKycBatch";
import { Badge } from "@/components/ui/badge";

interface TaxReportGeneratorProps {
    data: ComplianceData[];
}

export function TaxReportGenerator({ data }: TaxReportGeneratorProps) {
    const { data: price } = useAproOracle();
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

    // Extract unique recipient addresses for KYC batch lookup
    const recipientAddresses = useMemo(() =>
        Array.from(new Set(filteredData.map(item => item.recipientAddress))),
        [filteredData]
    );
    const { results: kycResults, isLoading: kycLoading } = useKycBatch(recipientAddresses);

    const totalAmount = filteredData.reduce((sum, item) => sum + item.formattedAmount, 0);

    const handleExport = () => {
        const headers = ["Date", "Recipient", "KYC Status", "KYC Level", "Amount (USDC)", "USD Value (APRO)", "Jurisdiction", "Category", "Transaction Hash", "Reference"];
        const rows = filteredData.map(item => {
            const kyc = kycResults.get(item.recipientAddress.toLowerCase());
            return [
                item.date.toISOString().split('T')[0],
                item.recipientAddress,
                kyc?.isVerified ? "Verified" : "Unverified",
                kyc?.level?.toString() ?? "0",
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
        a.download = `tax_report_${jurisdiction}_${category}.csv`;
        a.click();
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Compliance Report Generator
                </CardTitle>
                <div className="text-sm text-muted-foreground mt-1 font-medium">
                    Generate structured compliance reports with real-time <Badge variant="outline" className="text-[10px] h-4 px-1 text-primary border-primary/30 ml-1">APRO Oracle</Badge> USD valuations.
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
                        <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Regulatory Jurisdiction</label>
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
                        <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Compliance Manifest Preview</h3>
                        {price && <Badge variant="secondary" className="text-[10px] bg-primary/5 text-primary border-primary/10">1 USDC ≈ ${price.toFixed(4)}</Badge>}
                    </div>

                    <div className="max-h-[300px] overflow-y-auto hidden md:block mt-4">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] uppercase bg-muted/50 sticky top-0 text-muted-foreground">
                                <tr>
                                    <th className="px-3 py-2">Date</th>
                                    <th className="px-3 py-2">Recipient</th>
                                    <th className="px-3 py-2">KYC</th>
                                    <th className="px-3 py-2 text-right">USDC</th>
                                    <th className="px-3 py-2 text-right">USD (APRO)</th>
                                    <th className="px-3 py-2">Jur.</th>
                                    <th className="px-3 py-2">Cat.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredData.slice(0, 50).map((row, i) => {
                                    const kyc = kycResults.get(row.recipientAddress.toLowerCase());
                                    const kycLabel = ["None", "Basic", "Adv.", "Prem.", "Ult."][kyc?.level ?? 0];
                                    return (
                                        <tr key={i} className="hover:bg-muted/20 text-xs">
                                            <td className="px-3 py-2 font-mono">{row.date.toISOString().split('T')[0]}</td>
                                            <td className="px-3 py-2 font-mono truncate max-w-[100px]">{row.recipientAddress.slice(0, 6)}...{row.recipientAddress.slice(-4)}</td>
                                            <td className="px-3 py-2">
                                                {kycLoading ? (
                                                    <span className="text-muted-foreground">...</span>
                                                ) : kyc?.isVerified ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                        <CheckCircle2 className="h-3 w-3" /> {kycLabel}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                                        <AlertTriangle className="h-3 w-3" /> —
                                                    </span>
                                                )}
                                            </td>
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
