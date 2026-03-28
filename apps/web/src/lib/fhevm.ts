// lib/fhevm.ts — dynamically imported client-side only

const ZAMA_RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const GATEWAY_URL = "https://gateway.sepolia.zama.ai/";

// Sepolia KMS and ACL addresses
const KMS_CONTRACT_ADDRESS = "0x9D6891A6240D6130c54ae243d8A811eaacDE8A89"; 
const ACL_CONTRACT_ADDRESS = "0xFee8407e2f5e3Ee68ad77cAE98c434e637f516e5"; 

let instance: any = null;

export async function getFhevmInstance() {
    if (instance) return instance;

    // Next.js-idiomatic dynamic import: this ensures the WASM payload
    // never touches the server bundle (which stops the Vercel build freeze)
    const { createInstance } = await import("fhevmjs/web");

    instance = await createInstance({ 
        networkUrl: ZAMA_RPC_URL,
        gatewayUrl: GATEWAY_URL,
        kmsContractAddress: KMS_CONTRACT_ADDRESS,
        aclContractAddress: ACL_CONTRACT_ADDRESS,
        chainId: 11155111
    });

    return instance;
}
