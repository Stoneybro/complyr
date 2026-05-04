import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSmartAccountContext } from "@/lib/SmartAccountProvider";
import { parseUnits, encodeFunctionData } from "viem";
import { SingleTransferParams } from "./types";
import { assertRequiredCompliance, checkSufficientBalance, createComplianceRecordId } from "./utils";
import { SmartWalletABI } from "@/lib/abi/SmartWalletAbi";
import { MockUSDCAddress } from "@/lib/CA";
import { encryptComplianceInput } from "@/lib/fhe-compliance";

export function useSingleTransfer(availableBalance?: string) {
    const { getClient } = useSmartAccountContext();
    const { wallets } = useWallets();
    const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: SingleTransferParams) => {

            try {
                // Determine token decimals
                const isUsdc = params.tokenAddress?.toLowerCase() === MockUSDCAddress.toLowerCase();
                const decimals = isUsdc ? 6 : 18;

                // Balance check
                if (availableBalance) {
                    const balanceCheck = checkSufficientBalance({
                        availableBalance: availableBalance,
                        requiredAmount: params.amount,
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

                const amountInUnits = parseUnits(params.amount, decimals);
                const proxyAddress = smartAccountClient.account!.address;
                const statusUpdate = (s: string) => params.onStatusUpdate?.(s);
                assertRequiredCompliance(params.compliance, 1);

                // 1. Client-side Zama encryption
                statusUpdate("Encrypting...");
                const loadingId = toast.loading("Encrypting compliance fields...");
                let encryptedCompliance;
                try {
                    encryptedCompliance = await encryptComplianceInput({
                        callerAddress: proxyAddress,
                        amounts: [amountInUnits],
                        categories: [params.compliance?.categories?.[0] ?? 0],
                        jurisdictions: [params.compliance?.jurisdictions?.[0] ?? 0],
                        referenceIds: [params.compliance?.referenceIds?.[0] ?? ""],
                    });
                    toast.dismiss(loadingId);
                } catch (e) {
                    console.error(e);
                    toast.dismiss(loadingId);
                    statusUpdate("Error");
                    throw new Error("Failed to encrypt compliance parameters.");
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
                            functionName: "transferERC20WithCompliance",
                            args: [
                                recordId,
                                params.tokenAddress,
                                params.to,
                                amountInUnits,
                                complianceArg,
                            ],
                        })
                    });
                } else {
                    calls.push({
                        to: proxyAddress,
                        value: amountInUnits,
                        data: encodeFunctionData({
                            abi: SmartWalletABI,
                            functionName: "transferNativeWithCompliance",
                            args: [
                                recordId,
                                params.to,
                                amountInUnits,
                                complianceArg,
                            ],
                        }),
                    });
                }

                // 3. Send Ethereum Sepolia transaction
                statusUpdate("Signing...");
                const tokenSymbol = params.tokenAddress ? "USDC" : "ETH";
                const txLoading = toast.loading(`Transferring ${tokenSymbol}...`);
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
                    console.error("[single] UserOp reverted:", revertMsg, receipt);
                    throw new Error(`Transaction reverted: ${revertMsg}`);
                }

                statusUpdate("Complete");
                toast.success(`${tokenSymbol} transfer completed!`);

                return receipt;
            } catch (error) {
                console.error("Error sending transfer:", error);
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
