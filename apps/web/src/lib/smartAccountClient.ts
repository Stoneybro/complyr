import { createSmartAccountClient } from "permissionless";
import { baseSepolia } from "viem/chains";
import { bundlerTransport, publicClient, pimlicoClient } from "./bundler";
import { CustomSmartAccount } from "./customSmartAccount";

export async function getSmartAccountClient(
  customSmartAccount: CustomSmartAccount
) {
  return createSmartAccountClient({
    account: customSmartAccount,
    chain: baseSepolia,
    bundlerTransport: bundlerTransport,
    paymaster: pimlicoClient,
    userOperation: {
      estimateFeesPerGas: async () => {
        const fees = await publicClient.estimateFeesPerGas();
        return {
          maxFeePerGas: fees.maxFeePerGas ?? 1000000000n,
          maxPriorityFeePerGas: fees.maxPriorityFeePerGas ?? 1000000000n,
        };
      },
    },
  });
}
