import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSmartAccountContext } from "@/lib/SmartAccountProvider";
import { encodeFunctionData, parseUnits } from "viem";
import { IntentRegistryABI } from "@/lib/abi/IntentRegistryABI";
import { RegistryAddress, MockUSDCAddress } from "@/lib/CA";
import { RecurringPaymentParams } from "./types";
import { encryptComplianceInput } from "@/lib/fhe-compliance";
import { assertRequiredCompliance } from "./utils";

export function useRecurringPayment() {
    const { getClient } = useSmartAccountContext();
    const { wallets } = useWallets();
    const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: RecurringPaymentParams) => {

            try {
                // Determine token decimals
                const isUsdc = params.tokenAddress?.toLowerCase() === MockUSDCAddress.toLowerCase();
                const decimals = isUsdc ? 6 : 18;

                const smartAccountClient = await getClient();
                if (!smartAccountClient) {
                    throw new Error("Smart Account Client is not initialized");
                }
                if (!owner?.address) {
                    throw new Error("No connected wallet found");
                }

                const amountsInUnits = params.amounts.map((amount) => parseUnits(amount, decimals));
                const statusUpdate = (s: string) => params.onStatusUpdate?.(s);
                assertRequiredCompliance(params.compliance, params.recipients.length);

                // 1. Client-side Zama encryption of recurring compliance fields.
                statusUpdate("Encrypting...");
                const loadingId = toast.loading("Encrypting recurring compliance fields...");
                const encryptedCompliance = await (async () => {
                    try {
                        return await encryptComplianceInput({
                            callerAddress: RegistryAddress,
                            amounts: amountsInUnits,
                            categories: params.compliance?.categories,
                            jurisdictions: params.compliance?.jurisdictions,
                            referenceIds: params.compliance?.referenceIds,
                        });
                    } catch (e) {
                        console.error(e);
                        statusUpdate("Error");
                        throw new Error("Failed to encrypt compliance parameters.");
                    } finally {
                        toast.dismiss(loadingId);
                    }
                })();

                // 2. Prepare Intent Registry call 
                const tokenAddress = params.tokenAddress || "0x0000000000000000000000000000000000000000";

                const callData = encodeFunctionData({
                    abi: IntentRegistryABI,
                    functionName: "createIntent",
                    args: [
                        params.name,
                        tokenAddress as `0x${string}`, // new token argument
                        params.recipients,
                        amountsInUnits,
                        BigInt(params.duration),
                        BigInt(params.interval),
                        BigInt(params.transactionStartTime || (Math.floor(Date.now() / 1000) + 120)),
                        encryptedCompliance.amountHandles,
                        encryptedCompliance.amountProofs,
                        encryptedCompliance.categoryHandles,
                        encryptedCompliance.categoryProofs,
                        encryptedCompliance.jurisdictionHandles,
                        encryptedCompliance.jurisdictionProofs,
                        encryptedCompliance.referenceIds,
                    ],
                });

                // 3. Send createIntent via UserOp
                statusUpdate("Signing...");
                const txLoading = toast.loading("Indexing recurring payment...");
                const hash = await smartAccountClient.sendUserOperation({
                    account: smartAccountClient.account,
                    calls: [
                        {
                            to: RegistryAddress,
                            data: callData,
                            value: 0n,
                        },
                    ],
                    callGasLimit: 5_000_000n,
                    verificationGasLimit: 1_000_000n,
                    preVerificationGas: 200_000n,
                });

                statusUpdate("Confirming...");
                const receipt = await smartAccountClient.waitForUserOperationReceipt({
                    hash,
                });
                toast.dismiss(txLoading);

                // Guard: if the UserOp was included but the inner call reverted, stop here
                if (!receipt.success) {
                    const txHashFailed = receipt.receipt?.transactionHash;
                    const revertMsg = receipt.reason ?? (txHashFailed ? `Reverted on-chain. TxHash: ${txHashFailed}` : "createIntent call reverted on-chain");
                    console.error("[recurring] UserOp reverted:", revertMsg, receipt);
                    throw new Error(`Transaction reverted: ${revertMsg}`);
                }

                statusUpdate("Complete");
                toast.success("Recurring intent created and compliance recorded!");

                return receipt;
            } catch (error) {
                console.error("Error creating recurring payment intent:", error);
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
