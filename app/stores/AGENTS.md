# app/stores/

Stores own persistence.

- Every Dexie read and write goes through a store. A write updates the store's reactive state in the same operation.
- Enforce domain invariants before the Dexie write. Composables rely on this check.
- Keep stores independent. A composable coordinates actions that span stores.
- Schema changes belong in `app/utils/db.ts`; read [utils/AGENTS.md](../utils/AGENTS.md) first.
