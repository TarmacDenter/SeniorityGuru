import path from 'node:path'
import { test, expect } from '@playwright/test'
import { uploadTestList } from './helpers/upload'

const FIXTURE = path.join(import.meta.dirname, 'fixtures/sample-seniority-list.csv')

test.describe('upload flow', () => {
  test('uploads a seniority list end-to-end', async ({ page }) => {
    await uploadTestList(page)

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/List/)
    await expect(page.getByText(/Seniority List · effective/).first()).toBeVisible()
    await expect(page.getByText('No seniority list yet')).toBeHidden()
  })
})

test.describe('upload flow on a phone (500px)', () => {
  test.use({ viewport: { width: 500, height: 800 }, hasTouch: true })

  test('uploads a seniority list end-to-end', async ({ page }) => {
    await uploadTestList(page)
    await expect(page).toHaveURL(/\/dashboard\/list\/full/)
  })

  test('Next stays tappable above the bottom bar on every step', async ({ page }) => {
    await page.goto('/seniority/upload')
    await page.getByText('Generic spreadsheet', { exact: true }).click()
    await page.locator('input[type="file"]').setInputFiles(FIXTURE)
    await expect(page.getByText('Loaded: sample-seniority-list.csv')).toBeVisible()

    // Scroll only the content to its end, as a pilot's swipe does, then ask
    // what a tap on Next's centre would hit. Playwright's own click scrolls
    // the outer page too, which would hide the overlap.
    const nextIsTappable = () => page.getByRole('button', { name: 'Next', exact: true }).evaluate((next) => {
      const scrollers: Element[] = []
      for (let el = next.parentElement; el; el = el.parentElement) {
        if (/(auto|scroll)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight) scrollers.push(el)
      }
      scrollers.forEach((el) => { el.scrollTop = 0 })
      if (scrollers[0]) scrollers[0].scrollTop = scrollers[0].scrollHeight
      const box = next.getBoundingClientRect()
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)
      return hit === next || next.contains(hit)
    })

    await expect.poll(nextIsTappable).toBe(true)
    await page.getByRole('button', { name: 'Next', exact: true }).click()
    await expect(page.getByText('Step 2 of 4')).toBeVisible()
    await expect.poll(nextIsTappable).toBe(true)
  })
})
