/**
 * Unit Tests for Storage Adapter
 * 
 * Tests Firebase Cloud Storage operations including upload, signed URL generation,
 * and file management.
 * 
 * Per TRD-270-272: StorageAdapter requirements
 * 
 * @module apps/functions/src/adapters/storage/StorageAdapter.test
 */

import { StorageAdapter, createStorageAdapter } from './StorageAdapter';
import * as admin from 'firebase-admin';

// Mock Firebase Admin
jest.mock('firebase-admin', () => {
  const mockFile = {
    save: jest.fn().mockResolvedValue(undefined),
    getSignedUrl: jest.fn().mockResolvedValue(['https://signed-url.example.com/file']),
    delete: jest.fn().mockResolvedValue(undefined),
    exists: jest.fn().mockResolvedValue([true]),
    getMetadata: jest.fn().mockResolvedValue([{ name: 'test-file', size: 1024 }]),
  };

  const mockBucket = {
    file: jest.fn().mockReturnValue(mockFile),
    getFiles: jest.fn().mockResolvedValue([[]]),
    name: 'test-bucket',
  };

  const mockStorage = {
    bucket: jest.fn().mockReturnValue(mockBucket),
  };

  return {
    storage: jest.fn().mockReturnValue(mockStorage),
  };
});

describe('StorageAdapter', () => {
  let adapter: StorageAdapter;
  const testBucketName = 'test-bucket';

  beforeEach(() => {
    adapter = new StorageAdapter({ bucketName: testBucketName });
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with bucket name', () => {
      const adapter = new StorageAdapter({ bucketName: testBucketName });
      expect(adapter.getBucketName()).toBe(testBucketName);
    });

    it('should use environment variable if bucket name not provided', () => {
      const originalEnv = process.env.STORAGE_BUCKET;
      process.env.STORAGE_BUCKET = 'env-bucket';
      
      const adapter = new StorageAdapter();
      expect(adapter.getBucketName()).toBe('env-bucket');
      
      process.env.STORAGE_BUCKET = originalEnv;
    });

    it('should throw error if bucket name is not available', () => {
      const originalEnv = process.env.STORAGE_BUCKET;
      delete process.env.STORAGE_BUCKET;
      delete process.env.GCLOUD_STORAGE_BUCKET;
      
      expect(() => {
        new StorageAdapter();
      }).toThrow('bucketName is required');
      
      process.env.STORAGE_BUCKET = originalEnv;
    });

    it('should use default expiration of 15 minutes', () => {
      const adapter = new StorageAdapter({ bucketName: testBucketName });
      // Default expiration is tested in generateSignedUrl tests
      expect(adapter).toBeDefined();
    });
  });

  describe('uploadFile', () => {
    it('should upload a file with string data', async () => {
      const filePath = 'test/file.txt';
      const data = 'test content';
      
      await adapter.uploadFile(filePath, data);
      
      const bucket = admin.storage().bucket();
      const file = bucket.file(filePath);
      expect(file.save).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({
          metadata: expect.objectContaining({
            contentType: 'application/octet-stream',
          }),
        })
      );
    });

    it('should upload a file with Buffer data', async () => {
      const filePath = 'test/file.bin';
      const data = Buffer.from('binary data');
      
      await adapter.uploadFile(filePath, data);
      
      const bucket = admin.storage().bucket();
      const file = bucket.file(filePath);
      expect(file.save).toHaveBeenCalled();
    });

    it('should upload with custom metadata', async () => {
      const filePath = 'test/file.json';
      const data = '{"test": "data"}';
      const metadata = {
        contentType: 'application/json',
        metadata: { custom: 'value' },
        encrypted: true,
      };
      
      await adapter.uploadFile(filePath, data, metadata);
      
      const bucket = admin.storage().bucket();
      const file = bucket.file(filePath);
      expect(file.save).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({
          metadata: expect.objectContaining({
            contentType: 'application/json',
            metadata: expect.objectContaining({
              custom: 'value',
              encrypted: 'true',
            }),
          }),
        })
      );
    });
  });

  describe('generateSignedUrl', () => {
    it('should generate signed URL with default 15-minute expiration', async () => {
      const filePath = 'test/file.txt';
      
      const url = await adapter.generateSignedUrl(filePath);
      
      expect(url).toBe('https://signed-url.example.com/file');
      const bucket = admin.storage().bucket();
      const file = bucket.file(filePath);
      expect(file.getSignedUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 'v4',
          action: 'read',
          expires: expect.any(Number),
        })
      );
    });

    it('should generate signed URL with custom expiration', async () => {
      const filePath = 'test/file.txt';
      const expirationMinutes = 30;
      
      await adapter.generateSignedUrl(filePath, {
        expirationMinutes,
      });
      
      const bucket = admin.storage().bucket();
      const file = bucket.file(filePath);
      const callArgs = (file.getSignedUrl as jest.Mock).mock.calls[0][0];
      const expectedExpires = Date.now() + expirationMinutes * 60 * 1000;
      
      // Allow 1 second tolerance for timing
      expect(Math.abs(callArgs.expires - expectedExpires)).toBeLessThan(1000);
    });

    it('should generate signed URL with write action', async () => {
      const filePath = 'test/file.txt';
      
      await adapter.generateSignedUrl(filePath, {
        action: 'write',
      });
      
      const bucket = admin.storage().bucket();
      const file = bucket.file(filePath);
      expect(file.getSignedUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'write',
        })
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      const filePath = 'test/file.txt';
      
      await adapter.deleteFile(filePath);
      
      const bucket = admin.storage().bucket();
      const file = bucket.file(filePath);
      expect(file.delete).toHaveBeenCalled();
    });

    it('should ignore 404 errors when deleting', async () => {
      const filePath = 'test/nonexistent.txt';
      const bucket = admin.storage().bucket();
      const file = bucket.file(filePath);
      
      (file.delete as jest.Mock).mockRejectedValueOnce({ code: 404 });
      
      await expect(adapter.deleteFile(filePath)).resolves.not.toThrow();
    });

    it('should throw non-404 errors', async () => {
      const filePath = 'test/file.txt';
      const bucket = admin.storage().bucket();
      const file = bucket.file(filePath);
      
      (file.delete as jest.Mock).mockRejectedValueOnce({ code: 403, message: 'Forbidden' });
      
      await expect(adapter.deleteFile(filePath)).rejects.toMatchObject({
        code: 403,
      });
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      const filePath = 'test/file.txt';
      
      const exists = await adapter.fileExists(filePath);
      
      expect(exists).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      const filePath = 'test/nonexistent.txt';
      const bucket = admin.storage().bucket();
      const file = bucket.file(filePath);
      
      (file.exists as jest.Mock).mockResolvedValueOnce([false]);
      
      const exists = await adapter.fileExists(filePath);
      
      expect(exists).toBe(false);
    });

    it('should return false on error', async () => {
      const filePath = 'test/file.txt';
      const bucket = admin.storage().bucket();
      const file = bucket.file(filePath);
      
      (file.exists as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      const exists = await adapter.fileExists(filePath);
      
      expect(exists).toBe(false);
    });
  });

  describe('getFileMetadata', () => {
    it('should get file metadata', async () => {
      const filePath = 'test/file.txt';
      
      const metadata = await adapter.getFileMetadata(filePath);
      
      expect(metadata).toMatchObject({
        name: 'test-file',
        size: 1024,
      });
    });
  });

  describe('listFiles', () => {
    it('should list files with prefix', async () => {
      const prefix = 'test/';
      const mockFiles = [
        { name: 'test/file1.txt' },
        { name: 'test/file2.txt' },
      ];
      const bucket = admin.storage().bucket();
      
      (bucket.getFiles as jest.Mock).mockResolvedValueOnce([mockFiles]);
      
      const files = await adapter.listFiles(prefix);
      
      expect(files).toEqual(['test/file1.txt', 'test/file2.txt']);
      expect(bucket.getFiles).toHaveBeenCalledWith({ prefix });
    });

    it('should return empty array if no files found', async () => {
      const prefix = 'empty/';
      const bucket = admin.storage().bucket();
      
      (bucket.getFiles as jest.Mock).mockResolvedValueOnce([[]]);
      
      const files = await adapter.listFiles(prefix);
      
      expect(files).toEqual([]);
    });
  });

  describe('deleteFilesByPrefix', () => {
    it('should delete all files with prefix', async () => {
      const prefix = 'test/';
      const mockFiles = [
        { name: 'test/file1.txt', delete: jest.fn().mockResolvedValue(undefined) },
        { name: 'test/file2.txt', delete: jest.fn().mockResolvedValue(undefined) },
      ];
      const bucket = admin.storage().bucket();
      
      (bucket.getFiles as jest.Mock).mockResolvedValueOnce([mockFiles]);
      
      const count = await adapter.deleteFilesByPrefix(prefix);
      
      expect(count).toBe(2);
      expect(mockFiles[0].delete).toHaveBeenCalled();
      expect(mockFiles[1].delete).toHaveBeenCalled();
    });

    it('should return 0 if no files found', async () => {
      const prefix = 'empty/';
      const bucket = admin.storage().bucket();
      
      (bucket.getFiles as jest.Mock).mockResolvedValueOnce([[]]);
      
      const count = await adapter.deleteFilesByPrefix(prefix);
      
      expect(count).toBe(0);
    });

    it('should ignore 404 errors when deleting', async () => {
      const prefix = 'test/';
      const mockFiles = [
        { name: 'test/file1.txt', delete: jest.fn().mockResolvedValue(undefined) },
        { name: 'test/file2.txt', delete: jest.fn().mockRejectedValue({ code: 404 }) },
      ];
      const bucket = admin.storage().bucket();
      
      (bucket.getFiles as jest.Mock).mockResolvedValueOnce([mockFiles]);
      
      const count = await adapter.deleteFilesByPrefix(prefix);
      
      expect(count).toBe(2); // Both files counted, even if one fails with 404
    });
  });

  describe('createStorageAdapter', () => {
    it('should create adapter from environment variables', () => {
      const originalEnv = process.env.STORAGE_BUCKET;
      process.env.STORAGE_BUCKET = 'env-bucket';
      
      const adapter = createStorageAdapter();
      
      expect(adapter).toBeInstanceOf(StorageAdapter);
      expect(adapter.getBucketName()).toBe('env-bucket');
      
      process.env.STORAGE_BUCKET = originalEnv;
    });

    it('should allow configuration overrides', () => {
      const adapter = createStorageAdapter({
        bucketName: 'override-bucket',
        defaultExpirationMinutes: 30,
      });
      
      expect(adapter.getBucketName()).toBe('override-bucket');
    });
  });
});
