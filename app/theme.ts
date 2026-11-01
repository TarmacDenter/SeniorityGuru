export const appTheme = {
  card: {
    root: 'backdrop-blur-sm'
  },
  // Header bar sits above the page like a raised sheet: lighter surface, hairline rule, soft drop shadow.
  dashboardNavbar: {
    root: 'relative z-20 bg-elevated border-b-0 shadow-[0_1px_0_var(--ui-border),0_8px_16px_-10px_rgb(0_0_0/0.45)]'
  },
  dashboardSidebar: {
    root: 'bg-muted/60 backdrop-blur-md'
  }
} as const
