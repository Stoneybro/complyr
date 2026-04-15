import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, createPublicClient } from "viem";
import { hashkeyTestnet } from "@/lib/chains";
import { privateKeyToAccount } from "viem/accounts";
import { HASHKEY_KYC_SBT } from "@/lib/CA";

// MockSBT ABI with setVerified
const MOCK_SBT_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "account", "type": "address" },
            { "internalType": "string", "name": "ensName", "type": "string" },
            { "internalType": "uint8", "name": "level", "type": "uint8" },
            { "internalType": "bool", "name": "status", "type": "bool" }
        ],
        "name": "setVerified",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const { targetWallet, level = 1 } = await req.json();

        if (!targetWallet || !targetWallet.startsWith("0x") || targetWallet.length !== 42) {
            return NextResponse.json({ error: "Invalid target wallet address" }, { status: 400 });
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
            chain: hashkeyTestnet,
            transport: http("https://testnet.hsk.xyz"),
        });

        const walletClient = createWalletClient({
            account,
            chain: hashkeyTestnet,
            transport: http("https://testnet.hsk.xyz"),
        });

        console.log(`[relay-kyc] Verifying identity for ${targetWallet} via MockSBT...`);

        const hash = await walletClient.writeContract({
            address: HASHKEY_KYC_SBT as `0x${string}`,
            abi: MOCK_SBT_ABI,
            functionName: "setVerified",
            args: [targetWallet as `0x${string}`, targetWallet, Number(level) as unknown as never, true],
        });

        console.log(`[relay-kyc] KYC verification transaction initiated (tx: ${hash})`);

        await publicClient.waitForTransactionReceipt({
            hash,
            timeout: 60_000,
        });

        return NextResponse.json({
            success: true,
            txHash: hash,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[relay-kyc] Verification failed:", message);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
