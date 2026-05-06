import { createSmartAccountClient } from "permissionless";
import { bundlerTransport, publicClient, pimlicoClient } from "./bundler";
import { CustomSmartAccount } from "./customSmartAccount";
import { complyrChain } from "./chain";

export async function getSmartAccountClient(
  customSmartAccount: CustomSmartAccount
) {
  return createSmartAccountClient({
    account: customSmartAccount,
    chain: complyrChain,
    bundlerTransport: bundlerTransport,
    paymaster: pimlicoClient,
    userOperation: {
      estimateFeesPerGas: async () => {
        // Pimlico enforces a minimum UserOp gas price floor.
        // Use pimlico_getUserOperationGasPrice to avoid "Invalid fields set on User Operation".
        const pimlicoGasPrice = await pimlicoClient.getUserOperationGasPrice();
        const fees = await publicClient.estimateFeesPerGas();

        const slowMaxFee = pimlicoGasPrice.slow.maxFeePerGas;
        const slowPriority = pimlicoGasPrice.slow.maxPriorityFeePerGas;
        return {
          maxFeePerGas: fees.maxFeePerGas && fees.maxFeePerGas > slowMaxFee ? fees.maxFeePerGas : slowMaxFee,
          maxPriorityFeePerGas:
            fees.maxPriorityFeePerGas && fees.maxPriorityFeePerGas > slowPriority
              ? fees.maxPriorityFeePerGas
              : slowPriority,
        };
      },
    },
  });
}
