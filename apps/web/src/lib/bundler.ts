import { createPublicClient, http } from "viem";
import { hashkeyTestnet } from "./chains";

// Skandha bundler on Railway
export const bundlerUrl = `https://complyr-bundler-production-6ad5.up.railway.app/rpc`;
export const bundlerTransport = http(bundlerUrl);

// Public client for standard JSON-RPC calls
export const publicClient = createPublicClient({
  chain: hashkeyTestnet,
  transport: http("https://testnet.hsk.xyz"),
});
