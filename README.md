# RoadDoggs

An AI-powered collaborative road trip planning application built with React, Firebase, and Turborepo.

## Tech Stack

- **Frontend**: React 18, Redux Toolkit, Tailwind CSS, Vite
- **Backend**: Firebase (Firestore, Functions, Auth, Hosting)
- **Monorepo**: Turborepo with npm workspaces
- **Build Tool**: Turbo for caching and parallel execution
- **Maps & AI**: Google Maps Platform, Vertex AI (Gemini)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 22.x or higher
- **npm** 11.6.2 or higher
- **Java JDK** 11 or higher (required for Firebase Emulators)
  - Download from [Adoptium](https://adoptium.net/) or [Oracle](https://www.oracle.com/java/technologies/downloads/)
  - Ensure Java is on your system PATH
- **Firebase CLI**: `npm install -g firebase-tools`

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

This will install dependencies for all workspaces in the monorepo.

### 2. Build All Workspaces

```bash
npm run build
```

This uses Turborepo to build all packages in parallel:
- `apps/web` - React web application
- `apps/functions` - Firebase Cloud Functions
- `packages/core` - Shared domain logic
- `packages/ui-kit` - Shared UI components

### 3. Development

Start the development server:

```bash
npm run dev
```

This runs the web app dev server (typically at `http://localhost:5173`).

### 4. Firebase Emulators

Start all Firebase emulators locally:

```bash
firebase emulators:start
```

**Note**: Java JDK must be installed and on your PATH for emulators to work.

The Emulator UI will be available at `http://localhost:4000`.

Configured emulator ports:
- **Auth**: 9099
- **Firestore**: 8080
- **Functions**: 5001
- **Hosting**: 5000
- **PubSub**: 8085
- **Storage**: 9199

## Project Structure

```
├── apps/
│   ├── web/              # React web application
│   └── functions/        # Firebase Cloud Functions
├── packages/
│   ├── core/             # Shared domain logic (isomorphic)
│   └── ui-kit/           # Shared UI components
├── .github/
│   └── workflows/        # CI/CD pipelines
│       ├── main.yml      # PR CI (lint, test, build)
│       └── canary.yml    # Daily API health checks
├── firebase.json         # Firebase configuration
├── .firebaserc          # Firebase project aliases
├── turbo.json           # Turborepo pipeline configuration
└── package.json         # Root workspace configuration
```

## Available Scripts

### Root Level (Turborepo)

- `npm run dev` - Start development servers for all packages
- `npm run build` - Build all packages
- `npm run test` - Run tests for all packages
- `npm run lint` - Lint all packages
- `npm run type-check` - Type check all packages
- `npm run preview` - Preview the built web app
- `npm run canary` - Run external API health checks

### Workspace-Specific

- `apps/web`: `npm run dev`, `npm run build`, `npm run test`
- `apps/functions`: `npm run build`, `npm run test`, `npm run serve`

## Firebase Configuration

### Project Aliases

The project uses Firebase project aliases defined in `.firebaserc`:

- `default` - Default project
- `production` - Production deployment
- `staging` - Staging environment
- `development` - Development environment

Switch projects with:

```bash
firebase use production
firebase use staging
firebase use default
```

### Hosting

The app is configured as a Single Page Application (SPA) with rewrites:
- All routes (`**`) redirect to `/index.html`
- Predeploy builds the web app automatically

## CI/CD

### Pull Request Workflow

The `.github/workflows/main.yml` workflow runs on PRs:
- **Lint**: Checks code quality
- **Test**: Runs unit tests
- **Build**: Builds all workspaces

### Canary Workflow

The `.github/workflows/canary.yml` workflow runs daily:
- Tests external API health (Vertex AI)
- Detects breaking changes or billing issues

## Troubleshooting

### Build Errors

If you encounter build errors:
1. Ensure Node.js 22.x is installed: `node --version`
2. Clear Turbo cache: `rm -rf .turbo`
3. Reinstall dependencies: `rm -rf node_modules && npm install`

### Firebase Emulators Won't Start

**Error**: `Could not spawn java -version`

**Solution**: Install Java JDK 11+ and ensure it's on your PATH:
```bash
java -version  # Should show Java version
```

### Workspace Linking Issues

If packages can't find each other:
1. Ensure you're running commands from the root
2. Run `npm install` from the root to link workspaces
3. Verify workspaces in `package.json`

## Environment Variables

### Web App (Build Time)

Set these in your CI/CD secrets or `.env` file:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_AI_REFINEMENT_ENDPOINT` (optional)
- `VITE_AI_REFINEMENT_ENABLED` (optional)

### Functions (Runtime)

Set in Firebase Functions config:

- `VERTEX_AI_PROJECT_ID`
- `VERTEX_AI_LOCATION`
- `OPEN_CHARGE_MAP_API_KEY`

## Contributing

1. Create a feature branch
2. Make your changes
3. Ensure tests pass: `npm run test`
4. Ensure build succeeds: `npm run build`
5. Submit a pull request

## License

Private - All rights reserved
