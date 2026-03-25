/**
 * Returns a ref that is false until after the component's first paint.
 * Use to gate expensive computed access so skeletons render before
 * synchronous computations block the main thread.
 */
export function useDeferredReady() {
  const ready = ref(false)
  // Macrotask ensures the browser paints skeletons before expensive computeds evaluate
  onMounted(() => setTimeout(() => { ready.value = true }, 0))
  return ready
}
