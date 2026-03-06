import type { NavigationMenuItem } from '@nuxt/ui'

export function useSeniorityNav(): NavigationMenuItem[] {
  return [
    { label: 'Dashboard',      icon: 'i-lucide-layout-dashboard', to: '/' },
    { label: 'Upload',         icon: 'i-lucide-upload',           to: '/seniority/upload' },
  ]
}
