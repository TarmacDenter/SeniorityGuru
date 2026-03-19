<script setup lang="ts">
const props = defineProps<{
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon?: string;
}>();

const numericTarget = computed(() => {
  const cleaned = props.value.replace(/,/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
});

const animatedNumber = ref(0);
const isAnimating = ref(false);

const displayValue = computed(() => {
  if (!numericTarget.value || !isAnimating.value) return props.value;
  return Math.round(animatedNumber.value).toLocaleString();
});

onMounted(() => {
  if (!numericTarget.value) return;

  isAnimating.value = true;
  const target = numericTarget.value;
  const duration = 800;
  const start = performance.now();

  function tick(now: number) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - (1 - progress) ** 3; // ease-out cubic
    animatedNumber.value = eased * target;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      animatedNumber.value = target;
    }
  }

  requestAnimationFrame(tick);
});
</script>

<template>
  <UCard
:ui="{
    root: 'transition-all duration-200 hover:scale-[1.02] hover:ring-primary/30',
  }">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm text-muted">{{ label }}</p>
        <p class="text-2xl font-bold font-mono text-highlighted mt-1">{{ displayValue }}</p>
        <p v-if="trend" class="text-xs mt-1" :class="trendUp ? 'text-success' : 'text-error'">
          {{ trend }}
        </p>
      </div>
      <UIcon v-if="icon" :name="icon" class="size-8 text-primary" />
    </div>
  </UCard>
</template>
