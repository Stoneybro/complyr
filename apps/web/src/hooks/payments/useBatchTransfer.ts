import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSmartAccountContext } from "@/lib/SmartAccountProvider";
import { parseUnits, encodeFunctionData } from "viem";
import { BatchTransferParams } from "./types";
import { checkSufficientBalance } from "./utils";
import { encryptMetadata, deriveAESKey, bufferToHex } from "@/lib/encryption";
import { SmartWalletABI } from "@/lib/abi/SmartWalletAbi";
import { ComplianceRegistryABI } from "@/lib/abi/ComplianceRegistryABI";
import { MockUSDCAddress, ComplianceRegistryAddress } from "@/lib/CA";

export function useBatchTransfer(availableBalance?: string) {
    const { getClient } = useSmartAccountContext();
    const { wallets } = useWallets();
    const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: BatchTransferParams) => {

            try {
                // Determine token decimals
                const isUsdc = params.tokenAddress?.toLowerCase() === MockUSDCAddress.toLowerCase();
                const decimals = isUsdc ? 6 : 18;

                // Calculate total amount
                const totalAmount = params.amounts.reduce((sum, amount) => sum + parseFloat(amount), 0).toString();

                // Balance check
                if (availableBalance) {
                    const balanceCheck = checkSufficientBalance({
                        availableBalance: availableBalance,
                        requiredAmount: totalAmount,
                        token: params.tokenAddress ? "USDC" : "HSK"
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

                const amountsInUnits = params.amounts.map((amount) => parseUnits(amount, decimals));
                const proxyAddress = smartAccountClient.account!.address;

                const statusUpdate = (s: string) => params.onStatusUpdate?.(s);

                // 1. Setup calls
                const calls: Array<{ to: `0x${string}`; value: bigint; data: `0x${string}` }> = [];

                if (params.tokenAddress && params.tokenAddress !== "0x0000000000000000000000000000000000000000") {
                    // Call transfer on the ERC20 token contract directly for each recipient
                    // NOTE: Optimization could be using a batch transfer contract, but individual calls in one UserOp works fine.
                    params.recipients.forEach((recipient, index) => {
                        calls.push({
                            to: params.tokenAddress as `0x${string}`,
                            value: 0n,
                            data: encodeFunctionData({
                                abi: [
                                    {
                                        "type": "function",
                                        "name": "transfer",
                                        "inputs": [
                                            { "name": "recipient", "type": "address" },
                                            { "name": "amount", "type": "uint256" }
                                        ],
                                        "outputs": [{ "name": "", "type": "bool" }],
                                        "stateMutability": "nonpayable"
                                    }
                                ],
                                functionName: "transfer",
                                args: [recipient, amountsInUnits[index]]
                            })
                        });
                    });
                } else {
                    // Native HSK transfers
                    params.recipients.forEach((recipient, index) => {
                        calls.push({
                            to: recipient as `0x${string}`,
                            data: "0x" as `0x${string}`,
                            value: amountsInUnits[index],
                        });
                    });
                }

                // 2. Client-side AES-256 Encryption
                const hasComplianceData = params.compliance && (
                    params.compliance.categories?.length || 
                    params.compliance.jurisdictions?.length || 
                    params.compliance.referenceIds?.length
                );

                if (hasComplianceData) {
                    statusUpdate("Encrypting...");
                    const loadingId = toast.loading("Encrypting batch compliance payload...");
                    try {
                        const payloadData = params.recipients.map((recipient, i) => ({
                            recipient,
                            category: params.compliance?.categories?.[i] ?? 0,
                            jurisdiction: params.compliance?.jurisdictions?.[i] ?? 0,
                            referenceId: params.compliance?.referenceIds?.[i] ?? ""
                        }));
                        
                        const jsonPayload = JSON.stringify({ payments: payloadData });
                        const aesKey = await deriveAESKey(owner.address);
                        const encryptedBytes = await encryptMetadata(jsonPayload, aesKey);
                        const encryptedPayloadHex = bufferToHex(encryptedBytes);

                        // Generate a unique 32-byte ID for this batch payment
                        const paymentIdBytes = window.crypto.getRandomValues(new Uint8Array(32));
                        const paymentId = bufferToHex(paymentIdBytes) as `0x${string}`;

                        // Call ComplianceRegistry directly
                        calls.push({
                            to: ComplianceRegistryAddress as `0x${string}`,
                            value: 0n,
                            data: encodeFunctionData({
                                abi: ComplianceRegistryABI,
                                functionName: "recordTransaction",
                                args: [paymentId, proxyAddress, params.recipients, amountsInUnits, encryptedPayloadHex]
                            })
                        });

                        toast.dismiss(loadingId);
                    } catch (e) {
                        console.error(e);
                        toast.dismiss(loadingId);
                        statusUpdate("Error");
                        throw new Error("Failed to encrypt batch compliance parameters.");
                    }
                }

                // 3. Send Base HashKey Transaction
                statusUpdate("Signing...");
                const tokenSymbol = params.tokenAddress ? "USDC" : "HSK";
                const txLoading = toast.loading(`Transferring ${tokenSymbol} batch (${params.recipients.length})...`);
                let hash = await smartAccountClient.sendUserOperation({
                    account: smartAccountClient.account,
                    calls,
                });

                statusUpdate("Confirming...");
                const receipt = await smartAccountClient.waitForUserOperationReceipt({ hash });
                toast.dismiss(txLoading);

                if (!receipt.success) {
                    const txHashFailed = receipt.receipt?.transactionHash;
                    const revertMsg = receipt.reason ?? (txHashFailed ? `Reverted on-chain. TxHash: ${txHashFailed}` : "UserOp reverted on-chain");
                    console.error("[batch] UserOp reverted:", revertMsg, receipt);
                    throw new Error(`Transaction reverted: ${revertMsg}`);
                }

                statusUpdate("Complete");
                toast.success(`Batch ${tokenSymbol} transfer completed!`);

                return receipt;
            } catch (error) {
                console.error("Error sending batch transfer:", error);
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
