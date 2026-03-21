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

interface PaymentTableProps {
    walletAddress?: string;
}

export default function PaymentTable({ walletAddress }: PaymentTableProps) {
    const [activeTab, setActiveTab] = React.useState<"subscriptions" | "payroll">("subscriptions");
    const { transactions, isLoading } = useWalletHistory(walletAddress);
    const { mutate: cancelIntent, isPending: isCancelling } = useCancelIntent();

    const { subscriptions, payrolls } = transactions?.reduce((acc: any, tx: TransactionItemProps) => {
        if (tx.type === ActivityType.INTENT_CREATED) {
            const recipients = tx.details?.recipients || [];
            if (recipients.length > 1) {
                acc.payrolls.push(tx);
            } else {
                acc.subscriptions.push(tx);
            }
        }
        return acc;
    }, { subscriptions: [], payrolls: [] }) || { subscriptions: [], payrolls: [] };

    const renderTableRows = (items: TransactionItemProps[]) => {
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
                    <TableCell colSpan={9} className="h-24 text-center">
                        No active {activeTab} found.
                    </TableCell>
                </TableRow>
            );
        }

        return items.map((tx) => {
            const details = tx.details || {};
            const recipients = details.recipients || [];
            const tokenSymbol = details.token || 'MNT'; // Use details.token or fallback to MNT
            const amount = details.totalCommitment ? formatUnits(BigInt(details.totalCommitment), 18) : '0';
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
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 capitalize">
                            {tx.status}
                        </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                        <a
                            href={`https://explorer.testnet.mantle.xyz/tx/${tx.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                            {truncateAddress(tx.id, 4, 4)}
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
                            onClick={() => cancelIntent({ intentId: details.intentId as `0x${string}` })}
                            disabled={isCancelling || (details.endDate && new Date(details.endDate) < new Date())}
                        >
                            {isCancelling ? '...' : 'Cancel'}
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
                            <TableHead>Name</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Hash</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Frequency</TableHead>
                            <TableHead>Actions</TableHead>
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
