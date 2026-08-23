import { defineComponent } from 'vue'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { makeDomainEntry, makeList } from '~/test-utils/factories'

const state = vi.hoisted(() => {
  const { ref: vRef } = require('vue')
  return {
    lists: vRef([]),
    entries: vRef([]),
    entriesLoading: vRef(false),
    employeeNumber: vRef(null),
    isNewHireMode: vRef(false),
  }
})

vi.mock('~/composables/seniority', () => ({
  useSeniorityLists: () => ({ lists: state.lists, entriesLoading: state.entriesLoading }),
  useSeniorityCore: () => ({ entries: state.entries, isNewHireMode: state.isNewHireMode }),
}))

mockNuxtImport('useUser', () => () => ({ employeeNumber: state.employeeNumber }))

const stubs = {
  USelect: defineComponent({
    props: { modelValue: { type: String, default: '' }, items: { type: Array, default: () => [] } },
    emits: ['update:modelValue'],
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="item in items" :key="item.value" :value="item.value">{{ item.label }}</option></select>',
  }),
  UInput: defineComponent({
    props: { modelValue: { type: String, default: '' } },
    emits: ['update:modelValue'],
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  }),
  UButton: defineComponent({
    props: { disabled: Boolean },
    template: '<button :disabled="disabled"><slot /></button>',
  }),
  UEmpty: defineComponent({ template: '<div data-testid="empty"><slot />{{ title }}</div>', props: { title: String } }),
  UTable: defineComponent({
    props: { data: { type: Array, default: () => [] }, loading: Boolean },
    setup(props) {
      const tableApi = {
        getState: () => ({ pagination: { pageIndex: 0 } }),
        getPageCount: () => Math.max(1, Math.ceil(props.data.length / 50)),
        getFilteredRowModel: () => ({ rows: props.data.map(() => ({})) }),
        setGlobalFilter: vi.fn(),
        setPageIndex: vi.fn(),
      }
      return { tableApi }
    },
    template: '<div data-testid="table"><span v-if="loading" data-testid="loading">loading</span><div v-for="row in data" :key="row.employeeNumber + row.status">{{ row.name }}|{{ row.employeeNumber }}|{{ row.qualificationRank }}|{{ row.companyRank }}|{{ row.status }}|{{ row.isAnchor ? "anchor" : "" }}</div></div>',
  }),
  TablePagination: defineComponent({
    props: { currentPage: Number, pageCount: Number, totalRows: Number },
    template: '<div data-testid="pagination">page {{ currentPage }}/{{ pageCount }} · {{ totalRows }} rows</div>',
  }),
}

describe('SeniorityListViewer', () => {
  beforeEach(() => {
    state.lists.value = []
    state.entries.value = []
    state.entriesLoading.value = false
    state.employeeNumber.value = null
    state.isNewHireMode.value = false
  })

  it('keeps the table loading while the parent is loading', async () => {
    const Component = (await import('./SeniorityListViewer.vue')).default
    const wrapper = await mountSuspended(Component, {
      props: { loading: true },
      global: { stubs },
    })

    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="empty"]').exists()).toBe(false)
  })

  it('updates the displayed qual when a qual is selected', async () => {
    state.lists.value = [makeList()]
    state.employeeNumber.value = 'E1'
    state.entries.value = [
      makeDomainEntry({ seniority_number: 1, employee_number: 'E1', name: 'First', base: 'JFK', fleet: '737', seat: 'CA' }),
      makeDomainEntry({ seniority_number: 2, employee_number: 'E2', name: 'Second', base: 'JFK', fleet: '737', seat: 'CA' }),
      makeDomainEntry({ seniority_number: 3, employee_number: 'E3', name: 'Other', base: 'LAX', fleet: '320', seat: 'FO' }),
    ]
    const Component = (await import('./SeniorityListViewer.vue')).default
    const wrapper = await mountSuspended(Component, { global: { stubs } })

    await wrapper.find('select').setValue('JFK|737|CA')

    expect(wrapper.text()).toContain('JFK-737-CA · 2 pilots')
    expect(wrapper.text()).toContain('First|E1|1|1|active')
    expect(wrapper.find('div.flex-1.min-h-0.overflow-auto').exists()).toBe(true)

    await wrapper.find('button').trigger('click')

    await wrapper.find('select').setValue('__company_wide__')

    expect(wrapper.text()).toContain('Company-wide · 3 pilots')
    expect(wrapper.text()).toContain('First|E1|1|1|active|anchor')
  })

  it('keeps insertion synthetic and exposes pagination for large lists', async () => {
    state.lists.value = [makeList()]
    state.employeeNumber.value = 'E51'
    state.entries.value = Array.from({ length: 51 }, (_, index) => makeDomainEntry({
      seniority_number: index + 1,
      employee_number: index === 50 ? 'E51' : `E${index + 1}`,
      name: `Pilot ${index + 1}`,
      base: 'JFK',
      fleet: '737',
      seat: 'CA',
    }))
    const Component = (await import('./SeniorityListViewer.vue')).default
    const wrapper = await mountSuspended(Component, { global: { stubs } })

    expect(wrapper.find('[data-testid="pagination"]').text()).toContain('51 rows')
    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('Pilot 51|E51|51|51|active|anchor')
  })
})
