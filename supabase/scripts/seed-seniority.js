// supabase/scripts/seed-seniority.js
// Dev-only: creates seniority lists + entries for DAL, UAL, AAL.
// Usage (standalone): node --env-file=.env supabase/scripts/seed-seniority.js
// Also imported by seed-dev.js
//
// Data design:
//   - 4 snapshots per airline (~6 months apart), enabling Upgrade Tracker
//   - Hire dates use realistic cohort brackets, creating a retirement wave ~2027-2030
//   - Retirement dates spread through the year (not all Jan 1)
//   - FO→CA upgrades applied progressively between snapshots

import { createClient } from '@supabase/supabase-js'
import { DAL_USER_ID, UAL_USER_ID, ADMIN_ID } from './seed-users.js'

const url = process.env.SUPABASE_URL ?? ''
if (!url.includes('127.0.0.1') && !url.includes('localhost')) {
  console.error('ERROR: seed-seniority.js must not be run against a remote Supabase instance.')
  process.exit(1)
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

// ─── Airline configs ──────────────────────────────────────────────────────────

const AIRLINES = [
  {
    icao: 'DAL',
    count: 1000,
    caFraction: 0.40,   // 40% CAs
    bases: ['ATL', 'MSP', 'DTW', 'SLC', 'LAX', 'SEA', 'JFK', 'BOS'],
    fleets: ['B737', 'B757', 'B767', 'B777', 'A220', 'A320'],
    uploadedBy: DAL_USER_ID,
    testEntry: { originalSenNum: 750, employee_number: 'EMP0500', name: 'Smith, Michael' },
    listIds: [
      { id: '00000000-0000-0000-0001-000000000001', date: '2024-07-01', status: 'archived' },
      { id: '00000000-0000-0000-0001-000000000002', date: '2025-01-01', status: 'archived' },
      { id: '00000000-0000-0000-0001-000000000003', date: '2025-07-01', status: 'archived' },
      { id: '00000000-0000-0000-0001-000000000004', date: '2026-01-01', status: 'active'  },
    ],
  },
  {
    icao: 'UAL',
    count: 800,
    caFraction: 0.40,
    bases: ['ORD', 'EWR', 'IAH', 'DEN', 'SFO', 'LAX', 'IAD'],
    fleets: ['B737', 'B757', 'B767', 'B777', 'B787', 'A319', 'A320'],
    uploadedBy: UAL_USER_ID,
    testEntry: { originalSenNum: 400, employee_number: 'EMP0400', name: 'Johnson, Robert' },
    listIds: [
      { id: '00000000-0000-0000-0002-000000000001', date: '2024-07-01', status: 'archived' },
      { id: '00000000-0000-0000-0002-000000000002', date: '2025-01-01', status: 'archived' },
      { id: '00000000-0000-0000-0002-000000000003', date: '2025-07-01', status: 'archived' },
      { id: '00000000-0000-0000-0002-000000000004', date: '2026-01-01', status: 'active'  },
    ],
  },
  {
    icao: 'AAL',
    count: 900,
    caFraction: 0.40,
    bases: ['DFW', 'CLT', 'MIA', 'PHL', 'LAX', 'ORD', 'JFK', 'PHX'],
    fleets: ['B737', 'B757', 'B767', 'A319', 'A320', 'A321', 'E190'],
    uploadedBy: ADMIN_ID,
    testEntry: null,
    listIds: [
      { id: '00000000-0000-0000-0003-000000000001', date: '2024-07-01', status: 'archived' },
      { id: '00000000-0000-0000-0003-000000000002', date: '2025-01-01', status: 'archived' },
      { id: '00000000-0000-0000-0003-000000000003', date: '2025-07-01', status: 'archived' },
      { id: '00000000-0000-0000-0003-000000000004', date: '2026-01-01', status: 'active'  },
    ],
  },
]

// ─── Hire date cohorts ────────────────────────────────────────────────────────
// More senior (lower seniority_number) = hired earlier.
// The 1990-1994 cohort is the "retirement wave" — they reach 65 around 2025-2030.
//
// Cohort layout (fractions of the total list):
//   0%-5%   → hired 1985-1989  (oldest, most senior)
//   5%-15%  → hired 1990-1994  ← WAVE cohort
//   15%-27% → hired 1995-1999
//   27%-40% → hired 2000-2004
//   40%-55% → hired 2005-2009
//   55%-72% → hired 2010-2014
//   72%-87% → hired 2015-2019
//   87%-100%→ hired 2020-2024  (newest, most junior)

const COHORTS = [
  { maxPct: 0.05, startYear: 1985, endYear: 1989 },
  { maxPct: 0.15, startYear: 1990, endYear: 1994 },
  { maxPct: 0.27, startYear: 1995, endYear: 1999 },
  { maxPct: 0.40, startYear: 2000, endYear: 2004 },
  { maxPct: 0.55, startYear: 2005, endYear: 2009 },
  { maxPct: 0.72, startYear: 2010, endYear: 2014 },
  { maxPct: 0.87, startYear: 2015, endYear: 2019 },
  { maxPct: 1.00, startYear: 2020, endYear: 2024 },
]

function hireDateFor(n, count) {
  const pct = n / count
  const cohort = COHORTS.find((c) => pct <= c.maxPct) ?? COHORTS[COHORTS.length - 1]
  const yearSpan = cohort.endYear - cohort.startYear
  const year = cohort.startYear + (n % (yearSpan + 1))
  // Spread through the year: deterministic day-of-year
  const dayOfYear = 1 + ((n * 47 + 13) % 365)
  const d = new Date(year, 0, dayOfYear)
  return d.toISOString().split('T')[0]
}

// Retirement date: mandatory retirement at 65.
// Age at hire is deterministic 25-35. Retirement date spread through the year.
function retireDateFor(hireDateStr, n) {
  const hireYear = new Date(hireDateStr).getFullYear()
  const ageAtHire = 25 + (n % 11)          // 25-35 years old when hired
  const birthYear = hireYear - ageAtHire
  const retireYear = birthYear + 65
  const month = (n * 3 + 1) % 12           // 0-11
  const day = 1 + ((n * 7 + 5) % 28)       // 1-28
  return `${retireYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Fleet assigned in bands so each fleet represents a contiguous seniority range
// (mirrors how real airlines assign fleets: senior pilots get widebodies).
function qualFor(n, count, caFraction, fleets, bases) {
  const seat = n <= Math.floor(count * caFraction) ? 'CA' : 'FO'
  const fleetIdx = Math.floor((n / count) * fleets.length)
  const fleet = fleets[Math.min(fleetIdx, fleets.length - 1)]
  const base = bases[(n * 3 + Math.floor(n / bases.length)) % bases.length]
  return { seat, fleet, base }
}

// ─── Pilot pool ───────────────────────────────────────────────────────────────

function buildPilotPool(airline) {
  const { count, caFraction, bases, fleets, testEntry } = airline
  const pool = []

  for (let n = 1; n <= count; n++) {
    const isTest = testEntry && n === testEntry.originalSenNum
    const hireDate = hireDateFor(n, count)
    const retireDate = retireDateFor(hireDate, n)
    const { seat, fleet, base } = qualFor(n, count, caFraction, fleets, bases)

    pool.push({
      originalSenNum: n,
      employee_number: isTest ? testEntry.employee_number : `EMP${String(n + 10000)}`,
      name: isTest ? testEntry.name : `Pilot_${String(n + 10000)}`,
      hire_date: hireDate,
      retire_date: retireDate,
      originalSeat: seat,
      fleet,
      base,
    })
  }

  return pool
}

// ─── Snapshot generation ──────────────────────────────────────────────────────

function buildSnapshotEntries(listId, snapshotDate, pool, upgradedSet) {
  const cutoff = new Date(snapshotDate)

  // Active pilots on this snapshot date (not yet retired)
  const active = pool.filter((p) => {
    if (!p.retire_date) return true
    return new Date(p.retire_date) > cutoff
  })

  // Renumber 1..N preserving original relative order
  return active.map((pilot, idx) => ({
    list_id: listId,
    seniority_number: idx + 1,
    employee_number: pilot.employee_number,
    name: pilot.name,
    hire_date: pilot.hire_date,
    retire_date: pilot.retire_date,
    base: pilot.base,
    fleet: pilot.fleet,
    seat: upgradedSet.has(pilot.employee_number) ? 'CA' : pilot.originalSeat,
  }))
}

// When CAs retire in an interval, the same number of senior FOs get upgraded.
function computeUpgrades(pool, fromDate, toDate, previousUpgrades) {
  const from = new Date(fromDate)
  const to   = new Date(toDate)

  const caRetirements = pool.filter((p) => {
    if (p.originalSeat !== 'CA') return false
    if (!p.retire_date) return false
    const rd = new Date(p.retire_date)
    return rd > from && rd <= to
  }).length

  const newUpgrades = new Set(previousUpgrades)

  const candidates = pool
    .filter((p) => {
      if (p.originalSeat !== 'FO') return false
      if (newUpgrades.has(p.employee_number)) return false
      // Must still be active at toDate
      if (p.retire_date && new Date(p.retire_date) <= to) return false
      return true
    })
    .sort((a, b) => a.originalSenNum - b.originalSenNum) // most senior FO first

  for (let i = 0; i < Math.min(caRetirements, candidates.length); i++) {
    newUpgrades.add(candidates[i].employee_number)
  }

  return newUpgrades
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function upsertList(list, airline) {
  const { error } = await supabase.from('seniority_lists').upsert({
    id:             list.id,
    airline:        airline.icao,
    effective_date: list.date,
    uploaded_by:    airline.uploadedBy,
    status:         list.status,
  })
  if (error) throw new Error(`List ${airline.icao} ${list.date}: ${error.message}`)
}

async function replaceEntries(listId, entries) {
  const { error: delError } = await supabase
    .from('seniority_entries')
    .delete()
    .eq('list_id', listId)
  if (delError) throw new Error(`Delete entries ${listId}: ${delError.message}`)

  for (let i = 0; i < entries.length; i += 500) {
    const { error } = await supabase
      .from('seniority_entries')
      .insert(entries.slice(i, i + 500))
    if (error) throw new Error(`Insert entries batch ${i}: ${error.message}`)
  }
}

// ─── Main seeder ──────────────────────────────────────────────────────────────

export async function seedSeniority() {
  let totalEntries = 0

  for (const airline of AIRLINES) {
    const pool = buildPilotPool(airline)

    let upgradedSet = new Set()

    for (let i = 0; i < airline.listIds.length; i++) {
      const list = airline.listIds[i]

      if (i > 0) {
        const prevDate = airline.listIds[i - 1].date
        upgradedSet = computeUpgrades(pool, prevDate, list.date, upgradedSet)
      }

      const entries = buildSnapshotEntries(list.id, list.date, pool, upgradedSet)
      await upsertList(list, airline)
      await replaceEntries(list.id, entries)
      totalEntries += entries.length
    }

    const activeCt = airline.listIds.reduce((_, list, i) => {
      if (i === airline.listIds.length - 1) {
        const cutoff = new Date(list.date)
        return pool.filter((p) => !p.retire_date || new Date(p.retire_date) > cutoff).length
      }
      return 0
    }, 0)

    console.log(`  ✓ ${airline.icao}: ${airline.listIds.length} snapshots, ~${activeCt} active pilots in latest`)
  }

  console.log(`  ✓ ${totalEntries} total entries across ${AIRLINES.reduce((s, a) => s + a.listIds.length, 0)} lists`)
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
