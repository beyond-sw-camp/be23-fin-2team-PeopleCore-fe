import { useState, useRef, useEffect } from 'react'
import type { SharedCalendar } from './types'
import { CALENDAR_PALETTE } from './types'

interface CalendarSidebarProps {
  calendars: SharedCalendar[]
  onToggleCalendar: (id: string) => void
  onAddSubscription: () => void
  onChangeCalendarColor: (id: string, color: string) => void
  onOpenSettings: () => void
}

function ColorPicker({
  currentColor,
  onSelect,
  onClose,
}: {
  currentColor: string
  onSelect: (color: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute right-0 top-6 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2.5"
      style={{ width: '132px' }}
    >
      <div className="grid grid-cols-6 gap-1.5">
        {CALENDAR_PALETTE.map(color => (
          <button
            key={color}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(color)
            }}
            className="w-4 h-4 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              backgroundColor: color,
              borderColor: color === currentColor ? '#1f2937' : 'transparent',
            }}
          />
        ))}
      </div>
    </div>
  )
}

function CalendarItem({
  cal,
  onToggle,
  onChangeColor,
}: {
  cal: SharedCalendar
  onToggle: () => void
  onChangeColor: (color: string) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="flex items-center gap-2 group">
      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
        <input
          type="checkbox"
          checked={cal.visible}
          onChange={onToggle}
          className="w-3.5 h-3.5 rounded"
          style={{ accentColor: '#000000' }}
        />
        <span className="text-xs text-gray-700 group-hover:text-gray-900 truncate">{cal.name}</span>
      </label>
      <div className="relative shrink-0">
        <button
          onClick={() => setPickerOpen(!pickerOpen)}
          className="w-2.5 h-2.5 rounded-full hover:ring-2 hover:ring-gray-300 transition-all"
          style={{ backgroundColor: cal.color }}
        />
        {pickerOpen && (
          <ColorPicker
            currentColor={cal.color}
            onSelect={(color) => {
              onChangeColor(color)
              setPickerOpen(false)
            }}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>
    </div>
  )
}

export default function CalendarSidebar({
  calendars,
  onToggleCalendar,
  onAddSubscription,
  onChangeCalendarColor,
  onOpenSettings,
}: CalendarSidebarProps) {
  const myCalendars = calendars.filter(c => c.type === 'my')
  const subscribedCalendars = calendars.filter(c => c.type === 'subscribed')
  const companyCalendars = calendars.filter(c => c.type === 'company')

  return (
    <div className="w-[220px] border-r border-gray-200 bg-white flex flex-col shrink-0 overflow-y-auto">
      {/* 내 캘린더 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-700">내 캘린더</span>
        </div>
        <div className="space-y-2">
          {myCalendars.map(cal => (
            <CalendarItem
              key={cal.id}
              cal={cal}
              onToggle={() => onToggleCalendar(cal.id)}
              onChangeColor={(color) => onChangeCalendarColor(cal.id, color)}
            />
          ))}
        </div>
      </div>

      {/* 관심 캘린더 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-700">관심 캘린더</span>
        </div>
        <div className="space-y-2">
          {subscribedCalendars.map(cal => (
            cal.status === 'pending' ? (
              <div key={cal.id} className="flex items-center gap-2 group">
                <span className="text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-500 rounded font-medium shrink-0">신청대기</span>
                <span className="text-xs text-gray-400 truncate">{cal.name}</span>
              </div>
            ) : (
              <CalendarItem
                key={cal.id}
                cal={cal}
                onToggle={() => onToggleCalendar(cal.id)}
                onChangeColor={(color) => onChangeCalendarColor(cal.id, color)}
              />
            )
          ))}
        </div>
        <button
          onClick={onAddSubscription}
          className="flex items-center gap-1.5 mt-3 text-xs text-gray-400 hover:text-[#2e9e6e] transition-colors"
        >
          <i className="fas fa-plus text-[10px]" />
          관심 캘린더 추가
        </button>
      </div>

      {/* 전사 캘린더 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-700">전사 캘린더</span>
        </div>
        <div className="space-y-2">
          {companyCalendars.map(cal => (
            <CalendarItem
              key={cal.id}
              cal={cal}
              onToggle={() => onToggleCalendar(cal.id)}
              onChangeColor={(color) => onChangeCalendarColor(cal.id, color)}
            />
          ))}
        </div>
      </div>

      {/* 캘린더 환경설정 */}
      <div className="p-4">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <i className="fas fa-cog text-sm text-gray-400" />
          캘린더 환경설정
        </button>
      </div>
    </div>
  )
}
