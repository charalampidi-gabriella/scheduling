# Rippner Scheduling — Cloudflare Pages + D1

Static frontend (`public/index.html`) + Pages Functions (`functions/api/*`) + D1 (SQLite).
The frontend used to write to `localStorage`; it now writes through `/api/state/:key` to a D1 KV table.

## One-time setup

Run from `scheduling/`:

```powershell
# 1. Create the D1 database — copy the printed database_id
npx wrangler d1 create rippner-scheduling

# 2. Paste the database_id into wrangler.toml (database_id field)

# 3. Apply schema (remote = production DB)
npx wrangler d1 execute rippner-scheduling --remote --file schema.sql

# 4. Apply schema locally too (for `wrangler pages dev`)
npx wrangler d1 execute rippner-scheduling --local --file schema.sql
```

## Local dev

```powershell
npx wrangler pages dev
```

Opens at http://localhost:8788. Local D1 is a separate SQLite file under `.wrangler/`.

## Deploy

First time:
```powershell
npx wrangler pages deploy public --project-name rippner-scheduling
```

This creates a Pages project. Subsequent deploys can be wired to git (Cloudflare dashboard → Pages → Connect to Git) or stay manual with the same command.

## Migrating your existing localStorage data

1. Open the deployed site once — you'll see a yellow banner: "Local data found in this browser. Import?"
2. Click **Import to Cloud**. The page pushes the 4 keys from your browser's localStorage into D1, then reloads.
3. From any other device/browser, the data is now there.

The banner only appears when the cloud DB is empty AND your browser has the old keys, so you won't get nagged after migration.

## Data model

Single table `kv` with four rows (one per key):

| key                | shape |
|--------------------|-------|
| `current_schedule` | `{ "<coachId>_<dayIdx>": { morning, evening } }` |
| `drafts`           | `[{ id, name, schedule, createdAt }]` |
| `locks`            | `{ coaches: [coachId], shifts: ["<cid>_<day>_<shift>"] }` |
| `requests`         | `[{ id, coachId, type, shift, action, days, loc, note, status, createdAt }]` |

`coach_scope_v1` (which scope is open) stays in browser localStorage — it's a per-device UI preference.

## API

- `GET  /api/state` → returns all 4 keys as a single JSON object.
- `GET  /api/state/:key` → returns one key.
- `PUT  /api/state/:key` → body = JSON value to store. Writes are debounced 250ms client-side.

Allowed keys: `current_schedule`, `drafts`, `locks`, `requests`.

## Auth

None right now — anyone with the URL can edit. Two ways to add it later:

- **Cloudflare Access** (recommended): Pages dashboard → app → Settings → Access. Free for ≤50 users. Email allowlist + Google login. No code changes needed.
- **Custom**: add a `_middleware.js` in `functions/` that checks a header / cookie before letting requests through.

## Concurrency

Last-write-wins on the whole key. Two admins editing different parts of the schedule simultaneously can clobber each other (each PUT replaces the entire `current_schedule` blob). Fine at this scale; if it becomes a problem, switch to row-level updates against per-coach-day rows.
