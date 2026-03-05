Reset and seed the local Supabase database.

1. Run `npx supabase db reset` to drop and recreate the local database and apply all migrations.
2. Run `npm run db:seed` to seed airlines, test users, and seniority data.
3. Confirm both commands succeeded and summarize what was seeded:
   - Admin user: admin@test.local / admin1234
   - Test user: test@test.com / password (DAL pilot, seniority #500 of 1000)
   - Airlines loaded from CSV
   - 1000 seniority entries for Delta Air Lines (DAL), effective 2026-01-01
