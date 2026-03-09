# User Stories Batch — Design Document

**Date:** 2026-03-09
**Branch:** `feature/user-stories-batch`

## Overview

Five user stories implemented together: seniority list deletion, list comparison, dashboard list selector, admin user management, and invite-only signups.

## User Stories

1. **Delete seniority lists** — Pilot users can delete their own uploaded lists
2. **Compare seniority lists** — Dedicated page to compare two lists: attrition, departures, qual moves, rank changes
3. **Dashboard list selector** — Pick which seniority list to view stats for
4. **Admin user management** — View users, edit roles, invite users, trigger password resets
5. **Invite-only signups** — Disable public signup; only admin-invited users can join

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Delete scope | Users delete own lists | Simple, empowering; new RLS policy |
| Compare UX | Dedicated `/seniority/compare` page | Clean separation from dashboard |
| Compare compute | Client-side composable | Simpler, reuses existing patterns, fine for <10k entries |
| Invite mechanism | Supabase `inviteUserByEmail` | No custom token system needed |
| Admin operations | View + edit roles + invite + password reset | Covers all stated stories |

## Architecture

### Feature 5: Invite-Only Signups
- Replace signup form with invite-only message
- Handle invite token type in `/auth/confirm` (hash fragment parsing)
- Manual Supabase config: disable public signups

### Feature 1: Delete Seniority Lists
- New RLS policy: `seniority_lists: owner delete` (`uploaded_by = auth.uid()`)
- CASCADE handles entry cleanup (RLS not evaluated on cascaded deletes)
- API: `DELETE /api/seniority-lists/[id]` with user-scoped client
- Store: `deleteList(id)` method
- UI: Delete action on RecentListsTimeline

### Feature 3: Dashboard List Selector
- `USelectMenu` dropdown in dashboard toolbar
- Query param `?list=<id>` for deep linking
- `useDashboardStats` already reactive — no composable changes needed

### Feature 4: Admin User Management
- Admin middleware (`auth` + `admin` chain)
- Server utility `requireAdmin()` for all admin routes
- 4 server routes: list users, update role, invite, password reset
- All use `serverSupabaseServiceRole()` (bypass RLS)
- `useSeniorityNav` becomes reactive `ComputedRef` for conditional admin item

### Feature 2: Seniority List Comparison
- `useSeniorityCompare(listIdA, listIdB)` composable
- Fetches entries independently (store holds only one list at a time)
- Diff by `employee_number` across two lists:
  - Retired: absent from newer list, `retire_date <= newer.effective_date`
  - Departed: absent from newer list, not retired
  - Qual moves: `seat`/`fleet`/`base` changed
  - Rank changes: `seniority_number` delta
  - New hires: in newer list only

## Implementation Order

```
5 (Invite-Only) → 1 (Delete) → 3 (List Selector) → 4 (Admin) → 2 (Compare)
```
