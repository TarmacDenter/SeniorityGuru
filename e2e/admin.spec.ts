import { test, expect } from './fixtures/test'
import { waitForEmail, extractLink, purgeAllMessages } from './helpers/mailpit'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'http://127.0.0.1:54321'
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? ''

function getServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY)
}

// ---------------------------------------------------------------------------
// Admin access
// ---------------------------------------------------------------------------

test.describe('Admin user management', () => {
  test('admin can access user management page', async ({ adminPage: page }) => {
    await page.goto('http://localhost:3000/admin/users')
    await expect(page).toHaveURL(/\/admin\/users/)
    await expect(page.getByText('User Management')).toBeVisible()
  })

  test('admin sees user list with seeded users', async ({ adminPage: page }) => {
    await page.goto('http://localhost:3000/admin/users')

    // Scope to the table to avoid matching sidebar
    const table = page.getByRole('table')
    await expect(table.getByRole('cell', { name: 'admin@test.local' })).toBeVisible({ timeout: 10000 })
    await expect(table.getByRole('cell', { name: 'test@test.com' })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Invite flow (end-to-end)
// ---------------------------------------------------------------------------

test.describe('Invite flow', () => {
  // Tests share the same email so they must run sequentially
  test.describe.configure({ mode: 'serial' })

  const inviteeEmail = 'e2e-invite@test.local'

  test.beforeEach(async () => {
    await purgeAllMessages()

    // Clean up any leftover user from a previous run
    const client = getServiceClient()
    const { data: { users } } = await client.auth.admin.listUsers()
    const existing = users?.find(u => u.email === inviteeEmail)
    if (existing) {
      // Must delete seniority_lists first (FK on uploaded_by without CASCADE)
      await client.from('seniority_lists').delete().eq('uploaded_by', existing.id)
      // Must delete profile explicitly if CASCADE isn't working
      await client.from('profiles').delete().eq('id', existing.id)
      await client.auth.admin.deleteUser(existing.id)
    }
  })

  test('admin invites user → user sets password → setup profile', async ({ adminPage: page }) => {
    // Step 1: Admin opens invite modal and sends invite
    await page.goto('http://localhost:3000/admin/users')
    await page.getByRole('button', { name: 'Invite User' }).click()
    await page.getByPlaceholder('pilot@example.com').fill(inviteeEmail)
    await page.getByRole('button', { name: 'Send Invite' }).click()

    // Should show success toast (target the toast title specifically)
    await expect(page.locator('[data-slot="title"]').filter({ hasText: 'Invite sent' })).toBeVisible({ timeout: 5000 })

    // Step 2: Read invite email from Mailpit
    const email = await waitForEmail(inviteeEmail, { subject: 'invited' })
    expect(email.Subject).toContain('invited')
    const link = extractLink(email.HTML)
    expect(link).toBeTruthy()

    // Step 3: Open link in a fresh context (simulating the invited user's browser)
    const browser = page.context().browser()!
    const userContext = await browser.newContext()
    const userPage = await userContext.newPage()

    await userPage.goto(link)

    // Should land on update-password page after Supabase processes the invite token
    await expect(userPage).toHaveURL(/\/auth\/update-password/, { timeout: 15000 })

    // Step 4: Set password
    await userPage.getByLabel('New password').fill('newuser1234')
    await userPage.getByLabel('Confirm password').fill('newuser1234')
    await userPage.getByRole('button', { name: /update password/i }).click()

    // Step 5: Should redirect to / → middleware sees no airline → setup-profile
    await expect(userPage).toHaveURL(/\/auth\/setup-profile/, { timeout: 15000 })

    // Step 6: Select an airline and complete setup
    // USelectMenu renders a trigger element with placeholder text
    await userPage.getByText('Search airlines...').click()
    // Type in the search input inside the popover
    await userPage.getByPlaceholder('Search by name...').fill('Delta')
    await userPage.getByRole('option').first().click()
    await userPage.getByRole('button', { name: /continue/i }).click()

    // Step 7: Should land on the dashboard
    await expect(userPage).toHaveURL('http://localhost:3000/', { timeout: 10000 })

    await userContext.close()
  })

  test('admin can re-invite a user who never signed in', async ({ adminPage: page }) => {
    // First invite
    await page.goto('http://localhost:3000/admin/users')
    await page.getByRole('button', { name: 'Invite User' }).click()
    await page.getByPlaceholder('pilot@example.com').fill(inviteeEmail)
    await page.getByRole('button', { name: 'Send Invite' }).click()
    await expect(page.locator('[data-slot="title"]').filter({ hasText: 'Invite sent' })).toBeVisible({ timeout: 5000 })

    // Close modal and wait for first toast to auto-dismiss
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-slot="title"]').filter({ hasText: 'Invite sent' })).not.toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: 'Invite User' }).click()
    await page.getByPlaceholder('pilot@example.com').fill(inviteeEmail)
    await page.getByRole('button', { name: 'Send Invite' }).click()

    // Should succeed (seamless re-invite)
    await expect(page.locator('[data-slot="title"]').filter({ hasText: 'Invite sent' })).toBeVisible({ timeout: 5000 })
  })
})

// ---------------------------------------------------------------------------
// Delete user
// ---------------------------------------------------------------------------

test.describe('Delete user', () => {
  const deleteEmail = 'e2e-delete@test.local'

  test.beforeEach(async () => {
    const client = getServiceClient()

    // Clean up from previous runs
    const { data: { users } } = await client.auth.admin.listUsers()
    const existing = users?.find(u => u.email === deleteEmail)
    if (existing) {
      await client.auth.admin.deleteUser(existing.id)
    }

    // Create fresh user
    await client.auth.admin.createUser({
      email: deleteEmail,
      password: 'password',
      email_confirm: true,
      user_metadata: { email_verified: true },
    })
  })

  test('admin can delete a user with confirmation', async ({ adminPage: page }) => {
    await page.goto('http://localhost:3000/admin/users')

    // Wait for the table to show the delete target
    const table = page.getByRole('table')
    await expect(table.getByRole('cell', { name: deleteEmail })).toBeVisible({ timeout: 10000 })

    // Click the trash icon button in the target row
    const row = table.getByRole('row').filter({ hasText: deleteEmail })
    await row.locator('button').last().click()

    // Confirmation modal should appear
    await expect(page.getByRole('heading', { name: 'Delete User' })).toBeVisible()

    // Confirm deletion
    await page.getByRole('button', { name: 'Delete User' }).click()

    // Success toast
    await expect(page.locator('[data-slot="title"]').filter({ hasText: 'User deleted' })).toBeVisible({ timeout: 5000 })

    // User disappears from table
    await expect(table.getByRole('cell', { name: deleteEmail })).not.toBeVisible({ timeout: 5000 })
  })
})

// ---------------------------------------------------------------------------
// Change role
// ---------------------------------------------------------------------------

test.describe('Change user role', () => {
  test('admin can change a user role', async ({ adminPage: page }) => {
    await page.goto('http://localhost:3000/admin/users')

    // Wait for table to load
    const table = page.getByRole('table')
    await expect(table.getByRole('cell', { name: 'test@test.com' })).toBeVisible({ timeout: 10000 })

    // Find the target row and click its role select button
    const row = table.getByRole('row').filter({ hasText: 'test@test.com' })
    await row.locator('button').filter({ hasText: 'user' }).click()

    // Select "moderator" from dropdown
    await page.getByRole('option', { name: 'moderator' }).click()

    // Should show success toast
    await expect(page.locator('[data-slot="title"]').filter({ hasText: 'Role updated' })).toBeVisible({ timeout: 5000 })

    // Revert to "user" (cleanup)
    await row.locator('button').filter({ hasText: 'moderator' }).click()
    await page.getByRole('option', { name: 'user' }).click()
    await expect(page.locator('[data-slot="title"]').filter({ hasText: 'Role updated' }).last()).toBeVisible({ timeout: 5000 })
  })
})
