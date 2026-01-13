# Agent guidelines (RoadDoggs)

This repo is an **npm workspaces** monorepo with a Vite + React web app.

## Quick start

- **Install**: `npm install`
- **Dev** (web): `npm run dev` (runs `apps/web`, typically on `http://localhost:5173`)
- **Build**: `npm run build`
- **Preview build**: `npm run preview`

## Repo structure

- **`apps/web/`**: Main React app (Vite + Tailwind + React Router)
  - **Entry**: `apps/web/src/main.jsx`
  - **Routing**: `apps/web/src/App.jsx`
  - **Landing page**: `apps/web/src/pages/LandingPage.jsx`
  - **Landing sections**: `apps/web/src/components/*Section.jsx`
  - **Hooks**: `apps/web/src/hooks/`
  - **Styling**: Tailwind in components; custom CSS utilities in `apps/web/src/index.css`
- **`packages/ui/`**: Shared UI package (currently a stub; add components + exports here when needed)
- **`designs/`**: HTML/JPG design references for screens (use for visual parity)
- **`prd.md`**: Product requirements and longer-term scope

## Conventions to follow

- **Code style**: Match existing patterns (React function components, single quotes, minimal punctuation, Tailwind-first styling).
- **Components**: Prefer small presentational components under `apps/web/src/components/` and compose in pages under `apps/web/src/pages/`.
- **Routing**: Add routes in `apps/web/src/App.jsx` using `react-router-dom`.
- **CSS**: Keep bespoke CSS in `apps/web/src/index.css` only when Tailwind is awkward (utilities/animations). Otherwise use Tailwind classes.

## Dependency management (workspaces)

- Add web-only deps with:
  - `npm install <pkg> --workspace=apps/web`
- Add shared deps at the root only when multiple workspaces need them.

## “Definition of done” for changes

- **Build passes**: run `npm run build` (at repo root).
- **No broken UI**: verify the landing page still renders and routes load.
- **Keep changes scoped**: avoid unrelated refactors; update docs when behavior/commands change.

