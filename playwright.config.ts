import { defineConfig, devices } from '@playwright/test'

// Local E2E tests use the app's runtime defaults. Load developer overrides when
// available, without making an untracked `.env` file a test prerequisite.
try {
  process.loadEnvFile()
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  expect: { timeout: 15_000 },

  webServer: {
    command: 'pnpm exec nuxt dev --port 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
  },

  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
