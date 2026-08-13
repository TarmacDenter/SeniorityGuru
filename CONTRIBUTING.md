# Contributing to SeniorityGuru

SeniorityGuru is a local-first Nuxt application. It stores all user data in the browser through IndexedDB.

Use pnpm. Read [WORKFLOW.md](WORKFLOW.md) before creating a branch or pull request.

## Import plugins

An Upload Type selects a compiled-in Import Plugin. The application never infers an Upload Type or falls back to Generic spreadsheet. Read the [Import Plugin guide](docs/import-plugins.md) before changing an import plugin.

## Contribution checklist

- Use fabricated spreadsheet fixtures. Never add real pilot data.
- Keep tests beside the code they cover.
- Use Conventional Commit messages.
- Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` before opening a pull request.
