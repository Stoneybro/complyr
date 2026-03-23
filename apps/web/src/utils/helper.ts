import { readContract } from "@/lib/server";
import { formatUnits, formatEther } from "viem";
import { SmartWalletABI } from "@/lib/abi/SmartWalletAbi";
import { zeroAddress } from "viem";
import { getPublicClient } from "@/lib/client";

/**
 * Fetches wallet balances for native FLOW:
 * - availableBalance: spendable funds
 * - committedFunds: locked in scheduled payments
 */

export async function fetchWalletBalance(smartAccountAddress: `0x${string}`) {
  const publicClient = getPublicClient();

  // Get native FLOW balance directly from the chain
  const nativeBalance = await publicClient.getBalance({ address: smartAccountAddress });

  // Get committed funds for native token (zeroAddress represents native FLOW)
  const committedFunds = await readContract({
    address: smartAccountAddress,
    abi: SmartWalletABI,
    functionName: "sCommittedFunds",
    args: [zeroAddress],
  }) as bigint;

  // Available = total balance - committed
  const availableBalance = nativeBalance - committedFunds;

  return {
    availableFlowBalance: formatEther(availableBalance > 0n ? availableBalance : 0n),
    committedFlowBalance: formatEther(committedFunds),
    totalFlowBalance: formatEther(nativeBalance),
  };
}