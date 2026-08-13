import path from 'node:path'
import { expect, type Page } from '@playwright/test'

const FIXTURE = path.join(import.meta.dirname, '../fixtures/sample-seniority-list.csv')

/** Uploads the generic CSV fixture through the same flow a user sees. */
export async function uploadTestList(page: Page) {
  await page.goto('/seniority/upload')

  await page.getByText('Generic / Other Airline', { exact: true }).click()
  await page.locator('input[type="file"]').setInputFiles(FIXTURE)
  await expect(page.getByText('Loaded: sample-seniority-list.csv')).toBeVisible()

  // The fixture headers auto-map, so the wizard proceeds directly to review.
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByText('15 rows', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Continue to Save' }).click()

  await expect(page.getByText('Effective Date', { exact: true })).toBeVisible()
  await page.locator('[data-segment="month"]').fill('01')
  await page.locator('[data-segment="day"]').fill('01')
  await page.locator('[data-segment="year"]').fill('2026')
  await page.getByRole('button', { name: 'Looks Good' }).click()
  await page.waitForURL(/\/dashboard\?tab=seniority/)
}
