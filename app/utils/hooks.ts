import type { HookResult } from '@nuxt/schema'
import { useNuxtApp } from '#app'
import type { NuxtApp } from '#app'

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

declare module '#app' {
  interface RuntimeNuxtHooks {
    'app:demo:enter': () => HookResult
    'app:demo:exit': () => HookResult
    'list:added': (listId: number) => HookResult
    'list:deleted': (listId: number) => HookResult
    'list:changed': () => HookResult
    'user:preference:changed': (key: string) => HookResult
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
  await useNuxtApp().callHook(name, ...(args as []))
}
