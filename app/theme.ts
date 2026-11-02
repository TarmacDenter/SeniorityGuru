export const appTheme = {
  card: {
    root: 'backdrop-blur-sm'
  },
  // The header, the view tabs and the scenario strip share one raised sheet (bg-elevated) over the
  // page, divided by hairline rules.
  dashboardNavbar: {
    root: 'relative z-20 bg-elevated short:h-11 short:px-4'
  },
  // Ruler slider: tick marks along the track and a highlighter thumb.
  slider: {
    track: 'h-3 rounded-none overflow-visible bg-accented bg-[repeating-linear-gradient(to_right,var(--ui-text-dimmed)_0,var(--ui-text-dimmed)_1px,transparent_1px,transparent_8px)]',
    range: 'rounded-none bg-primary/20',
    thumb: 'h-6 w-3 rounded-sm bg-mark ring-2 ring-primary shadow-sm'
  },
  // On/Off switch: square-cornered ink toggle. The On/Off word is rendered by AppSwitch.
  switch: {
    base: 'rounded-sm border border-accented data-[state=unchecked]:bg-(color:--ui-bg-track) data-[state=checked]:bg-primary',
    thumb: 'rounded-xs bg-default shadow-none'
  },
  dashboardSidebar: {
    root: 'bg-muted/60 backdrop-blur-md'
  }
} as const
