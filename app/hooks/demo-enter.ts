import type { NuxtApp } from '#app'
import { defineHook } from '~/utils/hooks'
import { parseDemoCSV, DEMO_EMPLOYEE_NUMBER } from '~/utils/demo-parser'
import { demoDataCSV, demoDataV2CSV } from '~/utils/demo-assets'
import { useSeniorityStore } from '~/stores/seniority'
import { useUserStore } from '~/stores/user'

/** Parses both demo CSVs, writes them to Dexie, sets the demo employee, navigates to dashboard. */
export default function registerDemoEnterHook(nuxtApp: NuxtApp) {
  defineHook('app:demo:enter', async () => {
    const seniorityStore = useSeniorityStore()
    const userStore = useUserStore()

    const baseEntries = parseDemoCSV(demoDataCSV)
    const variantEntries = parseDemoCSV(demoDataV2CSV)

    await seniorityStore.addList(
      { title: 'Demo — Base List', effectiveDate: '2025-01-01', isDemo: true },
      baseEntries,
    )
    await seniorityStore.addList(
      { title: 'Demo — Current List', effectiveDate: '2025-04-01', isDemo: true },
      variantEntries,
    )

    await userStore.savePreference('employeeNumber', DEMO_EMPLOYEE_NUMBER)

    await navigateTo('/dashboard')
  }, nuxtApp)
}
