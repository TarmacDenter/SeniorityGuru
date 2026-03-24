const dateFields = new Set(['hire_date', 'retire_date'])

function humanizeField(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/^./, c => c.toUpperCase())
}

export function formatRowError(raw: string): string {
  const colonIdx = raw.indexOf(': ')
  if (colonIdx === -1) return raw

  const field = raw.slice(0, colonIdx)
  const message = raw.slice(colonIdx + 2)
  const label = humanizeField(field)

  // "String must contain at least 1 character(s)" → "X is required"
  if (message.includes('must contain at least 1 character')) {
    return `${label} is required`
  }

  // Date fields with "Invalid" → format hint
  if (dateFields.has(field) && message.toLowerCase().startsWith('invalid')) {
    return `${label} must be in YYYY-MM-DD format`
  }

  // "Number must be greater than 0" → "X must be greater than 0"
  if (message.startsWith('Number ')) {
    return `${label} ${message.slice(7)}`
  }

  // Default: humanized field + original message
  return `${label}: ${message}`
}
