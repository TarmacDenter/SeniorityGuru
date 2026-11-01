<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { install } = usePwaInstall()

useSeoMeta({
  title: 'SeniorityGuru — Pilot Seniority Tracker',
  description: 'Upload an airline seniority list to view rank, percentile, and career projections. Data stays on your device.',
  ogTitle: 'SeniorityGuru — Pilot Seniority Tracker',
  ogDescription: 'Upload an airline seniority list to view rank, percentile, and career projections. Data stays on your device.',
  twitterCard: 'summary',
})

const dataOwnershipItems = [
  {
    icon: 'i-lucide-plane',
    title: 'Use your airline\'s data',
    description: 'Upload a seniority spreadsheet without special access or an airline account.',
  },
  {
    icon: 'i-lucide-hard-drive',
    title: 'Local data',
    description: 'Your lists stay in your browser. SeniorityGuru does not receive them.',
  },
  {
    icon: 'i-lucide-user-x',
    title: 'No account',
    description: 'Use the app without creating an account or entering an email address.',
  },
]

const featureCards = [
  {
    icon: 'i-lucide-trending-up',
    title: 'Trajectory projections',
    description: 'Estimate percentile changes over time using scheduled retirements and optional growth assumptions.',
  },
  {
    icon: 'i-lucide-calendar-clock',
    title: 'Retirement estimates',
    description: 'Review projected retirements by year and see how they affect seniority position.',
  },
  {
    icon: 'i-lucide-map-pin',
    title: 'Position by base and seat',
    description: 'Compare your position within a base, seat category, and fleet as well as company-wide.',
  },
  {
    icon: 'i-lucide-git-compare-arrows',
    title: 'List comparison',
    description: 'Compare two lists to identify retirements, departures, qualification changes, and Seniority Number changes.',
  },
  {
    icon: 'i-lucide-bar-chart-3',
    title: 'Demographics',
    description: 'View age distribution, years of service, and cohort data for the list.',
  },
  {
    icon: 'i-lucide-upload',
    title: 'Column mapping',
    description: 'Upload CSV or Excel files in any column order and map common fields during review.',
  },
]


const {
  projection: demoProjection,
  projectionYears: demoProjectionYears,
  projectionLabel: demoProjectionLabel,
  qualificationPositions: demoQualScales,
  seat: demoSeat,
  seatOptions: demoSeatOptions,
  ageBuckets: demoAgeBuckets,
  waveBuckets: demoWaveBuckets,
  sampleFileColumns,
  sampleFileRows,
} = useLandingDemo()

const config = useRuntimeConfig()
const feedbackEmail = config.public.feedbackEmail as string
const parserRequestMailto = `mailto:${feedbackEmail}?subject=${encodeURIComponent('SeniorityGuru: Airline Import Plugin Request')}`

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
  <div>

    <!-- ── Section 1: Hero ───────────────────────────────────────────────── -->
    <section class="py-24 sm:py-32 bg-default">
      <UContainer>
        <div class="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto">
          <UIcon name="i-lucide-plane" class="size-12 text-primary" />

          <div>
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Dig into your seniority data.
            </h1>
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-muted">
              Securely.
            </h1>
          </div>

          <p class="text-lg sm:text-xl text-muted max-w-2xl">
            No account. Your data never leaves your device.
          </p>

          <div class="flex flex-wrap justify-center gap-3">
            <UButton to="/dashboard" size="xl" icon="i-lucide-arrow-right" trailing>
              Open Dashboard
            </UButton>
            <UButton size="xl" variant="soft" icon="i-lucide-play" trailing :loading="demoEntering" @click="enterDemo">
              View Demo
            </UButton>
            <UButton size="xl" variant="ghost" icon="i-lucide-download" trailing @click="install">
              Install App
            </UButton>
          </div>

          <div class="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span>Stays on your device</span>
            <span class="text-dimmed" aria-hidden="true">·</span>
            <span>No account needed</span>
            <span class="text-dimmed" aria-hidden="true">·</span>
            <span>Works offline</span>
            <span class="text-dimmed" aria-hidden="true">·</span>
            <a href="https://github.com/TarmacDenter/SeniorityGuru" target="_blank"
              class="text-primary hover:underline inline-flex items-center gap-1">
              Open source
              <UIcon name="i-lucide-github" class="size-3.5" />
            </a>
          </div>

          <!-- Stat strip -->
        </div>
      </UContainer>
    </section>

    <!-- ── Section 2: Upload an Airline Seniority List ───────────────────── -->
    <section class="py-16 sm:py-20 bg-elevated">
      <UContainer>
        <!-- Open-source banner -->
        <div class="text-center mb-12">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Upload and parse your company seniority list.
          </h2>
          <p class="text-muted max-w-xl mx-auto">
            Use the jetBlue or Delta format or a standard CSV or Excel file. If you belong to another airline, try the
            generic upload type.
            A wizard will help you map the column data into the required format.
          </p>
        </div>

        <!-- Airline Import Plugin cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto mb-10">
          <UCard>
            <div class="flex flex-col gap-3">
              <div class="flex items-center gap-3">
                <div class="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <UIcon name="selfhst:delta-air-lines" class="size-8 text-primary" />
                </div>
                <div>
                  <h3 class="font-semibold">Delta Air Lines</h3>
                  <p class="text-xs text-muted">Delta format</p>
                </div>
              </div>
              <ul class="text-sm text-muted space-y-1.5">
                <li class="flex items-start gap-2">
                  <UIcon name="i-lucide-check" class="size-4 text-primary shrink-0 mt-0.5" />
                  <span>Parses PBS seniority list exports</span>
                </li>
                <li class="flex items-start gap-2">
                  <UIcon name="i-lucide-check" class="size-4 text-primary shrink-0 mt-0.5" />
                  <span>Maps category values to Base, Fleet, and Seat</span>
                </li>
                <li class="flex items-start gap-2">
                  <UIcon name="i-lucide-check" class="size-4 text-primary shrink-0 mt-0.5" />
                  <span>Reads the effective date from the file header</span>
                </li>
              </ul>
            </div>
          </UCard>


          <UCard>
            <div class="flex flex-col gap-3">
              <div class="flex items-center gap-3">
                <div class="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <UIcon name="simple-icons:jetblue" class="size-8 text-primary" />
                </div>
                <div>
                  <h3 class="font-semibold">jetBlue</h3>
                  <p class="text-xs text-muted">CSV or XLSX</p>
                </div>
              </div>
              <ul class="text-sm text-muted space-y-1.5">
                <li class="flex items-start gap-2">
                  <UIcon name="i-lucide-check" class="size-4 text-primary shrink-0 mt-0.5" />
                  <span>Recognizes company quarterly seniority publication columns.</span>
                </li>
                <li class="flex items-start gap-2">
                  <UIcon name="i-lucide-check" class="size-4 text-primary shrink-0 mt-0.5" />
                  <span>Supports manual column mapping to handle the changes in format from list to list.</span>
                </li>
              </ul>
            </div>
          </UCard>

          <UCard>
            <div class="flex flex-col gap-3">
              <div class="flex items-center gap-3">
                <div class="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <UIcon name="i-lucide-file-spreadsheet" class="size-8 text-primary" />
                </div>
                <div>
                  <h3 class="font-semibold">Generic / Other Airline</h3>
                  <p class="text-xs text-muted">CSV or XLSX</p>
                </div>
              </div>
              <ul class="text-sm text-muted space-y-1.5">
                <li class="flex items-start gap-2">
                  <UIcon name="i-lucide-check" class="size-4 text-primary shrink-0 mt-0.5" />
                  <span>Standard CSV or Excel with column headers</span>
                </li>
                <li class="flex items-start gap-2">
                  <UIcon name="i-lucide-check" class="size-4 text-primary shrink-0 mt-0.5" />
                  <span>Recognizes common column names</span>
                </li>
                <li class="flex items-start gap-2">
                  <UIcon name="i-lucide-check" class="size-4 text-primary shrink-0 mt-0.5" />
                  <span>Supports manual column mapping</span>
                </li>
              </ul>
            </div>
          </UCard>
        </div>

        <!-- Required Data Format -->
        <div class="max-w-3xl mx-auto mb-10">
          <UCollapsible class="flex flex-col gap-2">
            <UButton label="Required Data Format (Generic)" color="neutral" variant="subtle"
              trailing-icon="i-lucide-chevron-down" block />
            <template #content>
              <UCard variant="subtle">
                <div class="space-y-4">
                  <p class="text-sm text-muted">
                    Your spreadsheet needs these columns (names are flexible — you can map them during upload):
                  </p>
                  <UTable :data="sampleFileRows" :columns="sampleFileColumns" :ui="{ td: 'font-mono text-xs' }" />
                  <p class="text-xs text-muted">
                    All data shown is fabricated for illustration purposes. <strong>Name</strong> is optional.
                  </p>
                  <NuxtLink to="/how-it-works#data-compatibility"
                    class="text-sm text-primary hover:underline inline-flex items-center gap-1">
                    Full format details
                    <UIcon name="i-lucide-arrow-right" class="size-3.5" />
                  </NuxtLink>
                </div>
              </UCard>
            </template>
          </UCollapsible>
        </div>

        <!-- CTA: Your airline not listed? -->
        <div class="max-w-3xl mx-auto text-center">
          <h3 class="font-semibold mb-2">Your airline not listed?</h3>
          <p class="text-sm text-muted mb-4">
            Request an import plugin for your airline, or contribute one to the project.
          </p>
          <div class="flex flex-wrap justify-center gap-3 mb-3">
            <UButton
              to="https://github.com/TarmacDenter/SeniorityGuru/issues/new?title=Parser%20request%3A%20%5BAirline%20Name%5D"
              target="_blank" color="primary" variant="outline" icon="i-lucide-github">
              Request an Import Plugin
            </UButton>
            <UButton :to="parserRequestMailto" color="neutral" variant="outline" icon="i-lucide-mail">
              Email Me
            </UButton>
          </div>
          <p class="text-xs text-muted">
            Developers: read the
            <a href="https://github.com/TarmacDenter/SeniorityGuru/blob/main/CONTRIBUTING.md" target="_blank"
              class="text-primary hover:underline">contributor guide</a>
            to add an Import Plugin for your airline.
          </p>
        </div>
      </UContainer>
    </section>

    <section>
      <!-- Qualification Position Scale -->
      <div class="max-w-5xl mx-auto py-20">
        <UCard>
          <template #header>
            <div class="flex items-center gap-4 flex-wrap">
              <h3 class="font-semibold text-sm">Position by qualification</h3>
              <div class="flex items-center gap-3 ml-auto flex-wrap">
                <div class="flex items-center gap-2">
                  <AppSwitch v-model="demoProjection" size="sm" />
                  <span class="text-sm text-muted">Project forward</span>
                </div>
                <template v-if="demoProjection">
                  <USlider v-model="demoProjectionYears" :min="1" :max="20" :step="1" class="w-32" />
                  <UBadge color="neutral" variant="subtle" size="sm" class="font-mono shrink-0">
                    {{ demoProjectionLabel }}
                  </UBadge>
                </template>
                <UBadge v-else color="neutral" variant="subtle" size="sm">Today</UBadge>
              </div>
            </div>
          </template>
          <div class="space-y-3">
            <p class="text-sm text-muted">
              Each row compares your <em>company-wide</em> Seniority Percentile with the makeup of each qualification.
              Instead of assuming that every retirement creates a seat for you, this view shows how competitive each
              qualification is over time. Each histogram row shows the number of pilots in a 5% seniority band.
            </p>
            <AnalyticsQualSeniorityScale :positions="demoQualScales" />
          </div>
        </UCard>
      </div>
    </section>


    <!-- Trajectory Demo ───────────────────────────────────── -->
    <section id="demo" class="py-16 sm:py-20 bg-elevated">
      <UContainer>
        <div class="text-center mb-10">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Your position by qualification (naive)
          </h2>
          <p class="text-muted max-w-xl mx-auto">
            Compare your company-wide Rank with your position within each qualification. Most seniority calculators plot
            movement only as pilots in that qualification retire. SeniorityGuru reruns the projection with different
            growth assumptions.
          </p>
        </div>

        <div class="max-w-3xl mx-auto">
          <DemoTrajectoryDemo />
          <p class="text-center text-xs text-muted mt-4">
            Simulated data — your actual trajectory uses your real list.
          </p>
        </div>
      </UContainer>
    </section>

    <!-- ── Section 4: New Hire ───────────────────────────────────────────── -->
    <section class="py-16 sm:py-20 bg-elevated">
      <UContainer>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <!-- Copy -->
          <div class="space-y-5">
            <UBadge color="primary" variant="subtle" icon="i-lucide-star">
              New Hire Mode
            </UBadge>
            <h2 class="text-2xl sm:text-3xl font-bold tracking-tight">
              Estimate your starting position
            </h2>
            <p class="text-muted leading-relaxed">
              If your employee number is not on the list, choose your base, seat, fleet, and birth date to estimate your
              starting position and how retirements may change it.
            </p>
          </div>

          <!-- Mockup card -->
          <UCard class="max-w-sm mx-auto lg:mx-0 w-full">
            <template #header>
              <div class="flex items-center justify-between">
                <span class="font-semibold">Current › Status</span>
                <UBadge color="primary" variant="subtle" size="sm">New Hire</UBadge>
              </div>
            </template>

            <div class="space-y-4 py-1">
              <div>
                <div class="text-xs text-muted mb-1">Seniority Number</div>
                <div class="font-mono text-xl font-bold">4892</div>
              </div>
              <div>
                <div class="text-xs text-muted mb-1">Rank</div>
                <div class="font-mono text-xl font-bold">4,892 <span class="text-sm font-normal text-muted">of 4,892
                    on roster</span></div>
              </div>
              <div>
                <div class="text-xs text-muted mb-1">Company-wide Seniority Percentile</div>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-trending-up" class="size-4 text-success" />
                  <span class="font-mono text-xl font-bold">0.0%</span>
                </div>
              </div>
              <div>
                <div class="text-xs text-muted mb-1">Hire date</div>
                <div class="font-mono text-sm">Jan 15, 2026</div>
              </div>
              <div class="border-t border-default pt-3">
                <div class="text-xs text-muted mb-1">Projection</div>
                <div class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-clock" class="size-4 text-primary" />
                  <span class="text-sm">
                    In 5 years: ~182 pilots above you retire → <span class="font-semibold font-mono">3.7%
                      Seniority Percentile</span>
                  </span>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </UContainer>
    </section>

    <!-- ── Section 5: Comparison Demo ───────────────────────────────────── -->
    <section class="py-16 sm:py-20 bg-default">
      <UContainer>
        <div class="text-center mb-10">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Compare lists over time
          </h2>
          <p class="text-muted max-w-xl mx-auto">
            Upload a second list to identify retirements, quits, qual changes, and new hires.
          </p>
        </div>

        <div class="max-w-3xl mx-auto">
          <DemoComparisonDemo />
        </div>
      </UContainer>
    </section>

    <!-- ── Section 5b: Analytics Demo ────────────────────────────────────── -->
    <section class="py-16 sm:py-20 bg-elevated">
      <UContainer>
        <div class="text-center mb-8">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Review retirement timing
          </h2>
          <p class="text-muted max-w-xl mx-auto">
            Select a seat category to compare the yearly counts.
          </p>
        </div>

        <!-- Qualification toggle -->
        <div class="flex justify-center mb-8">
          <UTabs v-model="demoSeat" :items="demoSeatOptions" :content="false" size="sm" />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto mb-6">
          <!-- Age Distribution -->
          <UCard>
            <template #header>
              <h3 class="font-semibold text-sm">Age Distribution</h3>
            </template>
            <div class="space-y-3">
              <p class="text-sm text-muted">
                The chart groups pilots by age range.
              </p>
              <AnalyticsAgeDistributionChart :buckets="demoAgeBuckets" :null-count="0" :mandatory-retirement-age="65" />
            </div>
          </UCard>

          <!-- Retirement Wave -->
          <UCard>
            <template #header>
              <h3 class="font-semibold text-sm">Retirement Wave</h3>
            </template>
            <div class="space-y-3">
              <p class="text-sm text-muted">
                The chart shows projected retirements by year.
              </p>
              <AnalyticsRetirementWaveChart :wave-buckets="demoWaveBuckets" :percentile-series="[]" qualification-scope="" />
            </div>
          </UCard>
        </div>

      </UContainer>
    </section>

    <!-- ── Section 6: Data Ownership ────────────────────────────────────── -->
    <section class="py-16 sm:py-20 bg-default">
      <UContainer>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div v-for="item in dataOwnershipItems" :key="item.title" class="flex gap-4">
            <div class="shrink-0 size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UIcon :name="item.icon" class="size-5 text-primary" />
            </div>
            <div>
              <h3 class="font-semibold mb-1">{{ item.title }}</h3>
              <p class="text-sm text-muted">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- ── Section 8: Feature Cards ─────────────────────────────────────── -->
    <section class="py-16 sm:py-20 bg-default">
      <UContainer>
        <div class="text-center mb-12">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight">
            Review your seniority data
          </h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <UCard v-for="feature in featureCards" :key="feature.title">
            <div class="flex flex-col gap-3 py-1">
              <UIcon :name="feature.icon" class="size-7 text-primary" />
              <h3 class="font-semibold">{{ feature.title }}</h3>
              <p class="text-sm text-muted">{{ feature.description }}</p>
            </div>
          </UCard>
        </div>
      </UContainer>
    </section>


    <!-- ── Section 9: CTA ────────────────────────────────────────────────── -->
    <section class="py-20 sm:py-28 bg-elevated text-center">
      <UContainer>
        <div class="max-w-xl mx-auto space-y-6">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight">
            Review your seniority position.
          </h2>
          <p class="text-muted">
            Free to use. Your data stays on your device.
          </p>
          <UButton to="/dashboard" size="xl" icon="i-lucide-arrow-right" trailing>
            Open Dashboard
          </UButton>

          <!-- Trust signals -->
          <div class="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted pt-2">
            <span class="flex items-center gap-1.5">
              <UIcon name="i-lucide-shield-check" class="size-4" />
              No airline partnership needed
            </span>
            <span class="flex items-center gap-1.5">
              <UIcon name="i-lucide-hard-drive" class="size-4" />
              Stays on your device
            </span>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Demo setup overlay interstitial -->
    <Transition name="fade">
      <div v-if="demoEntering"
        class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-default/90 backdrop-blur-sm"
        aria-live="polite" aria-label="Setting up your demo">
        <UIcon name="i-lucide-loader-circle" class="size-12 text-primary animate-spin" />
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
