import path from 'node:path'
import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'
const FIXTURE = path.join(import.meta.dirname, 'fixtures/sample-seniority-list.csv')

test.describe('upload flow', () => {
  test('uploads a seniority list end-to-end', async ({ page }) => {
    await page.goto(`${BASE}/seniority/upload`)
    await page.waitForLoadState('networkidle')

    // Step 1: Upload file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(FIXTURE)

    // Wait for file to be parsed (success alert shows file name)
    await expect(page.getByText('sample-seniority-list.csv')).toBeVisible({ timeout: 10000 })

    // Advance to column mapping step
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 2: Column mapper renders with expected fields
    await expect(page.getByText('Seniority #')).toBeVisible()
    await expect(page.getByText('Employee #')).toBeVisible()

    // All required columns should auto-map (CSV headers match schema names exactly)
    // Advance to review step
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 3: Review — 15 rows, no errors
    await expect(page.getByText('15 rows')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled()

    // Advance to confirm step
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 4: Confirm — fill effective date
    const dateInput = page.locator('input[type="date"], [data-type="date"] input, input[placeholder*="date" i]').first()
    await dateInput.fill('2026-01-01')

    // Save
    await page.getByRole('button', { name: 'Save' }).click()

    // Should redirect to dashboard
    await page.waitForURL(`${BASE}/dashboard**`, { timeout: 15000 })
    expect(page.url()).toContain('/dashboard')
  })
})
