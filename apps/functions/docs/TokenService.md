# TokenService Documentation

The TokenService provides secure token generation and hashing functionality for creating shareable trip invitation links.

## Overview

The TokenService generates cryptographically secure random tokens and provides utilities for hashing and verifying tokens. It follows security best practices by storing only hashed tokens in the database.

## Installation

The TokenService is part of the `@roaddoggs/functions` package and is automatically available when using Firebase Functions.

## Quick Start

```typescript
import { tokenService } from './services/trip/TokenService';

// Generate a new token
const result = tokenService.generateToken();
console.log('Raw token (for URL):', result.rawToken);
console.log('Hashed token (for storage):', result.hashedToken);

// Verify a token later
const isValid = tokenService.verifyToken(rawToken, storedHash);
```

## API Reference

### Methods

#### `generateToken()`

Generates a secure random token and its SHA-256 hash.

**Returns:** `TokenGenerationResult`

```typescript
interface TokenGenerationResult {
  rawToken: string;    // 64-character hex string (32 bytes)
  hashedToken: string; // 64-character hex string (SHA-256 hash)
}
```

**Example:**
```typescript
const result = tokenService.generateToken();

// Store the hash in database
await db.collection('shareLinks').add({
  tokenHash: result.hashedToken,
  // ... other fields
});

// Return the raw token to user (in share URL)
const shareUrl = `https://app.com/share/${result.rawToken}`;
```

**Security Notes:**
- Uses `crypto.randomBytes(32)` for 256 bits of entropy
- Raw token is never stored in the database
- Only the hash is stored for security

#### `verifyToken(rawToken, storedHash)`

Verifies a raw token against a stored hash.

**Parameters:**
- `rawToken` (string): The raw token provided by the user
- `storedHash` (string): The SHA-256 hash stored in the database

**Returns:** `boolean` - `true` if token matches hash, `false` otherwise

**Example:**
```typescript
// User accesses share link with token
const tokenFromUrl = 'a1b2c3d4e5f6...';

// Retrieve stored hash from database
const shareLink = await db.collection('shareLinks')
  .where('tokenHash', '==', /* ... */)
  .get();

const storedHash = shareLink.docs[0].data().tokenHash;

// Verify token
if (tokenService.verifyToken(tokenFromUrl, storedHash)) {
  // Token is valid, grant access
} else {
  // Token is invalid or tampered
}
```

**Security Notes:**
- Uses constant-time comparison to prevent timing attacks
- Always compare against stored hash, never raw token

#### `hashToken(rawToken)`

Hashes a raw token using SHA-256.

**Parameters:**
- `rawToken` (string): The raw token to hash

**Returns:** `string` - 64-character hex string (SHA-256 hash)

**Example:**
```typescript
const rawToken = 'a1b2c3d4e5f6...';
const hash = tokenService.hashToken(rawToken);
// Store hash in database
```

## Usage Patterns

### Pattern 1: Generate and Store

```typescript
import { tokenService } from './services/trip/TokenService';
import { admin } from './config';

async function createShareLink(tripId: string, ownerId: string) {
  // Generate token
  const { rawToken, hashedToken } = tokenService.generateToken();
  
  // Store hash in database
  await admin.firestore().collection('shareLinks').add({
    tripId,
    ownerId,
    tokenHash: hashedToken,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiry: /* ... */
  });
  
  // Return raw token for URL
  return {
    url: `https://app.com/share/${rawToken}`,
    token: rawToken
  };
}
```

### Pattern 2: Verify Token from URL

```typescript
async function validateShareLink(tokenFromUrl: string) {
  // Hash the token from URL
  const tokenHash = tokenService.hashToken(tokenFromUrl);
  
  // Find share link by hash
  const shareLinks = await admin.firestore()
    .collection('shareLinks')
    .where('tokenHash', '==', tokenHash)
    .get();
  
  if (shareLinks.empty) {
    return { valid: false, reason: 'Token not found' };
  }
  
  const shareLink = shareLinks.docs[0].data();
  
  // Verify token matches (constant-time comparison)
  if (!tokenService.verifyToken(tokenFromUrl, shareLink.tokenHash)) {
    return { valid: false, reason: 'Token mismatch' };
  }
  
  // Check expiry
  if (shareLink.expiry.toDate() < new Date()) {
    return { valid: false, reason: 'Token expired' };
  }
  
  return { valid: true, shareLink };
}
```

### Pattern 3: Using Class Instance

```typescript
import { TokenService } from './services/trip/TokenService';

const service = new TokenService();
const result = service.generateToken();
```

## Token Format

- **Length**: 64 hexadecimal characters
- **Entropy**: 256 bits (32 bytes)
- **Format**: Lowercase hex string (0-9, a-f)
- **Example**: `a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456`

## Hash Format

- **Algorithm**: SHA-256
- **Length**: 64 hexadecimal characters
- **Format**: Lowercase hex string (0-9, a-f)
- **Example**: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`

## Security Considerations

### ✅ Best Practices

1. **Never Store Raw Tokens**: Always hash tokens before storing
2. **Use Constant-Time Comparison**: Prevents timing attacks
3. **High Entropy**: 256 bits provides sufficient security
4. **Single-Use Tokens**: Consider marking tokens as used after first access
5. **Expiry**: Always set expiration dates for share links

### ⚠️ Security Warnings

1. **Don't Log Tokens**: Avoid logging raw tokens in production
2. **HTTPS Only**: Always use HTTPS when transmitting tokens
3. **Token Rotation**: Consider token rotation for long-lived links
4. **Rate Limiting**: Implement rate limiting on token verification endpoints

## Testing

The TokenService includes comprehensive tests covering:

- Token generation entropy
- Hashing consistency
- Token verification
- Edge cases and error handling

Run tests:
```bash
cd apps/functions
npm test -- TokenService.test.ts
```

## Implementation Details

### Token Generation

```typescript
// Uses Node.js crypto module
const rawToken = crypto.randomBytes(32).toString('hex');
// 32 bytes = 256 bits = 64 hex characters
```

### Hashing

```typescript
// SHA-256 hashing
const hash = crypto
  .createHash('sha256')
  .update(rawToken)
  .digest('hex');
```

### Verification

```typescript
// Constant-time comparison
crypto.timingSafeEqual(
  Buffer.from(computedHash, 'hex'),
  Buffer.from(storedHash, 'hex')
);
```

## Related Documentation

- [Node.js crypto.randomBytes()](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback)
- [SHA-256 Algorithm](https://en.wikipedia.org/wiki/SHA-2)
- [Timing Attack Prevention](https://en.wikipedia.org/wiki/Timing_attack)
