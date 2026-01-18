# Firebase Functions Documentation

This directory contains documentation for the RoadDoggs Firebase Cloud Functions backend.

## Overview

The Firebase Functions backend provides serverless HTTP endpoints and Firestore triggers for the RoadDoggs application. All functions are written in TypeScript and follow the Technical Requirements Document (TRD) specifications.

## Table of Contents

- [API Documentation](./API.md) - HTTP endpoint reference
- [MapsAdapter Documentation](./MapsAdapter.md) - Google Maps API wrapper
- [TokenService Documentation](./TokenService.md) - Secure token generation
- [Testing Guide](../TESTING_GUIDE.md) - How to test functions locally

## Architecture

### Directory Structure

```
apps/functions/
├── src/
│   ├── adapters/          # External API adapters
│   │   └── maps/          # Google Maps API adapter
│   ├── config.ts          # Firebase Admin initialization
│   ├── handlers/          # Request handlers
│   ├── services/          # Business logic services
│   │   ├── intelligence/  # AI/LLM services
│   │   └── trip/          # Trip-related services
│   ├── triggers/          # Cloud Function triggers
│   │   ├── firestore/     # Firestore event triggers
│   │   └── http/          # HTTP-triggered functions
│   ├── utils/             # Utility functions
│   └── index.ts           # Main entry point
├── docs/                  # Documentation (this directory)
├── scripts/               # Utility scripts
└── package.json
```

### Function Types

#### HTTP Triggers

HTTP-triggered functions that handle REST API requests:

- `generateShareLink` - Creates secure share links for trips
- `fetchAiRecommendations` - Generates AI-powered POI recommendations

**Configuration:**
- Timeout: 60 seconds (per TRD-37)
- Memory: 1GB
- Region: us-central1

#### Firestore Triggers

Event-triggered functions that respond to Firestore changes:

- `onTripDelete` - Handles recursive deletion of trip subcollections

**Configuration:**
- Timeout: 540 seconds (per TRD-38)
- Memory: 1GB
- Region: us-central1

## Development

### Prerequisites

- Node.js 22+
- Firebase CLI
- TypeScript 5.3+

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables (see [Environment Variables](#environment-variables))

3. Build the project:
   ```bash
   cd apps/functions
   npm run build
   ```

### Running Locally

Start the Firebase Emulator:

```bash
cd apps/functions
npm run serve
```

This will:
- Build TypeScript code
- Start Functions emulator on port 5001
- Start Auth emulator on port 9099
- Start Firestore emulator on port 8080
- Open Emulator UI at http://localhost:4000

### Testing

Run unit tests:

```bash
cd apps/functions
npm test
```

Run specific test file:

```bash
npm test -- TokenService.test.ts
```

### Deployment

Deploy all functions:

```bash
cd apps/functions
npm run deploy
```

Deploy specific function:

```bash
firebase deploy --only functions:generateShareLink
```

## Environment Variables

Set these in Firebase Console or `.env` file:

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_MAPS_SERVER_KEY` | Google Maps API server key | Yes |
| `FRONTEND_URL` | Base URL for share links | No (default: https://roaddoggs.app) |
| `VERTEX_AI_PROJECT_ID` | Google Cloud project ID | Yes (for AI functions) |
| `VERTEX_AI_LOCATION` | Vertex AI region | Yes (for AI functions) |

## Code Style

- **Language**: TypeScript with strict mode
- **Formatting**: Follow existing code style
- **Comments**: JSDoc comments for all public functions
- **Error Handling**: Always use try-catch with proper error responses
- **Logging**: Use `functions.logger` for structured logging

## Security

### Authentication

All HTTP functions require Firebase ID token authentication:

```typescript
Authorization: Bearer <firebase-id-token>
```

### Authorization

Functions implement role-based access control:

- **OWNER**: Full access to trip
- **EDITOR**: Can edit trip content
- **VIEWER**: Read-only access

### Data Validation

- Input validation using TypeScript interfaces
- Firestore security rules for data access
- Token verification with constant-time comparison

## Monitoring

### Logs

View function logs:

```bash
firebase functions:log
```

Or in Firebase Console: Functions → Logs

### Metrics

Monitor function performance in Firebase Console:
- Execution time
- Error rates
- Invocation counts
- Memory usage

## Troubleshooting

### Build Errors

1. Check TypeScript version: `npm list typescript`
2. Clear build cache: `rm -rf lib/`
3. Rebuild: `npm run build`

### Runtime Errors

1. Check function logs: `firebase functions:log`
2. Verify environment variables are set
3. Check Firestore security rules
4. Verify authentication tokens

### Emulator Issues

1. Check ports are available (5001, 8080, 9099)
2. Restart emulator: `npm run serve`
3. Clear emulator data: Delete `.firebase/` directory

## Related Documentation

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Technical Requirements Document](../../.nautex/docs/TRD.md)

## Contributing

When adding new functions:

1. Follow existing code patterns
2. Add JSDoc comments
3. Write unit tests
4. Update this documentation
5. Update API.md if adding HTTP endpoints
6. Follow TRD requirements
