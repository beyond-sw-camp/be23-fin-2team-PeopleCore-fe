import { useState, useMemo, useEffect } from 'react'

// 단계별 색상 팔레트 — blue→purple→pink 유사색, 파스텔 톤
export const STAGE_COLORS = [
  { bg: '#eff6ff', bgStrong: '#dbeafe', fg: '#2563eb', ring: '#3b82f6' }, // blue
  { bg: '#eef2ff', bgStrong: '#e0e7ff', fg: '#4f46e5', ring: '#6366f1' }, // indigo
  { bg: '#f5f3ff', bgStrong: '#ede9fe', fg: '#7c3aed', ring: '#8b5cf6' }, // violet
  { bg: '#faf5ff', bgStrong: '#f3e8ff', fg: '#9333ea', ring: '#a855f7' }, // purple
  { bg: '#fdf4ff', bgStrong: '#fae8ff', fg: '#a21caf', ring: '#c026d3' }, // fuchsia
  { bg: '#fdf2f8', bgStrong: '#fce7f3', fg: '#be185d', ring: '#ec4899' }, // pink
  { bg: '#fff1f2', bgStrong: '#ffe4e6', fg: '#be123c', ring: '#e11d48' }, // rose
  { bg: '#fef2f2', bgStrong: '#fee2e2', fg: '#dc2626', ring: '#ef4444' }, // red
]

// ── 날짜 유틸 ────────────────────────────────────
function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function fmtISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function lastOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}
function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

interface StageEntry {
  name: string
  startDate: string
  endDate: string
}

interface Props {
  seasonStart: string
  seasonEnd: string
  stages: StageEntry[]
  activeIdx: number
  onPick: (idx: number, field: 'startDate' | 'endDate', value: string) => void
}

// 단계 일정 달력 — 시작/종료일은 반셀, 중간은 풀셀 배경으로 연속 범위 표현
export default function StageCalendar({ seasonStart, seasonEnd, stages, activeIdx, onPick }: Props) {
  const initial = seasonStart ? parseISO(seasonStart) : new Date()
  const [viewMonth, setViewMonth] = useState<Date>(firstOfMonth(initial))
  const today = stripTime(new Date())

  useEffect(() => {
    if (seasonStart) {
      const s = firstOfMonth(parseISO(seasonStart))
      if (viewMonth < s) setViewMonth(s)
    }
    if (seasonEnd) {
      const e = firstOfMonth(parseISO(seasonEnd))
      if (viewMonth > e) setViewMonth(e)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonStart, seasonEnd])

  const sStart = seasonStart ? stripTime(parseISO(seasonStart)) : null
  const sEnd = seasonEnd ? stripTime(parseISO(seasonEnd)) : null

  const activeStage = activeIdx >= 0 ? stages[activeIdx] : undefined
  const nextField: 'startDate' | 'endDate' | null =
    !activeStage ? null :
    !activeStage.startDate ? 'startDate' :
    !activeStage.endDate ? 'endDate' :
    'startDate'

  const grid = useMemo(() => {
    const first = firstOfMonth(viewMonth)
    const startOffset = first.getDay()
    const cells: { date: Date; inMonth: boolean }[] = []
    for (let i = startOffset; i > 0; i--) cells.push({ date: addDays(first, -i), inMonth: false })
    const last = lastOfMonth(viewMonth)
    for (let d = 1; d <= last.getDate(); d++) cells.push({ date: new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d), inMonth: true })
    while (cells.length < 42) {
      const prev = cells[cells.length - 1].date
      cells.push({ date: addDays(prev, 1), inMonth: false })
    }
    return cells
  }, [viewMonth])

  const canPrev = !sStart || firstOfMonth(sStart).getTime() < viewMonth.getTime()
  const canNext = !sEnd || firstOfMonth(sEnd).getTime() > viewMonth.getTime()
  const prevMonth = () => canPrev && setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
  const nextMonth = () => canNext && setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))

  const stageOfDay = (d: Date): number => {
    const dt = stripTime(d).getTime()
    for (let i = 0; i < stages.length; i++) {
      const s = stages[i]
      if (!s.startDate) continue
      const start = stripTime(parseISO(s.startDate)).getTime()
      const end = s.endDate ? stripTime(parseISO(s.endDate)).getTime() : start
      if (dt >= start && dt <= end) return i
    }
    return -1
  }

  const outOfSeason = (d: Date): boolean => {
    const dt = stripTime(d).getTime()
    if (sStart && dt < sStart.getTime()) return true
    if (sEnd && dt > sEnd.getTime()) return true
    return false
  }

  // 활성 단계의 이전/다음 단계 경계 — 이전 단계 종료일 이전 또는 다음 단계 시작일 이후 날짜 차단
  const outOfActiveBounds = (d: Date): boolean => {
    if (!activeStage || activeIdx < 0) return false
    const dt = stripTime(d).getTime()
    const prev = activeIdx > 0 ? stages[activeIdx - 1] : null
    const next = activeIdx < stages.length - 1 ? stages[activeIdx + 1] : null
    if (prev?.endDate) {
      const prevEnd = stripTime(parseISO(prev.endDate)).getTime()
      if (dt <= prevEnd) return true
    }
    if (next?.startDate) {
      const nextStart = stripTime(parseISO(next.startDate)).getTime()
      if (dt >= nextStart) return true
    }
    return false
  }

  const handleDayClick = (d: Date) => {
    if (!activeStage || activeIdx < 0) return
    if (outOfSeason(d) || outOfActiveBounds(d)) return
    const iso = fmtISO(d)
    if (nextField === 'startDate') {
      onPick(activeIdx, 'startDate', iso)
      onPick(activeIdx, 'endDate', '')
    } else {
      const start = parseISO(activeStage.startDate)
      if (stripTime(d).getTime() < stripTime(start).getTime()) {
        onPick(activeIdx, 'startDate', iso)
        onPick(activeIdx, 'endDate', '')
      } else {
        onPick(activeIdx, 'endDate', iso)
      }
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden w-full max-w-[480px]">
      {/* 상단 — 안내 + 월 이동 */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gradient-to-r from-[#f0fdf4] to-[#ecfdf5] border-b border-[#d4ecdd]">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse shrink-0" />
          <span className="text-[11px] text-[#065f46] font-medium truncate">
            {!activeStage
              ? '단계 선택 후 날짜 클릭'
              : nextField === 'startDate'
                ? <><b>{activeStage.name}</b> 시작일</>
                : <><b>{activeStage.name}</b> 종료일</>}
          </span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button type="button" onClick={prevMonth} disabled={!canPrev}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed text-[#065f46] text-[12px]">‹</button>
          <div className="text-[12px] font-bold text-[#1a2b23] min-w-[72px] text-center tabular-nums">
            {viewMonth.getFullYear()}.{String(viewMonth.getMonth() + 1).padStart(2, '0')}
          </div>
          <button type="button" onClick={nextMonth} disabled={!canNext}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed text-[#065f46] text-[12px]">›</button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
          <div key={d} className={`py-1.5 text-center text-[10px] font-semibold ${
            i === 0 ? 'text-[#ef4444]' : i === 6 ? 'text-[#3b82f6]' : 'text-[#6b7280]'
          }`}>{d}</div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {grid.map((cell, i) => {
          const stageIdx = stageOfDay(cell.date)
          const color = stageIdx >= 0 ? STAGE_COLORS[stageIdx % STAGE_COLORS.length] : null
          const isActive = stageIdx === activeIdx && stageIdx >= 0
          const inSeason = cell.inMonth && !outOfSeason(cell.date)
          const disabled = !inSeason || outOfActiveBounds(cell.date)
          const isSunday = cell.date.getDay() === 0
          const isSaturday = cell.date.getDay() === 6
          const isTodayDay = isSameDay(cell.date, today)
          const iso = fmtISO(cell.date)
          const isStageStart = stageIdx >= 0 && stages[stageIdx].startDate === iso
          const isStageEnd = stageIdx >= 0 && stages[stageIdx].endDate === iso
          const isSingleDay = isStageStart && isStageEnd
          const hasRange = stageIdx >= 0 && inSeason

          // 범위 배경 — 시작/종료는 반셀 + 안쪽 edge 둥글게, 중간은 풀셀, 하루짜리는 pill
          const rangeBg = color ? (isActive ? color.bgStrong : color.bg) : 'transparent'

          const fg = disabled ? '#d1d5db'
            : isSunday ? '#ef4444'
            : isSaturday ? '#3b82f6'
            : '#374151'

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleDayClick(cell.date)}
              disabled={disabled}
              className={`relative h-[40px] text-[11px] transition-colors ${
                disabled ? 'cursor-not-allowed' : 'cursor-pointer'
              } ${!cell.inMonth ? 'opacity-30' : ''}`}
              style={{ color: fg }}
            >
              {/* 범위 배경 — 시작/종료는 반셀 + 안쪽 edge 둥글게, 중간은 풀셀, 하루짜리는 pill */}
              {hasRange && isSingleDay && (
                <div
                  className="absolute top-1 bottom-1 left-1 right-1 rounded-full pointer-events-none"
                  style={{ backgroundColor: rangeBg }}
                />
              )}
              {hasRange && isStageStart && !isSingleDay && (
                <div
                  className="absolute top-1 bottom-1 left-1/2 right-0 rounded-l-full pointer-events-none"
                  style={{ backgroundColor: rangeBg }}
                />
              )}
              {hasRange && isStageEnd && !isSingleDay && (
                <div
                  className="absolute top-1 bottom-1 left-0 right-1/2 rounded-r-full pointer-events-none"
                  style={{ backgroundColor: rangeBg }}
                />
              )}
              {hasRange && !isStageStart && !isStageEnd && !isSingleDay && (
                <div
                  className="absolute top-1 bottom-1 left-0 right-0 pointer-events-none"
                  style={{ backgroundColor: rangeBg }}
                />
              )}

              {/* 호버 효과 */}
              {!disabled && (
                <div className="absolute inset-1 rounded opacity-0 hover:opacity-100 bg-gray-100/50 transition-opacity pointer-events-none" />
              )}

              {/* 오늘 마커 */}
              {isTodayDay && !disabled && (
                <span className="absolute top-0.5 right-1 w-1 h-1 rounded-full bg-[#10b981]" />
              )}

              {/* 날짜 숫자 — 하이라이트 없이 순수 숫자만 */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="relative z-10 inline-flex items-center justify-center w-7 h-7 font-medium">
                  {cell.date.getDate()}
                </span>
              </div>
            </button>
          )
        })}
      </div>

    </div>
  )
}
