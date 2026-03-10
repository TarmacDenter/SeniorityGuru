import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import { TooltipProvider } from 'reka-ui'
import UploadReviewTable from './UploadReviewTable.vue'
import type { SeniorityEntry } from '#shared/schemas/seniority-list'

function makeEntry(overrides: Partial<SeniorityEntry> = {}): Partial<SeniorityEntry> {
  return {
    seniority_number: 1,
    employee_number: '100',
    name: 'Pilot A',
    seat: 'CA',
    base: 'LAX',
    fleet: '737',
    hire_date: '2020-01-01',
    retire_date: '2050-01-01',
    ...overrides,
  }
}

/**
 * Mount UploadReviewTable wrapped in TooltipProvider (required by UTooltip).
 */
async function mountTable(props: {
  entries: Partial<SeniorityEntry>[]
  rowErrors: Map<number, string[]>
  showErrorsOnly?: boolean
}) {
  const Wrapper = defineComponent({
    name: 'TestWrapper',
    setup() {
      return () =>
        h(TooltipProvider, null, {
          default: () =>
            h(UploadReviewTable, {
              ...props,
            }),
        })
    },
  })

  return mountSuspended(Wrapper)
}

describe('UploadReviewTable', () => {
  // 5 entries, errors at indices 2 and 4.
  const entries: Partial<SeniorityEntry>[] = [
    makeEntry({ seniority_number: 1, employee_number: '100', name: 'Alice' }),
    makeEntry({ seniority_number: 2, employee_number: '200', name: 'Bob' }),
    makeEntry({ seniority_number: 3, employee_number: '300', name: 'Charlie' }),
    makeEntry({ seniority_number: 4, employee_number: '400', name: 'Diana' }),
    makeEntry({ seniority_number: 5, employee_number: '500', name: 'Eve' }),
  ]

  const rowErrors = new Map<number, string[]>([
    [2, ['employee_number: Required']],
    [4, ['seat: Required']],
  ])

  describe('delete emits original index in filtered mode', () => {
    it('emits original index 4 when deleting the second error row in errors-only mode', async () => {
      const wrapper = await mountTable({
        entries,
        rowErrors,
        showErrorsOnly: true,
      })

      // In errors-only mode, only 2 rows shown (original indices 2 and 4).
      const deleteButtons = wrapper.findAll('button[aria-label="Delete row"]')
      expect(deleteButtons.length).toBe(2)

      // Click the second delete button — should emit original index 4, not filtered index 1
      await deleteButtons[1]!.trigger('click')

      const tableComponent = wrapper.findComponent(UploadReviewTable)
      const emitted = tableComponent.emitted('deleteRow')
      expect(emitted).toBeTruthy()
      expect(emitted![0]).toEqual([4]) // original index 4, NOT filtered index 1
    })

    it('emits original index 2 when deleting the first error row in errors-only mode', async () => {
      const wrapper = await mountTable({
        entries,
        rowErrors,
        showErrorsOnly: true,
      })

      const deleteButtons = wrapper.findAll('button[aria-label="Delete row"]')
      expect(deleteButtons.length).toBe(2)

      await deleteButtons[0]!.trigger('click')

      const tableComponent = wrapper.findComponent(UploadReviewTable)
      const emitted = tableComponent.emitted('deleteRow')
      expect(emitted).toBeTruthy()
      expect(emitted![0]).toEqual([2]) // original index 2, NOT filtered index 0
    })
  })

  describe('delete emits correct index in unfiltered mode', () => {
    it('emits the correct original index when not filtering', async () => {
      const emptyErrors = new Map<number, string[]>()
      const wrapper = await mountTable({
        entries,
        rowErrors: emptyErrors,
        showErrorsOnly: false,
      })

      const deleteButtons = wrapper.findAll('button[aria-label="Delete row"]')
      expect(deleteButtons.length).toBe(5)

      // Click the 4th delete button (index 3)
      await deleteButtons[3]!.trigger('click')

      const tableComponent = wrapper.findComponent(UploadReviewTable)
      const emitted = tableComponent.emitted('deleteRow')
      expect(emitted).toBeTruthy()
      expect(emitted![0]).toEqual([3])
    })
  })

  describe('error indicators use original index', () => {
    it('shows error icons for both error rows in filtered mode', async () => {
      const wrapper = await mountTable({
        entries,
        rowErrors,
        showErrorsOnly: true,
      })

      // Both displayed rows should show error icons since they are the error rows.
      // UIcon may render as a <span> or other element with the icon name as class or attribute.
      // Look for the error icon by searching all elements with text-error class inside the errors column.
      const html = wrapper.html()
      // Count occurrences of 'alert-triangle' in the rendered HTML
      const matches = html.match(/alert-triangle/g)
      expect(matches).toBeTruthy()
      expect(matches!.length).toBeGreaterThanOrEqual(2)
    })
  })
})
