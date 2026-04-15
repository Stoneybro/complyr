import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPublicClient, createWalletClient, http, custom, parseEther } from "viem";
import { hashkeyTestnet } from "@/lib/chains";
import { HASHKEY_KYC_SBT } from "@/lib/CA";
import { KYC_SBT_ABI } from "@/lib/abi/EcosystemABIs";
import { toast } from "sonner";

export function useKyc(address?: string) {
    const queryClient = useQueryClient();

    const checkKyc = useQuery({
        queryKey: ["kyc-status", address],
        queryFn: async () => {
            if (!address) return null;
            const publicClient = createPublicClient({
                chain: hashkeyTestnet,
                transport: http("https://testnet.hsk.xyz"),
            });

            try {
                const [isHuman, level] = await publicClient.readContract({
                    address: HASHKEY_KYC_SBT as `0x${string}`,
                    abi: KYC_SBT_ABI,
                    functionName: "isHuman",
                    args: [address as `0x${string}`],
                }) as [boolean, number];

                const info = await publicClient.readContract({
                    address: HASHKEY_KYC_SBT as `0x${string}`,
                    abi: KYC_SBT_ABI,
                    functionName: "getKycInfo",
                    args: [address as `0x${string}`],
                }) as [string, number, number, bigint];

                return {
                    isVerified: isHuman,
                    level,
                    ensName: info[0],
                    status: info[2],
                    createTime: Number(info[3]),
                };
            } catch (e) {
                console.warn("KYC SBT not found or contract error", e);
                return { isVerified: false, level: 0, ensName: "", status: 0, createTime: 0 };
            }
        },
        enabled: !!address,
        staleTime: 5 * 60 * 1000,
    });

    const getHskBalance = useQuery({
        queryKey: ["hsk-balance", address],
        queryFn: async () => {
            if (!address) return 0n;
            const publicClient = createPublicClient({
                chain: hashkeyTestnet,
                transport: http("https://testnet.hsk.xyz"),
            });
            return await publicClient.getBalance({ address: address as `0x${string}` });
        },
        enabled: !!address,
    });

    const fundMutation = useMutation({
        mutationFn: async () => {
            if (!address) throw new Error("No address to fund");
            const res = await fetch("/api/relay/fund-wallet", {
                method: "POST",
                body: JSON.stringify({ targetWallet: address }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            return data;
        },
        onSuccess: () => {
            toast.success("Received testnet HSK from relayer!");
            queryClient.invalidateQueries({ queryKey: ["hsk-balance", address] });
        },
        onError: (e) => toast.error("Funding failed: " + e.message),
    });

    const requestKycMutation = useMutation({
        mutationFn: async (level: number = 1) => {
            if (!address) throw new Error("No address to verify");
            
            const res = await fetch("/api/relay/verify-address", {
                method: "POST",
                body: JSON.stringify({ targetWallet: address, level }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            return data;
        },
        onSuccess: () => {
            toast.success("Identity Verified! Your status has been updated on-chain.");
            queryClient.invalidateQueries({ queryKey: ["kyc-status", address] });
        },
        onError: (e) => toast.error("Verification failed: " + e.message),
    });

    return {
        ...checkKyc,
        balance: getHskBalance.data,
        isFunding: fundMutation.isPending,
        fund: fundMutation.mutateAsync,
        isRequesting: requestKycMutation.isPending,
        requestKyc: requestKycMutation.mutateAsync,
    };
}
