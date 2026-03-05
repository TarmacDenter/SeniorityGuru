import { test, expect } from './fixtures/test'

test('authenticated user can access the dashboard', async ({
  authenticatedPage: page,
}) => {
  // After login, user lands on / (Dashboard)
  await expect(page).toHaveURL('http://localhost:3000/')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})

test('authenticated user can access seniority page (ssr: false)', async ({
  authenticatedPage: page,
}) => {
  // Navigate to /seniority — this is an ssr:false route
  await page.goto('http://localhost:3000/seniority')
  await expect(page).toHaveURL(/\/seniority/)
})

test('unauthenticated user is redirected to login', async ({ page, goto }) => {
  await goto('/', { waitUntil: 'hydration' })

  // Auth middleware should redirect to /auth/login
  await expect(page).toHaveURL(/\/auth\/login/)
})
