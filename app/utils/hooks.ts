import { useNuxtApp } from '#app'
import type { NuxtApp } from '#app'

/** All application hook events with their typed callback signatures. */
export interface AppHooks {
  // Demo lifecycle
  'app:demo:enter': () => Promise<void> | void
  'app:demo:exit': () => Promise<void> | void
  // Data lifecycle (emitted by stores; no listeners required)
  'list:added': (listId: number) => void
  'list:deleted': (listId: number) => void
  // User lifecycle (emitted by stores; no listeners required)
  'user:preference:changed': (key: string) => void
}

type HookHandler<K extends keyof AppHooks> = AppHooks[K]

declare module '#app' {
  interface RuntimeNuxtHooks {
    'app:demo:enter': () => void
    'app:demo:exit': () => void
    'list:added': (listId: number) => void
    'list:deleted': (listId: number) => void
    'user:preference:changed': (key: string) => void
  }
}

/** Register a handler for a named hook event. */
export function defineHook<K extends keyof AppHooks>(
  name: K,
  handler: HookHandler<K>,
  nuxtApp: NuxtApp = useNuxtApp(),
): void {
  nuxtApp.hook(name, handler as never)
}

/** Emit a named hook event, awaiting all async handlers in registration order. */
export async function emitHook<K extends keyof AppHooks>(
  name: K,
  ...args: Parameters<HookHandler<K>>
): Promise<void> {
  type AnyCallHook = (name: string, ...args: unknown[]) => Promise<void>
  await (useNuxtApp().callHook as AnyCallHook)(name, ...args)
}
