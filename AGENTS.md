# Repository Instructions

## Product Scope

Habit Grid is a focused browser-only habit tracker. It supports adding, selecting, renaming, and deleting habits, plus binary daily check-ins across Week, Month, and Year views. It intentionally excludes accounts, sync, reminders, schedules, goals, streaks, notes, charts, sharing, themes, routers, and backend services.

## Structure

- `src/state/` contains reducer, context, types, and persistence.
- `src/utils/` contains local date and calendar generation utilities.
- `src/components/` contains small semantic React components.
- `src/styles.css` contains the plain CSS token system and responsive layout.
- `.github/workflows/deploy.yml` deploys the static build to GitHub Pages.

## Commands

- `npm run dev` starts Vite locally.
- `npm run lint` runs ESLint.
- `npm run test` runs Vitest.
- `npm run typecheck` runs strict TypeScript checking.
- `npm run build` runs type checking and creates the production build.

## Rules

- Use local calendar date keys built from `getFullYear()`, `getMonth()`, and `getDate()`.
- Do not use `toISOString().slice(0, 10)`, `new Date("YYYY-MM-DD")`, or `Date.parse("YYYY-MM-DD")` for check-in dates.
- Avoid unrequested product features and dependencies.
- Keep the UI restrained, dark, and utility-focused.
- Run lint, tests, type checking, and build before considering a task complete.
