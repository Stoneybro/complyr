import type { PrivyClientConfig } from "@privy-io/react-auth";
import { complyrChain } from "./chain";

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: "off",
    },
  },
  defaultChain: complyrChain,
  supportedChains: [complyrChain],
  loginMethods: ["email", "google", "github"],
  appearance: {
    accentColor: "#000000",
    theme: "light",
    logo: "/complyrlogo-dark.svg",
    walletChainType: "ethereum-only",
  },
};
