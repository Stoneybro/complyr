import { createSmartAccountClient } from "permissionless";
import { http } from "viem";
import { flowTestnet } from "viem/chains";
import { pimlicoBundlerUrl, publicClient } from "./pimlico";
import { CustomSmartAccount } from "./customSmartAccount";

// Build a Smart Account client around your custom account
export async function getSmartAccountClient(
  customSmartAccount: CustomSmartAccount
) {
  return createSmartAccountClient({
    account: customSmartAccount,
    chain: flowTestnet,
    client: publicClient,
    bundlerTransport: http(pimlicoBundlerUrl),
  });
}
