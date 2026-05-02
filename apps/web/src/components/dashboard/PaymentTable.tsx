import * as React from "react";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { truncateAddress, formatInterval } from "@/utils/format"
import { Button } from "../ui/button"
import { useWalletHistory, TransactionItemProps } from "@/hooks/useWalletHistory"
import { ActivityType } from "@/lib/envio/client"
import { useCancelIntent } from "@/hooks/payments/useCancelIntent"
import { formatUnits } from "viem"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink } from "lucide-react"
import { complyrExplorerUrl } from "@/lib/chain"

interface PaymentTableProps {
    walletAddress?: string;
}

type IntentLifecycleStatus = "active" | "cancelled" | "completed" | "partial" | "failed";
type IntentTableRow = Omit<TransactionItemProps, "status"> & { status: IntentLifecycleStatus };

export default function PaymentTable({ walletAddress }: PaymentTableProps) {
    const [activeTab, setActiveTab] = React.useState<"subscriptions" | "payroll">("subscriptions");
    const [cancellingIntentId, setCancellingIntentId] = React.useState<string | null>(null);
    const { transactions, isLoading } = useWalletHistory(walletAddress);
    const { mutate: cancelIntent, isPending: isCancelling } = useCancelIntent();

    const { subscriptions, payrolls } = React.useMemo(() => {
        const items = transactions || [];

        const cancelledIntentIds = new Set<string>();
        const latestExecutionByIntent = new Map<string, TransactionItemProps>();

        for (const tx of items) {
            const intentId = tx.details?.intentId;
            if (!intentId) continue;

            if (tx.type === ActivityType.INTENT_CANCELLED) {
                cancelledIntentIds.add(intentId);
                continue;
            }

            if (tx.type === ActivityType.INTENT_EXECUTION) {
                const prev = latestExecutionByIntent.get(intentId);
                const currentExecution = Number(tx.details?.executionNumber || 0);
                const prevExecution = Number(prev?.details?.executionNumber || 0);
                if (!prev || currentExecution >= prevExecution) {
                    latestExecutionByIntent.set(intentId, tx);
                }
            }
        }

        const withStatus: IntentTableRow[] = items
            .filter((tx) => tx.type === ActivityType.INTENT_CREATED)
            .map((tx) => {
                const intentId = tx.details?.intentId;
                const latestExecution = intentId ? latestExecutionByIntent.get(intentId) : undefined;

                let lifecycleStatus: IntentLifecycleStatus = "active";
                if (intentId && cancelledIntentIds.has(intentId)) {
                    lifecycleStatus = "cancelled";
                } else if (latestExecution) {
                    const executionStatus = latestExecution.status;
                    const executionNumber = Number(latestExecution.details?.executionNumber || 0);
                    const totalExecutions = Number(latestExecution.details?.totalExecutions || 0);

                    if (executionStatus === "failed") {
                        lifecycleStatus = "failed";
                    } else if (executionStatus === "partial") {
                        lifecycleStatus = "partial";
                    } else if (totalExecutions > 0 && executionNumber >= totalExecutions) {
                        lifecycleStatus = "completed";
                    }
                }

                return {
                    ...tx,
                    status: lifecycleStatus,
                };
            });

        return withStatus.reduce(
            (acc: { subscriptions: IntentTableRow[]; payrolls: IntentTableRow[] }, tx) => {
                const recipients = tx.details?.recipients || [];
                if (recipients.length > 1) {
                    acc.payrolls.push(tx);
                } else {
                    acc.subscriptions.push(tx);
                }
                return acc;
            },
            { subscriptions: [], payrolls: [] }
        );
    }, [transactions]);

    const statusClassName = (status: IntentLifecycleStatus) => {
        switch (status) {
            case "cancelled":
                return "border-muted-foreground/40 text-muted-foreground";
            case "completed":
                return "border-emerald-500/40 text-emerald-600";
            case "partial":
                return "border-amber-500/40 text-amber-600";
            case "failed":
                return "border-red-500/40 text-red-600";
            default:
                return "border-foreground text-foreground";
        }
    };

    const renderTableRows = (items: IntentTableRow[]) => {
        if (isLoading) {
            return Array(3).fill(0).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
            ));
        }

        if (items.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        No active {activeTab} instances.
                    </TableCell>
                </TableRow>
            );
        }

        return items.map((tx) => {
            const details = tx.details || {};
            const recipients = details.recipients || [];
            const tokenSymbol = details.token || 'ETH';
            const amount = details.totalCommitment ? formatUnits(BigInt(details.totalCommitment), 18) : '0';
            const intentId = details.intentId as `0x${string}` | undefined;
            const isInactive = tx.status === 'cancelled' || tx.status === 'completed';
            const isThisRowCancelling = isCancelling && cancellingIntentId === intentId;
            return (
                <TableRow key={tx.id} >
                    <TableCell className="font-medium truncate max-w-[200px]" title={tx.title}>{tx.title || 'Untitled Payment'}</TableCell>
                    <TableCell className="font-medium">{Number(amount).toLocaleString(undefined, { maximumFractionDigits: 6 })} {tokenSymbol}</TableCell>
                    <TableCell>
                        {recipients.length > 1 ? (
                            <Select>
                                <SelectTrigger className="w-40 h-8" size="sm">
                                    <SelectValue placeholder={`${recipients.length} Recipients`} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {recipients.map((r: any, idx: number) => {
                                            const address = typeof r === 'string' ? r : r?.address || '';
                                            return (
                                                <SelectItem key={idx} value={address || `unknown-${idx}`}>
                                                    {truncateAddress(address)}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="font-mono text-xs">
                                {(() => {
                                    const r = recipients[0];
                                    const address = typeof r === 'string' ? r : r?.address || '';
                                    return address ? truncateAddress(address) : 'Unknown';
                                })()}
                            </div>
                        )}
                    </TableCell>
                    <TableCell className="font-medium">
                        <span className={`inline-flex items-center px-2 py-0.5 border rounded text-[10px] font-mono tracking-widest uppercase ${statusClassName(tx.status)}`}>
                            {tx.status}
                        </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                        <a
                            href={`${complyrExplorerUrl}/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                            {truncateAddress(tx.txHash, 4, 4)}
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                        {new Date(tx.timestamp).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                        {details.duration ? formatInterval(parseInt(details.duration)) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                        {details.frequency || 'N/A'}
                    </TableCell>
                    <TableCell>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                                if (!intentId) return;
                                setCancellingIntentId(intentId);
                                cancelIntent(
                                    { intentId },
                                    {
                                        onSettled: () => setCancellingIntentId(null),
                                    }
                                );
                            }}
                            disabled={
                                !intentId ||
                                isInactive ||
                                isThisRowCancelling ||
                                (details.endDate && new Date(details.endDate) < new Date())
                            }
                        >
                            {isThisRowCancelling ? '...' : 'Cancel'}
                        </Button>
                    </TableCell>
                </TableRow>
            );
        });
    };

    return (
        <div className="w-full space-y-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList>
                    <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
                    <TabsTrigger value="payroll">Payroll</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Reference</TableHead>
                            <TableHead>Volume</TableHead>
                            <TableHead>Destinations</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Hash</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Term</TableHead>
                            <TableHead>Frequency</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {renderTableRows(activeTab === "subscriptions" ? subscriptions : payrolls)}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
