/**
 * Firebase Storage Adapter
 * 
 * Wrapper for Firebase Cloud Storage operations.
 * Handles file uploads, signed URL generation, and file management.
 * 
 * Per TRD-270: StorageAdapter
 * Per TRD-271: Uses admin.storage().bucket()
 * Per TRD-272: Generates V4 Signed URLs with a 15-minute expiration for file downloads
 * 
 * @module apps/functions/src/adapters/storage/StorageAdapter
 */

import * as admin from 'firebase-admin';

/**
 * Configuration for Storage Adapter
 */
export interface StorageAdapterConfig {
  bucketName?: string;
  defaultExpirationMinutes?: number;
}

/**
 * Options for generating signed URLs
 */
export interface SignedUrlOptions {
  expirationMinutes?: number;
  action?: 'read' | 'write' | 'delete';
}

/**
 * File metadata
 */
export interface FileMetadata {
  contentType?: string;
  metadata?: Record<string, string>;
  encrypted?: boolean;
}

/**
 * Storage Adapter class
 * 
 * Encapsulates Firebase Storage operations with a clean interface.
 */
export class StorageAdapter {
  private bucket: any; // Firebase Admin Storage Bucket
  private defaultExpirationMinutes: number;

  /**
   * Initialize Storage Adapter
   * 
   * @param config - Configuration object with optional bucket name and expiration
   */
  constructor(config: StorageAdapterConfig = {}) {
    const {
      bucketName = process.env.STORAGE_BUCKET || process.env.GCLOUD_STORAGE_BUCKET,
      defaultExpirationMinutes = 15, // Per TRD-272: 15-minute default
    } = config;

    if (!bucketName) {
      throw new Error('StorageAdapter: bucketName is required (set STORAGE_BUCKET or GCLOUD_STORAGE_BUCKET)');
    }

    this.bucket = admin.storage().bucket(bucketName);
    this.defaultExpirationMinutes = defaultExpirationMinutes;
  }

  /**
   * Upload a file to Cloud Storage
   * 
   * Per TRD-271: Uses admin.storage().bucket()
   * 
   * @param filePath - Path where the file should be stored
   * @param data - File data (Buffer or string)
   * @param metadata - Optional file metadata
   * @returns Promise resolving to the file path
   */
  async uploadFile(
    filePath: string,
    data: Buffer | string,
    metadata: FileMetadata = {}
  ): Promise<string> {
    const file = this.bucket.file(filePath);
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');

    await file.save(buffer, {
      metadata: {
        contentType: metadata.contentType || 'application/octet-stream',
        metadata: {
          ...metadata.metadata,
          ...(metadata.encrypted ? { encrypted: 'true' } : {}),
        },
      },
    });

    return filePath;
  }

  /**
   * Generate a signed URL for file download
   * 
   * Per TRD-272: Generates V4 Signed URLs with a 15-minute expiration
   * 
   * @param filePath - Path to the file
   * @param options - Optional configuration for the signed URL
   * @returns Promise resolving to the signed URL
   */
  async generateSignedUrl(
    filePath: string,
    options: SignedUrlOptions = {}
  ): Promise<string> {
    const {
      expirationMinutes = this.defaultExpirationMinutes,
      action = 'read',
    } = options;

    const file = this.bucket.file(filePath);

    // Per TRD-272: 15-minute expiration (default)
    const expirationMs = expirationMinutes * 60 * 1000;
    const expires = Date.now() + expirationMs;

    const [url] = await file.getSignedUrl({
      version: 'v4', // Per TRD-272: V4 Signed URLs
      action,
      expires,
    });

    return url;
  }

  /**
   * Delete a file from Cloud Storage
   * 
   * @param filePath - Path to the file to delete
   * @returns Promise that resolves when the file is deleted
   */
  async deleteFile(filePath: string): Promise<void> {
    const file = this.bucket.file(filePath);
    
    try {
      await file.delete();
    } catch (error: any) {
      // Ignore 404 errors (file already deleted)
      if (error.code !== 404) {
        throw error;
      }
    }
  }

  /**
   * Check if a file exists
   * 
   * @param filePath - Path to the file
   * @returns Promise resolving to true if file exists, false otherwise
   */
  async fileExists(filePath: string): Promise<boolean> {
    const file = this.bucket.file(filePath);
    
    try {
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file metadata
   * 
   * @param filePath - Path to the file
   * @returns Promise resolving to file metadata
   */
  async getFileMetadata(filePath: string): Promise<Record<string, any>> {
    const file = this.bucket.file(filePath);
    const [metadata] = await file.getMetadata();
    return metadata;
  }

  /**
   * List files with a given prefix
   * 
   * @param prefix - Prefix to filter files
   * @returns Promise resolving to array of file paths
   */
  async listFiles(prefix: string): Promise<string[]> {
    const [files] = await this.bucket.getFiles({ prefix });
    return files.map((file: { name: string }) => file.name);
  }

  /**
   * Delete all files with a given prefix
   * 
   * @param prefix - Prefix to filter files for deletion
   * @returns Promise resolving to the number of files deleted
   */
  async deleteFilesByPrefix(prefix: string): Promise<number> {
    const [files] = await this.bucket.getFiles({ prefix });

    if (files.length === 0) {
      return 0;
    }

    await Promise.all(
      files.map((file: { name: string; delete: () => Promise<void> }) =>
        file.delete().catch((error: any) => {
          if (error.code !== 404) {
            console.error(`Error deleting file ${file.name}:`, error);
          }
        })
      )
    );

    return files.length;
  }

  /**
   * Get the bucket name
   * 
   * @returns The bucket name
   */
  getBucketName(): string {
    return this.bucket.name;
  }
}

/**
 * Create a StorageAdapter instance from environment variables
 * 
 * Uses STORAGE_BUCKET or GCLOUD_STORAGE_BUCKET from environment.
 * 
 * @param overrides - Optional configuration overrides
 * @returns StorageAdapter instance
 */
export function createStorageAdapter(overrides?: Partial<StorageAdapterConfig>): StorageAdapter {
  return new StorageAdapter({
    bucketName: process.env.STORAGE_BUCKET || process.env.GCLOUD_STORAGE_BUCKET,
    defaultExpirationMinutes: 15, // Per TRD-272: 15-minute default
    ...overrides,
  });
}
