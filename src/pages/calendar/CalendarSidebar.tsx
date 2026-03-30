import { useState } from 'react'
import type { SharedCalendar } from './types'

interface MiniCalendarProps {
  year: number
  month: number
  selectedDate: Date
  onDateSelect: (date: Date) => void
}

function MiniCalendar({ year, month, selectedDate, onDateSelect }: MiniCalendarProps) {
  const today = new Date()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const cells: { day: number; current: boolean; date: Date }[] = []
  for (let i = 0; i < firstDay; i++) {
    const d = daysInPrevMonth - firstDay + 1 + i
    cells.push({ day: d, current: false, date: new Date(year, month - 1, d) })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ day: i, current: true, date: new Date(year, month, i) })
  }
  const remaining = 7 - (cells.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      cells.push({ day: i, current: false, date: new Date(year, month + 1, i) })
    }
  }

  const isToday = (date: Date) =>
    date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()

  const isSelected = (date: Date) =>
    date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear()

  return (
    <div>
      <div className="grid grid-cols-7 text-center mb-1">
        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
          <div key={d} className={`text-[10px] font-medium py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 text-center gap-y-0.5">
        {cells.map((cell, i) => (
          <div
            key={i}
            onClick={() => onDateSelect(cell.date)}
            className={`w-7 h-7 flex items-center justify-center rounded-full text-[11px] cursor-pointer mx-auto transition-colors ${
              !cell.current
                ? 'text-gray-300'
                : isSelected(cell.date)
                  ? 'bg-[#2e9e6e] text-white font-bold'
                  : isToday(cell.date)
                    ? 'bg-[#e8f5ef] text-[#2e9e6e] font-bold'
                    : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {cell.day}
          </div>
        ))}
      </div>
    </div>
  )
}

interface CalendarSidebarProps {
  currentDate: Date
  selectedDate: Date
  onDateSelect: (date: Date) => void
  onMonthChange: (year: number, month: number) => void
  calendars: SharedCalendar[]
  onToggleCalendar: (id: string) => void
  onAddCalendar: () => void
}

export default function CalendarSidebar({
  currentDate,
  selectedDate,
  onDateSelect,
  onMonthChange,
  calendars,
  onToggleCalendar,
  onAddCalendar,
}: CalendarSidebarProps) {
  const [miniYear, setMiniYear] = useState(currentDate.getFullYear())
  const [miniMonth, setMiniMonth] = useState(currentDate.getMonth())

  const prevMonth = () => {
    if (miniMonth === 0) { setMiniYear(miniYear - 1); setMiniMonth(11) }
    else setMiniMonth(miniMonth - 1)
  }
  const nextMonth = () => {
    if (miniMonth === 11) { setMiniYear(miniYear + 1); setMiniMonth(0) }
    else setMiniMonth(miniMonth + 1)
  }

  const handleDateSelect = (date: Date) => {
    onDateSelect(date)
    onMonthChange(date.getFullYear(), date.getMonth())
  }

  const myCalendars = calendars.filter(c => c.type === 'personal')
  const sharedCalendars = calendars.filter(c => c.type !== 'personal')

  return (
    <div className="w-[240px] border-r border-gray-200 bg-white flex flex-col shrink-0 overflow-y-auto">
      {/* 미니 캘린더 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-gray-800">{miniYear}년 {miniMonth + 1}월</span>
          <div className="flex gap-1">
            <button onClick={prevMonth} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 text-sm">‹</button>
            <button onClick={nextMonth} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 text-sm">›</button>
          </div>
        </div>
        <MiniCalendar
          year={miniYear}
          month={miniMonth}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />
      </div>

      {/* 내 캘린더 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">내 캘린더</span>
        </div>
        <div className="space-y-2">
          {myCalendars.map(cal => (
            <label key={cal.id} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={cal.visible}
                onChange={() => onToggleCalendar(cal.id)}
                className="w-3.5 h-3.5 rounded accent-current"
                style={{ accentColor: cal.color }}
              />
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cal.color }} />
              <span className="text-xs text-gray-700 group-hover:text-gray-900">{cal.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 공유 캘린더 */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">공유 캘린더</span>
          <button
            onClick={onAddCalendar}
            className="text-[#2e9e6e] hover:text-[#1a7a4e] text-sm font-bold"
            title="공유 캘린더 추가"
          >
            +
          </button>
        </div>
        <div className="space-y-2">
          {sharedCalendars.map(cal => (
            <label key={cal.id} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={cal.visible}
                onChange={() => onToggleCalendar(cal.id)}
                className="w-3.5 h-3.5 rounded"
                style={{ accentColor: cal.color }}
              />
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cal.color }} />
              <span className="text-xs text-gray-700 group-hover:text-gray-900">{cal.name}</span>
              <span className="text-[10px] text-gray-400 ml-auto">
                {cal.permission === 'admin' ? '관리' : cal.permission === 'edit' ? '편집' : '열람'}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
