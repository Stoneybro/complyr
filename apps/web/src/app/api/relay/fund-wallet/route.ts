import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, createPublicClient, parseEther } from "viem";
import { hashkeyTestnet } from "@/lib/chains";
import { privateKeyToAccount } from "viem/accounts";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const { targetWallet } = await req.json();

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

        // 0.005 HSK is sufficient to pay for basic signature and registry ops
        const fundAmount = parseEther("0.005");

        // Check the relayer's balance
        const relayerBalance = await publicClient.getBalance({ address: account.address });
        if (relayerBalance < fundAmount) {
            return NextResponse.json(
                { error: "Relayer has insufficient testnet HSK to sponsor." },
                { status: 500 }
            );
        }

        console.log(`[relay-fund] Funding connected embedded wallet ${targetWallet} with 0.005 HSK...`);

        const hash = await walletClient.sendTransaction({
            to: targetWallet as `0x${string}`,
            value: fundAmount,
        });

        console.log(`[relay-fund] Transfer initiated (tx: ${hash})`);

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
        console.error("[relay-fund] Funding failed:", message);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
