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
  // Required-field order: seniority_number, employee_number, seat, base, fleet, name, retire_date, hire_date
  const options = (index: number) => (menus[index]!.props('items') as Item[][]).map(group => group.map(item => item.type === 'label' ? `# ${item.label}` : item.label))
  return { wrapper, menus, options }
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
    expect(options(3)).toEqual([['# Auto-detected', 'BASE CODE (auto-detected)'], ['# Other columns', 'Fleet', 'DOH']])
    expect(options(7)).toEqual([['# Auto-detected', 'DOH (auto-detected)'], ['# Other columns', 'BASE CODE', 'Fleet']])
  })

  it('lists every column untagged for a field with no suggestion', async () => {
    const { options } = await mountMapper({ headers, columnIds, columnSources, suggestedColumnIds })
    expect(options(0)).toEqual([['# Other columns', 'BASE CODE', 'Fleet', 'DOH']])
  })

  it('names the source column for a derived suggestion', async () => {
    const { options } = await mountMapper({
      headers: ['Base', 'Category'],
      columnIds: ['plugin:delta:base', 'source:column:2'],
      columnSources: { 'plugin:delta:base': { header: 'CATEGORY', kind: 'derived' } },
      suggestedColumnIds: { base: 'plugin:delta:base' },
    })
    expect(options(3)[0]).toEqual(['# Auto-detected', 'Base (derived from CATEGORY)'])
    expect(options(3)[1]).toEqual(['# Other columns', 'Category'])
  })

  it('falls back to Column N for blank headers and suffixes position only on collisions', async () => {
    const { options } = await mountMapper({
      headers: ['', 'Dup', 'Dup', 'Solo'],
      columnIds: ['source:column:0', 'source:column:1', 'source:column:2', 'source:column:3'],
      columnSources: {},
      suggestedColumnIds: {},
    })
    expect(options(0)).toEqual([['# Other columns', 'Column 1', 'Dup (column 2)', 'Dup (column 3)', 'Solo']])
  })

  it('keeps the tag on the suggestion when a different column is selected and emits the chosen id', async () => {
    const { wrapper, menus, options } = await mountMapper({
      headers, columnIds, columnSources, suggestedColumnIds,
      columnMap: { ...columnMap, base: 'source:column:1' },
    })
    expect(menus[3]!.props('modelValue')).toBe('source:column:1')
    expect(options(3)[0]).toEqual(['# Auto-detected', 'BASE CODE (auto-detected)'])
    await menus[3]!.vm.$emit('update:modelValue', 'plugin:x:base')
    expect(wrapper.emitted('update:columnMap')?.[0]?.[0]).toMatchObject({ base: 'plugin:x:base' })
  })
})
