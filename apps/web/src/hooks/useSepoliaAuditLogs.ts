import { useState, useCallback } from "react";
import { createPublicClient, http, bytesToHex, formatEther, getAddress } from "viem";
import { sepolia } from "viem/chains";
import { useWallets } from "@privy-io/react-auth";
import { ComplianceRegistryABI } from "@/lib/abi/ComplianceRegistryABI";
import { getFhevmInstance } from "@/lib/fhevm";
import { toast } from "sonner";
import { CATEGORY_DISPLAY, JURISDICTION_DISPLAY } from "@/lib/compliance-enums";

const REGISTRY_ADDRESS = "0x231Fcd3ae69f723B3AeFfe7B9B876Bb37C4Db4D6" as const;

export type SepoliaAuditRecord = {
    recordIndex: number;
    flowTxHash: string;
    timestamp: Date;
    recipients: string[];
    amounts: string[];
    encryptedCategories: string[]; // Handles
    encryptedJurisdictions: string[]; // Handles
    // Populated after decryption
    decrypted: boolean;
    categories?: string[];
    jurisdictions?: string[];
};

export function useSepoliaAuditLogs(proxyAccount?: string, isExternalAuditor: boolean = false) {
    const [records, setRecords] = useState<SepoliaAuditRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDecrypting, setIsDecrypting] = useState(false);
    const { wallets } = useWallets();

    const fetchLogs = useCallback(async () => {
        if (!proxyAccount) return;
        setIsLoading(true);
        
        try {
            const publicClient = createPublicClient({
                chain: sepolia,
                transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
            });

            const countStr = await publicClient.readContract({
                address: REGISTRY_ADDRESS,
                abi: ComplianceRegistryABI,
                functionName: "getCompanyRecordCount",
                args: [proxyAccount as `0x${string}`],
            });

            const count = Number(countStr);
            const loadedRecords: SepoliaAuditRecord[] = [];

            for (let i = 0; i < count; i++) {
                const index = BigInt(i);
                
                // 1. Fetch plaintext metadata
                const metadata = await publicClient.readContract({
                    address: REGISTRY_ADDRESS,
                    abi: ComplianceRegistryABI,
                    functionName: "getRecordMetadata",
                    args: [proxyAccount as `0x${string}`, index],
                }) as [string, string[], bigint[], bigint];

                const flowTxHash = metadata[0];
                const recipients = metadata[1];
                const amountsWei = metadata[2];
                const timestamp = Number(metadata[3]);

                const amounts = amountsWei.map(a => formatEther(a));
                
                // 2. Fetch ciphertexts for each recipient
                const encCats: string[] = [];
                const encJurs: string[] = [];

                for (let j = 0; j < recipients.length; j++) {
                    const rIndex = BigInt(j);
                    const catHandle = await publicClient.readContract({
                        address: REGISTRY_ADDRESS,
                        abi: ComplianceRegistryABI,
                        functionName: "getEncryptedCategory",
                        args: [proxyAccount as `0x${string}`, index, rIndex]
                    });
                    const jurHandle = await publicClient.readContract({
                        address: REGISTRY_ADDRESS,
                        abi: ComplianceRegistryABI,
                        functionName: "getEncryptedJurisdiction",
                        args: [proxyAccount as `0x${string}`, index, rIndex]
                    });
                    
                    encCats.push(catHandle as string);
                    encJurs.push(jurHandle as string);
                }

                loadedRecords.push({
                    recordIndex: i,
                    flowTxHash,
                    timestamp: new Date(timestamp * 1000),
                    recipients,
                    amounts,
                    encryptedCategories: encCats,
                    encryptedJurisdictions: encJurs,
                    decrypted: false
                });
            }

            // Descending order (newest first)
            setRecords(loadedRecords.reverse());
        } catch (error) {
            console.error("Failed to fetch Sepolia logs:", error);
            toast.error("Failed to fetch encrypted audit logs");
        } finally {
            setIsLoading(false);
        }
    }, [proxyAccount]);

    const decryptLedger = async () => {
        if (!proxyAccount || records.length === 0) return;
        
        let provider: any;
        let address: string | undefined;

        const ownerWallet = !isExternalAuditor ? wallets?.find((w) => w.walletClientType === "privy") : null;
        if (ownerWallet) {
            provider = await ownerWallet.getEthereumProvider();
            address = ownerWallet.address;
        } else if (typeof window !== "undefined" && (window as any).ethereum) {
            provider = (window as any).ethereum;
            try {
                const accounts = await provider.request({ method: 'eth_accounts' });
                if (accounts && accounts.length > 0) {
                    address = accounts[0];
                }
            } catch (e) {
                console.error(e);
            }
        }

        if (!provider || !address) {
            toast.error("Please connect your external wallet to decrypt");
            return;
        }

        const checksummedAddress = getAddress(address);

        setIsDecrypting(true);
        const loadingId = toast.loading("Requesting KMS decryption signature...");

        try {
            
            // Note: Since we use Zama relayer-sdk, getFhevmInstance uses CDN
            const fhevm = await getFhevmInstance();
            
            // 1. Ask Zama to generate a fresh Keypair for this session
            const { publicKey, privateKey } = fhevm.generateKeypair();
            
            const startTimestamp = Math.floor(Date.now() / 1000) - 60; // now minus 1 min
            const durationDays = 1;

            // 2. Create the standard EIP-712 token for KMS
            const eip712 = fhevm.createEIP712(publicKey, [REGISTRY_ADDRESS], startTimestamp, durationDays);
            
            // 3. Ask the user to sign the token using their wallet (Metamask, etc)
            const signature = await provider.request({
                method: "eth_signTypedData_v4",
                params: [checksummedAddress, JSON.stringify(eip712)],
            }) as string;

            toast.loading("Batch decrypting records via KMS...", { id: loadingId });

            // 4. Batch all handles
            const handlesToDecrypt: { handle: string; contractAddress: string }[] = [];
            records.forEach(r => {
                if (!r.decrypted) {
                    r.encryptedCategories.forEach(handle => handlesToDecrypt.push({ handle, contractAddress: REGISTRY_ADDRESS }));
                    r.encryptedJurisdictions.forEach(handle => handlesToDecrypt.push({ handle, contractAddress: REGISTRY_ADDRESS }));
                }
            });

            // If no new records to decrypt, return
            if (handlesToDecrypt.length === 0) {
                toast.success("Ledger is already fully decrypted!", { id: loadingId });
                setIsDecrypting(false);
                return;
            }

            const decryptedResults = await fhevm.userDecrypt(
                handlesToDecrypt,
                privateKey,
                publicKey,
                signature.replace("0x", ""),
                [REGISTRY_ADDRESS],
                checksummedAddress,
                startTimestamp,
                durationDays
            );

            // 5. Map decrypted results back
            const mappedRecords = records.map((record) => {
                if (record.decrypted) return record;

                const decCats: string[] = [];
                const decJurs: string[] = [];

                for (let i = 0; i < record.recipients.length; i++) {
                    const catEnc = record.encryptedCategories[i];
                    const jurEnc = record.encryptedJurisdictions[i];
                    
                    const catVal = Number(decryptedResults[catEnc as `0x${string}`]);
                    const jurVal = Number(decryptedResults[jurEnc as `0x${string}`]);

                    decCats.push(CATEGORY_DISPLAY[catVal] || "Unknown");
                    decJurs.push(JURISDICTION_DISPLAY[jurVal] || "Unknown");
                }

                return {
                    ...record,
                    categories: decCats,
                    jurisdictions: decJurs,
                    decrypted: true
                };
            });

            setRecords(mappedRecords);
            toast.success("All records successfully decrypted!", { id: loadingId });

        } catch (error) {
            console.error("Decryption failed:", error);
            const err = error as Error;
            // Catch user rejection
            if (err.message?.includes("rejected")) {
                toast.error("Signature rejected. Decryption cancelled.", { id: loadingId });
            } else {
                toast.error("Failed to decrypt: " + (err.message || "Unknown error"), { id: loadingId });
            }
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
