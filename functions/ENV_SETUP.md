# Environment Variables Setup

This document describes the required and optional environment variables for the Firebase Functions.

## Required Variables

### `EXPORT_ENCRYPTION_KEY`
- **Description**: Encryption key for export artifacts (AES-256)
- **Format**: Base64-encoded string, minimum 32 characters
- **How to generate**:
  ```bash
  openssl rand -base64 32
  ```
- **Where to set**: Firebase Functions environment config or `.env` file for local development

## Optional Variables

### `SENDGRID_API_KEY`
- **Description**: SendGrid API key for email notifications
- **Format**: String (starts with `SG.`)
- **Where to set**: Firebase Functions environment config

### `SENDGRID_FROM_EMAIL`
- **Description**: Sender email address for transactional emails
- **Format**: Valid email address
- **Default**: `noreply@roaddoggs.com`

### `SENDGRID_EXPORT_TEMPLATE_ID`
- **Description**: SendGrid dynamic template ID for export completion emails
- **Format**: String (template ID from SendGrid dashboard)

### `SENDGRID_DELETION_TEMPLATE_ID`
- **Description**: SendGrid dynamic template ID for deletion completion emails
- **Format**: String (template ID from SendGrid dashboard)

### `FRONTEND_URL`
- **Description**: Frontend application URL for email links
- **Format**: Full URL (e.g., `https://roaddoggs.com`)
- **Default**: None (emails won't include download links if not set)

### `STORAGE_BUCKET`
- **Description**: Google Cloud Storage bucket name
- **Format**: String (e.g., `your-project-id.appspot.com`)
- **Default**: Uses `GCLOUD_STORAGE_BUCKET` from Firebase config

## Setting Environment Variables

### For Local Development

Create a `.env` file in the `functions/` directory:
```bash
EXPORT_ENCRYPTION_KEY=your-generated-key-here
SENDGRID_API_KEY=your-sendgrid-key
# ... other variables
```

### For Firebase Deployment

Use Firebase CLI:
```bash
firebase functions:config:set export.encryption_key="your-key"
firebase functions:config:set sendgrid.api_key="your-key"
```

Or use Google Cloud Console:
1. Go to Cloud Functions → Your Function → Configuration
2. Add environment variables in the "Environment variables" section

## Security Notes

- **Never commit** `.env` files or encryption keys to version control
- Use Firebase Secret Manager for production keys (recommended)
- Rotate encryption keys periodically
- Use different keys for development and production environments
