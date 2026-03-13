import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { createLogger } from '#shared/utils/logger'
import { detectUpgradeTransitions } from '#shared/utils/qual-analytics'

const log = createLogger('upgrade-tracker')

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const query = getQuery(event)
  const airlineId = query.airlineId as string | undefined
  if (!airlineId) throw createError({ statusCode: 400, statusMessage: 'airlineId required' })

  // Service role: needs to read all lists for the airline regardless of uploader
  const client = serverSupabaseServiceRole(event)

  const { data: lists, error: listsError } = await client
    .from('seniority_lists')
    .select('id, effective_date, title')
    .eq('airline', airlineId)
    .order('effective_date', { ascending: true })

  if (listsError) {
    log.error('Failed to load lists', { airlineId, error: listsError.message })
    throw createError({ statusCode: 500, statusMessage: 'Failed to load seniority lists' })
  }

  if (!lists || lists.length < 2) {
    return { intervals: [], totals: { upgrades: 0, fleetChanges: 0, downgrades: 0 }, hasEnoughData: false }
  }

  const intervals = []
  let totalUpgrades = 0
  let totalFleetChanges = 0
  let totalDowngrades = 0

  for (let i = 0; i < lists.length - 1; i++) {
    const olderList = lists[i]!
    const newerList = lists[i + 1]!

    const [olderEntries, newerEntries] = await Promise.all([
      client.from('seniority_entries').select('*').eq('list_id', olderList.id),
      client.from('seniority_entries').select('*').eq('list_id', newerList.id),
    ])

    if (olderEntries.error || newerEntries.error) continue

    const transitions = detectUpgradeTransitions(olderEntries.data ?? [], newerEntries.data ?? [])

    const upgrades = transitions.filter(t => t.type === 'upgrade').length
    const fleetChanges = transitions.filter(t => t.type === 'fleet-change').length
    const downgrades = transitions.filter(t => t.type === 'downgrade').length

    const fleetMap = new Map<string, { upgrades: number; fleetChanges: number; downgrades: number }>()
    for (const t of transitions) {
      const f = t.newFleet ?? t.oldFleet ?? 'Unknown'
      if (!fleetMap.has(f)) fleetMap.set(f, { upgrades: 0, fleetChanges: 0, downgrades: 0 })
      const entry = fleetMap.get(f)!
      if (t.type === 'upgrade') entry.upgrades++
      else if (t.type === 'fleet-change') entry.fleetChanges++
      else if (t.type === 'downgrade') entry.downgrades++
    }

    intervals.push({
      fromDate: olderList.effective_date,
      toDate: newerList.effective_date,
      upgrades,
      fleetChanges,
      downgrades,
      byFleet: Array.from(fleetMap.entries()).map(([fleet, counts]) => ({ fleet, ...counts })),
    })

    totalUpgrades += upgrades
    totalFleetChanges += fleetChanges
    totalDowngrades += downgrades
  }

  log.debug('Upgrade tracker computed', { airlineId, intervals: intervals.length })

  return {
    intervals,
    totals: { upgrades: totalUpgrades, fleetChanges: totalFleetChanges, downgrades: totalDowngrades },
    hasEnoughData: true,
  }
})
