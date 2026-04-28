import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSmartAccountContext } from "@/lib/SmartAccountProvider";
import { parseUnits, encodeFunctionData, bytesToHex } from "viem";
import { SingleTransferParams } from "./types";
import { checkSufficientBalance } from "./utils";
import { getFhevmInstance } from "@/lib/fhevm";
import { SmartWalletABI } from "@/lib/abi/SmartWalletAbi";
import { MockUSDCAddress, ComplianceRegistryAddress } from "@/lib/CA";

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

                // 1. Setup calls array for batching
                const calls: Array<{ to: `0x${string}`; value: bigint; data: `0x${string}` }> = [];

                if (params.tokenAddress && params.tokenAddress !== "0x0000000000000000000000000000000000000000") {
                    // ERC-20 Transfer
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
                            args: [params.to, amountInUnits]
                        })
                    });
                } else {
                    // Native ETH transfer
                    calls.push({
                        to: params.to,
                        data: "0x" as `0x${string}`,
                        value: amountInUnits,
                    });
                }

                // 2. Client-side Zama FHE Encryption
                const hasComplianceData = params.compliance && (
                    params.compliance.categories?.length || 
                    params.compliance.jurisdictions?.length
                );

                if (hasComplianceData) {
                    statusUpdate("Encrypting...");
                    const loadingId = toast.loading("Encrypting FHE payload...");
                    try {
                        const fhevm = await getFhevmInstance();
                        const categories = params.compliance?.categories || [];
                        const jurisdictions = params.compliance?.jurisdictions || [];

                        // We use the proxyAddress (Smart Account) as the authorized caller for the encrypted input
                        const catInput = fhevm.createEncryptedInput(ComplianceRegistryAddress, proxyAddress);
                        catInput.add8(categories[0] !== undefined ? Number(categories[0]) : 0);
                        const catEnc = await catInput.encrypt();

                        const jurInput = fhevm.createEncryptedInput(ComplianceRegistryAddress, proxyAddress);
                        jurInput.add8(jurisdictions[0] !== undefined ? Number(jurisdictions[0]) : 0);
                        const jurEnc = await jurInput.encrypt();

                        const categoryHandle = bytesToHex(catEnc.handles[0]);
                        const jurisdictionHandle = bytesToHex(jurEnc.handles[0]);

                        // Use a deterministic hash for record linkage
                        const txHash = bytesToHex(window.crypto.getRandomValues(new Uint8Array(32)));

                        // Add recordCompliance call to the batch
                        calls.push({
                            to: proxyAddress, // Calling our own smart wallet's recordCompliance
                            value: 0n,
                            data: encodeFunctionData({
                                abi: SmartWalletABI,
                                functionName: "recordCompliance",
                                args: [
                                    txHash as `0x${string}`,
                                    [params.to],
                                    [amountInUnits],
                                    [BigInt(categoryHandle)],
                                    [BigInt(jurisdictionHandle)]
                                ]
                            })
                        });

                        toast.dismiss(loadingId);
                    } catch (e) {
                        console.error("FHE Encryption Error:", e);
                        toast.dismiss(loadingId);
                        statusUpdate("Error");
                        throw new Error("Failed to encrypt compliance parameters with Zama FHE.");
                    }
                }

                // 3. Send Unified Batch Transaction (ERC-4337 UserOp via Pimlico)
                statusUpdate("Signing...");
                const tokenSymbol = params.tokenAddress ? "USDC" : "ETH";
                const txLoading = toast.loading(`Sending ${tokenSymbol} transfer & FHE record...`);
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
                    console.error("[single] UserOp reverted:", revertMsg, receipt);
                    throw new Error(`Transaction reverted: ${revertMsg}`);
                }

                statusUpdate("Complete");
                toast.success(`${tokenSymbol} transfer completed with FHE compliance!`);

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
