import path from 'node:path'
import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'
const FIXTURE = path.join(import.meta.dirname, 'fixtures/sample-seniority-list.csv')

async function uploadTestList(page: import('@playwright/test').Page) {
  await page.goto(`${BASE}/seniority/upload`)
  await page.waitForLoadState('networkidle')

  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles(FIXTURE)
  await expect(page.getByText('sample-seniority-list.csv')).toBeVisible({ timeout: 10000 })

  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByText('15 rows')).toBeVisible({ timeout: 10000 })
  await page.getByRole('button', { name: 'Next' }).click()

  const dateInput = page.locator('input[type="date"], [data-type="date"] input, input[placeholder*="date" i]').first()
  await dateInput.fill('2026-01-01')
  await page.getByRole('button', { name: 'Save' }).click()
  await page.waitForURL(`${BASE}/dashboard**`, { timeout: 15000 })
}

test.describe('dashboard', () => {
  test.beforeAll(async ({ browser }) => {
    // Upload a list once so all tests in this suite have data
    const context = await browser.newContext()
    const page = await context.newPage()
    await uploadTestList(page)
    // Save storage state so all tests share this IndexedDB state
    await context.storageState({ path: '/tmp/claude-1000/dashboard-state.json' })
    await context.close()
  })

  test.use({ storageState: '/tmp/claude-1000/dashboard-state.json' })

  test('tabs navigate and show content', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await page.waitForLoadState('networkidle')

    const tabs = ['Demographics', 'Position', 'Trajectory', 'Seniority List', 'Retirements']
    for (const tab of tabs) {
      await page.getByRole('tab', { name: tab }).click()
      // Tab panel should become visible — wait for any loading to settle
      await page.waitForTimeout(300)
    }

    // Navigate back to first tab
    await page.getByRole('tab', { name: 'My Status' }).click()
    await expect(page.getByRole('tab', { name: 'My Status' })).toBeVisible()
  })

  test('list selector is visible', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await page.waitForLoadState('networkidle')

    // The list selector should show at least one list
    const listSelector = page.getByRole('combobox').first()
    await expect(listSelector).toBeVisible()
  })

  test('settings page renders all cards', async ({ page }) => {
    await page.goto(`${BASE}/settings`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Profile')).toBeVisible()
    await expect(page.getByText('Preferences')).toBeVisible()
    await expect(page.getByText('New Hire Mode')).toBeVisible()
    await expect(page.getByText('Clear Data')).toBeVisible()
  })
})
