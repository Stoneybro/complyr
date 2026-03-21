import { createSmartAccountClient } from "permissionless";
import { http } from "viem";
import { mantleSepoliaTestnet } from "viem/chains";
import { pimlicoClient, pimlicoBundlerUrl, publicClient } from "./pimlico";
import { CustomSmartAccount } from "./customSmartAccount";

// Build a Smart Account client around your custom account
export async function getSmartAccountClient(
  customSmartAccount: CustomSmartAccount
) {
  return createSmartAccountClient({
    account: customSmartAccount,
    chain: mantleSepoliaTestnet,
    client: publicClient,
    bundlerTransport: http(pimlicoBundlerUrl),
    paymaster: pimlicoClient,
    userOperation: {
      estimateFeesPerGas: async () => {
        const { fast } = await pimlicoClient.getUserOperationGasPrice();
        return {
          maxFeePerGas: BigInt(fast.maxFeePerGas),
          maxPriorityFeePerGas: BigInt(fast.maxPriorityFeePerGas),
        };
      },
    },
  });
}
