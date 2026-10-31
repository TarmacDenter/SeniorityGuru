# app/utils/

Search here for an existing helper before writing one.

## Persistence

`db.ts` owns the Dexie schema. Add a new version block for every schema change. Preserve all existing version blocks and their order.

- `seniorityLists` stores list metadata.
- `seniorityEntries` stores pilot rows linked by `listId`.
- `preferences` stores user settings as key-value pairs.

`db.ts` and `db-adapters.ts` are the only utils that touch Dexie. Stores call them.

## Validation

Zod schemas in `schemas/` validate data at the upload boundary. Derive types from the schemas and let downstream code use the validated domain types. Import parsing lives in `import-pipeline/` (read [docs/import-plugins.md](../../docs/import-plugins.md) first).

## Seniority analysis

`seniority.ts` is the public barrel. Everything outside `app/utils/` imports seniority analysis from `~/utils/seniority`.

```
seniority-analysis/math, growth  →  seniority-engine/  →  seniority-analysis/presentation
        (calculations)                (context)                  (labels)
              all wrapped by seniority-api/ and exported through seniority.ts
```

These layers receive validated `SeniorityEntry` values and never touch stores or Dexie. Read the layer's `AGENTS.md` before editing: [engine](seniority-engine/AGENTS.md), [analysis](seniority-analysis/AGENTS.md), [api](seniority-api/AGENTS.md).

## Other helpers

- `date/` and `temporal.ts` hold date arithmetic on Temporal values ([ADR 0005](../../docs/adr/0005-defer-full-temporal-migration.md)).
- `seniority-compare.ts` and `build-diff-rows.ts` compare two lists.
