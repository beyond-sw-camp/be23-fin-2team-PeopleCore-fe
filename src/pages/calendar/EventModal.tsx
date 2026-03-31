import { useState } from 'react'
import type { CalendarEvent, AlarmConfig, RepeatConfig, SharedCalendar } from './types'
import { COLORS } from './types'

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (event: CalendarEvent) => void
  calendars: SharedCalendar[]
  initialDate?: Date
  editEvent?: CalendarEvent | null
}

export default function EventModal({ isOpen, onClose, onSave, calendars, initialDate, editEvent }: EventModalProps) {
  const now = initialDate || new Date()
  const defaultEnd = new Date(now)
  defaultEnd.setHours(now.getHours() + 1)

  const [title, setTitle] = useState(editEvent?.title || '')
  const [allDay, setAllDay] = useState(editEvent?.allDay || false)
  const [startDate, setStartDate] = useState(formatDate(editEvent?.start || now))
  const [startTime, setStartTime] = useState(formatTime(editEvent?.start || now))
  const [endDate, setEndDate] = useState(formatDate(editEvent?.end || defaultEnd))
  const [endTime, setEndTime] = useState(formatTime(editEvent?.end || defaultEnd))
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

  // 초대 관련
  const [inviteSearch, setInviteSearch] = useState('')
  const [invitees, setInvitees] = useState(editEvent?.invitees || [])

  const MOCK_USERS = [
    { id: 'u1', name: '이영희', department: '인사총무팀' },
    { id: 'u2', name: '박지훈', department: '인사총무팀' },
    { id: 'u3', name: '최수진', department: '개발팀' },
    { id: 'u4', name: '정민호', department: '기획팀' },
    { id: 'u5', name: '한서연', department: '디자인팀' },
    { id: 'u6', name: '강동우', department: '마케팅팀' },
  ]

  const filteredUsers = inviteSearch
    ? MOCK_USERS.filter(u =>
        !invitees.some(inv => inv.id === u.id) &&
        (u.name.includes(inviteSearch) || u.department.includes(inviteSearch))
      )
    : []

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

  const addAlarm = () => {
    setAlarms([...alarms, { method: 'popup', amount: 10, unit: 'minutes' }])
  }

  const removeAlarm = (idx: number) => {
    setAlarms(alarms.filter((_, i) => i !== idx))
  }

  const updateAlarm = (idx: number, field: keyof AlarmConfig, value: string | number) => {
    setAlarms(alarms.map((a, i) => i === idx ? { ...a, [field]: value } : a))
  }

  const addInvitee = (user: typeof MOCK_USERS[0]) => {
    setInvitees([...invitees, { ...user, status: 'pending' as const }])
    setInviteSearch('')
  }

  const removeInvitee = (id: string) => {
    setInvitees(invitees.filter(inv => inv.id !== id))
  }

  const editableCalendars = calendars.filter(c => c.type === 'my' || c.type === 'company')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[560px] max-h-[85vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h3 className="text-[16px] font-bold text-gray-900">{editEvent ? '일정 수정' : '일정 등록'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* 제목 */}
          <div>
            <input
              type="text"
              placeholder="일정 제목을 입력하세요"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-lg font-medium border-0 border-b-2 border-gray-200 focus:border-[#2e9e6e] focus:outline-none py-2 placeholder:text-gray-300"
            />
          </div>

          {/* 종일 / 시간 지정 */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allDay}
                onChange={e => setAllDay(e.target.checked)}
                className="w-4 h-4 rounded accent-[#2e9e6e]"
              />
              <span className="text-sm text-gray-700">종일 일정</span>
            </label>
            <span className="text-gray-300">|</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={e => setIsPublic(e.target.checked)}
                className="w-4 h-4 rounded accent-[#2e9e6e]"
              />
              <span className="text-sm text-gray-700">공개</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!isPublic}
                onChange={e => setIsPublic(!e.target.checked)}
                className="w-4 h-4 rounded accent-[#2e9e6e]"
              />
              <span className="text-sm text-gray-700">비공개</span>
            </label>
          </div>

          {/* 날짜/시간 */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <i className="far fa-clock text-gray-400 text-sm w-5" />
              <span className="text-xs text-gray-500 w-8">시작</span>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm border border-gray-200 rounded px-2 py-1 focus:border-[#2e9e6e] focus:outline-none" />
              {!allDay && <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="text-sm border border-gray-200 rounded px-2 py-1 focus:border-[#2e9e6e] focus:outline-none" />}
            </div>
            <div className="flex items-center gap-2">
              <i className="w-5" />
              <span className="text-xs text-gray-500 w-8">종료</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm border border-gray-200 rounded px-2 py-1 focus:border-[#2e9e6e] focus:outline-none" />
              {!allDay && <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="text-sm border border-gray-200 rounded px-2 py-1 focus:border-[#2e9e6e] focus:outline-none" />}
            </div>
          </div>

          {/* 장소 */}
          <div className="flex items-center gap-2">
            <i className="fas fa-map-marker-alt text-gray-400 text-sm w-5" />
            <input
              type="text"
              placeholder="장소"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:border-[#2e9e6e] focus:outline-none"
            />
          </div>

          {/* 설명 */}
          <div className="flex items-start gap-2">
            <i className="fas fa-align-left text-gray-400 text-sm w-5 mt-2.5" />
            <textarea
              placeholder="설명"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:border-[#2e9e6e] focus:outline-none resize-none"
            />
          </div>

          {/* 캘린더 선택 */}
          <div className="flex items-center gap-2">
            <i className="far fa-calendar text-gray-400 text-sm w-5" />
            <select
              value={calendarId}
              onChange={e => setCalendarId(e.target.value)}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:border-[#2e9e6e] focus:outline-none"
            >
              {editableCalendars.map(cal => (
                <option key={cal.id} value={cal.id}>{cal.name}</option>
              ))}
            </select>
          </div>

          {/* 반복 설정 */}
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="fas fa-redo text-gray-400 text-sm w-5" />
                <span className="text-sm text-gray-700">반복</span>
              </div>
              <div
                className={`toggle-switch ${showRepeat ? 'on' : ''}`}
                onClick={() => setShowRepeat(!showRepeat)}
              />
            </div>
            {showRepeat && (
              <div className="mt-3 pl-7 space-y-2">
                <div className="flex items-center gap-2">
                  <select
                    value={repeat.type}
                    onChange={e => setRepeat({ ...repeat, type: e.target.value as RepeatConfig['type'] })}
                    className="text-sm border border-gray-200 rounded px-2 py-1 focus:border-[#2e9e6e] focus:outline-none"
                  >
                    <option value="daily">매일</option>
                    <option value="weekly">매주</option>
                    <option value="monthly">매월</option>
                    <option value="yearly">매년</option>
                    <option value="custom">사용자 정의</option>
                  </select>
                  {repeat.type === 'custom' && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        value={repeat.interval}
                        onChange={e => setRepeat({ ...repeat, interval: parseInt(e.target.value) || 1 })}
                        className="w-14 text-sm border border-gray-200 rounded px-2 py-1 focus:border-[#2e9e6e] focus:outline-none"
                      />
                      <span className="text-xs text-gray-500">일마다</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">종료:</span>
                  <select
                    value={repeat.endType}
                    onChange={e => setRepeat({ ...repeat, endType: e.target.value as RepeatConfig['endType'] })}
                    className="text-sm border border-gray-200 rounded px-2 py-1 focus:border-[#2e9e6e] focus:outline-none"
                  >
                    <option value="never">무기한</option>
                    <option value="date">종료 날짜</option>
                    <option value="count">반복 횟수</option>
                  </select>
                  {repeat.endType === 'date' && (
                    <input type="date" className="text-sm border border-gray-200 rounded px-2 py-1 focus:border-[#2e9e6e] focus:outline-none" onChange={e => setRepeat({ ...repeat, endDate: new Date(e.target.value) })} />
                  )}
                  {repeat.endType === 'count' && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        value={repeat.endCount || 10}
                        onChange={e => setRepeat({ ...repeat, endCount: parseInt(e.target.value) || 10 })}
                        className="w-14 text-sm border border-gray-200 rounded px-2 py-1 focus:border-[#2e9e6e] focus:outline-none"
                      />
                      <span className="text-xs text-gray-500">회</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 알림 설정 */}
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <i className="far fa-bell text-gray-400 text-sm w-5" />
                <span className="text-sm text-gray-700">알림</span>
              </div>
              <button onClick={addAlarm} className="text-xs text-[#2e9e6e] font-medium hover:text-[#1a7a4e]">+ 추가</button>
            </div>
            <div className="pl-7 space-y-2">
              {alarms.map((alarm, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={alarm.method}
                    onChange={e => updateAlarm(idx, 'method', e.target.value)}
                    className="text-xs border border-gray-200 rounded px-2 py-1 focus:border-[#2e9e6e] focus:outline-none"
                  >
                    <option value="popup">팝업</option>
                    <option value="email">이메일</option>
                    <option value="webpush">웹 푸시</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={alarm.amount}
                    onChange={e => updateAlarm(idx, 'amount', parseInt(e.target.value) || 1)}
                    className="w-14 text-xs border border-gray-200 rounded px-2 py-1 focus:border-[#2e9e6e] focus:outline-none"
                  />
                  <select
                    value={alarm.unit}
                    onChange={e => updateAlarm(idx, 'unit', e.target.value)}
                    className="text-xs border border-gray-200 rounded px-2 py-1 focus:border-[#2e9e6e] focus:outline-none"
                  >
                    <option value="minutes">분 전</option>
                    <option value="hours">시간 전</option>
                    <option value="days">일 전</option>
                  </select>
                  <button onClick={() => removeAlarm(idx)} className="text-gray-300 hover:text-red-400 text-xs">
                    <i className="fas fa-times" />
                  </button>
                </div>
              ))}
              {alarms.length === 0 && <p className="text-xs text-gray-400">알림이 없습니다</p>}
            </div>
          </div>

          {/* 참석자 초대 */}
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-user-plus text-gray-400 text-sm w-5" />
              <span className="text-sm text-gray-700">참석자 초대</span>
            </div>
            <div className="pl-7">
              <div className="relative">
                <input
                  type="text"
                  placeholder="이름 또는 부서로 검색..."
                  value={inviteSearch}
                  onChange={e => setInviteSearch(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:border-[#2e9e6e] focus:outline-none"
                />
                {filteredUsers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-10 max-h-32 overflow-y-auto">
                    {filteredUsers.map(user => (
                      <div
                        key={user.id}
                        onClick={() => addInvitee(user)}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-700">{user.name}</span>
                        <span className="text-xs text-gray-400">{user.department}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {invitees.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {invitees.map(inv => (
                    <span key={inv.id} className="inline-flex items-center gap-1 text-xs bg-[#f0f9f6] text-[#2e9e6e] px-2 py-1 rounded-full">
                      {inv.name}
                      <button onClick={() => removeInvitee(inv.id)} className="hover:text-red-400"><i className="fas fa-times text-[10px]" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-6 py-2 text-[13px] font-medium text-white bg-[#2e9e6e] rounded-lg hover:bg-[#26865d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {editEvent ? '수정' : '등록'}
          </button>
        </div>
      </div>
    </div>
  )
}
