export const appTheme = {
  card: {
    root: 'backdrop-blur-sm'
  },
  // Header bar sits above the page like a raised sheet: lighter surface, hairline rule, soft drop shadow.
  dashboardNavbar: {
    root: 'relative z-20 bg-elevated border-b-0 shadow-[0_1px_0_var(--ui-border),0_8px_16px_-10px_rgb(0_0_0/0.45)]'
  },
  // Ruler slider: tick marks along the track and a highlighter thumb.
  slider: {
    track: 'h-3 rounded-none overflow-visible bg-accented bg-[repeating-linear-gradient(to_right,var(--ui-text-dimmed)_0,var(--ui-text-dimmed)_1px,transparent_1px,transparent_8px)]',
    range: 'rounded-none bg-primary/20',
    thumb: 'h-6 w-3 rounded-sm bg-mark ring-2 ring-primary shadow-sm'
  },
  // On/Off switch: square-cornered ink toggle. The On/Off word is rendered by AppSwitch.
  switch: {
    base: 'rounded-sm border border-default data-[state=unchecked]:bg-accented data-[state=checked]:bg-primary',
    thumb: 'rounded-xs bg-default shadow-none'
  },
  dashboardSidebar: {
    root: 'bg-muted/60 backdrop-blur-md'
  }
} as const
