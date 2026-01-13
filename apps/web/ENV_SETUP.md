# Environment Variables Setup

This document describes the environment variables required for the RoadDoggs web application.

## Firebase Configuration

These variables are required for Firebase initialization. Get these values from your Firebase project settings.

- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase authentication domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket name
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID

## AI Refinement Function (Optional)

These variables are required for the optional AI refinement feature in the onboarding flow.

- `VITE_AI_REFINEMENT_ENDPOINT` - Backend function URL for AI preference refinement
  - Example: `https://us-central1-xxx.cloudfunctions.net/refinePreferences`
  - This should be the full HTTPS URL to your Firebase Cloud Function or backend endpoint
  - If not set, AI refinement will be disabled

- `VITE_AI_REFINEMENT_ENABLED` - Feature flag to enable/disable AI refinement (default: `true`)
  - Set to `false` to disable AI refinement entirely
  - When disabled, users can still complete onboarding without AI refinement

## Usage

1. Create a `.env` file in the `apps/web` directory
2. Add your environment variables:

```bash
# Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# AI Refinement (Optional)
VITE_AI_REFINEMENT_ENDPOINT=https://us-central1-xxx.cloudfunctions.net/refinePreferences
VITE_AI_REFINEMENT_ENABLED=true
```

3. Restart your development server for changes to take effect

## Notes

- All environment variables prefixed with `VITE_` are exposed to the client-side code
- Never commit `.env` files to version control (they should be in `.gitignore`)
- Use `.env.example` as a template for required variables
- In production, set these variables in your hosting platform's environment configuration (e.g., Firebase Hosting, Vercel, Netlify)