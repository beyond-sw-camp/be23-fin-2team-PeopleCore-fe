import { useState, useRef } from 'react'
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

const VIEW_MAP: Record<CalendarViewType, string> = {
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
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(today)
  const [selectedDate, setSelectedDate] = useState(today)
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
      textColor: e.color,
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
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const prevPeriod = () => getApi()?.prev()
  const nextPeriod = () => getApi()?.next()

  const changeView = (vt: CalendarViewType) => {
    setViewType(vt)
    getApi()?.changeView(VIEW_MAP[vt])
  }

  // FullCalendar 이벤트 핸들러
  const handleDateSelect = (info: DateSelectArg) => {
    setEventModalDate(info.start)
    setEditingEvent(null)
    setEventModalOpen(true)
  }

  const handleEventClick = (info: EventClickArg) => {
    const original = info.event.extendedProps.original as CalendarEvent | undefined
    if (original) {
      setDetailEvent(original)
    }
  }

  const handleDatesSet = (arg: { view: { type: string; title: string }; start: Date }) => {
    setTitle(arg.view.title)
    setCurrentDate(arg.start)
    const vt = VIEW_REVERSE[arg.view.type]
    if (vt) setViewType(vt)
  }

  // 일정 CRUD
  const handleSaveEvent = (event: CalendarEvent) => {
    setEvents(prev => {
      const existing = prev.findIndex(e => e.id === event.id)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = event
        return updated
      }
      return [...prev, event]
    })
    setEditingEvent(null)
  }

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId))
  }

  const handleEditEvent = (event: CalendarEvent) => {
    setDetailEvent(null)
    setEditingEvent(event)
    setEventModalOpen(true)
  }

  const handleToggleCalendar = (id: string) => {
    setCalendars(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c))
  }

  const handleAddCalendar = (calendar: SharedCalendar) => {
    setCalendars(prev => [...prev, calendar])
  }

  const handleMonthChange = (y: number, m: number) => {
    getApi()?.gotoDate(new Date(y, m, 1))
  }

  const handleSearchNavigate = (date: Date) => {
    getApi()?.gotoDate(date)
    setSelectedDate(date)
    setSearchOpen(false)
  }

  const views: { key: CalendarViewType; label: string }[] = [
    { key: 'day', label: '일' },
    { key: 'week', label: '주' },
    { key: 'month', label: '월' },
    { key: 'year', label: '연' },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* 캘린더 헤더 */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setEventModalDate(new Date()); setEditingEvent(null); setEventModalOpen(true) }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2e9e6e] text-white text-sm font-medium rounded-lg hover:bg-[#26865d] transition-colors"
          >
            <i className="fas fa-plus text-xs" />
            일정 등록
          </button>
          <button onClick={goToToday} className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            오늘
          </button>
          <div className="flex items-center gap-1">
            <button onClick={prevPeriod} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">‹</button>
            <button onClick={nextPeriod} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">›</button>
          </div>
          <h2 className="text-lg font-bold text-gray-800 capitalize">{title}</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            title="검색"
          >
            <i className="fas fa-search text-sm" />
          </button>
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
      </div>

      {/* 메인 영역 */}
      <div className="flex-1 flex overflow-hidden">
        <CalendarSidebar
          currentDate={currentDate}
          selectedDate={selectedDate}
          onDateSelect={(d) => { setSelectedDate(d); getApi()?.gotoDate(d) }}
          onMonthChange={handleMonthChange}
          calendars={calendars}
          onToggleCalendar={handleToggleCalendar}
          onAddCalendar={() => setShareCalendarOpen(true)}
        />

        {/* FullCalendar */}
        <div className="flex-1 overflow-auto p-2 fc-custom">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, multiMonthPlugin]}
            initialView="dayGridMonth"
            locale="ko"
            headerToolbar={false}
            height="100%"
            selectable
            selectMirror
            editable={false}
            events={[...fcEvents, ...holidayEvents]}
            select={handleDateSelect}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            dayMaxEvents={3}
            moreLinkText={(num) => `+${num}개 더`}
            nowIndicator
            slotMinTime="06:00:00"
            slotMaxTime="23:00:00"
            allDayText="종일"
            slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            buttonText={{ today: '오늘', month: '월', week: '주', day: '일', year: '연' }}
            multiMonthMaxColumns={4}
          />
        </div>
      </div>

      {/* 모달들 */}
      <EventModal
        isOpen={eventModalOpen}
        onClose={() => { setEventModalOpen(false); setEditingEvent(null) }}
        onSave={handleSaveEvent}
        calendars={calendars}
        initialDate={eventModalDate}
        editEvent={editingEvent}
      />

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
        onSave={handleAddCalendar}
      />
    </div>
  )
}
