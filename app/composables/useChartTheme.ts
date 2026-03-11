import type { ChartOptions } from 'chart.js'

export function useChartTheme() {
  const defaults: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#64748b', // slate-500 — readable on both light and dark
          font: { family: "'DM Sans Variable', system-ui, sans-serif", size: 12 }
        }
      },
      tooltip: {
        backgroundColor: '#0f172a', // slate-900
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',       // slate-300
        borderColor: '#1e293b',     // slate-800
        borderWidth: 1,
        padding: 10,
        titleFont: { family: "'DM Sans Variable', system-ui, sans-serif", size: 13, weight: 'bold' as const },
        bodyFont: { family: "'JetBrains Mono', monospace", size: 12 }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#64748b',
          font: { family: "'JetBrains Mono', monospace", size: 10 }
        },
        grid: { color: 'rgba(51, 65, 85, 0.35)' } // slate-700/35
      },
      y: {
        ticks: {
          color: '#64748b',
          font: { family: "'JetBrains Mono', monospace", size: 10 }
        },
        grid: { color: 'rgba(51, 65, 85, 0.35)' } // slate-700/35
      }
    }
  }

  const colors = {
    // Primary series — sky-400 (vibrant on dark, crisp on light)
    primary: '#38bdf8',
    primaryLight: 'rgba(56, 189, 248, 0.15)',
    // Backward-compat aliases used by existing chart components
    amber: '#38bdf8',
    amberLight: 'rgba(56, 189, 248, 0.15)',
    // Secondary series — indigo-400 (matches app secondary color)
    cyan: '#818cf8',
    cyanLight: 'rgba(129, 140, 248, 0.15)',
    slate: '#64748b'
  }

  return { defaults, colors }
}
