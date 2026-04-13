/**
 * lib/encryption.ts
 * Implements client-side AES-256-GCM encryption for compliance metadata.
 * These blobs are opaque to the HashKey Chain and can only be decrypted 
 * by the merchant or authorized auditors holding the AES key.
 */

/**
 * Encrypts a plaintext string (e.g., JSON metadata) using AES-256-GCM.
 * @param plaintext The string to encrypt.
 * @param secretKey A 32-byte (256-bit) CryptoKey.
 * @returns Concatenated bytes: [IV (12 bytes) | Ciphertext + Tag]
 */
export async function encryptMetadata(plaintext: string, secretKey: CryptoKey): Promise<Uint8Array> {
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
    
    const ciphertext = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        secretKey,
        enc.encode(plaintext)
    );

    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    
    return combined;
}

/**
 * Decrypts a ciphertext Uint8Array (IV + Ciphertext) using AES-256-GCM.
 * @param encryptedData The concatenated Uint8Array [IV | Ciphertext].
 * @param secretKey A 32-byte (256-bit) CryptoKey.
 * @returns The decrypted plaintext string.
 */
export async function decryptMetadata(encryptedData: Uint8Array, secretKey: CryptoKey): Promise<string> {
    if (encryptedData.length < 12) {
        throw new Error("Invalid encrypted data length");
    }

    const iv = encryptedData.slice(0, 12);
    const ciphertext = encryptedData.slice(12);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        secretKey,
        ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
}

/**
 * Derives a deterministic AES-256 key from a seed (e.g., a signature).
 * This ensures the merchant doesn't need to store the key in local storage.
 */
export async function deriveAESKey(seed: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(seed),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode("complyr-salt-v1"), // Static salt for determinism
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false, // Not extractable
        ["encrypt", "decrypt"]
    );
}

/**
 * Helper to convert Uint8Array to Hex string for contract submission.
 */
export function bufferToHex(buffer: Uint8Array): `0x${string}` {
    return `0x${Array.from(buffer)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")}`;
}

/**
 * Helper to convert Hex string from contract to Uint8Array for decryption.
 */
export function hexToBuffer(hex: string): Uint8Array {
    const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
    const bytes = new Uint8Array(Math.ceil(cleanHex.length / 2));
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}
