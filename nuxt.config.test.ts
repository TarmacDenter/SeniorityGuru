// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// defineNuxtConfig is a Nuxt macro — stub it so we can import nuxt.config.ts in node
vi.stubGlobal('defineNuxtConfig', (c: unknown) => c)

const config = (await import('./nuxt.config')).default as any

// Manifest lives in public/manifest.webmanifest (served directly by the dev server)
const manifest = JSON.parse(
  readFileSync(resolve(__dirname, 'public/manifest.webmanifest'), 'utf-8')
)

describe('nuxt.config pwa manifest', () => {

  it('has required top-level fields', () => {
    expect(manifest.name).toBeTruthy()
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.start_url).toBe('/')
    expect(manifest.display).toBe('standalone')
    expect(manifest.theme_color).toBeTruthy()
    expect(manifest.background_color).toBeTruthy()
  })

  it('references 192×192 and 512×512 icons', () => {
    const sizes = manifest.icons.map((i: any) => i.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
  })

  it('includes a maskable icon entry', () => {
    const maskable = manifest.icons.find((i: any) => i.purpose === 'maskable')
    expect(maskable).toBeDefined()
    expect(maskable.sizes).toBe('512x512')
  })
})

describe('nuxt.config app.head', () => {
  const head = (config as any).app?.head

  it('includes apple-touch-icon link', () => {
    const link = head?.link?.find((l: any) => l.rel === 'apple-touch-icon')
    expect(link).toBeDefined()
    expect(link.href).toBeTruthy()
  })

  it('includes apple-mobile-web-app-capable meta', () => {
    const meta = head?.meta?.find((m: any) => m.name === 'apple-mobile-web-app-capable')
    expect(meta?.content).toBe('yes')
  })

  it('includes apple-mobile-web-app-status-bar-style meta', () => {
    const meta = head?.meta?.find((m: any) => m.name === 'apple-mobile-web-app-status-bar-style')
    expect(meta?.content).toBeTruthy()
  })
})
