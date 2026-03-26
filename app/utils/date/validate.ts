export function isValidCalendarDate(y: number, m: number, d: number): boolean {
  if (y < 1900 || y > 2099) return false
  if (m < 1 || m > 12 || d < 1 || d > 31) return false
  const date = new Date(Date.UTC(y, m - 1, d))
  return (
    date.getUTCFullYear() === y
    && date.getUTCMonth() === m - 1
    && date.getUTCDate() === d
  )
}
