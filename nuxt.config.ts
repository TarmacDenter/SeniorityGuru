import { defineNuxtConfig } from 'nuxt/config'

const SITE_TITLE = 'SeniorityGuru — Pilot Seniority Tracker'
const SITE_DESCRIPTION = 'Analyze your company seniority list in your browser: retirements by base, seat and fleet over the time horizon you choose. The file is saved on your device and never sent to a server.'
// Crawlers need an absolute URL.
const SITE_IMAGE = 'https://seniorityguru.com/og-image.png'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: {
    compatibilityVersion: 4
  },
  ssr: false,
  devtools: { enabled: true },
  app: {
    // ssr is off, so this head is the only metadata in the served HTML. Link-preview crawlers
    // (iMessage, Slack, Facebook, forums) do not run JavaScript and never see useSeoMeta.
    head: {
      title: SITE_TITLE,
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icons/icon-192.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/icons/icon-512.png' },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
      ],
      meta: [
        { name: 'theme-color', content: '#0ea5e9' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'description', content: SITE_DESCRIPTION },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'SeniorityGuru' },
        { property: 'og:title', content: SITE_TITLE },
        { property: 'og:description', content: SITE_DESCRIPTION },
        { property: 'og:image', content: SITE_IMAGE },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'SeniorityGuru: know where you stand on the seniority list.' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: SITE_TITLE },
        { name: 'twitter:description', content: SITE_DESCRIPTION },
        { name: 'twitter:image', content: SITE_IMAGE },
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
  components: [
    { path: '~/components/layout', pathPrefix: false },
    { path: '~/components/comparison', pathPrefix: false },
    { path: '~/components/upload', pathPrefix: false },
    { path: '~/components/ui', pathPrefix: false },
    '~/components',
  ],
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
