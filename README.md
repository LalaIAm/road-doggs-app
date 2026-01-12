# RoadDoggs

AI-powered road trip planning platform built with React.

## Project Structure

This is a monorepo containing:

- `apps/web` - Main React web application
- `packages/ui` - Shared UI components (future)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

To build for production:
```bash
npm run build
```

To preview the production build:
```bash
npm run preview
```

## Tech Stack

- **React 18+** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Phosphor Icons** - Icon library

## Development

The landing page is located at `apps/web/src/pages/LandingPage.jsx` and is composed of multiple section components in `apps/web/src/components/`.
