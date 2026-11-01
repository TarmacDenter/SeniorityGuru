import type { PresentedQualificationPosition } from '~/utils/seniority'

// Fabricated sample data for the landing page's live examples. Nothing here reads a stored list.

export type DemoSeat = 'all' | 'fo' | 'ca'

const CURRENT_PERCENTILE = 35
const PERCENTILE_GAIN_PER_YEAR = 3.2

const BASE_QUAL_SCALES = [
  {
    fleet: 'E175', seat: 'FO', base: 'DEN', activeCount: 142,
    plugPercentile: 2, plugSenNum: 4780, p25: 18, median: 32, p75: 51, max: 62,
    density: [
      { start: 0, count: 4 }, { start: 5, count: 8 }, { start: 10, count: 14 },
      { start: 15, count: 19 }, { start: 20, count: 22 }, { start: 25, count: 20 },
      { start: 30, count: 16 }, { start: 35, count: 13 }, { start: 40, count: 10 },
      { start: 45, count: 8 }, { start: 50, count: 5 }, { start: 55, count: 2 },
      { start: 60, count: 1 }, { start: 65, count: 0 }, { start: 70, count: 0 },
      { start: 75, count: 0 }, { start: 80, count: 0 }, { start: 85, count: 0 },
      { start: 90, count: 0 }, { start: 95, count: 0 },
    ],
  },
  {
    fleet: 'E175', seat: 'CA', base: 'DEN', activeCount: 68,
    plugPercentile: 41, plugSenNum: 2950, p25: 52, median: 64, p75: 76, max: 91,
    density: [
      { start: 0, count: 0 }, { start: 5, count: 0 }, { start: 10, count: 0 },
      { start: 15, count: 0 }, { start: 20, count: 0 }, { start: 25, count: 0 },
      { start: 30, count: 0 }, { start: 35, count: 0 }, { start: 40, count: 3 },
      { start: 45, count: 7 }, { start: 50, count: 12 }, { start: 55, count: 14 },
      { start: 60, count: 13 }, { start: 65, count: 9 }, { start: 70, count: 6 },
      { start: 75, count: 3 }, { start: 80, count: 1 }, { start: 85, count: 0 },
      { start: 90, count: 0 }, { start: 95, count: 0 },
    ],
  },
  {
    fleet: 'A320', seat: 'FO', base: 'ORD', activeCount: 198,
    plugPercentile: 2, plugSenNum: 4820, p25: 12, median: 26, p75: 44, max: 58,
    density: [
      { start: 0, count: 8 }, { start: 5, count: 16 }, { start: 10, count: 24 },
      { start: 15, count: 28 }, { start: 20, count: 26 }, { start: 25, count: 22 },
      { start: 30, count: 18 }, { start: 35, count: 14 }, { start: 40, count: 10 },
      { start: 45, count: 7 }, { start: 50, count: 4 }, { start: 55, count: 3 },
      { start: 60, count: 0 }, { start: 65, count: 0 }, { start: 70, count: 0 },
      { start: 75, count: 0 }, { start: 80, count: 0 }, { start: 85, count: 0 },
      { start: 90, count: 0 }, { start: 95, count: 0 },
    ],
  },
  {
    fleet: 'A320', seat: 'CA', base: 'ORD', activeCount: 94,
    plugPercentile: 46, plugSenNum: 2700, p25: 55, median: 67, p75: 79, max: 92,
    density: [
      { start: 0, count: 0 }, { start: 5, count: 0 }, { start: 10, count: 0 },
      { start: 15, count: 0 }, { start: 20, count: 0 }, { start: 25, count: 0 },
      { start: 30, count: 0 }, { start: 35, count: 0 }, { start: 40, count: 0 },
      { start: 45, count: 4 }, { start: 50, count: 10 }, { start: 55, count: 16 },
      { start: 60, count: 18 }, { start: 65, count: 14 }, { start: 70, count: 10 },
      { start: 75, count: 6 }, { start: 80, count: 3 }, { start: 85, count: 1 },
      { start: 90, count: 0 }, { start: 95, count: 0 },
    ],
  },
]

const AGE_DATA: Record<DemoSeat, { label: string; count: number }[]> = {
  all: [
    { label: '25–30', count: 187 },
    { label: '30–35', count: 423 },
    { label: '35–40', count: 612 },
    { label: '40–45', count: 748 },
    { label: '45–50', count: 831 },
    { label: '50–55', count: 796 },
    { label: '55–60', count: 724 },
    { label: '60–65', count: 571 },
  ],
  fo: [
    { label: '25–30', count: 165 },
    { label: '30–35', count: 380 },
    { label: '35–40', count: 520 },
    { label: '40–45', count: 610 },
    { label: '45–50', count: 540 },
    { label: '50–55', count: 380 },
    { label: '55–60', count: 280 },
    { label: '60–65', count: 125 },
  ],
  ca: [
    { label: '25–30', count: 22 },
    { label: '30–35', count: 43 },
    { label: '35–40', count: 92 },
    { label: '40–45', count: 138 },
    { label: '45–50', count: 291 },
    { label: '50–55', count: 416 },
    { label: '55–60', count: 444 },
    { label: '60–65', count: 446 },
  ],
}

const WAVE_DATA: Record<DemoSeat, { year: number; count: number; isWave: boolean }[]> = {
  all: [
    { year: 2026, count: 95, isWave: false },
    { year: 2027, count: 112, isWave: false },
    { year: 2028, count: 143, isWave: true },
    { year: 2029, count: 178, isWave: true },
    { year: 2030, count: 194, isWave: true },
    { year: 2031, count: 185, isWave: true },
    { year: 2032, count: 168, isWave: true },
    { year: 2033, count: 142, isWave: true },
    { year: 2034, count: 118, isWave: false },
    { year: 2035, count: 98, isWave: false },
    { year: 2036, count: 84, isWave: false },
    { year: 2037, count: 71, isWave: false },
    { year: 2038, count: 63, isWave: false },
    { year: 2039, count: 58, isWave: false },
    { year: 2040, count: 52, isWave: false },
    { year: 2041, count: 48, isWave: false },
    { year: 2042, count: 44, isWave: false },
    { year: 2043, count: 41, isWave: false },
    { year: 2044, count: 38, isWave: false },
  ],
  fo: [
    { year: 2026, count: 52, isWave: false },
    { year: 2027, count: 61, isWave: false },
    { year: 2028, count: 78, isWave: true },
    { year: 2029, count: 95, isWave: true },
    { year: 2030, count: 104, isWave: true },
    { year: 2031, count: 98, isWave: true },
    { year: 2032, count: 87, isWave: true },
    { year: 2033, count: 71, isWave: true },
    { year: 2034, count: 58, isWave: false },
    { year: 2035, count: 46, isWave: false },
    { year: 2036, count: 38, isWave: false },
    { year: 2037, count: 32, isWave: false },
  ],
  ca: [
    { year: 2026, count: 43, isWave: true },
    { year: 2027, count: 51, isWave: true },
    { year: 2028, count: 65, isWave: true },
    { year: 2029, count: 83, isWave: true },
    { year: 2030, count: 90, isWave: true },
    { year: 2031, count: 87, isWave: true },
    { year: 2032, count: 81, isWave: true },
    { year: 2033, count: 71, isWave: true },
    { year: 2034, count: 60, isWave: false },
    { year: 2035, count: 52, isWave: false },
    { year: 2036, count: 46, isWave: false },
    { year: 2037, count: 39, isWave: false },
  ],
}

const SEAT_OPTIONS: { label: string; value: DemoSeat }[] = [
  { label: 'All Pilots', value: 'all' },
  { label: 'FO', value: 'fo' },
  { label: 'CA', value: 'ca' },
]

const SAMPLE_FILE_COLUMNS = [
  { accessorKey: 'seniorityNumber', header: 'Seniority Number' },
  { accessorKey: 'employeeNumber', header: 'Employee Number' },
  { accessorKey: 'seat', header: 'Seat' },
  { accessorKey: 'base', header: 'Base' },
  { accessorKey: 'fleet', header: 'Fleet' },
  { accessorKey: 'hireDate', header: 'Hire Date' },
  { accessorKey: 'retireDate', header: 'Retire Date' },
]

const SAMPLE_FILE_ROWS = [
  { seniorityNumber: '1', employeeNumber: '90142', seat: 'CA', base: 'ATL', fleet: 'B777', hireDate: '1988-06-15', retireDate: '2028-03-01' },
  { seniorityNumber: '2', employeeNumber: '90287', seat: 'FO', base: 'MSP', fleet: 'A320', hireDate: '1990-01-22', retireDate: '2030-07-14' },
  { seniorityNumber: '3', employeeNumber: '90415', seat: 'CA', base: 'LAX', fleet: 'B737', hireDate: '1992-09-03', retireDate: '2032-11-20' },
]

export function useLandingDemo() {
  const projection = useState('landing-demo-projection', () => false)
  const projectionYears = useState('landing-demo-projection-years', () => 5)
  const seat = useState<DemoSeat>('landing-demo-qual', () => 'all')

  const qualificationPositions = computed<PresentedQualificationPosition[]>(() => {
    const years = projection.value ? projectionYears.value : 0
    const projectedPercentile = Math.min(99, CURRENT_PERCENTILE + years * PERCENTILE_GAIN_PER_YEAR)
    return BASE_QUAL_SCALES.map(scale => ({
      qualification: { fleet: scale.fleet, seat: scale.seat, base: scale.base },
      activePilotCount: scale.activeCount,
      thresholdPercentile: scale.plugPercentile,
      thresholdSeniorityNumber: scale.plugSenNum,
      percentile25: scale.p25,
      medianPercentile: scale.median,
      percentile75: scale.p75,
      maximumPercentile: scale.max,
      percentileDensity: scale.density.map(bucket => ({
        minimumPercentile: bucket.start,
        maximumPercentile: bucket.start + 5,
        pilotCount: bucket.count,
      })),
      projectedPercentile,
      currentPercentile: CURRENT_PERCENTILE,
      modeledHoldable: projectedPercentile >= scale.plugPercentile,
      // The landing scale shows no Holdable Year; these complete the presented shape.
      qualificationLabel: `${scale.fleet} ${scale.seat} ${scale.base}`,
      holdableYear: null,
      holdableLabel: '',
      thresholdRelationLabel: null,
    }))
  })

  const projectionLabel = computed(() => `+${projectionYears.value} yr${projectionYears.value === 1 ? '' : 's'}`)

  const ageBuckets = computed(() => AGE_DATA[seat.value])
  const waveBuckets = computed(() => WAVE_DATA[seat.value].map(bucket => ({
    year: bucket.year,
    retirementCount: bucket.count,
    isRetirementWave: bucket.isWave,
  })))

  return {
    projection,
    projectionYears,
    projectionLabel,
    qualificationPositions,
    seat,
    seatOptions: SEAT_OPTIONS,
    ageBuckets,
    waveBuckets,
    sampleFileColumns: SAMPLE_FILE_COLUMNS,
    sampleFileRows: SAMPLE_FILE_ROWS,
  }
}
