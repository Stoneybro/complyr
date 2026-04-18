import type { PrivyClientConfig } from "@privy-io/react-auth";
import { baseSepolia, sepolia } from "viem/chains";

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: "off",
    },
  },
  defaultChain: baseSepolia,
  supportedChains: [baseSepolia, sepolia],
  loginMethods: ["email", "google", "github"],
  appearance: {
    accentColor: "#000000",
    theme: "light",
    logo: "/complyrlogo-dark.svg",
    walletChainType: "ethereum-only",
  },
};
