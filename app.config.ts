export default defineAppConfig({
  ui: {
    colors: {
      primary: 'amber',
      secondary: 'cyan',
      neutral: 'slate',
      past: 'red',
      imminent: 'orange',
      soon: 'yellow'
    },
    card: {
      defaultVariants: {
        variant: 'subtle' as const
      }
    }
  }
})
