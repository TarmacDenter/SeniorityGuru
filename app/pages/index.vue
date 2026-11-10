<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { install } = usePwaInstall()

useSeoMeta({
  title: 'SeniorityGuru — Pilot Seniority Tracker',
  description: 'Analyze your company seniority list in your browser: retirements by base, seat and fleet over the time horizon you choose. The file is saved on your device and never sent to a server.',
  ogTitle: 'SeniorityGuru — Pilot Seniority Tracker',
  ogDescription: 'Analyze your company seniority list in your browser: retirements by base, seat and fleet over the time horizon you choose. The file is saved on your device and never sent to a server.',
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
          Analyze your company seniority deeply and locally.
        </h1>
        <p class="max-w-2xl text-lg text-muted">
          Open your airline's seniority list in your browser. Filter retirements by base, seat and fleet, and
          change the time horizon. The file is read and saved on this device; nothing is sent to a server.
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
          Saved on this device only · No account · Works offline ·
          <a href="https://github.com/TarmacDenter/SeniorityGuru" target="_blank" class="text-highlighted underline">Open source</a>
        </p>
      </div>
    </section>

    <LandingShowcase v-slot="{ diffRows }">
      <div class="space-y-16 sm:space-y-24">
        <section class="space-y-6">
          <LandingSectionHeading title="Retirements by Qualification" description="Scheduled retirements by base, seat and fleet, year by year. Group the rows, show counts or shares of each group, and choose how many years ahead to look." />
          <LandingHeatmap />
        </section>

        <section class="space-y-6">
          <LandingSectionHeading title="Retirements senior to you" description="How many pilots senior to you are scheduled to retire within the horizon you choose. The line is an estimate from those retirement dates alone." />
          <LandingRetirementWave />
        </section>

        <section class="space-y-6">
          <LandingSectionHeading title="Where you stand today" description="Your line on the list, with Rank today beside your Seniority Number." />
          <LandingStanding @open-demo="enterDemo" />
        </section>

        <section class="space-y-6">
          <LandingSectionHeading title="Each Qualification under scheduled retirements" description="An estimate of when your Rank would reach each Qualification's most junior active pilot if scheduled retirements were the only change. Switch seats to compare." />
          <LandingHoldability />
        </section>

        <section class="space-y-6">
          <LandingSectionHeading title="Your Seniority Percentile under one scenario" description="Company-wide, scheduled retirements only. In the dashboard you can narrow the Qualification Scope, add Growth Assumptions and compare two scopes on one chart." />
          <LandingTrajectory />
        </section>

        <section class="space-y-6">
          <LandingSectionHeading title="Check estimates against the next list" description="When a new list is published, compare it with the last one to see the departures, Qualification moves and new hires that a retirement-only projection leaves out." />
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
          Try it with the demo list, then import yours.
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
