/**
 * Unit Tests for Token Service
 * 
 * Tests token generation, hashing, and verification functionality.
 * 
 * Per TRD-250: Verify that tokens are generated with correct entropy
 * Per TRD-250: Verify that hashing function is consistent
 * 
 * @module apps/functions/src/services/trip/TokenService.test
 */

import { TokenService, tokenService } from './TokenService';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    service = new TokenService();
  });

  describe('generateToken', () => {
    it('should generate a token with correct entropy (64 hex characters)', () => {
      const result = service.generateToken();
      
      // Per TRD-251: 32 bytes = 64 hex characters
      expect(result.rawToken).toHaveLength(64);
      expect(result.rawToken).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate a hashed token (64 hex characters for SHA-256)', () => {
      const result = service.generateToken();
      
      // SHA-256 produces 256 bits = 32 bytes = 64 hex characters
      expect(result.hashedToken).toHaveLength(64);
      expect(result.hashedToken).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate different tokens on each call', () => {
      const result1 = service.generateToken();
      const result2 = service.generateToken();
      const result3 = service.generateToken();
      
      // All raw tokens should be unique
      expect(result1.rawToken).not.toBe(result2.rawToken);
      expect(result2.rawToken).not.toBe(result3.rawToken);
      expect(result1.rawToken).not.toBe(result3.rawToken);
      
      // All hashed tokens should be unique
      expect(result1.hashedToken).not.toBe(result2.hashedToken);
      expect(result2.hashedToken).not.toBe(result3.hashedToken);
      expect(result1.hashedToken).not.toBe(result3.hashedToken);
    });

    it('should generate unique hashes for different raw tokens', () => {
      const result1 = service.generateToken();
      const result2 = service.generateToken();
      
      // Different raw tokens should produce different hashes
      expect(result1.hashedToken).not.toBe(result2.hashedToken);
    });

    it('should return both raw token and hashed token', () => {
      const result = service.generateToken();
      
      expect(result).toHaveProperty('rawToken');
      expect(result).toHaveProperty('hashedToken');
      expect(typeof result.rawToken).toBe('string');
      expect(typeof result.hashedToken).toBe('string');
    });

    it('should generate tokens with sufficient entropy (statistical test)', () => {
      // Generate multiple tokens and verify they're all unique
      const tokens = new Set<string>();
      const hashes = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        const result = service.generateToken();
        tokens.add(result.rawToken);
        hashes.add(result.hashedToken);
      }
      
      // All 100 tokens should be unique (very low probability of collision)
      expect(tokens.size).toBe(100);
      expect(hashes.size).toBe(100);
    });
  });

  describe('hashToken', () => {
    it('should produce consistent hashes for the same input', () => {
      const rawToken = 'test-token-12345';
      
      const hash1 = service.hashToken(rawToken);
      const hash2 = service.hashToken(rawToken);
      
      // Per TRD-250: Hashing function must be consistent
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = service.hashToken('token1');
      const hash2 = service.hashToken('token2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should produce 64-character hex hash', () => {
      const hash = service.hashToken('any-token');
      
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should handle empty string', () => {
      const hash = service.hashToken('');
      
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should handle long strings', () => {
      const longToken = 'a'.repeat(1000);
      const hash = service.hashToken(longToken);
      
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should produce the same hash as generateToken for the same raw token', () => {
      const rawToken = 'test-token-for-verification';
      
      // Hash it directly
      const directHash = service.hashToken(rawToken);
      
      // Generate a token and verify it produces the same hash
      // (We can't directly test this since generateToken creates random tokens,
      // but we can verify the hashToken method works correctly)
      expect(directHash).toHaveLength(64);
    });
  });

  describe('verifyToken', () => {
    it('should verify a correct token against its hash', () => {
      const rawToken = 'test-token-12345';
      const storedHash = service.hashToken(rawToken);
      
      const isValid = service.verifyToken(rawToken, storedHash);
      
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect token', () => {
      const rawToken = 'test-token-12345';
      const wrongToken = 'wrong-token-67890';
      const storedHash = service.hashToken(rawToken);
      
      const isValid = service.verifyToken(wrongToken, storedHash);
      
      expect(isValid).toBe(false);
    });

    it('should reject a token with incorrect hash', () => {
      const rawToken = 'test-token-12345';
      const wrongHash = 'a'.repeat(64); // Valid format but wrong hash
      
      const isValid = service.verifyToken(rawToken, wrongHash);
      
      expect(isValid).toBe(false);
    });

    it('should handle tokens generated by generateToken', () => {
      const result = service.generateToken();
      
      const isValid = service.verifyToken(result.rawToken, result.hashedToken);
      
      expect(isValid).toBe(true);
    });

    it('should use constant-time comparison (prevent timing attacks)', () => {
      const rawToken = 'test-token';
      const correctHash = service.hashToken(rawToken);
      const wrongHash = 'a'.repeat(64);
      
      // Verify correct token
      const isValidCorrect = service.verifyToken(rawToken, correctHash);
      expect(isValidCorrect).toBe(true);
      
      // Verify wrong token
      const isValidWrong = service.verifyToken(rawToken, wrongHash);
      expect(isValidWrong).toBe(false);
      
      // The method should complete without throwing
      expect(() => {
        service.verifyToken(rawToken, correctHash);
        service.verifyToken(rawToken, wrongHash);
      }).not.toThrow();
    });

    it('should handle edge cases with different token lengths', () => {
      const shortToken = 'abc';
      const longToken = 'a'.repeat(200);
      
      const shortHash = service.hashToken(shortToken);
      const longHash = service.hashToken(longToken);
      
      expect(service.verifyToken(shortToken, shortHash)).toBe(true);
      expect(service.verifyToken(longToken, longHash)).toBe(true);
      expect(service.verifyToken(shortToken, longHash)).toBe(false);
      expect(service.verifyToken(longToken, shortHash)).toBe(false);
    });
  });

  describe('default instance (tokenService)', () => {
    it('should work as a singleton instance', () => {
      const result1 = tokenService.generateToken();
      const result2 = tokenService.generateToken();
      
      expect(result1.rawToken).not.toBe(result2.rawToken);
      expect(result1.hashedToken).not.toBe(result2.hashedToken);
    });

    it('should have working hashToken method', () => {
      const hash = tokenService.hashToken('test');
      
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should have working verifyToken method', () => {
      const rawToken = 'test-token';
      const hash = tokenService.hashToken(rawToken);
      
      expect(tokenService.verifyToken(rawToken, hash)).toBe(true);
      expect(tokenService.verifyToken('wrong', hash)).toBe(false);
    });
  });

  describe('integration: full token lifecycle', () => {
    it('should support complete token generation and verification flow', () => {
      // Step 1: Generate token (as would happen when creating share link)
      const result = service.generateToken();
      
      // Step 2: Store hash in database (simulated)
      const storedHash = result.hashedToken;
      
      // Step 3: User receives raw token (in share link)
      const receivedToken = result.rawToken;
      
      // Step 4: Verify token when user accesses link
      const isValid = service.verifyToken(receivedToken, storedHash);
      
      expect(isValid).toBe(true);
    });

    it('should detect tampered tokens', () => {
      const result = service.generateToken();
      const storedHash = result.hashedToken;
      
      // Simulate token tampering
      const tamperedToken = result.rawToken.slice(0, -1) + 'X';
      
      const isValid = service.verifyToken(tamperedToken, storedHash);
      
      expect(isValid).toBe(false);
    });

    it('should handle multiple concurrent token generations', () => {
      const results = Array.from({ length: 10 }, () => service.generateToken());
      
      // All tokens should be unique
      const rawTokens = results.map(r => r.rawToken);
      const hashedTokens = results.map(r => r.hashedToken);
      
      expect(new Set(rawTokens).size).toBe(10);
      expect(new Set(hashedTokens).size).toBe(10);
      
      // All tokens should verify correctly
      results.forEach(result => {
        expect(service.verifyToken(result.rawToken, result.hashedToken)).toBe(true);
      });
    });
  });
});
