export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/** Excel epoch: Dec 30, 1899 (serial 1 = Jan 1, 1900, accounting for Lotus 123 leap year bug) */
export const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30)

/** Named-month format strings tried by normalizeDate (strict mode). */
export const NAMED_MONTH_FORMATS = [
  'D MMM YYYY',
  'MMM D, YYYY',
  'MMMM D, YYYY',
  'D MMMM YYYY',
]
