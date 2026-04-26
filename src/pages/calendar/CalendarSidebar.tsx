import { useState, useRef, useEffect } from 'react'
import type { SharedCalendar } from './types'
import { CALENDAR_PALETTE } from './types'

interface CalendarSidebarProps {
  calendars: SharedCalendar[]
  onToggleCalendar: (id: string) => void
  onAddSubscription: () => void
  onAddMyCalendar: (name: string, isPublic?: boolean) => void
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
    <div className="flex items-center gap-2 group py-1 px-1 -mx-1 rounded hover:bg-[#E1F5EE] transition-colors">
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
  onAddMyCalendar,
  onChangeCalendarColor,
  onOpenSettings,
}: CalendarSidebarProps) {
  const myCalendars = calendars.filter(c => c.type === 'my')
  const subscribedCalendars = calendars.filter(c => c.type === 'subscribed')
  const companyCalendars = calendars.filter(c => c.type === 'company')
  const [addCalModalOpen, setAddCalModalOpen] = useState(false)
  const [newCalName, setNewCalName] = useState('')
  const [newCalPublic, setNewCalPublic] = useState(true)

  return (
    <div className="flex-1 overflow-y-auto">
      {/* 내 캘린더 */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] font-semibold text-[#000000]">내 캘린더</span>
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
        <button
          onClick={() => setAddCalModalOpen(true)}
          className="flex items-center gap-1.5 mt-3 text-xs text-gray-400 hover:text-[#2e9e6e] transition-colors"
        >
          <i className="fas fa-plus text-[10px]" />
          내 캘린더 추가
        </button>

        {/* 내 캘린더 추가 모달 */}
        {addCalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => { setAddCalModalOpen(false); setNewCalName(''); setNewCalPublic(true) }} />
            <div className="relative bg-white rounded-xl shadow-xl w-[350px]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <h3 className="text-[14px] font-bold text-gray-900">내 캘린더 추가</h3>
                <button onClick={() => { setAddCalModalOpen(false); setNewCalName(''); setNewCalPublic(true) }} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
              </div>
              <div className="px-5 py-5 space-y-4">
                <input
                  type="text"
                  value={newCalName}
                  onChange={e => setNewCalName(e.target.value)}
                  placeholder="캘린더 이름을 입력하세요"
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#2e9e6e]"
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">공개 설정</span>
                  <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setNewCalPublic(true)}
                      className={`px-3 py-1 text-[11px] rounded-md transition-colors ${newCalPublic ? 'bg-[#2e9e6e] text-white' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      공개
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCalPublic(false)}
                      className={`px-3 py-1 text-[11px] rounded-md transition-colors ${!newCalPublic ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      비공개
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 leading-tight">
                  공개 캘린더는 공유 요청을 수락한 동료에게 일정이 노출됩니다.
                </p>
              </div>
              <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
                <button
                  onClick={() => {
                    if (newCalName.trim()) {
                      onAddMyCalendar(newCalName.trim(), newCalPublic)
                      setNewCalName('')
                      setNewCalPublic(true)
                      setAddCalModalOpen(false)
                    }
                  }}
                  disabled={!newCalName.trim()}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-[#2e9e6e] rounded-lg hover:bg-[#26865d] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  확인
                </button>
                <button onClick={() => { setAddCalModalOpen(false); setNewCalName(''); setNewCalPublic(true) }} className="px-4 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 관심 캘린더 */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] font-semibold text-[#000000]">관심 캘린더</span>
        </div>
        <div className="space-y-2">
          {subscribedCalendars.map(cal => (
            cal.status === 'pending' ? (
              <div key={cal.id} className="flex items-center gap-2 group py-1 px-1 -mx-1 rounded hover:bg-[#E1F5EE] transition-colors">
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
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] font-semibold text-[#000000]">전사 캘린더</span>
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
      <div className="px-4 pt-2 pb-4">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 py-1.5 px-2 text-[12px] text-[#000000] cursor-pointer rounded hover:bg-[#E1F5EE] transition-colors w-full"
        >
          <i className="fas fa-cog text-[10px] text-gray-500" />
          캘린더 환경설정
        </button>
      </div>
    </div>
  )
}
