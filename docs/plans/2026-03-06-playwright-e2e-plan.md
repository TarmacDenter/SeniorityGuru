# Playwright E2E Infrastructure — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up Playwright E2E testing infrastructure using `@nuxt/test-utils/playwright`, with auth helpers and a smoke test.

**Architecture:** Uses `@nuxt/test-utils/playwright` which wraps Playwright with Nuxt-aware fixtures (`goto` with hydration support, `ConfigOptions` typed config). Tests point at the running local dev server via the `host` option. A custom fixture extends the Nuxt test utils `test` to add `authenticatedPage` with Supabase cookie injection.

**Tech Stack:** `@playwright/test`, `@nuxt/test-utils/playwright`, `@supabase/supabase-js` (for auth helper), Chromium

---

### Task 1: Install Playwright

**Files:**
- Modify: `package.json`

**Step 1: Install Playwright as a dev dependency**

`@nuxt/test-utils` is already installed. We just need `@playwright/test`.

```bash
npm install -D @playwright/test
```

**Step 2: Install Chromium browser binary**

```bash
npx playwright install chromium
```

**Step 3: Add scripts to package.json**

Add to `"scripts"`:

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install Playwright and add E2E scripts"
```

---

### Task 2: Create Playwright Config

**Files:**
- Create: `playwright.config.ts`
- Modify: `.gitignore`

**Step 1: Create the config file**

Uses `@nuxt/test-utils/playwright` `ConfigOptions` type. The `nuxt.host` option points at the running dev server so Playwright doesn't build Nuxt from scratch.

```typescript
import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'
import type { ConfigOptions } from '@nuxt/test-utils/playwright'

export default defineConfig<ConfigOptions>({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    nuxt: {
      rootDir: fileURLToPath(new URL('.', import.meta.url)),
      host: 'http://localhost:3000',
    },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
```

Key points:
- `testDir: './e2e'` keeps E2E separate from Vitest unit tests
- `nuxt.host` points at running dev server — no auto-build
- `nuxt.rootDir` set for Nuxt to resolve config if needed
- No `webServer` block — user starts dev server + Supabase manually

**Step 2: Add Playwright artifacts to `.gitignore`**

Append:

```
# Playwright
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/
```

**Step 3: Commit**

```bash
git add playwright.config.ts .gitignore
git commit -m "chore: add Playwright config with Nuxt test-utils integration"
```

---

### Task 3: Create Auth Helper

**Files:**
- Create: `e2e/helpers/auth.ts`

**Step 1: Create the auth helper**

Signs in via Supabase API and returns session tokens. Does NOT touch the browser — cookie injection happens in the fixture (Task 4).

Note: `@supabase/supabase-js` is a transitive dependency of `@nuxtjs/supabase`, so it's already installed. We import it directly for the E2E auth helper which runs outside Nuxt.

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_KEY ?? ''

export interface TestSession {
  accessToken: string
  refreshToken: string
}

export const TEST_USERS = {
  admin: { email: 'admin@test.local', password: 'admin1234' },
  dalUser: { email: 'test@test.com', password: 'password' },
  ualUser: { email: 'ual-user@test.local', password: 'password' },
  unverified: { email: 'unverified@test.com', password: 'password' },
} as const

export async function getTestSession(
  user: keyof typeof TEST_USERS = 'dalUser'
): Promise<TestSession> {
  const supabase = createClient(supabaseUrl, supabaseKey)
  const creds = TEST_USERS[user]

  const { data, error } = await supabase.auth.signInWithPassword({
    email: creds.email,
    password: creds.password,
  })

  if (error || !data.session) {
    throw new Error(
      `Auth failed for ${creds.email}: ${error?.message ?? 'no session returned'}`
    )
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  }
}
```

**Step 2: Commit**

```bash
git add e2e/helpers/auth.ts
git commit -m "feat(e2e): add auth helper for API-shortcut authentication"
```

---

### Task 4: Create Custom Test Fixture

**Files:**
- Create: `e2e/fixtures/test.ts`

**Step 1: Create the fixture file**

Extends `@nuxt/test-utils/playwright`'s `test` (which provides `goto` with hydration support) with an `authenticatedPage` fixture that injects Supabase session cookies.

`@nuxtjs/supabase` stores session in cookies named `sb-<ref>-auth-token`. For local Supabase at `127.0.0.1`, the ref is `127`.

```typescript
import { test as nuxtTest, expect } from '@nuxt/test-utils/playwright'
import { getTestSession, type TestSession } from '../helpers/auth'
import type { Page } from '@playwright/test'

type Fixtures = {
  authenticatedPage: Page
}

export const test = nuxtTest.extend<Fixtures>({
  authenticatedPage: async ({ page }, use) => {
    const session = await getTestSession('dalUser')
    await injectSupabaseCookies(page, session)
    await use(page)
  },
})

export { expect }

async function injectSupabaseCookies(
  page: Page,
  session: TestSession
): Promise<void> {
  const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
  const hostname = new URL(url).hostname
  const ref = hostname === '127.0.0.1' ? '127' : hostname.split('.')[0]
  const cookieName = `sb-${ref}-auth-token`

  const cookieValue = JSON.stringify({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
    token_type: 'bearer',
  })

  await page.context().addCookies([
    {
      name: cookieName,
      value: cookieValue,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ])
}
```

Key points:
- Extends `nuxtTest` (from `@nuxt/test-utils/playwright`) so `goto` with `waitUntil: 'hydration'` is still available
- `authenticatedPage` logs in as `dalUser` (has profile + airline) to avoid auth middleware redirects
- Cookie format must match `@nuxtjs/supabase` expectations — smoke test (Task 5) validates this

**Step 2: Commit**

```bash
git add e2e/fixtures/test.ts
git commit -m "feat(e2e): add authenticated page fixture with cookie injection"
```

---

### Task 5: Create Smoke Test

**Files:**
- Create: `e2e/smoke.spec.ts`

**Step 1: Create the smoke test**

```typescript
import { test, expect } from './fixtures/test'

test('authenticated user lands on seniority page', async ({
  authenticatedPage: page,
  goto,
}) => {
  await goto('/seniority', { waitUntil: 'hydration' })

  // Verify we stayed on seniority and weren't redirected to login
  await expect(page).toHaveURL(/\/seniority/)
})

test('unauthenticated user is redirected to login', async ({ page, goto }) => {
  await goto('/seniority', { waitUntil: 'hydration' })

  // Auth middleware should redirect to /auth/login
  await expect(page).toHaveURL(/\/auth\/login/)
})
```

**Step 2: Run the smoke test**

Prerequisites:
- Local Supabase running: `npm run db:start`
- DB seeded: `npm run db:seed-users`
- Dev server running: `npm run dev`

```bash
npm run test:e2e
```

Expected: Both tests pass.

**Step 3: Debug if cookie injection doesn't work**

If the authenticated test redirects to login, the cookie format is wrong. Debug:
1. Log in manually in the browser
2. Check DevTools > Application > Cookies for the exact cookie name and value format
3. Adjust `injectSupabaseCookies()` in `e2e/fixtures/test.ts`

**Step 4: Commit**

```bash
git add e2e/smoke.spec.ts
git commit -m "test(e2e): add smoke test for auth redirect behavior"
```

---

### Task 6: Update Vitest Config to Exclude E2E

**Files:**
- Modify: `vitest.config.ts`

**Step 1: Add exclude pattern so Vitest never picks up Playwright specs**

```typescript
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
      },
    },
    exclude: ['node_modules/**', 'e2e/**'],
  },
})
```

**Step 2: Verify unit tests still pass**

```bash
npm test
```

Expected: Existing tests pass, no E2E specs picked up.

**Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "chore: exclude e2e/ from Vitest test runner"
```
