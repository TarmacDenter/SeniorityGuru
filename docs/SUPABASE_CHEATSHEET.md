# Supabase Cheat Sheet

## Local Instance (Docker)

```bash
npm run db:start              # Start local Supabase (Docker)
npm run db:stop               # Stop local Supabase (alias: supabase stop)
npm run db:restart             # Stop + start
npm run db:reset               # Reset DB: re-apply all migrations + seed.sql, then regenerate types
```

**Local dashboard:** http://127.0.0.1:54323

**Local connection string:** `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

---

## Migrations

### Create

```bash
supabase migration new <name>  # Creates supabase/migrations/<timestamp>_<name>.sql
```

Write your DDL in the generated file, then apply locally:

```bash
npm run db:reset               # Re-applies all migrations from scratch
# or
supabase db push --local       # Applies only unapplied migrations to running local instance
```

### Check Status

```bash
supabase migration list --local           # Local migration history
supabase migration list --project-ref <ref>  # Remote migration history
```

### Push to Remote

```bash
supabase db push --project-ref <ref>      # Push unapplied migrations to remote
supabase db push --project-ref <ref> --dry-run  # Preview without applying
```

> Automated: the `migrations.yml` GitHub workflow pushes automatically when migration files change on `dev`.

### Pull from Remote (if schema was edited in dashboard)

```bash
supabase db pull --project-ref <ref>      # Generate migration from remote diff
```

---

## Type Generation

```bash
npm run db:types               # Local: regenerate shared/types/database.ts
supabase gen types typescript --project-id <ref> > shared/types/database.ts  # From remote
```

---

## Seeding

```bash
npm run db:seed-airlines       # Seed airlines table (local, uses .env)
npm run db:seed-airlines:prod  # Seed airlines table (remote, uses .env.prod)
npm run db:seed-users          # Seed test users (local)
npm run db:seed-seniority      # Seed seniority data (local)
npm run db:seed-dev            # Run all dev seeds
```

Seed SQL runs automatically on `db:reset` via `supabase/seed.sql`.

---

## Remote Project Info

| Field | Value |
|---|---|
| Project ref | `nrvrybznzekwseprilqt` |
| Region | `us-east-1` |
| Dashboard | https://supabase.com/dashboard/project/nrvrybznzekwseprilqt |

---

## SQL (Remote via CLI)

```bash
# Run arbitrary SQL against remote
supabase db execute --project-ref <ref> "SELECT * FROM profiles LIMIT 5;"

# Or use psql directly
psql "postgresql://postgres:<password>@db.nrvrybznzekwseprilqt.supabase.co:5432/postgres"
```

---

## Auth Helpers (in code)

### Client-side

```ts
const user = useSupabaseUser()       // JWT claims (use user.value.sub for UUID)
const session = useSupabaseSession()
const client = useSupabaseClient()
```

### Server-side (Nitro routes)

```ts
const user = await serverSupabaseUser(event)          // JWT claims
const client = await serverSupabaseClient(event)      // User-scoped, respects RLS
const admin = await serverSupabaseServiceRole(event)  // Bypasses RLS (admin only)
```

### Key gotcha

- Use `user.sub` for user UUID — NOT `user.id`
- Use `user.user_metadata?.email_verified` — NOT `user.email_confirmed_at`

---

## RLS Policy Patterns

```sql
-- Owner-only read
CREATE POLICY "table: owner select"
  ON public.table_name FOR SELECT
  USING ((select auth.uid()) = user_id);

-- Owner-only write
CREATE POLICY "table: owner insert"
  ON public.table_name FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- Staff access (uses security definer helper)
CREATE POLICY "table: staff select"
  ON public.table_name FOR SELECT
  USING (public.get_my_role() IN ('admin', 'moderator'));
```

> Always wrap `auth.uid()` in `(select ...)` to avoid per-row re-evaluation.

---

## Common Queries (JS client)

```ts
// Fetch with pagination (always use fetchAllRows for large tables)
const data = await fetchAllRows(
  supabase.from('seniority_entries').select('*').eq('list_id', id)
)

// Single row
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single()

// Insert
const { error } = await supabase
  .from('seniority_lists')
  .insert({ airline_icao: 'DAL', uploaded_by: user.sub })

// Upsert
const { error } = await supabase
  .from('profiles')
  .upsert({ id: user.sub, display_name: 'Pilot' })
```

---

## Environment Variables

```bash
# .env (local)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=<local anon key>
SUPABASE_SECRET_KEY=<local service role key>

# .env.prod (remote)
SUPABASE_URL=https://nrvrybznzekwseprilqt.supabase.co
SUPABASE_KEY=<remote anon/publishable key>
SUPABASE_SECRET_KEY=<remote service role key>
```

### Key format gotcha

Supabase now issues two formats per key type:

| Format | Example prefix | Used by |
|---|---|---|
| Legacy JWT | `eyJhbGci...` | Supabase JS client (`createClient`) |
| New format | `sb_publishable_...` / `sb_secret_...` | Supabase Management API |

**The JS client requires the legacy JWT keys.** The `sb_secret_...` and `sb_publishable_...` keys will cause "Invalid API key" errors with `createClient`. Use the JWT versions from Dashboard → Settings → API.

---

## Useful Dashboard Pages

- **Table Editor:** /project/nrvrybznzekwseprilqt/editor
- **SQL Editor:** /project/nrvrybznzekwseprilqt/sql
- **Auth Users:** /project/nrvrybznzekwseprilqt/auth/users
- **RLS Policies:** /project/nrvrybznzekwseprilqt/auth/policies
- **API Settings (keys):** /project/nrvrybznzekwseprilqt/settings/api
- **Logs:** /project/nrvrybznzekwseprilqt/logs/explorer
