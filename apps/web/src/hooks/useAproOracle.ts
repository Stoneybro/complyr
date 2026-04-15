import { useQuery } from "@tanstack/react-query";
import { createPublicClient, http } from "viem";
import { hashkeyTestnet } from "@/lib/chains";
import { APRO_USDC_USD_ORACLE } from "@/lib/CA";
import { APRO_ORACLE_ABI } from "@/lib/abi/EcosystemABIs";

export function useAproOracle() {
    return useQuery({
        queryKey: ["apro-usdc-usd"],
        queryFn: async () => {
            const publicClient = createPublicClient({
                chain: hashkeyTestnet,
                transport: http("https://testnet.hsk.xyz"),
            });

            const data = await publicClient.readContract({
                address: APRO_USDC_USD_ORACLE as `0x${string}`,
                abi: APRO_ORACLE_ABI,
                functionName: "latestRoundData",
            });

            // Price is in 8 decimals for APRO USDC/USD
            const price = Number(data[1]) / 1e8;
            return price;
        },
        staleTime: 60 * 1000, // 1 minute
    });
}
