import type { PreParser, PreParserResult } from './types';
import { detectDateFormat, detectFutureDateFormat, normalizeDate, normalizeDateFuture } from '~/utils/date';
import { createLogger } from '~/utils/logger';

const log = createLogger('parser:jetblue');

// ── Header detection ─────────────────────────────────────────────────────

const HEADER_ALIASES: Record<string, string[]> = {
  seniority: ['SEN', 'SENIORITY', 'SEN_NO'],
  employee: ['CMID', 'CREW_ID', 'EMP_ID'],
  name: ['NAME', 'PILOT_NAME'],
  base: ['BASE', 'DOMICILE'],
  fleet: ['FLEET', 'EQUIP'],
  seat: ['SEAT', 'POS'],
  hireDate: ['HIREDATE', 'HIRE_DATE', 'DOH'],
  retireDate: ['RTRDATE', 'RTR_DATE', 'RETIRE_DATE', 'RET_DATE'],
  yrs2rtr: ['YRS2RTR', 'YRS_TO_RTR'],
};

function matchesAlias(header: string, field: keyof typeof HEADER_ALIASES): boolean {
  return HEADER_ALIASES[field]!.some(
    alias => header.toUpperCase() === alias,
  );
}

function findHeaderRow(raw: string[][]): number {
  return raw.findIndex(row =>
    row.some(cell => matchesAlias(String(cell).trim(), 'seniority'))
    && row.some(cell => matchesAlias(String(cell).trim(), 'employee')),
  );
}

// ── Standard header mapping ──────────────────────────────────────────────

const STANDARD_NAMES: Record<string, string> = {
  SEN: 'Seniority Number',
  SENIORITY: 'Seniority Number',
  SEN_NO: 'Seniority Number',
  CMID: 'Employee Number',
  CREW_ID: 'Employee Number',
  EMP_ID: 'Employee Number',
  NAME: 'Name',
  PILOT_NAME: 'Name',
  BASE: 'Base',
  DOMICILE: 'Base',
  FLEET: 'Fleet',
  EQUIP: 'Fleet',
  SEAT: 'Seat',
  POS: 'Seat',
  HIREDATE: 'Hire Date',
  HIRE_DATE: 'Hire Date',
  DOH: 'Hire Date',
  RTRDATE: 'Retire Date',
  RTR_DATE: 'Retire Date',
  RETIRE_DATE: 'Retire Date',
  RET_DATE: 'Retire Date',
};

// Columns to drop from output
const DROP_COLUMNS = new Set(['YRS2RTR', 'YRS_TO_RTR']);

// ── Parser implementation ────────────────────────────────────────────────

export const jetblueParser: PreParser = {
  id: 'jetblue',
  label: 'JetBlue Airways',
  description: 'JetBlue ALPA seniority list with CMID and M/D/YYYY dates.',
  icon: 'i-lucide-plane',
  formatDescription:
    'Expects a JetBlue Airways ALPA seniority list export. Columns: SEN, CMID, NAME, '
    + 'BASE, FLEET, SEAT, HIREDATE, RTRDATE. Dates in M/D/YY(YY) format are converted '
    + 'automatically. The YRS2RTR column is dropped.',

  parse(raw: string[][]): PreParserResult {
    log.info('Starting parse', { totalRows: raw.length });

    const headerIdx = findHeaderRow(raw);

    if (headerIdx === -1) {
      log.warn('Header row not found — falling back to raw passthrough', {
        firstRow: raw[0]?.slice(0, 5),
      });
      return { rows: raw, metadata: { effectiveDate: null, title: null } };
    }

    log.debug('Header found', { headerIdx, headerRow: raw[headerIdx] });

    const originalHeaders = raw[headerIdx]!;

    const standardHeaders: string[] = [];
    const sourceIndices: number[] = [];

    for (let i = 0; i < originalHeaders.length; i++) {
      const header = String(originalHeaders[i]).trim().toUpperCase();
      if (DROP_COLUMNS.has(header)) continue;

      const standardName = STANDARD_NAMES[header];
      if (!standardName) {
        log.debug('Unmapped header passed through as-is', { header });
      }
      standardHeaders.push(standardName ?? String(originalHeaders[i]).trim());
      sourceIndices.push(i);
    }

    const hireDateIdx = standardHeaders.indexOf('Hire Date');
    const retireDateIdx = standardHeaders.indexOf('Retire Date');

    const dataRows = raw
      .slice(headerIdx + 1)
      .filter(row => row.some(cell => String(cell).trim() !== ''));

    // Detect date formats from a sample before processing rows.
    // future=true uses a future-biased parser so 2-digit years > 50 map to 20xx
    // instead of 19xx — required for retire date columns where pilots retire in 2050s–2070s.
    function detectColumnFormat(colIdx: number, future = false): ((s: string) => string) {
      const rawIdx = sourceIndices[colIdx]!;
      const samples = dataRows
        .slice(0, 20)
        .map(row => String(row[rawIdx] ?? '').trim())
        .filter(Boolean);
      const detected = future ? detectFutureDateFormat(samples) : detectDateFormat(samples);
      if (detected) {
        log.debug('Date format detected', { column: standardHeaders[colIdx], format: detected.name });
        return (s: string) => detected.parse(s) ?? s;
      }
      log.debug('No single date format detected, using per-cell fallback', { column: standardHeaders[colIdx] });
      return future ? normalizeDateFuture : normalizeDate;
    }

    const parseHireDate = hireDateIdx >= 0 ? detectColumnFormat(hireDateIdx) : null;
    const parseRetireDate = retireDateIdx >= 0 ? detectColumnFormat(retireDateIdx, true) : null;

    let dateNormalizationFailures = 0;

    const transformedRows = dataRows.map((row) => {
      const mapped = sourceIndices.map(i => String(row[i] ?? ''));

      if (parseHireDate && mapped[hireDateIdx]) {
        const original = mapped[hireDateIdx]!;
        mapped[hireDateIdx] = parseHireDate(original);
        if (mapped[hireDateIdx] === original && !/^\d{4}-\d{2}-\d{2}$/.test(original)) {
          dateNormalizationFailures++;
        }
      }
      if (parseRetireDate && mapped[retireDateIdx]) {
        const original = mapped[retireDateIdx]!;
        mapped[retireDateIdx] = parseRetireDate(original);
        if (mapped[retireDateIdx] === original && !/^\d{4}-\d{2}-\d{2}$/.test(original)) {
          dateNormalizationFailures++;
        }
      }

      return mapped;
    });

    if (dateNormalizationFailures > 0) {
      log.warn('Some dates did not match expected format', {
        failureCount: dateNormalizationFailures,
        hint: 'These will surface as validation errors in the review step',
      });
    }

    log.info('Parse complete', {
      dataRows: transformedRows.length,
      standardColumns: standardHeaders.length,
    });

    return {
      rows: [standardHeaders, ...transformedRows],
      metadata: { effectiveDate: null, title: null },
    };
  },
};
