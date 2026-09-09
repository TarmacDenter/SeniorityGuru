import { test, expect } from '@playwright/test'
import { uploadTestList } from './helpers/upload'

const MOBILE_VIEWPORT = { width: 375, height: 812 }

test.describe('mobile layout (375×812)', () => {
  test.use({ viewport: MOBILE_VIEWPORT })

  test('dashboard renders tab navigation on mobile', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    // Desktop toolbar is hidden on mobile
    const desktopToolbar = page.getByRole('tablist')
    await expect(desktopToolbar).toBeHidden()

    // The mobile tab chips render as buttons rather than desktop tabs.
    const mobileTabBar = page.getByRole('button', { name: 'My Status' })
    await expect(mobileTabBar).toBeVisible()
  })

  test('dashboard has no horizontal overflow', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth)
    const bodyClientWidth = await page.evaluate(() => document.body.clientWidth)
    expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1) // 1px tolerance
  })

  test('settings page renders without horizontal overflow', async ({ page }) => {
    await page.goto('/settings')
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth)
    const bodyClientWidth = await page.evaluate(() => document.body.clientWidth)
    expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1)
  })
})

test.describe('compact Seniority List layout', () => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    test(`shows eligible notices one at a time at ${viewport.width}×${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('/')
      await page.getByRole('button', { name: 'View Demo' }).click()
      await page.waitForURL(/\/dashboard/)
      await expect(page.getByText('Install Seniority Guru', { exact: true })).toBeVisible()
      await expect(page.getByText("You're in demo mode", { exact: true })).toBeHidden()
      await expect(page.getByRole('button', { name: 'Install' })).toBeVisible()
      await expect(page.getByRole('button', { name: "Don't ask again" })).toBeVisible()
      await page.getByRole('button', { name: 'Not now' }).click()
      await expect(page.getByText("You're in demo mode", { exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Upload my list' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Dismiss' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Exit Demo' })).toBeVisible()
      await expect(page.locator('table tbody tr').first()).toBeVisible()
    })
  }

  test('keeps the populated viewer usable in portrait', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await uploadTestList(page)
    await page.goto('/dashboard?tab=seniority')
    await expect(page.locator('table')).toBeVisible()
    const installDismissal = page.getByRole('button', { name: 'Not now' })
    if (await installDismissal.isVisible()) await installDismissal.click()

    const tableViewport = page.locator('table').locator('xpath=ancestor::div[contains(@class, "overscroll-contain")]')
    expect((await tableViewport.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(160)
    await expect(page.locator('table tbody tr').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /^Controls/ })).toBeVisible()
    await page.getByRole('button', { name: /^Controls/ }).click()
    await expect(page.getByPlaceholder('Search by name or employee number...')).toBeVisible()
    expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => document.body.clientWidth) + 1)
  })

  test('keeps the populated viewer usable in short landscape', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 })
    await uploadTestList(page)
    await page.goto('/dashboard?tab=seniority')
    await expect(page.locator('table')).toBeVisible()
    const installDismissal = page.getByRole('button', { name: 'Not now' })
    if (await installDismissal.isVisible()) await installDismissal.click()

    const tableViewport = page.locator('table').locator('xpath=ancestor::div[contains(@class, "overscroll-contain")]')
    expect((await tableViewport.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(160)
    await expect(page.locator('table tbody tr').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /^Controls/ })).toBeVisible()
    await page.getByRole('button', { name: /^Controls/ }).click()
    await expect(page.getByPlaceholder('Search by name or employee number...')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Employee number' })).toBeHidden()
    expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => document.body.clientWidth) + 1)
  })
})
