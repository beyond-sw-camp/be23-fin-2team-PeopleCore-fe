import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { attendanceApi, type CheckInRes, type CheckOutRes, type CheckInStatus, type CheckOutStatus, type HolidayReason } from '../../api/attendance'
import LeaveApplyModal, { type LeaveApplyData } from '../attendance/components/LeaveApplyModal'

const CHECK_IN_STATUS_LABEL: Record<CheckInStatus, { label: string; color: string }> = {
  ON_TIME: { label: '정시 출근', color: 'bg-[#E1F5EE] text-[#1D9E75] border-[#1D9E75]/30' },
  LATE: { label: '지각', color: 'bg-red-50 text-red-600 border-red-200' },
  HOLIDAY_WORK: { label: '휴일 출근', color: 'bg-purple-50 text-purple-600 border-purple-200' },
}

const CHECK_OUT_STATUS_LABEL: Record<CheckOutStatus, { label: string; color: string }> = {
  EARLY_LEAVE: { label: '조퇴', color: 'bg-orange-50 text-orange-600 border-orange-200' },
  ON_TIME: { label: '정시 퇴근', color: 'bg-[#E1F5EE] text-[#1D9E75] border-[#1D9E75]/30' },
  HOLIDAY_WORK_END: { label: '휴일 퇴근', color: 'bg-purple-50 text-purple-600 border-purple-200' },
}

const HOLIDAY_REASON_LABEL: Record<Exclude<HolidayReason, null>, string> = {
  NATIONAL: '법정공휴일',
  COMPANY: '사내휴일',
  WEEKLY_OFF: '비근무요일',
}

const toHHmm = (iso: string) => iso ? iso.slice(11, 16) : '-'
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
  const navigate = useNavigate()
  const [checkIn, setCheckIn] = useState<CheckInRes | null>(null)
  const [checkOut, setCheckOut] = useState<CheckOutRes | null>(null)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [leaveApplyOpen, setLeaveApplyOpen] = useState(false)

  const handleCheckIn = async () => {
    setLoading(true)
    try {
      const res = await attendanceApi.checkIn()
      setCheckIn(res)
      const label = CHECK_IN_STATUS_LABEL[res.checkInStatus].label
      setModal({ type: 'success', message: `출근 완료 · ${toHHmm(res.checkInAt)} (${label})` })
    } catch (e: unknown) {
      setModal({ type: 'error', message: extractCommuteError(e) ?? '출근 체크에 실패했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setLoading(true)
    try {
      const res = await attendanceApi.checkOut()
      setCheckOut(res)
      if (!checkIn) setCheckIn({
        comRecId: res.comRecId, workDate: res.workDate, checkInAt: res.checkInAt,
        checkInIp: res.checkOutIp, isOffsite: res.isOffsite,
        checkInStatus: 'ON_TIME', holidayReason: res.holidayReason,
      })
      const label = CHECK_OUT_STATUS_LABEL[res.checkOutStatus].label
      setModal({ type: 'success', message: `퇴근 완료 · ${toHHmm(res.checkOutAt)} (${label})` })
    } catch (e: unknown) {
      setModal({ type: 'error', message: extractCommuteError(e) ?? '퇴근 체크에 실패했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const statusBadge = (() => {
    if (checkOut) {
      const s = CHECK_OUT_STATUS_LABEL[checkOut.checkOutStatus]
      return { label: s.label, color: s.color }
    }
    if (checkIn) {
      const s = CHECK_IN_STATUS_LABEL[checkIn.checkInStatus]
      return { label: s.label, color: s.color }
    }
    return { label: '미출근', color: 'bg-gray-100 text-gray-500 border-gray-200' }
  })()

  const timeText = checkOut
    ? `출근 ${toHHmm(checkOut.checkInAt)} · 퇴근 ${toHHmm(checkOut.checkOutAt)}`
    : checkIn
      ? `출근 ${toHHmm(checkIn.checkInAt)}`
      : '-'

  const offsite = (checkOut?.isOffsite ?? checkIn?.isOffsite) === true
  const holidayReason = (checkOut?.holidayReason ?? checkIn?.holidayReason) ?? null

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
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <span className={`inline-block px-3 py-1 text-sm font-bold rounded-full border ${statusBadge.color}`}>{statusBadge.label}</span>
                  {offsite && <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded-full border bg-yellow-50 text-yellow-700 border-yellow-200">근무지 외</span>}
                  {holidayReason && <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded-full border bg-purple-50 text-purple-600 border-purple-200">{HOLIDAY_REASON_LABEL[holidayReason]}</span>}
                </div>
                <p className="text-xs text-gray-500">{timeText}</p>
                <div className="flex gap-3 w-full mt-2">
                  <button onClick={handleCheckIn} disabled={!!checkIn || loading}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${!checkIn && !loading ? 'bg-[#1D9E75] text-white hover:bg-[#178a65]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                    <i className="fas fa-sign-in-alt mr-1"></i>출근
                  </button>
                  <button onClick={handleCheckOut} disabled={!checkIn || !!checkOut || loading}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${checkIn && !checkOut && !loading ? 'bg-[#1D9E75] text-white hover:bg-[#178a65]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                    <i className="fas fa-sign-out-alt mr-1"></i>퇴근
                  </button>
                </div>
                <button onClick={() => setLeaveApplyOpen(true)}
                  className="w-full py-2.5 border border-[#1D9E75] text-[#1D9E75] text-sm font-bold rounded-lg hover:bg-[#E1F5EE] transition-colors">
                  <i className="fas fa-file-signature mr-1"></i>신청
                </button>
                {holidayReason && (
                  <p className="text-[11px] text-purple-600 text-center">휴일 근무 시 초과근무 신청이 필요합니다.</p>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                <span>이번 달 지각 -</span>
                <span>초과근무 -</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {leaveApplyOpen && (
        <LeaveApplyModal
          onClose={() => setLeaveApplyOpen(false)}
          onSubmitToApproval={(data: LeaveApplyData) => {
            setLeaveApplyOpen(false)
            navigate('/approval', {
              state: {
                openForm: { name: '휴가신청', folder: '인사', retention: '5', formCode: 'VACATION_REQUEST' },
                prefill: {
                  formCode: 'VACATION_REQUEST',
                  infoId: data.infoId,
                  vacReqStartat: data.vacReqStartat,
                  vacReqEndat: data.vacReqEndat,
                  vacReqUseDay: data.totalDays,
                  vacReqReason: data.vacReqReason,
                },
                docDataOverride: {
                  infoId: String(data.infoId),
                  vacReqStartat: data.vacReqStartat,
                  vacReqEndat: data.vacReqEndat,
                  vacReqUseDay: String(data.totalDays),
                  vacReqReason: data.vacReqReason,
                },
                leaveData: data,
              },
            })
          }}
        />
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[360px] p-6 text-center">
            <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${modal.type === 'success' ? 'bg-[#E1F5EE]' : 'bg-red-50'}`}>
              <i className={`fas ${modal.type === 'success' ? 'fa-check text-[#1D9E75]' : 'fa-times text-red-500'} text-[20px]`} />
            </div>
            <p className="text-[14px] font-semibold text-gray-900 mb-1">{modal.type === 'success' ? '완료' : '오류'}</p>
            <p className="text-[13px] text-gray-500 mb-5">{modal.message}</p>
            <button onClick={() => setModal(null)}
              className="px-6 py-2 bg-[#1D9E75] text-white text-[13px] font-medium rounded-lg hover:bg-[#178a65] transition-colors">확인</button>
          </div>
        </div>
      )}
    </div>
  )
}

function extractCommuteError(e: unknown): string | undefined {
  if (typeof e === 'object' && e !== null && 'response' in e) {
    const res = (e as { response?: { data?: { message?: string; errorCode?: string; code?: string } } }).response
    const code = res?.data?.errorCode ?? res?.data?.code
    if (code === 'COMMUTE_ALREADY_CHECKED_IN') return '이미 오늘 출근 체크가 완료되었습니다.'
    if (code === 'COMMUTE_ALREADY_CHECKED_OUT') return '이미 오늘 퇴근 체크가 완료되었습니다.'
    if (code === 'COMMUTE_NOT_CHECKED_IN') return '오늘 출근 기록이 없어 퇴근 체크를 할 수 없습니다.'
    if (code === 'EMPLOYEE_WORK_GROUP_NOT_ASSIGNED') return '근무 그룹이 배정되지 않았습니다. 관리자에게 문의하세요.'
    if (code === 'EMPLOYEE_NOT_FOUND') return '사원 정보를 찾을 수 없습니다.'
    return res?.data?.message
  }
  return undefined
}
