# RoadDoggs Firebase Functions

Firebase Cloud Functions for user data export and account deletion.

## Features

- **Data Export**: Secure, encrypted export of user data (JSON/ZIP formats)
- **Account Deletion**: Complete removal of user data across Firestore and Cloud Storage
- **Audit Logging**: Comprehensive audit trail for compliance
- **Email Notifications**: Transactional emails for export/deletion completion
- **Job Status Tracking**: Async job processing with status polling

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

Required:
- `EXPORT_ENCRYPTION_KEY`: 32+ character encryption key for export artifacts

Optional:
- `SENDGRID_API_KEY`: For email notifications
- `SENDGRID_FROM_EMAIL`: Sender email address
- `FRONTEND_URL`: Frontend URL for email links
- `STORAGE_BUCKET`: Cloud Storage bucket name

## API Endpoints

All endpoints require Firebase ID token in `Authorization: Bearer <token>` header.

### Export

- `POST /v1/auth/export/start` - Start export job
- `GET /v1/auth/export/:jobId/status` - Get export status

### Deletion

- `POST /v1/auth/delete/start` - Start deletion job
- `GET /v1/auth/delete/:jobId/status` - Get deletion status

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
