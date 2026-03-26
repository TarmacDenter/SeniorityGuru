export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: {
    compatibilityVersion: 4
  },
  ssr: false,
  devtools: { enabled: true },
  app: {
    head: {
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icons/icon-192.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/icons/icon-512.png' },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
      ],
      meta: [
        { name: 'theme-color', content: '#0ea5e9' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
    },
  },
  ui: {
    theme: {
      colors: ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'past', 'imminent', 'soon']
    }
  },
  runtimeConfig: {
    public: {
      bmcUrl: '',
      feedbackEmail: '',
    },
  },
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vercel/analytics',
    '@vite-pwa/nuxt',
    '@nuxt/content',
  ],
  pwa: {
    registerType: 'autoUpdate',
    workbox: {
      navigateFallback: '/',
    },
  },
  imports: {
    dirs: ['composables/seniority'],
  },
  css: ['~/assets/css/main.css'],
  colorMode: {
    preference: 'dark'
  },
  nitro: {
    preset: 'vercel'
  },
  routeRules: {
    '/welcome': { redirect: '/' },
  },
});
