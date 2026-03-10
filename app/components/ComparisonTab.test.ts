import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ComparisonTab from './ComparisonTab.vue'
import type { TableColumn } from '@nuxt/ui'
import type { FilterConfig } from '~/utils/column-definitions'

interface TestRow {
  name: string
  old_seat: string
  new_seat: string
  old_fleet: string
  new_fleet: string
  old_base: string
  new_base: string
}

const testColumns: TableColumn<TestRow>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'old_seat', header: 'Old Seat' },
  { accessorKey: 'new_seat', header: 'New Seat' },
  { accessorKey: 'old_fleet', header: 'Old Fleet' },
  { accessorKey: 'new_fleet', header: 'New Fleet' },
  { accessorKey: 'old_base', header: 'Old Base' },
  { accessorKey: 'new_base', header: 'New Base' },
]

const testFilters: FilterConfig[] = [
  { key: 'old_seat', label: 'Old Seat' },
  { key: 'new_seat', label: 'New Seat' },
  { key: 'old_fleet', label: 'Old Fleet' },
  { key: 'new_fleet', label: 'New Fleet' },
  { key: 'old_base', label: 'Old Base' },
  { key: 'new_base', label: 'New Base' },
]

const testData: TestRow[] = [
  { name: 'Alice', old_seat: 'CA', new_seat: 'FO', old_fleet: 'E190', new_fleet: 'A220', old_base: 'BOS', new_base: 'JFK' },
  { name: 'Bob', old_seat: 'FO', new_seat: 'CA', old_fleet: 'A220', new_fleet: 'A220', old_base: 'JFK', new_base: 'JFK' },
  { name: 'Charlie', old_seat: 'CA', new_seat: 'CA', old_fleet: 'E190', new_fleet: 'E190', old_base: 'BOS', new_base: 'BOS' },
  { name: 'Diana', old_seat: 'FO', new_seat: 'FO', old_fleet: 'A220', new_fleet: 'E190', old_base: 'LAX', new_base: 'BOS' },
]

describe('ComparisonTab', () => {
  describe('without filters prop', () => {
    it('does NOT render filter dropdowns', async () => {
      const wrapper = await mountSuspended(ComparisonTab, {
        props: {
          data: testData,
          columns: testColumns,
        },
      })
      expect(wrapper.find('[data-testid="filter-bar"]').exists()).toBe(false)
    })

    it('shows all rows when no filters prop is provided', async () => {
      const wrapper = await mountSuspended(ComparisonTab, {
        props: {
          data: testData,
          columns: testColumns,
        },
      })
      // The results count should reflect all data
      expect(wrapper.text()).toContain(`${testData.length} results`)
    })
  })

  describe('with filters prop', () => {
    it('renders filter dropdowns for each filter config', async () => {
      const wrapper = await mountSuspended(ComparisonTab, {
        props: {
          data: testData,
          columns: testColumns,
          filters: testFilters,
        },
      })
      const filterBar = wrapper.find('[data-testid="filter-bar"]')
      expect(filterBar.exists()).toBe(true)
      // Should have one select menu per filter config
      for (const f of testFilters) {
        expect(wrapper.text()).toContain(f.label)
      }
    })

    it('shows all rows when no filters are active', async () => {
      const wrapper = await mountSuspended(ComparisonTab, {
        props: {
          data: testData,
          columns: testColumns,
          filters: testFilters,
        },
      })
      expect(wrapper.text()).toContain(`${testData.length} results`)
    })

    it('extracts unique filter options from data', async () => {
      const wrapper = await mountSuspended(ComparisonTab, {
        props: {
          data: testData,
          columns: testColumns,
          filters: testFilters,
        },
      })
      // Verify filterOptions are computed correctly via the exposed or internal state
      // The old_seat field should have unique values: CA, FO
      const vm = wrapper.vm as any
      expect(vm.filterOptions).toBeDefined()
      const oldSeatOptions = vm.filterOptions.old_seat
      expect(oldSeatOptions).toHaveLength(2)
      expect(oldSeatOptions).toContain('CA')
      expect(oldSeatOptions).toContain('FO')

      // old_fleet should have E190, A220
      const oldFleetOptions = vm.filterOptions.old_fleet
      expect(oldFleetOptions).toHaveLength(2)
      expect(oldFleetOptions).toContain('E190')
      expect(oldFleetOptions).toContain('A220')

      // old_base should have BOS, JFK, LAX
      const oldBaseOptions = vm.filterOptions.old_base
      expect(oldBaseOptions).toHaveLength(3)
      expect(oldBaseOptions).toContain('BOS')
      expect(oldBaseOptions).toContain('JFK')
      expect(oldBaseOptions).toContain('LAX')
    })

    it('filters by a single value on one field (single select)', async () => {
      const wrapper = await mountSuspended(ComparisonTab, {
        props: {
          data: testData,
          columns: testColumns,
          filters: testFilters,
        },
      })
      const vm = wrapper.vm as any
      // Set filter for old_seat = CA
      vm.activeFilters.old_seat = ['CA']
      await wrapper.vm.$nextTick()

      // Alice and Charlie have old_seat = CA
      expect(vm.filteredData).toHaveLength(2)
      expect(vm.filteredData.map((r: TestRow) => r.name)).toEqual(
        expect.arrayContaining(['Alice', 'Charlie']),
      )
    })

    it('applies OR logic within a single filter (multi-select)', async () => {
      const wrapper = await mountSuspended(ComparisonTab, {
        props: {
          data: testData,
          columns: testColumns,
          filters: testFilters,
        },
      })
      const vm = wrapper.vm as any
      // Set filter old_seat = CA OR FO -> should show all rows
      vm.activeFilters.old_seat = ['CA', 'FO']
      await wrapper.vm.$nextTick()

      expect(vm.filteredData).toHaveLength(4)
    })

    it('applies AND logic across multiple filters', async () => {
      const wrapper = await mountSuspended(ComparisonTab, {
        props: {
          data: testData,
          columns: testColumns,
          filters: testFilters,
        },
      })
      const vm = wrapper.vm as any
      // old_seat = CA AND new_fleet = A220 -> only Alice matches
      vm.activeFilters.old_seat = ['CA']
      vm.activeFilters.new_fleet = ['A220']
      await wrapper.vm.$nextTick()

      expect(vm.filteredData).toHaveLength(1)
      expect(vm.filteredData[0].name).toBe('Alice')
    })

    it('clearing a filter restores all rows', async () => {
      const wrapper = await mountSuspended(ComparisonTab, {
        props: {
          data: testData,
          columns: testColumns,
          filters: testFilters,
        },
      })
      const vm = wrapper.vm as any
      // Apply a filter
      vm.activeFilters.old_seat = ['CA']
      await wrapper.vm.$nextTick()
      expect(vm.filteredData).toHaveLength(2)

      // Clear it
      vm.activeFilters.old_seat = []
      await wrapper.vm.$nextTick()
      expect(vm.filteredData).toHaveLength(4)
    })

    it('result count updates correctly with filtering', async () => {
      const wrapper = await mountSuspended(ComparisonTab, {
        props: {
          data: testData,
          columns: testColumns,
          filters: testFilters,
        },
      })
      const vm = wrapper.vm as any
      // Initially all rows
      expect(vm.filteredData).toHaveLength(4)

      // Apply filter: old_base = LAX -> only Diana
      vm.activeFilters.old_base = ['LAX']
      await wrapper.vm.$nextTick()
      expect(vm.filteredData).toHaveLength(1)
      expect(vm.filteredData[0].name).toBe('Diana')
    })
  })
})
