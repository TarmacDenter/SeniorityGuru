/**
 * Returns a ref that is false until after the component's first paint.
 * Use to gate expensive computed access so skeletons render before
 * synchronous computations block the main thread.
 */
export function useDeferredReady() {
  const ready = ref(false)
  onMounted(() => {
    // setTimeout(0) is a macrotask — runs after the browser paints the skeleton.
    // nextTick (microtask) runs before paint, so the skeleton never actually shows.
    setTimeout(() => { ready.value = true }, 0)
  })
  return ready
}
