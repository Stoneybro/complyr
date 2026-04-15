"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useKyc } from "@/hooks/useKyc";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, Fingerprint, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Phase = "idle" | "checking" | "already_verified" | "simulating" | "done" | "error";

const LEVELS = [
    { value: 1, label: "Basic" },
    { value: 2, label: "Advanced" },
    { value: 3, label: "Premium" },
    { value: 4, label: "Ultimate" },
] as const;

export function KycSection() {
    const [inputAddress, setInputAddress] = useState("");
    const [activeAddress, setActiveAddress] = useState<string | undefined>();
    const [phase, setPhase] = useState<Phase>("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [selectedLevel, setSelectedLevel] = useState(1);
    const [submittedLevel, setSubmittedLevel] = useState(1);

    const normalizedAddress = useMemo(() => {
        const v = inputAddress.trim();
        return /^0x[a-fA-F0-9]{40}$/.test(v) ? (v as `0x${string}`) : undefined;
    }, [inputAddress]);

    const { data: kyc, isLoading, requestKyc } = useKyc(activeAddress);

    useEffect(() => {
        if (phase !== "checking" || isLoading || !kyc) return;
        setPhase(kyc.isVerified ? "already_verified" : "simulating");
    }, [phase, isLoading, kyc]);

    useEffect(() => {
        if (phase !== "simulating") return;
        let cancelled = false;
        requestKyc(submittedLevel)
            .then(() => { if (!cancelled) setPhase("done"); })
            .catch((e: Error) => {
                if (!cancelled) {
                    setErrorMsg(e.message);
                    setPhase("error");
                }
            });
        return () => { cancelled = true; };
    }, [phase, requestKyc, submittedLevel]);

    const handleSubmit = () => {
        if (!normalizedAddress) return;
        setErrorMsg("");
        setSubmittedLevel(selectedLevel);
        setActiveAddress(normalizedAddress);
        setPhase("checking");
    };

    const handleReset = () => {
        setPhase("idle");
        setInputAddress("");
        setActiveAddress(undefined);
        setErrorMsg("");
        setSelectedLevel(1);
    };

    const isBusy = phase === "checking" || phase === "simulating";
    const isTerminal = phase === "already_verified" || phase === "done" || phase === "error";

    return (
        <div className="flex flex-col gap-6">
            <div className="border border-border rounded-lg p-4 flex gap-3 items-start bg-muted/30">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                    <h4 className="text-sm font-semibold">Demo: Complyr consumes external KYC status</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        In production, users complete KYC on an independent identity platform. Complyr does not perform KYC
                        itself — it reads on-chain credentials (HashKey KYC SBT) and uses them to guide payment workflows
                        and surface compliance signals in real time across the payment form.
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Submit any address below to simulate what an approved external credential looks like. Once written
                        to the testnet contract, the payment form immediately reflects the updated KYC status for that address.
                    </p>
                </div>
            </div>

            <div className="max-w-lg mx-auto w-full">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Fingerprint className="h-5 w-5" />
                                Simulate KYC Application
                            </CardTitle>
                            <Badge variant="outline" className="font-mono text-xs">HashKey KYC SBT</Badge>
                        </div>
                        <CardDescription>
                            Submit any wallet address to simulate a verified identity credential on the HashKey testnet.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="rounded-md border border-border divide-y divide-border">
                            <div className="flex justify-between items-center px-3 py-2.5 text-sm">
                                <span className="text-muted-foreground">Chain</span>
                                <span className="font-mono text-xs">HashKey Testnet</span>
                            </div>
                            <div className="flex justify-between items-center px-3 py-2.5 text-sm">
                                <span className="text-muted-foreground">Credential type</span>
                                <span className="font-mono text-xs">KYC SBT (Soulbound Token)</span>
                            </div>
                            <div className="flex justify-between items-center px-3 py-2.5 text-sm">
                                <span className="text-muted-foreground">Gas</span>
                                <span className="font-mono text-xs">Relayer-sponsored</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                                Verification level
                            </label>
                            <div className="flex gap-1.5">
                                {LEVELS.map(({ value, label }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setSelectedLevel(value)}
                                        disabled={isBusy}
                                        className={cn(
                                            "flex-1 px-2 py-1.5 text-xs font-mono rounded-md border transition-colors",
                                            selectedLevel === value
                                                ? "bg-foreground text-background border-foreground"
                                                : "bg-background text-muted-foreground border-border hover:text-foreground"
                                        )}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                                Wallet address
                            </label>
                            <Input
                                value={inputAddress}
                                onChange={(e) => {
                                    setInputAddress(e.target.value);
                                    if (phase !== "idle") {
                                        setPhase("idle");
                                        setActiveAddress(undefined);
                                        setErrorMsg("");
                                    }
                                }}
                                placeholder="0x..."
                                className="font-mono text-xs"
                                disabled={isBusy}
                            />
                            {!normalizedAddress && inputAddress.trim().length > 0 && (
                                <p className="text-[11px] text-muted-foreground">Enter a valid 0x address.</p>
                            )}
                        </div>

                        {phase === "already_verified" && (
                            <div className="flex items-start gap-2.5 p-3 border border-border rounded-md bg-muted/30">
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                <p className="text-xs text-muted-foreground">
                                    This address already holds a verified credential on-chain. No further action needed.
                                </p>
                            </div>
                        )}

                        {phase === "done" && (
                            <div className="flex items-start gap-2.5 p-3 border border-border rounded-md bg-muted/30">
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                <p className="text-xs text-muted-foreground">
                                    Credential written on-chain at level {submittedLevel} ({LEVELS.find(l => l.value === submittedLevel)?.label ?? "Basic"}).
                                    The payment form will now reflect this address as KYC-approved.
                                </p>
                            </div>
                        )}

                        {phase === "error" && (
                            <div className="flex items-start gap-2.5 p-3 border border-border rounded-md bg-muted/30">
                                <XCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                <p className="text-xs text-muted-foreground">
                                    {errorMsg || "Simulation failed. Check relayer configuration."}
                                </p>
                            </div>
                        )}

                        <Button
                            className="w-full"
                            onClick={handleSubmit}
                            disabled={!normalizedAddress || isBusy || isTerminal}
                        >
                            {isBusy ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {phase === "checking" ? "Checking status..." : "Simulating..."}
                                </>
                            ) : "Submit KYC Application"}
                        </Button>

                        {isTerminal && (
                            <button
                                type="button"
                                onClick={handleReset}
                                className="w-full text-center text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Check another address →
                            </button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
