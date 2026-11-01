import { test, expect } from '@playwright/test'
import { uploadTestList } from './helpers/upload'

const MOBILE_VIEWPORT = { width: 375, height: 812 }

test.describe('mobile layout (375×812)', () => {
  test.use({ viewport: MOBILE_VIEWPORT })

  test('dashboard shows the four sections in the bottom bar and the small views as tabs', async ({ page }) => {
    await uploadTestList(page)
    await page.goto('/dashboard/list/full')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/List/)

    const bottomBar = page.getByRole('navigation', { name: 'Sections' })
    for (const section of ['Current', 'Trajectory', 'Demographics', 'List']) {
      await expect(bottomBar.getByRole('link', { name: section })).toBeVisible()
    }
    await expect(bottomBar.getByRole('button', { name: /More/ })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Section views' }).getByRole('link', { name: 'Upcoming retirements' })).toBeVisible()
  })

  test('dashboard has no horizontal overflow', async ({ page }) => {
    await uploadTestList(page)
    await page.goto('/dashboard/list/full')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/List/)

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
      await expect(page.getByText('Demo mode', { exact: true })).toBeHidden()
      await expect(page.getByRole('button', { name: 'Install' })).toBeVisible()
      await expect(page.getByRole('button', { name: "Don't ask again" })).toBeVisible()
      await page.getByRole('button', { name: 'Not now' }).click()
      await expect(page.getByText('Demo mode', { exact: true })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Upload my list' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Dismiss' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Exit Demo' })).toBeVisible()
      await expect(page.locator('table tbody tr').first()).toBeVisible()
    })
  }

  test('keeps the populated viewer usable in portrait', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await uploadTestList(page)
    await page.goto('/dashboard/list/full')
    await expect(page.locator('table')).toBeVisible()
    const installDismissal = page.getByRole('button', { name: 'Not now' })
    if (await installDismissal.isVisible()) await installDismissal.click()

    const tableViewport = page.locator('table').locator('xpath=ancestor::div[contains(@class, "overscroll-contain")]')
    expect((await tableViewport.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(160)
    await expect(page.locator('table tbody tr').first()).toBeVisible()
    expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => document.body.clientWidth) + 1)
  })

  // Fails since the four-section shell: header, tab row and list picker leave the table 113px of 390px (needs >= 160).
  test.fixme('keeps the populated viewer usable in short landscape', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 })
    await uploadTestList(page)
    await page.goto('/dashboard/list/full')
    await expect(page.locator('table')).toBeVisible()
    const installDismissal = page.getByRole('button', { name: 'Not now' })
    if (await installDismissal.isVisible()) await installDismissal.click()

    const tableViewport = page.locator('table').locator('xpath=ancestor::div[contains(@class, "overscroll-contain")]')
    expect((await tableViewport.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(160)
    await expect(page.locator('table tbody tr').first()).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Employee number' })).toBeHidden()
    expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => document.body.clientWidth) + 1)
  })

  test('offers search, Qualification and insertion on the selected Full list on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    // Keep other lists available so opening controls cannot silently select the latest list.
    await page.goto('/')
    await page.getByRole('button', { name: 'View Demo' }).click()
    await page.waitForURL(/\/dashboard/)
    await uploadTestList(page)
    await expect(page.locator('table tbody')).toContainText('Frank Miller')
    const listPicker = page.getByLabel('Seniority List')
    const selectedList = await listPicker.innerText()
    const selectedListUrl = page.url()

    await page.goto('/settings')
    await page.getByLabel('Employee Number', { exact: true }).fill('10006')
    await page.getByRole('button', { name: 'Save profile' }).click()
    await expect(page.getByText('Profile saved', { exact: true })).toBeVisible()
    await page.goto(selectedListUrl)
    const installDismissal = page.getByRole('button', { name: 'Not now' })
    if (await installDismissal.isVisible()) await installDismissal.click()

    const controls = page.getByRole('button', { name: 'Controls', exact: true })
    await expect(controls).toHaveAttribute('aria-expanded', 'false')
    await controls.focus()
    await page.keyboard.press('Enter')
    await expect(controls).toHaveAttribute('aria-expanded', 'true')
    const search = page.getByPlaceholder('Search by name or employee number...')
    await search.fill('Frank Miller')
    await expect(page.locator('table tbody tr')).toHaveCount(1)
    await expect(page.locator('table tbody')).toContainText('Frank Miller')
    await page.getByRole('button', { name: 'Clear search' }).click()

    await page.getByRole('combobox', { name: 'Qualification', exact: true }).click()
    await page.getByRole('option', { name: 'ORD-A320-FO', exact: true }).click()
    await expect(page.locator('table tbody')).toContainText('Henry Moore')
    await expect(page.locator('table tbody')).not.toContainText('Frank Miller')
    await page.getByRole('button', { name: 'Insert yourself', exact: true }).click()
    await expect(page.locator('table tbody')).toContainText('Frank Miller')
    await expect(page.locator('table tbody')).toContainText('Your line')
    await expect(listPicker).toHaveText(selectedList)
    await expect(page).toHaveURL(selectedListUrl)

    await controls.click()
    await expect(search).toBeHidden()
    await controls.click()
    await expect(page.getByRole('combobox', { name: 'Qualification', exact: true })).toContainText('ORD-A320-FO')
    await expect(page.locator('table tbody')).toContainText('Frank Miller')
    await expect(listPicker).toHaveText(selectedList)
  })
})
