import { test, expect } from '@playwright/test'

test('landing page renders hero heading', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  expect(errors).toHaveLength(0)
})

test('/how-it-works loads', async ({ page }) => {
  await page.goto('/how-it-works')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
})

test('/terms loads', async ({ page }) => {
  await page.goto('/terms')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible()
})

test('/privacy loads', async ({ page }) => {
  await page.goto('/privacy')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible()
})

test('/seniority/upload is accessible without auth', async ({ page }) => {
  await page.goto('/seniority/upload')
  await page.waitForLoadState('networkidle')
  // Should not redirect away — stays on upload or seniority path
  await expect(page).toHaveURL(/seniority/)
})

test('/dashboard is accessible without auth', async ({ page }) => {
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveURL(/dashboard/)
})
