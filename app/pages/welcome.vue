<template>
  <div>
    <!-- Hero -->
    <section class="py-24 sm:py-32 text-center">
      <UContainer>
        <div class="flex justify-center mb-6">
          <UIcon name="i-lucide-plane" class="size-16 text-primary" />
        </div>
        <h1 class="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          SeniorityGuru
        </h1>
        <p class="text-lg sm:text-xl text-(--ui-text-muted) max-w-2xl mx-auto mb-8">
          Track your airline seniority standing, project your trajectory, and plan your career moves — all in one place.
        </p>
        <div class="flex justify-center gap-3">
          <UButton to="/auth/login" size="xl" icon="i-lucide-log-in">
            Sign In
          </UButton>
        </div>
      </UContainer>
    </section>

    <!-- Features -->
    <section class="py-16 bg-(--ui-bg-elevated)">
      <UContainer>
        <h2 class="text-2xl font-bold text-center mb-12">Built for airline pilots</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <UCard v-for="feature in features" :key="feature.title">
            <div class="flex flex-col items-center text-center gap-3 py-2">
              <UIcon :name="feature.icon" class="size-10 text-primary" />
              <h3 class="font-semibold text-lg">{{ feature.title }}</h3>
              <p class="text-sm text-(--ui-text-muted)">{{ feature.description }}</p>
            </div>
          </UCard>
        </div>
      </UContainer>
    </section>

    <!-- CTA -->
    <section class="py-16 text-center">
      <UContainer>
        <h2 class="text-2xl font-bold mb-4">Ready to track your seniority?</h2>
        <p class="text-(--ui-text-muted) mb-6">
          Sign in to upload your seniority list and start exploring.
        </p>
        <UButton to="/auth/login" size="lg">
          Get Started
        </UButton>
      </UContainer>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const features = [
  {
    icon: 'i-lucide-list-ordered',
    title: 'Seniority Tracking',
    description: 'Upload your seniority list and see your position, rank by base, and standing across the airline.',
  },
  {
    icon: 'i-lucide-trending-up',
    title: 'Trajectory Projections',
    description: 'See how your seniority number improves over time as senior pilots retire.',
  },
  {
    icon: 'i-lucide-git-compare-arrows',
    title: 'List Comparison',
    description: 'Compare two seniority lists side by side — retirements, departures, new hires, and qual moves.',
  },
  {
    icon: 'i-lucide-calendar-clock',
    title: 'Retirement Forecasting',
    description: 'Project upcoming retirements and see how they affect your position by base and seat.',
  },
  {
    icon: 'i-lucide-bar-chart-3',
    title: 'Dashboard Analytics',
    description: 'At-a-glance stats: your rank, percentile, fleet breakdown, and aggregate airline data.',
  },
  {
    icon: 'i-lucide-upload',
    title: 'Easy Uploads',
    description: 'Drag and drop CSV or Excel files with smart column mapping and inline error correction.',
  },
]
</script>
