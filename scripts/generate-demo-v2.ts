/**
 * Generates demo/demo-data-v2.csv from demo/demo-data.csv.
 *
 * Applies deterministic mutations (same input → same output):
 *   - 7  retirements  (pilots with earliest retire dates)
 *   - 4  upgrades     (FO→CA at fixed seniority positions)
 *   - 4  transfers    (base changes at fixed seniority positions)
 *   - 10 new hires    (appended at bottom with fabricated data)
 *
 * Run: npx tsx scripts/generate-demo-v2.ts
 */

import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

type Row = Record<string, string>

function parseCsv(text: string): { headers: string[]; rows: Row[] } {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const headers = lines[0]!.split(',').map((h) => h.trim())
  const rows = lines.slice(1).map((line) => {
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') inQuotes = !inQuotes
      else if (ch === ',' && !inQuotes) { fields.push(current); current = '' }
      else current += ch
    }
    fields.push(current)
    return Object.fromEntries(headers.map((h, i) => [h, (fields[i] ?? '').trim()])) as Row
  })
  return { headers, rows }
}

function serializeCsv(headers: string[], rows: Row[]): string {
  const headerLine = headers.join(',')
  const dataLines = rows.map((row) =>
    headers.map((h) => {
      const v = row[h] ?? ''
      return v.includes(',') ? `"${v}"` : v
    }).join(','),
  )
  return [headerLine, ...dataLines].join('\n') + '\n'
}

function mdyToISO(mdy: string): Date {
  const [m, d, y] = mdy.split('/')
  return new Date(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
}

function isoToMdy(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${Number(m)}/${Number(d)}/${y}`
}

// ---------------------------------------------------------------------------
// Mutations (all deterministic — no Math.random())
// ---------------------------------------------------------------------------

/** Remove the 7 pilots whose retire date is earliest (soonest to leave). */
function applyRetirements(rows: Row[]): Row[] {
  const sorted = [...rows].sort(
    (a, b) => mdyToISO(a['RTRDATE']!).getTime() - mdyToISO(b['RTRDATE']!).getTime(),
  )
  const retiringCmids = new Set(sorted.slice(0, 7).map((r) => r['CMID']))
  return rows.filter((r) => !retiringCmids.has(r['CMID']))
}

/** Upgrade 4 FOs to CA: the FOs at 1-indexed positions 10, 20, 30, 40 in the sorted list. */
function applyUpgrades(rows: Row[]): Row[] {
  const positions = new Set([10, 20, 30, 40])
  let foCount = 0
  return rows.map((row) => {
    if (row['SEAT'] !== 'FO') return row
    foCount++
    if (positions.has(foCount)) return { ...row, SEAT: 'CA' }
    return row
  })
}

/** Transfer 4 pilots: rotate base at absolute seniority positions 500, 1000, 1500, 2000. */
const BASE_ROTATION: Record<string, string> = { BOS: 'JFK', JFK: 'MCO', MCO: 'BOS' }
function applyTransfers(rows: Row[]): Row[] {
  const positions = new Set([500, 1000, 1500, 2000])
  return rows.map((row, idx) => {
    const pos = idx + 1
    if (!positions.has(pos)) return row
    const newBase = BASE_ROTATION[row['BASE']!] ?? row['BASE']!
    return { ...row, BASE: newBase }
  })
}

/** Append 10 new hires at the bottom with hire dates 90 days after the latest hire in the list. */
function applyNewHires(rows: Row[]): Row[] {
  const latestHire = rows
    .map((r) => mdyToISO(r['HIREDATE']!))
    .reduce((best, d) => (d > best ? d : best), new Date(0))

  const hireBase = new Date(latestHire)
  hireBase.setDate(hireBase.getDate() + 90)

  const newHires: Row[] = [
    { NAME: 'NOVAK, Jordan', BASE: 'JFK', FLEET: '320', SEAT: 'FO', RTRDATE: '7/1/2060' },
    { NAME: 'OKAFOR, Priya', BASE: 'BOS', FLEET: '320', SEAT: 'FO', RTRDATE: '3/15/2061' },
    { NAME: 'VASQUEZ, Erin', BASE: 'MCO', FLEET: '220', SEAT: 'FO', RTRDATE: '9/22/2060' },
    { NAME: 'HUANG, Marcus', BASE: 'JFK', FLEET: '220', SEAT: 'FO', RTRDATE: '2/28/2062' },
    { NAME: 'BRENNAN, Sasha', BASE: 'BOS', FLEET: '320', SEAT: 'FO', RTRDATE: '11/5/2059' },
    { NAME: 'DELACROIX, Imani', BASE: 'JFK', FLEET: '320', SEAT: 'FO', RTRDATE: '4/18/2061' },
    { NAME: 'PETROV, Robin', BASE: 'MCO', FLEET: '320', SEAT: 'FO', RTRDATE: '8/30/2060' },
    { NAME: 'YAMAMOTO, Casey', BASE: 'BOS', FLEET: '220', SEAT: 'FO', RTRDATE: '1/11/2063' },
    { NAME: 'MORALES, Dani', BASE: 'JFK', FLEET: '320', SEAT: 'FO', RTRDATE: '6/7/2062' },
    { NAME: 'FITZGERALD, Alex', BASE: 'BOS', FLEET: '220', SEAT: 'FO', RTRDATE: '12/19/2061' },
  ].map((partial, i) => {
    const hireDate = new Date(hireBase)
    hireDate.setDate(hireDate.getDate() + i * 3)
    return {
      CMID: String(5000 + i),
      HIREDATE: isoToMdy(hireDate.toISOString().slice(0, 10)),
      ...partial,
    } as Row
  })

  return [...rows, ...newHires]
}

/** Renumber SEN column 1..N after all mutations. */
function renumber(rows: Row[]): Row[] {
  return rows.map((row, idx) => ({ ...row, SEN: String(idx + 1) }))
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run() {
  const inPath = resolve(ROOT, 'demo/demo-data.csv')
  const outPath = resolve(ROOT, 'demo/demo-data-v2.csv')

  const text = await readFile(inPath, 'utf-8')
  const { headers, rows } = parseCsv(text)

  const mutated = renumber(
    applyNewHires(
      applyTransfers(
        applyUpgrades(
          applyRetirements(rows),
        ),
      ),
    ),
  )

  const csv = serializeCsv(headers, mutated)
  await writeFile(outPath, csv, 'utf-8')

  const retiredCount = rows.length - (mutated.length - 10)
  console.log(`Generated demo-data-v2.csv`)
  console.log(`  Input:  ${rows.length} pilots`)
  console.log(`  After retirements: -${retiredCount}`)
  console.log(`  After new hires:   +10`)
  console.log(`  Output: ${mutated.length} pilots`)
}

run().catch(console.error)
