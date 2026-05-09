import { createPublicClient, createWalletClient, http, custom } from "viem";
import { complyrChain } from "./chain";

const DEFAULT_SEPOLIA_RPC_URL =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";

// Public client: used for read-only blockchain interactions
export const getPublicClient = () =>
  createPublicClient({
    chain: complyrChain,
    transport: http(DEFAULT_SEPOLIA_RPC_URL),
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
    chain: complyrChain,
    transport: custom(eip1193),
  });
