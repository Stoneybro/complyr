import { defineChain } from "viem";

export const hashkeyTestnet = defineChain({
  id: 133,
  name: "HashKey Chain Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "HSK",
    symbol: "HSK",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.hsk.xyz"],
    },
    public: {
      http: ["https://testnet.hsk.xyz"],
    },
  },
  blockExplorers: {
    default: { name: "HashKey Explorer", url: "https://testnet.hsk.xyz" },
  },
  testnet: true,
});
