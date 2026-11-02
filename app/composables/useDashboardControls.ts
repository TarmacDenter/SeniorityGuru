import { computed, inject, provide, ref, type ComputedRef, type InjectionKey, type Ref } from 'vue'
import { useMediaQuery } from '@vueuse/core'

/** A phone in portrait is narrow; a phone in landscape is short. Either one folds the controls into a sheet. */
export const COMPACT_VIEWPORT_QUERY = '(max-width: 39.99rem), (max-height: 32rem)'
/** A phone in landscape is short but wide: the sheet is a popover there, a bottom drawer in portrait. */
export const SHORT_VIEWPORT_QUERY = '(max-height: 32rem)'

/**
 * The dashboard shell owns one controls sheet. Views wrap their controls in `DashboardControls`;
 * on a compact screen the shell moves that content into the sheet, elsewhere it stays inline.
 */
export interface DashboardControlsHost {
  /** The screen is compact: controls belong in the sheet. */
  compact: ComputedRef<boolean>
  /** The open sheet's body, or null while it is closed. */
  outlet: Ref<HTMLElement | null>
  /** How many `DashboardControls` are mounted; the shell shows the Controls button when this is above 0. */
  count: Ref<number>
}

export const DASHBOARD_CONTROLS_KEY: InjectionKey<DashboardControlsHost> = Symbol('dashboard-controls')

export function provideDashboardControls(): DashboardControlsHost {
  const isCompact = useMediaQuery(COMPACT_VIEWPORT_QUERY)
  const host: DashboardControlsHost = {
    compact: computed(() => isCompact.value),
    outlet: ref(null),
    count: ref(0),
  }
  provide(DASHBOARD_CONTROLS_KEY, host)
  return host
}

/** The enclosing shell's controls host, or null where there is none (a view mounted on its own). */
export function useDashboardControlsHost(): DashboardControlsHost | null {
  return inject(DASHBOARD_CONTROLS_KEY, null)
}
