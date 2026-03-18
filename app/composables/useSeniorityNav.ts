import type { NavigationMenuItem } from '@nuxt/ui'
import { useUserStore } from '~/stores/user'

export function useSeniorityNav(): ComputedRef<NavigationMenuItem[]> {
  const userStore = useUserStore()

  return computed(() => {
    const items: NavigationMenuItem[] = [
      { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/dashboard' },
      { label: 'My Lists', icon: 'i-lucide-list', to: '/seniority/lists' },
      { label: 'Upload', icon: 'i-lucide-upload', to: '/seniority/upload' },
      { label: 'Compare', icon: 'i-lucide-git-compare-arrows', to: '/seniority/compare' },
      { label: 'Settings', icon: 'i-lucide-settings', to: '/settings' },
    ]
    if (userStore.isAdmin) {
      items.push({ label: 'Admin', icon: 'i-lucide-shield', to: '/admin/users' })
    }
    return items
  })
}
