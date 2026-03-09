// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { useTableFeatures } from './useTableFeatures'

describe('useTableFeatures', () => {
  it('returns pagination with default pageSize of 50', () => {
    const { pagination } = useTableFeatures('table')
    expect(pagination.value.pageSize).toBe(50)
    expect(pagination.value.pageIndex).toBe(0)
  })

  it('accepts custom pageSize', () => {
    const { pagination } = useTableFeatures('table', { pageSize: 25 })
    expect(pagination.value.pageSize).toBe(25)
  })

  it('returns globalFilter as empty string', () => {
    const { globalFilter } = useTableFeatures('table')
    expect(globalFilter.value).toBe('')
  })

  it('returns sorting as empty array by default', () => {
    const { sorting } = useTableFeatures('table')
    expect(sorting.value).toEqual([])
  })

  it('accepts defaultSorting', () => {
    const { sorting } = useTableFeatures('table', {
      defaultSorting: [{ id: 'name', desc: false }],
    })
    expect(sorting.value).toEqual([{ id: 'name', desc: false }])
  })

  it('resets pageIndex to 0 when globalFilter changes', async () => {
    const { pagination, globalFilter } = useTableFeatures('table')

    // Simulate being on page 3
    pagination.value.pageIndex = 2
    expect(pagination.value.pageIndex).toBe(2)

    // Changing the filter should reset to page 0
    globalFilter.value = 'search term'
    await nextTick()
    expect(pagination.value.pageIndex).toBe(0)
  })

  it('provides paginationOptions with getPaginationRowModel', () => {
    const { paginationOptions } = useTableFeatures('table')
    expect(paginationOptions.getPaginationRowModel).toBeDefined()
    expect(typeof paginationOptions.getPaginationRowModel).toBe('function')
  })

  it('currentPage defaults to 1 when tableRef is not mounted', () => {
    const { currentPage } = useTableFeatures('table')
    expect(currentPage.value).toBe(1)
  })

  it('pageCount defaults to 1 when tableRef is not mounted', () => {
    const { pageCount } = useTableFeatures('table')
    expect(pageCount.value).toBe(1)
  })

  it('totalRows defaults to 0 when tableRef is not mounted', () => {
    const { totalRows } = useTableFeatures('table')
    expect(totalRows.value).toBe(0)
  })
})
