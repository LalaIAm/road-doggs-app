/**
 * Cloud Storage utilities
 * Handles file uploads, encryption, and signed URL generation
 */

import * as admin from 'firebase-admin';
import { getEncryptionKey, encrypt } from './encryption';

const bucketName = process.env.STORAGE_BUCKET || process.env.GCLOUD_STORAGE_BUCKET;

/**
 * Gets the Cloud Storage bucket
 */
function getBucket() {
  if (!bucketName) {
    throw new Error('Storage bucket not configured');
  }
  return admin.storage().bucket(bucketName);
}

/**
 * Uploads encrypted data to Cloud Storage
 * Returns the file path
 */
export async function uploadEncryptedFile(
  data: Buffer | string,
  filePath: string,
  contentType: string = 'application/octet-stream'
): Promise<string> {
  const bucket = getBucket();
  const file = bucket.file(filePath);
  
  const encryptionKey = getEncryptionKey();
  const encryptedData = encrypt(data, encryptionKey);
  const encryptedBuffer = Buffer.from(encryptedData, 'base64');
  
  await file.save(encryptedBuffer, {
    metadata: {
      contentType,
      metadata: {
        encrypted: 'true',
        algorithm: 'aes-256-gcm',
      },
    },
  });
  
  return filePath;
}

/**
 * Generates a short-lived signed URL for downloading a file
 * Default TTL is 1 hour (3600 seconds)
 */
export async function generateSignedUrl(
  filePath: string,
  ttlSeconds: number = 3600
): Promise<string> {
  const bucket = getBucket();
  const file = bucket.file(filePath);
  
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + ttlSeconds * 1000,
  });
  
  return url;
}

/**
 * Deletes a file from Cloud Storage
 */
export async function deleteFile(filePath: string): Promise<void> {
  const bucket = getBucket();
  const file = bucket.file(filePath);
  await file.delete().catch((error) => {
    // Ignore 404 errors (file already deleted)
    if (error.code !== 404) {
      throw error;
    }
  });
}

/**
 * Lists all files with a given prefix
 */
export async function listFiles(prefix: string): Promise<string[]> {
  const bucket = getBucket();
  const [files] = await bucket.getFiles({ prefix });
  
  return files.map((file) => file.name);
}

/**
 * Deletes all files with a given prefix
 */
export async function deleteFilesByPrefix(prefix: string): Promise<number> {
  const bucket = getBucket();
  const [files] = await bucket.getFiles({ prefix });
  
  if (files.length === 0) {
    return 0;
  }
  
  await Promise.all(files.map((file) => file.delete().catch((error) => {
    if (error.code !== 404) {
      console.error(`Error deleting file ${file.name}:`, error);
    }
  })));
  
  return files.length;
}
