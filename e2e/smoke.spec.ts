import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'

test('landing page renders hero heading', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  expect(errors).toHaveLength(0)
})

test('/how-it-works loads', async ({ page }) => {
  await page.goto(`${BASE}/how-it-works`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
})

test('/terms loads', async ({ page }) => {
  await page.goto(`${BASE}/terms`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible()
})

test('/privacy loads', async ({ page }) => {
  await page.goto(`${BASE}/privacy`)
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible()
})

test('/seniority/upload is accessible without auth', async ({ page }) => {
  await page.goto(`${BASE}/seniority/upload`)
  await page.waitForLoadState('networkidle')
  // Should not redirect away — stays on upload or seniority path
  await expect(page).toHaveURL(/seniority/)
})

test('/dashboard is accessible without auth', async ({ page }) => {
  await page.goto(`${BASE}/dashboard`)
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveURL(/dashboard/)
})
