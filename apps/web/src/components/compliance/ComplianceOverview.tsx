
import { Card, CardContent, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ComplianceStats } from "@/hooks/useComplianceData";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function ComplianceOverview({ stats }: { stats: ComplianceStats | null }) {
    if (!stats) return <div>Loading insights...</div>;

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount).replace('$', '') + ' MNT';

    return (
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid gap-4 grid-cols-1 md:grid-cols-3 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
            {/* Health Score Card */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Compliance Health</CardDescription>
                    <CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {stats.healthScore}%
                    </CardTitle>
                    <CardAction>
                        {stats.healthScore > 80 ? (
                            <Badge variant="outline" className="border-green-500 text-green-500 gap-1 text-xs">
                                <CheckCircle2 className="h-4 w-4" /> Healthy
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="border-amber-500 text-amber-500 gap-1 text-xs">
                                <AlertCircle className="h-4 w-4" /> Action Needed
                            </Badge>
                        )}
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-lg">
                    <p className="text-muted-foreground">
                        {stats.totalCategorized} categorized / {stats.totalUncategorized} pending
                    </p>
                    <Progress
                        value={stats.healthScore}
                        className={`mt-2 [&>[data-slot=progress-indicator]]:${stats.healthScore > 80 ? 'bg-green-500' : 'bg-amber-500'}`}
                    />
                </CardFooter>
            </Card>

            {/* Jurisdiction Breakdown */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>By Jurisdiction</CardDescription>
                    <CardTitle className="text-2xl font-medium">Top Regions</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="space-y-2 mt-2">
                        {Object.entries(stats.byJurisdiction)
                            .sort(([, a], [, b]) => b.amount - a.amount)
                            .slice(0, 4)
                            .map(([jur, data]) => (
                                <div key={jur} className="flex items-center justify-between text-lg">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="text-lg font-normal">
                                            {jur}
                                        </Badge>
                                        <span className="text-lg text-muted-foreground">({data.count})</span>
                                    </div>
                                    <span className="font-mono text-lg">{formatCurrency(data.amount)}</span>
                                </div>
                            ))}
                        {Object.keys(stats.byJurisdiction).length === 0 && (
                            <p className="text-lg text-muted-foreground">No data available</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>By Category</CardDescription>
                    <CardTitle className="text-2xl   font-medium">Top Categories</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="space-y-2 mt-2">
                        {Object.entries(stats.byCategory)
                            .sort(([, a], [, b]) => b.amount - a.amount)
                            .slice(0, 4)
                            .map(([cat, data]) => (
                                <div key={cat} className="flex items-center justify-between text-lg">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-lg font-normal">
                                            {cat}
                                        </Badge>
                                        <span className="text-lg text-muted-foreground">({data.count})</span>
                                    </div>
                                    <span className="font-mono text-lg">{formatCurrency(data.amount)}</span>
                                </div>
                            ))}
                        {Object.keys(stats.byCategory).length === 0 && (
                            <p className="text-lg text-muted-foreground">No data available</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
