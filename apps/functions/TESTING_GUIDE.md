# Testing Guide: generateShareLink Function

This guide explains how to test the `generateShareLink` HTTP trigger using the Firebase Emulator.

## Prerequisites

1. Firebase CLI installed and authenticated
2. Node.js 22+ installed
3. Dependencies installed: `npm install` (from repo root)

## Step 1: Start Firebase Emulator

From the `apps/functions` directory:

```bash
npm run serve
```

This will:
- Build the TypeScript code
- Start the Firebase Functions emulator on port 5001
- Start other emulators (Auth on 9099, Firestore on 8080)

The emulator UI will be available at: http://localhost:4000

## Step 2: Set Up Test Data

### 2.1 Create a Test User

1. Open the Emulator UI: http://localhost:4000
2. Go to the **Authentication** tab
3. Click **Add user**
4. Create a user with:
   - Email: `test@example.com`
   - Password: `test123456`
   - UID: Note this UID (e.g., `test-user-123`)

### 2.2 Get ID Token

You can get the ID token in two ways:

**Option A: Using Firebase Admin SDK (in Node.js)**
```javascript
const admin = require('firebase-admin');
admin.initializeApp();
const token = await admin.auth().createCustomToken('test-user-123');
```

**Option B: Using the Emulator UI**
- In the Authentication tab, click on your test user
- Copy the ID token from the user details

### 2.3 Create a Test Trip

Using the Firestore emulator UI or a script, create a trip document:

**Collection:** `trips`  
**Document ID:** `test-trip-123`  
**Data:**
```json
{
  "ownerId": "test-user-123",
  "title": "Test Trip",
  "collaboratorIds": [],
  "viewerIds": [],
  "status": "DRAFT",
  "dates": {
    "start": { "seconds": 1735689600, "nanoseconds": 0 },
    "end": { "seconds": 1735862400, "nanoseconds": 0 }
  },
  "bounds": []
}
```

**Important:** The `ownerId` must match the UID of your test user.

## Step 3: Test the Function

### Option A: Using the Test Script

```bash
cd apps/functions
node scripts/test-generateShareLink.js <your-id-token>
```

### Option B: Using curl

```bash
curl -X POST \
  http://localhost:5001/road-doggs-app/us-central1/generateShareLink \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-id-token>" \
  -d '{
    "tripId": "test-trip-123",
    "role": "EDITOR",
    "expiryDays": 30
  }'
```

### Option C: Using Postman

1. Create a new POST request
2. URL: `http://localhost:5001/road-doggs-app/us-central1/generateShareLink`
3. Headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer <your-id-token>`
4. Body (JSON):
   ```json
   {
     "tripId": "test-trip-123",
     "role": "EDITOR",
     "expiryDays": 30
   }
   ```

## Expected Response

### Success (200 OK)

```json
{
  "url": "https://roaddoggs.app/share/<64-char-hex-token>",
  "expiry": {
    "seconds": 1738281600,
    "nanoseconds": 0
  }
}
```

### Error Cases

**401 Unauthorized** (missing/invalid token):
```json
{
  "error": "UNAUTHORIZED",
  "message": "Missing or invalid authorization header"
}
```

**403 Forbidden** (not trip owner):
```json
{
  "error": "FORBIDDEN",
  "message": "Only the trip owner can generate share links"
}
```

**404 Not Found** (trip doesn't exist):
```json
{
  "error": "NOT_FOUND",
  "message": "Trip not found"
}
```

**400 Bad Request** (invalid input):
```json
{
  "error": "BAD_REQUEST",
  "message": "Request body must include tripId and role"
}
```

## Verification Checklist

- [ ] Function builds without errors
- [ ] Function is accessible at the emulator endpoint
- [ ] Returns 200 OK with valid token and trip owner
- [ ] Returns 401 when authentication is missing
- [ ] Returns 403 when user is not trip owner
- [ ] Returns 404 when trip doesn't exist
- [ ] Returns 400 for invalid input (missing fields, invalid role, etc.)
- [ ] Share link is stored in Firestore `shareLinks` collection
- [ ] Token hash (not raw token) is stored in database
- [ ] Expiry timestamp is correctly calculated
- [ ] Share URL format is correct

## Troubleshooting

### Function not found
- Verify the function is exported in `apps/functions/src/index.ts`
- Check that the build completed successfully
- Restart the emulator

### Authentication errors
- Verify the ID token is valid and not expired
- Check that the Auth emulator is running on port 9099
- Ensure the token is from the emulator, not production

### Permission errors
- Verify the test user's UID matches the trip's `ownerId`
- Check that the trip document exists in Firestore
- Ensure Firestore emulator is running on port 8080

### Build errors
- Run `npm run build` manually to see detailed errors
- Check TypeScript configuration
- Verify all dependencies are installed
