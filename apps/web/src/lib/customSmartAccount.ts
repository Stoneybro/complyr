import { useCallback, useEffect, useState } from "react";
import { toSmartAccount, entryPoint07Abi } from "viem/account-abstraction";
import { MpSmartWalletABI } from "./abi/MpSmartWalletAbi";
import { recoverAddress, hashMessage, concat, pad, toHex, encodeFunctionData, decodeFunctionData } from "viem";
import { MpSmartWalletFactoryAddress } from "./CA";
import { MpSmartWalletFactoryABI } from "./abi/MpSmartWalletFactoryAbi";
import { useWallets, useSignMessage, useSignTypedData } from "@privy-io/react-auth";
import { publicClient } from "./pimlico";
import type { SmartAccount } from "viem/account-abstraction";

export type CustomSmartAccount = SmartAccount;

export default function CustomSmartAccount() {
  const [customSmartAccount, setCustomSmartAccount] = useState<CustomSmartAccount | null>(null);
  const { wallets } = useWallets();
  const owner = wallets?.find((wallet) => wallet.walletClientType === "privy");
  const { signMessage: privySignMessage } = useSignMessage();
  const { signTypedData: privySignTypedData } = useSignTypedData();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setCustomSmartAccount(null);
    setError(null);
    setIsLoading(false);
  }, [owner?.address]);

  const ENTRY_POINT_ADDR = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";
  const ENTRY_POINT_VERSION = "0.7";

  async function predictAddress(ownerAddress: `0x${string}`) {
    return publicClient.readContract({
      address: MpSmartWalletFactoryAddress,
      abi: MpSmartWalletFactoryABI,
      functionName: "getPredictedAddress",
      args: [ownerAddress],
    }) as Promise<`0x${string}`>;
  }

  const initCustomAccount = useCallback(async () => {
    setError(null);

    if (!owner || !owner.address) {
      const err = new Error("Owner address is undefined");
      setError(err);
      throw err;
    }

    if (customSmartAccount) return customSmartAccount;

    setIsLoading(true);
    try {
      const account = await toSmartAccount({
        client: publicClient,
        entryPoint: {
          address: ENTRY_POINT_ADDR,
          version: ENTRY_POINT_VERSION,
          abi: entryPoint07Abi,
        },

        async decodeCalls(data) {
          try {
            const decoded = decodeFunctionData({
              abi: MpSmartWalletABI,
              data: data as `0x${string}`,
            });

            if (decoded.functionName === "executeBatch" && decoded.args) {
              const batchCalls = decoded.args[0] as Array<{
                target: `0x${string}`;
                value: bigint;
                data: `0x${string}`;
              }>;
              return batchCalls.map((call) => ({
                to: call.target,
                value: call.value,
                data: call.data,
              }));
            } else if (decoded.functionName === "execute" && decoded.args) {
              const [target, value, callData] = decoded.args as [`0x${string}`, bigint, `0x${string}`];
              return [{ to: target, value, data: callData }];
            }
          } catch (e) {
            console.warn("Failed to decode calls:", e);
          }
          return [{ to: "0x0000000000000000000000000000000000000000", value: 0n, data }];
        },

        async encodeCalls(calls) {
          if (calls.length === 1) {
            const call = calls[0];
            return encodeFunctionData({
              abi: MpSmartWalletABI,
              functionName: "execute",
              args: [call.to, call.value || 0n, call.data || "0x"],
            });
          }

          const batchCalls = calls.map((call) => ({
            target: call.to,
            value: call.value || 0n,
            data: call.data || "0x",
          }));

          return encodeFunctionData({
            abi: MpSmartWalletABI,
            functionName: "executeBatch",
            args: [batchCalls],
          });
        },

        async getAddress() {
          return predictAddress(owner.address as `0x${string}`);
        },

        async getFactoryArgs() {
          return {
            factory: MpSmartWalletFactoryAddress,
            factoryData: encodeFunctionData({
              abi: MpSmartWalletFactoryABI,
              functionName: "createSmartAccount",
              args: [owner.address as `0x${string}`],
            }),
          };
        },

        async getNonce() {
          const sender = await predictAddress(owner.address as `0x${string}`);
          return publicClient.readContract({
            address: ENTRY_POINT_ADDR,
            abi: entryPoint07Abi,
            functionName: "getNonce",
            args: [sender, 0n],
          }) as Promise<bigint>;
        },

        async getStubSignature() {
          return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c" as `0x${string}`;
        },

        async signMessage({ message }) {
          const msgStr = typeof message === "string" ? message : (message.raw as `0x${string}`);
          const { signature } = await privySignMessage({ message: msgStr });
          return signature as `0x${string}`;
        },

        async signTypedData(typedData) {
          const { signature } = await privySignTypedData({
            types: typedData.types as Record<string, Array<{ name: string; type: string }>>,
            primaryType: typedData.primaryType as string,
            domain: typedData.domain as {
              name?: string;
              version?: string;
              chainId?: number;
              verifyingContract?: string;
              salt?: ArrayBuffer;
            },
            message: typedData.message as Record<string, unknown>,
          });
          return signature as `0x${string}`;
        },

        // FIXED: Proper UserOperation signing for v0.7
        async signUserOperation(parameters) {
          const userOperation = parameters;

          // Build initCode
          const initCode = userOperation.factory && userOperation.factoryData
            ? concat([userOperation.factory, userOperation.factoryData])
            : ("0x" as `0x${string}`);

          // Build paymasterAndData
          let paymasterAndData: `0x${string}` = "0x";
          if (userOperation.paymaster) {
            paymasterAndData = concat([
              userOperation.paymaster,
              pad(toHex(userOperation.paymasterVerificationGasLimit || 0n), { size: 16 }),
              pad(toHex(userOperation.paymasterPostOpGasLimit || 0n), { size: 16 }),
              userOperation.paymasterData || "0x"
            ]);
          }

          // Pack gas limits for v0.7
          const accountGasLimits = concat([
            pad(toHex(userOperation.verificationGasLimit || 0n), { size: 16 }),
            pad(toHex(userOperation.callGasLimit || 0n), { size: 16 })
          ]);

          const gasFees = concat([
            pad(toHex(userOperation.maxPriorityFeePerGas || 0n), { size: 16 }),
            pad(toHex(userOperation.maxFeePerGas || 0n), { size: 16 })
          ]);

          // Ensure sender is defined
          if (!userOperation.sender) {
            throw new Error("UserOperation sender is undefined");
          }
          // Create packed UserOp for hash computation
          const packedUserOp = {
            sender: userOperation.sender as `0x${string}`,
            nonce: userOperation.nonce,
            initCode,
            callData: userOperation.callData,
            accountGasLimits,
            preVerificationGas: userOperation.preVerificationGas || 0n,
            gasFees,
            paymasterAndData,
            signature: "0x" as `0x${string}`,
          };

          // Get userOpHash from EntryPoint
          const userOpHash = await publicClient.readContract({
            address: ENTRY_POINT_ADDR,
            abi: entryPoint07Abi,
            functionName: "getUserOpHash",
            args: [packedUserOp],
          }) as `0x${string}`;


          // Sign the raw hash (Privy applies EIP-191 automatically)
          const { signature } = await privySignMessage({ message: userOpHash });

          // Verify signature will work
          const ethSignedMessageHash = hashMessage({ raw: userOpHash });
          const recoveredAddress = await recoverAddress({
            hash: ethSignedMessageHash,
            signature: signature as `0x${string}`,
          });



          if (recoveredAddress.toLowerCase() !== owner.address.toLowerCase()) {
            throw new Error(`Signature verification failed: ${recoveredAddress} !== ${owner.address}`);
          }

          return signature as `0x${string}`;
        },
      });

      setCustomSmartAccount(account);
      return account;
    } catch (err) {
      console.error("custom account error", err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [owner, privySignTypedData, privySignMessage, customSmartAccount]);

  const resetCustomAccount = useCallback(() => {
    setCustomSmartAccount(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { initCustomAccount, isLoading, error, resetCustomAccount };
}