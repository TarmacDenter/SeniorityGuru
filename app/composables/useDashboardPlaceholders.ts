export function useDashboardPlaceholders() {
  const stats = [
    { label: 'Seniority Number', value: '1,247', trend: '+12', trendUp: true, icon: 'i-lucide-hash' },
    { label: 'Total Pilots', value: '14,832', trend: '-28', trendUp: false, icon: 'i-lucide-users' },
    { label: 'Retirements This Year', value: '342', trend: '+15%', trendUp: true, icon: 'i-lucide-calendar-clock' },
    { label: 'Percentile', value: '91.6%', trend: '+0.8%', trendUp: true, icon: 'i-lucide-trending-up' }
  ]

  const rankCard = {
    seniorityNumber: 1247,
    base: 'LAX',
    seat: 'CA',
    fleet: 'B737',
    percentile: 91.6,
    hireDate: '2008-03-15'
  }

  const retirementChartData = {
    labels: ['2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035'],
    datasets: [
      {
        label: 'Retirements',
        data: [342, 389, 412, 378, 445, 467, 398, 356, 421, 390],
        backgroundColor: 'rgba(245, 158, 11, 0.6)',
        borderColor: '#f59e0b',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  }

  const baseSeatData = [
    { base: 'LAX', seat: 'CA', rank: 142, total: 1850, percentile: 92.3 },
    { base: 'LAX', seat: 'FO', rank: 89, total: 2100, percentile: 95.8 },
    { base: 'SFO', seat: 'CA', rank: 201, total: 1200, percentile: 83.3 },
    { base: 'SFO', seat: 'FO', rank: 134, total: 1450, percentile: 90.8 },
    { base: 'ORD', seat: 'CA', rank: 178, total: 1650, percentile: 89.2 },
    { base: 'ORD', seat: 'FO', rank: 112, total: 1900, percentile: 94.1 }
  ]

  const recentLists = [
    { title: 'March 2026 Seniority List', description: 'Uploaded by admin', icon: 'i-lucide-file-text', date: '2026-03-01' },
    { title: 'February 2026 Seniority List', description: 'Uploaded by admin', icon: 'i-lucide-file-text', date: '2026-02-01' },
    { title: 'January 2026 Seniority List', description: 'Uploaded by admin', icon: 'i-lucide-file-text', date: '2026-01-05' },
    { title: 'December 2025 Seniority List', description: 'Uploaded by admin', icon: 'i-lucide-file-text', date: '2025-12-01' }
  ]

  const aggregateStats = [
    { category: 'B737 / LAX', avgSeniority: 4250, avgYearsToRetire: 12.3, totalPilots: 1850 },
    { category: 'B737 / SFO', avgSeniority: 3890, avgYearsToRetire: 11.8, totalPilots: 1200 },
    { category: 'B737 / ORD', avgSeniority: 4100, avgYearsToRetire: 13.1, totalPilots: 1650 },
    { category: 'A320 / LAX', avgSeniority: 5200, avgYearsToRetire: 14.5, totalPilots: 2100 },
    { category: 'A320 / SFO', avgSeniority: 4800, avgYearsToRetire: 13.7, totalPilots: 1450 },
    { category: 'A320 / ORD', avgSeniority: 5050, avgYearsToRetire: 14.2, totalPilots: 1900 }
  ]

  return { stats, rankCard, retirementChartData, baseSeatData, recentLists, aggregateStats }
}
