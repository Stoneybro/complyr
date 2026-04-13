import { createSmartAccountClient } from "permissionless";
import { hashkeyTestnet } from "./chains";
import { bundlerTransport, publicClient } from "./bundler";
import { CustomSmartAccount } from "./customSmartAccount";
import { VerifyingPaymasterAddress } from "./CA";

export async function getSmartAccountClient(
  customSmartAccount: CustomSmartAccount
) {
  return createSmartAccountClient({
    account: customSmartAccount,
    chain: hashkeyTestnet,
    client: publicClient,
    bundlerTransport: bundlerTransport,
    userOperation: {
      estimateFeesPerGas: async () => {
        const fees = await publicClient.estimateFeesPerGas();
        return {
          maxFeePerGas: fees.maxFeePerGas ?? 1000000000n,
          maxPriorityFeePerGas: fees.maxPriorityFeePerGas ?? 1000000000n,
        };
      },
    },
    paymaster: {
      getPaymasterStubData: async () => {
        return {
          paymaster: VerifyingPaymasterAddress as `0x${string}`,
          paymasterVerificationGasLimit: 200000n,
          paymasterPostOpGasLimit: 200000n,
          paymasterData: "0x",
        };
      },
      getPaymasterData: async () => {
        return {
          paymaster: VerifyingPaymasterAddress as `0x${string}`,
          paymasterVerificationGasLimit: 200000n,
          paymasterPostOpGasLimit: 200000n,
          paymasterData: "0x",
        };
      },
    },
  });
}
