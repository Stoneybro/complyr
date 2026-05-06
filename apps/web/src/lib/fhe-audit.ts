import { bytesToHex, getAddress } from "viem";

import { AuditRegistryAddress } from "@/lib/CA";

type FhevmInstance = {
    createEncryptedInput: (contractAddress: string, userAddress: string) => {
        add128: (value: bigint) => void;
        add8: (value: number) => void;
        encrypt: () => Promise<{ handles: Uint8Array[]; inputProof: Uint8Array }>;
    };
    generateKeypair: () => { publicKey: string; privateKey: string };
    createEIP712: (publicKey: string, contractAddresses: string[], startTimestamp: number, durationDays: number) => unknown;
    userDecrypt: (
        handles: { handle: `0x${string}`; contractAddress: string }[],
        privateKey: string,
        publicKey: string,
        signature: string,
        contractAddresses: string[],
        userAddress: string,
        startTimestamp: number,
        durationDays: number,
    ) => Promise<Record<`0x${string}`, bigint | number | string>>;
};

type RelayerSdk = {
    initSDK: () => Promise<void>;
    createInstance: (config: Record<string, unknown>) => Promise<FhevmInstance>;
    SepoliaConfig: Record<string, unknown>;
};

let fhevmInstance: FhevmInstance | null = null;
let sdkInitialized = false;

export type EncryptedAuditInput = {
    amountHandles: `0x${string}`[];
    amountProofs: `0x${string}`[];
    categoryHandles: `0x${string}`[];
    categoryProofs: `0x${string}`[];
    jurisdictionHandles: `0x${string}`[];
    jurisdictionProofs: `0x${string}`[];
    referenceIds: string[];
};

export type EncryptedThresholdInput = {
    thresholdHandle: `0x${string}`;
    thresholdProof: `0x${string}`;
};

async function getFhevmInstance() {
    if (fhevmInstance) return fhevmInstance;
    if (typeof window === "undefined") {
        throw new Error("Zama encryption is only available in the browser.");
    }

    const loadRelayerSdk = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<RelayerSdk>;
    const { initSDK, createInstance, SepoliaConfig } = await loadRelayerSdk("@zama-fhe/relayer-sdk/web");
    if (!sdkInitialized) {
        await initSDK();
        sdkInitialized = true;
    }

    const network = (window as typeof window & { ethereum?: unknown }).ethereum ?? "https://ethereum-sepolia-rpc.publicnode.com";
    fhevmInstance = await createInstance({
        ...SepoliaConfig,
        network,
    });

    return fhevmInstance;
}

export async function encryptAuditInput(params: {
    callerAddress: `0x${string}`;
    amounts: bigint[];
    categories?: number[];
    jurisdictions?: number[];
    referenceIds?: string[];
    registryAddress?: `0x${string}`;
}): Promise<EncryptedAuditInput> {
    const fhevm = await getFhevmInstance();
    const registryAddress = getAddress(params.registryAddress ?? AuditRegistryAddress);
    const callerAddress = getAddress(params.callerAddress);
    const input = fhevm.createEncryptedInput(registryAddress, callerAddress);

    for (let i = 0; i < params.amounts.length; i++) {
        input.add128(params.amounts[i]);
        input.add8(params.categories?.[i] ?? 0);
        input.add8(params.jurisdictions?.[i] ?? 0);
    }

    const encrypted = await input.encrypt();
    const handles = encrypted.handles.map((handle) => bytesToHex(handle));
    const proof = bytesToHex(encrypted.inputProof);
    const amountHandles: `0x${string}`[] = [];
    const categoryHandles: `0x${string}`[] = [];
    const jurisdictionHandles: `0x${string}`[] = [];

    for (let i = 0; i < params.amounts.length; i++) {
        amountHandles.push(handles[i * 3]);
        categoryHandles.push(handles[i * 3 + 1]);
        jurisdictionHandles.push(handles[i * 3 + 2]);
    }

    return {
        amountHandles,
        amountProofs: Array(params.amounts.length).fill(proof),
        categoryHandles,
        categoryProofs: Array(params.amounts.length).fill(proof),
        jurisdictionHandles,
        jurisdictionProofs: Array(params.amounts.length).fill(proof),
        referenceIds: Array.from({ length: params.amounts.length }, (_, i) => params.referenceIds?.[i] ?? ""),
    };
}

export async function encryptThresholdInput(params: {
    callerAddress: `0x${string}`;
    threshold: bigint;
    registryAddress?: `0x${string}`;
}): Promise<EncryptedThresholdInput> {
    const fhevm = await getFhevmInstance();
    const registryAddress = getAddress(params.registryAddress ?? AuditRegistryAddress);
    const callerAddress = getAddress(params.callerAddress);
    const input = fhevm.createEncryptedInput(registryAddress, callerAddress);

    input.add128(params.threshold);

    const encrypted = await input.encrypt();

    return {
        thresholdHandle: bytesToHex(encrypted.handles[0]),
        thresholdProof: bytesToHex(encrypted.inputProof),
    };
}

export async function userDecryptAuditHandles(params: {
    handles: `0x${string}`[];
    contractAddress?: `0x${string}`;
    userAddress: `0x${string}`;
    signer: {
        signTypedData: (typedData: unknown) => Promise<`0x${string}`>;
    };
}) {
    const fhevm = await getFhevmInstance();
    const contractAddress = getAddress(params.contractAddress ?? AuditRegistryAddress);
    const userAddress = getAddress(params.userAddress);
    const keypair = fhevm.generateKeypair();
    const startTimestamp = Math.floor(Date.now() / 1000).toString();
    const durationDays = "7";
    const typedData = fhevm.createEIP712(keypair.publicKey, [contractAddress], Number(startTimestamp), Number(durationDays));
    const signature = await params.signer.signTypedData(typedData);

    return fhevm.userDecrypt(
        params.handles.map((handle) => ({ handle, contractAddress })),
        keypair.privateKey,
        keypair.publicKey,
        signature.replace(/^0x/, ""),
        [contractAddress],
        userAddress,
        Number(startTimestamp),
        Number(durationDays),
    );
}
