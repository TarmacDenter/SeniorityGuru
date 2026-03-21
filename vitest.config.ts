import { defineVitestConfig } from '@nuxt/test-utils/config'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'

// node_modules may live in a parent directory when running from a git worktree
function findNodeModules(startDir: string): string {
  let dir = startDir
  for (let i = 0; i < 6; i++) {
    const candidate = resolve(dir, 'node_modules/@nuxtjs/supabase/dist/runtime/server/services/index.js')
    if (existsSync(candidate)) return candidate
    dir = resolve(dir, '..')
  }
  return resolve(startDir, 'node_modules/@nuxtjs/supabase/dist/runtime/server/services/index.js')
}

const supabaseServerPath = findNodeModules(__dirname)

export default defineVitestConfig({
  resolve: {
    alias: {
      '#supabase/server': supabaseServerPath,
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
