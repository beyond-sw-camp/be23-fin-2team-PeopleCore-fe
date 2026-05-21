import { useState, useEffect } from 'react'
import type { CalendarEvent, SharedCalendar } from './types'
import { COLORS } from './types'

interface QuickEventModalProps {
  startDate: Date
  endDate: Date
  calendars: SharedCalendar[]
  onSave: (event: CalendarEvent) => void
  onDetail: () => void
  onClose: () => void
  isAdmin?: boolean
}

function pad(n: number) { return String(n).padStart(2, '0') }

export default function QuickEventModal({ startDate: sd, endDate: ed, calendars, onSave, onDetail, onClose, isAdmin }: QuickEventModalProps) {
  const startDateStr = `${sd.getFullYear()}-${pad(sd.getMonth() + 1)}-${pad(sd.getDate())}`
  const endDateStr = `${ed.getFullYear()}-${pad(ed.getMonth() + 1)}-${pad(ed.getDate())}`
  const defaultStartTime = `${pad(sd.getHours())}:${pad(sd.getMinutes())}`
  const defaultEndTime = `${pad(ed.getHours())}:${pad(ed.getMinutes())}`
  // 종일 여부: 시작/종료 시간이 둘 다 00:00이면 종일
  const isAllDay = sd.getHours() === 0 && sd.getMinutes() === 0 && ed.getHours() === 0 && ed.getMinutes() === 0

  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState(startDateStr)
  const [startTime, setStartTime] = useState(isAllDay ? '09:00' : defaultStartTime)
  const [endDate, setEndDate] = useState(endDateStr)
  const [endTime, setEndTime] = useState(isAllDay ? '10:00' : defaultEndTime)
  const [allDay, setAllDay] = useState(isAllDay)
  const [calendarId, setCalendarId] = useState(calendars.find(c => c.type === 'my')?.id || calendars[0]?.id || '')
  const [location, setLocation] = useState('')

  // 종료일시가 시작일시보다 이전이면 자동으로 시작일시로 보정
  useEffect(() => {
    if (allDay) {
      if (endDate < startDate) setEndDate(startDate)
      return
    }
    const startMs = new Date(`${startDate}T${startTime}`).getTime()
    const endMs = new Date(`${endDate}T${endTime}`).getTime()
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) return
    if (endMs < startMs) {
      setEndDate(startDate)
      setEndTime(startTime)
    }
  }, [startDate, startTime, endDate, endTime, allDay])

  const editableCalendars = calendars.filter(c => c.type === 'my' || (c.type === 'company' && isAdmin))
  const inputClass = "text-xs border border-gray-200 rounded px-2 py-1.5 focus:border-[#2e9e6e] focus:outline-none"

  const handleSave = () => {
    if (!title.trim()) return
    const cal = calendars.find(c => c.id === calendarId)
    const event: CalendarEvent = {
      id: `new-${Date.now()}`,
      title,
      start: allDay ? new Date(startDate + 'T00:00:00') : new Date(startDate + 'T' + startTime),
      end: allDay ? new Date(endDate + 'T23:59:59') : new Date(endDate + 'T' + endTime),
      allDay,
      location: location || undefined,
      isPublic: true,
      calendarId,
      color: cal?.color || COLORS[0],
      createdBy: '김철수',
    }
    onSave(event)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(480px,calc(100vw-24px))]">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-[15px] font-bold text-gray-900">간편 일정 등록</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* 일정명 */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-500 w-16 shrink-0">일정명 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="일정명을 입력하세요"
              className={`${inputClass} flex-1`}
              autoFocus
            />
          </div>

          {/* 일시 */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-500 w-16 shrink-0">일시</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} disabled={allDay} className={`${inputClass} ${allDay ? 'bg-gray-100 text-gray-400' : ''}`} />
              <span className="text-gray-400 text-xs">~</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} disabled={allDay} className={`${inputClass} ${allDay ? 'bg-gray-100 text-gray-400' : ''}`} />
              <label className="flex items-center gap-1 cursor-pointer ml-1">
                <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="w-3.5 h-3.5 accent-[#2e9e6e]" />
                <span className="text-xs text-gray-600">종일</span>
              </label>
            </div>
          </div>

          {/* 내 캘린더 */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-500 w-16 shrink-0">내 캘린더</label>
            <select value={calendarId} onChange={e => setCalendarId(e.target.value)} className={inputClass}>
              {editableCalendars.map(cal => <option key={cal.id} value={cal.id}>{cal.name}</option>)}
            </select>
          </div>

          {/* 장소 */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-500 w-16 shrink-0">장소</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="장소" className={`${inputClass} flex-1`} />
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onDetail}
            className="px-4 py-2 text-[13px] text-[#2e9e6e] border border-[#2e9e6e] rounded-lg hover:bg-[#f0f9f6] transition-colors"
          >
            일정상세 입력
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-5 py-2 text-[13px] font-medium text-white bg-[#2e9e6e] rounded-lg hover:bg-[#26865d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            확인
          </button>
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
