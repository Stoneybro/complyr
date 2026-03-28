import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSmartAccountContext } from "@/lib/SmartAccountProvider";
import { encodeFunctionData, parseEther } from "viem";
import { IntentRegistryABI } from "@/lib/abi/IntentRegistryABI";
import { RegistryAddress } from "@/lib/CA";
import { RecurringPaymentParams } from "./types";
import { checkSufficientBalance } from "./utils";
import { useZamaWorker } from "../useZamaWorker";

const ZAMA_CONTRACT_ADDRESS = "0x722aD9117477Ad4Cb345F1419bd60FAFEACAfB00";

export function useRecurringPayment(availableEthBalance?: string) {
    const { getClient } = useSmartAccountContext();
    const { wallets } = useWallets();
    const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");
    const queryClient = useQueryClient();
    const { encryptBatch } = useZamaWorker();

    return useMutation({
        mutationFn: async (params: RecurringPaymentParams) => {

            try {
                // Calculate total commitment
                const amountPerPayment = params.amounts.reduce((sum, amount) => sum + parseFloat(amount), 0);
                const totalPayments = Math.floor(params.duration / params.interval);
                const totalCommitment = (amountPerPayment * totalPayments).toString();

                const smartAccountClient = await getClient();
                if (!smartAccountClient) {
                    throw new Error("Smart Account Client is not initialized");
                }
                if (!owner?.address) {
                    throw new Error("No connected wallet found");
                }

                const amountsInWei = params.amounts.map((amount) => parseEther(amount));
                const proxyAddress = smartAccountClient.account!.address;

                // 1. Client-side FHEVM Web Worker Encryption
                let encryptedData = null;
                const hasComplianceData = params.compliance && (params.compliance.categories?.length || params.compliance.jurisdictions?.length);

                if (hasComplianceData) {
                    const loadingId = toast.loading("Encrypting recurring compliance rules locally (fhEVM)...");
                    try {
                        encryptedData = await encryptBatch({
                            contractAddress: ZAMA_CONTRACT_ADDRESS,
                            userAddress: owner.address,
                            recipients: params.recipients,
                            compliance: params.compliance,
                        });
                        toast.dismiss(loadingId);
                    } catch (e) {
                        toast.dismiss(loadingId);
                        throw new Error("Failed to encrypt compliance parameters. Wait for worker initialization.");
                    }
                }

                // If no compliance data, fallback to dummy arrays
                const len = params.recipients.length;
                const categoryHandles = encryptedData ? encryptedData.handles.categories : Array(len).fill("0x0000000000000000000000000000000000000000000000000000000000000000");
                const categoryProofs = encryptedData ? encryptedData.proofs.categories : Array(len).fill("0x");
                const jurisdictionHandles = encryptedData ? encryptedData.handles.jurisdictions : Array(len).fill("0x0000000000000000000000000000000000000000000000000000000000000000");
                const jurisdictionProofs = encryptedData ? encryptedData.proofs.jurisdictions : Array(len).fill("0x");

                // 2. Prepare Intent Registry call 
                const callData = encodeFunctionData({
                    abi: IntentRegistryABI,
                    functionName: "createIntent",
                    args: [
                        params.name,
                        params.recipients,
                        amountsInWei,
                        BigInt(params.duration),
                        BigInt(params.interval),
                        BigInt(params.transactionStartTime),
                        categoryHandles,
                        categoryProofs,
                        jurisdictionHandles,
                        jurisdictionProofs
                    ],
                });

                // 3. Send Base Flow Transaction
                const txLoading = toast.loading("Signing and indexing recurring payment intent...");
                const hash = await smartAccountClient.sendUserOperation({
                    account: smartAccountClient.account,
                    calls: [
                        {
                            to: RegistryAddress,
                            data: callData,
                            value: 0n,
                        },
                    ],
                });

                const receipt = await smartAccountClient.waitForUserOperationReceipt({
                    hash,
                });
                toast.dismiss(txLoading);
                const txHash = receipt.receipt.transactionHash;

                // 4. Relay directly to Zama
                if (encryptedData) {
                    toast.loading("Submitting ciphertexts to Zama Sepolia...", { id: "relay-toast" });

                    try {
                        const relayRes = await fetch("/api/relay/compliance-record", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                flowTxHash: txHash,
                                proxyAccount: proxyAddress,
                                recipients: params.recipients,
                                amounts: amountsInWei.map(a => a.toString()),
                                categoryHandles: categoryHandles,
                                categoryProofs: categoryProofs,
                                jurisdictionHandles: jurisdictionHandles,
                                jurisdictionProofs: jurisdictionProofs,
                            }),
                        });

                        const relayData = await relayRes.json();
                        if (!relayData.success) {
                            console.warn("[relay] Compliance recording did not succeed:", relayData.error);
                            toast.error("Recurring intent created, but Zama compliance failed.", { id: "relay-toast" });
                        } else {
                            toast.success("Recurring payment intent and compliance securely anchored cross-chain!", { id: "relay-toast" });
                        }
                    } catch (relayErr) {
                        console.error("[relay] Relay API call failed:", relayErr);
                        toast.error("Recurring intent created, but Zama relay endpoint failed.", { id: "relay-toast" });
                    }
                } else {
                    toast.success("Recurring payment intent created successfully!");
                }

                return receipt;
            } catch (error) {
                console.error("Error creating recurring FLOW payment intent:", error);
                const errorMessage = error instanceof Error ? error.message : "Failed to create recurring payment intent";
                toast.error(errorMessage);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
        },
    });
}
