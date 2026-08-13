import { test, expect } from '@playwright/test'
import { uploadTestList } from './helpers/upload'

test.describe('upload flow', () => {
  test('uploads a seniority list end-to-end', async ({ page }) => {
    await uploadTestList(page)

    await expect(page.getByRole('heading', { name: /Dashboard Seniority List · effective/ })).toBeVisible()
    await expect(page.getByText('Lists Uploaded')).toBeVisible()
    await expect(page.getByText('No seniority list yet')).toBeHidden()
  })
})
