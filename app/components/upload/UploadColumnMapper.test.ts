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

describe('UploadColumnMapper', () => {
  it('passes distinct suggested and original groups and emits either selection', async () => {
    const USelectMenu = defineComponent({
      name: 'USelectMenu',
      props: { items: { type: Array, default: () => [] } },
      emits: ['update:modelValue'],
      template: '<button @click="$emit(\'update:modelValue\', items[0]?.[0]?.value)"><slot /></button>',
    })
    const wrapper = await mountSuspended(UploadColumnMapper, {
      props: {
        headers: ['Suggested name', 'Original base'],
        columnIds: ['plugin:jetblue:name', 'source:column:1'],
        columnMap,
        mappingOptions,
        sampleRows: [['Alice', 'JFK']],
        sourceHeaders: ['Name', 'Base'],
      },
      global: { stubs: { USelectMenu } },
    })

    const menus = wrapper.findAllComponents(USelectMenu)
    expect(menus.length).toBeGreaterThan(0)
    const groups = menus[0]!.props('items') as Array<Array<{ label: string, value: string }>>
    expect(groups).toEqual([
      [{ label: 'Suggested: Suggested name', value: 'plugin:jetblue:name' }],
      [{ label: 'Original: Original base', value: 'source:column:1' }],
    ])

    await menus[0]!.vm.$emit('update:modelValue', 'plugin:jetblue:name')
    await menus[1]!.vm.$emit('update:modelValue', 'source:column:1')
    expect(wrapper.emitted('update:columnMap')?.length).toBe(2)
    expect(wrapper.emitted('update:columnMap')?.[0]?.[0]).toMatchObject({ seniority_number: 'plugin:jetblue:name' })
    expect(wrapper.emitted('update:columnMap')?.[1]?.[0]).toMatchObject({ employee_number: 'source:column:1' })
  })
})
