<template>
  <!-- Render inside <LandingShowcase>: the demo list's Retirement heatmap, with its own landing-page settings. -->
  <div class="space-y-2">
    <DashboardRetirementHeatmap :default-group-by="['base', 'seat']" />
    <p class="text-xs text-muted">Demo list</p>
  </div>
</template>
