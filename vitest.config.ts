import { defineVitestConfig } from '@nuxt/test-utils/config'
import { resolve } from 'node:path'

export default defineVitestConfig({
  resolve: {
    alias: {
      '#supabase/server': resolve(__dirname, 'node_modules/@nuxtjs/supabase/dist/runtime/server/services/index.js'),
      '#server': resolve(__dirname, 'server'),
    },
  },
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
      },
    },
    envFile: '.env.test',
    exclude: ['node_modules/**', 'e2e/**', '.worktrees/**'],
  },
})
