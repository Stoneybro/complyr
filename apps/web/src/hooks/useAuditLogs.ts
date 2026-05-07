import { useState, useCallback } from "react";
import { createPublicClient, http, formatUnits, getAddress } from "viem";
import { useWallets } from "@privy-io/react-auth";
import { AuditRegistryABI } from "@/lib/abi/AuditRegistryABI";
import { toast } from "sonner";
import { CATEGORY_DISPLAY, JURISDICTION_DISPLAY } from "@/lib/audit-enums";
import { AuditRegistryAddress, MockUSDCAddress } from "@/lib/CA";
import { complyrChain } from "@/lib/chain";
import { userDecryptAuditHandles } from "@/lib/fhe-audit";
import { safeJsonStringify } from "@/utils/helper";

const REGISTRY_ADDRESS = AuditRegistryAddress as `0x${string}`;

type Eip1193Provider = {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
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
    referenceIds: string[];
    decrypted: boolean;
    categories: string[];
    jurisdictions: string[];
};

export function useAuditLogs(walletAddress?: string) {
    const [records, setRecords] = useState<AuditRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDecrypting, setIsDecrypting] = useState(false);
    const { wallets } = useWallets();

    const fetchLogs = useCallback(async () => {
        if (!walletAddress) return;
        setIsLoading(true);
        try {
            const publicClient = createPublicClient({
                chain: complyrChain,
                transport: http(),
            });

            const count = Number(await publicClient.readContract({
                address: REGISTRY_ADDRESS,
                abi: AuditRegistryABI,
                functionName: "getRecordCount",
                args: [walletAddress as `0x${string}`],
            }));

            const fetched: AuditRecord[] = [];
            for (let i = 0; i < count; i++) {
                // Fetch record
                const recordData = await publicClient.readContract({
                    address: REGISTRY_ADDRESS,
                    abi: AuditRegistryABI,
                    functionName: "getRecord",
                    args: [walletAddress as `0x${string}`, BigInt(i)],
                }) as [`0x${string}`, `0x${string}`, `0x${string}`[], `0x${string}`[], `0x${string}`[], `0x${string}`[], string[], bigint];

                const txHash = recordData[0];
                const token = recordData[1] as string;
                const recipients = recordData[2] as string[];
                const encryptedAmountHandles = recordData[3] as `0x${string}`[];
                const encryptedCategoryHandles = recordData[4] as `0x${string}`[];
                const encryptedJurisdictionHandles = recordData[5] as `0x${string}`[];
                const referenceIds = recordData[6] as string[];
                const timestamp = Number(recordData[7]);

                fetched.push({
                    recordIndex: i,
                    txHash,
                    token,
                    timestamp: new Date(timestamp * 1000),
                    recipients,
                    amounts: recipients.map(() => "0"), // Placeholder
                    encryptedAmountHandles,
                    encryptedCategoryHandles,
                    encryptedJurisdictionHandles,
                    referenceIds,
                    decrypted: false,
                    categories: recipients.map(() => "Unknown"),
                    jurisdictions: recipients.map(() => "Unknown"),
                });
            }

            setRecords(fetched.reverse());
        } catch (error) {
            console.error("Failed to fetch audit logs:", error);
        } finally {
            setIsLoading(false);
        }
    }, [walletAddress]);

    const decryptLedger = async () => {
        if (records.length === 0) return;

        const privyWallet = wallets.find(w => w.walletClientType === 'privy');
        if (!privyWallet) {
            toast.error("Connect your wallet first");
            return;
        }

        const provider = await privyWallet.getEthereumProvider() as Eip1193Provider;
        const address = privyWallet.address;

        setIsDecrypting(true);
        const loadingId = toast.loading("Decrypting internal records...");

        try {
            if (!provider) {
                throw new Error("Missing wallet provider for decrypt authorization.");
            }

            const signer = {
                signTypedData: async (typedData: unknown) => {
                    return provider.request({
                        method: "eth_signTypedData_v4",
                        params: [getAddress(address as string), safeJsonStringify(typedData)],
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
                    const decrypted = await userDecryptAuditHandles({
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
            toast.success("Records successfully decrypted with Zama.", { id: loadingId });

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
