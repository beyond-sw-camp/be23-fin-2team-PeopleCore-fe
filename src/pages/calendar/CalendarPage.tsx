import { useState, useRef, useEffect, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import multiMonthPlugin from '@fullcalendar/multimonth'
import type { EventClickArg, DateSelectArg } from '@fullcalendar/core'
import type { CalendarEvent, CalendarViewType, SharedCalendar } from './types'
import { MOCK_EVENTS, MOCK_CALENDARS, MOCK_HOLIDAYS } from './types'
import CalendarSidebar from './CalendarSidebar'
import EventModal from './EventModal'
import EventDetailModal from './EventDetailModal'
import SearchModal from './SearchModal'
import ShareCalendarModal from './ShareCalendarModal'
import CalendarSettings from './CalendarSettings'
import EventListView from './EventListView'
import QuickEventModal from './QuickEventModal'
import { calendarEventApi, myCalendarApi, interestCalendarApi } from '../../api/calendar'
import type { EventRes, MyCalendarRes, InterestCalendarRes } from '../../api/calendar'

const VIEW_MAP: Partial<Record<CalendarViewType, string>> = {
  day: 'timeGridDay',
  week: 'timeGridWeek',
  month: 'dayGridMonth',
  year: 'multiMonthYear',
}

const VIEW_REVERSE: Record<string, CalendarViewType> = {
  timeGridDay: 'day',
  timeGridWeek: 'week',
  dayGridMonth: 'month',
  multiMonthYear: 'year',
}

export default function CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null)
  const [viewType, setViewType] = useState<CalendarViewType>('month')
  const [events, setEvents] = useState<CalendarEvent[]>(MOCK_EVENTS)
  const [calendars, setCalendars] = useState<SharedCalendar[]>(MOCK_CALENDARS)
  const [title, setTitle] = useState('')

  // 모달 상태
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [eventModalDate, setEventModalDate] = useState<Date | undefined>()
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [detailEvent, setDetailEvent] = useState<CalendarEvent | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [shareCalendarOpen, setShareCalendarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [listDate, setListDate] = useState(new Date())
  const [confirmDate, setConfirmDate] = useState<{ start: Date; end: Date } | null>(null)

  // API → 로컬 변환 함수
  const apiEventToLocal = (e: EventRes): CalendarEvent => ({
    id: String(e.eventsId), title: e.title, start: new Date(e.startAt), end: new Date(e.endAt),
    allDay: e.isAllDay, location: e.location, description: e.description, isPublic: e.isPublic,
    calendarId: String(e.myCalendarsId), color: e.displayColor || '#3b82f6', createdBy: String(e.empId),
    alarms: e.notifications?.map(n => ({ method: n.method.toLowerCase() as 'email' | 'webpush' | 'popup', amount: n.minutesBefore, unit: 'minutes' as const })),
  })
  const apiMyCalToLocal = (c: MyCalendarRes): SharedCalendar => ({
    id: String(c.myCalendarsId), name: c.calendarName, type: 'my', color: c.displayColor, visible: c.isVisible, owner: '',
  })
  const apiInterestToLocal = (c: InterestCalendarRes): SharedCalendar => ({
    id: 'interest-' + c.interestCalendarId, name: `내 일정(${c.targetEmpName})`, type: 'subscribed', color: c.displayColor, visible: c.isVisible, owner: c.targetEmpName, status: 'approved',
  })

  // 데이터 로드
  const fetchCalendars = useCallback(() => {
    Promise.all([myCalendarApi.getList(), interestCalendarApi.getList()])
      .then(([myList, interestList]) => {
        setCalendars([...myList.map(apiMyCalToLocal), ...interestList.map(apiInterestToLocal)])
      }).catch(() => {/* 폴백: 목 데이터 유지 */})
  }, [])

  const fetchEvents = useCallback((start?: Date, end?: Date) => {
    const s = start || new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    const e = end || new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0)
    calendarEventApi.getByRange(s.toISOString(), e.toISOString())
      .then(list => setEvents(list.map(apiEventToLocal)))
      .catch(() => {/* 폴백: 목 데이터 유지 */})
  }, [])

  useEffect(() => { fetchCalendars(); fetchEvents() }, [fetchCalendars, fetchEvents])

  // FullCalendar에 전달할 이벤트 (표시 가능한 캘린더만 필터)
  const visibleCalendarIds = calendars.filter(c => c.visible).map(c => c.id)
  const fcEvents = events
    .filter(e => visibleCalendarIds.includes(e.calendarId))
    .map(e => ({
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      allDay: e.allDay,
      backgroundColor: e.color + '20',
      borderColor: e.color,
      textColor: '#1f2937',
      extendedProps: { original: e },
    }))

  // 공휴일 이벤트
  const holidayEvents = MOCK_HOLIDAYS.map(h => ({
    id: 'holiday-' + h.name,
    title: h.name,
    start: h.date,
    allDay: true,
    display: 'background' as const,
    backgroundColor: h.type === 'public' ? '#fee2e2' : '#f3e8ff',
  }))

  const getApi = () => calendarRef.current?.getApi()

  const goToToday = () => {
    getApi()?.today()
  }

  const prevPeriod = () => getApi()?.prev()
  const nextPeriod = () => getApi()?.next()

  const changeView = (vt: CalendarViewType) => {
    setViewType(vt)
    const fcView = VIEW_MAP[vt]
    if (fcView) getApi()?.changeView(fcView)
  }

  // FullCalendar 이벤트 핸들러
  const handleDateSelect = (info: DateSelectArg) => {
    setConfirmDate({ start: info.start, end: info.end })
  }

  const handleConfirmRegister = () => {
    setEventModalDate(confirmDate!.start)
    setEditingEvent(null)
    setEventModalOpen(true)
    setSettingsOpen(false)
    setConfirmDate(null)
  }

  const handleEventClick = (info: EventClickArg) => {
    const original = info.event.extendedProps.original as CalendarEvent | undefined
    if (original) {
      setDetailEvent(original)
    }
  }

  const handleDatesSet = (arg: { view: { type: string; title: string }; start: Date }) => {
    setTitle(arg.view.title)
    const vt = VIEW_REVERSE[arg.view.type]
    if (vt) setViewType(vt)
  }

  // calendars의 색상 조합을 key로 사용하여 색 변경 시 FullCalendar 리마운트
  const colorKey = calendars.map(c => c.color).join(',')

  const handleEventDidMount = (info: { event: { borderColor: string }; el: HTMLElement }) => {
    info.el.style.borderLeftColor = info.event.borderColor
  }

  // 일정 CRUD (API 연결 + 로컬 폴백)
  const handleSaveEvent = (event: CalendarEvent) => {
    const isNew = !event.id || event.id.startsWith('new-') || !isNaN(Number(event.id)) === false
    const payload = {
      title: event.title, description: event.description, location: event.location,
      startAt: event.start.toISOString(), endAt: event.end.toISOString(),
      isAllDay: event.allDay, isPublic: event.isPublic,
      myCalendarsId: Number(event.calendarId) || 1,
      notifications: event.alarms?.map(a => ({ method: a.method.toUpperCase() as 'EMAIL' | 'PUSH' | 'POPUP', minutesBefore: a.amount })),
    }
    if (isNew || event.id === Date.now().toString()) {
      calendarEventApi.create({ ...payload, attendeeEmpIds: event.invitees?.map(i => Number(i.id)) })
        .then(() => fetchEvents()).catch(() => {
          setEvents(prev => [...prev, event])
        })
    } else {
      calendarEventApi.update(Number(event.id), payload)
        .then(() => fetchEvents()).catch(() => {
          setEvents(prev => prev.map(e => e.id === event.id ? event : e))
        })
    }
    setEditingEvent(null)
  }

  const handleDeleteEvent = (eventId: string) => {
    calendarEventApi.delete(Number(eventId))
      .then(() => fetchEvents()).catch(() => {
        setEvents(prev => prev.filter(e => e.id !== eventId))
      })
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setDetailEvent(null)
    setEditingEvent(event)
    setEventModalOpen(true)
  }

  const handleToggleCalendar = (id: string) => {
    setCalendars(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c))
    const numId = Number(id)
    if (!isNaN(numId)) {
      const cal = calendars.find(c => c.id === id)
      if (cal?.type === 'my') myCalendarApi.update(numId, { isVisible: !cal.visible }).catch(() => {})
      else if (id.startsWith('interest-')) interestCalendarApi.update(Number(id.replace('interest-', '')), { isVisible: !cal?.visible }).catch(() => {})
    }
  }

  const handleChangeCalendarColor = (id: string, color: string) => {
    setCalendars(prev => prev.map(c => c.id === id ? { ...c, color } : c))
    setEvents(prev => prev.map(e => e.calendarId === id ? { ...e, color } : e))
    const numId = Number(id)
    if (!isNaN(numId)) {
      const cal = calendars.find(c => c.id === id)
      if (cal?.type === 'my') myCalendarApi.update(numId, { displayColor: color }).catch(() => {})
      else if (id.startsWith('interest-')) interestCalendarApi.update(Number(id.replace('interest-', '')), { displayColor: color }).catch(() => {})
    }
  }

  const handleAddSubscription = (calendar: SharedCalendar) => {
    setCalendars(prev => [...prev, calendar])
  }

  const handleSearchNavigate = (date: Date) => {
    getApi()?.gotoDate(date)
    setSearchOpen(false)
  }

  const views: { key: CalendarViewType; label: string }[] = [
    { key: 'day', label: '일' },
    { key: 'week', label: '주' },
    { key: 'month', label: '월' },
    { key: 'list', label: '목록' },
  ]

  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      {/* 왼쪽 고정 패널: 타이틀 + 버튼 + 사이드바 */}
      <div className="w-[220px] bg-white border-r border-[#d1d5db] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#d1d5db]">
          <h2
            className="text-[15px] font-bold text-[#000000] mb-3 cursor-pointer hover:text-[#2e9e6e] transition-colors"
            onClick={() => setSettingsOpen(false)}
          >
            캘린더
          </h2>
          <button
            onClick={() => { setEventModalDate(new Date()); setEditingEvent(null); setEventModalOpen(true); setSettingsOpen(false) }}
            className="w-full py-2 border border-[#dde4e0] rounded-lg text-[13px] text-[#000000] font-medium hover:bg-[#E1F5EE] hover:border-[#1D9E75] transition-colors"
          >
            일정 등록
          </button>
        </div>

        {/* 사이드바 (스크롤 가능) */}
        <CalendarSidebar
          calendars={calendars}
          onToggleCalendar={handleToggleCalendar}
          onAddSubscription={() => setShareCalendarOpen(true)}
          onAddMyCalendar={(name) => {
            myCalendarApi.create({ calendarName: name, displayColor: '#3b82f6' })
              .then(() => fetchCalendars())
              .catch(() => {
                setCalendars(prev => [...prev, { id: 'my-' + Date.now(), name, type: 'my', color: '#3b82f6', visible: true, owner: '' }])
              })
          }}
          onChangeCalendarColor={handleChangeCalendarColor}
          onOpenSettings={() => { setSettingsOpen(true); setEventModalOpen(false); setEditingEvent(null) }}
        />
      </div>

      {/* 오른쪽 영역 */}
      {eventModalOpen ? (
        <EventModal
          isOpen={eventModalOpen}
          onClose={() => { setEventModalOpen(false); setEditingEvent(null) }}
          onSave={handleSaveEvent}
          calendars={calendars}
          initialDate={eventModalDate}
          editEvent={editingEvent}
        />
      ) : settingsOpen ? (
        <CalendarSettings onClose={() => setSettingsOpen(false)} myCalendars={calendars.filter(c => c.type === 'my')} />
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 페이지 헤더 */}
          <div className="px-6 pt-5 pb-2 shrink-0 bg-white">
            <h2 className="text-lg font-bold text-gray-800">일정</h2>
          </div>

          {/* 캘린더 헤더 */}
          <div className="px-4 py-3 border-b border-gray-200 grid grid-cols-3 items-center shrink-0 bg-white">
            {/* 왼쪽: 뷰 선택 */}
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                {views.map(v => (
                  <button
                    key={v.key}
                    onClick={() => changeView(v.key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      viewType === v.key ? 'bg-white text-[#2e9e6e] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 가운데: < 날짜 > */}
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => {
                if (viewType === 'list') setListDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                else prevPeriod()
              }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-lg">‹</button>
              <h2 className="text-lg font-bold text-gray-800 capitalize min-w-[120px] text-center">
                {viewType === 'list' ? `${listDate.getFullYear()}년 ${listDate.getMonth() + 1}월` : title}
              </h2>
              <button onClick={() => {
                if (viewType === 'list') setListDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                else nextPeriod()
              }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-lg">›</button>
            </div>

            {/* 오른쪽: 오늘 + 검색 */}
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => { if (viewType === 'list') setListDate(new Date()); else goToToday() }} className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                오늘
              </button>
              <button
                onClick={() => setSearchOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                title="검색"
              >
                <i className="fas fa-search text-sm" />
              </button>
            </div>
          </div>

          {viewType === 'list' ? (
            <EventListView events={events} calendars={calendars} baseDate={listDate} onEventClick={(ev) => setDetailEvent(ev)} />
          ) : (
            <div className="flex-1 overflow-hidden fc-custom" style={{ padding: '8px 48px 8px 8px' }}>
              <FullCalendar
                key={colorKey}
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, multiMonthPlugin]}
                initialView="dayGridMonth"
                locale="ko"
              firstDay={1}
                titleRangeSeparator=" ~ "
                headerToolbar={false}
                height="100%"
                selectable
                selectMirror
                editable={false}
                events={[...fcEvents, ...holidayEvents]}
                select={handleDateSelect}
                eventClick={handleEventClick}
                eventDidMount={handleEventDidMount}
                datesSet={handleDatesSet}
                dayMaxEvents={3}
                moreLinkText={(num) => `+${num}개 더`}
                nowIndicator
                slotMinTime="06:00:00"
                slotMaxTime="23:00:00"
                allDayText="종일"
                slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                dayCellContent={(e) => e.dayNumberText.replace('일', '')}
              />
            </div>
          )}
        </div>
      )}

      {/* 모달들 */}
      <EventDetailModal
        event={detailEvent}
        onClose={() => setDetailEvent(null)}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        events={events}
        onEventClick={(event) => { setSearchOpen(false); setDetailEvent(event) }}
        onNavigateToDate={handleSearchNavigate}
      />

      <ShareCalendarModal
        isOpen={shareCalendarOpen}
        onClose={() => setShareCalendarOpen(false)}
        onRequest={handleAddSubscription}
      />

      {/* 간편 일정 등록 모달 */}
      {confirmDate && (
        <QuickEventModal
          startDate={confirmDate.start}
          endDate={confirmDate.end}
          calendars={calendars}
          onSave={(event: CalendarEvent) => { handleSaveEvent(event); setConfirmDate(null) }}
          onDetail={() => handleConfirmRegister()}
          onClose={() => setConfirmDate(null)}
        />
      )}
    </div>
  )
}
