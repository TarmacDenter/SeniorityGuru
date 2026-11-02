import { test, expect } from '@playwright/test'
import { uploadTestList } from './helpers/upload'

test.describe('dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Keep tests independent while giving every dashboard scenario real Dexie data.
    await uploadTestList(page)
  })

  test('sections navigate and show their small views', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Current/)

    for (const [section, path] of [['Demographics', '/dashboard/demographics'], ['Trajectory', '/dashboard/trajectory/projection'], ['List', '/dashboard/list/full'], ['Current', '/dashboard/current/status']] as const) {
      await page.getByRole('link', { name: section, exact: true }).first().click()
      await expect(page).toHaveURL(new RegExp(path))
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(new RegExp(section))
    }
  })

  test('List small views are a tab row', async ({ page }) => {
    await page.goto('/dashboard/list/full')
    const views = page.getByRole('navigation', { name: 'Section views' })
    for (const view of ['Full list', 'Upcoming retirements', 'Compare', 'Uploads']) {
      await expect(views.getByRole('link', { name: view })).toBeVisible()
    }
    await views.getByRole('link', { name: 'Upcoming retirements' }).click()
    await expect(page).toHaveURL(/\/dashboard\/list\/retirements/)
    await expect(views.getByRole('link', { name: 'Upcoming retirements' })).toHaveAttribute('aria-current', 'page')
  })

  test('Current asks for an employee number and shows no scenario toolbar', async ({ page }) => {
    await page.goto('/dashboard/current/status')
    await expect(page.getByText('Enter your employee number', { exact: false }).first()).toBeVisible()
    await expect(page.getByText('Qualification Scope')).toBeHidden()
  })

  test('list selector is visible on List', async ({ page }) => {
    await page.goto('/dashboard/list/full')
    await expect(page.getByLabel('Seniority List')).toBeVisible()
  })

  test('View Demo selects the current demo list even when a newer list exists', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'View Demo' }).click()
    await page.waitForURL(/\/dashboard/)

    await expect(page.getByRole('heading', { level: 1, name: /Current/ })).toBeVisible()
    await expect(page.getByText(/Demo — Current List · effective/).first()).toBeVisible()
    await expect(page.getByText('Seniority Number', { exact: true }).first()).toBeVisible()
  })

  test('settings page renders all cards', async ({ page }) => {
    await page.goto('/settings')

    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Preferences' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'New Hire Mode' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Clear All Data' })).toBeVisible()
  })
})
