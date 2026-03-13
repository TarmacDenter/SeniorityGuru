export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: {
    compatibilityVersion: 4
  },
  devtools: { enabled: true },
  ui: {
    theme: {
      colors: ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'past', 'imminent', 'soon']
    }
  },
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxtjs/supabase',
    '@nuxthub/core',
    '@pinia/nuxt'
  ],
  css: ['~/assets/css/main.css'],
  supabase: {
    // Auth redirects are handled manually via the auth middleware
    redirect: false,
    // Types live in shared/ (accessible to both app/ and server/)
    types: '@@/shared/types/database.ts',
  },
  colorMode: {
    preference: 'dark'
  },
  hub: {
    // Compute-only deploy — all data lives in Supabase
    // D1/KV/Blob/Cache all default to false; no CF primitives needed
  },
  runtimeConfig: {
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY
  },
  routeRules: {
    // Auth-protected dashboard pages: no SSR needed (user-specific, not indexable)
    '/': { ssr: false },
    '/seniority': { ssr: false },
    '/seniority/**': { ssr: false },
    '/settings': { ssr: false },
    '/admin/**': { ssr: false },
    '/analytics': { ssr: false },
    '/dev/**': { ssr: false },
  }
})
