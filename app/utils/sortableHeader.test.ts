import { describe, it, expect, vi } from 'vitest'
import type { Column } from '@tanstack/vue-table'
import { sortableHeader } from './sortableHeader'

describe('sortableHeader', () => {
  function mockColumn(sortState: false | 'asc' | 'desc') {
    return {
      getIsSorted: () => sortState,
      toggleSorting: vi.fn(),
    } as unknown as Column<unknown>
  }

  it('returns a render function', () => {
    const header = sortableHeader('Email')
    expect(typeof header).toBe('function')
  })

  it('renders with arrow-up-down icon when not sorted', () => {
    const header = sortableHeader('Email')
    const column = mockColumn(false)
    const vnode = header({ column })
    expect(vnode.props?.icon).toBe('i-lucide-arrow-up-down')
    expect(vnode.props?.label).toBe('Email')
  })

  it('renders with arrow-up-narrow-wide icon when sorted ascending', () => {
    const header = sortableHeader('Email')
    const column = mockColumn('asc')
    const vnode = header({ column })
    expect(vnode.props?.icon).toBe('i-lucide-arrow-up-narrow-wide')
  })

  it('renders with arrow-down-wide-narrow icon when sorted descending', () => {
    const header = sortableHeader('Email')
    const column = mockColumn('desc')
    const vnode = header({ column })
    expect(vnode.props?.icon).toBe('i-lucide-arrow-down-wide-narrow')
  })

  it('calls toggleSorting on click', () => {
    const header = sortableHeader('Email')
    const column = mockColumn(false)
    const vnode = header({ column })
    vnode.props?.onClick()
    expect(column.toggleSorting).toHaveBeenCalled()
  })
})
