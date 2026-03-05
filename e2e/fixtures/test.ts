import { test as nuxtTest, expect } from '@nuxt/test-utils/playwright'
import { TEST_USERS } from '../helpers/auth'
import type { Page } from '@playwright/test'

type Fixtures = {
  authenticatedPage: Page
}

export const test = nuxtTest.extend<Fixtures>({
  authenticatedPage: async ({ page, goto }, use) => {
    const creds = TEST_USERS.dalUser

    await goto('/auth/login', { waitUntil: 'hydration' })
    await page.getByLabel('Email').fill(creds.email)
    await page.getByLabel('Password').fill(creds.password)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/'))

    await use(page)
  },
})

export { expect }
