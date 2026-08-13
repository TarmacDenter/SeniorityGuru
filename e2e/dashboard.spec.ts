import { test, expect } from '@playwright/test'
import { uploadTestList } from './helpers/upload'

test.describe('dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Keep tests independent while giving every dashboard scenario real Dexie data.
    await uploadTestList(page)
  })

  test('tabs navigate and show content', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /Dashboard Seniority List · effective/ })).toBeVisible()

    const tabs = ['Demographics', 'Position', 'Trajectory', 'Seniority List', 'Retirements']
    for (const tab of tabs) {
      await page.getByRole('tab', { name: tab }).click()
      await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('data-state', 'active')
    }

    // Navigate back to first tab
    await page.getByRole('tab', { name: 'My Status' }).click()
    await expect(page.getByRole('tab', { name: 'My Status' })).toBeVisible()
  })

  test('list selector is visible', async ({ page }) => {
    await page.goto('/dashboard')

    // The list selector should show at least one list
    const listSelector = page.getByRole('button', { name: 'Show popup' })
    await expect(listSelector).toBeVisible()
  })

  test('settings page renders all cards', async ({ page }) => {
    await page.goto('/settings')

    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Preferences' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'New Hire Mode' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Clear All Data' })).toBeVisible()
  })
})
