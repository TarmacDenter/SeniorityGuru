import { test as nuxtTest, expect } from '@nuxt/test-utils/playwright'
import { TEST_USERS } from '../helpers/auth'
import type { Page } from '@playwright/test'

type Fixtures = {
  authenticatedPage: Page
  adminPage: Page
}

async function loginAs(page: Page, goto: (url: string, options?: Record<string, unknown>) => Promise<void>, user: keyof typeof TEST_USERS) {
  const creds = TEST_USERS[user]
  await goto('/auth/login', { waitUntil: 'hydration' })
  await page.getByLabel('Email').fill(creds.email)
  await page.getByLabel('Password').fill(creds.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/'))
}

export const test = nuxtTest.extend<Fixtures>({
  authenticatedPage: async ({ page, goto }, use) => {
    await loginAs(page, goto, 'dalUser')
    await use(page)
  },
  adminPage: async ({ page, goto }, use) => {
    await loginAs(page, goto, 'admin')
    await use(page)
  },
})

export { expect }
