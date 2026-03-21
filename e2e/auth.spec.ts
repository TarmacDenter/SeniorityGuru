import { test, expect } from './fixtures/test'
import { TEST_USERS } from './helpers/auth'
import { waitForEmail, extractLink, purgeAllMessages } from './helpers/mailpit'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'http://127.0.0.1:54321'
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? ''

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

test.describe('Login', () => {
  test('valid credentials → dashboard', async ({ authenticatedPage: page }) => {
    await expect(page).toHaveURL('http://localhost:3000/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('invalid credentials → error toast', async ({ page, goto }) => {
    await goto('/auth/login', { waitUntil: 'hydration' })
    await page.getByLabel('Email').fill('nobody@test.local')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Should stay on login page and show error toast
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.locator('[data-slot="title"]').filter({ hasText: 'Invalid login credentials' })).toBeVisible({ timeout: 5000 })
  })
})

// ---------------------------------------------------------------------------
// Auth gates
// ---------------------------------------------------------------------------

test.describe('Auth gates', () => {
  test('unauthenticated → /dashboard redirects to /', async ({ page, goto }) => {
    await goto('/dashboard', { waitUntil: 'hydration' })
    await expect(page).toHaveURL(/^\/$|http:\/\/localhost:3000\/$/)
  })

  test('unauthenticated → /seniority redirects to /', async ({ page, goto }) => {
    await goto('/seniority', { waitUntil: 'hydration' })
    await expect(page).toHaveURL(/^\/$|http:\/\/localhost:3000\/$/)
  })

  test('unauthenticated → /admin redirects to /', async ({ page, goto }) => {
    await goto('/admin/users', { waitUntil: 'hydration' })
    await expect(page).toHaveURL(/^\/$|http:\/\/localhost:3000\/$/)
  })

  test('non-admin → /admin redirects to /dashboard', async ({ authenticatedPage: page }) => {
    await page.goto('http://localhost:3000/admin/users')
    await expect(page).toHaveURL('http://localhost:3000/dashboard')
  })
})

// ---------------------------------------------------------------------------
// Signup page
// ---------------------------------------------------------------------------

test.describe('Signup', () => {
  test('shows the create account form', async ({ page, goto }) => {
    await goto('/auth/signup', { waitUntil: 'hydration' })
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

test.describe('Logout', () => {
  test('signing out redirects away from dashboard', async ({ authenticatedPage: page }) => {
    // Use first visible "Sign out" button (may exist in sidebar and navbar)
    await page.getByRole('button', { name: 'Sign out' }).first().click()

    // Should redirect to login or landing page
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 })
  })
})

// ---------------------------------------------------------------------------
// Password recovery flow
// ---------------------------------------------------------------------------

test.describe('Password recovery', () => {
  // Use ualUser to avoid interfering with dalUser (used by authenticatedPage fixture)
  const testEmail = TEST_USERS.ualUser.email

  test('request → email → set new password → dashboard', async ({ page, goto }) => {
    await purgeAllMessages()

    // Step 1: Request password reset
    await goto('/auth/reset-password', { waitUntil: 'hydration' })
    await page.getByLabel('Email').fill(testEmail)
    await page.getByRole('button', { name: /reset|send/i }).click()

    // Should show success alert (UAlert renders title in [data-slot="title"])
    await expect(page.locator('[data-slot="title"]').filter({ hasText: 'Check your email' })).toBeVisible({ timeout: 5000 })

    // Step 2: Get the recovery email from Mailpit
    const email = await waitForEmail(testEmail, { subject: 'Reset' })
    const link = extractLink(email.HTML)
    expect(link).toBeTruthy()

    // Step 3: Click the recovery link → Supabase verify → /auth/confirm → /auth/update-password
    await page.goto(link)
    await expect(page).toHaveURL(/\/auth\/update-password/, { timeout: 10000 })

    // Wait for the page to be fully rendered before interacting
    await expect(page.getByRole('heading', { name: 'Set new password' })).toBeVisible()

    // Step 4: Set a new password (must differ from old — Supabase rejects same-password updates)
    const tempPassword = 'TempNewPass1234!'
    await page.getByLabel('New password').fill(tempPassword)
    await page.getByLabel('Confirm password').fill(tempPassword)
    await page.getByRole('button', { name: /update password/i }).click()

    // Step 5: Should redirect to dashboard
    await expect(page).toHaveURL('http://localhost:3000/dashboard', { timeout: 15000 })

    // Restore original password so future test runs work
    const client = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY)
    const { data: { users } } = await client.auth.admin.listUsers()
    const user = users?.find(u => u.email === testEmail)
    if (user) {
      await client.auth.admin.updateUserById(user.id, { password: TEST_USERS.ualUser.password })
    }
  })
})

// ---------------------------------------------------------------------------
// Reset password page
// ---------------------------------------------------------------------------

test.describe('Reset password page', () => {
  test('shows form with email input', async ({ page, goto }) => {
    await goto('/auth/reset-password', { waitUntil: 'hydration' })
    await expect(page.getByLabel('Email')).toBeVisible()
  })

  test('has link back to login', async ({ page, goto }) => {
    await goto('/auth/reset-password', { waitUntil: 'hydration' })
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Accept invite page (OTP entry)
// ---------------------------------------------------------------------------

test.describe('Accept invite page', () => {
  test('renders email and invitation code form', async ({ page, goto }) => {
    await goto('/auth/accept-invite', { waitUntil: 'hydration' })
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Invitation code')).toBeVisible()
    await expect(page.getByRole('button', { name: /verify/i })).toBeVisible()
  })

  test('shows error for invalid OTP code', async ({ page, goto }) => {
    await goto('/auth/accept-invite', { waitUntil: 'hydration' })
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Invitation code').fill('000000')
    await page.getByRole('button', { name: /verify/i }).click()

    // Should stay on accept-invite and show an error (invalid/expired OTP)
    await expect(page).toHaveURL(/\/auth\/accept-invite/, { timeout: 10000 })
    await expect(page.locator('[data-slot="title"]')).toBeVisible({ timeout: 5000 })
  })
})
