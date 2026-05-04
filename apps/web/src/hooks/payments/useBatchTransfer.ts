import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSmartAccountContext } from "@/lib/SmartAccountProvider";
import { parseUnits, encodeFunctionData } from "viem";
import { BatchTransferParams } from "./types";
import { assertRequiredCompliance, checkSufficientBalance, createComplianceRecordId } from "./utils";
import { SmartWalletABI } from "@/lib/abi/SmartWalletAbi";
import { MockUSDCAddress } from "@/lib/CA";
import { encryptComplianceInput } from "@/lib/fhe-compliance";

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
                        token: params.tokenAddress ? "USDC" : "ETH"
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
                assertRequiredCompliance(params.compliance, params.recipients.length);

                // 1. Client-side Zama encryption
                statusUpdate("Encrypting...");
                const loadingId = toast.loading("Encrypting batch compliance fields...");
                let encryptedCompliance;
                try {
                    encryptedCompliance = await encryptComplianceInput({
                        callerAddress: proxyAddress,
                        amounts: amountsInUnits,
                        categories: params.compliance?.categories,
                        jurisdictions: params.compliance?.jurisdictions,
                        referenceIds: params.compliance?.referenceIds,
                    });
                    toast.dismiss(loadingId);
                } catch (e) {
                    console.error(e);
                    toast.dismiss(loadingId);
                    statusUpdate("Error");
                    throw new Error("Failed to encrypt batch compliance parameters.");
                }

                // 2. Setup atomic compliant transfer call.
                const calls: Array<{ to: `0x${string}`; value: bigint; data: `0x${string}` }> = [];
                const recordId = createComplianceRecordId();
                const complianceArg = {
                    amountHandles: encryptedCompliance.amountHandles,
                    amountProofs: encryptedCompliance.amountProofs,
                    categoryHandles: encryptedCompliance.categoryHandles,
                    categoryProofs: encryptedCompliance.categoryProofs,
                    jurisdictionHandles: encryptedCompliance.jurisdictionHandles,
                    jurisdictionProofs: encryptedCompliance.jurisdictionProofs,
                    referenceIds: encryptedCompliance.referenceIds,
                };

                if (params.tokenAddress && params.tokenAddress !== "0x0000000000000000000000000000000000000000") {
                    calls.push({
                        to: proxyAddress,
                        value: 0n,
                        data: encodeFunctionData({
                            abi: SmartWalletABI,
                            functionName: "batchTransferERC20WithCompliance",
                            args: [
                                recordId,
                                params.tokenAddress,
                                params.recipients,
                                amountsInUnits,
                                complianceArg,
                            ],
                        })
                    });
                } else {
                    const totalNativeValue = amountsInUnits.reduce((sum, amount) => sum + amount, 0n);
                    calls.push({
                        to: proxyAddress,
                        value: totalNativeValue,
                        data: encodeFunctionData({
                            abi: SmartWalletABI,
                            functionName: "batchTransferNativeWithCompliance",
                            args: [
                                recordId,
                                params.recipients,
                                amountsInUnits,
                                complianceArg,
                            ],
                        }),
                    });
                }

                // 3. Send Ethereum Sepolia transaction
                statusUpdate("Signing...");
                const tokenSymbol = params.tokenAddress ? "USDC" : "ETH";
                const txLoading = toast.loading(`Transferring ${tokenSymbol} batch (${params.recipients.length})...`);
                const hash = await smartAccountClient.sendUserOperation({
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
