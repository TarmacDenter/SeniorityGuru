# Contributing to SeniorityGuru

Thank you for your interest in contributing! This guide focuses on adding airline-specific parsers, which is the most common type of contribution.

## Project Overview

SeniorityGuru is a **local-first PWA** for airline pilots to track seniority standing. There is no server, no authentication, and no accounts -- all data lives in the user's browser via IndexedDB.

- **Stack:** Nuxt 4 + Dexie.js (IndexedDB) + Vercel
- **Runtime:** Node.js / pnpm (not npm or Bun)
- **Setup:** `pnpm install && pnpm dev` -- no Docker, no database

See [CLAUDE.md](CLAUDE.md) for full architecture rules and code conventions.

## Parser System Overview

SeniorityGuru uses a **pre-parser plugin system** to normalize airline-specific seniority list formats into a standard column layout. Each parser implements the `PreParser` interface and transforms raw spreadsheet rows before the common upload pipeline processes them.

The flow:

```
Raw CSV/XLSX rows
  --> PreParser.parse()     (airline-specific normalization)
  --> Column mapping         (auto-detect or manual)
  --> Zod validation          (SeniorityEntrySchema)
  --> IndexedDB storage
```

Pre-parsers handle the messy part: header detection, preamble skipping, column renaming, and domain-specific transformations (e.g., splitting a composite "Category" column into Base, Fleet, and Seat).

### The `PreParser` Interface

Every parser implements this interface, defined in `app/utils/parsers/types.ts`:

```ts
interface PreParser {
  readonly id: string           // Unique identifier (e.g., 'delta')
  readonly label: string        // Display name (e.g., 'Delta Air Lines')
  readonly description: string  // One-line summary for the parser picker
  readonly icon: string         // Lucide icon name (e.g., 'i-lucide-graduation-cap')
  readonly formatDescription: string  // Longer description shown during upload
  parse(raw: string[][]): PreParserResult
}

interface PreParserResult {
  rows: string[][]              // Normalized rows with standard header as first row
  metadata: PreParserMetadata
}

interface PreParserMetadata {
  effectiveDate: string | null  // ISO date string extracted from the file
  title: string | null          // List title extracted from preamble
  syntheticIndices?: number[]   // Row indices where data was synthesized
  syntheticNote?: string        // Human-readable note about synthesized data
}
```

### Standard Column Format

After pre-parsing, the first row should contain these standard column headers:

| Column | Required | Description |
|--------|----------|-------------|
| Seniority Number | Yes | Integer rank (1 = most senior) |
| Employee Number | Yes | Unique pilot identifier |
| Seat | Yes | CA (Captain) or FO (First Officer) |
| Base | Yes | Crew base / domicile code |
| Fleet | Yes | Aircraft type |
| Hire Date | Yes | Date the pilot was hired |
| Retire Date | Yes | Projected retirement date |
| Name | No | Pilot name (never leaves the device) |

## Step-by-Step: Adding a New Parser

Use the Delta parser (`app/utils/parsers/delta.ts`) as the reference implementation.

### 1. Create the parser file

Create `app/utils/parsers/<airline>.ts`:

```ts
import type { PreParser, PreParserResult } from './types'

export const <airline>Parser: PreParser = {
  id: '<airline>',
  label: '<Airline Name>',
  description: 'Short description for the parser picker dropdown.',
  icon: 'i-lucide-plane',  // Pick an appropriate Lucide icon
  formatDescription: 'Detailed description of expected file format...',

  parse(raw: string[][]): PreParserResult {
    // 1. Find the header row (skip preamble if present)
    // 2. Extract metadata from preamble rows (effective date, title)
    // 3. Map airline-specific column names to standard names
    // 4. Transform data rows (decompose composite columns, handle missing values)
    // 5. Return normalized rows with standard header + metadata

    return {
      rows: [standardHeaders, ...transformedRows],
      metadata: { effectiveDate, title },
    }
  },
}
```

Key patterns from the Delta parser:

- **Header detection:** Scan rows for a known marker column name. Skip preamble rows above it.
- **Column mapping:** Use a `HEADER_MAP` record to rename airline columns to standard names.
- **Composite columns:** If the airline packs multiple fields into one column (e.g., Delta's Category = Base + Fleet + Seat), split them apart.
- **Missing data:** Set sentinel values for missing required fields and track which rows were affected via `syntheticIndices` in metadata.
- **Date normalization:** Use `normalizeDate` from `~/utils/date` for date parsing.

### 2. Register the parser

Add your parser to `app/utils/parsers/registry.ts`:

```ts
import { <airline>Parser } from './<airline>'

export const parsers: readonly PreParser[] = [
  deltaParser,
  <airline>Parser,  // Add before genericParser
  genericParser,
]
```

Airline-specific parsers should come before `genericParser`, which is always last as the fallback.

### 3. Write tests

Create `app/utils/parsers/<airline>.test.ts` co-located with the parser:

```ts
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { <airline>Parser } from './<airline>'

describe('<airline>Parser', () => {
  it('detects the header row and skips preamble', () => {
    const raw = [
      ['Title Row'],
      [''],
      ['SeniorityNum', 'EmpID', 'Position', ...],  // header
      ['1', '90001', 'CA', ...],                     // data
    ]
    const result = <airline>Parser.parse(raw)
    // Verify header is mapped to standard names
    expect(result.rows[0]).toContain('Seniority Number')
  })

  it('extracts metadata from preamble', () => {
    // ...
  })

  it('maps airline-specific columns to standard format', () => {
    // ...
  })

  it('handles missing or malformed data gracefully', () => {
    // ...
  })

  it('passes through clean data without errors', () => {
    // ...
  })
})
```

**Important:** All test data must be **fabricated**. Never use real pilot names, employee numbers, or data from actual seniority list files.

Test cases to cover:

- Header detection with and without preamble rows
- Metadata extraction (effective date, title)
- Column name mapping
- Composite column decomposition (if applicable)
- Missing or malformed data handling
- Empty input / edge cases
- Passthrough when file doesn't match expected format (return raw rows)

### 4. Run quality gates

All three must pass with zero errors before submitting:

```bash
pnpm lint       # ESLint -- zero errors
pnpm typecheck  # TypeScript strict mode -- zero errors
pnpm test       # Vitest -- all tests pass
```

## Code Conventions

- **TypeScript strict mode** -- no `any` escape hatches without justification
- **Conventional Commits** -- `feat(parser): add <airline> seniority list parser`
- **No real pilot data** -- all test fixtures, comments, and examples must use fabricated data
- **Co-located tests** -- test file lives next to the file it tests
- **Nuxt 4 conventions** -- `~/` maps to `app/`, use Nuxt auto-imports

See [CLAUDE.md](CLAUDE.md) for the full set of architecture rules.

## Submitting a PR

1. **Branch:** Create `feature/parser-<airline>` from `main`
2. **Implement:** Parser file + tests + registry update
3. **Verify:** Run all three quality gates (lint, typecheck, test)
4. **Commit:** Use Conventional Commits format -- `feat(parser): add <airline> seniority list parser`
5. **PR:** Open a pull request to `main` with a description of the airline format and what the parser handles

### PR Checklist

- [ ] Parser implements `PreParser` interface
- [ ] Registered in `registry.ts` (before `genericParser`)
- [ ] Co-located test file with fabricated data
- [ ] All quality gates pass (`pnpm lint && pnpm typecheck && pnpm test`)
- [ ] No real pilot data anywhere in the code
