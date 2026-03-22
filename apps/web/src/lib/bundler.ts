import { createPublicClient, http } from "viem";
import { flowTestnet } from "viem/chains";

// Skandha bundler on Railway
export const bundlerUrl = `https://complyr-bundler-production.up.railway.app/rpc`;
export const bundlerTransport = http(bundlerUrl);

// Public client for standard JSON-RPC calls
export const publicClient = createPublicClient({
  chain: flowTestnet,
  transport: http("https://testnet.evm.nodes.onflow.org"),
});