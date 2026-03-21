
import { TransactionItemProps } from '@/hooks/useWalletHistory';
import { JURISDICTION_DISPLAY, CATEGORY_DISPLAY } from "@/lib/compliance-enums";
import { ActivityType } from '@/lib/envio/client';
import { cn } from '@/lib/utils';
import { formatEther } from 'viem';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Badge } from "@/components/ui/badge";

import { formatUnits } from 'viem';

// Format currency helper
const formatCurrency = (amount?: string, token?: string) => {
    if (!amount) return '-';
    // Check if valid number string
    if (isNaN(Number(amount))) return amount; // Fallback for non-numeric

    let formatted = amount;
    // If it's an integer (no dot) and looks like units, format it.
    // We assume indexer stores raw units.
    if (!amount.includes('.')) {
        try {
            formatted = formatUnits(BigInt(amount), 18);
        } catch (e) {
            // Keep original if BigInt fails
        }
    }

    return `${Number(formatted).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${token || 'MNT'}`;
};

export const TransactionItem = ({ item }: { item: TransactionItemProps }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="bg-card hover:bg-accent/50 transition-colors border-border/50 overflow-hidden">
            <div
                className="flex items-center gap-2 py-4 pl-4 pr-2 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >


                <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center ">
                        <div className="font-medium text-sm text-foreground truncate">{item.title}</div>
                    </div>
                    <div className="">{item.details.scheduleName && <p className="text-xs text-muted-foreground truncate">{item.details.scheduleName}</p>}</div>


                    <div className="flex justify-between hidden sm:flex">
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                        <div className="text-xs text-muted-foreground">
                            {new Date(item.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                            })}
                        </div>
                    </div>
                </div>

                <div className="">
                    {expanded ? <ChevronUp className='w-3 h-3' /> : <ChevronDown className='w-3 h-3' />}
                </div>


            </div>

            {expanded && (
                <div className="bg-muted/30 p-4 border-t border-border/50 space-y-3 text-sm animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">Tx Hash</span>
                            <a
                                href={`https://explorer.testnet.mantle.xyz/tx/${item.id.split('-')[0]}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:text-primary/80 truncate block underline text-xs font-mono"
                            >
                                {item.id.split('-')[0].slice(0, 10)}...
                            </a>
                        </div>

                        {/* Dynamic fields based on activity details */}
                        {Object.entries(item.details).map(([key, value]) => {
                            if (key === 'txHash') return null;
                            if (key === 'recipients' && Array.isArray(value)) {
                                return (
                                    <div key={key} className="col-span-2 mt-2">
                                        <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-1">Recipients</span>
                                        <div className="space-y-1">
                                            {value.map((r: any, idx: number) => (
                                                <div key={idx} className="flex justify-between text-xs bg-muted/20 p-1.5 rounded">
                                                    <span className="font-mono text-muted-foreground">{r.address.slice(0, 6)}...{r.address.slice(-4)}</span>
                                                    <span className="font-medium">{formatCurrency(r.amount, item.details.token)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                            if (key === 'compliance' && typeof value === 'object' && value !== null) {
                                const comp = value as any;
                                return (
                                    <div key={key} className="col-span-2 mt-2 bg-muted/20 p-2 rounded">
                                        <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-1">Compliance Data</span>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            {comp.entityIds?.length > 0 && (
                                                <div className="col-span-2">
                                                    <span className="text-muted-foreground mr-1">Entities:</span>
                                                    <span className="font-mono">{Array.isArray(comp.entityIds) ? comp.entityIds.join(", ") : comp.entityIds}</span>
                                                </div>
                                            )}
                                            {comp.jurisdiction && (
                                                <div>
                                                    <span className="text-muted-foreground block text-[10px]">Jurisdictions</span>
                                                    <span>
                                                        {comp.jurisdiction.split(',').map((j: string) => JURISDICTION_DISPLAY[Number(j)] || j).join(", ")}
                                                    </span>
                                                </div>
                                            )}
                                            {comp.category && (
                                                <div>
                                                    <span className="text-muted-foreground block text-[10px]">Categories</span>
                                                    <span>
                                                        {comp.category.split(',').map((c: string) => CATEGORY_DISPLAY[Number(c)] || c).join(", ")}
                                                    </span>
                                                </div>
                                            )}
                                            {comp.referenceId && (
                                                <div className="col-span-2">
                                                    <span className="text-muted-foreground mr-1">Ref ID:</span>
                                                    <span className="font-mono">{comp.referenceId}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            }
                            if (key === 'calls' && Array.isArray(value)) {

                                return (
                                    <div key={key} className="col-span-2 mt-2">
                                        <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-1">Transactions</span>
                                        <div className="space-y-1">
                                            {value.length === 0 ? (
                                                <span className="text-xs text-muted-foreground italic">Details not available</span>
                                            ) : (
                                                value.map((c: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between text-xs bg-muted/20 p-1.5 rounded">
                                                        <span className="font-mono text-muted-foreground">
                                                            {(c.recipient || c.target)?.slice(0, 6)}...{(c.recipient || c.target)?.slice(-4)}
                                                        </span>
                                                        <span className="font-medium">{formatCurrency(c.value, 'MNT')}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            }
                            // Skip these fields for display
                            // Added Case variations just in case
                            if (['selector', 'data', 'functionCall', 'scheduleName', 'target', 'value', 'Target', 'Value'].includes(key)) return null;
                            if (typeof value === 'object') return null;

                            // Update label text for scheduled payments
                            let displayKey = key.replace(/([A-Z])/g, ' $1').trim();
                            if (key === 'executionNumber') displayKey = 'Cycle Count';
                            if (key === 'totalExecutions') displayKey = 'Total Cycles';

                            // Truncate all Ethereum addresses (0x followed by 40 hex characters)
                            let displayValue = String(value);
                            if (typeof value === 'string' && value.startsWith('0x') && value.length === 42) {
                                displayValue = `${value.slice(0, 6)}...${value.slice(-4)}`;
                            }

                            // Add 1 to cycle count since it starts from 0
                            if (key === 'executionNumber' && typeof value === 'number') {
                                displayValue = String(value + 1);
                            }

                            return (
                                <div key={key}>
                                    <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5 capitalize">
                                        {displayKey}
                                    </span>
                                    <span className="text-foreground text-xs font-medium">
                                        {key.toLowerCase().includes('amount') || key.toLowerCase().includes('value') || key.toLowerCase().includes('commitment')
                                            ? formatCurrency(value as string, item.details.token)
                                            : displayValue}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Special sub-sections */}
                    {item.type === ActivityType.INTENT_CREATED && (
                        <div className="mt-2 p-3 bg-background/50 rounded-md border border-border/50">
                            <h4 className="font-medium text-foreground mb-2 text-[10px] uppercase">Configuration</h4>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Schedule</span>
                                <span className="text-foreground">{item.details.totalPlannedExecutions} executions total</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
