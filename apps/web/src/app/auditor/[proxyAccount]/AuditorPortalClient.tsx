"use client";

import Image from "next/image";
import { useState, useCallback, useEffect } from "react";
import { createPublicClient, http } from "viem";
import { hashkeyTestnet } from "@/lib/chains";
import { ComplianceRegistryABI } from "@/lib/abi/ComplianceRegistryABI";
import { ComplianceDashboard } from "@/components/compliance/ComplianceDashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, LogIn, Lock, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ComplianceRegistryAddress } from "@/lib/CA";

const REGISTRY_ADDRESS = ComplianceRegistryAddress as `0x${string}`;

export function AuditorPortalClient({ proxyAccount }: { proxyAccount: string }) {
    const [activeAddress, setActiveAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [auditors, setAuditors] = useState<string[]>([]);
    const [isLoadingAuditors, setIsLoadingAuditors] = useState(true);

    const fetchAuditors = useCallback(async () => {
        setIsLoadingAuditors(true);
        try {
            const publicClient = createPublicClient({
                chain: hashkeyTestnet,
                transport: http("https://testnet.hsk.xyz"),
            });

            const current = await publicClient.readContract({
                address: REGISTRY_ADDRESS,
                abi: ComplianceRegistryABI,
                functionName: "getAuditors",
                args: [proxyAccount as `0x${string}`],
            }) as string[];
            
            setAuditors(current.map(a => a.toLowerCase()));
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingAuditors(false);
        }
    }, [proxyAccount]);

    useEffect(() => {
        fetchAuditors();
        
        const checkConnection = async () => {
            if (typeof window !== "undefined" && (window as any).ethereum) {
                try {
                    const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
                    if (accounts.length > 0) {
                        setActiveAddress(accounts[0]);
                    }
                } catch (e) {
                    console.error("Eth_accounts failed", e);
                }
            }
        };
        checkConnection();
    }, [fetchAuditors]);

    const connectWallet = async () => {
        if (typeof window === "undefined" || !(window as any).ethereum) {
            toast.error("No Web3 wallet found. Please install MetaMask or another extension.");
            return;
        }
        setIsConnecting(true);
        try {
            const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts.length > 0) {
                setActiveAddress(accounts[0]);
            }
        } catch (e: any) {
            toast.error(e.message || "Failed to connect wallet.");
        } finally {
            setIsConnecting(false);
        }
    };

    const logout = () => {
        setActiveAddress(null);
    };

    const isAuthorizedAuditor = activeAddress && auditors.includes(activeAddress.toLowerCase());

    return (
        <div className="flex flex-col gap-6">
            {isLoadingAuditors ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse">
                     <Loader2 className="h-8 w-8 animate-spin mb-4" />
                     <p className="font-mono text-xs uppercase tracking-widest">Verifying access ledger...</p>
                </div>
            ) : !activeAddress ? (
                <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-6 duration-500">
                    <Card className="max-w-md w-full border border-muted-foreground/20 shadow-none overflow-hidden rounded-none">
                        <div className="h-1 w-full bg-foreground" />
                        <CardHeader className="text-center pb-4">
                            <div className="mx-auto w-12 h-12 flex items-center justify-center mb-4">
                                <Image src="/complyrlogo.svg" alt="Complyr" width={40} height={40} className="h-10 w-auto opacity-80" />
                            </div>
                            <CardTitle className="text-xl font-bold uppercase tracking-tight">Access Invite</CardTitle>
                            <CardDescription className="text-sm mt-3">
                                You have been authorized to review the compliance records for:
                                <div className="font-mono bg-muted px-2 py-1 rounded text-xs mt-2 select-all text-foreground border border-muted-foreground/10">{proxyAccount}</div>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 flex flex-col items-center pb-8">
                            <div className="bg-muted px-4 py-3 rounded text-[10px] text-center flex flex-col gap-2 w-full font-mono uppercase tracking-widest border border-muted-foreground/10 opacity-70">
                                <div className="flex items-center gap-2 justify-center">
                                    <Lock className="h-3 w-3" /> Encrypted Audit Trail
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground text-center px-4">Connect a delegated key to decrypt and verify the compliance manifest.</p>
                            <Button size="lg" className="w-full text-sm h-11 rounded-none uppercase font-mono tracking-widest" onClick={connectWallet} disabled={isConnecting}>
                                {isConnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogIn className="h-4 w-4 mr-2" />} Connect Key
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            ) : !isAuthorizedAuditor ? (
                <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-6 duration-500">
                    <Card className="max-w-md w-full border border-destructive/20 shadow-none overflow-hidden rounded-none">
                        <div className="h-1 w-full bg-destructive" />
                        <CardHeader className="text-center pb-4">
                            <div className="mx-auto w-12 h-12 flex items-center justify-center mb-4 text-destructive">
                                <XCircle className="h-8 w-8" />
                            </div>
                            <CardTitle className="text-xl font-bold uppercase tracking-tight text-destructive">Access Denied</CardTitle>
                            <CardDescription className="text-sm mt-3">
                                You are not authorized to review the compliance records for entity:
                                <div className="font-mono bg-muted px-2 py-1 rounded text-xs mt-2 select-all text-foreground border border-muted-foreground/10">{proxyAccount}</div>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 flex flex-col items-center pb-8">
                            <p className="text-xs text-muted-foreground text-center px-4">Your current key (<span className="font-mono text-foreground font-semibold">{activeAddress?.slice(0, 8)}...{activeAddress?.slice(-6)}</span>) has not been granted decryption privileges by the entity owner.</p>
                            <Button size="lg" variant="outline" className="w-full text-sm h-11 rounded-none uppercase font-mono tracking-widest border-destructive/50 hover:bg-destructive/10 text-destructive" onClick={logout}>
                                Close Session
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="flex flex-col gap-6 animate-in fade-in">
                    <Card className="bg-muted/30 border-muted-foreground/20 rounded-none shadow-none">
                        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="bg-foreground/5 p-2 rounded mt-0.5 border border-foreground/10">
                                    <ShieldCheck className="h-5 w-5 text-foreground" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                        Auditor Session Active
                                        <Badge variant="outline" className="text-[10px] border-foreground/20 font-mono tracking-widest">[ LIVE ]</Badge>
                                    </h3>
                                    <p className="text-xs mt-1 text-muted-foreground max-w-2xl leading-relaxed">
                                        You are reviewing the immutable manifest for entity <span className="font-mono bg-muted/50 px-1 py-0.5 rounded border border-muted-foreground/10 text-foreground">{proxyAccount}</span>. 
                                        Your delegated address (<span className="font-mono text-foreground font-semibold">{activeAddress?.slice(0, 8)}...{activeAddress?.slice(-6)}</span>) has been granted state-wide decryption privileges.
                                    </p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={logout} className="shrink-0 border-muted-foreground/30 text-xs h-8">
                                Close Session
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="bg-background rounded-none border-x border-b p-4 md:p-8 min-h-[80vh]">
                        <ComplianceDashboard walletAddress={proxyAccount} isExternalAuditor={true} />
                    </div>
                </div>
            )}
        </div>
    );
}
