import { ref, watch, type Ref } from 'vue'
import { watchDebounced } from '@vueuse/core'

/** How long a dragged control must rest before its value is committed. */
export const SETTLE_MS = 250

/**
 * A live copy of `model` for a control that moves faster than the work it drives (a slider).
 * Bind the control and its readout to the returned ref; `model` takes the value once the control
 * rests, and the copy follows any other change to `model` (a clamp, a reset).
 */
export function useSettledModel<T>(model: Ref<T>, delay = SETTLE_MS): Ref<T> {
  const live = ref(model.value) as Ref<T>
  watch(model, (value) => { live.value = value })
  watchDebounced(live, (value) => { model.value = value }, { debounce: delay })
  return live
}
