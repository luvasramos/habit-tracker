# Habit Grid

Habit Grid is a small local-only habit tracker built with React, TypeScript, and Vite. Add a habit, select it, and mark completed days in Week, Month, or Year views. The Year view is a compact GitHub-style heatmap.

## Scope

The MVP is intentionally personal and browser-only. There is no login, backend, cloud sync, reminders, schedules, goals, streaks, notes, charts, categories, sharing, or PWA installation.

## Data Storage

Data is stored in `localStorage` under `habit-grid:v1`. Check-ins are keyed by habit ID and local calendar dates in `YYYY-MM-DD` format. Date keys are generated from local date parts, not UTC ISO strings, to avoid one-day shifts.

Clearing browser storage removes all habits and check-ins.

## Commands

```sh
npm install
npm run dev
npm run lint
npm run test
npm run typecheck
npm run build
```

## Interaction

- Add habit creates and selects a habit automatically.
- Habit tabs select the active habit.
- Edit habit can rename or delete the selected habit.
- Deleting requires confirmation and removes that habit's check-ins.
- Week shows Monday through Sunday.
- Month uses a fixed Monday-first six-row grid.
- Year shows the full selected calendar year with weeks as columns.
- Past dates and today can be toggled.
- Future dates are disabled.
- Month and Year support arrow-key navigation with a roving tab stop.

## GitHub Pages

The repository includes `.github/workflows/deploy.yml` for GitHub Pages. In the repository settings, set Pages to deploy from GitHub Actions. The workflow runs lint, tests, type checking, and the production build, then publishes `dist`.

The Vite base path uses `/habit-tracker/` when `GITHUB_PAGES=true` so project-page assets resolve correctly for `luvasramos/habit-tracker`.
