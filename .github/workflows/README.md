# GitHub Actions Workflows

This directory contains CI/CD workflows for the RoadDoggs project.

## Workflows

### `ci-cd.yml`

Main CI/CD pipeline that runs on every push and pull request.

**Jobs:**

1. **test-unit** - Runs Vitest unit tests
2. **test-e2e** - Runs Cypress E2E tests (only on push to main/master or when PR has `run-e2e` label)
3. **build** - Builds the web application and Firebase functions
4. **deploy** - Deploys to Firebase (only on main/master branch)

## Required Secrets

Configure these secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

### Firebase Authentication

- `FIREBASE_TOKEN` - Firebase CLI token (get by running `firebase login:ci` locally)
- `FIREBASE_PROJECT_ID` - Your Firebase project ID (e.g., `road-doggs-app`)

### Alternative: Firebase Service Account (if not using token)

- `FIREBASE_SERVICE_ACCOUNT` - Firebase service account JSON (download from Firebase Console → Project Settings → Service Accounts)

### Environment Variables for Build

- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID

### Optional AI Refinement

- `VITE_AI_REFINEMENT_ENDPOINT` - (Optional) AI refinement function endpoint URL
- `VITE_AI_REFINEMENT_ENABLED` - (Optional) Enable/disable AI refinement (default: true)

## Getting Firebase Token

**Recommended Method:**

1. Install Firebase CLI locally: `npm install -g firebase-tools`
2. Run: `firebase login:ci`
3. Copy the token that's displayed
4. Add it as `FIREBASE_TOKEN` secret in GitHub

**Alternative Method (Service Account):**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Copy the entire JSON content
6. Add it as `FIREBASE_SERVICE_ACCOUNT` secret in GitHub

## Workflow Behavior

### On Pull Requests

- ✅ Runs unit tests
- ⏭️ Skips E2E tests (unless PR has `run-e2e` label)
- ✅ Builds application (for validation)
- ❌ Does not deploy

### On Push to Main/Master

- ✅ Runs unit tests
- ✅ Runs E2E tests
- ✅ Builds application
- ✅ Deploys to Firebase Hosting
- ✅ Deploys Firebase Functions
- ✅ Deploys Firestore rules and indexes

## Manual Triggers

You can manually trigger workflows from the Actions tab in GitHub, or add `workflow_dispatch` to the `on:` section if you want manual triggers.

## E2E Test Label

To run E2E tests on a pull request, add the `run-e2e` label to the PR. This helps speed up PR checks while still allowing E2E validation when needed.

## Troubleshooting

### Build Fails

- Check that all required environment variables are set as secrets
- Verify Firebase token/service account has correct permissions
- Check build logs for specific errors

### Deployment Fails

- Verify `FIREBASE_TOKEN` is valid (run `firebase login:ci` again if expired)
- Check that Firebase project ID matches `.firebaserc`
- Ensure token has deployment permissions

### Tests Fail

- Check test output in Actions logs
- Verify all dependencies are installed correctly
- For E2E tests, check if Cypress can access the built application

### Firebase Token Expired

Firebase tokens can expire. If deployment fails with auth errors:

1. Run `firebase login:ci` locally again
2. Update the `FIREBASE_TOKEN` secret in GitHub

## Workflow Paths

The workflow only runs when files in these paths change:

- `apps/web/**` - Web application code
- `functions/**` - Firebase functions
- `firebase.json` - Firebase configuration
- `.firebaserc` - Firebase project config
- `package.json` / `package-lock.json` - Dependencies
- `.github/workflows/**` - Workflow files

This prevents unnecessary runs when only documentation or other files change.
