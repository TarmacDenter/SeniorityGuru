export default defineAppConfig({
  ui: {
    colors: {
      primary: 'amber',
      secondary: 'cyan',
      neutral: 'slate'
    },
    card: {
      defaultVariants: {
        variant: 'subtle' as const
      }
    }
  }
})
