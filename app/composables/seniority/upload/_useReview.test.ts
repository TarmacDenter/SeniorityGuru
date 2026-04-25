import { describe, it, expect } from 'vitest'
import { _useReview } from './_useReview'
import { _useProgressTracker } from './_useProgressTracker'
import { makePartialEntry } from '~/test-utils/factories'

function createReview() {
  const entries = ref<any[]>([])
  const rowErrors = shallowRef<Map<number, string[]>>(new Map())
  const syntheticNote = ref<string | null>(null)
  const syntheticIndices = ref<Set<number>>(new Set())
  const progress = _useProgressTracker()

  const review = _useReview({
    entries,
    rowErrors,
    syntheticNote,
    syntheticIndices,
    progress,
  })
  return { review, entries, rowErrors, syntheticNote, syntheticIndices }
}

describe('_useReview', () => {
  describe('deleteRow', () => {
    it('removes the correct entry by original index', () => {
      const { review } = createReview()
      review.entries.value = [
        makePartialEntry({ seniority_number: 1, employee_number: '100' }),
        makePartialEntry({ seniority_number: 2, employee_number: '200' }),
        makePartialEntry({ seniority_number: 3, employee_number: '300' }),
        makePartialEntry({ seniority_number: 4, employee_number: '400' }),
        makePartialEntry({ seniority_number: 5, employee_number: '500' }),
      ]
      review.rowErrors.value = new Map([
        [1, ['some error']],
        [3, ['another error']],
      ])

      review.deleteRow(3)

      expect(review.entries.value).toHaveLength(4)
      expect(review.entries.value.map(e => e.employee_number)).toEqual(['100', '200', '300', '500'])
    })

    it('shifts error map correctly after deletion', () => {
      const { review } = createReview()
      review.entries.value = [
        makePartialEntry({ seniority_number: 1 }),
        makePartialEntry({ seniority_number: 2 }),
        makePartialEntry({ seniority_number: 3 }),
        makePartialEntry({ seniority_number: 4 }),
      ]
      review.rowErrors.value = new Map([
        [0, ['error on 0']],
        [2, ['error on 2']],
        [3, ['error on 3']],
      ])

      review.deleteRow(1)

      expect(review.rowErrors.value.has(0)).toBe(true)
      expect(review.rowErrors.value.has(1)).toBe(true) // was index 2
      expect(review.rowErrors.value.has(2)).toBe(true) // was index 3
      expect(review.rowErrors.value.has(3)).toBe(false)
    })

    it('decrements seniority_number for all entries junior to the deleted row', () => {
      const { review } = createReview()
      review.entries.value = [
        makePartialEntry({ seniority_number: 1, employee_number: '100' }),
        makePartialEntry({ seniority_number: 2, employee_number: '200' }),
        makePartialEntry({ seniority_number: 3, employee_number: '300' }),
        makePartialEntry({ seniority_number: 4, employee_number: '400' }),
        makePartialEntry({ seniority_number: 5, employee_number: '500' }),
      ]

      review.deleteRow(1) // delete seniority #2

      expect(review.entries.value.map(e => e.seniority_number)).toEqual([1, 2, 3, 4])
    })

    it('does not change seniority_number for entries senior to the deleted row', () => {
      const { review } = createReview()
      review.entries.value = [
        makePartialEntry({ seniority_number: 1, employee_number: '100' }),
        makePartialEntry({ seniority_number: 2, employee_number: '200' }),
        makePartialEntry({ seniority_number: 3, employee_number: '300' }),
      ]

      review.deleteRow(2) // delete seniority #3 (most junior)

      expect(review.entries.value[0]!.seniority_number).toBe(1)
      expect(review.entries.value[1]!.seniority_number).toBe(2)
    })

    it('does not decrement juniors when the deleted seniority number still exists (duplicate case)', () => {
      const { review } = createReview()
      review.entries.value = [
        makePartialEntry({ seniority_number: 1, employee_number: '100' }),
        makePartialEntry({ seniority_number: 2, employee_number: '200' }), // duplicate #2
        makePartialEntry({ seniority_number: 2, employee_number: '300' }), // duplicate #2
        makePartialEntry({ seniority_number: 3, employee_number: '400' }),
      ]

      review.deleteRow(1) // delete first #2

      // #3 must NOT be decremented — the surviving #2 already fills that slot
      expect(review.entries.value.map(e => e.seniority_number)).toEqual([1, 2, 3])
      expect(review.entries.value.map(e => e.employee_number)).toEqual(['100', '300', '400'])
    })

    it('clears structural seniority errors while preserving other field errors', () => {
      const { review } = createReview()
      review.entries.value = [
        makePartialEntry({ seniority_number: 1, employee_number: '100' }),
        makePartialEntry({ seniority_number: 1, employee_number: '200' }), // duplicate
        makePartialEntry({ seniority_number: 2, employee_number: '300' }),
      ]
      review.rowErrors.value = new Map([
        [0, ['seniority_number: Duplicate seniority number 1']],
        [1, ['hire_date: Invalid date', 'seniority_number: Duplicate seniority number 1']],
        [2, ['seniority_number: Non-contiguous sequence — expected 1..3, found 2']],
      ])

      review.deleteRow(0) // remove one of the duplicates

      // Structural errors purged; non-structural errors preserved at reindexed positions
      const errorsAt0 = review.rowErrors.value.get(0)
      expect(errorsAt0).toBeDefined()
      expect(errorsAt0!.some(e => e.includes('hire_date'))).toBe(true)
      expect(errorsAt0!.some(e => e.includes('Duplicate'))).toBe(false)
      expect(review.rowErrors.value.has(1)).toBe(false) // index 2 had only structural errors → cleared
    })
  })

  describe('insertRowAt', () => {
    it('inserts a blank entry at the given index, increasing length by 1', () => {
      const { review } = createReview()
      review.entries.value = [
        makePartialEntry({ seniority_number: 1, employee_number: '100' }),
        makePartialEntry({ seniority_number: 2, employee_number: '200' }),
        makePartialEntry({ seniority_number: 3, employee_number: '300' }),
      ]

      review.insertRowAt(1)

      expect(review.entries.value).toHaveLength(4)
      expect(review.entries.value[1]!.employee_number).toBe('')
    })

    it('new entry gets the seniority_number of the displaced entry', () => {
      const { review } = createReview()
      review.entries.value = [
        makePartialEntry({ seniority_number: 1 }),
        makePartialEntry({ seniority_number: 2 }),
        makePartialEntry({ seniority_number: 3 }),
      ]

      review.insertRowAt(1)

      expect(review.entries.value[1]!.seniority_number).toBe(2)
    })

    it('increments seniority_number for all entries at and junior to the insert point', () => {
      const { review } = createReview()
      review.entries.value = [
        makePartialEntry({ seniority_number: 1, employee_number: '100' }),
        makePartialEntry({ seniority_number: 2, employee_number: '200' }),
        makePartialEntry({ seniority_number: 3, employee_number: '300' }),
      ]

      review.insertRowAt(1)

      // index 0 (seniority 1) unchanged; original indices 1 and 2 shifted to 3 and 4
      expect(review.entries.value[0]!.seniority_number).toBe(1)
      expect(review.entries.value[2]!.seniority_number).toBe(3) // was #2
      expect(review.entries.value[3]!.seniority_number).toBe(4) // was #3
    })

    it('shifts error map indices at and above rowIndex up by 1', () => {
      const { review } = createReview()
      review.entries.value = [
        makePartialEntry({ seniority_number: 1 }),
        makePartialEntry({ seniority_number: 2 }),
        makePartialEntry({ seniority_number: 3 }),
      ]
      review.rowErrors.value = new Map([
        [0, ['error on 0']],
        [2, ['error on 2']],
      ])

      review.insertRowAt(1)

      expect(review.rowErrors.value.has(0)).toBe(true)  // unchanged
      expect(review.rowErrors.value.has(1)).toBe(false) // new blank row — no pre-existing error
      expect(review.rowErrors.value.has(3)).toBe(true)  // was index 2, shifted to 3
    })
  })

  describe('deleteErrorRows', () => {
    it('removes all rows that have errors and keeps clean rows', () => {
      const { review } = createReview()
      review.entries.value = [
        makePartialEntry({ seniority_number: 1, employee_number: '900001' }),
        makePartialEntry({ seniority_number: 2, employee_number: '900002' }),
        makePartialEntry({ seniority_number: 3, employee_number: '900003' }),
        makePartialEntry({ seniority_number: 4, employee_number: '900004' }),
        makePartialEntry({ seniority_number: 5, employee_number: '900005' }),
      ]
      review.rowErrors.value = new Map([
        [1, ['retire_date: Invalid']],
        [3, ['retire_date: Invalid']],
      ])

      const deleted = review.deleteErrorRows()

      expect(deleted).toBe(2)
      expect(review.entries.value).toHaveLength(3)
      expect(review.entries.value.map(e => e.employee_number)).toEqual(['900001', '900003', '900005'])
    })

    it('returns 0 when no errors exist', () => {
      const { review } = createReview()
      review.entries.value = [
        makePartialEntry({ seniority_number: 1 }),
        makePartialEntry({ seniority_number: 2 }),
      ]
      review.rowErrors.value = new Map()

      const deleted = review.deleteErrorRows()

      expect(deleted).toBe(0)
      expect(review.entries.value).toHaveLength(2)
    })
  })

  describe('updateCell', () => {
    it('updates the cell at the given original index', () => {
      const { review } = createReview()
      review.entries.value = [
        makePartialEntry({ seniority_number: 1, name: 'Alice' }),
        makePartialEntry({ seniority_number: 2, name: 'Bob' }),
        makePartialEntry({ seniority_number: 3, name: 'Charlie' }),
      ]

      review.updateCell(1, 'name', 'Robert')

      expect(review.entries.value[1]!.name).toBe('Robert')
      expect(review.entries.value[0]!.name).toBe('Alice')
      expect(review.entries.value[2]!.name).toBe('Charlie')
    })
  })

  describe('canAdvance', () => {
    it('is true when entries exist and no errors', () => {
      const { review } = createReview()
      review.entries.value = [makePartialEntry({ seniority_number: 1 })]
      review.rowErrors.value = new Map()
      expect(review.canAdvance.value).toBe(true)
    })

    it('is false when errors exist', () => {
      const { review } = createReview()
      review.entries.value = [makePartialEntry({ seniority_number: 1 })]
      review.rowErrors.value = new Map([[0, ['error']]])
      expect(review.canAdvance.value).toBe(false)
    })

    it('is false when entries are empty', () => {
      const { review } = createReview()
      review.entries.value = []
      review.rowErrors.value = new Map()
      expect(review.canAdvance.value).toBe(false)
    })
  })

  describe('errorCount', () => {
    it('reflects rowErrors size', () => {
      const { review } = createReview()
      expect(review.errorCount.value).toBe(0)
      review.rowErrors.value = new Map([[0, ['a']], [2, ['b']]])
      expect(review.errorCount.value).toBe(2)
    })
  })
})
