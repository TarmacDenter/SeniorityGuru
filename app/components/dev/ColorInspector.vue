<script setup lang="ts">
// DEV ONLY color inspector. Mounted from app.vue behind import.meta.dev.
// Turn it on with the "Colors" button or Alt+I, hover any element to see its text, background,
// border (and SVG fill/stroke) colors with the design tokens that resolve to the same color.
// Click to pin the readout, click a token to copy var(--token), Esc to unpin and then to exit.

interface Swatch {
  role: string
  hex: string
  alpha: number
  tokens: string[]
  /** Element that actually supplies the color when it is inherited from an ancestor. */
  from: string | null
}

const active = ref(false)
const pinned = ref(false)
const side = ref<'left' | 'right'>('right')
const label = ref('')
const swatches = ref<Swatch[]>([])
const copied = ref('')
const box = reactive({ x: 0, y: 0, w: 0, h: 0, show: false })

// Design tokens come first; raw palette and component-scale tokens are a fallback.
const SEMANTIC = /^--(ui-(?!color-)|mark|stamp)/
const PALETTE = /^--(ui-color-|color-)/

let ctx: CanvasRenderingContext2D | null = null
let probe: HTMLElement | null = null
let tokenMap = new Map<string, string[]>()
let tokenMapTheme = ''

function toRgba(css: string): [number, number, number, number] | null {
  if (!ctx) return null
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = '#000'
  ctx.fillStyle = css
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  return [r!, g!, b!, a!]
}

const colorKey = (rgba: number[]) => rgba.join(',')
const hex2 = (n: number) => n.toString(16).padStart(2, '0')
const toHex = (rgba: number[]) => `#${hex2(rgba[0]!)}${hex2(rgba[1]!)}${hex2(rgba[2]!)}${rgba[3]! < 255 ? hex2(rgba[3]!) : ''}`

function collectTokenNames(rules: CSSRuleList, into: Set<string>) {
  for (const rule of Array.from(rules)) {
    if ('style' in rule && rule.style instanceof CSSStyleDeclaration) {
      for (const name of Array.from(rule.style)) if (name.startsWith('--') && (SEMANTIC.test(name) || PALETTE.test(name))) into.add(name)
    }
    if ('cssRules' in rule && rule.cssRules) collectTokenNames(rule.cssRules as CSSRuleList, into)
  }
}

function buildTokenMap() {
  const theme = document.documentElement.className
  if (theme === tokenMapTheme && tokenMap.size) return
  tokenMapTheme = theme
  tokenMap = new Map()
  const names = new Set<string>()
  for (const sheet of Array.from(document.styleSheets)) {
    try { collectTokenNames(sheet.cssRules, names) } catch { /* cross-origin sheet */ }
  }
  probe ??= Object.assign(document.createElement('span'), { hidden: true })
  document.documentElement.appendChild(probe)
  probe.style.color = 'rgb(1, 2, 3)'
  const baseline = getComputedStyle(probe).color
  const ordered = [...names].sort((a, b) => Number(PALETTE.test(a)) - Number(PALETTE.test(b)) || a.localeCompare(b))
  for (const name of ordered) {
    probe.style.color = `var(${name})`
    const resolved = getComputedStyle(probe).color
    if (resolved === baseline) continue // not a color token
    const rgba = toRgba(resolved)
    if (!rgba) continue
    const key = colorKey(rgba)
    tokenMap.set(key, [...(tokenMap.get(key) ?? []), name])
  }
  probe.remove()
}

function tokensFor(rgba: number[]): string[] {
  const all = tokenMap.get(colorKey(rgba)) ?? []
  const semantic = all.filter(name => SEMANTIC.test(name))
  return (semantic.length ? semantic : all).slice(0, 4)
}

function describe(el: Element): string {
  const classes = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean) : []
  return `${el.tagName.toLowerCase()}${classes.length ? `.${classes.slice(0, 3).join('.')}${classes.length > 3 ? '…' : ''}` : ''}`
}

function swatch(role: string, css: string, from: Element | null, self: Element): Swatch | null {
  const rgba = toRgba(css)
  if (!rgba || rgba[3] === 0) return null
  return {
    role,
    hex: toHex(rgba),
    alpha: rgba[3] / 255,
    tokens: tokensFor(rgba),
    from: from && from !== self ? describe(from) : null,
  }
}

function inspect(el: Element) {
  buildTokenMap()
  const style = getComputedStyle(el)
  const found: (Swatch | null)[] = [swatch('Text', style.color, null, el)]

  let bgEl: Element | null = el
  while (bgEl) {
    const bg = getComputedStyle(bgEl).backgroundColor
    const rgba = toRgba(bg)
    if (rgba && rgba[3] > 0) {
      found.push(swatch('Background', bg, bgEl, el))
      break
    }
    bgEl = bgEl.parentElement
  }

  if (parseFloat(style.borderTopWidth) > 0 || parseFloat(style.borderLeftWidth) > 0) {
    found.push(swatch('Border', parseFloat(style.borderTopWidth) > 0 ? style.borderTopColor : style.borderLeftColor, null, el))
  }
  if (el instanceof SVGElement) {
    if (style.fill !== 'none') found.push(swatch('Fill', style.fill, null, el))
    if (style.stroke !== 'none') found.push(swatch('Stroke', style.stroke, null, el))
  }

  label.value = describe(el)
  swatches.value = found.filter((s): s is Swatch => !!s)
  const rect = el.getBoundingClientRect()
  Object.assign(box, { x: rect.x, y: rect.y, w: rect.width, h: rect.height, show: true })
}

const inInspector = (target: EventTarget | null) => target instanceof Element && !!target.closest('[data-color-inspector]')

function onMove(event: MouseEvent) {
  if (!active.value || pinned.value || inInspector(event.target)) return
  side.value = event.clientX > window.innerWidth / 2 ? 'left' : 'right'
  if (event.target instanceof Element) inspect(event.target)
}

function onClick(event: MouseEvent) {
  if (!active.value || inInspector(event.target)) return
  event.preventDefault()
  event.stopPropagation()
  if (event.target instanceof Element && !pinned.value) inspect(event.target)
  pinned.value = !pinned.value
}

function stop() {
  active.value = false
  pinned.value = false
  box.show = false
}

function onKey(event: KeyboardEvent) {
  if (event.altKey && event.key.toLowerCase() === 'i') {
    event.preventDefault()
    if (active.value) stop()
    else active.value = true
  } else if (event.key === 'Escape' && active.value) {
    if (pinned.value) pinned.value = false
    else stop()
  }
}

async function copy(token: string) {
  const text = `var(${token})`
  try { await navigator.clipboard.writeText(text) } catch { /* clipboard unavailable */ }
  copied.value = token
  setTimeout(() => { if (copied.value === token) copied.value = '' }, 1200)
}

onMounted(() => {
  ctx = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true })
  document.addEventListener('mousemove', onMove, true)
  document.addEventListener('click', onClick, true)
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onMove, true)
  document.removeEventListener('click', onClick, true)
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div data-color-inspector>
    <button type="button" class="ci-toggle" :aria-pressed="active" title="Alt+I" @click="active ? stop() : (active = true)">
      Colors {{ active ? 'on' : 'off' }}
    </button>

    <div v-if="active && box.show" class="ci-outline" :style="{ left: `${box.x}px`, top: `${box.y}px`, width: `${box.w}px`, height: `${box.h}px` }" />

    <aside v-if="active" class="ci-panel" :class="side" aria-live="polite">
      <p class="ci-head">{{ label || 'Hover an element' }}<small v-if="pinned"> pinned, click to release</small></p>
      <ul v-if="swatches.length">
        <li v-for="s in swatches" :key="s.role">
          <span class="ci-chip"><i :style="{ background: s.hex }" /></span>
          <div>
            <p><b>{{ s.role }}</b> <code>{{ s.hex }}</code><small v-if="s.alpha < 1"> {{ Math.round(s.alpha * 100) }}% alpha</small></p>
            <p v-if="s.from" class="from">from {{ s.from }}</p>
            <p class="tokens">
              <button v-for="t in s.tokens" :key="t" type="button" @click="copy(t)">{{ copied === t ? 'copied' : t }}</button>
              <em v-if="!s.tokens.length">no matching token</em>
            </p>
          </div>
        </li>
      </ul>
      <p v-else class="ci-empty">No visible colors on this element.</p>
    </aside>
  </div>
</template>

<style>
[data-color-inspector] { font: 12px/1.4 system-ui, sans-serif; color: #e5e7eb; }
.ci-toggle {
  position: fixed; left: 1rem; bottom: 5.5rem; z-index: 9999;
  min-height: 36px; padding: 0 0.875rem; border-radius: 999px;
  background: #111827; color: #fff; border: 1px solid #fff3; box-shadow: 0 6px 24px #0007;
  font: 500 0.8125rem system-ui, sans-serif; cursor: pointer;
}
.ci-toggle[aria-pressed='true'] { background: #ffe14d; color: #17212b; }
.ci-outline { position: fixed; z-index: 9997; pointer-events: none; outline: 2px solid #ff3ea5; outline-offset: -1px; background: #ff3ea51f; }
.ci-panel {
  position: fixed; top: 4.5rem; z-index: 9998; width: min(20rem, calc(100vw - 2rem));
  max-height: calc(100vh - 6rem); overflow: auto;
  background: #111827; border: 1px solid #fff3; border-radius: 8px; box-shadow: 0 12px 40px #000a; padding: 0.75rem;
}
.ci-panel.right { right: 1rem; }
.ci-panel.left { left: 1rem; }
.ci-panel ul { list-style: none; margin: 0.5rem 0 0; padding: 0; display: grid; gap: 0.625rem; }
.ci-panel li { display: flex; gap: 0.625rem; align-items: flex-start; }
.ci-panel p { margin: 0; }
.ci-head { font: 600 12px ui-monospace, monospace; overflow-wrap: anywhere; }
.ci-head small, .ci-panel li small { font-weight: 400; color: #9ca3af; }
.ci-chip { flex: none; width: 28px; height: 28px; border-radius: 4px; border: 1px solid #fff4; overflow: hidden;
  background: repeating-conic-gradient(#555 0 25%, #888 0 50%) 0 0 / 8px 8px; }
.ci-chip i { display: block; width: 100%; height: 100%; }
.ci-panel code { font: 12px ui-monospace, monospace; }
.ci-panel .from { color: #9ca3af; font-size: 11px; overflow-wrap: anywhere; }
.ci-panel .tokens { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.25rem; }
.ci-panel .tokens button {
  font: 11px ui-monospace, monospace; padding: 0.125rem 0.375rem; border-radius: 4px; cursor: pointer;
  background: #1f2937; color: #a7f3d0; border: 1px solid #fff2;
}
.ci-panel .tokens em { color: #9ca3af; }
.ci-empty { color: #9ca3af; margin-top: 0.5rem !important; }
@media (min-width: 640px) { .ci-toggle { bottom: 1rem; } }
</style>
