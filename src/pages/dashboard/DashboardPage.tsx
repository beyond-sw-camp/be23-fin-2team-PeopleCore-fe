import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { attendanceApi, type CheckInRes, type CheckOutRes, type WorkStatus, type HolidayReason, type MyMonthlyAttendanceSummary } from '../../api/attendance'
import { alarmApi, type AlarmItem } from '../../api/alarm'
import LeaveApplyModal, { type LeaveApplyData } from '../attendance/components/LeaveApplyModal'
import { openApprovalWindow } from '../../utils/approvalWindow'
import CopilotPanel from '../../components/copilot/CopilotPanel'

const CHECK_IN_LABEL: Record<WorkStatus, { label: string; color: string }> = {
  NORMAL: { label: '정시 출근', color: 'bg-[#E1F5EE] text-[#1D9E75] border-[#1D9E75]/30' },
  LATE: { label: '지각', color: 'bg-red-50 text-red-600 border-red-200' },
  EARLY_LEAVE: { label: '조퇴', color: 'bg-orange-50 text-orange-600 border-orange-200' },
  LATE_AND_EARLY: { label: '지각+조퇴', color: 'bg-red-50 text-red-600 border-red-200' },
  HOLIDAY_WORK: { label: '휴일 출근', color: 'bg-purple-50 text-purple-600 border-purple-200' },
  AUTO_CLOSED: { label: '자동마감', color: 'bg-purple-50 text-purple-600 border-purple-200' },
  ABSENT: { label: '결근', color: 'bg-gray-200 text-gray-700 border-gray-300' },
}

const CHECK_OUT_LABEL: Record<WorkStatus, { label: string; color: string }> = {
  NORMAL: { label: '정시 퇴근', color: 'bg-[#E1F5EE] text-[#1D9E75] border-[#1D9E75]/30' },
  LATE: { label: '지각', color: 'bg-red-50 text-red-600 border-red-200' },
  EARLY_LEAVE: { label: '조퇴', color: 'bg-orange-50 text-orange-600 border-orange-200' },
  LATE_AND_EARLY: { label: '지각+조퇴', color: 'bg-red-50 text-red-600 border-red-200' },
  HOLIDAY_WORK: { label: '휴일 퇴근', color: 'bg-purple-50 text-purple-600 border-purple-200' },
  AUTO_CLOSED: { label: '자동마감', color: 'bg-purple-50 text-purple-600 border-purple-200' },
  ABSENT: { label: '결근', color: 'bg-gray-200 text-gray-700 border-gray-300' },
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
    <div className="card p-4 h-full min-h-[380px] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-gray-900 tracking-tight">{year}년 {month + 1}월</span>
        <div className="flex gap-0.5">
          <button onClick={prevMonth} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-[#E1F5EE] hover:text-[#1D9E75] transition-colors text-sm">‹</button>
          <button onClick={nextMonth} className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:bg-[#E1F5EE] hover:text-[#1D9E75] transition-colors text-sm">›</button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* 왼쪽: 달력 */}
        <div className="shrink-0" style={{ width: '380px' }}>
          <div className="grid grid-cols-7 text-center mb-1">
            {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d, i) => (
              <div key={d} className={`text-[10px] font-semibold tracking-wider py-0.5 ${i === 0 ? 'text-red-400' : 'text-gray-400'}`}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 text-center">
            {cells.map((cell, i) => (
              <div key={i} className="flex items-center justify-center py-1">
                <div className="relative">
                  <div
                    className={`w-[40px] h-[40px] flex items-center justify-center rounded-full text-[13px] cursor-pointer transition-colors ${
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

const fmtHmMin = (min: number) => {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function alarmTimeAgo(iso: string): string {
  const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diffSec < 60) return '방금 전'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`
  return `${Math.floor(diffSec / 86400)}일 전`
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [checkIn, setCheckIn] = useState<CheckInRes | null>(null)
  const [checkOut, setCheckOut] = useState<CheckOutRes | null>(null)
  const [todayIn, setTodayIn] = useState<string | null>(null)
  const [todayOut, setTodayOut] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [leaveApplyOpen, setLeaveApplyOpen] = useState(false)
  const [monthlyTab, setMonthlyTab] = useState<'late' | 'overtime' | null>(null)
  const [monthly, setMonthly] = useState<MyMonthlyAttendanceSummary | null>(null)
  const [recentAlarms, setRecentAlarms] = useState<AlarmItem[]>([])

  useEffect(() => {
    let cancelled = false
    attendanceApi.getMyWeeklySummary()
      .then((res) => {
        if (cancelled) return
        setTodayIn(res.today.checkIn)
        setTodayOut(res.today.checkOut)
      })
      .catch(() => { /* 최초 조회 실패 시 버튼 액션으로만 상태 갱신 */ })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    attendanceApi.getMyMonthlySummary()
      .then((res) => { if (!cancelled) setMonthly(res) })
      .catch(() => { if (!cancelled) setMonthly(null) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    alarmApi.getRecent()
      .then((res) => { if (!cancelled) setRecentAlarms(res.data) })
      .catch(() => { if (!cancelled) setRecentAlarms([]) })
    return () => { cancelled = true }
  }, [])

  const handleCheckIn = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await attendanceApi.checkIn()
      setCheckIn(res)
      setTodayIn(toHHmm(res.checkInAt))
      const label = CHECK_IN_LABEL[res.workStatus].label
      setModal({ type: 'success', message: `출근 완료 · ${toHHmm(res.checkInAt)} (${label})` })
    } catch (e: unknown) {
      setModal({ type: 'error', message: extractCommuteError(e) ?? '출근 체크에 실패했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await attendanceApi.checkOut()
      setCheckOut(res)
      setTodayOut(toHHmm(res.checkOutAt))
      if (!checkIn) setCheckIn({
        comRecId: res.comRecId, workDate: res.workDate, checkInAt: res.checkInAt,
        checkInIp: res.checkOutIp,
        workStatus: res.workStatus, holidayReason: res.holidayReason,
      })
      if (!todayIn) setTodayIn(toHHmm(res.checkInAt))
      const label = CHECK_OUT_LABEL[res.workStatus].label
      setModal({ type: 'success', message: `퇴근 완료 · ${toHHmm(res.checkOutAt)} (${label})` })
    } catch (e: unknown) {
      setModal({ type: 'error', message: extractCommuteError(e) ?? '퇴근 체크에 실패했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const checkedIn = checkIn !== null || todayIn !== null
  const checkedOut = checkOut !== null || todayOut !== null

  const statusBadge = (() => {
    if (checkOut) {
      const s = CHECK_OUT_LABEL[checkOut.workStatus]
      return { label: s.label, color: s.color }
    }
    if (checkIn) {
      const s = CHECK_IN_LABEL[checkIn.workStatus]
      return { label: s.label, color: s.color }
    }
    if (checkedOut) return { label: '퇴근 완료', color: 'bg-gray-100 text-gray-700 border-gray-200' }
    if (checkedIn) return { label: '근무 중', color: 'bg-[#E1F5EE] text-[#1D9E75] border-[#1D9E75]/30' }
    return { label: '미출근', color: 'bg-gray-100 text-gray-500 border-gray-200' }
  })()

  const inText = checkOut ? toHHmm(checkOut.checkInAt) : checkIn ? toHHmm(checkIn.checkInAt) : todayIn
  const outText = checkOut ? toHHmm(checkOut.checkOutAt) : todayOut
  const timeText = outText
    ? `출근 ${inText ?? '-'} · 퇴근 ${outText}`
    : inText
      ? `출근 ${inText}`
      : '-'

  const holidayReason = (checkOut?.holidayReason ?? checkIn?.holidayReason) ?? null

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-white">
      <div className="max-w-[1820px] mx-auto flex gap-6 items-start justify-center">

        {/* 좌측: 기존 대시보드 위젯 영역 (원래 폭 유지) */}
        <div className="flex-1 min-w-0 max-w-[1400px] space-y-6">

        {/* 상단: 사원카드 + 최근 알림 */}
        <div className="grid grid-cols-12 gap-6 items-stretch">
          {/* 사용자 정보 & 결재 카드 */}
          <div className="col-span-12 lg:col-span-3">
            <div className="card p-6 h-full flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full mb-4 flex items-center justify-center">
                <i className="fas fa-user text-3xl text-gray-400"></i>
              </div>
              <h2 className="font-bold text-lg">{user?.empName ?? '-'}</h2>
              <p className="text-xs text-gray-500 mt-1">
                {user?.empRole === 'HR_SUPER_ADMIN' ? '최고관리자' : user?.empRole === 'HR_ADMIN' ? '인사관리자' : '일반사원'}
              </p>
              <div className="text-xs text-gray-600 mt-2 space-y-0.5">
                <p>{user?.deptName ?? '미배정'}</p>
                <p>
                  <span>{user?.gradeName ?? '미배정'}</span>
                  <span className="text-gray-300 mx-1">·</span>
                  <span>{user?.titleName ?? '미배정'}</span>
                </p>
              </div>

              <div className="space-y-3 w-3/4 mx-auto mt-6">
                <div className="bg-[#E1F5EE] p-3 rounded-lg border border-[#9FE1CB] flex items-center justify-between">
                  <p className="text-sm text-[#1D9E75] font-bold">전자결재</p>
                  <p className="text-lg font-bold text-[#1D9E75]">0<span className="text-xs ml-1">건</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* 최근 알림 (최대 5건 표시) */}
          <div className="col-span-12 lg:col-span-9">
            <div className="card p-6 h-full flex flex-col">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-bell mr-2 text-[#1D9E75]"></i>
                최근 알림
              </h3>
              <ul className="flex-1 space-y-1.5 overflow-y-auto">
                {recentAlarms.length === 0 ? (
                  <li className="text-sm text-gray-400 text-center py-4">최근 알림이 없습니다.</li>
                ) : (
                  recentAlarms.slice(0, 5).map((a) => (
                    <li key={a.alarmId}>
                      <button
                        type="button"
                        onClick={() => {
                          if (!a.alarmIsRead) alarmApi.markAsRead(a.alarmId).catch(() => undefined)
                          if (a.alarmLink) navigate(a.alarmLink)
                        }}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {!a.alarmIsRead && <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] shrink-0" />}
                          <span className={`text-sm truncate ${a.alarmIsRead ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>
                            {a.alarmTitle}
                          </span>
                          <span className="text-xs text-gray-400 truncate">{a.alarmContent}</span>
                        </div>
                        <span className="text-[11px] text-gray-400 shrink-0">{alarmTimeAgo(a.createdAt)}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* 하단: 출퇴근 + 캘린더 */}
        <div className="grid grid-cols-12 gap-6 items-stretch">
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
                  {holidayReason && <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded-full border bg-purple-50 text-purple-600 border-purple-200">{HOLIDAY_REASON_LABEL[holidayReason]}</span>}
                </div>
                <p className="text-xs text-gray-500">{timeText}</p>
                <div className="flex gap-3 w-full max-w-[320px] mt-2">
                  <button onClick={handleCheckIn} disabled={checkedIn || loading}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${!checkedIn && !loading ? 'border border-[#1D9E75] text-[#1D9E75] hover:bg-[#E1F5EE]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                    <i className="fas fa-sign-in-alt mr-1"></i>출근
                  </button>
                  <button onClick={handleCheckOut} disabled={!checkedIn || checkedOut || loading}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${checkedIn && !checkedOut && !loading ? 'bg-[#1D9E75] text-white hover:bg-[#178a65]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                    <i className="fas fa-sign-out-alt mr-1"></i>퇴근
                  </button>
                </div>
                <button onClick={() => setLeaveApplyOpen(true)}
                  className="w-full max-w-[320px] py-2.5 border border-[#1D9E75] text-[#1D9E75] text-sm font-bold rounded-lg hover:bg-[#E1F5EE] transition-colors">
                  <i className="fas fa-file-signature mr-1"></i>신청
                </button>
                {holidayReason && (
                  <p className="text-[11px] text-purple-600 text-center">휴일 근무 시 초과근무 신청이 필요합니다.</p>
                )}
              </div>
              <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setMonthlyTab('late')}
                  className="text-gray-500 hover:text-[#1D9E75] transition-colors"
                >
                  이번 달 지각 <span className="font-bold text-gray-900">{monthly?.lateCount ?? 0}</span>건
                </button>
                <button
                  onClick={() => setMonthlyTab('overtime')}
                  className="text-gray-500 hover:text-[#1D9E75] transition-colors"
                >
                  초과근무 <span className="font-bold text-gray-900">{fmtHmMin(monthly?.overtimeMinutes ?? 0)}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 캘린더 */}
          <div className="col-span-12 lg:col-span-8">
            <Calendar />
          </div>
        </div>

        </div>
        {/* 우측: AI 코파일럿 — xl(1280px+) 이상에서 노출.
            좁은 화면에서는 헤더의 ✨ 아이콘 → drawer 로 접근. */}
        <aside className="hidden xl:block w-[320px] 2xl:w-[360px] shrink-0 sticky top-0 h-[calc(100vh-88px)]">
          <div className="card h-full overflow-hidden">
            <CopilotPanel className="h-full" />
          </div>
        </aside>
      </div>

      {leaveApplyOpen && (
        <LeaveApplyModal
          onClose={() => setLeaveApplyOpen(false)}
          onSubmitToApproval={(data: LeaveApplyData) => {
            setLeaveApplyOpen(false)
            const today = new Date()
            const requestDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
            const orUnassigned = (v?: string) => (v && v.trim()) ? v : '미배정'
            const drafterPrefill = {
              title: `${user?.empName ?? ''} ${data.type} 신청서`.trim(),
              emp_name: user?.empName ?? '',
              emp_dept_name: orUnassigned(user?.deptName),
              emp_grade_name: orUnassigned(user?.gradeName),
              emp_title_name: orUnassigned(user?.titleName),
              request_date: requestDate,
              vacationTypeName: data.type,
            }
            openApprovalWindow({
              openForm: { name: '휴가신청', folder: '인사', retention: '5', formCode: 'VACATION_REQUEST' },
              prefill: {
                formCode: 'VACATION_REQUEST',
                infoId: data.infoId,
                vacReqDatesText: data.vacReqDatesText,
                // 화면 표시용 (백엔드 저장 안 됨 — buildRequest에서 strip)
                vacReqUseDay: data.vacReqUseDay,
                vacReqReason: data.vacReqReason,
                ...drafterPrefill,
              },
              docDataOverride: {
                infoId: data.infoId,
                vacReqDatesText: data.vacReqDatesText,
                vacReqItems: data.vacReqItems,
                vacReqReason: data.vacReqReason,
                ...drafterPrefill,
              },
              leaveData: data,
            }, data.attachments)
          }}
        />
      )}

      {monthlyTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMonthlyTab(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[480px] max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMonthlyTab('late')}
                  className={`text-sm font-bold pb-1 ${monthlyTab === 'late' ? 'text-[#1D9E75] border-b-2 border-[#1D9E75]' : 'text-gray-400'}`}
                >지각 {monthly?.lateCount ?? 0}건</button>
                <button
                  onClick={() => setMonthlyTab('overtime')}
                  className={`text-sm font-bold pb-1 ml-3 ${monthlyTab === 'overtime' ? 'text-[#1D9E75] border-b-2 border-[#1D9E75]' : 'text-gray-400'}`}
                >초과근무 {fmtHmMin(monthly?.overtimeMinutes ?? 0)}</button>
              </div>
              <button onClick={() => setMonthlyTab(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>
            {monthly?.yearMonth && (
              <div className="text-[11px] text-gray-400 px-5 pt-3">{monthly.yearMonth}</div>
            )}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {monthlyTab === 'late' ? (
                !monthly || monthly.lateDays.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">지각 기록이 없습니다.</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="text-gray-500">
                      <tr className="border-b border-gray-100">
                        <th className="py-2 text-left font-medium">날짜</th>
                        <th className="py-2 text-center font-medium">출근시각</th>
                        <th className="py-2 text-right font-medium">지각</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthly.lateDays.map((d) => (
                        <tr key={d.workDate} className="border-b border-gray-50">
                          <td className="py-2 text-gray-700">{d.workDate}</td>
                          <td className="py-2 text-center text-gray-700">{toHHmm(d.checkInAt)}</td>
                          <td className="py-2 text-right text-orange-600 font-semibold">{d.lateMinutes}분</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : (
                !monthly || monthly.overtimeDays.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">초과근무 기록이 없습니다.</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="text-gray-500">
                      <tr className="border-b border-gray-100">
                        <th className="py-2 text-left font-medium">날짜</th>
                        <th className="py-2 text-center font-medium">시작시각</th>
                        <th className="py-2 text-center font-medium">퇴근시각</th>
                        <th className="py-2 text-right font-medium">초과</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthly.overtimeDays.map((d) => (
                        <tr key={d.workDate} className="border-b border-gray-50">
                          <td className="py-2 text-gray-700">{d.workDate}</td>
                          <td className="py-2 text-center text-gray-700">{toHHmm(d.overtimeStartAt)}</td>
                          <td className="py-2 text-center text-gray-700">{toHHmm(d.checkOutAt)}</td>
                          <td className="py-2 text-right text-blue-600 font-semibold">{fmtHmMin(d.approvedOvertimeMinutes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
            </div>
          </div>
        </div>
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
