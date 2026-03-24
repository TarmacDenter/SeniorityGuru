import Dexie from 'dexie'

export interface LocalSeniorityList {
  id?: number
  title: string | null
  effectiveDate: string
  createdAt: string
}

export interface LocalSeniorityEntry {
  id?: number
  listId: number
  seniorityNumber: number
  employeeNumber: string
  name: string | null
  seat: string
  base: string
  fleet: string
  hireDate: string
  retireDate: string
}

export interface LocalPreference {
  key: string
  value: string
}

class SeniorityGuruDB extends Dexie {
  seniorityLists!: Dexie.Table<LocalSeniorityList, number>
  seniorityEntries!: Dexie.Table<LocalSeniorityEntry, number>
  preferences!: Dexie.Table<LocalPreference, string>

  constructor() {
    super('SeniorityGuru')
    this.version(1).stores({
      seniorityLists: '++id, effectiveDate',
      seniorityEntries: '++id, listId, seniorityNumber, employeeNumber',
      preferences: 'key',
    })
  }

  async deleteList(listId: number): Promise<void> {
    await this.transaction('rw', this.seniorityLists, this.seniorityEntries, async () => {
      await this.seniorityEntries.where('listId').equals(listId).delete()
      await this.seniorityLists.delete(listId)
    })
  }
}

export const db = new SeniorityGuruDB()
