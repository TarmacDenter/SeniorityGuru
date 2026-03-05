// supabase/scripts/seed-dev.js
// Dev-only: seeds users + seniority data in the correct order.
// Usage: node --env-file=.env supabase/scripts/seed-dev.js
//
// To run individual steps:
//   node --env-file=.env supabase/scripts/seed-users.js
//   node --env-file=.env supabase/scripts/seed-seniority.js

export {} // declare as ES module so top-level await is valid

// Set SEED_IMPORTED before dynamic imports so individual scripts skip their
// standalone execution guards. Static imports are hoisted past top-level code,
// so dynamic imports are required here for the guard to work correctly.
process.env.SEED_IMPORTED = '1'

const { seedAirlines }  = await import('./seed-airlines.js')
const { seedUsers }     = await import('./seed-users.js')
const { seedSeniority } = await import('./seed-seniority.js')

console.log('Seeding dev database...')
try {
  await seedAirlines()
  await seedUsers()
  await seedSeniority()
  console.log('Done!')
} catch (err) {
  console.error(`\nSeed failed: ${err.message}`)
  process.exit(1)
}
