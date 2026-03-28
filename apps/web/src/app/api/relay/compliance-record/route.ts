import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, createPublicClient } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { ComplianceRegistryABI } from "@/lib/abi/ComplianceRegistryABI";

const REGISTRY_ADDRESS = "0x231Fcd3ae69f723B3AeFfe7B9B876Bb37C4Db4D6" as const;

export async function POST(req: NextRequest) {
  try {
    const {
      flowTxHash,
      proxyAccount,
      recipients,
      amounts,
      categoryHandles,
      categoryProofs,
      jurisdictionHandles,
      jurisdictionProofs,
    } = await req.json();

    if (!flowTxHash || !proxyAccount || !recipients || !amounts) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
    });

    console.log(`[relay] Recording transaction for ${proxyAccount} on Zama...`);

    const hash = await walletClient.writeContract({
      address: REGISTRY_ADDRESS,
      abi: ComplianceRegistryABI,
      functionName: "recordTransaction",
      args: [
        flowTxHash,
        proxyAccount,
        recipients,
        amounts.map((a: string | number) => BigInt(a)),
        categoryHandles,
        categoryProofs,
        jurisdictionHandles,
        jurisdictionProofs,
      ],
    });

    console.log(`[relay] Transaction recorded (tx: ${hash})`);

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
    console.error("[relay] Compliance recording failed:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
