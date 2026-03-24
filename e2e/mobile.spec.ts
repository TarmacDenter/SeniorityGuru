import { test, expect } from '@playwright/test'

const MOBILE_VIEWPORT = { width: 375, height: 812 }

test.describe('mobile layout (375×812)', () => {
  test.use({ viewport: MOBILE_VIEWPORT })

  test('dashboard renders tab navigation on mobile', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')

    // Desktop toolbar is hidden on mobile
    const desktopToolbar = page.locator('.hidden.sm\\:flex').first()
    await expect(desktopToolbar).toBeHidden()

    // Mobile tab bar is visible (sm:hidden div containing UTabs)
    const mobileTabBar = page.locator('.sm\\:hidden').first()
    await expect(mobileTabBar).toBeVisible()
  })

  test('dashboard has no horizontal overflow', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')

    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth)
    const bodyClientWidth = await page.evaluate(() => document.body.clientWidth)
    expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1) // 1px tolerance
  })

  test('settings page renders without horizontal overflow', async ({ page }) => {
    await page.goto('http://localhost:3000/settings')

    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth)
    const bodyClientWidth = await page.evaluate(() => document.body.clientWidth)
    expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1)
  })
})
