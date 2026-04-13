import type { PrivyClientConfig } from "@privy-io/react-auth";
import { sepolia } from "viem/chains";
import { hashkeyTestnet } from "./chains";

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: "off",
    },
  },
  defaultChain: hashkeyTestnet,
  supportedChains: [hashkeyTestnet, sepolia],
  loginMethods: ["email", "google", "github"],
  appearance: {
    accentColor: "#000000",
    theme: "light",
    logo: "/complyrlogo-dark.svg",
    walletChainType: "ethereum-only",
  },
};
