# Repository Guidelines

## Project Structure & Module Organization
The Express backend lives in `src`. HTTP surfaces are defined in `routes/*.routes.js`, each wired to thin controllers that delegate to `services` for domain logic and `models` for Mongoose schemas. Shared helpers stay under `utils`, while `config` gathers database and security bootstrapping. Frontend code resides in `client/src`; React pages live in `client/src/pages`, reusable widgets in `client/src/components`, and cross-cutting hooks in `client/src/hooks`. Static assets belong in `client/public`. When adding new modules, mirror this layering so features remain discoverable.

## Build, Test & Development Commands
Install dependencies once with `npm install` at the repository root and `cd client && npm install` for the React workspace. During backend work run `npm run dev` (nodemon reloads on changes); `npm start` serves the compiled API. `npm run build` installs client deps and produces the production bundle under `client/build`. For React development run `cd client && npm start`; production bundles use `npm run build`. Keep `.env` files present before launching either server, otherwise MongoDB and OAuth flows will fail.

## Coding Style & Naming Conventions
Follow the prevailing two-space indentation and single quotes on the backend, camelCase variables/functions, and PascalCase React components. Export named functions from services (`settleOperation`) and default React components only when a file owns a single view. Route, controller, and model filenames follow `feature.type.js` (e.g. `operations.controller.js`). In the client prefer TypeScript, Tailwind utility classes, and hooks for shared state (see `useNotifications`, `useDashboardBalances`). Co-locate component-specific styles or helpers beside the component.

## Testing Guidelines
Node unit tests live in `tests/unit`, mirroring `src`. Run them via `npm run test:unit`; they rely on the built-in Node test runner and `mongodb-memory-server` for isolated persistence. Playwright specs for end-to-end coverage live under `tests/e2e` and execute with `npm run test:e2e`. React continues to use the CRA testing stack: `cd client && npm test`. When introducing asynchronous flows, add regression tests that mock network layers and assert event emissions.

## Commit & Pull Request Guidelines
Commits follow Conventional Commit prefixes (`feat:`, `fix:`, `chore:`) matching the existing history. Keep subject lines imperative and under 72 characters, and group related backend and client updates together when they share behavior. Pull requests should describe the user impact, list manual or automated tests (`npm run test:unit`, `playwright test`, `client npm test`), and attach UI screenshots or recordings for visual changes. Link Jira or GitHub issues and request reviewers from the backend or frontend owners depending on touched areas.

## Security & Configuration Notes
Secrets enter through `.env` files; never commit them. When adding new configuration flags, document defaults in `src/config` and update onboarding docs if behavior changes. Use the shared logging helpers in `utils` for audit trails, scrub PII before logging, and ensure new endpoints enforce the same `auth` and permission middleware applied in existing routes.
