import { getAddress, keccak256, toHex, encodeAbiParameters, parseAbiParameters } from "viem";

/**
 * HashKey Settlement Protocol (HSP) Simulation Library
 * 
 * This library implements the signing and mandate generation logic
 * as defined in the HSP technical documentation.
 */

export interface HspMandate {
    contents: {
        items: Array<{ name: string; amount: string; category: string }>;
        total: string;
        currency: string;
        recipient: string;
        expiry: number;
    };
    merchant_authorization: string; // ES256K JWT
}

/**
 * Simulates the generation of HSP HMAC-SHA256 headers
 */
export async function generateHspHeaders(
    method: string,
    path: string,
    body: any,
    appKey: string,
    secret: string
) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Canonicalize body
    const bodyString = JSON.stringify(body);
    const bodyHash = await sha256(bodyString);
    
    // Sign payload: METHOD\nPATH\nQUERY\nSHA256(body)\nTIMESTAMP\nNONCE
    const payload = `${method.toUpperCase()}\n${path}\n\n${bodyHash}\n${timestamp}\n${nonce}`;
    const signature = await hmacSha256(secret, payload);
    
    return {
        "X-App-Key": appKey,
        "X-Timestamp": timestamp,
        "X-Nonce": nonce,
        "X-Signature": signature
    };
}

/**
 * Generates a simulated Merchant Authorization JWT (ES256K)
 */
export async function generateMerchantJwt(cart: any, privateKey: string) {
    // In a real implementation, this would use a library like 'jose' or 'ethers' 
    // to sign a JWT with the ES256K (secp256k1) algorithm.
    // For simulation, we create the structure and sign the hash.
    
    const header = { alg: "ES256K", typ: "JWT" };
    const payload = {
        cart_hash: await sha256(JSON.stringify(cart)),
        iss: "complyr-merchant-service",
        exp: Math.floor(Date.now() / 1000) + 3600
    };
    
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    
    // Simulated signature
    const signature = "SIMULATED_SIG_" + keccak256(toHex(encodedHeader + "." + encodedPayload)).substring(2, 20);
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Helper: SHA256 using Web Crypto
async function sha256(message: string) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper: HMAC-SHA256 using Web Crypto
async function hmacSha256(key: string, message: string) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const msgData = encoder.encode(message);
    
    const cryptoKey = await crypto.subtle.importKey(
        'raw', 
        keyData, 
        { name: 'HMAC', hash: 'SHA-256' }, 
        false, 
        ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
