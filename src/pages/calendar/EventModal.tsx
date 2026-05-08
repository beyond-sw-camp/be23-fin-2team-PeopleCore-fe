import { useState } from 'react'
import type { CalendarEvent, AlarmConfig, RepeatConfig, SharedCalendar, Invitee } from './types'
import { COLORS } from './types'
import InviteeSelectModal from './InviteeSelectModal'

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (event: CalendarEvent) => void
  calendars: SharedCalendar[]
  initialDate?: Date
  initialEndDate?: Date
  editEvent?: CalendarEvent | null
  isAdmin?: boolean
}

export default function EventModal({ isOpen, onClose, onSave, calendars, initialDate, initialEndDate, editEvent, isAdmin }: EventModalProps) {
  const now = initialDate || new Date()
  const endInit = editEvent?.end || initialEndDate || (() => { const d = new Date(now); d.setHours(now.getHours() + 1); return d })()
  const hasDateRange = !!initialEndDate && !editEvent

  const [title, setTitle] = useState(editEvent?.title || '')
  const [allDay, setAllDay] = useState(editEvent?.allDay || hasDateRange || false)
  const [startDate, setStartDate] = useState(formatDate(editEvent?.start || now))
  const [startTime, setStartTime] = useState(formatTime(editEvent?.start || now))
  const [endDate, setEndDate] = useState(formatDate(endInit))
  const [endTime, setEndTime] = useState(formatTime(endInit))
  const [location, setLocation] = useState(editEvent?.location || '')
  const [description, setDescription] = useState(editEvent?.description || '')
  const [isPublic, setIsPublic] = useState(editEvent?.isPublic ?? true)
  const [calendarId, setCalendarId] = useState(editEvent?.calendarId || calendars[0]?.id || 'personal')
  const [showRepeat, setShowRepeat] = useState(!!editEvent?.repeat)
  const [repeat, setRepeat] = useState<RepeatConfig>(editEvent?.repeat || {
    type: 'weekly',
    interval: 1,
    endType: 'never',
  })
  const [alarms, setAlarms] = useState<AlarmConfig[]>(editEvent?.alarms || [{ method: 'popup', amount: 10, unit: 'minutes' }])
  const [invitees, setInvitees] = useState<Invitee[]>(editEvent?.invitees || [])
  const [inviteeModalOpen, setInviteeModalOpen] = useState(false)

  if (!isOpen) return null

  function formatDate(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  function formatTime(d: Date) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const handleSave = () => {
    if (!title.trim()) return
    const cal = calendars.find(c => c.id === calendarId)
    const event: CalendarEvent = {
      id: editEvent?.id || Date.now().toString(),
      title,
      start: allDay ? new Date(startDate + 'T00:00:00') : new Date(startDate + 'T' + startTime),
      end: allDay ? new Date(endDate + 'T23:59:59') : new Date(endDate + 'T' + endTime),
      allDay,
      location: location || undefined,
      description: description || undefined,
      isPublic,
      calendarId,
      color: cal?.color || COLORS[0],
      repeat: showRepeat ? repeat : undefined,
      alarms: alarms.length > 0 ? alarms : undefined,
      invitees: invitees.length > 0 ? invitees : undefined,
      createdBy: '김철수',
    }
    onSave(event)
    onClose()
  }

  const addAlarm = () => setAlarms([...alarms, { method: 'popup', amount: 10, unit: 'minutes' }])
  const removeAlarm = (idx: number) => setAlarms(alarms.filter((_, i) => i !== idx))
  const updateAlarm = (idx: number, field: keyof AlarmConfig, value: string | number) => {
    setAlarms(alarms.map((a, i) => i === idx ? { ...a, [field]: value } : a))
  }
  const removeInvitee = (id: string) => setInvitees(invitees.filter(inv => inv.id !== id))

  const editableCalendars = calendars.filter(c => c.type === 'my' || (c.type === 'company' && isAdmin))
  const inputClass = "text-sm border border-gray-200 rounded px-2.5 py-1.5 focus:border-[#2e9e6e] focus:outline-none"

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      {/* 헤더 */}
      <div className="px-8 pt-6 pb-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">{editEvent ? '일정 수정' : '일정등록'}</h2>
      </div>

      <div className="px-8 py-6 max-w-[700px]">
        {/* 제목 */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="일정 제목을 입력하세요"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#2e9e6e] focus:outline-none"
          />
        </div>

        {/* 날짜/시간 + 종일/반복 */}
        <div className="flex items-center gap-2 flex-wrap mb-5">
          <input type="date" value={startDate} onChange={e => {
            const v = e.target.value
            setStartDate(v)
            if (endDate < v) setEndDate(v)
          }} className={inputClass} />
          <input type="time" value={startTime} onChange={e => {
            const v = e.target.value
            setStartTime(v)
            if (startDate === endDate && endTime <= v) setEndTime(v)
          }} disabled={allDay} className={`${inputClass} ${allDay ? 'bg-gray-100 text-gray-400' : ''}`} />
          <span className="text-gray-400">~</span>
          <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
          <input type="time" value={endTime} min={startDate === endDate ? startTime : undefined} onChange={e => setEndTime(e.target.value)} disabled={allDay} className={`${inputClass} ${allDay ? 'bg-gray-100 text-gray-400' : ''}`} />
          <label className="flex items-center gap-1.5 ml-2 cursor-pointer">
            <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="w-3.5 h-3.5 accent-[#2e9e6e]" />
            <span className="text-xs text-gray-600">종일</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={showRepeat} onChange={e => setShowRepeat(e.target.checked)} className="w-3.5 h-3.5 accent-[#2e9e6e]" />
            <span className="text-xs text-gray-600">반복</span>
          </label>
        </div>

        {/* 반복 설정 (펼침) */}
        {showRepeat && (
          <div className="mb-5 ml-6 flex items-center gap-2 text-sm">
            <select value={repeat.type} onChange={e => setRepeat({ ...repeat, type: e.target.value as RepeatConfig['type'] })} className={inputClass}>
              <option value="daily">매일</option>
              <option value="weekly">매주</option>
              <option value="monthly">매월</option>
              <option value="yearly">매년</option>
            </select>
            <span className="text-xs text-gray-500">종료:</span>
            <select value={repeat.endType} onChange={e => setRepeat({ ...repeat, endType: e.target.value as RepeatConfig['endType'] })} className={inputClass}>
              <option value="never">무기한</option>
              <option value="date">종료 날짜</option>
              <option value="count">반복 횟수</option>
            </select>
            {repeat.endType === 'date' && <input type="date" className={inputClass} onChange={e => setRepeat({ ...repeat, endDate: new Date(e.target.value) })} />}
            {repeat.endType === 'count' && (
              <><input type="number" min={1} value={repeat.endCount || 10} onChange={e => setRepeat({ ...repeat, endCount: parseInt(e.target.value) || 10 })} className={`${inputClass} w-16`} /><span className="text-xs text-gray-500">회</span></>
            )}
          </div>
        )}

        {/* 테이블 형태 필드들 */}
        <table className="w-full text-sm mb-5">
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-3 text-gray-500 w-24 align-top">내 캘린더</td>
              <td className="py-3">
                <select value={calendarId} onChange={e => setCalendarId(e.target.value)} className={inputClass}>
                  {editableCalendars.map(cal => <option key={cal.id} value={cal.id}>{cal.name}</option>)}
                </select>
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 text-gray-500 align-top">참석자</td>
              <td className="py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {invitees.map(inv => (
                    <span key={inv.id} className="inline-flex items-center gap-1 text-xs bg-[#f0f9f6] text-[#2e9e6e] px-2 py-1 rounded-full">
                      {inv.name} <button onClick={() => removeInvitee(inv.id)} className="hover:text-red-400"><i className="fas fa-times text-[10px]" /></button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setInviteeModalOpen(true)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#2e9e6e] border border-dashed border-gray-300 hover:border-[#2e9e6e] rounded-full px-2.5 py-1 transition-colors"
                  >
                    <i className="fas fa-plus text-[9px]" />
                    <span>참석자 선택</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 text-gray-500">공개여부</td>
              <td className="py-3 flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={isPublic} onChange={() => setIsPublic(true)} className="accent-[#2e9e6e]" />
                  <span className="text-sm text-gray-700">공개</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={!isPublic} onChange={() => setIsPublic(false)} className="accent-[#2e9e6e]" />
                  <span className="text-sm text-gray-700">비공개</span>
                </label>
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 text-gray-500">장소</td>
              <td className="py-3">
                <input type="text" placeholder="장소" value={location} onChange={e => setLocation(e.target.value)} className={`${inputClass} w-full`} />
              </td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 text-gray-500 align-top">내용</td>
              <td className="py-3">
                <textarea placeholder="내용을 입력하세요" value={description} onChange={e => setDescription(e.target.value)} rows={4} className={`${inputClass} w-full resize-none`} />
              </td>
            </tr>
            <tr>
              <td className="py-3 text-gray-500 align-top">알림</td>
              <td className="py-3">
                {alarms.map((alarm, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-1.5">
                    <select value={alarm.method} onChange={e => updateAlarm(idx, 'method', e.target.value)} className={`${inputClass} text-xs`}>
                      <option value="popup">팝업</option>
                      <option value="email">이메일</option>
                      <option value="webpush">웹 푸시</option>
                    </select>
                    <input type="number" min={1} value={alarm.amount} onChange={e => updateAlarm(idx, 'amount', parseInt(e.target.value) || 1)} className={`${inputClass} text-xs w-14`} />
                    <select value={alarm.unit} onChange={e => updateAlarm(idx, 'unit', e.target.value)} className={`${inputClass} text-xs`}>
                      <option value="minutes">분 전</option>
                      <option value="hours">시간 전</option>
                      <option value="days">일 전</option>
                    </select>
                    <button onClick={() => removeAlarm(idx)} className="text-gray-300 hover:text-red-400 text-xs"><i className="fas fa-times" /></button>
                  </div>
                ))}
                <button onClick={addAlarm} className="text-xs text-gray-400 hover:text-[#2e9e6e] mt-1">+ 알림 추가</button>
              </td>
            </tr>
          </tbody>
        </table>

        {/* 하단 버튼 */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-6 py-2 text-sm font-medium text-white bg-[#2e9e6e] rounded-lg hover:bg-[#26865d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            확인
          </button>
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            취소
          </button>
        </div>
      </div>

      <InviteeSelectModal
        isOpen={inviteeModalOpen}
        initialSelected={invitees}
        onClose={() => setInviteeModalOpen(false)}
        onConfirm={setInvitees}
      />
    </div>
  )
}
