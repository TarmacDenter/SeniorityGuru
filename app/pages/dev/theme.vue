<template>
  <UDashboardPanel>
    <template #body>
  <div class="p-8 space-y-12 max-w-5xl mx-auto">
    <div>
      <h1 class="text-2xl font-bold text-highlighted mb-1">Design Token Playground</h1>
      <p class="text-muted text-sm">Visual reference for all semantic colors and tokens. To retheme primary, update <code>--ui-color-primary-*</code> in <code>main.css</code> section 3.</p>
    </div>

    <!-- Color Palettes -->
    <section class="space-y-4">
      <h2 class="text-lg font-semibold text-highlighted">Color Palettes</h2>
      <p class="text-xs text-muted">All registered semantic colors — shades 50–950. To retheme <code>primary</code>, update <code>--ui-color-primary-*</code> in <code>main.css</code> section 3. Other colors: update <code>app.config.ts</code> + <code>rm -rf .nuxt</code>.</p>
      <div v-for="color in semanticColors" :key="color" class="space-y-1">
        <p class="text-xs text-muted font-mono">{{ color }}</p>
        <div class="flex gap-1">
          <div
            v-for="shade in shades"
            :key="shade"
            :style="{ background: `var(--ui-color-${color}-${shade})` }"
            class="flex-1 h-10 rounded flex items-end justify-center pb-1"
          >
            <span class="text-[9px] font-mono mix-blend-difference text-white opacity-70">{{ shade }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Text Tokens -->
    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-highlighted">Semantic Text Tokens</h2>
      <p class="text-xs text-muted">Override <code>.dark &#123; --ui-text-* &#125;</code> in <code>main.css</code> to change these.</p>
      <div class="space-y-2">
        <div v-for="token in textTokens" :key="token.class" class="flex items-baseline gap-4">
          <span class="text-xs text-muted font-mono w-36 shrink-0">{{ token.class }}</span>
          <span :class="token.class" class="text-base">The quick brown fox jumps over the lazy dog</span>
        </div>
      </div>
    </section>

    <!-- Surface Tokens -->
    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-highlighted">Semantic Surface Tokens</h2>
      <p class="text-xs text-muted">Override in <code>main.css</code> section 2.</p>
      <div class="flex flex-wrap gap-3">
        <div
          v-for="surface in surfaceTokens"
          :key="surface.label"
          :class="surface.bg"
          class="flex-1 min-w-32 h-20 rounded-lg border border-default flex items-end p-2"
        >
          <span class="text-xs font-mono text-muted">{{ surface.label }}</span>
        </div>
      </div>
    </section>

    <!-- Component Color Variants -->
    <section class="space-y-4">
      <h2 class="text-lg font-semibold text-highlighted">Component Color Variants</h2>
      <p class="text-xs text-muted">These use <code>color="..."</code> props — driven by <code>app.config.ts</code> palette mappings.</p>

      <div class="space-y-3">
        <div>
          <p class="text-xs text-muted mb-2">UButton (solid)</p>
          <div class="flex flex-wrap gap-2">
            <UButton v-for="color in componentColors" :key="color" :color="(color as any)" :label="color" />
          </div>
        </div>
        <div>
          <p class="text-xs text-muted mb-2">UButton (soft)</p>
          <div class="flex flex-wrap gap-2">
            <UButton v-for="color in componentColors" :key="color" :color="(color as any)" variant="soft" :label="color" />
          </div>
        </div>
        <div>
          <p class="text-xs text-muted mb-2">UBadge</p>
          <div class="flex flex-wrap gap-2">
            <UBadge v-for="color in componentColors" :key="color" :color="(color as any)" :label="color" />
          </div>
        </div>
        <div>
          <p class="text-xs text-muted mb-2">UAlert</p>
          <div class="space-y-2">
            <UAlert v-for="color in componentColors" :key="color" :color="(color as any)" :title="color" :description="`This is a ${color} alert`" />
          </div>
        </div>
      </div>
    </section>

    <!-- Icon Colors -->
    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-highlighted">Icon Color Semantics</h2>
      <p class="text-xs text-muted">Icons get color via CSS class — never hardcoded palette values. Change <code>app.config.ts</code> to retheme all icons at once.</p>
      <div class="flex flex-wrap gap-6">
        <div v-for="icon in iconColors" :key="icon.class" class="flex flex-col items-center gap-1">
          <UIcon name="i-lucide-plane" class="size-8" :class="icon.class" />
          <span class="text-xs font-mono text-muted">{{ icon.class }}</span>
        </div>
      </div>
    </section>

    <!-- Retirement Timeline -->
    <section class="space-y-3">
      <h2 class="text-lg font-semibold text-highlighted">Retirement Timeline Colors</h2>
      <p class="text-xs text-muted">Custom CSS variables defined in <code>main.css</code> section 4. Use <code>text-(--ui-past)</code> etc. in templates.</p>
      <div class="flex gap-4">
        <div v-for="rt in retirementTokens" :key="rt.label" class="flex items-center gap-2">
          <div class="size-6 rounded" :style="{ background: `var(--ui-${rt.label})` }" />
          <div>
            <p class="text-sm font-medium" :style="{ color: `var(--ui-${rt.label})` }">{{ rt.title }}</p>
            <p class="text-xs font-mono text-muted">--ui-{{ rt.label }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

if (!import.meta.dev) {
  await navigateTo('/')
}

const semanticColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
const componentColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

const textTokens = [
  { class: 'text-highlighted' },
  { class: 'text-toned' },
  { class: 'text-default' },
  { class: 'text-muted' },
  { class: 'text-dimmed' },
]

const surfaceTokens = [
  { label: 'bg (base)', bg: 'bg-default' },
  { label: 'bg-muted', bg: 'bg-muted' },
  { label: 'bg-elevated', bg: 'bg-elevated' },
  { label: 'bg-accented', bg: 'bg-accented' },
]

const iconColors = [
  { class: 'text-primary' },
  { class: 'text-secondary' },
  { class: 'text-success' },
  { class: 'text-info' },
  { class: 'text-warning' },
  { class: 'text-error' },
  { class: 'text-muted' },
  { class: 'text-highlighted' },
]

const retirementTokens = [
  { label: 'past', title: 'Past / Retiring' },
  { label: 'imminent', title: 'Imminent (~2yr)' },
  { label: 'soon', title: 'Soon (~5yr)' },
]
</script>
