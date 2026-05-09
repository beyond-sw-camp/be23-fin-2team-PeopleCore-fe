import { useState } from 'react'
import type { CalendarEvent, SharedCalendar } from './types'

interface EventListViewProps {
  events: CalendarEvent[]
  calendars: SharedCalendar[]
  baseDate: Date
  onEventClick: (event: CalendarEvent) => void
  currentEmpId?: number
}

function formatDate(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${mm}.${dd}(${days[d.getDay()]})`
}

function formatTime(d: Date) {
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const period = h < 12 ? '오전' : '오후'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${period} ${String(h12).padStart(2, '0')}:${m}`
}

function getTimeRange(event: CalendarEvent) {
  if (event.allDay) return '종일일정'
  return `${formatTime(event.start)} ~ ${formatTime(event.end)}`
}

export default function EventListView({ events, calendars, baseDate, onEventClick, currentEmpId }: EventListViewProps) {
  const [showDays, setShowDays] = useState(30)

  const visibleCalendarIds = calendars.filter(c => c.visible).map(c => c.id)
  const interestByEmpId = new Map<number, SharedCalendar>()
  calendars.forEach(c => {
    if (c.type === 'subscribed' && c.visible && c.targetEmpId != null) {
      interestByEmpId.set(c.targetEmpId, c)
    }
  })

  // baseDate 기준 해당 월 1일부터 + 더보기 일수
  const startRange = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
  const monthEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0)
  const extraDays = showDays - 30
  const endRange = new Date(monthEnd)
  if (extraDays > 0) endRange.setDate(endRange.getDate() + extraDays)

  const filteredEvents = events
    .filter(e => {
      if (visibleCalendarIds.includes(e.calendarId)) return true
      if (e.createdByEmpId != null && interestByEmpId.has(e.createdByEmpId)) return true
      // 내가 참석자로 초대받은 일정
      if (currentEmpId != null && !isNaN(currentEmpId) && e.invitees?.some(inv => Number(inv.id) === currentEmpId)) return true
      return false
    })
    .filter(e => e.start >= startRange && e.start <= endRange)
    .map(e => {
      if (visibleCalendarIds.includes(e.calendarId)) return e
      const interest = e.createdByEmpId != null ? interestByEmpId.get(e.createdByEmpId) : undefined
      return interest ? { ...e, color: interest.color } : e
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  // 날짜별 그룹핑
  const grouped: Record<string, CalendarEvent[]> = {}
  filteredEvents.forEach(e => {
    const key = `${e.start.getFullYear()}-${String(e.start.getMonth() + 1).padStart(2, '0')}-${String(e.start.getDate()).padStart(2, '0')}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(e)
  })

  const dateKeys = Object.keys(grouped).sort()

  const endDateStr = `${endRange.getFullYear()}-${String(endRange.getMonth() + 1).padStart(2, '0')}-${String(endRange.getDate()).padStart(2, '0')}`

  return (
    <div className="flex-1 overflow-y-auto overflow-x-auto px-3 sm:px-6 py-4">
      <div className="min-w-[640px]">
      {/* 테이블 헤더 */}
      <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-gray-300 text-xs font-medium text-gray-500">
        <div className="col-span-2">날짜</div>
        <div className="col-span-3">기간</div>
        <div className="col-span-4">제목</div>
        <div className="col-span-3">참석자</div>
      </div>

      {dateKeys.length > 0 ? (
        <>
          {dateKeys.map(dateKey => {
            const dayEvents = grouped[dateKey]
            return dayEvents.map((event, idx) => (
              <div
                key={event.id}
                onClick={() => onEventClick(event)}
                className="grid grid-cols-12 gap-2 px-3 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer text-xs items-center"
              >
                <div className="col-span-2 text-gray-600">
                  {idx === 0 ? formatDate(event.start) : ''}
                </div>
                <div className="col-span-3 text-gray-500">
                  {getTimeRange(event)}
                </div>
                <div className="col-span-4 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                  <span className="text-gray-800 truncate">{event.title}</span>
                </div>
                <div className="col-span-3 text-gray-500 truncate">
                  {event.invitees?.map(i => i.name).join(', ') || event.createdBy}
                </div>
              </div>
            ))
          })}

          <div className="px-3 py-2 mt-2">
            <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{endDateStr} 까지 표시</span>
          </div>

          <button
            onClick={() => setShowDays(prev => prev + 15)}
            className="w-full py-3 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-t border-gray-100 transition-colors"
          >
            +15일 더보기
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <i className="far fa-calendar-check text-3xl mb-3" />
          <p className="text-sm">표시할 일정이 없습니다.</p>
        </div>
      )}
      </div>
    </div>
  )
}
