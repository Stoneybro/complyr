import { readContract } from "@/lib/server";
import { formatUnits, formatEther } from "viem";
import { SmartWalletABI } from "@/lib/abi/SmartWalletAbi";
import { zeroAddress } from "viem";
import { getPublicClient } from "@/lib/client";
import { MockUSDCAddress } from "@/lib/CA";

/**
 * Fetches wallet balances for native HSK and USDC:
 * - availableBalance: spendable funds
 * - committedFunds: locked in scheduled payments
 */

const ERC20_ABI = [
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [{ "name": "account", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  }
] as const;

export async function fetchWalletBalance(smartAccountAddress: `0x${string}`) {
  const publicClient = getPublicClient();

  // 1. Native HSK balance
  const nativeBalance = await publicClient.getBalance({ address: smartAccountAddress });

  const committedHsk = await readContract({
    address: smartAccountAddress,
    abi: SmartWalletABI,
    functionName: "sCommittedFunds",
    args: [zeroAddress]
  }) as bigint;

  // 2. Mock USDC balance (6 decimals)
  const usdcBalance = await publicClient.readContract({
    address: MockUSDCAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [smartAccountAddress]
  }) as bigint;

  const committedUsdc = await readContract({
    address: smartAccountAddress,
    abi: SmartWalletABI,
    functionName: "sCommittedFunds",
    args: [MockUSDCAddress as `0x${string}`]
  }) as bigint;

  // Available = total balance - committed
  const availableHsk = nativeBalance - committedHsk;
  const availableUsdc = usdcBalance - committedUsdc;

  return {
    availableHskBalance: formatEther(availableHsk > 0n ? availableHsk : 0n),
    committedHskBalance: formatEther(committedHsk),
    totalHskBalance: formatEther(nativeBalance),
    
    availableUsdcBalance: formatUnits(availableUsdc > 0n ? availableUsdc : 0n, 6),
    committedUsdcBalance: formatUnits(committedUsdc, 6),
    totalUsdcBalance: formatUnits(usdcBalance, 6),
  };
}
