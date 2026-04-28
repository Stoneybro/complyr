import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSmartAccountContext } from "@/lib/SmartAccountProvider";
import { parseUnits, encodeFunctionData, bytesToHex } from "viem";
import { BatchTransferParams } from "./types";
import { checkSufficientBalance } from "./utils";
import { getFhevmInstance } from "@/lib/fhevm";
import { SmartWalletABI } from "@/lib/abi/SmartWalletAbi";
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

                // 1. Setup calls array
                const calls: Array<{ to: `0x${string}`; value: bigint; data: `0x${string}` }> = [];

                if (params.tokenAddress && params.tokenAddress !== "0x0000000000000000000000000000000000000000") {
                    // Batch ERC-20 Transfers
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
                                args: [recipient as `0x${string}`, amountsInUnits[index]]
                            })
                        });
                    });
                } else {
                    // Batch Native ETH Transfers
                    params.recipients.forEach((recipient, index) => {
                        calls.push({
                            to: recipient as `0x${string}`,
                            data: "0x" as `0x${string}`,
                            value: amountsInUnits[index],
                        });
                    });
                }

                // 2. Client-side Zama FHE Encryption (Per-recipient)
                const hasComplianceData = params.compliance && (
                    params.compliance.categories?.length || 
                    params.compliance.jurisdictions?.length
                );

                if (hasComplianceData) {
                    statusUpdate("Encrypting...");
                    const loadingId = toast.loading(`Encrypting FHE metadata for ${params.recipients.length} recipients...`);
                    try {
                        const fhevm = await getFhevmInstance();
                        const catHandles: bigint[] = [];
                        const jurHandles: bigint[] = [];

                        for (let i = 0; i < params.recipients.length; i++) {
                            const catInput = fhevm.createEncryptedInput(ComplianceRegistryAddress, proxyAddress);
                            catInput.add8(params.compliance?.categories?.[i] !== undefined ? Number(params.compliance.categories[i]) : 0);
                            const catEnc = await catInput.encrypt();
                            catHandles.push(BigInt(bytesToHex(catEnc.handles[0])));

                            const jurInput = fhevm.createEncryptedInput(ComplianceRegistryAddress, proxyAddress);
                            jurInput.add8(params.compliance?.jurisdictions?.[i] !== undefined ? Number(params.compliance.jurisdictions[i]) : 0);
                            const jurEnc = await jurInput.encrypt();
                            jurHandles.push(BigInt(bytesToHex(jurEnc.handles[0])));
                        }

                        // Generate a unique 32-byte ID for this batch payment
                        const txHash = bytesToHex(window.crypto.getRandomValues(new Uint8Array(32)));

                        // Add recordCompliance call to the batch
                        calls.push({
                            to: proxyAddress,
                            value: 0n,
                            data: encodeFunctionData({
                                abi: SmartWalletABI,
                                functionName: "recordCompliance",
                                args: [
                                    txHash as `0x${string}`,
                                    params.recipients.map(r => r as `0x${string}`),
                                    amountsInUnits,
                                    catHandles,
                                    jurHandles
                                ]
                            })
                        });

                        toast.dismiss(loadingId);
                    } catch (e) {
                        console.error("FHE Batch Encryption Error:", e);
                        toast.dismiss(loadingId);
                        statusUpdate("Error");
                        throw new Error("Failed to encrypt batch compliance parameters with Zama FHE.");
                    }
                }

                // 3. Send Unified Batch Transaction
                statusUpdate("Signing...");
                const tokenSymbol = params.tokenAddress ? "USDC" : "ETH";
                const txLoading = toast.loading(`Sending ${tokenSymbol} batch (${params.recipients.length}) & FHE records...`);
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
                toast.success(`Batch ${tokenSymbol} transfer completed with FHE compliance!`);

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
