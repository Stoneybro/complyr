"use client";

import { useState, useCallback, useEffect } from "react";
import { createPublicClient, http, createWalletClient, custom, getAddress } from "viem";
import { useWallets } from "@privy-io/react-auth";
import { ComplianceRegistryABI } from "@/lib/abi/ComplianceRegistryABI";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Trash2, ShieldCheck, UserPlus, Fingerprint, Share2, Check } from "lucide-react";
import { ComplianceRegistryAddress } from "@/lib/CA";
import { complyrChain } from "@/lib/chain";

const REGISTRY_ADDRESS = ComplianceRegistryAddress as `0x${string}`;
const MAX_REVIEWERS = 5;

const REVIEWER_ACCESS = {
    Reviewer: 1,
    Ledger: 2,
} as const;

const ACCESS_LABELS: Record<number, string> = {
    [REVIEWER_ACCESS.Reviewer]: "Reviewer",
    [REVIEWER_ACCESS.Ledger]: "Full Ledger",
};

type Reviewer = {
    address: string;
    accessLevel: number;
};

function getErrorMessage(error: unknown, fallback: string) {
    if (typeof error === "object" && error !== null) {
        const candidate = error as { shortMessage?: unknown; message?: unknown };
        if (typeof candidate.shortMessage === "string") return candidate.shortMessage;
        if (typeof candidate.message === "string") return candidate.message;
    }
    return fallback;
}

export function AuditorsManager({ proxyAccount }: { proxyAccount?: string }) {
    const [auditors, setAuditors] = useState<Reviewer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isManaging, setIsManaging] = useState(false);
    const [newAuditorAddress, setNewAuditorAddress] = useState("");
    const [newAccessLevel, setNewAccessLevel] = useState<number>(REVIEWER_ACCESS.Reviewer);
    
    const [isCopying, setIsCopying] = useState(false);
    
    const { wallets } = useWallets();

    const fetchAuditors = useCallback(async () => {
        if (!proxyAccount) return;
        setIsLoading(true);
        try {
            const publicClient = createPublicClient({
                chain: complyrChain,
                transport: http(),
            });

            const current = await publicClient.readContract({
                address: REGISTRY_ADDRESS,
                abi: ComplianceRegistryABI,
                functionName: "getAuditors",
                args: [proxyAccount as `0x${string}`],
            }) as string[];

            const withAccess = await Promise.all(current.map(async (address) => {
                const accessLevel = await publicClient.readContract({
                    address: REGISTRY_ADDRESS,
                    abi: ComplianceRegistryABI,
                    functionName: "reviewerAccess",
                    args: [proxyAccount as `0x${string}`, address as `0x${string}`],
                }) as number;

                return { address, accessLevel };
            }));
            
            setAuditors(withAccess);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [proxyAccount]);

    useEffect(() => {
        if (proxyAccount) {
            fetchAuditors();
        }
    }, [proxyAccount, fetchAuditors]);

    const handleAdd = async () => {
        if (!newAuditorAddress) return;
        if (!newAuditorAddress.startsWith("0x") || newAuditorAddress.length !== 42) {
            toast.error("Invalid checksummed address");
            return;
        }

        const ownerWallet = wallets?.find((w) => w.walletClientType === "privy");
        if (!ownerWallet) {
            toast.error("Please connect your wallet");
            return;
        }

        setIsManaging(true);
        const loadingId = toast.loading("Checking wallet balance...");

        try {
            const provider = await ownerWallet.getEthereumProvider();
            const walletClient = createWalletClient({
                account: ownerWallet.address as `0x${string}`,
                chain: complyrChain,
                transport: custom(provider),
            });
            const publicClient = createPublicClient({
                chain: complyrChain,
                transport: custom(provider)
            });

            await ownerWallet.switchChain(complyrChain.id);

            const balance = await publicClient.getBalance({ address: ownerWallet.address as `0x${string}` });
            if (balance === 0n) {
                toast.loading("Preparing transaction environment...", { id: loadingId });
                const fundRes = await fetch("/api/relay/fund-wallet", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ targetWallet: ownerWallet.address }),
                });
                
                const fundData = await fundRes.json();
                if (!fundData.success) {
                    throw new Error("Insufficient Sepolia ETH to pay for gas and auto-funding failed.");
                }
                
                // Wait for chain sync
                await new Promise(r => setTimeout(r, 2000));
            }

            toast.loading("Requesting signature to approve reviewer...", { id: loadingId });

            const { request } = await publicClient.simulateContract({
                account: ownerWallet.address as `0x${string}`,
                address: REGISTRY_ADDRESS,
                abi: ComplianceRegistryABI,
                functionName: "addAuditorWithAccess",
                args: [proxyAccount as `0x${string}`, getAddress(newAuditorAddress), newAccessLevel],
            });

            toast.loading("Transaction signed. Approving reviewer...", { id: loadingId });
            
            const hash = await walletClient.writeContract(request);
            await publicClient.waitForTransactionReceipt({ hash });

            toast.success("External reviewer approved.", { id: loadingId });
            setNewAuditorAddress("");
            setNewAccessLevel(REVIEWER_ACCESS.Reviewer);
            fetchAuditors();
        } catch (err: unknown) {
            console.error(err);
            toast.error(getErrorMessage(err, "Failed to approve reviewer"), { id: loadingId });
        } finally {
            setIsManaging(false);
        }
    };

    const handleUpdateAccess = async (auditorAddr: string, accessLevel: number) => {
        const ownerWallet = wallets?.find((w) => w.walletClientType === "privy");
        if (!ownerWallet) return toast.error("Connect wallet");

        setIsManaging(true);
        const loadingId = toast.loading("Requesting signature to update reviewer access...");

        try {
            const provider = await ownerWallet.getEthereumProvider();
            const walletClient = createWalletClient({
                account: ownerWallet.address as `0x${string}`,
                chain: complyrChain,
                transport: custom(provider),
            });
            const publicClient = createPublicClient({
                chain: complyrChain,
                transport: custom(provider)
            });

            await ownerWallet.switchChain(complyrChain.id);

            const { request } = await publicClient.simulateContract({
                account: ownerWallet.address as `0x${string}`,
                address: REGISTRY_ADDRESS,
                abi: ComplianceRegistryABI,
                functionName: "updateAuditorAccess",
                args: [proxyAccount as `0x${string}`, auditorAddr as `0x${string}`, accessLevel],
            });

            const hash = await walletClient.writeContract(request);
            await publicClient.waitForTransactionReceipt({ hash });

            toast.success("Reviewer access updated.", { id: loadingId });
            fetchAuditors();
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, "Failed to update reviewer access"), { id: loadingId });
        } finally {
            setIsManaging(false);
        }
    };

    const handleRemove = async (auditorAddr: string) => {
        const ownerWallet = wallets?.find((w) => w.walletClientType === "privy");
        if (!ownerWallet) return toast.error("Connect wallet");

        setIsManaging(true);
        const loadingId = toast.loading("Requesting signature to remove reviewer...");

        try {
            const provider = await ownerWallet.getEthereumProvider();
            const walletClient = createWalletClient({
                account: ownerWallet.address as `0x${string}`,
                chain: complyrChain,
                transport: custom(provider),
            });
            const publicClient = createPublicClient({
                chain: complyrChain,
                transport: custom(provider)
            });

            await ownerWallet.switchChain(complyrChain.id);

            const balance = await publicClient.getBalance({ address: ownerWallet.address as `0x${string}` });
            if (balance === 0n) {
                toast.loading("Preparing transaction environment...", { id: loadingId });
                const fundRes = await fetch("/api/relay/fund-wallet", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ targetWallet: ownerWallet.address }),
                });
                
                const fundData = await fundRes.json();
                if (!fundData.success) {
                    throw new Error("Insufficient Sepolia ETH to pay for gas and auto-funding failed.");
                }
                
                // Wait for chain sync
                await new Promise(r => setTimeout(r, 2000));
            }

            toast.loading("Requesting signature to remove reviewer...", { id: loadingId });

            const { request } = await publicClient.simulateContract({
                account: ownerWallet.address as `0x${string}`,
                address: REGISTRY_ADDRESS,
                abi: ComplianceRegistryABI,
                functionName: "removeAuditor",
                args: [proxyAccount as `0x${string}`, auditorAddr as `0x${string}`],
            });
            
            const hash = await walletClient.writeContract(request);
            await publicClient.waitForTransactionReceipt({ hash });

            toast.success("External reviewer removed.", { id: loadingId });
            fetchAuditors();
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, "Failed to remove reviewer"), { id: loadingId });
        } finally {
            setIsManaging(false);
        }
    };

    const handleCopyLink = async () => {
        if (!proxyAccount) return;
        setIsCopying(true);
        const url = `${window.location.origin}/auditor/${proxyAccount}`;
        try {
            await navigator.clipboard.writeText(url);
            toast.success("Reviewer portal link copied to clipboard.");
            setTimeout(() => setIsCopying(false), 2000);
        } catch {
            toast.error("Failed to copy link");
            setIsCopying(false);
        }
    };

    return (
        <Card className="max-w-3xl">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2 font-semibold">
                        <ShieldCheck className="h-5 w-5" />
                        Review Access
                    </CardTitle>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCopyLink}
                        disabled={!proxyAccount}
                        className="gap-2 border-muted-foreground/20 text-xs h-8"
                    >
                        {isCopying ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                        {isCopying ? "Link Copied" : "Share Access Link"}
                    </Button>
                </div>
                <CardDescription className="text-sm leading-relaxed max-w-2xl">
                    Approved reviewers can run private encrypted review tests and decrypt permitted audit context.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Approved Reviewers</h3>
                    
                    {isLoading ? (
                         <div className="py-4 flex justify-center text-muted-foreground">
                             <Loader2 className="h-5 w-5 animate-spin" />
                         </div>
                    ) : auditors.length === 0 ? (
                        <div className="bg-muted/30 border border-dashed rounded-lg p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                            <Fingerprint className="h-8 w-8 text-muted-foreground/50" />
                            No external reviewers have been approved.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {auditors.map((auditor, i) => (
                                <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-card text-sm">
                                    <span className="font-mono">{auditor.address}</span>
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={String(auditor.accessLevel)}
                                            onValueChange={(value) => handleUpdateAccess(auditor.address, Number(value))}
                                            disabled={isManaging}
                                        >
                                            <SelectTrigger className="h-8 w-28">
                                                <SelectValue aria-label={ACCESS_LABELS[auditor.accessLevel] ?? "Access"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={String(REVIEWER_ACCESS.Reviewer)}>Reviewer</SelectItem>
                                                <SelectItem value={String(REVIEWER_ACCESS.Ledger)}>Full Ledger</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleRemove(auditor.address)}
                                            disabled={isManaging}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-medium">Add New Reviewer</h3>
                    <div className="grid gap-2 sm:grid-cols-[1fr_150px_auto]">
                        <Input 
                            value={newAuditorAddress}
                            onChange={(e) => setNewAuditorAddress(e.target.value)}
                            placeholder="0x... (e.g. 0x123...abc)"
                            className="font-mono"
                            disabled={isManaging || auditors.length >= MAX_REVIEWERS}
                        />
                        <Select
                            value={String(newAccessLevel)}
                            onValueChange={(value) => setNewAccessLevel(Number(value))}
                            disabled={isManaging || auditors.length >= MAX_REVIEWERS}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={String(REVIEWER_ACCESS.Reviewer)}>Reviewer</SelectItem>
                                <SelectItem value={String(REVIEWER_ACCESS.Ledger)}>Full Ledger</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button 
                            onClick={handleAdd} 
                            disabled={isManaging || !newAuditorAddress || auditors.length >= MAX_REVIEWERS}
                            className="shrink-0"
                        >
                            {isManaging ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                            Approve Reviewer
                        </Button>
                    </div>
                    {auditors.length >= MAX_REVIEWERS && (
                        <p className="text-sm text-destructive font-medium">
                            You have reached the maximum limit of {MAX_REVIEWERS} external reviewers. Remove one before adding another.
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground font-mono">
                        Approving an address grants access to the reviewer portal for this wallet. Removed reviewers lose future review-test access, but historical FHE decrypt grants cannot be cryptographically revoked.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
