# Adding a New Seniority List Parser

This guide covers how to add a new airline-specific pre-parser to the upload pipeline.

## Architecture

Pre-parsers sit between the raw spreadsheet upload and the generic validation pipeline:

```
User uploads CSV/XLSX
       |
  raw string[][]
       |
  PreParser.parse(raw)            <-- your code goes here
       |
  PreParserResult { rows, metadata }
       |
  Generic pipeline (Zod validation, column mapping, Dexie storage)
```

A pre-parser normalizes airline-specific formats INTO the standard format. It does NOT validate entries — that happens downstream via `SeniorityEntrySchema`.

## Files to create

1. `app/utils/parsers/<airline>.ts` — parser implementation
2. `app/utils/parsers/<airline>.test.ts` — co-located tests

Then register your parser in `app/utils/parsers/registry.ts`.

## Implementing the `PreParser` interface

```ts
import type { PreParser, PreParserResult } from './types'

export const myAirlineParser: PreParser = {
  id: 'my-airline',            // unique slug
  label: 'My Airline',         // display name in dropdown
  description: 'Short description of the format.',
  icon: 'i-lucide-plane',     // Lucide icon name
  formatDescription: 'Detailed format description shown to users.',

  parse(raw: string[][]): PreParserResult {
    // Transform raw → standardized rows + metadata
  },
}
```

## Using the Date API

All date operations go through `~/utils/date`. **Never use `new Date()` or import `dayjs` directly** — the date module is the sole owner of date logic.

### Normalizing date columns

For single-format columns (most common), use **batch format detection** for performance:

```ts
import { detectDateFormat, normalizeDate } from '~/utils/date'

// Sample up to 20 values to detect the column's format
const samples = dataRows.slice(0, 20).map(row => String(row[dateColIdx] ?? '').trim()).filter(Boolean)
const detected = detectDateFormat(samples)

// If a single format is detected, use it for the entire column (fast path)
const parseDate = detected
  ? (s: string) => detected.parse(s) ?? s
  : normalizeDate  // fallback: tries all formats per cell

// Apply to each row
const normalized = dataRows.map(row => {
  const mapped = [...row]
  if (mapped[dateColIdx]) {
    mapped[dateColIdx] = parseDate(mapped[dateColIdx]!)
  }
  return mapped
})
```

For metadata extraction (single dates in preamble text), `normalizeDate` directly is fine:

```ts
import { normalizeDate } from '~/utils/date'

const normalized = normalizeDate(rawDateString)
if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
  // valid ISO date
}
```

### Available date functions

| Function | Purpose | Input | Output |
|---|---|---|---|
| `normalizeDate(s)` | Parse any common date format to ISO | `string` | `YYYY-MM-DD` or original if unparseable |
| `normalizeDateFuture(s)` | Like `normalizeDate` but 2-digit years always → `20xx` | `string` | `YYYY-MM-DD` or original if unparseable |
| `detectDateFormat(samples)` | Find one parser that works for all samples | `string[]` | `DateParser \| null` |
| `detectFutureDateFormat(samples)` | Like `detectDateFormat` but 2-digit years always → `20xx` | `string[]` | `DateParser \| null` |
| `isRetiredBy(retire, asOf)` | Is retire date on or before as-of date? | `string, string` | `boolean` |
| `extractYear(dateStr)` | Get numeric year from ISO string | `string` | `number` |
| `addYearsISO(dateStr, n)` | Offset an ISO date by N years | `string, number` | `YYYY-MM-DD` |
| `todayISO()` | Today as ISO string | — | `YYYY-MM-DD` |
| `diffYears(a, b)` | Fractional years between two dates | `string, string` | `number` |
| `formatMonthYear(s)` | Format as "Jan 2026" | `string` | `string` |

### Date principles

1. **All dates are `YYYY-MM-DD` strings** — no `Date` objects, no `Dayjs` objects at boundaries
2. **Timezone-naive** — seniority dates are calendar dates. The date module uses `dayjs.utc()` internally to avoid timezone shifts
3. **`normalizeDate` returns the original string when unparseable** — this triggers downstream validation errors with context, rather than silently failing
4. **`detectDateFormat` returns `null` for mixed formats** — fall back to per-cell `normalizeDate`
5. **Use `detectFutureDateFormat` / `normalizeDateFuture` for retire date columns** — the standard `> 50` century pivot maps 2-digit years like `55` or `62` to `1955`/`1962`. Junior pilots retiring in the 2050s–2070s have 2-digit years > 50, so the future-biased functions must be used for RTRDATE columns.

### Supported input formats

`normalizeDate` handles: ISO (`YYYY-MM-DD`), ISO datetime, `YYYY/MM/DD`, `MM/DD/YYYY`, `M/D/YY` (century pivot at 50), Excel serial numbers, compact `DDMonYYYY` (e.g., `27Sep1985`), and named months (`Jan 15, 2010`, `15 January 2010`, etc.).

## Standard column names

Your parser should rename headers to these standard names:

| Standard name | Meaning |
|---|---|
| `Seniority Number` | System-wide seniority ranking |
| `Employee Number` | Airline-specific employee ID |
| `Name` | Pilot name |
| `Base` | Domicile / crew base |
| `Fleet` | Equipment type |
| `Seat` | Position (CA/FO) |
| `Hire Date` | Date of hire (YYYY-MM-DD after normalization) |
| `Retire Date` | Mandatory retirement date (YYYY-MM-DD after normalization) |

## Testing

Use `// @vitest-environment node` for parser tests. Test through the public `parse()` method:

```ts
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { myAirlineParser } from './my-airline'

describe('myAirlineParser.parse', () => {
  const sampleFile: string[][] = [
    ['COL1', 'COL2', ...],
    ['data1', 'data2', ...],
  ]

  it('produces standard headers', () => {
    const { rows } = myAirlineParser.parse(sampleFile)
    expect(rows[0]).toContain('Seniority Number')
    expect(rows[0]).toContain('Hire Date')
  })

  it('normalizes dates to YYYY-MM-DD', () => {
    const { rows } = myAirlineParser.parse(sampleFile)
    const headers = rows[0]!
    const hireIdx = headers.indexOf('Hire Date')
    expect(rows[1]![hireIdx]).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
```
