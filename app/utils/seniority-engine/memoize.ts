/**
 * Stable JSON serialization that sorts object keys for deterministic output.
 * Handles nested objects, arrays, and primitives.
 */
export function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return JSON.stringify(value)
  if (typeof value !== 'object') return JSON.stringify(value)

  if (value instanceof Date) return JSON.stringify(value.toISOString())

  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']'
  }

  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  const pairs = keys.map(k => JSON.stringify(k) + ':' + stableStringify(obj[k]))
  return '{' + pairs.join(',') + '}'
}

/**
 * Last-one-wins memoization. Caches the most recent (args -> result) pair.
 * If the next call has the same arguments, returns the cached result.
 * If arguments differ, recomputes and replaces the cache entry.
 *
 * @param fn - The function to memoize
 * @param keyFn - Optional custom key function. Defaults to stableStringify(args).
 */
export function memoizeLast<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  keyFn?: (...args: TArgs) => string,
): (...args: TArgs) => TResult {
  let lastKey: string | undefined
  let lastResult: TResult | undefined

  return (...args: TArgs): TResult => {
    const key = keyFn ? keyFn(...args) : stableStringify(args)

    if (key === lastKey) {
      return lastResult as TResult
    }

    lastResult = fn(...args)
    lastKey = key
    return lastResult
  }
}
