/**
 * Auto-registers all hook listener files in app/hooks/.
 * Files call defineHook() at module-level, so importing them is enough.
 */
export default defineNuxtPlugin(() => {
  const modules = import.meta.glob(['~/hooks/*.ts', '!~/hooks/*.test.ts', '!~/hooks/*.spec.ts'], { eager: true })
  // Modules are imported eagerly above — their top-level defineHook() calls
  // have already executed as a side effect of the import.
  void Object.keys(modules).length // suppress unused-variable warning
})
