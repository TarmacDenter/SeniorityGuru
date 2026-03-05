export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: {
    compatibilityVersion: 4
  },
  devtools: { enabled: true },
  modules: [
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
    // NuxtHub / Cloudflare Workers config
  },
  runtimeConfig: {
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY
  },
  routeRules: {
    // Auth-protected dashboard pages: no SSR needed (user-specific, not indexable)
    '/': { ssr: false },
    '/seniority': { ssr: false },
    '/seniority/**': { ssr: false },
  }
})
