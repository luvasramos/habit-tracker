# Habit Grid Plan

Habit Grid is a local-only React habit tracker. The app stores a versioned state in `localStorage`, lets one selected habit be edited at a time, and renders the same binary check-ins across Week, Month, and Year views.

## Architecture

- React + TypeScript + Vite with strict TypeScript.
- Plain CSS custom properties for the dark interface.
- `date-fns` only for calendar arithmetic and formatting.
- React Context plus `useReducer` for app state.
- Pure modules for persistence, reducer logic, and calendar generation.
- Vitest and React Testing Library for reducer, persistence, date utility, and core UI tests.

## Implementation Sequence

1. Scaffold the Vite app, strict TypeScript, lint, tests, and build scripts.
2. Add reducer, context provider, versioned persistence, and habit CRUD.
3. Add local date utilities that build keys from local `getFullYear()`, `getMonth()`, and `getDate()`.
4. Implement Week, Month, and Year calendar views on top of the same check-in data.
5. Add roving tab stops for Month and Year grids.
6. Polish responsive layout, focus visibility, dialogs, empty state, and documentation.
7. Configure GitHub Pages deployment with the same production build.

## Risks

- Date keys must not be generated with UTC conversion, because visible local dates can shift.
- Month and Year grids need stable, tested Monday-first alignment.
- Future dates must be disabled in every view and guarded before reducer dispatch.
- Dialogs should rely on native `<dialog>` focus behavior and return focus to their trigger.
- The year heatmap may scroll horizontally inside its own container, but the page should not overflow.

## Validation

Run these before completing changes:

```sh
npm run lint
npm run test
npm run typecheck
npm run build
```
