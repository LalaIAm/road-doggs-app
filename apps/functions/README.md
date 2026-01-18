# RoadDoggs Firebase Functions

Firebase Cloud Functions backend for the RoadDoggs road trip planning application.

## Features

### Authentication & Data Management
- **Data Export**: Secure, encrypted export of user data (JSON/ZIP formats)
- **Account Deletion**: Complete removal of user data across Firestore and Cloud Storage
- **Audit Logging**: Comprehensive audit trail for compliance
- **Email Notifications**: Transactional emails for export/deletion completion
- **Job Status Tracking**: Async job processing with status polling

### Trip Management
- **Share Link Generation**: Secure, expiring share links for trip invitations
- **Token Service**: Cryptographically secure token generation and verification

### External Integrations
- **Maps Adapter**: Rate-limited wrapper for Google Maps Platform APIs
- **AI Recommendations**: AI-powered POI recommendations via Vertex AI

## Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

- [API Documentation](./docs/API.md) - HTTP endpoint reference
- [MapsAdapter Documentation](./docs/MapsAdapter.md) - Google Maps API wrapper
- [TokenService Documentation](./docs/TokenService.md) - Secure token generation
- [Testing Guide](./TESTING_GUIDE.md) - Local testing instructions
- [Functions README](./docs/README.md) - Architecture and development guide

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (see `.env.example`):
```bash
cp .env.example .env
# Edit .env with your values
```

3. Build TypeScript:
```bash
npm run build
```

4. Deploy to Firebase:
```bash
npm run deploy
```

## Environment Variables

### Required

- `EXPORT_ENCRYPTION_KEY`: 32+ character encryption key for export artifacts
- `GOOGLE_MAPS_SERVER_KEY`: Google Maps Platform API server key

### Optional

- `SENDGRID_API_KEY`: For email notifications
- `SENDGRID_FROM_EMAIL`: Sender email address
- `FRONTEND_URL`: Frontend URL for share links and email links (default: https://roaddoggs.app)
- `STORAGE_BUCKET`: Cloud Storage bucket name
- `VERTEX_AI_PROJECT_ID`: Google Cloud project ID for Vertex AI
- `VERTEX_AI_LOCATION`: Vertex AI region

## API Endpoints

All endpoints require Firebase ID token in `Authorization: Bearer <token>` header.

### Authentication & Data Management

- `POST /v1/auth/export/start` - Start export job
- `GET /v1/auth/export/:jobId/status` - Get export status
- `POST /v1/auth/delete/start` - Start deletion job
- `GET /v1/auth/delete/:jobId/status` - Get deletion status

### Trip Management

- `POST /generateShareLink` - Generate secure share link for trip
  - See [API Documentation](./docs/API.md#generatesharelink) for details

### AI & Recommendations

- `POST /fetchAiRecommendations` - Get AI-powered POI recommendations
  - See [API Documentation](./docs/API.md#fetchairecommendations) for details

For complete API documentation, see [docs/API.md](./docs/API.md).

## Development

```bash
# Run emulator
npm run serve

# Run tests
npm test

# Watch mode
npm run test:watch
```

## Security

- All exports are encrypted with AES-256-GCM
- Signed URLs expire after 1 hour
- Recent authentication required for sensitive operations
- Privacy consent verification before export/deletion
- Comprehensive audit logging

## Testing

Unit tests are located in `src/**/*.test.ts`. Run with:

```bash
npm test
```
