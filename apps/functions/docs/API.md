# Firebase Functions API Documentation

This document describes the HTTP-triggered Cloud Functions available in the RoadDoggs backend.

## Table of Contents

- [generateShareLink](#generatesharelink)
- [fetchAiRecommendations](#fetchairecommendations)

---

## generateShareLink

Creates secure, expiring share links for trip invitations.

### Endpoint

```
POST /generateShareLink
```

### Authentication

Requires Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

### Request Body

```typescript
{
  tripId: string;        // Required: UUID of the trip
  role: 'EDITOR' | 'VIEWER';  // Required: Access level for the share link
  expiryDays?: number;  // Optional: Days until link expires (1-365, default: 30)
}
```

### Request Example

```json
{
  "tripId": "abc123-def456-ghi789",
  "role": "EDITOR",
  "expiryDays": 30
}
```

### Response

#### Success (200 OK)

```typescript
{
  url: string;  // Shareable URL containing the token
  expiry: {
    seconds: number;      // Unix timestamp in seconds
    nanoseconds: number;   // Additional nanoseconds
  }
}
```

**Example:**
```json
{
  "url": "https://roaddoggs.app/share/a1b2c3d4e5f6...",
  "expiry": {
    "seconds": 1738281600,
    "nanoseconds": 0
  }
}
```

#### Error Responses

**401 Unauthorized**
```json
{
  "error": "UNAUTHORIZED",
  "message": "Missing or invalid authorization header"
}
```

**403 Forbidden**
```json
{
  "error": "FORBIDDEN",
  "message": "Only the trip owner can generate share links"
}
```

**404 Not Found**
```json
{
  "error": "NOT_FOUND",
  "message": "Trip not found"
}
```

**400 Bad Request**
```json
{
  "error": "BAD_REQUEST",
  "message": "Request body must include tripId and role"
}
```

### Usage Example

```javascript
const response = await fetch(
  'https://us-central1-road-doggs-app.cloudfunctions.net/generateShareLink',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({
      tripId: 'abc123-def456-ghi789',
      role: 'EDITOR',
      expiryDays: 30
    })
  }
);

const data = await response.json();
console.log('Share link:', data.url);
```

### Security Notes

- Only trip owners can generate share links
- Tokens are hashed before storage (SHA-256)
- Raw tokens are only returned in the response URL
- Links expire after the specified number of days
- Expired links cannot be used to access trips

### Implementation Details

- **Token Generation**: Uses `crypto.randomBytes(32)` for 256 bits of entropy
- **Storage**: Token hash stored in `shareLinks` Firestore collection
- **URL Format**: `${FRONTEND_URL}/share/${rawToken}`
- **Timeout**: 60 seconds (per TRD-37)

---

## fetchAiRecommendations

Generates AI-powered POI recommendations based on user preferences and route context.

### Endpoint

```
POST /fetchAiRecommendations
```

### Authentication

Requires Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

### Request Body

```typescript
{
  preferences: {
    nature: boolean;
    culture: boolean;
    foodie: boolean;
    budget: 'LOW' | 'MID' | 'HIGH';
  };
  routeContext?: string;  // Optional: Description of route or trip context
}
```

### Response

#### Success (200 OK)

```typescript
{
  recommendations: Array<{
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    category: string;
    reason: string;
  }>
}
```

### Error Responses

**422 Unprocessable Entity** - AI response parsing failed
**500 Internal Server Error** - Unexpected server error

---

## Common Error Codes

| Status Code | Error Type | Description |
|------------|-----------|-------------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | User lacks required permissions |
| 404 | Not Found | Resource not found |
| 405 | Method Not Allowed | HTTP method not supported |
| 422 | Unprocessable Entity | Request valid but processing failed |
| 500 | Internal Server Error | Unexpected server error |

## Rate Limiting

- Functions have a 60-second timeout (HTTP triggers)
- Background triggers have a 540-second timeout
- Rate limiting is implemented per service (see individual service docs)

## Environment Variables

Required environment variables for functions:

- `GOOGLE_MAPS_SERVER_KEY` - Google Maps API server key
- `FRONTEND_URL` - Base URL for generated share links (default: https://roaddoggs.app)
- `VERTEX_AI_PROJECT_ID` - Google Cloud project ID for Vertex AI
- `VERTEX_AI_LOCATION` - Vertex AI region
