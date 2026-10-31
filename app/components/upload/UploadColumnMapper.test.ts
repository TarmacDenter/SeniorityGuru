import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import UploadColumnMapper from './UploadColumnMapper.vue'
import type { UploadColumnMap, UploadMappingOptions } from '~/composables/seniority/upload/types'

const columnMap: UploadColumnMap = {
  seniority_number: null,
  employee_number: null,
  name: null,
  seat: null,
  base: null,
  fleet: null,
  hire_date: null,
  retire_date: null,
}

const mappingOptions: UploadMappingOptions = {
  nameMode: 'single',
  retireMode: 'direct',
  retirementAge: 65,
}

type Item = { label?: string, value?: string, type?: string }

const USelectMenu = defineComponent({
  name: 'USelectMenu',
  props: { items: { type: Array, default: () => [] }, modelValue: { type: String, default: undefined } },
  emits: ['update:modelValue'],
  template: '<button><slot /></button>',
})

async function mountMapper(props: Record<string, unknown>) {
  const wrapper = await mountSuspended(UploadColumnMapper, {
    props: { columnMap, mappingOptions, sampleRows: [], ...props } as never,
    global: { stubs: { USelectMenu } },
  })
  const menus = wrapper.findAllComponents(USelectMenu)
  // Dropdown render order of the mapper; the tests address dropdowns by field name only.
  const dropdownOrder = ['seniority_number', 'employee_number', 'seat', 'base', 'fleet', 'name', 'retire_date', 'hire_date'] as const
  const menuFor = (field: typeof dropdownOrder[number]) => menus[dropdownOrder.indexOf(field)]!
  const options = (field: typeof dropdownOrder[number]) => (menuFor(field).props('items') as Item[][]).map(group => group.map(item => item.type === 'label' ? `# ${item.label}` : item.label))
  return { wrapper, menuFor, options }
}

describe('UploadColumnMapper', () => {
  const headers = ['Base', 'Fleet', 'Hire']
  const columnIds = ['plugin:x:base', 'source:column:1', 'plugin:x:hire-date']
  const columnSources = {
    'plugin:x:base': { header: 'BASE CODE', kind: 'straight' },
    'plugin:x:hire-date': { header: 'DOH', kind: 'straight' },
  }
  const suggestedColumnIds = { base: 'plugin:x:base', hire_date: 'plugin:x:hire-date' }

  it('tags only the field\'s own suggestion with its source header', async () => {
    const { options } = await mountMapper({ headers, columnIds, columnSources, suggestedColumnIds })
    expect(options('base')).toEqual([['# Auto-detected', 'BASE CODE (auto-detected)'], ['# Other columns', 'Fleet', 'DOH']])
    expect(options('hire_date')).toEqual([['# Auto-detected', 'DOH (auto-detected)'], ['# Other columns', 'BASE CODE', 'Fleet']])
  })

  it('lists every column untagged for a field with no suggestion', async () => {
    const { options } = await mountMapper({ headers, columnIds, columnSources, suggestedColumnIds })
    expect(options('seniority_number')).toEqual([['# Other columns', 'BASE CODE', 'Fleet', 'DOH']])
  })

  it('names the source column for a derived suggestion', async () => {
    const { options } = await mountMapper({
      headers: ['Base', 'Category'],
      columnIds: ['plugin:delta:base', 'source:column:2'],
      columnSources: { 'plugin:delta:base': { header: 'CATEGORY', kind: 'derived' } },
      suggestedColumnIds: { base: 'plugin:delta:base' },
    })
    expect(options('base')[0]).toEqual(['# Auto-detected', 'Base (derived from CATEGORY)'])
    expect(options('base')[1]).toEqual(['# Other columns', 'Category'])
  })

  it('falls back to Column N for blank headers and suffixes position only on collisions', async () => {
    const { options } = await mountMapper({
      headers: ['', 'Dup', 'Dup', 'Solo'],
      columnIds: ['source:column:0', 'source:column:1', 'source:column:2', 'source:column:3'],
      columnSources: {},
      suggestedColumnIds: {},
    })
    expect(options('seniority_number')).toEqual([['# Other columns', 'Column 1', 'Dup (column 2)', 'Dup (column 3)', 'Solo']])
  })

  it('keeps the tag on the suggestion when a different column is selected and emits the chosen id', async () => {
    const { wrapper, menuFor, options } = await mountMapper({
      headers, columnIds, columnSources, suggestedColumnIds,
      columnMap: { ...columnMap, base: 'source:column:1' },
    })
    expect(menuFor('base').props('modelValue')).toBe('source:column:1')
    expect(options('base')[0]).toEqual(['# Auto-detected', 'BASE CODE (auto-detected)'])
    await menuFor('base').vm.$emit('update:modelValue', 'plugin:x:base')
    expect(wrapper.emitted('update:columnMap')?.[0]?.[0]).toMatchObject({ base: 'plugin:x:base' })
  })

  it('emits update:columnMap for each field the user changes', async () => {
    const { wrapper, menuFor } = await mountMapper({ headers, columnIds, columnSources, suggestedColumnIds })
    await menuFor('base').vm.$emit('update:modelValue', 'plugin:x:base')
    await menuFor('fleet').vm.$emit('update:modelValue', 'source:column:1')
    const emitted = wrapper.emitted('update:columnMap')!
    expect(emitted[0]![0]).toMatchObject({ base: 'plugin:x:base', fleet: null })
    expect(emitted[1]![0]).toMatchObject({ base: null, fleet: 'source:column:1' })
  })

  it('suffixes position when a tagged suggestion collides with another column header', async () => {
    const { options } = await mountMapper({
      headers: ['Base', 'Other', 'Base'],
      columnIds: ['plugin:x:base', 'source:column:1', 'source:column:2'],
      columnSources: { 'plugin:x:base': { header: 'Base', kind: 'straight' } },
      suggestedColumnIds: { base: 'plugin:x:base' },
    })
    expect(options('base')).toEqual([['# Auto-detected', 'Base (column 1) (auto-detected)'], ['# Other columns', 'Other', 'Base (column 3)']])
  })

  it('lists all columns untagged when the plugin made no suggestion for the field', async () => {
    const { options } = await mountMapper({ headers, columnIds, columnSources, suggestedColumnIds: { hire_date: 'plugin:x:hire-date' } })
    expect(options('base')).toEqual([['# Other columns', 'BASE CODE', 'Fleet', 'DOH']])
  })

  it('shows Column N, never the raw column id, for a source column without a label', async () => {
    const { options } = await mountMapper({
      headers: ['source:column:2', 'Base'],
      columnIds: ['source:column:2', 'source:column:3'],
      columnSources: {},
      suggestedColumnIds: {},
    })
    expect(options('base')).toEqual([['# Other columns', 'Column 1', 'Base']])
  })

  it('shows Column N when a suggestion derives from an unlabelled source column', async () => {
    const { options } = await mountMapper({
      headers: ['Base', 'source:column:2'],
      columnIds: ['plugin:x:base', 'source:column:2'],
      columnSources: { 'plugin:x:base': { header: '', kind: 'straight' } },
      suggestedColumnIds: { base: 'plugin:x:base' },
    })
    expect(options('base')).toEqual([['# Auto-detected', 'Base (auto-detected)'], ['# Other columns', 'Column 2']])
  })
})
