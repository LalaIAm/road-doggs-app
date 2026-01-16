/**
 * Unit tests for encryption utilities
 */

import { encrypt, decrypt, getEncryptionKey } from '../encryption';

describe('Encryption Utilities', () => {
  const testKey = 'test-encryption-key-minimum-32-characters-long';
  const testData = 'This is test data to encrypt';

  it('should encrypt and decrypt data correctly', () => {
    const encrypted = encrypt(testData, testKey);
    expect(encrypted).toBeTruthy();
    expect(encrypted).not.toBe(testData);

    const decrypted = decrypt(encrypted, testKey);
    expect(decrypted.toString('utf-8')).toBe(testData);
  });

  it('should produce different ciphertext for same input', () => {
    const encrypted1 = encrypt(testData, testKey);
    const encrypted2 = encrypt(testData, testKey);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should fail decryption with wrong key', () => {
    const encrypted = encrypt(testData, testKey);
    const wrongKey = 'wrong-key-minimum-32-characters-long';

    expect(() => {
      decrypt(encrypted, wrongKey);
    }).toThrow();
  });

  it('should throw error if encryption key is not set', () => {
    const originalEnv = process.env.EXPORT_ENCRYPTION_KEY;
    delete process.env.EXPORT_ENCRYPTION_KEY;

    expect(() => {
      getEncryptionKey();
    }).toThrow();

    process.env.EXPORT_ENCRYPTION_KEY = originalEnv;
  });
});
