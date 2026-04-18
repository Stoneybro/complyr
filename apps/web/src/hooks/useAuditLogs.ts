import { useState, useCallback } from "react";
import { createPublicClient, http, formatUnits, getAddress } from "viem";
import { useWallets } from "@privy-io/react-auth";
import { ComplianceRegistryABI } from "@/lib/abi/ComplianceRegistryABI";
import { toast } from "sonner";
import { CATEGORY_DISPLAY, JURISDICTION_DISPLAY } from "@/lib/compliance-enums";
import { baseSepolia } from "viem/chains";
import { ComplianceRegistryAddress } from "@/lib/CA";
import { decryptMetadata, deriveAESKey, hexToBuffer } from "@/lib/encryption";

const REGISTRY_ADDRESS = ComplianceRegistryAddress as `0x${string}`;

export type AuditRecord = {
    recordIndex: number;
    txHash: string;
    timestamp: Date;
    recipients: string[];
    amounts: string[];
    encryptedPayload: string;
    decrypted: boolean;
    categories?: string[];
    jurisdictions?: string[];
    referenceIds?: string[];
};

export function useAuditLogs(proxyAccount?: string, isExternalAuditor: boolean = false) {
    const [records, setRecords] = useState<AuditRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDecrypting, setIsDecrypting] = useState(false);
    const { wallets } = useWallets();

    const fetchLogs = useCallback(async () => {
        if (!proxyAccount) return;
        setIsLoading(true);
        
        try {
            const publicClient = createPublicClient({
                chain: baseSepolia,
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
                const recipients = recordData[1] as string[];
                const amountsWei = recordData[2] as bigint[];
                const encryptedPayload = recordData[3] as string;
                const timestamp = Number(recordData[4]);

                // Mock USDC uses 6 decimals
                const amounts = amountsWei.map(a => formatUnits(a, 6));

                loadedRecords.push({
                    recordIndex: i,
                    txHash: txHash,
                    timestamp: new Date(timestamp * 1000),
                    recipients,
                    amounts,
                    encryptedPayload,
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
        
        const ownerWallet = !isExternalAuditor ? wallets?.find((w) => w.walletClientType === "privy") : null;
        let address = ownerWallet?.address;

        if (!address && typeof window !== "undefined" && (window as any).ethereum) {
            try {
                const provider = (window as any).ethereum;
                const accounts = await provider.request({ method: 'eth_accounts' });
                if (accounts && accounts.length > 0) {
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
        const loadingId = toast.loading("Decrypting ledger using local AES key...");

        try {
            let decryptionSeed = address;

            if (isExternalAuditor) {
                const publicClient = createPublicClient({
                    chain: baseSepolia,
                    transport: http(),
                });
                const masterEOA = await publicClient.readContract({
                    address: REGISTRY_ADDRESS,
                    abi: ComplianceRegistryABI,
                    functionName: "companyMasters",
                    args: [proxyAccount as `0x${string}`],
                });
                decryptionSeed = masterEOA as string;
            }

            if (!decryptionSeed) {
                throw new Error("Missing owner address to derive decryption key.");
            }

            const aesKey = await deriveAESKey(decryptionSeed);

            const mappedRecords = await Promise.all(records.map(async (record) => {
                if (record.decrypted) return record;

                try {
                    // Decrypt the payload
                    const buffer = hexToBuffer(record.encryptedPayload);
                    const plaintext = await decryptMetadata(buffer, aesKey);
                    
                    const parsed = JSON.parse(plaintext);
                    const payments = parsed.payments || [];
                    
                    const decCats: string[] = [];
                    const decJurs: string[] = [];
                    const decRefs: string[] = [];

                    // Map the results back based on order of recipients
                    for (let i = 0; i < record.recipients.length; i++) {
                        const p = payments[i] || {};
                        decCats.push(CATEGORY_DISPLAY[p.category] || "Unknown");
                        decJurs.push(JURISDICTION_DISPLAY[p.jurisdiction] || "Unknown");
                        decRefs.push(p.referenceId || "N/A");
                    }

                    return {
                        ...record,
                        categories: decCats,
                        jurisdictions: decJurs,
                        referenceIds: decRefs,
                        decrypted: true
                    };
                } catch (e) {
                    console.error("Failed to decrypt record", record.recordIndex, e);
                    return record; // Keep it as undecrypted if decryption fails
                }
            }));

            setRecords(mappedRecords);
            toast.success("Ledger successfully decrypted!", { id: loadingId });

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
