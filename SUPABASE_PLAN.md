# Supabase Migration Plan

This project is not connected to Supabase yet. Habit Grid continues to use the localStorage-backed `HabitStore` implementation. The new persistence boundary is intended to let a future Supabase store be added without changing calendar, habit, or statistics UI code.

## Environment Variables

Future Supabase builds should read these Vite variables:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Do not commit real values. Use `.env.local` for local credentials.

## Planned Auth

- Use Supabase Auth with email magic links.
- No password login in the first sync migration.
- Anonymous/local-only use should remain possible until the user explicitly signs in and chooses to sync.

## Planned Tables

### `habits`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key. Can reuse imported local habit IDs when valid UUIDs, otherwise map during migration. |
| `user_id` | `uuid` | References `auth.users.id`; required for synced rows. |
| `name` | `text` | Trimmed habit name, max 40 characters in the app. |
| `created_at` | `timestamptz` | Creation instant. |
| `updated_at` | `timestamptz` | Updated by trigger or application write. |

Suggested constraints:

- Primary key on `id`.
- Index on `(user_id, created_at)`.
- Optional unique index on `(user_id, lower(name))` if duplicate prevention should be enforced server-side.

### `habit_checkins`

| Column | Type | Notes |
| --- | --- | --- |
| `habit_id` | `uuid` | References `habits.id` with cascade delete. |
| `user_id` | `uuid` | References `auth.users.id`; duplicated for simple RLS checks. |
| `date_key` | `date` | Local calendar date. The app must keep building date keys from local date parts. |
| `created_at` | `timestamptz` | Creation instant. |

Suggested constraints:

- Primary key on `(habit_id, date_key)`.
- Index on `(user_id, date_key)`.
- Cascade delete check-ins when a habit is deleted.

## Planned Row Level Security

Enable RLS on both tables.

### `habits`

- `SELECT`: authenticated users can read rows where `user_id = auth.uid()`.
- `INSERT`: authenticated users can insert rows where `user_id = auth.uid()`.
- `UPDATE`: authenticated users can update rows where `user_id = auth.uid()`.
- `DELETE`: authenticated users can delete rows where `user_id = auth.uid()`.

### `habit_checkins`

- `SELECT`: authenticated users can read rows where `user_id = auth.uid()`.
- `INSERT`: authenticated users can insert rows where `user_id = auth.uid()` and the referenced habit belongs to `auth.uid()`.
- `UPDATE`: avoid general updates if check-ins remain binary; prefer insert/delete. If needed, restrict to `user_id = auth.uid()`.
- `DELETE`: authenticated users can delete rows where `user_id = auth.uid()`.

## Migration From localStorage

1. Keep the existing `habit-grid:v1` localStorage shape as the source of truth until the user signs in.
2. Add a Supabase-backed implementation of `HabitStore`, or a composed store that reads localStorage first and syncs remotely after auth.
3. On first successful magic-link sign-in, inspect localStorage for `habit-grid:v1`.
4. If remote data is empty, upload local habits and check-ins.
5. If remote data exists, present a merge choice before writing:
   - keep remote
   - upload local as additions
   - replace remote with local
6. Map local habit IDs to Supabase UUIDs if needed and preserve check-ins under the mapped IDs.
7. Keep a local backup key until sync is confirmed.
8. After successful sync, continue writing through the store abstraction so local cache and Supabase can stay consistent.

## Non-Goals For This Preparation

- No Supabase package is installed yet.
- No Supabase client is created.
- No login UI is added.
- No network sync is attempted.
- GitHub Pages deployment remains static.
