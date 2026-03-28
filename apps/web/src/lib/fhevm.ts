// lib/fhevm.ts — loaded client-side via Zama official CDN (relayer-sdk-js UMD)
// CDN: https://cdn.zama.org/relayer-sdk-js/0.3.0-8/relayer-sdk-js.umd.cjs
// Global: window.relayerSDK

let instance: any = null;
let initialized = false;

// Extend Window interface for the global relayerSDK object injected by layout.tsx
declare global {
  interface Window {
    relayerSDK: any;
  }
}

export async function getFhevmInstance() {
    if (instance) return instance;

    if (typeof window === "undefined" || !window.relayerSDK) {
        throw new Error("Zama relayer-sdk-js bundle not loaded. Check the <Script> tag in your layout.");
    }

    const { initSDK, createInstance, SepoliaConfig } = window.relayerSDK;

    // initSDK loads the WASM — only needs to run once
    if (!initialized) {
        await initSDK();
        initialized = true;
    }

    // SepoliaConfig already contains the correct KMS, ACL, gateway addresses
    // We spread it so we could override fields if needed in the future
    instance = await createInstance({
        ...SepoliaConfig,
        // Provider is not needed for input encryption (only for re-encryption/decryption)
    });

    return instance;
}
