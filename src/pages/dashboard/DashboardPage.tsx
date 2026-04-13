import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { calendarEventApi } from '../../api/calendar'
import type { EventRes } from '../../api/calendar'

function Calendar() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [events, setEvents] = useState<EventRes[]>([])

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11) }
    else setMonth(month - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0) }
    else setMonth(month + 1)
  }

  // 이달 일정 조회
  useEffect(() => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const start = `${year}-${pad(month + 1)}-01T00:00:00`
    const endDate = new Date(year, month + 1, 0)
    const end = `${year}-${pad(month + 1)}-${pad(endDate.getDate())}T23:59:59`
    calendarEventApi.getByRange(start, end)
      .then(setEvents)
      .catch(() => setEvents([]))
  }, [year, month])

  const cells = []
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: daysInPrevMonth - firstDay + 1 + i, current: false })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ day: i, current: true })
  }
  const remaining = 7 - (cells.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      cells.push({ day: i, current: false })
    }
  }

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  // 날짜에 일정이 있는지
  const hasEvent = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.some(e => {
      const start = e.startAt.slice(0, 10)
      const end = e.endAt.slice(0, 10)
      return dateStr >= start && dateStr <= end
    })
  }

  // 이달 일정 목록 (날짜순 정렬)
  const monthEvents = [...events].sort((a, b) => a.startAt.localeCompare(b.startAt))

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  return (
    <div className="card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-gray-900 tracking-tight">{year}년 {month + 1}월</span>
        <div className="flex gap-0.5">
          <button onClick={prevMonth} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-[#E1F5EE] hover:text-[#1D9E75] transition-colors text-sm">‹</button>
          <button onClick={nextMonth} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-[#E1F5EE] hover:text-[#1D9E75] transition-colors text-sm">›</button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* 왼쪽: 달력 */}
        <div className="shrink-0" style={{ width: '260px' }}>
          <div className="grid grid-cols-7 text-center mb-1">
            {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d, i) => (
              <div key={d} className={`text-[10px] font-semibold tracking-wider py-0.5 ${i === 0 ? 'text-red-400' : 'text-gray-400'}`}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 text-center">
            {cells.map((cell, i) => (
              <div key={i} className="flex items-center justify-center">
                <div className="relative">
                  <div
                    className={`w-[28px] h-[28px] flex items-center justify-center rounded-full text-[11px] cursor-pointer transition-colors ${
                      !cell.current
                        ? 'text-gray-300'
                        : isToday(cell.day)
                          ? 'bg-[#1D9E75] text-white font-bold'
                          : 'text-gray-700 hover:bg-[#E1F5EE]'
                    }`}
                  >
                    {cell.day}
                  </div>
                  {cell.current && hasEvent(cell.day) && !isToday(cell.day) && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1D9E75]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽: 이달 일정 */}
        <div className="flex-1 min-w-0 border-l border-gray-100 pl-4 flex flex-col">
          <div className="text-[11px] font-semibold text-gray-500 mb-2">이달의 일정</div>
          <div className="flex-1 overflow-y-auto space-y-1.5">
            {monthEvents.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">일정이 없습니다.</p>
            ) : monthEvents.map(ev => (
              <div key={ev.eventsId} className="flex items-start gap-2 py-1">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: ev.displayColor || '#1D9E75' }} />
                <div className="min-w-0">
                  <div className="text-[11px] text-gray-800 font-medium truncate">{ev.title}</div>
                  <div className="text-[10px] text-gray-400">
                    {formatDate(ev.startAt)}{ev.isAllDay ? '' : ` ${new Date(ev.startAt).getHours()}:${String(new Date(ev.startAt).getMinutes()).padStart(2, '0')}`}
                    {ev.startAt.slice(0, 10) !== ev.endAt.slice(0, 10) && ` ~ ${formatDate(ev.endAt)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-white">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* 상단: 사원카드 + 최근접속메뉴 + 캘린더 */}
        <div className="grid grid-cols-12 gap-6 items-stretch">
          {/* 사용자 정보 & 결재 카드 */}
          <div className="col-span-12 lg:col-span-3">
            <div className="card p-6 h-full flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full mb-4 flex items-center justify-center">
                <i className="fas fa-user text-3xl text-gray-400"></i>
              </div>
              <h2 className="font-bold text-lg">{user?.empName ?? '-'}</h2>
              <p className="text-sm text-gray-500 mb-6">{user?.empRole === 'HR_SUPER_ADMIN' ? '최고관리자' : user?.empRole === 'HR_ADMIN' ? '인사관리자' : '일반사원'}</p>

              <div className="space-y-3 w-3/4 mx-auto">
                <div className="bg-[#E1F5EE] p-3 rounded-lg border border-[#9FE1CB] flex items-center justify-between">
                  <p className="text-sm text-[#1D9E75] font-bold">전자결재</p>
                  <p className="text-lg font-bold text-[#1D9E75]">0<span className="text-xs ml-1">건</span></p>
                </div>
                <div className="bg-[#E1F5EE] p-3 rounded-lg border border-[#9FE1CB] flex items-center justify-between">
                  <p className="text-sm text-[#1D9E75] font-bold">안 읽은 메일</p>
                  <p className="text-lg font-bold text-[#1D9E75]">0<span className="text-xs ml-1">건</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* 최근 접속 메뉴 */}
          <div className="col-span-12 lg:col-span-4">
            <div className="card p-6 h-full">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-history mr-2 text-[#1D9E75]"></i>
                최근 접속 메뉴
              </h3>
              <ul className="space-y-4">
                <li className="text-sm text-gray-400 text-center py-4">최근 접속 메뉴가 없습니다.</li>
              </ul>
            </div>
          </div>

          {/* 캘린더 */}
          <div className="col-span-12 lg:col-span-5">
            <Calendar />
          </div>
        </div>

        {/* 하단: 전사게시판 + 출퇴근 */}
        <div className="grid grid-cols-12 gap-6 items-stretch">
          {/* 전사게시판 */}
          <div className="col-span-12 lg:col-span-8">
            <div className="card h-full flex flex-col">
              <div className="p-6 border-b border-gray-300 flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">전사 게시판</h3>
                <button className="text-xs text-[#1D9E75] font-bold">+ 더보기</button>
              </div>
              <div className="p-0 flex-1 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs uppercase border-b border-gray-300">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-gray-800">제목</th>
                      <th className="px-6 py-3 font-semibold text-gray-800">작성자</th>
                      <th className="px-6 py-3 font-semibold text-gray-800">날짜</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-400">게시물이 없습니다.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 출퇴근 */}
          <div className="col-span-12 lg:col-span-4">
            <div className="card p-6 h-full flex flex-col">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-fingerprint mr-2 text-[#1D9E75]"></i>
                출퇴근
              </h3>
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <p className="text-xs text-gray-400">현재 상태</p>
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-sm font-bold rounded-full border border-gray-200">미출근</span>
                <p className="text-xs text-gray-500">-</p>
                <div className="flex gap-3 w-full mt-2">
                  <button className="flex-1 py-2.5 bg-[#1D9E75] text-white text-sm font-bold rounded-lg hover:bg-[#1D9E75] transition-colors">
                    <i className="fas fa-sign-in-alt mr-1"></i>출근
                  </button>
                  <button className="flex-1 py-2.5 bg-gray-100 text-gray-600 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors">
                    <i className="fas fa-sign-out-alt mr-1"></i>퇴근
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                <span>이번 달 지각 -</span>
                <span>초과근무 -</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
