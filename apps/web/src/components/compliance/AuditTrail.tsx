import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, ShieldCheck, ExternalLink, LockIcon, UnlockIcon, RefreshCw, Loader2, CheckCircle2, UserX } from "lucide-react";
import { useAuditLogs, AuditRecord } from "@/hooks/useAuditLogs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AuditTrailProps {
    walletAddress?: string;
    recordsOverride?: AuditRecord[];
    onDecrypt?: () => void;
    isDecrypting?: boolean;
    isLoading?: boolean;
}

const RecipientKycBadge = ({ address }: { address: string }) => {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center">
                        <UserX className="h-3.5 w-3.5 text-muted-foreground/40" />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="text-xs">
                        Identity not available
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export function AuditTrail({ walletAddress, recordsOverride, onDecrypt, isDecrypting = false, isLoading = false }: AuditTrailProps) {
    const {
        records: hookedRecords,
        isLoading: hookedIsLoading,
        isDecrypting: hookedIsDecrypting,
        fetchLogs,
        decryptLedger: hookedDecrypt
    } = useAuditLogs(walletAddress);

    const records = recordsOverride || hookedRecords;
    const currentIsLoading = recordsOverride ? isLoading : hookedIsLoading;
    const currentIsDecrypting = recordsOverride ? isDecrypting : hookedIsDecrypting;
    const decryptLedger = onDecrypt || hookedDecrypt;

    const [searchTerm, setSearchTerm] = useState("");
    
    // Automatically fetch logs when the component mounts if we have a wallet address and no override
    useEffect(() => {
        if (walletAddress && !recordsOverride) {
            fetchLogs();
        }
    }, [walletAddress, fetchLogs, recordsOverride]);

    const displayRecords = searchTerm 
        ? records.filter(r => r.txHash.toLowerCase().includes(searchTerm.toLowerCase()) || r.recipients.some(rec => rec.toLowerCase().includes(searchTerm.toLowerCase())))
        : records;

    const totalPaid = displayRecords.reduce((sum, item) => {
        return sum + item.amounts.reduce((subSum, amt) => subSum + parseFloat(amt), 0);
    }, 0);

    const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        Transaction Logs
                    </CardTitle>
                    <CardDescription className="mt-1">
                        Immutable ledger of all payments and their associated compliance metadata.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    {!recordsOverride && (
                        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={currentIsLoading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${currentIsLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    )}
                    {!recordsOverride && (
                        <Button 
                            variant="default" 
                            size="sm" 
                            onClick={decryptLedger} 
                            disabled={currentIsDecrypting || records.length === 0 || records.every(r => r.decrypted)}
                        >
                            {currentIsDecrypting ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : records.some(r => r.decrypted) ? (
                                <UnlockIcon className="h-4 w-4 mr-2" />
                            ) : (
                                <LockIcon className="h-4 w-4 mr-2" />
                            )}
                            {records.length > 0 && records.every(r => r.decrypted) ? "Data Decrypted" : "Authorize View"}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 overflow-auto">
                <div className="flex gap-2">
                    <Input
                        placeholder="Search by transaction hash or recipient address"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-md"
                    />
                </div>

                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    {currentIsLoading && records.length === 0 ? (
                        <div className="py-12 flex justify-center text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : displayRecords.length > 0 ? (
                        <>
                            <div className="bg-muted/30 border rounded-lg p-4 grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-mono tracking-widest">TRANSACTIONS</div>
                                    <div className="text-xl font-bold font-mono">{displayRecords.length}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-muted-foreground uppercase font-mono tracking-widest">VOLUME</div>
                                    <div className="text-xl font-bold font-mono">{totalPaid.toLocaleString(undefined, { maximumFractionDigits: 4 })} USDC</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {displayRecords.map((record) => (
                                    <div key={record.recordIndex} className="p-4 bg-card border rounded-lg hover:border-primary/50 transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="font-medium text-sm flex items-center gap-2">
                                                {record.timestamp.toLocaleString()}
                                                <a
                                                    href={`https://sepolia.basescan.org/tx/${record.txHash}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-xs text-primary hover:underline flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded"
                                                >
                                                    View Source Tx <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                             <div className="flex gap-2 items-center">
                                                 {record.decrypted ? (
                                                     <span className="flex items-center text-[10px] font-mono tracking-widest uppercase border px-2 py-0.5 rounded bg-muted/30">
                                                         [ VIEW AUTHORIZED ]
                                                     </span>
                                                 ) : (
                                                     <span className="flex items-center text-[10px] font-mono tracking-widest uppercase border px-2 py-0.5 rounded opacity-50">
                                                         [ ENCRYPTED ]
                                                     </span>
                                                 )}
                                             </div>
                                        </div>
                                        
                                        <div className="space-y-2 mt-3 pl-2 border-l-2 border-muted">
                                            {record.recipients.map((recipient, i) => (
                                                <div key={i} className="grid grid-cols-12 gap-2 text-sm items-center py-1">
                                                    <div className="col-span-1 flex justify-center">
                                                        <RecipientKycBadge address={recipient} />
                                                    </div>
                                                    <div className="col-span-3 font-mono text-muted-foreground">
                                                        {formatAddress(recipient)}
                                                    </div>
                                                    <div className="col-span-2 font-medium">
                                                        {record.amounts[i]}
                                                    </div>
                                                    <div className="col-span-6 flex flex-wrap gap-2 items-center">
                                                        {record.decrypted && record.categories && record.jurisdictions && record.referenceIds ? (
                                                            <>
                                                                <span className="px-2 py-1 bg-secondary rounded text-xs">
                                                                    Ref: {record.referenceIds[i]}
                                                                </span>
                                                                <span className="px-2 py-1 bg-secondary rounded text-xs">
                                                                    Cat: {record.categories[i]}
                                                                </span>
                                                                <span className="px-2 py-1 bg-secondary rounded text-xs">
                                                                    Jur: {record.jurisdictions[i]}
                                                                </span>
                                                            </>
                                                        ) : (
                                                              <span className="px-2 py-0.5 bg-muted rounded text-[10px] font-mono tracking-tighter opacity-10">
                                                                  {record.encryptedPayload.slice(0, 30)}...
                                                              </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed flex flex-col gap-1 items-center">
                            <span className="font-semibold">No payments recorded yet.</span>
                            <span className="text-xs">Compliance records will appear here after transactions are executed.</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
