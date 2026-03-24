export function isStandaloneMode(): boolean {
  if (!import.meta.client) return false
  return window.matchMedia('(display-mode: standalone)').matches
    || 'standalone' in navigator && (navigator as Navigator & { standalone: boolean }).standalone
}
