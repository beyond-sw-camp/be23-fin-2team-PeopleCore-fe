import { useState } from 'react'
import type { CalendarEvent } from './types'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onNavigateToDate: (date: Date) => void
}

export default function SearchModal({ isOpen, onClose, events, onEventClick, onNavigateToDate }: SearchModalProps) {
  const [keyword, setKeyword] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [author, setAuthor] = useState('')
  const [category, setCategory] = useState('all')

  if (!isOpen) return null

  const filteredEvents = events.filter(e => {
    if (keyword && !e.title.includes(keyword) && !e.description?.includes(keyword) && !e.location?.includes(keyword)) return false
    if (startDate && new Date(e.start) < new Date(startDate)) return false
    if (endDate && new Date(e.start) > new Date(endDate + 'T23:59:59')) return false
    if (author && !e.createdBy.includes(author)) return false
    if (category !== 'all' && e.calendarId !== category) return false
    return true
  }).sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())

  const formatDate = (d: Date) => {
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[600px] max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-lg text-gray-800">
            <i className="fas fa-search mr-2 text-[#2e9e6e]" />
            일정 검색
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times" />
          </button>
        </div>

        {/* 검색 필터 */}
        <div className="px-6 py-4 border-b border-gray-100 space-y-3 shrink-0">
          {/* 키워드 */}
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-2.5 text-gray-300 text-sm" />
            <input
              type="text"
              placeholder="키워드 검색 (제목, 설명, 장소)"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#2e9e6e] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* 날짜 범위 */}
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider">시작일</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:border-[#2e9e6e] focus:outline-none mt-0.5" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider">종료일</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:border-[#2e9e6e] focus:outline-none mt-0.5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* 작성자 */}
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider">작성자</label>
              <input type="text" placeholder="작성자 이름" value={author} onChange={e => setAuthor(e.target.value)} className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:border-[#2e9e6e] focus:outline-none mt-0.5" />
            </div>
            {/* 카테고리 */}
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wider">캘린더</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:border-[#2e9e6e] focus:outline-none mt-0.5">
                <option value="all">전체</option>
                <option value="personal">내 캘린더</option>
                <option value="hr-dept">인사총무팀</option>
                <option value="project-a">프로젝트 Alpha</option>
                <option value="company">전사 캘린더</option>
              </select>
            </div>
          </div>
        </div>

        {/* 검색 결과 */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          <div className="text-xs text-gray-400 mb-2">검색 결과 {filteredEvents.length}건</div>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <i className="fas fa-calendar-times text-3xl mb-2" />
              <p className="text-sm">검색 결과가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredEvents.map(event => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer group"
                  onClick={() => onEventClick(event)}
                >
                  <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: event.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{event.title}</div>
                    <div className="text-xs text-gray-400">
                      {formatDate(event.start)}
                      {!event.allDay && ` ${event.start.getHours()}:${String(event.start.getMinutes()).padStart(2, '0')}`}
                      {event.location && ` · ${event.location}`}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">{event.createdBy}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onNavigateToDate(event.start) }}
                    className="opacity-0 group-hover:opacity-100 text-[10px] text-[#2e9e6e] hover:text-[#1a7a4e] px-2 py-1 rounded bg-[#f0f9f6] transition-opacity"
                    title="캘린더에서 보기"
                  >
                    <i className="fas fa-external-link-alt" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
