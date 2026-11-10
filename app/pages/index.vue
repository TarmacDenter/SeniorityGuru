<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { install } = usePwaInstall()

useSeoMeta({
  title: 'SeniorityGuru — Pilot Seniority Tracker',
  description: 'Upload an airline seniority list to see your Rank today, when you can hold each Qualification, and which retirements move you. Data stays on your device.',
  ogTitle: 'SeniorityGuru — Pilot Seniority Tracker',
  ogDescription: 'Upload an airline seniority list to see your Rank today, when you can hold each Qualification, and which retirements move you. Data stays on your device.',
  twitterCard: 'summary',
})

const demoEntering = ref(false)

async function enterDemo() {
  demoEntering.value = true
  try {
    const { emitHook } = await import('~/utils/hooks')
    await emitHook('app:demo:enter')
  }
  finally {
    demoEntering.value = false
  }
}
</script>

<template>
  <div class="space-y-16 sm:space-y-24">
    <!-- Hero -->
    <section class="pt-8 sm:pt-16 text-center">
      <div class="mx-auto flex max-w-3xl flex-col items-center gap-6">
        <h1 class="text-4xl font-bold leading-tight tracking-tight text-highlighted sm:text-5xl">
          See where you'll be on the seniority list in 5, 10 and 20 years.
        </h1>
        <p class="max-w-2xl text-lg text-muted">
          Upload your airline's list to see your Rank today, when you can hold each Qualification, and which
          retirements move you.
        </p>
        <div class="flex flex-wrap justify-center gap-3">
          <UButton size="xl" icon="i-lucide-play" :loading="demoEntering" @click="enterDemo">
            View Demo
          </UButton>
          <UButton to="/dashboard" size="xl" variant="soft" trailing-icon="i-lucide-arrow-right">
            Open Dashboard
          </UButton>
          <UButton size="xl" variant="ghost" icon="i-lucide-download" @click="install">
            Install App
          </UButton>
        </div>
        <p class="text-sm text-muted">
          Stays on your device · No account · Works offline ·
          <a href="https://github.com/TarmacDenter/SeniorityGuru" target="_blank" class="text-highlighted underline">Open source</a>
        </p>
      </div>
    </section>

    <LandingShowcase v-slot="{ diffRows }">
      <div class="space-y-16 sm:space-y-24">
        <section class="mx-auto max-w-4xl">
          <LandingTrajectory />
        </section>

        <section class="space-y-6">
          <LandingSectionHeading title="Where you stand today" description="Your line on the list, with Rank today beside your Seniority Number." />
          <LandingStanding @open-demo="enterDemo" />
        </section>

        <section class="space-y-6">
          <LandingSectionHeading title="When you can hold each Qualification" description="The year your Rank reaches each Qualification's most junior active pilot, from scheduled retirements." />
          <LandingHoldability />
        </section>

        <section class="space-y-6">
          <LandingSectionHeading title="Which retirements move you" description="Retirements per year, with your Seniority Percentile over them." />
          <LandingRetirementWave />
        </section>

        <section class="space-y-6">
          <LandingSectionHeading title="What changed since the last list" description="Upload a newer list to see who retired, departed, was hired or changed Qualification." />
          <LandingComparison :rows="diffRows" />
        </section>
      </div>
    </LandingShowcase>

    <section class="space-y-10 border-t border-default pt-16">
      <LandingPrivacy />
      <div class="space-y-4">
        <h2 class="text-xl font-semibold text-highlighted">Supported lists</h2>
        <LandingSupportedLists />
      </div>
    </section>

    <section class="border-t border-default py-16 text-center">
      <div class="mx-auto max-w-xl space-y-6">
        <h2 class="text-2xl font-bold tracking-tight text-highlighted sm:text-3xl">
          Try it with the demo list, then upload yours.
        </h2>
        <div class="flex flex-wrap justify-center gap-3">
          <UButton size="xl" icon="i-lucide-play" :loading="demoEntering" @click="enterDemo">
            Try the Demo
          </UButton>
          <UButton to="/dashboard" size="xl" variant="soft" trailing-icon="i-lucide-arrow-right">
            Open Dashboard
          </UButton>
        </div>
      </div>
    </section>

    <Transition name="fade">
      <div
        v-if="demoEntering"
        class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-default/90 backdrop-blur-sm"
        aria-live="polite"
        aria-label="Setting up your demo"
      >
        <UIcon name="i-lucide-loader-circle" class="size-12 animate-spin text-highlighted" />
        <p class="text-lg font-medium">Setting up your demo…</p>
        <p class="text-sm text-muted">Loading seniority data</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
