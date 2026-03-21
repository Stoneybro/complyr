import type { PrivyClientConfig } from "@privy-io/react-auth";
import { mantleSepoliaTestnet } from "viem/chains";

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
  },
  defaultChain: mantleSepoliaTestnet,
  supportedChains: [mantleSepoliaTestnet],
  loginMethods: ["email", "google", "github"],
  appearance: {
    accentColor: "#38CCCD",
    theme: "light",
    landingHeader: "Complyr",
    walletChainType: "ethereum-only",
    walletList: ["detected_wallets"],
  },
};
