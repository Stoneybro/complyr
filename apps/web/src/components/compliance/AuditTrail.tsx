
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ComplianceData } from "@/hooks/useComplianceData";
import { Search, ShieldCheck, ExternalLink } from "lucide-react";

interface AuditTrailProps {
    data: ComplianceData[];
}

export function AuditTrail({ data }: AuditTrailProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState<ComplianceData[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        const term = searchTerm.toLowerCase();
        const found = data.filter(item =>
            (item.entityId && item.entityId.toLowerCase().includes(term)) ||
            (item.recipientAddress && item.recipientAddress.toLowerCase().includes(term))
        );

        setResults(found);
        setHasSearched(true);
    };

    const totalPaid = results.reduce((sum, item) => sum + (Number(item.amount) / 1e18), 0);

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Audit Trail Search
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        placeholder="Search by Entity ID (e.g. EMP-001) or Address"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button type="submit">
                        <Search className="h-4 w-4 mr-2" />
                        Search
                    </Button>
                </form>

                {hasSearched && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        {results.length > 0 ? (
                            <>
                                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Payments Found</div>
                                        <div className="text-2xl font-bold">{results.length}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Value</div>
                                        <div className="text-2xl font-bold">{totalPaid.toLocaleString()} MNT</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Status</div>
                                        <div className="flex items-center gap-1 text-green-600 font-medium">
                                            <ShieldCheck className="h-4 w-4" /> Verified On-Chain
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {results.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-card border rounded-lg hover:bg-accent/50 transition-colors">
                                            <div className="grid gap-1">
                                                <div className="font-medium text-sm flex items-center gap-2">
                                                    {item.date.toLocaleDateString()}
                                                    <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                                                        {item.reference}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-muted-foreground font-mono">
                                                    ID: {item.entityId || "N/A"} | Jur: {item.jurisdiction}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-sm">
                                                    {(Number(item.amount) / 1e18).toLocaleString()} MNT
                                                </div>
                                                <a
                                                    href={`https://explorer.testnet.mantle.xyz/tx/${item.txHash}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-[10px] text-primary hover:underline flex items-center justify-end gap-1"
                                                >
                                                    View TX <ExternalLink className="h-2 w-2" />
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No records found matching "{searchTerm}"
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
