"use client";

import { useQueries } from "@tanstack/react-query";
import { createPublicClient, http } from "viem";
import { hashkeyTestnet } from "@/lib/chains";
import { HASHKEY_KYC_SBT } from "@/lib/CA";
import { KYC_SBT_ABI } from "@/lib/abi/EcosystemABIs";

export type KycStatus = {
    address: string;
    isVerified: boolean;
    level: number;
};

const publicClient = createPublicClient({
    chain: hashkeyTestnet,
    transport: http("https://testnet.hsk.xyz"),
});

async function fetchKycStatus(address: string): Promise<KycStatus> {
    try {
        const [isHuman, level] = await publicClient.readContract({
            address: HASHKEY_KYC_SBT as `0x${string}`,
            abi: KYC_SBT_ABI,
            functionName: "isHuman",
            args: [address as `0x${string}`],
        }) as [boolean, number];

        return { address, isVerified: isHuman, level: Number(level) };
    } catch (e) {
        return { address, isVerified: false, level: 0 };
    }
}

/**
 * Batch-fetch KYC status for multiple addresses with automatic deduplication.
 * Uses React Query's parallel execution with 5-minute stale time.
 */
export function useKycBatch(addresses: string[]) {
    // Deduplicate and filter valid addresses
    const uniqueAddresses = Array.from(new Set(
        addresses.filter(a => /^0x[a-fA-F0-9]{40}$/i.test(a))
    ));

    const queries = useQueries({
        queries: uniqueAddresses.map(address => ({
            queryKey: ["kyc-status", address.toLowerCase()],
            queryFn: () => fetchKycStatus(address),
            staleTime: 5 * 60 * 1000, // 5 minutes
        })),
    });

    const results = new Map<string, KycStatus>();
    uniqueAddresses.forEach((addr, i) => {
        const data = queries[i]?.data;
        if (data) {
            results.set(addr.toLowerCase(), data);
        }
    });

    const isLoading = queries.some(q => q.isLoading);

    return { results, isLoading };
}
