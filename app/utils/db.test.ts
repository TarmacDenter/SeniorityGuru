// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from './db'

beforeEach(async () => {
  await db.seniorityLists.clear()
  await db.seniorityEntries.clear()
  await db.preferences.clear()
})

describe('seniorityLists', () => {
  it('stores and retrieves a list', async () => {
    const id = await db.seniorityLists.add({
      title: 'Jan 2025',
      effectiveDate: '2025-01-01',
      createdAt: '2025-01-15T00:00:00Z',
    })

    const list = await db.seniorityLists.get(id)
    expect(list?.title).toBe('Jan 2025')
    expect(list?.effectiveDate).toBe('2025-01-01')
  })
})

describe('seniorityEntries', () => {
  it('stores entries and queries by listId', async () => {
    const listId = await db.seniorityLists.add({
      title: null,
      effectiveDate: '2025-01-01',
      createdAt: '2025-01-15T00:00:00Z',
    })

    await db.seniorityEntries.bulkAdd([
      { listId, seniorityNumber: 1, employeeNumber: 'E001', name: 'Alice', seat: 'CA', base: 'LAX', fleet: 'B737', hireDate: '2010-01-01', retireDate: '2040-01-01' },
      { listId, seniorityNumber: 2, employeeNumber: 'E002', name: 'Bob', seat: 'FO', base: 'LAX', fleet: 'B737', hireDate: '2012-01-01', retireDate: '2042-01-01' },
    ])

    const entries = await db.seniorityEntries.where('listId').equals(listId).toArray()
    expect(entries).toHaveLength(2)
    expect(entries[0]!.employeeNumber).toBe('E001')
  })
})

describe('preferences', () => {
  it('stores and retrieves a preference by key', async () => {
    await db.preferences.put({ key: 'employeeNumber', value: 'E999' })
    const pref = await db.preferences.get('employeeNumber')
    expect(pref?.value).toBe('E999')
  })
})

describe('deleteList', () => {
  it('deletes list and all its entries transactionally', async () => {
    const listId = await db.seniorityLists.add({
      title: 'Test',
      effectiveDate: '2025-01-01',
      createdAt: '2025-01-15T00:00:00Z',
    })
    await db.seniorityEntries.bulkAdd([
      { listId, seniorityNumber: 1, employeeNumber: 'E001', name: null, seat: 'CA', base: 'LAX', fleet: 'B737', hireDate: '2010-01-01', retireDate: '2040-01-01' },
    ])

    await db.deleteList(listId)

    expect(await db.seniorityLists.get(listId)).toBeUndefined()
    expect(await db.seniorityEntries.where('listId').equals(listId).count()).toBe(0)
  })
})
