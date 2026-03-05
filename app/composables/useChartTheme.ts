import type { ChartOptions } from 'chart.js'

export function useChartTheme() {
  const defaults: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8', // slate-400
          font: { family: "'JetBrains Mono', monospace", size: 11 }
        }
      },
      tooltip: {
        backgroundColor: '#162542', // navy-800
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1', // slate-300
        borderColor: '#1e3055', // navy-700
        borderWidth: 1,
        titleFont: { family: "'JetBrains Mono', monospace" },
        bodyFont: { family: "'JetBrains Mono', monospace" }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#94a3b8',
          font: { family: "'JetBrains Mono', monospace", size: 10 }
        },
        grid: { color: 'rgba(30, 48, 85, 0.5)' }
      },
      y: {
        ticks: {
          color: '#94a3b8',
          font: { family: "'JetBrains Mono', monospace", size: 10 }
        },
        grid: { color: 'rgba(30, 48, 85, 0.5)' }
      }
    }
  }

  const colors = {
    amber: '#f59e0b',
    amberLight: 'rgba(245, 158, 11, 0.3)',
    cyan: '#06b6d4',
    cyanLight: 'rgba(6, 182, 212, 0.3)',
    slate: '#64748b'
  }

  return { defaults, colors }
}
