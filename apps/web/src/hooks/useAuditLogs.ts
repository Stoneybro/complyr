import { useState, useCallback } from "react";
import { createPublicClient, http, formatUnits, getAddress } from "viem";
import { useWallets } from "@privy-io/react-auth";
import { ComplianceRegistryABI } from "@/lib/abi/ComplianceRegistryABI";
import { toast } from "sonner";
import { CATEGORY_DISPLAY, JURISDICTION_DISPLAY } from "@/lib/compliance-enums";
import { ComplianceRegistryAddress, MockUSDCAddress } from "@/lib/CA";
import { complyrChain } from "@/lib/chain";
import { userDecryptComplianceHandles } from "@/lib/fhe-compliance";

const REGISTRY_ADDRESS = ComplianceRegistryAddress as `0x${string}`;

type Eip1193Provider = {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type EthereumWindow = Window & {
    ethereum?: Eip1193Provider;
};

export type AuditRecord = {
    recordIndex: number;
    txHash: string;
    token: string;
    timestamp: Date;
    recipients: string[];
    amounts: string[];
    encryptedAmountHandles: `0x${string}`[];
    encryptedCategoryHandles: `0x${string}`[];
    encryptedJurisdictionHandles: `0x${string}`[];
    decrypted: boolean;
    categories?: string[];
    jurisdictions?: string[];
    referenceIds?: string[];
};

export function useAuditLogs(proxyAccount?: string, _isExternalAuditor: boolean = false) {
    void _isExternalAuditor;
    const [records, setRecords] = useState<AuditRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDecrypting, setIsDecrypting] = useState(false);
    const { wallets } = useWallets();

    const fetchLogs = useCallback(async () => {
        if (!proxyAccount) return;
        setIsLoading(true);
        
        try {
            const publicClient = createPublicClient({
                chain: complyrChain,
                transport: http(),
            });

            const countStr = await publicClient.readContract({
                address: REGISTRY_ADDRESS,
                abi: ComplianceRegistryABI,
                functionName: "getRecordCount",
                args: [proxyAccount as `0x${string}`],
            });

            const count = Number(countStr);
            const loadedRecords: AuditRecord[] = [];

            for (let i = 0; i < count; i++) {
                const index = BigInt(i);
                
                // Fetch record
                const recordData = await publicClient.readContract({
                    address: REGISTRY_ADDRESS,
                    abi: ComplianceRegistryABI,
                    functionName: "getRecord",
                    args: [proxyAccount as `0x${string}`, index],
                });

                const txHash = recordData[0];
                const token = recordData[1] as string;
                const recipients = recordData[2] as string[];
                const encryptedAmountHandles = recordData[3] as `0x${string}`[];
                const encryptedCategoryHandles = recordData[4] as `0x${string}`[];
                const encryptedJurisdictionHandles = recordData[5] as `0x${string}`[];
                const referenceIds = recordData[6] as string[];
                const timestamp = Number(recordData[7]);

                loadedRecords.push({
                    recordIndex: i,
                    txHash: txHash,
                    token,
                    timestamp: new Date(timestamp * 1000),
                    recipients,
                    amounts: encryptedAmountHandles.map(() => "Encrypted"),
                    encryptedAmountHandles,
                    encryptedCategoryHandles,
                    encryptedJurisdictionHandles,
                    referenceIds,
                    decrypted: false
                });
            }

            // Descending order (newest first)
            setRecords(loadedRecords.reverse());
        } catch (error) {
            console.error("Failed to fetch logs:", error);
            toast.error("Failed to fetch encrypted audit logs");
        } finally {
            setIsLoading(false);
        }
    }, [proxyAccount]);

    const decryptLedger = async () => {
        if (!proxyAccount || records.length === 0) return;
        
        const ownerWallet = wallets?.find((w) => w.walletClientType === "privy");
        let address = ownerWallet?.address;
        let provider: Eip1193Provider | null = null;

        if (ownerWallet) {
            provider = await ownerWallet.getEthereumProvider();
        }

        const ethereum = typeof window !== "undefined" ? (window as EthereumWindow).ethereum : undefined;
        if ((!address || !provider) && ethereum) {
            try {
                provider = ethereum;
                const accounts = await ethereum.request({ method: 'eth_accounts' });
                if (Array.isArray(accounts) && accounts.length > 0 && typeof accounts[0] === "string") {
                    address = accounts[0];
                }
            } catch (e) {
                console.error(e);
            }
        }

        if (!address) {
            toast.error("Please connect your wallet to decrypt");
            return;
        }

        setIsDecrypting(true);
        const loadingId = toast.loading("Requesting Zama decrypt authorization...");

        try {
            if (!provider) {
                throw new Error("Missing wallet provider for decrypt authorization.");
            }

            const signer = {
                signTypedData: async (typedData: unknown) => {
                    return provider.request({
                        method: "eth_signTypedData_v4",
                        params: [getAddress(address as string), JSON.stringify(typedData)],
                    }) as Promise<`0x${string}`>;
                },
            };

            const mappedRecords = await Promise.all(records.map(async (record) => {
                if (record.decrypted) return record;

                try {
                    const handles = [
                        ...record.encryptedAmountHandles,
                        ...record.encryptedCategoryHandles,
                        ...record.encryptedJurisdictionHandles,
                    ];
                    const decrypted = await userDecryptComplianceHandles({
                        handles,
                        contractAddress: REGISTRY_ADDRESS,
                        userAddress: getAddress(address as string),
                        signer,
                    });

                    const decCats: string[] = [];
                    const decJurs: string[] = [];
                    const decAmounts: string[] = [];
                    const decimals = record.token.toLowerCase() === MockUSDCAddress.toLowerCase() ? 6 : 18;

                    for (let i = 0; i < record.recipients.length; i++) {
                        const amount = decrypted[record.encryptedAmountHandles[i]];
                        const category = decrypted[record.encryptedCategoryHandles[i]];
                        const jurisdiction = decrypted[record.encryptedJurisdictionHandles[i]];
                        decAmounts.push(formatUnits(BigInt(amount as bigint), decimals));
                        decCats.push(CATEGORY_DISPLAY[Number(category)] || "Unknown");
                        decJurs.push(JURISDICTION_DISPLAY[Number(jurisdiction)] || "Unknown");
                    }

                    return {
                        ...record,
                        amounts: decAmounts,
                        categories: decCats,
                        jurisdictions: decJurs,
                        referenceIds: record.referenceIds,
                        decrypted: true
                    };
                } catch (e) {
                    console.error("Failed to decrypt record", record.recordIndex, e);
                    return record; // Keep it as undecrypted if decryption fails
                }
            }));

            setRecords(mappedRecords);
            toast.success("Ledger successfully decrypted with Zama.", { id: loadingId });

        } catch (error) {
            console.error("Decryption failed:", error);
            const err = error as Error;
            toast.error("Failed to decrypt: " + (err.message || "Unknown error"), { id: loadingId });
        } finally {
            setIsDecrypting(false);
        }
    };

    return {
        records,
        isLoading,
        isDecrypting,
        fetchLogs,
        decryptLedger
    };
}
