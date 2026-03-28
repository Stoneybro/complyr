import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSmartAccountContext } from "@/lib/SmartAccountProvider";
import { parseEther, bytesToHex } from "viem";
import { BatchTransferParams } from "./types";
import { checkSufficientBalance } from "./utils";
import { getFhevmInstance } from "@/lib/fhevm";

const ZAMA_CONTRACT_ADDRESS = "0x722aD9117477Ad4Cb345F1419bd60FAFEACAfB00";

export function useBatchTransfer(availableEthBalance?: string) {
    const { getClient } = useSmartAccountContext();
    const { wallets } = useWallets();
    const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: BatchTransferParams) => {

            try {
                // Calculate total amount
                const totalAmount = params.amounts.reduce((sum, amount) => sum + parseFloat(amount), 0).toString();

                // Balance check
                if (availableEthBalance) {
                    const balanceCheck = checkSufficientBalance({
                        availableBalance: availableEthBalance,
                        requiredAmount: totalAmount,
                        token: "FLOW"
                    });

                    if (!balanceCheck.sufficient) {
                        throw new Error(balanceCheck.message);
                    }
                }

                const smartAccountClient = await getClient();
                if (!smartAccountClient) {
                    throw new Error("Smart Account Client is not initialized");
                }
                if (!owner?.address) {
                    throw new Error("No connected wallet found");
                }

                const amountsInWei = params.amounts.map((amount) => parseEther(amount));
                const proxyAddress = smartAccountClient.account!.address;

                // 1. Prepare standard transfer calls
                const calls = params.recipients.map((recipient, index) => ({
                    to: recipient,
                    data: "0x" as `0x${string}`,
                    value: amountsInWei[index],
                }));

                // 2. Client-side FHEVM Dynamic Import
                let encryptedData = null;
                const hasComplianceData = params.compliance && (params.compliance.categories?.length || params.compliance.jurisdictions?.length);

                if (hasComplianceData) {
                    const loadingId = toast.loading("Encrypting batch compliance data locally (fhEVM)...");
                    try {
                        const fhevm = await getFhevmInstance();
                        const categories = params.compliance?.categories || [];
                        const jurisdictions = params.compliance?.jurisdictions || [];

                        const handles: { categories: string[], jurisdictions: string[] } = { categories: [], jurisdictions: [] };
                        const proofs: { categories: string[], jurisdictions: string[] } = { categories: [], jurisdictions: [] };

                        for (let i = 0; i < params.recipients.length; i++) {
                            const catInput = fhevm.createEncryptedInput(ZAMA_CONTRACT_ADDRESS, owner.address);
                            catInput.add8(categories[i] !== undefined ? categories[i] : 0);
                            const catEnc = await catInput.encrypt();
                            handles.categories.push(bytesToHex(catEnc.handles[0]));
                            proofs.categories.push(bytesToHex(catEnc.inputProof));

                            const jurInput = fhevm.createEncryptedInput(ZAMA_CONTRACT_ADDRESS, owner.address);
                            jurInput.add8(jurisdictions[i] !== undefined ? jurisdictions[i] : 0);
                            const jurEnc = await jurInput.encrypt();
                            handles.jurisdictions.push(bytesToHex(jurEnc.handles[0]));
                            proofs.jurisdictions.push(bytesToHex(jurEnc.inputProof));
                        }
                        
                        encryptedData = { handles, proofs };
                        toast.dismiss(loadingId);
                    } catch (e) {
                        console.error(e);
                        toast.dismiss(loadingId);
                        throw new Error("Failed to encrypt compliance parameters. Check network connections.");
                    }
                }

                // 3. Send Base Flow Transaction
                const txLoading = toast.loading("Signing and sending batch Flow transfer...");
                let hash = await smartAccountClient.sendUserOperation({
                    account: smartAccountClient.account,
                    calls,
                });

                const receipt = await smartAccountClient.waitForUserOperationReceipt({ hash });
                toast.dismiss(txLoading);
                const txHash = receipt.receipt.transactionHash;

                // 4. Relay directly to Zama
                if (encryptedData) {
                    toast.loading("Submitting ciphertexts and Zero-Knowledge Proofs to Zama Sepolia...", { id: "relay-toast" });

                    try {
                        const relayRes = await fetch("/api/relay/compliance-record", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                flowTxHash: txHash,
                                proxyAccount: proxyAddress,
                                recipients: params.recipients,
                                amounts: amountsInWei.map(a => a.toString()),
                                categoryHandles: encryptedData.handles.categories,
                                categoryProofs: encryptedData.proofs.categories,
                                jurisdictionHandles: encryptedData.handles.jurisdictions,
                                jurisdictionProofs: encryptedData.proofs.jurisdictions,
                            }),
                        });

                        const relayData = await relayRes.json();
                        if (!relayData.success) {
                            console.warn("[relay] Compliance recording did not succeed:", relayData.error);
                            toast.error(
                                `Batch transfer to ${params.recipients.length} recipients succeeded, but Zama compliance failed.`,
                                { id: "relay-toast" }
                            );
                        } else {
                            toast.success(
                                `Batch transfer and compliance securely recorded for ${params.recipients.length} recipients!`,
                                { id: "relay-toast" }
                            );
                        }
                    } catch (relayErr) {
                        console.error("[relay] Relay API call failed:", relayErr);
                        toast.error(
                            "Transfer succeeded, but Zama relay endpoint failed.",
                            { id: "relay-toast" }
                        );
                    }
                } else {
                    toast.success(`Batch FLOW transfer completed! Sent to ${params.recipients.length} recipients.`);
                }

                return receipt;
            } catch (error) {
                console.error("Error sending batch FLOW transfer:", error);
                const errorMessage = error instanceof Error ? error.message : "Failed to send batch transfer";
                toast.error(errorMessage);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
        },
    });
}
