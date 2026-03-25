# Writing a Parser Plugin

This guide walks through adding a new airline parser to SeniorityGuru. We'll build one for ValueJet, whose seniority list has some quirks:

- A combined `POS_CODE` column that packs Base, Fleet, and Seat into one string (e.g., `ATL320CA`)
- Dates in `MM-DD_YYYY` format (e.g., `03-15_2026`)
- A preamble row with the list title before the header

By the end you'll have a working parser that plugs into the upload wizard with zero changes to any UI code.

---

## How parsers fit into the upload pipeline

```
User selects "ValueJet" in the upload wizard
  → drops a file
  → _useFileIO calls getParser('valuejet').parse(rawRows)
  → your parser normalizes the data
  → the rest of the pipeline (column mapping, validation, save) works unchanged
```

A parser is a pure function: raw spreadsheet rows in, normalized rows + metadata out. It runs before column mapping, so your job is to transform airline-specific column layouts into the standard format that the column mapper already understands.

---

## The PreParser interface

Every parser implements this interface from `app/utils/parsers/types.ts`:

```typescript
interface PreParser {
  readonly id: string              // unique key, lowercase
  readonly label: string           // shown in parser selector UI
  readonly description: string     // one-liner below the label
  readonly icon: string            // Lucide icon class
  readonly formatDescription: string  // help text on the parser card
  parse(raw: string[][]): PreParserResult
}

interface PreParserResult {
  rows: string[][]                 // [headers, ...dataRows] — normalized
  metadata: PreParserMetadata
}

interface PreParserMetadata {
  effectiveDate: string | null     // YYYY-MM-DD or null
  title: string | null             // extracted list title or null
  syntheticIndices?: number[]      // row indices where data was synthesized
  syntheticNote?: string           // human-readable note about synthesized data
}
```

Your `parse()` method receives every row from the spreadsheet as `string[][]`. The first row might be a header, or there might be preamble rows before it. You return:

1. **`rows`** — a `string[][]` where `rows[0]` is the header row with standard column names, and `rows[1..]` are data rows. The column mapper uses these headers for auto-detection.
2. **`metadata`** — anything you extracted from preamble rows (effective date, title) plus optional notes about synthesized data.

### Standard column names

The column auto-detector recognizes these names (case-insensitive, partial match):

| Standard Name | Recognized Aliases |
|---|---|
| `Seniority Number` | seniority, sen #, sen_num |
| `Employee Number` | employee, emp id, emp_id |
| `Seat` | seat, position, status |
| `Base` | base, domicile, station |
| `Fleet` | fleet, equipment, aircraft |
| `Name` | name, pilot name, full name |
| `Hire Date` | hire, hire date, doh |
| `Retire Date` | retire, retirement, retire date |

If your parser renames columns to match these, the mapper will auto-detect them and skip the manual mapping step entirely. But your parser doesn't have to rename everything — see "How much should your parser do?" below.

---

## How much should your parser do?

A parser doesn't have to be a full auto-detect solution. The upload wizard has a manual column mapping step that catches anything the parser doesn't handle. Your parser sits on a spectrum:

### Tier 1: Transform only (no column renaming)

The parser decomposes combined columns and normalizes dates, but leaves the original header names in place. The user always sees the manual mapping step and maps columns by hand.

```typescript
// Returns: ['SEN_NO', 'EMP_ID', 'PILOT_NAME', 'DOH', 'RETIRE_DT', 'Base', 'Fleet', 'Seat']
// Auto-detect result: seniority=-1, employee=-1, ... only Base/Fleet/Seat match
// User experience: mapping step shown, 4 of 7 columns need manual mapping
```

This is still valuable — without the parser, the user would have a `POS_CODE` column they can't map at all and `MM-DD_YYYY` dates that fail validation. The parser solves those problems; the user handles column names.

### Tier 2: Partial rename (some columns auto-detected)

The parser renames columns it's confident about and leaves unfamiliar ones as-is. The user sees the mapping step with some dropdowns pre-filled.

```typescript
// Returns: ['Seniority Number', 'Employee Number', 'PILOT_NAME', 'Hire Date', 'RETIRE_DT', 'Base', 'Fleet', 'Seat']
// Auto-detect result: seniority=0, employee=1, hire=3, base=5, fleet=6, seat=7 ✓ — name=-1, retire=-1 ✗
// User experience: mapping step shown, 2 columns need manual mapping
```

This is a good default for new parsers. Rename the columns you're sure about from the airline's documentation. Leave anything ambiguous for the user to confirm.

### Tier 3: Full rename (mapping step skipped)

The parser renames all columns to standard names. `autoDetectColumnMap` matches everything, `autoDetected` becomes `true`, and the wizard jumps straight from upload to review.

```typescript
// Returns: ['Seniority Number', 'Employee Number', 'Name', 'Hire Date', 'Retire Date', 'Base', 'Fleet', 'Seat']
// Auto-detect result: all 7 required columns matched ✓
// User experience: mapping step skipped entirely, toast says "All columns auto-detected"
```

This is the goal for well-understood formats. The Delta parser and the full ValueJet example below operate at this tier.

### How the pipeline decides

After your parser runs, two things happen in sequence:

1. **`autoDetectColumnMap(headers)`** — scans your normalized headers against the standard alias list. Each field gets an index (matched) or `-1` (not matched). Matched columns pre-fill the mapping dropdowns.

2. **`isColumnMapComplete(columnMap)`** — returns `true` only if all 7 required fields have index >= 0. This drives `autoDetected`:
   - `true` → wizard skips mapping, calls `apply()` immediately
   - `false` → wizard shows the mapping step with whatever was pre-filled

The mapping step's `canAdvance` computed blocks the user from proceeding until all 7 required columns are mapped (either by auto-detect or by hand). So partial auto-detect is always safe — the wizard won't let bad data through.

### Recommendation

Start at Tier 1 or 2. Get the transformations right (column decomposition, date normalization, preamble extraction). Add renames for columns you're confident about. If users report that the mapping step is annoying for a particular airline, promote it to Tier 3 by adding the remaining renames to `STANDARD_NAMES`.

---

## Step 1: Create the parser file

Create `app/utils/parsers/valuejet.ts`:

```typescript
import type { PreParser, PreParserResult, PreParserMetadata } from './types'
import { createLogger } from '~/utils/logger'

const log = createLogger('parser:valuejet')

/**
 * ValueJet packs Base+Fleet+Seat into a single POS_CODE column
 * (e.g., "ATL320CA" → base=ATL, fleet=320, seat=CA)
 * and uses MM-DD_YYYY date format.
 */

// ── Header detection ─────────────────────────────────────────────────────
// Airlines sometimes rename columns between list revisions. Use an alias
// list so the parser survives minor header changes without a code update.

const HEADER_ALIASES: Record<string, string[]> = {
  seniority:  ['SEN_NO', 'SENIORITY_NO', 'SEN_NBR'],
  employee:   ['EMP_ID', 'EMPLOYEE_ID', 'EMP_NO'],
  name:       ['PILOT_NAME', 'NAME', 'FULL_NAME'],
  posCode:    ['POS_CODE', 'POSITION_CODE', 'POS'],
  hireDate:   ['DOH', 'HIRE_DATE', 'HIRE_DT'],
  retireDate: ['RETIRE_DT', 'RETIRE_DATE', 'RET_DT'],
}

/** Check whether a header value matches any alias for a given field. */
function matchesAlias(header: string, field: keyof typeof HEADER_ALIASES): boolean {
  return HEADER_ALIASES[field]!.some(
    alias => header.toUpperCase() === alias,
  )
}

/** Find the column index for a field by checking all its aliases. */
function findColumnByAlias(headers: string[], field: keyof typeof HEADER_ALIASES): number {
  return headers.findIndex(h => matchesAlias(String(h).trim(), field))
}

// ── Column decomposition ─────────────────────────────────────────────────

/** Decompose "ATL320CA" → { base: 'ATL', fleet: '320', seat: 'CA' } */
export function decomposePosCode(code: string): { base: string; fleet: string; seat: string } {
  const trimmed = code.trim()
  return {
    base: trimmed.slice(0, 3),
    fleet: trimmed.slice(3, 6),
    seat: trimmed.slice(6),
  }
}

// ── Date normalization ───────────────────────────────────────────────────

/** Convert "03-15_2026" → "2026-03-15". Passes through unrecognized formats. */
export function normalizeValueJetDate(raw: string): string {
  const match = raw.trim().match(/^(\d{2})-(\d{2})_(\d{4})$/)
  if (!match) return raw
  return `${match[3]}-${match[1]}-${match[2]}`
}

// ── Header & metadata detection ──────────────────────────────────────────

function findHeaderRow(raw: string[][]): number {
  return raw.findIndex(row =>
    row.some(cell => matchesAlias(String(cell).trim(), 'seniority')),
  )
}

function extractMetadata(preamble: string[][]): PreParserMetadata {
  for (const row of preamble) {
    const cell = String(row[0] ?? '').trim()
    if (!cell) continue

    const dateMatch = cell.match(/(\d{2}-\d{2}_\d{4})/)
    return {
      effectiveDate: dateMatch ? normalizeValueJetDate(dateMatch[1]!) : null,
      title: cell,
    }
  }
  return { effectiveDate: null, title: null }
}

// ── Standard header mapping ──────────────────────────────────────────────
// Map recognized airline columns → standard names the auto-detector knows.
// POS_CODE is intentionally absent — it gets decomposed, not renamed.

const STANDARD_NAMES: Record<string, string> = {
  SEN_NO: 'Seniority Number',
  SENIORITY_NO: 'Seniority Number',
  SEN_NBR: 'Seniority Number',
  EMP_ID: 'Employee Number',
  EMPLOYEE_ID: 'Employee Number',
  EMP_NO: 'Employee Number',
  PILOT_NAME: 'Name',
  FULL_NAME: 'Name',
  DOH: 'Hire Date',
  HIRE_DATE: 'Hire Date',
  HIRE_DT: 'Hire Date',
  RETIRE_DT: 'Retire Date',
  RETIRE_DATE: 'Retire Date',
  RET_DT: 'Retire Date',
}

// ── Parser implementation ────────────────────────────────────────────────

export const valuejetParser: PreParser = {
  id: 'valuejet',
  label: 'ValueJet Airways',
  description: 'ValueJet seniority list with combined POS_CODE column.',
  icon: 'i-lucide-flame',
  formatDescription:
    'Expects a ValueJet seniority list export. The POS_CODE column (e.g., ATL320CA) '
    + 'is automatically split into Base, Fleet, and Seat. Dates in MM-DD_YYYY format '
    + 'are converted automatically.',

  parse(raw: string[][]): PreParserResult {
    log.info('Starting parse', { totalRows: raw.length })

    const headerIdx = findHeaderRow(raw)

    if (headerIdx === -1) {
      log.warn('Header row not found — falling back to raw passthrough', {
        firstRow: raw[0]?.slice(0, 5),
      })
      return { rows: raw, metadata: { effectiveDate: null, title: null } }
    }

    log.debug('Header found', { headerIdx, headerRow: raw[headerIdx] })

    // Extract metadata from preamble rows above the header
    const preamble = raw.slice(0, headerIdx)
    const metadata = extractMetadata(preamble)
    log.info('Metadata extracted', {
      effectiveDate: metadata.effectiveDate,
      title: metadata.title,
      preambleRows: preamble.length,
    })

    const originalHeaders = raw[headerIdx]!
    const posCodeIdx = findColumnByAlias(originalHeaders, 'posCode')

    if (posCodeIdx === -1) {
      log.warn('POS_CODE column not found — position data will require manual mapping', {
        headers: originalHeaders,
      })
    }

    // Build new header row:
    // - Rename known columns via STANDARD_NAMES
    // - Skip POS_CODE (we'll append Base, Fleet, Seat instead)
    // - Track which source indices to copy
    const standardHeaders: string[] = []
    const sourceIndices: number[] = []
    const unmappedHeaders: string[] = []

    for (let i = 0; i < originalHeaders.length; i++) {
      const header = String(originalHeaders[i]).trim()
      if (i === posCodeIdx) continue

      const standardName = STANDARD_NAMES[header.toUpperCase()]
      if (!standardName) {
        unmappedHeaders.push(header)
      }
      standardHeaders.push(standardName ?? header)
      sourceIndices.push(i)
    }
    standardHeaders.push('Base', 'Fleet', 'Seat')

    if (unmappedHeaders.length > 0) {
      log.debug('Unmapped headers passed through as-is', { unmappedHeaders })
    }

    // Find date column indices in the NEW header array so we can normalize them
    const hireDateIdx = standardHeaders.indexOf('Hire Date')
    const retireDateIdx = standardHeaders.indexOf('Retire Date')

    // Transform data rows
    const dataRows = raw
      .slice(headerIdx + 1)
      .filter(row => row.some(cell => String(cell).trim() !== ''))

    let dateNormalizationFailures = 0

    const transformedRows = dataRows.map((row) => {
      // Copy columns (skipping POS_CODE)
      const mapped = sourceIndices.map(i => String(row[i] ?? ''))

      // Decompose POS_CODE → append Base, Fleet, Seat
      const posCode = posCodeIdx >= 0 ? String(row[posCodeIdx] ?? '') : ''
      const { base, fleet, seat } = decomposePosCode(posCode)
      mapped.push(base, fleet, seat)

      // Normalize dates from MM-DD_YYYY → YYYY-MM-DD
      if (hireDateIdx >= 0 && mapped[hireDateIdx]) {
        const original = mapped[hireDateIdx]!
        mapped[hireDateIdx] = normalizeValueJetDate(original)
        if (mapped[hireDateIdx] === original && !/^\d{4}-\d{2}-\d{2}$/.test(original)) {
          dateNormalizationFailures++
        }
      }
      if (retireDateIdx >= 0 && mapped[retireDateIdx]) {
        const original = mapped[retireDateIdx]!
        mapped[retireDateIdx] = normalizeValueJetDate(original)
        if (mapped[retireDateIdx] === original && !/^\d{4}-\d{2}-\d{2}$/.test(original)) {
          dateNormalizationFailures++
        }
      }

      return mapped
    })

    if (dateNormalizationFailures > 0) {
      log.warn('Some dates did not match expected MM-DD_YYYY format', {
        failureCount: dateNormalizationFailures,
        hint: 'These will surface as validation errors in the review step',
      })
    }

    log.info('Parse complete', {
      dataRows: transformedRows.length,
      standardColumns: standardHeaders.length,
      posCodeDecomposed: posCodeIdx >= 0,
    })

    return {
      rows: [standardHeaders, ...transformedRows],
      metadata,
    }
  },
}
```

### What the logging tells you

Every parser should log at these levels:

| Level | When | Example |
|---|---|---|
| `info` | Start, finish, metadata extracted | `"Parse complete" { dataRows: 17000 }` |
| `debug` | Internal decisions, unmapped columns | `"Header found" { headerIdx: 2 }` |
| `warn` | Recoverable problems the user should know about | `"POS_CODE column not found"` |
| `error` | Never throw from `parse()` — use `warn` + fallback | (see "Handling format changes" below) |

Logs go into the in-memory ring buffer and are visible in Settings > Debug Log. When a user reports "my file didn't parse right," the first thing to do is ask them to export their debug log. Your parser's scoped logs (`parser:valuejet`) will show exactly what it saw.

### Key design decisions

- **`HEADER_ALIASES`** — airlines rename columns between list revisions. Use an alias list so the parser survives `SEN_NO` → `SENIORITY_NO` without a code update.
- **`STANDARD_NAMES`** — maps all known aliases to the standard names the auto-detector recognizes. Covers every alias in `HEADER_ALIASES`.
- **`decomposePosCode`** and **`normalizeValueJetDate`** are exported so tests can exercise them directly.
- **`POS_CODE`** is removed from the header and replaced with three separate columns (`Base`, `Fleet`, `Seat`) — the same pattern Delta uses for its `Category` column.
- **Dates are normalized** in the data rows before they reach the validator. The Zod schema expects `YYYY-MM-DD`; your parser handles the conversion so the user never sees a validation error for date format.
- **Preamble extraction** pulls the effective date and title from rows above the header. These pre-fill the confirm step so the user doesn't have to type them.

---

## Handling format changes

Airlines change their export format. Columns get renamed, added, reordered, or removed between contract revisions. Your parser should handle this gracefully rather than breaking when the format drifts.

### Use alias lists, not exact matches

Don't match a single header string. Match a list of known aliases:

```typescript
// Fragile — breaks when the airline renames the column
const idx = headers.findIndex(h => h === 'SEN_NO')

// Resilient — survives SEN_NO → SENIORITY_NO → SEN_NBR
const idx = findColumnByAlias(headers, 'seniority')
```

When you discover a new alias in the wild, add it to `HEADER_ALIASES` and `STANDARD_NAMES`. That's a one-line fix, not a parser rewrite.

### Fall back, don't crash

If an expected column is missing, degrade gracefully:

```typescript
const posCodeIdx = findColumnByAlias(originalHeaders, 'posCode')

if (posCodeIdx === -1) {
  // Log a warning — the user will see the columns in the manual mapping step
  log.warn('POS_CODE column not found — position data will require manual mapping', {
    headers: originalHeaders,
  })
  // Don't throw. The pipeline continues — the user maps Base, Fleet, Seat manually.
}
```

The upload wizard has a manual column mapping step specifically for this case. If your parser can't find a column, the user can map it by hand. Your job is to handle what you can and log what you can't.

### Log what you skip

When a date doesn't match your expected format, count the failures and log them at `warn`. The dates will pass through un-normalized and fail Zod validation in the review step — which is the correct behavior. The user sees them as validation errors and can fix them inline.

```typescript
if (dateNormalizationFailures > 0) {
  log.warn('Some dates did not match expected MM-DD_YYYY format', {
    failureCount: dateNormalizationFailures,
    hint: 'These will surface as validation errors in the review step',
  })
}
```

### Never throw from `parse()`

If the file doesn't match your format at all (header row not found), return the raw rows unchanged and let the generic pipeline handle it:

```typescript
if (headerIdx === -1) {
  log.warn('Header row not found — falling back to raw passthrough', {
    firstRow: raw[0]?.slice(0, 5),
  })
  return { rows: raw, metadata: { effectiveDate: null, title: null } }
}
```

The `_useFileIO` phase wraps `parse()` in a try/catch and shows an error to the user if your parser throws. But a graceful fallback is better — the user keeps their file loaded and can try manual mapping.

### When the format changes are too large

If an airline releases a fundamentally different format (new file type, completely different column structure), the right move is usually a new parser — not expanding the old one. The user selects the right parser for their file format in the first step of the wizard. You can version them:

```typescript
// registry.ts
export const parsers: readonly PreParser[] = [
  deltaParser,
  valuejetV2Parser,    // "ValueJet (2027+ format)"
  valuejetParser,      // "ValueJet (legacy format)"
  genericParser,
]
```

Each parser has its own `label` and `description` so the user can tell them apart. The old parser stays for users who still have files in the old format.

---

## Step 2: Register the parser

Add one import and one array entry in `app/utils/parsers/registry.ts`:

```typescript
import type { PreParser } from './types'
import { deltaParser } from './delta'
import { valuejetParser } from './valuejet'   // ← add
import { genericParser } from './generic'

export const parsers: readonly PreParser[] = [
  deltaParser,
  valuejetParser,   // ← add (generic stays last)
  genericParser,
]

// ... rest of file unchanged
```

Order matters: specific parsers go before `genericParser`. The generic parser is the fallback when a user selects "Generic / Other Airline."

---

## Step 3: Write tests

Create `app/utils/parsers/valuejet.test.ts`:

```typescript
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { valuejetParser, decomposePosCode, normalizeValueJetDate } from './valuejet'

describe('decomposePosCode', () => {
  it('splits ATL320CA into base, fleet, seat', () => {
    expect(decomposePosCode('ATL320CA')).toEqual({
      base: 'ATL',
      fleet: '320',
      seat: 'CA',
    })
  })

  it('handles FO seat code', () => {
    expect(decomposePosCode('MSP737FO')).toEqual({
      base: 'MSP',
      fleet: '737',
      seat: 'FO',
    })
  })
})

describe('normalizeValueJetDate', () => {
  it('converts MM-DD_YYYY to YYYY-MM-DD', () => {
    expect(normalizeValueJetDate('03-15_2026')).toBe('2026-03-15')
  })

  it('passes through unrecognized formats unchanged', () => {
    expect(normalizeValueJetDate('2026-03-15')).toBe('2026-03-15')
  })
})

describe('valuejetParser.parse', () => {
  const sampleFile: string[][] = [
    ['ValueJet Seniority List Effective 03-15_2026'],
    [],
    ['SEN_NO', 'EMP_ID', 'PILOT_NAME', 'POS_CODE', 'DOH', 'RETIRE_DT'],
    ['1', '90001', 'BARKLEY, CHARLES J', 'ATL320CA', '06-15_2010', '01-01_2045'],
    ['2', '90002', 'JORDAN, MICHAEL B', 'MSP737FO', '11-01_2015', '06-01_2050'],
  ]

  it('extracts effective date from preamble', () => {
    const { metadata } = valuejetParser.parse(sampleFile)
    expect(metadata.effectiveDate).toBe('2026-03-15')
  })

  it('extracts title from preamble', () => {
    const { metadata } = valuejetParser.parse(sampleFile)
    expect(metadata.title).toBe('ValueJet Seniority List Effective 03-15_2026')
  })

  it('produces standard headers', () => {
    const { rows } = valuejetParser.parse(sampleFile)
    const headers = rows[0]!
    expect(headers).toContain('Seniority Number')
    expect(headers).toContain('Employee Number')
    expect(headers).toContain('Name')
    expect(headers).toContain('Hire Date')
    expect(headers).toContain('Retire Date')
    expect(headers).toContain('Base')
    expect(headers).toContain('Fleet')
    expect(headers).toContain('Seat')
    expect(headers).not.toContain('POS_CODE')
  })

  it('decomposes POS_CODE into Base, Fleet, Seat columns', () => {
    const { rows } = valuejetParser.parse(sampleFile)
    const firstDataRow = rows[1]!
    const headers = rows[0]!
    const baseIdx = headers.indexOf('Base')
    const fleetIdx = headers.indexOf('Fleet')
    const seatIdx = headers.indexOf('Seat')

    expect(firstDataRow[baseIdx]).toBe('ATL')
    expect(firstDataRow[fleetIdx]).toBe('320')
    expect(firstDataRow[seatIdx]).toBe('CA')
  })

  it('normalizes dates to YYYY-MM-DD', () => {
    const { rows } = valuejetParser.parse(sampleFile)
    const headers = rows[0]!
    const firstDataRow = rows[1]!
    const hireIdx = headers.indexOf('Hire Date')
    const retireIdx = headers.indexOf('Retire Date')

    expect(firstDataRow[hireIdx]).toBe('2010-06-15')
    expect(firstDataRow[retireIdx]).toBe('2045-01-01')
  })

  it('skips blank rows in the data', () => {
    const withBlanks = [
      ...sampleFile,
      ['', '', '', '', '', ''],
    ]
    const { rows } = valuejetParser.parse(withBlanks)
    // header + 2 data rows, blank row excluded
    expect(rows).toHaveLength(3)
  })

  it('falls back gracefully when header is not found', () => {
    const noHeader = [['just', 'some', 'random', 'data']]
    const { rows, metadata } = valuejetParser.parse(noHeader)
    expect(rows).toEqual(noHeader)
    expect(metadata.effectiveDate).toBeNull()
  })

  it('handles renamed columns via aliases', () => {
    const renamedHeaders: string[][] = [
      ['ValueJet Seniority List Effective 03-15_2026'],
      [],
      ['SENIORITY_NO', 'EMPLOYEE_ID', 'FULL_NAME', 'POSITION_CODE', 'HIRE_DT', 'RET_DT'],
      ['1', '90001', 'BARKLEY, CHARLES J', 'ATL320CA', '06-15_2010', '01-01_2045'],
    ]
    const { rows } = valuejetParser.parse(renamedHeaders)
    const headers = rows[0]!
    expect(headers).toContain('Seniority Number')
    expect(headers).toContain('Employee Number')
    expect(headers).toContain('Name')
    expect(headers).toContain('Hire Date')
    expect(headers).toContain('Retire Date')
  })

  it('degrades gracefully when POS_CODE is missing', () => {
    const noPosCode: string[][] = [
      ['SEN_NO', 'EMP_ID', 'PILOT_NAME', 'DOH', 'RETIRE_DT'],
      ['1', '90001', 'BARKLEY, CHARLES J', '06-15_2010', '01-01_2045'],
    ]
    const { rows } = valuejetParser.parse(noPosCode)
    const headers = rows[0]!
    // Base, Fleet, Seat are appended but will be empty — user maps manually
    expect(headers).toContain('Base')
    expect(headers).toContain('Fleet')
    expect(headers).toContain('Seat')
    expect(rows).toHaveLength(2)
  })
})
```

Run the tests:

```bash
npm test -- app/utils/parsers/valuejet.test.ts
```

---

## What happens at runtime

When a user selects "ValueJet Airways" in the upload wizard and drops a file:

1. **Parser selector** — the `ParserSelector` component reads the `parsers` array from the registry. Your parser shows up automatically with its `label`, `description`, and `icon`.

2. **File processing** — `_useFileIO` calls `getParser('valuejet').parse(rawRows)`. Your parser strips the preamble, decomposes `POS_CODE`, normalizes dates, and returns clean rows with standard headers.

3. **Column mapping** — `autoDetectColumnMap` runs on your normalized headers. Since they match the standard names, `autoDetected` is `true` and the wizard skips straight to review.

4. **Validation** — the Zod schema validates each row. Because your parser already normalized dates to `YYYY-MM-DD`, they pass validation without errors.

5. **Confirm** — the effective date and title from your metadata pre-fill the confirm step.

No upload pipeline code, no page code, and no component code is modified.

---

## Checklist

- [ ] Create `app/utils/parsers/<airline>.ts` implementing `PreParser`
- [ ] Use `createLogger('parser:<airline>')` for structured logging
- [ ] Use alias lists for header detection (not exact string matches)
- [ ] Export helper functions (date normalization, column decomposition) for testability
- [ ] Fall back gracefully when expected columns are missing — never throw from `parse()`
- [ ] Log warnings for anything the parser skips or can't handle
- [ ] Register in `app/utils/parsers/registry.ts` (before `genericParser`)
- [ ] Create `app/utils/parsers/<airline>.test.ts` with `@vitest-environment node`
- [ ] Test: header detection, metadata extraction, column decomposition, date normalization, blank row handling, missing header fallback, **alias resilience**
- [ ] Run all three gates: `npm run lint && npm run typecheck && npm test`

---

## Reference: Delta parser

The Delta parser (`app/utils/parsers/delta.ts`) is the existing reference implementation. It handles a similar pattern — a `Category` column (e.g., `ATL350A`) that packs Base, Fleet, and a single-character Seat code. If your airline has a similar combined column, Delta's `decomposeCategory` function is a good starting point.
