export default defineAppConfig({
  ui: {
    colors: {
      // Brand
      primary: 'sky',
      secondary: 'indigo',
      neutral: 'slate',
      // UI state — distinct from retirement timeline colors
      success: 'emerald',
      info: 'blue',
      warning: 'amber',
      error: 'rose',
      // Retirement timeline proximity
      past: 'red',
      imminent: 'orange',
      soon: 'yellow'
    },
    card: {
      defaultVariants: {
        variant: 'subtle' as const
      },
    }
  }
})
