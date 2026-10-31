import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import TrajectoryChart from './TrajectoryChart.vue'

const data = { labels: ['2026-06-15', '2027-06-15'], data: [60, 70] }
const stubs = { DashboardChart: true, InfoIcon: true }

describe('TrajectoryChart', () => {
  it('says why the trajectory ends when it stops at the Anchor Pilot retirement', async () => {
    const wrapper = await mountSuspended(TrajectoryChart, {
      props: { data, endedByLabel: 'Anchor Pilot retired' },
      global: { stubs },
    })

    expect(wrapper.get('[data-testid="trajectory-ended-by"]').text()).toBe('Anchor Pilot retired')
  })

  it('shows no end reason when the trajectory runs its full window', async () => {
    const wrapper = await mountSuspended(TrajectoryChart, { props: { data }, global: { stubs } })

    expect(wrapper.find('[data-testid="trajectory-ended-by"]').exists()).toBe(false)
  })
})
