import { createPublicClient, createWalletClient, http, custom } from "viem";
import { hashkeyTestnet } from "./chains";

// Public client: used for read-only blockchain interactions
export const getPublicClient = () =>
  createPublicClient({
    chain: hashkeyTestnet,
    transport: http("https://testnet.hsk.xyz"),
  });

// Wallet client: used for signed transactions via a connected wallet
export const getWalletClient = async ({
  address,
  eip1193,
}: {
  address: `0x${string}`;
  eip1193: import("viem").EIP1193Provider;
}) =>
  createWalletClient({
    account: address,
    chain: hashkeyTestnet,
    transport: custom(eip1193),
  });
