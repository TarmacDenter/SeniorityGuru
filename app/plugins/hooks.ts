/**
 * Auto-registers all hook listener files in app/hooks/.
 * Each file exports a registration function that receives nuxtApp.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const modules = import.meta.glob(['~/hooks/*.ts', '!~/hooks/*.test.ts', '!~/hooks/*.spec.ts'], { eager: true })

  for (const mod of Object.values(modules)) {
    const register = (mod as { default?: (nuxtApp: typeof nuxtApp) => void }).default
    if (typeof register === 'function') register(nuxtApp)
  }
})
