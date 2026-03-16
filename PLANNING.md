# Planning — Pilot Seniority Tracker

## Decisions

- **List uploads**: Users upload their own bespoke data. Moderation by airline reps is a future feature.
- **Airline scope**: Single airline per user. Users can only access their own data. RLS enforces this.
- **Public views**: Public landing page at `/`; all data routes behind auth.
- **Signup model**: Open beta — anyone can sign up. No invite codes or manual approval required.
- **Monetization**: Free for now. No paid tiers.

---

## Core Features

- [x] Auth (sign up, login, confirm, profile setup)
- [x] Upload / import seniority list (CSV/XLSX)
- [x] Master seniority list view with user's position highlighted
- [x] Seniority trajectory over time (chart by year)
- [x] Base/seat breakdown — seniority rank per base
- [x] Retirement projections — age 65 retirements by year

---

## Roadmap

### Next Up

- [x] User settings page (edit airline, employee number, retirement age, change password)
- [x] Seniority list management — sidebar nav link to a "My Lists" page showing all uploaded lists; each list supports inline edit of title (airline label) and effective date, and a delete action; requires owner UPDATE + DELETE RLS policies on `seniority_lists`
- [x] Upload error navigation — when upload completes with data errors, the error count is a clickable link that navigates to the affected rows, with a human-readable message describing each validation failure
- [x] Public landing page

### Before Public Beta

- [ ] Polish & UX pass (loading states, empty states, error boundaries, mobile layout review)
- [ ] Security audit (review all RLS policies, server route auth guards, and input validation)
- [ ] Separate prod Supabase project (currently sharing a single project for dev and prod)
- [ ] Upcoming retirements table (pilots senior to user retiring in next 1–5 years)
- [ ] Data export (CSV/PDF of personal seniority data and projections)

### Post-Launch

- [ ] Historical trend tracking (user's actual rank across multiple uploaded lists over time)
- [~] Admin panel + role-based navigation (basic admin users page exists; nav + full role-gating incomplete)
- [ ] Moderator tools (airline rep list approval workflow)
- [ ] Notification preferences (new list uploads, retirement milestones)
- [ ] Saved scenarios / bookmarks (quick-switch base/seat/fleet comparisons)
- [ ] Advanced analytics (cohort analysis, attrition forecasting, fleet capacity) — see `docs.local/roadmap.md`

---

## RLS Notes

Data isolation is by `uploaded_by` (who uploaded the list), not by airline. Each user only sees their own uploads — correct for the "users upload their own bespoke data" model.

All tables have owner-scoped SELECT, INSERT, UPDATE, and DELETE policies. Staff (admin/moderator)
policies exist where cross-user operations are needed. See `supabase/migrations/` for current definitions.

---

## Greenfield Status

This project has **no production users**. There is zero migration burden and zero backwards-compatibility
risk. DB schema changes, Zod schema changes, and TypeScript type changes are all low-risk. Agents and
contributors should feel free to propose and implement schema improvements without hesitation — write
the migration and update the generated types.

---

## Database Schema

```sql
-- airlines (reference table — loaded from CSV via npm run db:seed-airlines)
icao text primary key
iata text
name text not null
alias text  -- alternate/common name

-- profiles (extends auth.users)
id uuid references auth.users primary key
role user_role default 'user'
icao_code text references airlines(icao) on delete set null
employee_number text
mandatory_retirement_age integer default 65
created_at timestamptz

-- seniority_lists
id uuid primary key
airline text
effective_date date
uploaded_by uuid references profiles
status text -- 'active' | 'archived'

-- seniority_entries
id uuid primary key
list_id uuid references seniority_lists
seniority_number integer
employee_number text
name text
hire_date date
base text
seat text -- 'CA' | 'FO'
fleet text
retire_date date  -- age-65 retirement date (no dob stored)
```
