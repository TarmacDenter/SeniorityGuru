import type { NavigationMenuItem } from '@nuxt/ui'

export function useSeniorityNav(): NavigationMenuItem[] {
  return [
    { label: 'Dashboard',      icon: 'i-lucide-layout-dashboard', to: '/' },
    { label: 'Seniority List', icon: 'i-lucide-list-ordered',     to: '/seniority' },
    { label: 'Upload',         icon: 'i-lucide-upload',           to: '/seniority/upload' },
    { label: 'Settings',       icon: 'i-lucide-settings',         to: '/settings' },
  ]
}
