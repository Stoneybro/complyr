"use client";

import { toast } from "sonner";
import { useWallets } from "@privy-io/react-auth";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useSmartAccountContext } from "@/lib/SmartAccountProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BridgeStatus } from "@/components/ui/lz-status-tracker";

export function useDeployWallet() {
  const { getClient } = useSmartAccountContext();
  const { wallets } = useWallets();
  const owner = wallets?.find((w) => w.walletClientType === "privy");
  const queryClient = useQueryClient();
  const router = useRouter();
  
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>("idle");

  const mutation = useMutation({
    mutationFn: async () => {
      // defensive checks up front
      if (!owner?.address) {
        throw new Error("No connected wallet found. Please connect your wallet.");
      }

      // try to get client (short timeout to avoid hanging)
      let smartAccountClient;
      try {
        smartAccountClient = await getClient({ timeoutMs: 5000 });
      } catch (err) {
        // bubble a clear error so onError can react
        throw new Error("Failed to initialize smart account client. Try reconnecting or refresh the page.");
      }

      if (!smartAccountClient) {
        throw new Error("Smart Account Client is not initialized");
      }

      setBridgeStatus("deployment_pending");

      // perform a minimal zero-value call to trigger wallet deployment
      const hash = await smartAccountClient.sendUserOperation({
        account: smartAccountClient.account,
        calls: [
          {
            to: owner.address as `0x${string}`,
            data: "0x" as `0x${string}`,
            value: 0n,
          },
        ],
      });

      const result = await smartAccountClient.waitForUserOperationReceipt({ hash });
      if (!result) throw new Error("User operation receipt not received");

      setBridgeStatus("confirmed" as BridgeStatus);

      return smartAccountClient.account?.address;
    },

    onSuccess: (address) => {
      if (!address) {
        toast.error("Failed to get wallet address");
        return;
      }

      localStorage.setItem("wallet-deployed", address);

      queryClient.invalidateQueries({ queryKey: ["deploymentStatus", owner?.address] });
      toast.success("Account activated");
      
      // Short delay so users see the green checkmark before redirecting
      setTimeout(() => {
        router.push("/wallet");
      }, 1500);
    },

    onError: async (error: unknown) => {
      console.error("Deployment failed:", error);


      try {
        await getClient({ timeoutMs: 3000 });

        const retry = window.confirm("Activation failed. Retry now?");
        if (retry) {

          router.refresh();
          return;
        }
      } catch {

      }


      const refresh = window.confirm("Activation failed. Refresh page to try again?");
      if (refresh) {
        router.refresh();
      } else {
        toast.error("Activation failed");
      }
    },
  });

  return { ...mutation, bridgeStatus };
}
