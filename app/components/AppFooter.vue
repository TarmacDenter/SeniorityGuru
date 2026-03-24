<template>
  <footer class="border-t border-(--ui-border) bg-(--ui-bg)">
    <UContainer class="py-6">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
        <span>© {{ new Date().getFullYear() }} SeniorityGuru</span>
        <nav class="flex flex-wrap justify-center gap-x-5 gap-y-1">
          <ULink to="/how-it-works" class="hover:text-default transition-colors">How It Works</ULink>
          <ULink to="/privacy" class="hover:text-default transition-colors">Privacy</ULink>
          <ULink to="/terms" class="hover:text-default transition-colors">Terms</ULink>
        </nav>
      </div>
    </UContainer>
  </footer>
</template>
