<script setup lang="ts">
import type { QualDemographicScale } from '~/utils/seniority-engine'

definePageMeta({ layout: 'default' })

const { install } = usePwaInstall()

useSeoMeta({
  title: 'SeniorityGuru — Pilot Seniority Tracker',
  description: 'Upload an airline seniority list to view rank, percentile, and career projections. Data stays on your device.',
  ogTitle: 'SeniorityGuru — Pilot Seniority Tracker',
  ogDescription: 'Upload an airline seniority list to view rank, percentile, and career projections. Data stays on your device.',
  twitterCard: 'summary',
})

const howItWorksSteps = [
  {
    icon: 'i-lucide-upload',
    title: 'Upload a list',
    description: 'Use CSV or Excel. Map the seniority number, employee number, dates, base, seat, and fleet columns during upload.',
  },
  {
    icon: 'i-lucide-user-check',
    title: 'Select your entry',
    description: 'Enter your employee number to select your row from the list.',
  },
  {
    icon: 'i-lucide-trending-up',
    title: 'Review your position',
    description: 'View rank, percentile, career projections, and retirement estimates in the dashboard.',
  },
]

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
    description: 'Compare two lists to identify retirements, departures, qualification changes, and rank changes.',
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


const BASE_QUAL_SCALES = [
  {
    fleet: 'E175', seat: 'FO', base: 'DEN', activeCount: 142,
    plugPercentile: 2, plugSenNum: 4780, p25: 18, median: 32, p75: 51, max: 62,
    density: [
      { start: 0,  count: 4  }, { start: 5,  count: 8  }, { start: 10, count: 14 },
      { start: 15, count: 19 }, { start: 20, count: 22 }, { start: 25, count: 20 },
      { start: 30, count: 16 }, { start: 35, count: 13 }, { start: 40, count: 10 },
      { start: 45, count: 8  }, { start: 50, count: 5  }, { start: 55, count: 2  },
      { start: 60, count: 1  }, { start: 65, count: 0  }, { start: 70, count: 0  },
      { start: 75, count: 0  }, { start: 80, count: 0  }, { start: 85, count: 0  },
      { start: 90, count: 0  }, { start: 95, count: 0  },
    ],
  },
  {
    fleet: 'E175', seat: 'CA', base: 'DEN', activeCount: 68,
    plugPercentile: 41, plugSenNum: 2950, p25: 52, median: 64, p75: 76, max: 91,
    density: [
      { start: 0,  count: 0  }, { start: 5,  count: 0  }, { start: 10, count: 0  },
      { start: 15, count: 0  }, { start: 20, count: 0  }, { start: 25, count: 0  },
      { start: 30, count: 0  }, { start: 35, count: 0  }, { start: 40, count: 3  },
      { start: 45, count: 7  }, { start: 50, count: 12 }, { start: 55, count: 14 },
      { start: 60, count: 13 }, { start: 65, count: 9  }, { start: 70, count: 6  },
      { start: 75, count: 3  }, { start: 80, count: 1  }, { start: 85, count: 0  },
      { start: 90, count: 0  }, { start: 95, count: 0  },
    ],
  },
  {
    fleet: 'A320', seat: 'FO', base: 'ORD', activeCount: 198,
    plugPercentile: 2, plugSenNum: 4820, p25: 12, median: 26, p75: 44, max: 58,
    density: [
      { start: 0,  count: 8  }, { start: 5,  count: 16 }, { start: 10, count: 24 },
      { start: 15, count: 28 }, { start: 20, count: 26 }, { start: 25, count: 22 },
      { start: 30, count: 18 }, { start: 35, count: 14 }, { start: 40, count: 10 },
      { start: 45, count: 7  }, { start: 50, count: 4  }, { start: 55, count: 3  },
      { start: 60, count: 0  }, { start: 65, count: 0  }, { start: 70, count: 0  },
      { start: 75, count: 0  }, { start: 80, count: 0  }, { start: 85, count: 0  },
      { start: 90, count: 0  }, { start: 95, count: 0  },
    ],
  },
  {
    fleet: 'A320', seat: 'CA', base: 'ORD', activeCount: 94,
    plugPercentile: 46, plugSenNum: 2700, p25: 55, median: 67, p75: 79, max: 92,
    density: [
      { start: 0,  count: 0  }, { start: 5,  count: 0  }, { start: 10, count: 0  },
      { start: 15, count: 0  }, { start: 20, count: 0  }, { start: 25, count: 0  },
      { start: 30, count: 0  }, { start: 35, count: 0  }, { start: 40, count: 0  },
      { start: 45, count: 4  }, { start: 50, count: 10 }, { start: 55, count: 16 },
      { start: 60, count: 18 }, { start: 65, count: 14 }, { start: 70, count: 10 },
      { start: 75, count: 6  }, { start: 80, count: 3  }, { start: 85, count: 1  },
      { start: 90, count: 0  }, { start: 95, count: 0  },
    ],
  },
]

const DEMO_CURRENT_PCT = 35
const demoProjection = useState('landing-demo-projection', () => false)
const demoProjectionYears = useState('landing-demo-projection-years', () => 5)

const demoQualScales = computed<QualDemographicScale[]>(() => {
  const years = demoProjection.value ? demoProjectionYears.value : 0
  const projectedPct = Math.min(99, DEMO_CURRENT_PCT + years * 3.2)
  return BASE_QUAL_SCALES.map(scale => ({
    ...scale,
    userPercentile: projectedPct,
    currentUserPercentile: DEMO_CURRENT_PCT,
    isHoldable: projectedPct >= scale.plugPercentile,
  }))
})


type DemoQual = 'all' | 'fo' | 'ca'
const demoQual = useState<DemoQual>('landing-demo-qual', () => 'all')

const demoAgeData: Record<DemoQual, { label: string; count: number }[]> = {
  all: [
    { label: '25–30', count: 187 },
    { label: '30–35', count: 423 },
    { label: '35–40', count: 612 },
    { label: '40–45', count: 748 },
    { label: '45–50', count: 831 },
    { label: '50–55', count: 796 },
    { label: '55–60', count: 724 },
    { label: '60–65', count: 571 },
  ],
  fo: [
    { label: '25–30', count: 165 },
    { label: '30–35', count: 380 },
    { label: '35–40', count: 520 },
    { label: '40–45', count: 610 },
    { label: '45–50', count: 540 },
    { label: '50–55', count: 380 },
    { label: '55–60', count: 280 },
    { label: '60–65', count: 125 },
  ],
  ca: [
    { label: '25–30', count: 22  },
    { label: '30–35', count: 43  },
    { label: '35–40', count: 92  },
    { label: '40–45', count: 138 },
    { label: '45–50', count: 291 },
    { label: '50–55', count: 416 },
    { label: '55–60', count: 444 },
    { label: '60–65', count: 446 },
  ],
}

const demoWaveData: Record<DemoQual, { year: number; count: number; isWave: boolean }[]> = {
  all: [
    { year: 2026, count: 95,  isWave: false },
    { year: 2027, count: 112, isWave: false },
    { year: 2028, count: 143, isWave: true  },
    { year: 2029, count: 178, isWave: true  },
    { year: 2030, count: 194, isWave: true  },
    { year: 2031, count: 185, isWave: true  },
    { year: 2032, count: 168, isWave: true  },
    { year: 2033, count: 142, isWave: true  },
    { year: 2034, count: 118, isWave: false },
    { year: 2035, count: 98,  isWave: false },
    { year: 2036, count: 84,  isWave: false },
    { year: 2037, count: 71,  isWave: false },
    { year: 2038, count: 63,  isWave: false },
    { year: 2039, count: 58,  isWave: false },
    { year: 2040, count: 52,  isWave: false },
    { year: 2041, count: 48,  isWave: false },
    { year: 2042, count: 44,  isWave: false },
    { year: 2043, count: 41,  isWave: false },
    { year: 2044, count: 38,  isWave: false },
  ],
  fo: [
    { year: 2026, count: 52,  isWave: false },
    { year: 2027, count: 61,  isWave: false },
    { year: 2028, count: 78,  isWave: true  },
    { year: 2029, count: 95,  isWave: true  },
    { year: 2030, count: 104, isWave: true  },
    { year: 2031, count: 98,  isWave: true  },
    { year: 2032, count: 87,  isWave: true  },
    { year: 2033, count: 71,  isWave: true  },
    { year: 2034, count: 58,  isWave: false },
    { year: 2035, count: 46,  isWave: false },
    { year: 2036, count: 38,  isWave: false },
    { year: 2037, count: 32,  isWave: false },
  ],
  ca: [
    { year: 2026, count: 43,  isWave: true  },
    { year: 2027, count: 51,  isWave: true  },
    { year: 2028, count: 65,  isWave: true  },
    { year: 2029, count: 83,  isWave: true  },
    { year: 2030, count: 90,  isWave: true  },
    { year: 2031, count: 87,  isWave: true  },
    { year: 2032, count: 81,  isWave: true  },
    { year: 2033, count: 71,  isWave: true  },
    { year: 2034, count: 60,  isWave: false },
    { year: 2035, count: 52,  isWave: false },
    { year: 2036, count: 46,  isWave: false },
    { year: 2037, count: 39,  isWave: false },
  ],
}

const demoQualOptions: { key: DemoQual; label: string }[] = [
  { key: 'all', label: 'All Pilots' },
  { key: 'fo',  label: 'FO' },
  { key: 'ca',  label: 'CA' },
]

const demoAgeBuckets = computed(() => demoAgeData[demoQual.value])
const demoWaveBuckets = computed(() => demoWaveData[demoQual.value])

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
    <section class="py-24 sm:py-32 bg-(--ui-bg)">
      <UContainer>
        <div class="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto">
          <UIcon name="i-lucide-plane" class="size-12 text-primary" />

          <div>
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Check your seniority position.
            </h1>
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-muted">
              Use your list.
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
            <span class="text-(--ui-border)" aria-hidden="true">·</span>
            <span>No account needed</span>
            <span class="text-(--ui-border)" aria-hidden="true">·</span>
            <span>Works offline</span>
            <span class="text-(--ui-border)" aria-hidden="true">·</span>
            <a href="https://github.com/TarmacDenter/SeniorityGuru" target="_blank" class="text-primary hover:underline inline-flex items-center gap-1">
              Open source
              <UIcon name="i-lucide-github" class="size-3.5" />
            </a>
          </div>

          <!-- Stat strip -->
        </div>
      </UContainer>
    </section>

    <!-- ── Section 2: Upload an Airline Seniority List ───────────────────── -->
    <section class="py-16 sm:py-20 bg-(--ui-bg-elevated)">
      <UContainer>
        <!-- Open-source banner -->
        <div class="text-center mb-12">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <UIcon name="i-lucide-github" class="size-4" />
            Open source
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Upload an airline seniority list
          </h2>
          <p class="text-muted max-w-xl mx-auto">
            Use the Delta format or a standard CSV or Excel file. The project is open source, and additional airline formats can be added.
          </p>
        </div>

        <!-- Airline Import Plugin cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto mb-10">
          <UCard>
            <div class="flex flex-col gap-3">
              <div class="flex items-center gap-3">
                <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <UIcon name="i-lucide-graduation-cap" class="size-5 text-primary" />
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
                <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <UIcon name="i-lucide-file-spreadsheet" class="size-5 text-primary" />
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
            <UButton
              label="Required Data Format"
              color="neutral"
              variant="subtle"
              trailing-icon="i-lucide-chevron-down"
              block
            />
            <template #content>
              <UCard variant="subtle">
                <div class="space-y-4">
                  <p class="text-sm text-muted">
                    Your spreadsheet needs these columns (names are flexible — you can map them during upload):
                  </p>
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm border-collapse">
                      <thead>
                        <tr class="border-b border-(--ui-border)">
                          <th class="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wide text-muted">Sen. #</th>
                          <th class="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wide text-muted">Emp. #</th>
                          <th class="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wide text-muted">Seat</th>
                          <th class="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wide text-muted">Base</th>
                          <th class="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wide text-muted">Fleet</th>
                          <th class="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wide text-muted">Hire Date</th>
                          <th class="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wide text-muted">Retire Date</th>
                        </tr>
                      </thead>
                      <tbody class="font-mono text-xs">
                        <tr class="border-b border-(--ui-border)/50">
                          <td class="py-2 px-3">1</td>
                          <td class="py-2 px-3">90142</td>
                          <td class="py-2 px-3">CA</td>
                          <td class="py-2 px-3">ATL</td>
                          <td class="py-2 px-3">B777</td>
                          <td class="py-2 px-3">1988-06-15</td>
                          <td class="py-2 px-3">2028-03-01</td>
                        </tr>
                        <tr class="border-b border-(--ui-border)/50">
                          <td class="py-2 px-3">2</td>
                          <td class="py-2 px-3">90287</td>
                          <td class="py-2 px-3">FO</td>
                          <td class="py-2 px-3">MSP</td>
                          <td class="py-2 px-3">A320</td>
                          <td class="py-2 px-3">1990-01-22</td>
                          <td class="py-2 px-3">2030-07-14</td>
                        </tr>
                        <tr>
                          <td class="py-2 px-3">3</td>
                          <td class="py-2 px-3">90415</td>
                          <td class="py-2 px-3">CA</td>
                          <td class="py-2 px-3">LAX</td>
                          <td class="py-2 px-3">B737</td>
                          <td class="py-2 px-3">1992-09-03</td>
                          <td class="py-2 px-3">2032-11-20</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p class="text-xs text-muted">
                    All data shown is fabricated for illustration purposes. <strong>Name</strong> is optional.
                  </p>
                  <NuxtLink
                    to="/how-it-works#data-compatibility"
                    class="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
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
              target="_blank"
              color="primary"
              variant="outline"
              icon="i-lucide-github"
            >
              Request an Import Plugin
            </UButton>
            <UButton
              :to="parserRequestMailto"
              color="neutral"
              variant="outline"
              icon="i-lucide-mail"
            >
              Email Me
            </UButton>
          </div>
          <p class="text-xs text-muted">
            Developers: read the
            <a
              href="https://github.com/TarmacDenter/SeniorityGuru/blob/main/CONTRIBUTING.md"
              target="_blank"
              class="text-primary hover:underline"
            >contributor guide</a>
            to add an Import Plugin for your airline.
          </p>
        </div>
      </UContainer>
    </section>

    <!-- ── Section 3: Trajectory Demo ───────────────────────────────────── -->
    <section id="demo" class="py-16 sm:py-20 bg-(--ui-bg-elevated)">
      <UContainer>
        <div class="text-center mb-10">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Your position by qualification
          </h2>
          <p class="text-muted max-w-xl mx-auto">
            Compare company-wide rank with position within each qualification.
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

    <!-- ── Section 3: How It Works ───────────────────────────────────────── -->
    <section class="py-16 sm:py-20 bg-(--ui-bg)">
      <UContainer>
        <div class="text-center mb-12">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight">
            Use the dashboard in three steps
          </h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div
            v-for="(step, index) in howItWorksSteps"
            :key="step.title"
            class="flex flex-col items-center text-center gap-4"
          >
            <div class="relative">
              <div class="size-14 rounded-full bg-primary/10 flex items-center justify-center">
                <UIcon :name="step.icon" class="size-7 text-primary" />
              </div>
              <span class="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                {{ index + 1 }}
              </span>
            </div>
            <div>
              <h3 class="font-semibold text-base mb-1">{{ step.title }}</h3>
              <p class="text-sm text-muted">{{ step.description }}</p>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- ── Section 4: New Hire ───────────────────────────────────────────── -->
    <section class="py-16 sm:py-20 bg-(--ui-bg-elevated)">
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
              If your employee number is not on the list, choose your base, seat, fleet, and birth date to estimate your starting position and how retirements may change it.
            </p>
          </div>

          <!-- Mockup card -->
          <UCard class="max-w-sm mx-auto lg:mx-0 w-full">
            <template #header>
              <div class="flex items-center justify-between">
                <span class="font-semibold">My Status</span>
                <UBadge color="primary" variant="subtle" size="sm">New Hire</UBadge>
              </div>
            </template>

            <div class="space-y-4 py-1">
              <div>
                <div class="text-xs text-muted mb-1">Seniority #</div>
                <div class="font-mono text-xl font-bold">4892</div>
              </div>
              <div>
                <div class="text-xs text-muted mb-1">Rank</div>
                <div class="font-mono text-xl font-bold">4,892 <span class="text-sm font-normal text-muted">/ 4,892 pilots</span></div>
              </div>
              <div>
                <div class="text-xs text-muted mb-1">Company-wide percentile</div>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-trending-up" class="size-4 text-success" />
                  <span class="font-mono text-xl font-bold">0th</span>
                  <span class="text-sm text-muted">percentile</span>
                </div>
              </div>
              <div>
                <div class="text-xs text-muted mb-1">Hire date</div>
                <div class="font-mono text-sm">Jan 15, 2026</div>
              </div>
              <div class="border-t border-(--ui-border) pt-3">
                <div class="text-xs text-muted mb-1">Projection</div>
                <div class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-clock" class="size-4 text-primary" />
                  <span class="text-sm">
                    In 5 years: ~182 pilots above you retire → <span class="font-semibold font-mono">8.4th percentile</span>
                  </span>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </UContainer>
    </section>

    <!-- ── Section 5: Comparison Demo ───────────────────────────────────── -->
    <section class="py-16 sm:py-20 bg-(--ui-bg)">
      <UContainer>
        <div class="text-center mb-10">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Compare lists over time
          </h2>
          <p class="text-muted max-w-xl mx-auto">
            Upload a second list to identify retirements, departures, qualification changes, and new hires.
          </p>
        </div>

        <div class="max-w-3xl mx-auto">
          <DemoComparisonDemo />
        </div>
      </UContainer>
    </section>

    <!-- ── Section 5b: Analytics Demo ────────────────────────────────────── -->
    <section class="py-16 sm:py-20 bg-(--ui-bg-elevated)">
      <UContainer>
        <div class="text-center mb-8">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Review retirement timing
          </h2>
          <p class="text-muted max-w-xl mx-auto">
            Select a seat category to compare the yearly counts.
          </p>
        </div>

        <!-- Qual toggle -->
        <div class="flex justify-center mb-8">
          <div class="flex rounded-lg border border-(--ui-border) overflow-hidden text-sm font-medium">
            <button
              v-for="opt in demoQualOptions"
              :key="opt.key"
              class="px-4 py-1.5 transition-colors"
              :class="demoQual === opt.key
                ? 'bg-primary text-white'
                : 'text-muted hover:bg-(--ui-bg)'"
              @click="demoQual = opt.key"
            >
              {{ opt.label }}
            </button>
          </div>
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
              <AnalyticsAgeDistributionChart :buckets="demoAgeBuckets" :null-count="0" />
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
              <AnalyticsRetirementWaveChart
                :wave-buckets="demoWaveBuckets"
                :trajectory-points="[]"
                selected-qual=""
              />
            </div>
          </UCard>
        </div>

        <!-- Qual Position Scale — full width -->
        <div class="max-w-5xl mx-auto">
          <UCard>
            <template #header>
              <div class="flex items-center gap-4 flex-wrap">
                <h3 class="font-semibold text-sm">Position by qualification</h3>
                <div class="flex items-center gap-3 ml-auto flex-wrap">
                  <div class="flex items-center gap-2">
                    <USwitch v-model="demoProjection" size="sm" />
                    <span class="text-sm text-muted">Project forward</span>
                  </div>
                  <template v-if="demoProjection">
                    <USlider v-model="demoProjectionYears" :min="1" :max="20" :step="1" class="w-32" />
                    <UBadge color="neutral" variant="subtle" size="sm" class="font-mono shrink-0">
                      +{{ demoProjectionYears }}yr{{ demoProjectionYears === 1 ? '' : 's' }}
                    </UBadge>
                  </template>
                  <UBadge v-else color="neutral" variant="subtle" size="sm">Today</UBadge>
                </div>
              </div>
            </template>
            <div class="space-y-3">
              <p class="text-sm text-muted">
                Each row compares your seniority number with the selected qualification range.
              </p>
              <AnalyticsQualSeniorityScale :scales="demoQualScales" />
            </div>
          </UCard>
        </div>
      </UContainer>
    </section>

    <!-- ── Section 6: Data Ownership ────────────────────────────────────── -->
    <section class="py-16 sm:py-20 bg-(--ui-bg)">
      <UContainer>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div
            v-for="item in dataOwnershipItems"
            :key="item.title"
            class="flex gap-4"
          >
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
    <section class="py-16 sm:py-20 bg-(--ui-bg)">
      <UContainer>
        <div class="text-center mb-12">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight">
            Review your seniority data
          </h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <UCard
            v-for="feature in featureCards"
            :key="feature.title"
          >
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
    <section class="py-20 sm:py-28 bg-(--ui-bg-elevated) text-center">
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
      <div
        v-if="demoEntering"
        class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-(--ui-bg)/90 backdrop-blur-sm"
        aria-live="polite"
        aria-label="Setting up your demo"
      >
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
