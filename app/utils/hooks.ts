/** All application hook events with their typed callback signatures. */
export interface AppHooks {
  // Demo lifecycle
  'app:demo:enter': () => Promise<void> | void
  'app:demo:exit': () => Promise<void> | void
  // Data lifecycle
  'list:added': (listId: number) => void
  'list:deleted': (listId: number) => void
  'list:changed': () => Promise<void> | void
  // User lifecycle (emitted by stores; no listeners required)
  'user:preference:changed': (key: string) => void
}

type HookHandler<K extends keyof AppHooks> = AppHooks[K]

const _registry = new Map<keyof AppHooks, Set<(...args: unknown[]) => unknown>>()

/** Register a handler for a named hook event. */
export function defineHook<K extends keyof AppHooks>(name: K, handler: HookHandler<K>): void {
  if (!_registry.has(name)) _registry.set(name, new Set())
  _registry.get(name)!.add(handler as (...args: unknown[]) => unknown)
}

/** Emit a named hook event, awaiting all async handlers in registration order. */
export async function emitHook<K extends keyof AppHooks>(
  name: K,
  ...args: Parameters<HookHandler<K>>
): Promise<void> {
  const handlers = _registry.get(name)
  if (!handlers) return
  for (const handler of handlers) {
    await handler(...(args as unknown[]))
  }
}
