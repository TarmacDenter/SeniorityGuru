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
      slots: {
        body: 'p-3 sm:p-6',
        header: 'p-3 sm:px-6',
      },
    },
    tabs: {
      slots: {
        list: 'relative flex p-1 group w-full sm:w-auto',
      },
    },
    dashboardPanel: {
      slots: {
        // Remove overflow-y-auto on mobile so the content area scrolls naturally.
        // Desktop (sm+) keeps the inner scroll well for full-height tab layouts.
        body: 'flex flex-col gap-4 sm:gap-6 flex-1 sm:overflow-y-auto p-4 sm:p-6',
      },
    },
  }
})
