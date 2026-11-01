import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import AnchoredTable from './AnchoredTable.vue'

interface Row {
  seniorityNumber: number
  name: string
  status: 'active' | 'retired'
  isAnchor: boolean
}

const rows: Row[] = [
  { seniorityNumber: 10, name: 'Pilot A', status: 'retired', isAnchor: false },
  { seniorityNumber: 20, name: 'Pilot B', status: 'active', isAnchor: false },
  { seniorityNumber: 30, name: 'Pilot C', status: 'active', isAnchor: true },
  { seniorityNumber: 40, name: 'Pilot D', status: 'active', isAnchor: false },
]

const columns: TableColumn<Row>[] = [
  { accessorKey: 'seniorityNumber', header: 'Seniority Number' },
  { accessorKey: 'name', header: 'Name' },
]

function mountTable() {
  return mountSuspended(defineComponent({
    setup: () => () => h(AnchoredTable as any, { data: rows, columns, markColumn: 'name' }),
  }))
}

describe('AnchoredTable', () => {
  it('lists the rows in order under their column headers', async () => {
    const wrapper = await mountTable()

    expect(wrapper.findAll('thead th').map(th => th.text())).toEqual(['Seniority Number', 'Name'])
    expect(wrapper.findAll('tbody tr').map(tr => tr.find('td').text())).toEqual(['10', '20', '30', '40'])
  })

  it('tells a screen reader which row is the pilot\'s own line, and only that one', async () => {
    const wrapper = await mountTable()

    const marked = wrapper.findAll('tbody tr').filter(tr => tr.text().includes('Your line'))
    expect(marked.map(tr => tr.find('td').text())).toEqual(['30'])
  })
})
