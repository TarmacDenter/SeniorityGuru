<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui/components/Button.vue'

defineOptions({
  inheritAttrs: false
})

const props = defineProps<ButtonProps>()
const attrs = useAttrs()

const buttonProps = computed(() => {
  const {
    icon = 'i-lucide-share',
    size = 'md',
    ...rest
  } = props

  return {
    ...attrs,
    ...rest,
    icon,
    size
  }
})

const shareData: ShareData = {
  title: 'SeniorityGuru',
  url: ''
}


async function handleShare() {
  try {
    await navigator.share(shareData)
  } catch (e: unknown) {
    console.error(e)
    if (e instanceof DOMException && e.name == 'AbortError') {
      return
    }
    useToast().add({
      title: 'Share Sheet not supported.',
      description: 'Just send \'em the link.. thanks though',
      color: 'warning'
    })
  }
}

</script>

<template>
  <UButton v-bind="buttonProps" @click="handleShare">
    <slot />
  </UButton>
</template>
