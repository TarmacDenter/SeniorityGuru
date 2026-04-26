import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import SeniorityListViewer from './SeniorityListViewer.vue'

const mockIsMobile = ref(true)
const mockLists = ref([{ id: 1, title: 'Latest', effectiveDate: '2026-01-01', createdAt: '2026-01-01' }])
const mockEntries = ref([
  {
    seniority_number: 1,
    employee_number: '12345',
    name: 'Pilot One',
    seat: 'CA',
    base: 'ATL',
    fleet: '737',
    hire_date: '2010-01-01',
    retire_date: '2030-01-01',
    listId: 1,
  },
])

mockNuxtImport('useSeniorityLists', () => () => ({
  lists: mockLists,
  entriesLoading: ref(false),
}))

mockNuxtImport('useSeniorityCore', () => () => ({
  entries: mockEntries,
}))

mockNuxtImport('useUser', () => () => ({
  employeeNumber: ref('12345'),
}))

vi.mock('@vueuse/core', () => ({
  useMediaQuery: () => mockIsMobile,
}))

describe('SeniorityListViewer mobile layout', () => {
  beforeEach(() => {
    mockIsMobile.value = true
  })

  it('renders list rows as mobile cards with key fields', async () => {
    const wrapper = await mountSuspended(SeniorityListViewer, {
      props: { loading: false },
    })

    expect(wrapper.text()).toContain('Pilot One')
    expect(wrapper.text()).toContain('Emp # 12345')
    expect(wrapper.text()).toContain('Seat')
    expect(wrapper.text()).toContain('Base')
  })
})
