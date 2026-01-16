/**
 * Encryption utilities for export artifacts
 * Uses AES-256-GCM for authenticated encryption
 */

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * Derives encryption key from master key using PBKDF2
 * In production, use Cloud KMS or Secret Manager for key management
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');
}

/**
 * Encrypts data using AES-256-GCM
 * Returns base64-encoded encrypted data with salt, iv, and auth tag
 */
export function encrypt(data: Buffer | string, masterKey: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(masterKey, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
  const encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  // Combine: salt (64) + iv (16) + tag (16) + encrypted data
  const combined = Buffer.concat([salt, iv, tag, encrypted]);
  
  return combined.toString('base64');
}

/**
 * Decrypts data encrypted with encrypt()
 */
export function decrypt(encryptedData: string, masterKey: string): Buffer {
  const combined = Buffer.from(encryptedData, 'base64');
  
  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  
  const key = deriveKey(masterKey, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

/**
 * Gets encryption key from environment or throws error
 */
export function getEncryptionKey(): string {
  const key = process.env.EXPORT_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('EXPORT_ENCRYPTION_KEY environment variable not set');
  }
  
  if (key.length < 32) {
    throw new Error('EXPORT_ENCRYPTION_KEY must be at least 32 characters');
  }
  
  return key;
}
