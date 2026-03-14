import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error('ENCRYPTION_KEY is not defined in environment variables');
    }
    // Key must be exactly 32 bytes for AES-256
    const keyBuffer = Buffer.from(key, 'hex');
    if (keyBuffer.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }
    return keyBuffer;
}

/**
 * Encrypts a plain text string using AES-256-CBC.
 * Returns iv:encryptedData as a base64 string.
 */
export function encrypt(plainText: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plainText, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Prepend IV to encrypted data, separated by ":"
    return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an AES-256-CBC encrypted string.
 * Expects format: iv_hex:encryptedBase64
 */
export function decrypt(encryptedText: string): string {
    const key = getEncryptionKey();
    const [ivHex, encrypted] = encryptedText.split(':');

    if (!ivHex || !encrypted) {
        throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Encrypts an object by JSON-stringifying it first.
 */
export function encryptObject(obj: Record<string, string>): string {
    return encrypt(JSON.stringify(obj));
}

/**
 * Decrypts and parses a JSON-encrypted object.
 */
export function decryptObject(encryptedText: string): Record<string, string> {
    const decrypted = decrypt(encryptedText);
    return JSON.parse(decrypted);
}
