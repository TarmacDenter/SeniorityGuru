import { readFile, writeFile } from 'fs/promises';
import { argv } from 'process';
import { faker } from '@faker-js/faker';

const DESIRED_SIZE = 3000;
const baseSampleSizing = { BOS: 3, JFK: 6, MCO: 1 };
const baseSamples = Object.entries(baseSampleSizing)
  .flatMap(([base, size]) => Array<string>(size).fill(base));

// HELPERS ===============================
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(arr: T[]): T => arr[randInt(0, arr.length - 1)]!;

const fakeName = () => `"${faker.person.lastName().toUpperCase()}, ${faker.person.firstName()}"`;

const makeEmployeeIdPool = (size: number): string[] =>
  shuffle(Array.from({ length: size }, (_, i) => String(1000 + i)));

/** Shift a M/D/YYYY date string by offset days, return same format. */
const shiftDate = (dateStr: string, maxOffsetDays = 365): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const offset = randInt(-maxOffsetDays, maxOffsetDays);
  d.setDate(d.getDate() + offset);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};

const shuffle = <T>(arr: T[]): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i)
      ;[arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
};

// CSV ================================
const parseArgs = () => {
  const fpath = argv[2];
  const outpath = argv[3];
  if (!fpath) throw new Error('Usage: fuzz-data.ts <input.csv> [output.csv]');
  return { fpath, outpath };
};

const readCsv = async (fp: string) => {
  const text = await readFile(fp, { encoding: 'utf-8' });
  const rows = text.split('\n').filter(l => l.trim() !== '');
  return rows.map(r => r.split(','));
};

const toCsv = (rows: string[][]): string =>
  rows.map(r => r.join(',')).join('\n');

// SEAT CURVE =============================
const COHORT_COUNT = 25;

type SeatCurve = { caRatio: number; }[];

/**
 * Sort source rows by SEN, split into COHORT_COUNT equal buckets,
 * compute CA ratio per bucket. Index 0 = most senior cohort.
 */
const buildSeatCurve = (entries: Row[]): SeatCurve => {
  const sorted = [...entries].sort((a, b) => Number(a['SEN']) - Number(b['SEN']));
  const size = Math.ceil(sorted.length / COHORT_COUNT);
  return Array.from({ length: COHORT_COUNT }, (_, i) => {
    const cohort = sorted.slice(i * size, (i + 1) * size);
    const caCount = cohort.filter(r => r['SEAT']?.toUpperCase() === 'CA').length;
    return { caRatio: cohort.length > 0 ? caCount / cohort.length : 0 };
  });
};

const assignSeat = (rank: number, total: number, curve: SeatCurve): string => {
  const idx = Math.min(Math.floor((rank / total) * COHORT_COUNT), COHORT_COUNT - 1);
  return Math.random() < (curve[idx]?.caRatio ?? 0) ? 'CA' : 'FO';
};

// HIRE DATE POOL =========================
const buildHireDatePool = (entries: Row[], targetSize: number): string[] => {
  const dates = entries
    .map(r => r['HIREDATE'] ?? '')
    .filter(d => !isNaN(new Date(d).getTime()))
    .map(d => shiftDate(d, 90));

  // Pad pool by sampling if we need more than we have
  while (dates.length < targetSize) dates.push(pick(dates)!);

  return dates
    .slice(0, targetSize)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
};

// FUZZER =================================
type Row = Record<string, string>;

const fuzzRow = (row: Row, rank: number, total: number, curve: SeatCurve, hireDate: string, employeeId: string): Row => ({
  ...row,
  SEN: String(rank + 1),
  CMID: employeeId,
  NAME: fakeName(),
  BASE: pick(baseSamples),
  SEAT: assignSeat(rank, total, curve),
  HIREDATE: hireDate,
  RTRDATE: shiftDate(row['RTRDATE'] ?? '', 365),
  YRS2RTR: '',
});

const padToSize = (rows: Row[], size: number): Row[] => {
  if (rows.length >= size) return rows.slice(0, size);
  const padded = [...rows];
  while (padded.length < size) padded.push({ ...pick(rows)! });
  return padded;
};

const run = async () => {
  const { fpath, outpath } = parseArgs();
  const raw = await readCsv(fpath);
  const [headerRow, ...dataRows] = raw;
  if (!headerRow) throw new Error('empty file');

  const headers = headerRow.map(h => h.trim());
  const entries: Row[] = dataRows.map(cells =>
    Object.fromEntries(headers.map((h, i) => [h, (cells[i] ?? '').trim()]))
  );

  const curve = buildSeatCurve(entries);
  console.error('seat curve (cohort 0 = most senior):');
  curve.forEach((c, i) => console.error(`  cohort ${String(i).padStart(2)}: ${(c.caRatio * 100).toFixed(1)}% CA`));

  const sized = padToSize(shuffle([...entries]), DESIRED_SIZE);
  const hireDates = buildHireDatePool(entries, sized.length);
  const employeeIds = makeEmployeeIdPool(sized.length);
  const fuzzed = sized.map((row, i) => fuzzRow(row, i, sized.length, curve, hireDates[i]!, employeeIds[i]!));

  const outputHeaders = headers.filter(h => h !== 'YRS2RTR');
  const outputRows = [outputHeaders, ...fuzzed.map(row => outputHeaders.map(h => row[h] ?? ''))];
  const csv = toCsv(outputRows);

  if (outpath) {
    await writeFile(outpath, csv, 'utf-8');
    console.error(`wrote ${fuzzed.length} rows to ${outpath}`);
  } else {
    process.stdout.write(csv + '\n');
  }
};

run().catch(console.error);
