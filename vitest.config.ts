import { defineVitestConfig } from '@nuxt/test-utils/config'
import { resolve } from 'node:path'

export default defineVitestConfig({
  resolve: {
    alias: {
      '#server': resolve(__dirname, 'server'),
    },
  },
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
        overrides: {
          experimental: {
            appManifest: false,
          },
        },
      },
    },
    envFile: '.env.test',
    exclude: ['node_modules/**', 'e2e/**', '.worktrees/**', '.claude/**', 'dev/**'],
  },
})
