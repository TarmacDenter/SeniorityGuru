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
  runtimeConfig: {
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY
  },
  nitro: {
    preset: 'vercel'
  },
  routeRules: {
    // Redirect old /welcome URL to / (landing page)
    '/welcome': { redirect: '/' },
    // Auth callback pages: CSR-only — these depend on URL hash/session state that is
    // unavailable during SSR. Disabling SSR eliminates hydration mismatches entirely.
    '/auth/confirm': { ssr: false },
    '/auth/accept-invite': { ssr: false },
    '/auth/update-password': { ssr: false },
    // Auth-protected dashboard pages: no SSR needed (user-specific, not indexable)
    '/dashboard': { ssr: false },
    '/seniority': { ssr: false },
    '/seniority/**': { ssr: false },
    '/settings': { ssr: false },
    '/admin/**': { ssr: false },
    '/dev/**': { ssr: false },
  }
})
