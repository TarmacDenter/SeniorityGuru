/**
 * Global UTheme component slot overrides.
 *
 * Controls default classes applied to EVERY instance of a NuxtUI component
 * app-wide — the same as passing a `:ui` prop to every individual component.
 *
 * Change a value here → it affects every matching component globally.
 * Individual component `:ui` props will still override these.
 *
 * @see app/app.vue — consumed by <UTheme :ui="appTheme">
 * @see app.config.ts — color palette mappings (separate concern)
 */
export const appTheme = {
  card: {
    root: 'backdrop-blur-sm'
  },
  dashboardSidebar: {
    root: 'bg-muted/60 backdrop-blur-md'
  }
} as const
