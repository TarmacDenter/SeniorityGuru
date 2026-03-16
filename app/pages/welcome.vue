<template>
  <div>

    <!-- ── Section 1: Hero ───────────────────────────────────────────────── -->
    <section class="py-24 sm:py-32 bg-(--ui-bg)">
      <UContainer>
        <div class="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto">
          <UIcon name="i-lucide-plane" class="size-12 text-primary" />

          <div>
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Seniority is everything.
            </h1>
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-muted">
              Know yours.
            </h1>
          </div>

          <p class="text-lg sm:text-xl text-muted max-w-2xl">
            Upload any airline seniority list, enter your hire date — get instant rank, percentile, and a projection to your retirement. No airline partnership required.
          </p>

          <div class="flex flex-wrap justify-center gap-3">
            <UButton to="/auth/login" size="xl" icon="i-lucide-arrow-right" trailing>
              Request Access
            </UButton>
            <UButton to="#demo" size="xl" variant="ghost" icon="i-lucide-play-circle" trailing>
              See How It Works
            </UButton>
          </div>

          <!-- Stat strip -->
          <div class="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-sm text-muted mt-2">
            <span>Your number</span>
            <span class="text-(--ui-border)" aria-hidden="true">•</span>
            <span>Your trajectory</span>
            <span class="text-(--ui-border)" aria-hidden="true">•</span>
            <span>Your move</span>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- ── Section 2: Trajectory Demo ───────────────────────────────────── -->
    <section id="demo" class="py-16 sm:py-20 bg-(--ui-bg-elevated)">
      <UContainer>
        <div class="text-center mb-10">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Your seniority, projected forward
          </h2>
          <p class="text-muted max-w-xl mx-auto">
            See how your percentile climbs as retirements happen — try the slider.
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
            Get started in three steps
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
              You're the plug. For now.
            </h2>
            <p class="text-muted leading-relaxed">
              Day one, you're last on the list. That's not a problem — it's a starting point. Upload your company's list and see exactly where you stand, and how fast retirements will move you up.
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
            Track what changed since last quarter
          </h2>
          <p class="text-muted max-w-xl mx-auto">
            Upload a new list anytime — SeniorityGuru diffs it against your previous one, highlighting retirements, departures, qual moves, and new hires.
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
        <div class="text-center mb-10">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            The retirement wave is already in the data
          </h2>
          <p class="text-muted max-w-xl mx-auto">
            Your airline's age curve tells you everything about where your number is going — and when.
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <!-- Age Distribution -->
          <UCard>
            <template #header>
              <h3 class="font-semibold text-sm">Age Distribution</h3>
            </template>
            <div class="space-y-3">
              <p class="text-sm text-muted">
                A lot of pilots are about to retire. Here's how the age curve looks — and why your number is moving faster than you think.
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
                The retirement wave is coming. See which years accelerate your climb.
              </p>
              <AnalyticsRetirementWaveChart
                :wave-buckets="demoWaveBuckets"
                :trajectory-points="[]"
                selected-qual=""
              />
            </div>
          </UCard>
        </div>
      </UContainer>
    </section>

    <!-- ── Section 6: Data Ownership ────────────────────────────────────── -->
    <section class="py-16 sm:py-20 bg-(--ui-bg)">
      <UContainer>
        <div class="text-center mb-12">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Your data, never locked in
          </h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
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

    <!-- ── Section 7: Feature Cards ─────────────────────────────────────── -->
    <section class="py-16 sm:py-20 bg-(--ui-bg-elevated)">
      <UContainer>
        <div class="text-center mb-12">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight">
            Everything you need to understand your standing
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

    <!-- ── Section 7b: Coming Soon — The Pilot Wiki ───────────────────────── -->
    <section class="py-16 sm:py-20 bg-(--ui-bg)">
      <UContainer>
        <div class="text-center mb-10">
          <UBadge color="warning" variant="subtle" class="mb-4">Coming Soon</UBadge>
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Coming soon — The Pilot Wiki
          </h2>
          <p class="text-muted max-w-xl mx-auto">
            A shared, anonymous view into career trajectories across hundreds of airlines.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto mb-10">
          <div
            v-for="item in wikiItems"
            :key="item.title"
            class="flex gap-4"
          >
            <div class="shrink-0 size-10 rounded-lg bg-(--ui-bg-elevated) flex items-center justify-center">
              <UIcon :name="item.icon" class="size-5 text-muted" />
            </div>
            <div>
              <h3 class="font-semibold mb-1">{{ item.title }}</h3>
              <p class="text-sm text-muted">{{ item.description }}</p>
            </div>
          </div>
        </div>

        <!-- Teaser stat strip -->
        <div class="flex flex-col items-center gap-4">
          <p class="text-sm text-muted italic">
            47 airlines · 312 lists contributed · See how your trajectory compares →
          </p>
          <UButton disabled variant="outline" icon="i-lucide-bar-chart-2">
            Browse the Wiki
          </UButton>
        </div>
      </UContainer>
    </section>

    <!-- ── Section 8: CTA ────────────────────────────────────────────────── -->
    <section class="py-20 sm:py-28 bg-(--ui-bg-elevated) text-center">
      <UContainer>
        <div class="max-w-xl mx-auto space-y-6">
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight">
            Currently in open beta
          </h2>
          <p class="text-muted">
            Request access to start tracking your seniority today.
          </p>
          <UButton to="/auth/login" size="xl" icon="i-lucide-arrow-right" trailing>
            Request Access
          </UButton>

          <!-- Trust signals -->
          <div class="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted pt-2">
            <span class="flex items-center gap-1.5">
              <UIcon name="i-lucide-shield-check" class="size-4" />
              No airline partnership required
            </span>
            <span class="flex items-center gap-1.5">
              <UIcon name="i-lucide-lock" class="size-4" />
              Your data stays yours
            </span>
          </div>
        </div>
      </UContainer>
    </section>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const howItWorksSteps = [
  {
    icon: 'i-lucide-upload',
    title: 'Upload your list',
    description: 'CSV or Excel, any format. We need Employee #, Hire Date, Base, Seat, and Fleet — column names don\'t matter, we\'ll map them for you.',
  },
  {
    icon: 'i-lucide-user-check',
    title: 'Confirm your entry',
    description: 'Enter your employee number or hire date. We find you automatically.',
  },
  {
    icon: 'i-lucide-trending-up',
    title: 'Explore your trajectory',
    description: 'Instant dashboard: rank, percentile, career-length projections, and retirement forecast.',
  },
]

const dataOwnershipItems = [
  {
    icon: 'i-lucide-lock-open',
    title: 'Bring your own list',
    description: 'No airline partnerships. Upload any exported spreadsheet — CSV or Excel.',
  },
  {
    icon: 'i-lucide-layers',
    title: 'Multi-list history',
    description: 'Upload lists from multiple dates to track changes across quarters.',
  },
  {
    icon: 'i-lucide-briefcase',
    title: 'Career-portable',
    description: 'Track across bases, seats, and fleets as your career evolves.',
  },
]

const featureCards = [
  {
    icon: 'i-lucide-trending-up',
    title: 'Trajectory Projections',
    description: 'Career-length percentile forecast under base, optimistic, and pessimistic retirement scenarios.',
  },
  {
    icon: 'i-lucide-calendar-clock',
    title: 'Retirement Forecasting',
    description: 'See how many pilots senior to you are projected to retire in the next 1, 5, and 10 years.',
  },
  {
    icon: 'i-lucide-map-pin',
    title: 'Position by Base & Seat',
    description: 'Drill into your rank within your base, seat category, and fleet — not just company-wide.',
  },
  {
    icon: 'i-lucide-git-compare-arrows',
    title: 'List Comparison',
    description: 'Diff any two lists: retirements, departures, qual moves, and your rank change at a glance.',
  },
  {
    icon: 'i-lucide-bar-chart-3',
    title: 'Demographics Breakdown',
    description: 'Age distribution, years of service, and cohort data for the whole airline.',
  },
  {
    icon: 'i-lucide-upload',
    title: 'Smart Upload',
    description: 'CSV or Excel, any column order. Auto-detects employee numbers, hire dates, and seat data.',
  },
]

const wikiItems = [
  {
    icon: 'i-lucide-eye-off',
    title: 'Private by default',
    description: 'Your data never leaves your account unless you choose to share it.',
  },
  {
    icon: 'i-lucide-users',
    title: 'Opt-in to contribute',
    description: 'Choose to add your airline\'s trajectory data to the wiki anonymously.',
  },
  {
    icon: 'i-lucide-bar-chart-2',
    title: 'Opt-in to view',
    description: 'Only pilots who contribute can see cross-airline trajectory plots.',
  },
]

// ── Analytics demo data ───────────────────────────────────────────────────────

const demoAgeBuckets = [
  { label: '25–30', count: 187 },
  { label: '30–35', count: 423 },
  { label: '35–40', count: 612 },
  { label: '40–45', count: 748 },
  { label: '45–50', count: 831 },
  { label: '50–55', count: 796 },
  { label: '55–60', count: 724 },
  { label: '60–65', count: 571 },
]

const demoWaveBuckets = [
  { year: 2026, count: 95,  isWave: false },
  { year: 2027, count: 112, isWave: false },
  { year: 2028, count: 143, isWave: true },
  { year: 2029, count: 178, isWave: true },
  { year: 2030, count: 194, isWave: true },
  { year: 2031, count: 185, isWave: true },
  { year: 2032, count: 168, isWave: true },
  { year: 2033, count: 142, isWave: true },
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
]
</script>
