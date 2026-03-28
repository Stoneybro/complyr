import { createWalletClient, http, createPublicClient } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { NextRequest, NextResponse } from "next/server";

const REGISTRY_ABI = [
  {
    name: "registerAccount",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "proxyAccount", type: "address" },
      { name: "masterEOA", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "companyMasters",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

// ComplianceRegistry on Zama Sepolia
const REGISTRY_ADDRESS = "0x231Fcd3ae69f723B3AeFfe7B9B876Bb37C4Db4D6" as const;

export async function POST(req: NextRequest) {
  try {
    const { proxyAccount, masterEOA } = await req.json();

    if (!proxyAccount || !masterEOA) {
      return NextResponse.json(
        { error: "proxyAccount and masterEOA are required" },
        { status: 400 }
      );
    }

    const rawKey = process.env.RELAY_PRIVATE_KEY;
    if (!rawKey) {
      return NextResponse.json(
        { error: "Relay not configured — RELAY_PRIVATE_KEY missing" },
        { status: 500 }
      );
    }

    const privateKey = rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`;
    const account = privateKeyToAccount(privateKey as `0x${string}`);

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
    });

    // Check if already registered — gracefully skip if so
    const existingMaster = await publicClient.readContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: "companyMasters",
      args: [proxyAccount as `0x${string}`],
    });

    if (
      existingMaster &&
      existingMaster !== "0x0000000000000000000000000000000000000000"
    ) {
      console.log(`[relay] Account ${proxyAccount} already registered — skipping`);
      return NextResponse.json({ success: true, alreadyRegistered: true });
    }

    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
    });

    const hash = await walletClient.writeContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: "registerAccount",
      args: [proxyAccount as `0x${string}`, masterEOA as `0x${string}`],
    });

    console.log(`[relay] Registered ${proxyAccount} → ${masterEOA} (tx: ${hash})`);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      timeout: 60_000,
    });

    return NextResponse.json({
      success: true,
      txHash: hash,
      blockNumber: receipt.blockNumber.toString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // Don't fail the UX over a relay error — log and return graceful response
    console.error("[relay] Registration failed:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
