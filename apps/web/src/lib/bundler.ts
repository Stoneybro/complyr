import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { ENTRY_POINT_ADDRESS } from "./CA";

// Pimlico bundler on Sepolia
export const bundlerUrl = `https://api.pimlico.io/v2/11155111/rpc?apikey=${process.env.NEXT_PUBLIC_PIMLICO_API_KEY}&sponsorshipPolicyId=${process.env.NEXT_PUBLIC_PIMPLICO_SPONSOR_ID}`;
export const bundlerTransport = http(bundlerUrl);

// Pimlico Client (Bundler + Paymaster)
export const pimlicoClient = createPimlicoClient({
  transport: bundlerTransport,
  entryPoint: {
    address: ENTRY_POINT_ADDRESS as `0x${string}`,
    version: "0.7",
  },
});

// Public client for standard JSON-RPC calls
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});
