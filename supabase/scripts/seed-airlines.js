// supabase/scripts/seed-airlines.js
// Production-safe: seeds the airlines reference table from CSV.
// Usage (standalone): node --env-file=.env supabase/scripts/seed-airlines.js
// Also imported by seed-dev.js

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const supabase = createClient(
  /** @type {string} */ (process.env.SUPABASE_URL),
  /** @type {string} */ (process.env.SUPABASE_SERVICE_KEY)
)

export async function seedAirlines() {
  const csv = readFileSync(resolve(__dirname, '../data/iata_airlines.csv'), 'utf-8')
  const [, ...rows] = csv.trim().split('\n')

  const seen = new Set()
  const records = rows
    .filter(Boolean)
    .map(line => {
      const [iata, icao, name, alias] = line.split(',').map(v => v.trim())
      return { iata: iata || null, icao, name, alias: alias || null }
    })
    .filter(r => r.icao)
    .filter(r => {
      if (seen.has(r.icao)) return false
      seen.add(r.icao)
      return true
    })

  const { error } = await supabase
    .from('airlines')
    .upsert(records, { onConflict: 'icao' })

  if (error) throw new Error(`Airlines: ${error.message}`)
  console.log(`  ✓ ${records.length} airlines`)
}

// Run standalone
if (!process.env.SEED_IMPORTED) {
  try {
    await seedAirlines()
  } catch (/** @type {any} */ err) {
    console.error(err.message)
    process.exit(1)
  }
}
