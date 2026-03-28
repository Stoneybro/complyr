import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSmartAccountContext } from "@/lib/SmartAccountProvider";
import { parseEther } from "viem";
import { SingleTransferParams } from "./types";
import { checkSufficientBalance } from "./utils";
import { useZamaWorker } from "../useZamaWorker";

const ZAMA_CONTRACT_ADDRESS = "0x722aD9117477Ad4Cb345F1419bd60FAFEACAfB00";

export function useSingleTransfer(availableEthBalance?: string) {
    const { getClient } = useSmartAccountContext();
    const { wallets } = useWallets();
    const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");
    const queryClient = useQueryClient();
    const { encryptBatch } = useZamaWorker();

    return useMutation({
        mutationFn: async (params: SingleTransferParams) => {

            try {
                // Balance check
                if (availableEthBalance) {
                    const balanceCheck = checkSufficientBalance({
                        availableBalance: availableEthBalance,
                        requiredAmount: params.amount,
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

                const amountInWei = parseEther(params.amount);
                const proxyAddress = smartAccountClient.account!.address;

                // 1. Setup single call
                const calls = [
                    {
                        to: params.to,
                        data: "0x" as `0x${string}`,
                        value: amountInWei,
                    },
                ];

                // 2. Client-side FHEVM Web Worker Encryption
                let encryptedData = null;
                const hasComplianceData = params.compliance && (params.compliance.categories?.length || params.compliance.jurisdictions?.length);

                if (hasComplianceData) {
                    const loadingId = toast.loading("Encrypting compliance payload locally (fhEVM)...");
                    try {
                        encryptedData = await encryptBatch({
                            contractAddress: ZAMA_CONTRACT_ADDRESS,
                            userAddress: owner.address,
                            recipients: [params.to],
                            compliance: params.compliance,
                        });
                        toast.dismiss(loadingId);
                    } catch (e) {
                        toast.dismiss(loadingId);
                        throw new Error("Failed to encrypt compliance parameters. Wait for worker initialization.");
                    }
                }

                // 3. Send Base Flow Transaction
                const txLoading = toast.loading("Signing and sending standard Flow transfer...");
                let hash = await smartAccountClient.sendUserOperation({
                    account: smartAccountClient.account,
                    calls,
                });

                const receipt = await smartAccountClient.waitForUserOperationReceipt({ hash });
                toast.dismiss(txLoading);
                const txHash = receipt.receipt.transactionHash;

                // 4. Relay directly to Zama (Bypassing DVN Bridge since it's temporarily down)
                if (encryptedData) {
                    toast.loading("Submitting ciphertexts and Zero-Knowledge Proofs to Zama Sepolia...", { id: "relay-toast" });

                    try {
                        const relayRes = await fetch("/api/relay/compliance-record", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                flowTxHash: txHash,
                                proxyAccount: proxyAddress,
                                recipients: [params.to],
                                amounts: [amountInWei.toString()],
                                categoryHandles: encryptedData.handles.categories,
                                categoryProofs: encryptedData.proofs.categories,
                                jurisdictionHandles: encryptedData.handles.jurisdictions,
                                jurisdictionProofs: encryptedData.proofs.jurisdictions,
                            }),
                        });

                        const relayData = await relayRes.json();
                        if (!relayData.success) {
                            console.warn("[relay] Compliance recording did not succeed:", relayData.error);
                            toast.error("Transfer succeeded, but Zama compliance failed.", { id: "relay-toast" });
                        } else {
                            toast.success("Transfer and compliance securely recorded cross-chain!", { id: "relay-toast" });
                        }
                    } catch (relayErr) {
                        console.error("[relay] Relay API call failed:", relayErr);
                        toast.error("Transfer succeeded, but Zama relay endpoint failed.", { id: "relay-toast" });
                    }
                } else {
                    toast.success("FLOW transfer sent successfully!");
                }

                return receipt;
            } catch (error) {
                console.error("Error sending FLOW transfer:", error);
                const errorMessage = error instanceof Error ? error.message : "Failed to send transfer";
                toast.error(errorMessage);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
        },
    });
}
