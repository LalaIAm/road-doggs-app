/**
 * Token Service
 * 
 * Implements secure token generation and hashing for trip sharing links.
 * 
 * Per TRD-250: Algorithm: Token Generation
 * Per TRD-251: Generate random token using crypto.randomBytes(32).toString('hex')
 * Per TRD-252: Hash token using SHA-256 before storing in database
 * Per TRD-253: Return raw token to user; store the hash
 * 
 * @module apps/functions/src/services/trip/TokenService
 */

import * as crypto from 'crypto';

/**
 * Result of token generation
 */
export interface TokenGenerationResult {
  /** Raw token to be returned to the user (for sharing) */
  rawToken: string;
  /** SHA-256 hash of the token (for storage in database) */
  hashedToken: string;
}

/**
 * Token Service class
 * 
 * Provides secure token generation and hashing functionality
 * for creating shareable trip invitation links.
 */
export class TokenService {
  /**
   * Generate a secure random token and its hash
   * 
   * Per TRD-251: Generate random token using crypto.randomBytes(32).toString('hex')
   * Per TRD-252: Hash token using SHA-256 before storing
   * Per TRD-253: Return raw token to user; store the hash
   * 
   * @returns TokenGenerationResult containing both raw token and hashed token
   */
  generateToken(): TokenGenerationResult {
    // Per TRD-251: Generate random token using crypto.randomBytes(32).toString('hex')
    // 32 bytes = 64 hex characters, providing 256 bits of entropy
    const rawToken = crypto.randomBytes(32).toString('hex');
    
    // Per TRD-252: Hash token using SHA-256 before storing
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    
    // Per TRD-253: Return raw token to user; store the hash
    return {
      rawToken,
      hashedToken,
    };
  }

  /**
   * Verify a raw token against a stored hash
   * 
   * This method is used to validate tokens when users access share links.
   * It hashes the provided raw token and compares it to the stored hash.
   * 
   * @param rawToken - The raw token provided by the user
   * @param storedHash - The SHA-256 hash stored in the database
   * @returns true if the token matches the hash, false otherwise
   */
  verifyToken(rawToken: string, storedHash: string): boolean {
    const computedHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    
    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(storedHash, 'hex')
    );
  }

  /**
   * Hash a raw token (utility method)
   * 
   * This method can be used to hash a token that was already generated,
   * for example when re-hashing a token for storage.
   * 
   * @param rawToken - The raw token to hash
   * @returns SHA-256 hash of the token
   */
  hashToken(rawToken: string): string {
    return crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
  }
}

/**
 * Default instance of TokenService
 * 
 * Can be used directly without instantiating the class.
 */
export const tokenService = new TokenService();
