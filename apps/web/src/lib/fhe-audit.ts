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
    initSDK: (baseUrl?: string) => Promise<void>;
    createInstance: (config: Record<string, unknown>) => Promise<FhevmInstance>;
    SepoliaConfig: Record<string, unknown>;
};

let fhevmInstance: FhevmInstance | null = null;
let sdkInitialized = false;
const MAX_CATEGORY_ID = 10;
const MAX_JURISDICTION_ID = 13;

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

declare global {
    interface Window {
        relayerSDK: RelayerSdk;
    }
}

async function getFhevmInstance() {
    if (fhevmInstance) return fhevmInstance;
    if (typeof window === "undefined" || !window.relayerSDK) {
        throw new Error("Zama relayer-sdk-js bundle not loaded. Check the <Script> tag in your layout.");
    }

    const { initSDK, createInstance, SepoliaConfig } = window.relayerSDK;
    if (!sdkInitialized) {
        await initSDK(window.location.origin);
        sdkInitialized = true;
    }

    const network = (window as typeof window & { ethereum?: unknown }).ethereum ?? "https://1rpc.io/sepolia";
    fhevmInstance = await createInstance({
        ...SepoliaConfig,
        network,
    });

    return fhevmInstance;
}

function validateAuditInput(params: {
    amounts: bigint[];
    categories?: number[];
    jurisdictions?: number[];
    referenceIds?: string[];
}) {
    const { amounts, categories, jurisdictions, referenceIds } = params;

    if (amounts.length === 0) {
        throw new Error("At least one encrypted payment amount is required.");
    }
    if (categories && categories.length !== amounts.length) {
        throw new Error("Encrypted category count must match the recipient count.");
    }
    if (jurisdictions && jurisdictions.length !== amounts.length) {
        throw new Error("Encrypted jurisdiction count must match the recipient count.");
    }
    if (referenceIds && referenceIds.length !== amounts.length) {
        throw new Error("Encrypted reference id count must match the recipient count.");
    }

    categories?.forEach((category) => {
        if (!Number.isInteger(category) || category < 1 || category > MAX_CATEGORY_ID) {
            throw new Error(`Category ids must be integers between 1 and ${MAX_CATEGORY_ID}.`);
        }
    });
    jurisdictions?.forEach((jurisdiction) => {
        if (!Number.isInteger(jurisdiction) || jurisdiction < 1 || jurisdiction > MAX_JURISDICTION_ID) {
            throw new Error(`Jurisdiction ids must be integers between 1 and ${MAX_JURISDICTION_ID}.`);
        }
    });
    referenceIds?.forEach((referenceId) => {
        if (referenceId.trim().length === 0) {
            throw new Error("Reference ids must not be empty.");
        }
    });
}

export async function encryptAuditInput(params: {
    callerAddress: `0x${string}`;
    amounts: bigint[];
    categories?: number[];
    jurisdictions?: number[];
    referenceIds?: string[];
    registryAddress?: `0x${string}`;
}): Promise<EncryptedAuditInput> {
    validateAuditInput(params);
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

    const CHUNK_SIZE = 8; // Conservative chunk size (8 * 128 bits = 1024 bits, safe under 2048)
    const results: Record<`0x${string}`, bigint | number | string> = {};

    for (let i = 0; i < params.handles.length; i += CHUNK_SIZE) {
        const chunk = params.handles.slice(i, i + CHUNK_SIZE);
        const decryptedChunk = await fhevm.userDecrypt(
            chunk.map((handle) => ({ handle, contractAddress })),
            keypair.privateKey,
            keypair.publicKey,
            signature.replace(/^0x/, ""),
            [contractAddress],
            userAddress,
            Number(startTimestamp),
            Number(durationDays),
        );
        Object.assign(results, decryptedChunk);
    }

    return results;
}
