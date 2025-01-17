// js/crypto-utils.js
class CryptoUtils {
    static async generateSalt() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    static async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        const saltBuffer = encoder.encode(salt);

        // Get key material from password
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveBits']
        );

        // Use PBKDF2 to derive a key
        const rawKey = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: saltBuffer,
                iterations: 100000,
                hash: 'SHA-256',
            },
            keyMaterial,
            256  // exactly 256 bits
        );

        // Convert the raw key into a CryptoKey for AES-GCM
        return await crypto.subtle.importKey(
            'raw',
            rawKey,
            'AES-GCM',
            false,
            ['encrypt', 'decrypt']
        );
    }

    static async encryptData(data, cryptoKey) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));
        
        // Generate IV
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        // Encrypt
        const encryptedContent = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            cryptoKey,
            dataBuffer
        );

        // Convert to hex strings for storage
        return {
            encrypted: Array.from(new Uint8Array(encryptedContent))
                .map(b => b.toString(16).padStart(2, '0'))
                .join(''),
            iv: Array.from(iv)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('')
        };
    }

    static async decryptData(encryptedData, cryptoKey, iv) {
        // Convert hex strings back to arrays
        const encryptedArray = new Uint8Array(
            encryptedData.match(/.{2}/g).map(byte => parseInt(byte, 16))
        );
        const ivArray = new Uint8Array(
            iv.match(/.{2}/g).map(byte => parseInt(byte, 16))
        );

        // Decrypt
        const decryptedContent = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: ivArray },
            cryptoKey,
            encryptedArray
        );

        return JSON.parse(new TextDecoder().decode(decryptedContent));
    }
}