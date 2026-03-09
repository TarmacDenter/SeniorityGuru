# Planning — Pilot Seniority Tracker

## Decisions

- **List uploads**: Users upload their own bespoke data. Moderation by airline reps is a future feature.
- **Airline scope**: Single airline per user. Users can only access their own data. RLS enforces this.
- **Public views**: Public landing page at `/`; all data routes behind auth.
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
- [ ] Public landing page

### Future

- [ ] Upcoming retirements table (pilots senior to user retiring in next 1-5 years)
- [ ] Historical trend tracking (user's actual rank across multiple uploaded lists over time)
- [ ] Data export (CSV/PDF of personal seniority data and projections)
- [ ] Admin panel + role-based navigation
- [ ] Moderator tools (airline rep list approval workflow)
- [ ] Notification preferences (new list uploads, retirement milestones)
- [ ] Saved scenarios / bookmarks (quick-switch base/seat/fleet comparisons)
- [ ] Advanced analytics (cohort analysis, attrition forecasting, fleet capacity)

---

## RLS Notes

Data isolation is by `uploaded_by` (who uploaded the list), not by airline. Each user only sees their own uploads — correct for the "users upload their own bespoke data" model.

**Current gaps:**
- Users cannot delete their own seniority lists — only staff (admin/moderator) can. Need owner DELETE policy on `seniority_lists`.
- Users cannot update/archive their own lists — only staff can. Need owner UPDATE policy on `seniority_lists`.
- These policies are required before the "list management" feature can work for regular users.

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
