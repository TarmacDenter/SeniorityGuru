---
name: seniority-review
description: Review SeniorityGuru code for architecture boundaries, Nuxt conventions, domain design, and maintainable style.
disable-model-invocation: true
---

# SeniorityGuru code review

Review code when the user asks for a code review. Inspect the requested commit, branch, pull request, or diff. If the user gives no target, review the current working-tree diff.

## Review process

1. Establish the review target and list the changed files. Treat the current user request as the highest-priority review requirement.
2. Read the applicable `AGENTS.md`, `CONTEXT.md`, and documents that those files reference. Use project documentation as the convention authority.
3. Report documentation conflicts only when they affect the reviewed code. Name the conflicting sources and explain which source you followed.
4. Inspect changed files, their relevant dependencies, and neighboring modules. Do not limit the review to changed lines when architecture requires broader context.
5. Review in this order:
   - Layer boundaries and data flow.
   - Domain design and deep modules with shallow interfaces.
   - Nuxt conventions and type design.
   - Schemas, validation, and domain types.
   - Code size, duplication, and abstraction choices.
   - Tests and maintainability.
6. Run targeted tests, lint, and typecheck when they can provide useful evidence. Use the repository's configured commands.
7. Report only actionable violations or likely defects. Report pre-existing issues only when the change introduces them, worsens them, or materially depends on them.
8. Stop when every changed file and every applicable review rule has been checked, and the relevant verification commands have completed or their limitation is recorded.

## Review rules

### Boundaries

- Keep the data flow shallow: `Component → composable → store → Dexie`.
- Components and pages use composables. They do not import Pinia stores or `~/utils/db`.
- Stores own Dexie reads and writes. A write updates the store's reactive state in the same operation.
- Stores do not import other stores. A composable coordinates actions that span stores.
- Keep large blocks of domain logic out of components and pages.
- Keep pure analytics in `app/utils/seniority-engine/`. It accepts validated domain values and does not access stores or Dexie.

### Nuxt and TypeScript

- Prefer Nuxt navigation and route composables over direct Vue Router imports.
- Prefer Nuxt UI components and semantic UI tokens for interface primitives and theme-aware styling.
- Prefer inferred typings over unnecessary type assertions or casts.
- Use a type assertion only when the boundary or invariant is explicit and the assertion is the narrowest safe expression.

### Schemas and domain types

- Use Zod at upload and other untrusted-data boundaries when reasonable.
- Derive types from Zod schemas when the schema is the source of truth.
- Keep downstream code on validated domain types.
- Preserve the separation between import parsing, validation, domain logic, and UI concerns.

### Design quality

- Prefer the smallest change that solves the stated problem.
- Flag code bloat, speculative abstractions, and abstractions without a demonstrated second use.
- Look for deep domain modules with shallow interfaces.
- Flag duplicated logic when a single source of truth would be clearer and safer.
- Treat existing patterns as evidence, not authority, when they conflict with documented conventions.
- Report subjective style preferences only when a documented convention or repeated, coherent project pattern supports them.

## Findings

Use one finding per issue. Include:

- Severity: `blocking`, `high`, `medium`, or `low`.
- File and line reference.
- The violated convention or design rule.
- The concrete impact.
- A specific remediation.
- Test or reproduction evidence when applicable.

Use stable file-and-line references. Order findings from highest to lowest severity.

Do not modify source files. Do not invent findings to fill the report.

When no actionable issues remain, state that no findings were found. Then summarize the reviewed scope, conventions applied, and checks run.
