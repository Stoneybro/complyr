import { createInstance, FhevmInstance } from 'fhevmjs';
import { bytesToHex } from 'viem';

// --- Zama Sepolia Testnet Configuration ---
// These addresses correspond to the most recent Zama fhEVM Sepolia deploy.
// Please verify against Zama's official documentation if the Testnet undergoes a version upgrade.
const ZAMA_RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const GATEWAY_URL = "https://gateway.sepolia.zama.ai/";

// WARNING: If you are encountering encryption/decryption issues on Sepolia, 
// double check these core FHE addresses.
const KMS_CONTRACT_ADDRESS = "0x9D6891A6240D6130c54ae243d8A811eaacDE8A89"; // Replace if Sepolia uses another one for your coprocessor version
const ACL_CONTRACT_ADDRESS = "0xFee8407e2f5e3Ee68ad77cAE98c434e637f516e5"; // Replace if Sepolia uses another one

let instance: FhevmInstance | null = null;

async function setup() {
    if (!instance) {
        // initFhevm() was removed in fhevmjs v0.5.0+. createInstance natively handles WASM initialization.
        instance = await createInstance({ 
            networkUrl: ZAMA_RPC_URL,
            gatewayUrl: GATEWAY_URL,
            kmsContractAddress: KMS_CONTRACT_ADDRESS,
            aclContractAddress: ACL_CONTRACT_ADDRESS,
            chainId: 11155111
        });
    }
    return instance;
}

self.onmessage = async (e: MessageEvent) => {
    const { id, type, payload } = e.data;

    try {
        if (type === "INIT") {
            await setup();
            self.postMessage({ id, type: "INIT_SUCCESS" });
            return;
        }

        if (type === "ENCRYPT_BATCH") {
            const inst = await setup();
            const { contractAddress, userAddress, recipients, compliance } = payload;
            
            const categories: number[] = compliance?.categories || [];
            const jurisdictions: number[] = compliance?.jurisdictions || [];

            // Explicitly typed arrays to avoid TS "never[]" errors
            const handles: { categories: string[], jurisdictions: string[] } = { categories: [], jurisdictions: [] };
            const proofs: { categories: string[], jurisdictions: string[] } = { categories: [], jurisdictions: [] };

            for (let i = 0; i < recipients.length; i++) {
                // Category
                const catInput = inst.createEncryptedInput(contractAddress, userAddress);
                catInput.add8(categories[i] !== undefined ? categories[i] : 0);
                const catEnc = await catInput.encrypt();
                handles.categories.push(bytesToHex(catEnc.handles[0]));
                proofs.categories.push(bytesToHex(catEnc.inputProof));

                // Jurisdiction
                const jurInput = inst.createEncryptedInput(contractAddress, userAddress);
                jurInput.add8(jurisdictions[i] !== undefined ? jurisdictions[i] : 0);
                const jurEnc = await jurInput.encrypt();
                handles.jurisdictions.push(bytesToHex(jurEnc.handles[0]));
                proofs.jurisdictions.push(bytesToHex(jurEnc.inputProof));
            }

            self.postMessage({ id, type: "ENCRYPT_SUCCESS", payload: { handles, proofs } });
        }
    } catch (err: any) {
        console.error("Worker error:", err);
        self.postMessage({ id, type: "ERROR", error: err.message || String(err) });
    }
};
