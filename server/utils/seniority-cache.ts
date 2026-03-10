const TTL = 300 // 5 minutes in seconds

function cacheKey(type: string, id: string) {
  return `seniority:${type}:${id}`
}

export function listsKey(userId: string) { return cacheKey('lists', userId) }
export function listKey(listId: string) { return cacheKey('list', listId) }
export function entriesKey(listId: string) { return cacheKey('entries', listId) }

export async function getCached<T>(key: string): Promise<T | null> {
  const storage = useStorage('cache')
  const item = await storage.getItem<{ data: T; expiry: number }>(key)
  if (!item || Date.now() > item.expiry) {
    if (item) await storage.removeItem(key)
    return null
  }
  return item.data
}

export async function setCache<T>(key: string, data: T): Promise<void> {
  const storage = useStorage('cache')
  await storage.setItem(key, { data, expiry: Date.now() + TTL * 1000 })
}

export async function invalidateCache(...keys: string[]): Promise<void> {
  const storage = useStorage('cache')
  await Promise.all(keys.map(k => storage.removeItem(k)))
}
