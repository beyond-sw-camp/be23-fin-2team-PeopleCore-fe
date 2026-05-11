import { DashboardWidget } from '../../vue-components'

interface Stat {
  icon: string
  title: string
  value: string | number
  sub: string
  trend: 'up' | 'down' | 'neutral'
  trendLabel: string
}

const STATS: Stat[] = [
  {
    icon: '📋',
    title: '결재 대기',
    value: 5,
    sub: '오늘 기준',
    trend: 'up',
    trendLabel: '▲ 2건 증가',
  },
  {
    icon: '✅',
    title: '완료된 결재',
    value: 23,
    sub: '이번 달',
    trend: 'neutral',
    trendLabel: '이번 달 누계',
  },
  {
    icon: '🕐',
    title: '초과근무',
    value: '12h',
    sub: '이번 주 누적',
    trend: 'down',
    trendLabel: '▼ 3h 감소',
  },
  {
    icon: '📅',
    title: '잔여 연차',
    value: 8,
    sub: '일',
    trend: 'neutral',
    trendLabel: '2026년 기준',
  },
]

export default function DashboardPage() {
  return (
    <div style={{ padding: '32px', background: '#f8fafc', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
        대시보드
      </h1>
      <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '28px' }}>
        오늘의 업무 현황을 한눈에 확인하세요
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        {STATS.map((stat) => (
          <DashboardWidget
            key={stat.title}
            icon={stat.icon}
            title={stat.title}
            value={stat.value}
            sub={stat.sub}
            trend={stat.trend}
            trendLabel={stat.trendLabel}
          />
        ))}
      </div>
    </div>
  )
}
