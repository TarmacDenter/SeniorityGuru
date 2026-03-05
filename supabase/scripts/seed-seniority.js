// supabase/scripts/seed-seniority.js
// Dev-only: creates seniority lists + entries for DAL, UAL, AAL.
// Usage (standalone): node --env-file=.env supabase/scripts/seed-seniority.js
// Also imported by seed-dev.js

import { createClient } from '@supabase/supabase-js'
import { DAL_USER_ID, UAL_USER_ID, ADMIN_ID } from './seed-users.js'

const url = process.env.SUPABASE_URL ?? ''
if (!url.includes('127.0.0.1') && !url.includes('localhost')) {
  console.error('ERROR: seed-seniority.js must not be run against a remote Supabase instance.')
  process.exit(1)
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// ─── Name pools ──────────────────────────────────────────────────────────────

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Jackson', 'White',
  'Harris', 'Martin', 'Thompson', 'Robinson', 'Clark', 'Lewis', 'Lee', 'Walker',
  'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott', 'Green',
]
const FIRST_NAMES = [
  'James', 'Robert', 'John', 'Michael', 'David', 'William', 'Richard', 'Joseph',
  'Thomas', 'Charles', 'Chris', 'Daniel', 'Matthew', 'Anthony', 'Mark',
  'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian', 'George',
  'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan', 'Jacob',
]

// ─── Airline configs ──────────────────────────────────────────────────────────

const AIRLINES = [
  {
    icao: 'DAL',
    count: 1000,
    caCount: 400,
    bases: ['ATL', 'MSP', 'DTW', 'SLC', 'LAX', 'SEA', 'JFK', 'BOS'],
    fleets: ['B737', 'B757', 'B767', 'B777', 'A220', 'A320', 'A330', 'A350'],
    uploadedBy: DAL_USER_ID,
    // Test user (EMP0500) is placed at seniority #750 (junior third)
    testEntry: { seniority_number: 750, employee_number: 'EMP0500', name: 'Smith, Michael' },
    lists: {
      active:   { id: '00000000-0000-0000-0001-000000000001', effectiveDate: '2026-01-01', status: 'active' },
      archived: { id: '00000000-0000-0000-0001-000000000002', effectiveDate: '2025-01-01', status: 'archived' },
    },
  },
  {
    icao: 'UAL',
    count: 800,
    caCount: 320,
    bases: ['ORD', 'EWR', 'IAH', 'DEN', 'SFO', 'LAX', 'IAD', 'GUM'],
    fleets: ['B737', 'B757', 'B767', 'B777', 'B787', 'A319', 'A320'],
    uploadedBy: UAL_USER_ID,
    // UAL test user (EMP0400) placed at seniority #400 (mid-list for 800)
    testEntry: { seniority_number: 400, employee_number: 'EMP0400', name: 'Johnson, Robert' },
    lists: {
      active:   { id: '00000000-0000-0000-0002-000000000001', effectiveDate: '2026-01-01', status: 'active' },
      archived: { id: '00000000-0000-0000-0002-000000000002', effectiveDate: '2025-01-01', status: 'archived' },
    },
  },
  {
    icao: 'AAL',
    count: 900,
    caCount: 360,
    bases: ['DFW', 'CLT', 'MIA', 'PHL', 'LAX', 'ORD', 'JFK', 'PHX'],
    fleets: ['B737', 'B757', 'B767', 'A319', 'A320', 'A321', 'E190'],
    uploadedBy: ADMIN_ID,
    testEntry: null,
    lists: {
      active:   { id: '00000000-0000-0000-0003-000000000001', effectiveDate: '2026-01-01', status: 'active' },
      archived: { id: '00000000-0000-0000-0003-000000000002', effectiveDate: '2025-01-01', status: 'archived' },
    },
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

/**
 * Age-65 mandatory retirement: derive a deterministic birth year from the
 * hire date and a plausible age-at-hire (25–35), then add 65 years.
 */
function retireDate(hireDateStr, n) {
  const hireYear = new Date(hireDateStr).getFullYear()
  const ageAtHire = 25 + (n % 11) // deterministic range 25–35
  const birthYear = hireYear - ageAtHire
  return `${birthYear + 65}-01-01`
}

function generateEntries(airline, listId, count) {
  const { caCount, bases, fleets, testEntry } = airline
  const entries = []

  for (let n = 1; n <= count; n++) {
    const isTestEntry = testEntry && n === testEntry.seniority_number
    const hireDate = addDays('1985-01-01', Math.floor(n * (count / 68.5)))

    entries.push({
      list_id:          listId,
      seniority_number: n,
      // Non-test entries use a 5-digit offset (EMP10001+) so 4-digit test
      // employee numbers (EMP0500, EMP0400) can never collide within the list.
      employee_number:  isTestEntry ? testEntry.employee_number : `EMP${String(n + 10000)}`,
      name:             isTestEntry ? testEntry.name : `${LAST_NAMES[n % 30]}, ${FIRST_NAMES[(n * 7) % 30]}`,
      hire_date:        hireDate,
      base:             bases[n % bases.length],
      seat:             n <= caCount ? 'CA' : 'FO',
      fleet:            fleets[n % fleets.length],
      retire_date:      retireDate(hireDate, n),
    })
  }

  return entries
}

async function upsertList(list, airline) {
  const { error } = await supabase.from('seniority_lists').upsert({
    id:             list.id,
    airline:        airline.icao,
    effective_date: list.effectiveDate,
    uploaded_by:    airline.uploadedBy,
    status:         list.status,
  })
  if (error) throw new Error(`List ${airline.icao} ${list.status}: ${error.message}`)
}

async function replaceEntries(listId, entries) {
  // Delete all existing entries for this list to prevent duplicates on re-run.
  // A plain upsert without a provided `id` would insert new rows each time
  // (new UUIDs generated), bypassing the primary-key conflict check.
  const { error: delError } = await supabase
    .from('seniority_entries')
    .delete()
    .eq('list_id', listId)
  if (delError) throw new Error(`Delete entries ${listId}: ${delError.message}`)

  // Insert in batches of 500 (PostgREST limit)
  for (let i = 0; i < entries.length; i += 500) {
    const { error } = await supabase
      .from('seniority_entries')
      .insert(entries.slice(i, i + 500))
    if (error) throw new Error(`Insert entries batch ${i}: ${error.message}`)
  }
}

export async function seedSeniority() {
  let totalEntries = 0

  for (const airline of AIRLINES) {
    // Upsert both lists
    await upsertList(airline.lists.active, airline)
    await upsertList(airline.lists.archived, airline)

    // Generate and replace entries for the active list
    const activeEntries = generateEntries(airline, airline.lists.active.id, airline.count)
    await replaceEntries(airline.lists.active.id, activeEntries)

    // Archived list: same pilot count but spread over the prior year's date range
    const archivedEntries = generateEntries(airline, airline.lists.archived.id, airline.count)
    await replaceEntries(airline.lists.archived.id, archivedEntries)

    totalEntries += airline.count * 2
    console.log(`  ✓ ${airline.icao}: ${airline.count} entries × 2 lists`)
  }

  console.log(`  ✓ ${totalEntries} total entries across ${AIRLINES.length * 2} lists`)
}

// Run standalone
if (!process.env.SEED_IMPORTED) {
  console.log('Seeding seniority data...')
  try {
    await seedSeniority()
    console.log('Done!')
  } catch (err) {
    console.error(`\nSeed failed: ${err.message}`)
    process.exit(1)
  }
}
