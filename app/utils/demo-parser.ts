import type { LocalSeniorityEntry } from '~/utils/db'

/** The employee number of the demo user — a senior FO in the base demo data. */
export const DEMO_EMPLOYEE_NUMBER = '1034'

/** Converts M/D/YYYY date strings (from demo CSV) to ISO 8601 (YYYY-MM-DD). */
function mdyToISO(mdy: string): string {
  const parts = mdy.trim().split('/')
  if (parts.length !== 3) return mdy
  const [m, d, y] = parts
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/**
 * Fast-path parser for the demo CSV format (SEN,CMID,NAME,BASE,FLEET,SEAT,HIREDATE,RTRDATE).
 * Does not go through the parser plugin system — format is fixed and known at build time.
 */
export function parseDemoCSV(csv: string): Omit<LocalSeniorityEntry, 'id' | 'listId'>[] {
  const lines = csv.split('\n').map((l) => l.trim()).filter(Boolean)
  // Skip header row
  const dataLines = lines.slice(1)

  return dataLines.map((line) => {
    // Handle quoted fields containing commas (e.g., "LAST, First")
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes
      }
      else if (ch === ',' && !inQuotes) {
        fields.push(current)
        current = ''
      }
      else {
        current += ch
      }
    }
    fields.push(current)

    const [sen, cmid, name, base, fleet, seat, hireDate, retireDate] = fields

    return {
      seniorityNumber: Number(sen),
      employeeNumber: (cmid ?? '').trim(),
      name: (name ?? '').trim() || null,
      base: (base ?? '').trim(),
      fleet: (fleet ?? '').trim(),
      seat: (seat ?? '').trim(),
      hireDate: mdyToISO((hireDate ?? '').trim()),
      retireDate: mdyToISO((retireDate ?? '').trim()),
    }
  })
}
