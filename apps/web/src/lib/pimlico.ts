
import { createPublicClient, http } from "viem";
import { flowTestnet } from "viem/chains";


// Bundler URL with API key
export const pimlicoBundlerUrl = `https://api.pimlico.io/v2/545/rpc?apikey=${process.env.NEXT_PUBLIC_PIMLICO_API_KEY}`;
export const pimlicoBundlerTransport = http(pimlicoBundlerUrl);

// Public client for standard JSON-RPC calls
export const publicClient = createPublicClient({
  chain: flowTestnet,
  transport: http(),
});
