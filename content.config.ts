import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    changelog: defineCollection({
      type: 'page',
      source: 'changelog.md',
      schema: z.object({
        latestDate: z.string(),
      }),
    }),
  },
})
