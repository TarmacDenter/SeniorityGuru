# Planning — Pilot Seniority Tracker

## Decisions

- **Local-first:** All seniority data lives in the user's browser via IndexedDB (Dexie). No server, no accounts, no cloud sync.
- **List uploads:** Users upload their own bespoke data. No shared pool or airline-verified lists.
- **Airline scope:** Single airline per user session. Lists are isolated per device.
- **Public access:** No auth. The app is fully usable without signing up.
- **Monetization:** Free for now. No paid tiers.

---

## Core Features

- [x] Upload / import seniority list (CSV/XLSX)
- [x] Master seniority list view with user's position highlighted
- [x] Seniority trajectory over time (chart by year)
- [x] Base/seat breakdown — seniority rank per base
- [x] Retirement projections — age 65 retirements by year
- [x] User settings (employee number, retirement age)
- [x] Seniority list management — view, edit, delete uploaded lists
- [x] List comparison with diff categories and upgrade tracking
- [x] Public landing page
- [x] PWA — installable, works offline, no account required

---

## Roadmap

### Next Up

- [ ] Polish & UX pass (loading states, empty states, error boundaries, mobile layout review)
- [ ] PWA icon improvements — PNG fallbacks and proper maskable safe zone for iOS
- [ ] Upcoming retirements table (pilots senior to user retiring in next 1–5 years)

### Post-Launch

- [ ] Historical trend tracking (user's actual rank across multiple uploaded lists over time)
- [ ] Data export (CSV/PDF of personal seniority data and projections)
- [ ] Notification preferences (retirement milestones)
- [ ] Saved scenarios / bookmarks (quick-switch base/seat/fleet comparisons)
- [ ] Advanced analytics (cohort analysis, attrition forecasting, fleet capacity)
- [ ] Optional cloud sync (if users want cross-device access — would reintroduce auth)

---

## Data Schema (IndexedDB via Dexie)

Defined in `app/utils/db.ts`. Migrations are Dexie version blocks — never remove a version, always add upgrade() callbacks for structural changes.

```ts
// seniorityLists
id: number (auto)
title: string | null
effectiveDate: string  // ISO date
createdAt: string      // ISO datetime

// seniorityEntries
id: number (auto)
listId: number
seniorityNumber: number
employeeNumber: string
name: string | null
seat: string
base: string
fleet: string
hireDate: string
retireDate: string

// preferences
key: string (primary)
value: any
```

---

## Migration Notes

The app was originally built on Supabase (Postgres + Auth + server routes). In March 2026 it was rewritten as a fully local-first PWA. Key things that are now gone:

- Supabase auth, profiles, and RLS policies
- Nitro server routes (`server/api/`)
- Admin panel and role-based access control
- Invite-only signup flow
- `shared/` directory (moved to `app/utils/`)

If a future version reintroduces cloud sync, the Dexie schema is the source of truth to map from.
