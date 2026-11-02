# app/

`~/` resolves to `app/`.

## Data flow

```
Component → composable → store → Dexie
                ↓
        ~/utils/seniority   (seniority analysis, read-only)
```

| Layer | Owns | Rules |
|---|---|---|
| `components/`, `pages/` | rendering | [components](components/AGENTS.md), [pages](pages/AGENTS.md) |
| `composables/` | coordination across stores and the analysis facade | [composables](composables/AGENTS.md) |
| `stores/` | Dexie reads and writes, domain invariants | [stores](stores/AGENTS.md) |
| `utils/` | Dexie schema, Zod schemas, seniority analysis, pure helpers | [utils](utils/AGENTS.md) |

Each layer talks to the one next to it. Reach a lower layer through the layer above it.

This holds during UI refactors and redesigns too. A visual change never moves logic into a template.

- **Display logic is not component code.** Sorting, grouping, filtering, excerpts, number and percent formatting, label wording, and old-route mapping live in composables or the facade's `presentation` values. A component renders what it receives.
- **Shared state has one owner.** Scenario state (Qualification Scope, As-of Date, Growth Assumptions) lives in a composable that panels share. Panels do not keep their own copies.
- **Lint enforces the imports.** `pnpm lint` fails when a component or page imports a store, `~/utils/db`, or seniority internals. Do not disable the rule.
- **Check before finishing.** This must also print nothing (test files are excluded):

  ```
  grep -rnE "from '(~|@)/(stores|utils/db|utils/seniority-(engine|analysis|api))|from '~/stores|use[A-Za-z]+Store\(" app/components app/pages --include=*.vue --include=*.ts | grep -v '\.test\.'
  ```

  If it prints a line, move that code to a composable or the facade. Do not add an exception.

## Nuxt conventions

- Use Nuxt navigation and route composables rather than direct Vue Router imports.
- Use Nuxt UI components and semantic UI tokens (`text-muted`, `text-highlighted`) for interface primitives and theme-aware styling.
