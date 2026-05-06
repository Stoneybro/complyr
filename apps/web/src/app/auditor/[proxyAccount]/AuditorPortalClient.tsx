"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPublicClient, createWalletClient, custom, getAddress, http, parseUnits } from "viem";
import { ComplianceRegistryABI } from "@/lib/abi/ComplianceRegistryABI";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    AlertTriangle,
    CheckCircle2,
    Eye,
    Loader2,
    Lock,
    LogIn,
    Radar,
    RefreshCw,
    ShieldCheck,
    XCircle,
} from "lucide-react";
import { ComplianceRegistryAddress } from "@/lib/CA";
import { complyrChain } from "@/lib/chain";
import { encryptThresholdInput, userDecryptComplianceHandles } from "@/lib/fhe-compliance";
import {
    CATEGORY_DISPLAY,
    getCategoryOptions,
    getJurisdictionOptions,
    JURISDICTION_DISPLAY,
    stringToCategory,
    stringToJurisdiction,
} from "@/lib/compliance-enums";

const REGISTRY_ADDRESS = ComplianceRegistryAddress as `0x${string}`;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

type Eip1193Provider = {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type ReviewTestFormType = "large" | "recipient" | "category" | "jurisdiction";
type ReviewerAccess = 0 | 1 | 2;

type ReviewTest = {
    id: bigint;
    testType: number;
    recipientScope: string;
    numericScope: number;
    thresholdHandle: `0x${string}`;
    active: boolean;
    createdAt: Date;
};

type ReviewResult = {
    testId: bigint;
    recordId: string;
    recipient: string;
    resultHandle: `0x${string}`;
    timestamp: Date;
    decrypted?: number;
};

type RollupDecrypted = {
    global?: bigint;
    categories: Record<number, bigint>;
    jurisdictions: Record<number, bigint>;
};

type LedgerRecord = {
    index: number;
    txHash: string;
    token: string;
    recipients: readonly string[];
    amountHandles: readonly `0x${string}`[];
    categoryHandles: readonly `0x${string}`[];
    jurisdictionHandles: readonly `0x${string}`[];
    referenceIds: readonly string[];
    timestamp: Date;
    decrypted?: {
        amounts: string[];
        categories: string[];
        jurisdictions: string[];
    };
};

function getErrorMessage(error: unknown, fallback: string) {
    if (typeof error === "object" && error !== null) {
        const candidate = error as { shortMessage?: unknown; message?: unknown };
        if (typeof candidate.shortMessage === "string") return candidate.shortMessage;
        if (typeof candidate.message === "string") return candidate.message;
    }
    return fallback;
}

function getInjectedProvider(): Eip1193Provider | null {
    if (typeof window === "undefined") return null;
    return ((window as typeof window & { ethereum?: Eip1193Provider }).ethereum) ?? null;
}

function testTypeLabel(testType: number) {
    if (testType === 0) return "Large Payment";
    if (testType === 1) return "Recipient Exposure";
    if (testType === 2) return "Category Exposure";
    if (testType === 3) return "Jurisdiction Exposure";
    return "Unknown Test";
}

function testScopeLabel(test: ReviewTest) {
    if (test.testType === 1) return `${test.recipientScope.slice(0, 8)}...${test.recipientScope.slice(-6)}`;
    if (test.testType === 2) return CATEGORY_DISPLAY[test.numericScope] ?? `Category ${test.numericScope}`;
    if (test.testType === 3) return JURISDICTION_DISPLAY[test.numericScope] ?? `Jurisdiction ${test.numericScope}`;
    return "Any payment";
}

export function AuditorPortalClient({ proxyAccount }: { proxyAccount: string }) {
    const [activeAddress, setActiveAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [auditors, setAuditors] = useState<string[]>([]);
    const [isLoadingAuditors, setIsLoadingAuditors] = useState(true);
    const [reviewTests, setReviewTests] = useState<ReviewTest[]>([]);
    const [reviewResults, setReviewResults] = useState<ReviewResult[]>([]);
    const [isLoadingReviewData, setIsLoadingReviewData] = useState(false);
    const [isCreatingTest, setIsCreatingTest] = useState(false);
    const [isDecryptingResults, setIsDecryptingResults] = useState(false);
    const [testType, setTestType] = useState<ReviewTestFormType>("large");
    const [threshold, setThreshold] = useState("");
    const [recipientScope, setRecipientScope] = useState("");
    const [categoryScope, setCategoryScope] = useState("INVOICE");
    const [jurisdictionScope, setJurisdictionScope] = useState("US-CA");
    const [reviewerAccess, setReviewerAccess] = useState<ReviewerAccess>(0);
    const [rollupHandles, setRollupHandles] = useState<{ global?: `0x${string}`; categories: Record<number, `0x${string}`>; jurisdictions: Record<number, `0x${string}`>; }>({ categories: {}, jurisdictions: {} });
    const [rollupDecrypted, setRollupDecrypted] = useState<RollupDecrypted>({ categories: {}, jurisdictions: {} });
    const [isDecryptingReports, setIsDecryptingReports] = useState(false);
    const [ledgerRecords, setLedgerRecords] = useState<LedgerRecord[]>([]);
    const [isLoadingLedger, setIsLoadingLedger] = useState(false);
    const [isDecryptingLedger, setIsDecryptingLedger] = useState(false);

    const isAuthorizedAuditor = activeAddress && auditors.includes(activeAddress.toLowerCase());
    const canViewReports = reviewerAccess >= 1;
    const canViewLedger = reviewerAccess >= 2;

    const fetchAuditors = useCallback(async () => {
        setIsLoadingAuditors(true);
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

            setAuditors(current.map((address) => address.toLowerCase()));
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingAuditors(false);
        }
    }, [proxyAccount]);

    const fetchReviewData = useCallback(async () => {
        if (!activeAddress || !isAuthorizedAuditor) return;

        setIsLoadingReviewData(true);
        try {
            const publicClient = createPublicClient({
                chain: complyrChain,
                transport: http(),
            });
            const account = getAddress(activeAddress);
            const access = await publicClient.readContract({
                account,
                address: REGISTRY_ADDRESS,
                abi: ComplianceRegistryABI,
                functionName: "reviewerAccess",
                args: [proxyAccount as `0x${string}`, account],
            }) as number;
            setReviewerAccess(access as ReviewerAccess);

            const ids = await publicClient.readContract({
                account,
                address: REGISTRY_ADDRESS,
                abi: ComplianceRegistryABI,
                functionName: "getAuditorReviewTestIds",
                args: [account],
            }) as bigint[];

            const tests = await Promise.all(ids.map(async (id) => {
                const data = await publicClient.readContract({
                    account,
                    address: REGISTRY_ADDRESS,
                    abi: ComplianceRegistryABI,
                    functionName: "getReviewTest",
                    args: [id],
                });

                return {
                    id: data[0],
                    testType: Number(data[3]),
                    recipientScope: data[4],
                    numericScope: Number(data[5]),
                    thresholdHandle: data[6],
                    active: data[7],
                    createdAt: new Date(Number(data[8]) * 1000),
                } satisfies ReviewTest;
            }));

            const resultCount = Number(await publicClient.readContract({
                account,
                address: REGISTRY_ADDRESS,
                abi: ComplianceRegistryABI,
                functionName: "getReviewResultCount",
                args: [account],
            }));

            const results: ReviewResult[] = [];
            for (let i = 0; i < resultCount; i++) {
                const data = await publicClient.readContract({
                    account,
                    address: REGISTRY_ADDRESS,
                    abi: ComplianceRegistryABI,
                    functionName: "getReviewResult",
                    args: [account, BigInt(i)],
                });

                results.push({
                    testId: data[0],
                    recordId: data[1],
                    recipient: data[2],
                    resultHandle: data[3],
                    timestamp: new Date(Number(data[4]) * 1000),
                });
            }

            setReviewTests(tests.reverse());
            setReviewResults(results.reverse());
        } catch (err) {
            console.error(err);
            toast.error(getErrorMessage(err, "Failed to fetch review data"));
        } finally {
            setIsLoadingReviewData(false);
        }
    }, [activeAddress, isAuthorizedAuditor, proxyAccount]);

    const fetchReportHandles = useCallback(async () => {
        if (!activeAddress || !isAuthorizedAuditor || !canViewReports) return;
        try {
            const publicClient = createPublicClient({ chain: complyrChain, transport: http() });
            const account = getAddress(activeAddress);
            const global = await publicClient.readContract({
                account,
                address: REGISTRY_ADDRESS,
                abi: ComplianceRegistryABI,
                functionName: "getEncryptedGlobalTotal",
                args: [proxyAccount as `0x${string}`],
            }) as `0x${string}`;

            const categories: Record<number, `0x${string}`> = {};
            for (let i = 1; i <= 10; i++) {
                categories[i] = await publicClient.readContract({
                    account,
                    address: REGISTRY_ADDRESS,
                    abi: ComplianceRegistryABI,
                    functionName: "getEncryptedCategoryTotal",
                    args: [proxyAccount as `0x${string}`, i],
                }) as `0x${string}`;
            }

            const jurisdictions: Record<number, `0x${string}`> = {};
            for (let i = 1; i <= 13; i++) {
                jurisdictions[i] = await publicClient.readContract({
                    account,
                    address: REGISTRY_ADDRESS,
                    abi: ComplianceRegistryABI,
                    functionName: "getEncryptedJurisdictionTotal",
                    args: [proxyAccount as `0x${string}`, i],
                }) as `0x${string}`;
            }
            setRollupHandles({ global, categories, jurisdictions });
        } catch (err) {
            console.error(err);
        }
    }, [activeAddress, isAuthorizedAuditor, canViewReports, proxyAccount]);

    const decryptReports = async () => {
        if (!activeAddress || !canViewReports) return;
        const provider = getInjectedProvider();
        if (!provider) return toast.error("No Web3 wallet found.");
        setIsDecryptingReports(true);
        const loadingId = toast.loading("Decrypting private reports...");
        try {
            const account = getAddress(activeAddress);
            const handles = [
                ...(rollupHandles.global ? [rollupHandles.global] : []),
                ...Object.values(rollupHandles.categories),
                ...Object.values(rollupHandles.jurisdictions),
            ];
            const signer = {
                signTypedData: async (typedData: unknown) =>
                    provider.request({ method: "eth_signTypedData_v4", params: [account, JSON.stringify(typedData)] }) as Promise<`0x${string}`>,
            };
            const decrypted = await userDecryptComplianceHandles({
                handles,
                contractAddress: REGISTRY_ADDRESS,
                userAddress: account,
                signer,
            });
            const categories: Record<number, bigint> = {};
            Object.entries(rollupHandles.categories).forEach(([k, h]) => { categories[Number(k)] = BigInt(decrypted[h]); });
            const jurisdictions: Record<number, bigint> = {};
            Object.entries(rollupHandles.jurisdictions).forEach(([k, h]) => { jurisdictions[Number(k)] = BigInt(decrypted[h]); });
            setRollupDecrypted({
                global: rollupHandles.global ? BigInt(decrypted[rollupHandles.global]) : undefined,
                categories,
                jurisdictions,
            });
            toast.success("Private reports decrypted.", { id: loadingId });
        } catch (err) {
            console.error(err);
            toast.error(getErrorMessage(err, "Failed to decrypt reports"), { id: loadingId });
        } finally {
            setIsDecryptingReports(false);
        }
    };

    const fetchLedger = useCallback(async () => {
        if (!activeAddress || !isAuthorizedAuditor || !canViewLedger) return;
        setIsLoadingLedger(true);
        try {
            const publicClient = createPublicClient({ chain: complyrChain, transport: http() });
            const account = getAddress(activeAddress);
            const count = Number(await publicClient.readContract({
                account,
                address: REGISTRY_ADDRESS,
                abi: ComplianceRegistryABI,
                functionName: "getRecordCount",
                args: [proxyAccount as `0x${string}`],
            }));
            const items: LedgerRecord[] = [];
            for (let i = 0; i < count; i++) {
                const data = await publicClient.readContract({
                    account,
                    address: REGISTRY_ADDRESS,
                    abi: ComplianceRegistryABI,
                    functionName: "getRecord",
                    args: [proxyAccount as `0x${string}`, BigInt(i)],
                });
                items.push({
                    index: i,
                    txHash: data[0],
                    token: data[1],
                    recipients: data[2],
                    amountHandles: data[3],
                    categoryHandles: data[4],
                    jurisdictionHandles: data[5],
                    referenceIds: data[6],
                    timestamp: new Date(Number(data[7]) * 1000),
                });
            }
            setLedgerRecords(items.reverse());
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingLedger(false);
        }
    }, [activeAddress, isAuthorizedAuditor, canViewLedger, proxyAccount]);

    const decryptLedgerEvidence = async () => {
        if (!activeAddress || !canViewLedger || ledgerRecords.length === 0) return;
        const provider = getInjectedProvider();
        if (!provider) return toast.error("No Web3 wallet found.");
        setIsDecryptingLedger(true);
        const loadingId = toast.loading("Decrypting ledger evidence...");
        try {
            const account = getAddress(activeAddress);
            const signer = {
                signTypedData: async (typedData: unknown) =>
                    provider.request({ method: "eth_signTypedData_v4", params: [account, JSON.stringify(typedData)] }) as Promise<`0x${string}`>,
            };
            const next = await Promise.all(ledgerRecords.map(async (record) => {
                const handles = [...record.amountHandles, ...record.categoryHandles, ...record.jurisdictionHandles];
                const decrypted = await userDecryptComplianceHandles({
                    handles,
                    contractAddress: REGISTRY_ADDRESS,
                    userAddress: account,
                    signer,
                });
                return {
                    ...record,
                    decrypted: {
                        amounts: record.amountHandles.map((h) => String(BigInt(decrypted[h]))),
                        categories: record.categoryHandles.map((h) => CATEGORY_DISPLAY[Number(decrypted[h])] ?? "Unknown"),
                        jurisdictions: record.jurisdictionHandles.map((h) => JURISDICTION_DISPLAY[Number(decrypted[h])] ?? "Unknown"),
                    },
                };
            }));
            setLedgerRecords(next);
            toast.success("Ledger evidence decrypted.", { id: loadingId });
        } catch (err) {
            console.error(err);
            toast.error(getErrorMessage(err, "Failed to decrypt ledger"), { id: loadingId });
        } finally {
            setIsDecryptingLedger(false);
        }
    };

    useEffect(() => {
        fetchAuditors();

        const checkConnection = async () => {
            const provider = getInjectedProvider();
            if (!provider) return;

            try {
                const accounts = await provider.request({ method: "eth_accounts" });
                if (Array.isArray(accounts) && accounts.length > 0 && typeof accounts[0] === "string") {
                    setActiveAddress(accounts[0]);
                }
            } catch (err) {
                console.error("eth_accounts failed", err);
            }
        };

        checkConnection();
    }, [fetchAuditors]);

    useEffect(() => {
        if (isAuthorizedAuditor) {
            fetchReviewData();
        }
    }, [fetchReviewData, isAuthorizedAuditor]);

    useEffect(() => {
        if (isAuthorizedAuditor && canViewReports) {
            fetchReportHandles();
        }
    }, [isAuthorizedAuditor, canViewReports, fetchReportHandles]);

    useEffect(() => {
        if (isAuthorizedAuditor && canViewLedger) {
            fetchLedger();
        }
    }, [isAuthorizedAuditor, canViewLedger, fetchLedger]);

    const connectWallet = async () => {
        const provider = getInjectedProvider();
        if (!provider) {
            toast.error("No Web3 wallet found. Please install MetaMask or another extension.");
            return;
        }

        setIsConnecting(true);
        try {
            const accounts = await provider.request({ method: "eth_requestAccounts" });
            if (Array.isArray(accounts) && accounts.length > 0 && typeof accounts[0] === "string") {
                setActiveAddress(accounts[0]);
            }
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to connect wallet."));
        } finally {
            setIsConnecting(false);
        }
    };

    const createReviewTest = async () => {
        if (!activeAddress) return;

        const provider = getInjectedProvider();
        if (!provider) {
            toast.error("No Web3 wallet found.");
            return;
        }

        if (!threshold || Number(threshold) <= 0) {
            toast.error("Enter a positive threshold amount.");
            return;
        }

        if (testType === "recipient" && (!recipientScope.startsWith("0x") || recipientScope.length !== 42)) {
            toast.error("Enter a valid recipient scope address.");
            return;
        }

        setIsCreatingTest(true);
        const loadingId = toast.loading("Encrypting private threshold with Zama...");

        try {
            await provider.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: `0x${complyrChain.id.toString(16)}` }],
            });

            const account = getAddress(activeAddress);
            const encrypted = await encryptThresholdInput({
                callerAddress: account,
                threshold: parseUnits(threshold, 6),
                registryAddress: REGISTRY_ADDRESS,
            });
            const walletClient = createWalletClient({
                account,
                chain: complyrChain,
                transport: custom(provider),
            });
            const publicClient = createPublicClient({
                chain: complyrChain,
                transport: custom(provider),
            });

            let functionName: "createLargePaymentReviewTest" | "createRecipientExposureReviewTest" | "createCategoryExposureReviewTest" | "createJurisdictionExposureReviewTest" = "createLargePaymentReviewTest";
            let args: readonly unknown[] = [
                proxyAccount as `0x${string}`,
                encrypted.thresholdHandle,
                encrypted.thresholdProof,
            ];

            if (testType === "recipient") {
                functionName = "createRecipientExposureReviewTest";
                args = [
                    proxyAccount as `0x${string}`,
                    getAddress(recipientScope),
                    encrypted.thresholdHandle,
                    encrypted.thresholdProof,
                ];
            } else if (testType === "category") {
                functionName = "createCategoryExposureReviewTest";
                args = [
                    proxyAccount as `0x${string}`,
                    stringToCategory(categoryScope),
                    encrypted.thresholdHandle,
                    encrypted.thresholdProof,
                ];
            } else if (testType === "jurisdiction") {
                functionName = "createJurisdictionExposureReviewTest";
                args = [
                    proxyAccount as `0x${string}`,
                    stringToJurisdiction(jurisdictionScope),
                    encrypted.thresholdHandle,
                    encrypted.thresholdProof,
                ];
            }

            toast.loading("Requesting signature to create private review test...", { id: loadingId });

            const { request } = await publicClient.simulateContract({
                account,
                address: REGISTRY_ADDRESS,
                abi: ComplianceRegistryABI,
                functionName,
                args: args as never,
            });
            const hash = await walletClient.writeContract(request);
            await publicClient.waitForTransactionReceipt({ hash });

            toast.success("Private review test created.", { id: loadingId });
            setThreshold("");
            setRecipientScope("");
            await fetchReviewData();
        } catch (err) {
            console.error(err);
            toast.error(getErrorMessage(err, "Failed to create review test"), { id: loadingId });
        } finally {
            setIsCreatingTest(false);
        }
    };

    const decryptResults = async () => {
        if (!activeAddress || reviewResults.length === 0) return;

        const provider = getInjectedProvider();
        if (!provider) {
            toast.error("No Web3 wallet found.");
            return;
        }

        setIsDecryptingResults(true);
        const loadingId = toast.loading("Requesting Zama decrypt authorization...");

        try {
            const account = getAddress(activeAddress);
            const encryptedResults = reviewResults.filter((result) => result.decrypted === undefined);
            const signer = {
                signTypedData: async (typedData: unknown) => {
                    return provider.request({
                        method: "eth_signTypedData_v4",
                        params: [account, JSON.stringify(typedData)],
                    }) as Promise<`0x${string}`>;
                },
            };
            const decrypted = await userDecryptComplianceHandles({
                handles: encryptedResults.map((result) => result.resultHandle),
                contractAddress: REGISTRY_ADDRESS,
                userAddress: account,
                signer,
            });

            setReviewResults((current) => current.map((result) => {
                if (result.decrypted !== undefined) return result;
                return {
                    ...result,
                    decrypted: Number(decrypted[result.resultHandle]),
                };
            }));

            toast.success("Review signals decrypted.", { id: loadingId });
        } catch (err) {
            console.error(err);
            toast.error(getErrorMessage(err, "Failed to decrypt review signals"), { id: loadingId });
        } finally {
            setIsDecryptingResults(false);
        }
    };

    const logout = () => {
        setActiveAddress(null);
        setReviewTests([]);
        setReviewResults([]);
    };

    const testsById = useMemo(() => new Map(reviewTests.map((test) => [test.id.toString(), test])), [reviewTests]);

    if (isLoadingAuditors) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p className="font-mono text-xs uppercase tracking-widest">Verifying access ledger...</p>
            </div>
        );
    }

    if (!activeAddress) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-6 duration-500">
                <Card className="max-w-md w-full border border-muted-foreground/20 shadow-none overflow-hidden rounded-none">
                    <div className="h-1 w-full bg-foreground" />
                    <CardHeader className="text-center pb-4">
                        <div className="mx-auto w-12 h-12 flex items-center justify-center mb-4">
                            <Image src="/complyrlogo.svg" alt="Complyr" width={40} height={40} className="h-10 w-auto opacity-80" />
                        </div>
                        <CardTitle className="text-xl font-bold uppercase tracking-tight">Review Invite</CardTitle>
                        <CardDescription className="text-sm mt-3">
                            You have been approved to review encrypted audit signals for:
                            <div className="font-mono bg-muted px-2 py-1 rounded text-xs mt-2 select-all text-foreground border border-muted-foreground/10">{proxyAccount}</div>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6 items-center pb-8">
                        <div className="bg-muted px-4 py-3 rounded text-[10px] text-center flex flex-col gap-2 w-full font-mono uppercase tracking-widest border border-muted-foreground/10 opacity-70">
                            <div className="flex items-center gap-2 justify-center">
                                <Lock className="h-3 w-3" /> Private Review Thresholds
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center px-4">Connect the approved reviewer key to configure thresholds and decrypt result signals.</p>
                        <Button size="lg" className="w-full text-sm h-11 rounded-none uppercase font-mono tracking-widest" onClick={connectWallet} disabled={isConnecting}>
                            {isConnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogIn className="h-4 w-4 mr-2" />} Connect Key
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!isAuthorizedAuditor) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-6 duration-500">
                <Card className="max-w-md w-full border border-destructive/20 shadow-none overflow-hidden rounded-none">
                    <div className="h-1 w-full bg-destructive" />
                    <CardHeader className="text-center pb-4">
                        <div className="mx-auto w-12 h-12 flex items-center justify-center mb-4 text-destructive">
                            <XCircle className="h-8 w-8" />
                        </div>
                        <CardTitle className="text-xl font-bold uppercase tracking-tight text-destructive">Access Denied</CardTitle>
                        <CardDescription className="text-sm mt-3">
                            This key is not approved to review the entity:
                            <div className="font-mono bg-muted px-2 py-1 rounded text-xs mt-2 select-all text-foreground border border-muted-foreground/10">{proxyAccount}</div>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6 items-center pb-8">
                        <p className="text-xs text-muted-foreground text-center px-4">
                            Current key: <span className="font-mono text-foreground font-semibold">{activeAddress.slice(0, 8)}...{activeAddress.slice(-6)}</span>
                        </p>
                        <Button size="lg" variant="outline" className="w-full text-sm h-11 rounded-none uppercase font-mono tracking-widest border-destructive/50 hover:bg-destructive/10 text-destructive" onClick={logout}>
                            Try Different Account
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in">
            <Card className="bg-muted/30 border-muted-foreground/20 rounded-none shadow-none">
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="bg-foreground/5 p-2 rounded mt-0.5 border border-foreground/10">
                            <ShieldCheck className="h-5 w-5 text-foreground" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                Reviewer Session Active
                                <Badge variant="outline" className="text-[10px] border-foreground/20 font-mono tracking-widest">[ LIVE ]</Badge>
                            </h3>
                            <p className="text-xs mt-1 text-muted-foreground max-w-2xl leading-relaxed">
                                You are reviewing encrypted audit signals for <span className="font-mono bg-muted/50 px-1 py-0.5 rounded border border-muted-foreground/10 text-foreground">{proxyAccount}</span>.
                                Your key (<span className="font-mono text-foreground font-semibold">{activeAddress.slice(0, 8)}...{activeAddress.slice(-6)}</span>) can create private thresholds and decrypt the signal queue.
                            </p>
                            <p className="text-xs mt-1 text-muted-foreground">
                                Access level: <span className="font-mono text-foreground">{reviewerAccess >= 2 ? "Ledger Reviewer" : "Reviewer"}</span>
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={logout} className="shrink-0 border-muted-foreground/30 text-xs h-8">
                        Close Session
                    </Button>
                </CardContent>
            </Card>

            <div className="bg-background rounded-none border-x border-b p-4 md:p-8 min-h-[80vh]">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-bold tracking-tight">Private Review Portal</h2>
                        <p className="text-muted-foreground">
                            Configure encrypted thresholds and decrypt only the review signals generated by new payments.
                        </p>
                    </div>

                    <Tabs defaultValue="setup" className="flex flex-col gap-4">
                        <TabsList className="w-fit">
                            <TabsTrigger value="setup">Review Setup</TabsTrigger>
                            <TabsTrigger value="queue">Result Queue</TabsTrigger>
                            <TabsTrigger value="reports" disabled={!canViewReports}>Reports</TabsTrigger>
                            <TabsTrigger value="evidence" disabled={!canViewLedger}>Evidence</TabsTrigger>
                            <TabsTrigger value="ledger" disabled={!canViewLedger}>Ledger</TabsTrigger>
                        </TabsList>

                        <TabsContent value="setup" className="m-0">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <Radar className="h-5 w-5" />
                                            Encrypted Threshold
                                        </CardTitle>
                                        <CardDescription>
                                            The threshold is encrypted before it reaches the contract. The business cannot see the value being tested.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-2">
                                            <Label>Review Type</Label>
                                            <Select value={testType} onValueChange={(value) => setTestType(value as ReviewTestFormType)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select review type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="large">Large payment threshold</SelectItem>
                                                    <SelectItem value="recipient">Recipient exposure threshold</SelectItem>
                                                    <SelectItem value="category">Category exposure threshold</SelectItem>
                                                    <SelectItem value="jurisdiction">Jurisdiction exposure threshold</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Label>Private Threshold (USDC)</Label>
                                            <Input type="number" step="0.01" placeholder="10000.00" value={threshold} onChange={(event) => setThreshold(event.target.value)} />
                                        </div>

                                        {testType === "recipient" && (
                                            <div className="flex flex-col gap-2">
                                                <Label>Recipient Scope</Label>
                                                <Input className="font-mono" placeholder="0x..." value={recipientScope} onChange={(event) => setRecipientScope(event.target.value)} />
                                            </div>
                                        )}

                                        {testType === "category" && (
                                            <div className="flex flex-col gap-2">
                                                <Label>Category Scope</Label>
                                                <Select value={categoryScope} onValueChange={setCategoryScope}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {getCategoryOptions().filter((option) => option.value !== "none").map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {testType === "jurisdiction" && (
                                            <div className="flex flex-col gap-2">
                                                <Label>Jurisdiction Scope</Label>
                                                <Select value={jurisdictionScope} onValueChange={setJurisdictionScope}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select jurisdiction" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {getJurisdictionOptions().filter((option) => option.value !== "none").map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        <Button onClick={createReviewTest} disabled={isCreatingTest}>
                                            {isCreatingTest ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                                            Create Private Review Test
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-xl">Active Tests</CardTitle>
                                        <CardDescription>Tests run automatically against future encrypted payment records.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex flex-col gap-3">
                                        {isLoadingReviewData ? (
                                            <div className="py-8 flex justify-center text-muted-foreground">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            </div>
                                        ) : reviewTests.length === 0 ? (
                                            <div className="bg-muted/30 border border-dashed rounded-lg p-6 text-sm text-muted-foreground">
                                                No private review tests created yet.
                                            </div>
                                        ) : (
                                            reviewTests.map((test) => (
                                                <div key={test.id.toString()} className="flex items-start justify-between gap-3 border rounded-lg p-3">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-sm">{testTypeLabel(test.testType)}</span>
                                                            <Badge variant={test.active ? "outline" : "secondary"} className="text-[10px] font-mono uppercase">
                                                                {test.active ? "Active" : "Inactive"}
                                                            </Badge>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">Scope: {testScopeLabel(test)}</span>
                                                        <span className="text-[10px] font-mono text-muted-foreground">Threshold handle: {test.thresholdHandle.slice(0, 18)}...</span>
                                                    </div>
                                                    <span className="text-[10px] font-mono text-muted-foreground">#{test.id.toString()}</span>
                                                </div>
                                            ))
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="queue" className="m-0">
                            <Card>
                                <CardHeader className="flex flex-row items-start justify-between gap-4">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <Eye className="h-5 w-5" />
                                            Result Queue
                                        </CardTitle>
                                        <CardDescription>
                                            Each result is an encrypted boolean signal. Decrypting shows whether a reviewed payment crossed your private threshold.
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={fetchReviewData} disabled={isLoadingReviewData}>
                                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingReviewData ? "animate-spin" : ""}`} />
                                            Refresh
                                        </Button>
                                        <Button size="sm" onClick={decryptResults} disabled={isDecryptingResults || reviewResults.length === 0 || reviewResults.every((result) => result.decrypted !== undefined)}>
                                            {isDecryptingResults ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                                            Decrypt Signals
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-3">
                                    {reviewResults.length === 0 ? (
                                        <div className="bg-muted/30 border border-dashed rounded-lg p-8 text-center text-sm text-muted-foreground">
                                            No review signals yet. Signals are created when new payments are recorded after a matching review test exists.
                                        </div>
                                    ) : (
                                        reviewResults.map((result, index) => {
                                            const test = testsById.get(result.testId.toString());
                                            const triggered = result.decrypted === 1;

                                            return (
                                                <div key={`${result.resultHandle}-${index}`} className="grid grid-cols-1 md:grid-cols-12 gap-3 border rounded-lg p-4 items-center">
                                                    <div className="md:col-span-4 flex flex-col gap-1">
                                                        <span className="font-medium text-sm">{test ? testTypeLabel(test.testType) : `Test #${result.testId.toString()}`}</span>
                                                        <span className="text-xs text-muted-foreground">Record: <span className="font-mono">{result.recordId.slice(0, 10)}...{result.recordId.slice(-8)}</span></span>
                                                    </div>
                                                    <div className="md:col-span-3 text-xs text-muted-foreground">
                                                        Recipient: <span className="font-mono">{result.recipient === ZERO_ADDRESS ? "Any" : `${result.recipient.slice(0, 8)}...${result.recipient.slice(-6)}`}</span>
                                                    </div>
                                                    <div className="md:col-span-3 text-xs text-muted-foreground">
                                                        {result.timestamp.toLocaleString()}
                                                    </div>
                                                    <div className="md:col-span-2 flex md:justify-end">
                                                        {result.decrypted === undefined ? (
                                                            <Badge variant="secondary" className="font-mono text-[10px] uppercase">Encrypted</Badge>
                                                        ) : triggered ? (
                                                            <Badge variant="outline" className="border-destructive/30 text-destructive gap-1 font-mono text-[10px] uppercase">
                                                                <AlertTriangle className="h-3 w-3" /> Review
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="gap-1 font-mono text-[10px] uppercase">
                                                                <CheckCircle2 className="h-3 w-3" /> No Issue
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="reports" className="m-0">
                            <Card>
                                <CardHeader className="flex flex-row items-start justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-xl">Reports</CardTitle>
                                        <CardDescription>Encrypted aggregate totals by category and jurisdiction.</CardDescription>
                                    </div>
                                    <Button size="sm" onClick={decryptReports} disabled={!canViewReports || isDecryptingReports}>
                                        {isDecryptingReports ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                                        Decrypt Reports
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {!canViewReports ? (
                                        <div className="text-sm text-muted-foreground">Your access level does not include reports.</div>
                                    ) : (
                                        <>
                                            <div className="text-sm">Global Total: <span className="font-mono">{rollupDecrypted.global !== undefined ? rollupDecrypted.global.toString() : "Encrypted"}</span></div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {Object.entries(rollupHandles.categories).slice(0, 6).map(([k]) => (
                                                    <div key={`cat-${k}`} className="border rounded p-3 text-sm">
                                                        Category {k}: <span className="font-mono">{rollupDecrypted.categories[Number(k)] !== undefined ? rollupDecrypted.categories[Number(k)].toString() : "Encrypted"}</span>
                                                    </div>
                                                ))}
                                                {Object.entries(rollupHandles.jurisdictions).slice(0, 6).map(([k]) => (
                                                    <div key={`jur-${k}`} className="border rounded p-3 text-sm">
                                                        Jurisdiction {k}: <span className="font-mono">{rollupDecrypted.jurisdictions[Number(k)] !== undefined ? rollupDecrypted.jurisdictions[Number(k)].toString() : "Encrypted"}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="evidence" className="m-0">
                            <Card>
                                <CardHeader className="flex flex-row items-start justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-xl">Evidence</CardTitle>
                                        <CardDescription>Record-level evidence for triggered results (ledger access required).</CardDescription>
                                    </div>
                                    <Button size="sm" onClick={decryptLedgerEvidence} disabled={!canViewLedger || isDecryptingLedger || ledgerRecords.length === 0}>
                                        {isDecryptingLedger ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                                        Decrypt Evidence
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {!canViewLedger ? (
                                        <div className="text-sm text-muted-foreground">Your access level does not include evidence.</div>
                                    ) : reviewResults.filter((r) => r.decrypted === 1).length === 0 ? (
                                        <div className="text-sm text-muted-foreground">No triggered results to inspect yet.</div>
                                    ) : (
                                        reviewResults.filter((r) => r.decrypted === 1).map((r, i) => {
                                            const rec = ledgerRecords.find((x) => x.txHash.toLowerCase() === r.recordId.toLowerCase());
                                            return (
                                                <div key={`ev-${i}`} className="border rounded p-3 text-sm space-y-1">
                                                    <div>Record: <span className="font-mono">{r.recordId}</span></div>
                                                    <div>Recipient: <span className="font-mono">{r.recipient}</span></div>
                                                    <div>Evidence: {rec?.decrypted ? "Decrypted" : "Encrypted"}</div>
                                                </div>
                                            );
                                        })
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="ledger" className="m-0">
                            <Card>
                                <CardHeader className="flex flex-row items-start justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-xl">Ledger</CardTitle>
                                        <CardDescription>Full audit ledger (ledger reviewer only).</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={fetchLedger} disabled={!canViewLedger || isLoadingLedger}>
                                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingLedger ? "animate-spin" : ""}`} />
                                            Refresh
                                        </Button>
                                        <Button size="sm" onClick={decryptLedgerEvidence} disabled={!canViewLedger || isDecryptingLedger || ledgerRecords.length === 0}>
                                            {isDecryptingLedger ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                                            Decrypt Ledger
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {!canViewLedger ? (
                                        <div className="text-sm text-muted-foreground">Your access level does not include ledger records.</div>
                                    ) : ledgerRecords.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">No records available.</div>
                                    ) : (
                                        ledgerRecords.slice(0, 25).map((record) => (
                                            <div key={record.txHash} className="border rounded p-3 text-sm space-y-1">
                                                <div className="font-mono">#{record.index} {record.txHash.slice(0, 10)}...{record.txHash.slice(-8)}</div>
                                                <div className="text-muted-foreground">{record.timestamp.toLocaleString()}</div>
                                                <div>Recipients: {record.recipients.length}</div>
                                                <div>Status: {record.decrypted ? "Decrypted" : "Encrypted"}</div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
