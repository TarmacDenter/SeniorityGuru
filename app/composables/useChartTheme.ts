import type { ChartOptions } from 'chart.js'

export function useChartTheme() {
  const defaults: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#64748b', // slate-500 — readable on both light and dark
          font: { family: "'IBM Plex Sans', system-ui, sans-serif", size: 12 }
        }
      },
      tooltip: {
        backgroundColor: '#0f172a', // slate-900
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',       // slate-300
        borderColor: '#1e293b',     // slate-800
        borderWidth: 1,
        padding: 10,
        titleFont: { family: "'IBM Plex Sans', system-ui, sans-serif", size: 13, weight: 'bold' as const },
        bodyFont: { family: "'IBM Plex Mono', ui-monospace, monospace", size: 12 }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#64748b',
          font: { family: "'IBM Plex Mono', ui-monospace, monospace", size: 10 }
        },
        grid: { color: 'rgba(51, 65, 85, 0.35)' } // slate-700/35
      },
      y: {
        ticks: {
          color: '#64748b',
          font: { family: "'IBM Plex Mono', ui-monospace, monospace", size: 10 }
        },
        grid: { color: 'rgba(51, 65, 85, 0.35)' } // slate-700/35
      }
    }
  }

  const colors = {
    primary: '#3fa37f',
    primaryLight: 'rgba(63, 163, 127, 0.18)',
    amber: '#3fa37f',
    amberLight: 'rgba(63, 163, 127, 0.18)',
    cyan: '#6b8fb5',
    cyanLight: 'rgba(107, 143, 181, 0.18)',
    peakHighlight: 'rgba(251, 191, 36, 0.7)',
    peakBorder: '#f59e0b',
    slate: '#64748b'
  }

  return { defaults, colors }
}
