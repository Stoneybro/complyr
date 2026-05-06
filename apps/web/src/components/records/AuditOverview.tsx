
import { Card, CardContent, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditStats } from "@/hooks/useAuditData";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function AuditOverview({ stats }: { stats: AuditStats | null }) {
    if (!stats) return <div>Loading insights...</div>;

    const formatCurrency = (amount: number) => {
        // Formats the number with standard currency grouping, but returns it as a generic token unit
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(amount);
    };

    return (
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid gap-4 grid-cols-1 md:grid-cols-3 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
            {/* Health Score Card */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription className="text-sm font-bold text-foreground">Audit Coverage</CardDescription>
                    <CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {stats.healthScore}%
                    </CardTitle>
                    <CardAction>
                        {stats.healthScore > 80 ? (
                            <Badge variant="outline" className="border-foreground/20 text-foreground gap-1 text-[10px] uppercase font-mono tracking-widest">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Healthy
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="border-destructive/30 text-destructive gap-1 text-[10px] uppercase font-mono tracking-widest">
                                <AlertCircle className="h-3.5 w-3.5" /> Review Required
                            </Badge>
                        )}
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-3 mt-4">
                    <p className="text-sm font-semibold text-muted-foreground font-mono">
                        {stats.totalCategorized} classified / {stats.totalUncategorized} pending context
                    </p>
                    <Progress
                        value={stats.healthScore}
                        className="h-1 bg-muted [&>[data-slot=progress-indicator]]:bg-foreground"
                    />
                </CardFooter>
            </Card>

            {/* Jurisdiction Breakdown */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription className="text-sm font-bold text-foreground">Jurisdiction Distribution</CardDescription>
                    <CardTitle className="text-xs font-medium text-muted-foreground leading-relaxed">
                        Breakdown of payments by jurisdiction after local decryption.
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="space-y-3 mt-4">
                        {Object.entries(stats.byJurisdiction)
                            .sort(([, a], [, b]) => b.amount - a.amount)
                            .slice(0, 4)
                            .map(([jur, data]) => (
                                <div key={jur} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px] font-mono tracking-tight">
                                            {jur}
                                        </Badge>
                                        <span className="text-muted-foreground">({data.count})</span>
                                    </div>
                                    <span className="font-mono">{formatCurrency(data.amount)}</span>
                                </div>
                            ))}
                        {Object.keys(stats.byJurisdiction).length === 0 && (
                            <p className="text-sm text-muted-foreground">No audit records available.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription className="text-sm font-bold text-foreground">Payment Classification</CardDescription>
                    <CardTitle className="text-xs font-medium text-muted-foreground leading-relaxed">
                        Distribution of payments by declared transaction category.
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="space-y-3 mt-4">
                        {Object.entries(stats.byCategory)
                            .sort(([, a], [, b]) => b.amount - a.amount)
                            .slice(0, 4)
                            .map(([cat, data]) => (
                                <div key={cat} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="px-1.5 py-0 h-5 text-[10px] uppercase font-mono tracking-tight">
                                            {cat}
                                        </Badge>
                                        <span className="text-muted-foreground">({data.count})</span>
                                    </div>
                                    <span className="font-mono">{formatCurrency(data.amount)}</span>
                                </div>
                            ))}
                        {Object.keys(stats.byCategory).length === 0 && (
                            <p className="text-sm text-muted-foreground">No categorized payments recorded.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
