import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { attendanceApi, type CheckInRes, type CheckOutRes, type WorkStatus, type HolidayReason, type MyMonthlyAttendanceSummary } from '../../api/attendance'
import { alarmApi, type AlarmItem } from '../../api/alarm'
import { approvalApi } from '../../api/approval'
import { openApprovalWindow } from '../../utils/approvalWindow'
import CopilotPanel from '../../components/copilot/CopilotPanel'

// BE 알림이 보내는 경로(/attendance/my, /attendance/admin 등)를 FE 라우트로 정규화.
function canonicalizeAlarmLink(link: string): string {
  const [path, query] = link.split('?', 2)
  const qs = query ? `?${query}` : ''
  if (path === '/attendance/my') return `/attendance?tab=attendance${qs ? '&' + qs.slice(1) : ''}`
  if (path === '/attendance/admin' || path.startsWith('/attendance/admin/')) {
    return `/attendance-admin${qs}`
  }
  return link
}

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

/* ── 인라인 SVG 아이콘 ── */
type IconProps = { className?: string }
const Icon = {
  User: ({ className = '' }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Bell: ({ className = '' }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  ),
  Fingerprint: ({ className = '' }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
      <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
      <path d="M8.65 22c.21-.66.45-1.32.57-2" />
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
      <path d="M2 16h.01" />
      <path d="M21.8 16c.2-2 .131-5.354 0-6" />
      <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
    </svg>
  ),
  LogIn: ({ className = '' }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  ),
  LogOut: ({ className = '' }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  FileEdit: ({ className = '' }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 17.5l5-5" />
    </svg>
  ),
  Check: ({ className = '' }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  X: ({ className = '' }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Briefcase: ({ className = '' }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Clipboard: ({ className = '' }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M8 12h8" />
      <path d="M8 16h6" />
    </svg>
  ),
  UserTie: ({ className = '' }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="7" r="4" />
      <path d="M5 22v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
      <path d="M12 11v3l-1 2 1 6 1-6-1-2" />
    </svg>
  ),
  Calendar: ({ className = '' }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Settings: ({ className = '' }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
}

/* 알림 타입 → 아이콘 + 컬러 매핑 */
function alarmIconFor(alarmType: string, alarmRefType?: string) {
  const t = (alarmType || '').toUpperCase()
  const r = (alarmRefType || '').toUpperCase()
  if (t === 'APPROVAL' || r === 'APPROVAL_DOCUMENT')
    return { Cmp: Icon.FileEdit, bg: 'bg-[#E1F5EE]', fg: 'text-[#1D9E75]' }
  if (t === 'ATTENDANCE' || r.includes('COMMUTE'))
    return { Cmp: Icon.Briefcase, bg: 'bg-amber-50', fg: 'text-amber-600' }
  if (t === 'BOARD')
    return { Cmp: Icon.Clipboard, bg: 'bg-sky-50', fg: 'text-sky-600' }
  if (t === 'HR')
    return { Cmp: Icon.UserTie, bg: 'bg-violet-50', fg: 'text-violet-600' }
  if (r.includes('SHARE') || r.includes('CALENDAR'))
    return { Cmp: Icon.Calendar, bg: 'bg-rose-50', fg: 'text-rose-500' }
  return { Cmp: Icon.Settings, bg: 'bg-gray-100', fg: 'text-gray-500' }
}
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

      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        {/* 왼쪽: 달력 */}
        <div className="shrink-0 w-full md:w-[380px]">
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
        <div className="flex-1 min-w-0 md:border-l border-gray-100 md:pl-4 pt-3 md:pt-0 border-t md:border-t-0 flex flex-col">
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
  const [monthlyTab, setMonthlyTab] = useState<'late' | 'overtime' | null>(null)
  const [monthly, setMonthly] = useState<MyMonthlyAttendanceSummary | null>(null)
  const [recentAlarms, setRecentAlarms] = useState<AlarmItem[]>([])
  const [approvalWaiting, setApprovalWaiting] = useState(0)

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

  useEffect(() => {
    let cancelled = false
    approvalApi.getWaitingCount()
      .then(({ data }) => { if (!cancelled) setApprovalWaiting(data.waiting) })
      .catch(() => { if (!cancelled) setApprovalWaiting(0) })
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
    <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-white">
      <div className="max-w-[1820px] mx-auto flex gap-4 md:gap-6 items-start justify-center">

        {/* 좌측: 기존 대시보드 위젯 영역 (원래 폭 유지) */}
        <div className="flex-1 min-w-0 max-w-[1400px] space-y-4 md:space-y-6">

        {/* 상단: 사원카드 + 최근 알림 */}
        <div className="grid grid-cols-12 gap-6 items-stretch">
          {/* 사용자 정보 & 결재 카드 */}
          <div className="col-span-12 lg:col-span-3">
            <div className="card p-6 h-full flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full mb-4 flex items-center justify-center">
                <Icon.User className="w-10 h-10 text-gray-400" />
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
                <button
                  type="button"
                  onClick={() => navigate('/approval')}
                  className="w-full bg-[#E1F5EE] p-3 rounded-lg border border-[#9FE1CB] flex items-center justify-between hover:bg-[#d3efe3] transition-colors"
                >
                  <p className="text-sm text-[#1D9E75] font-bold">전자결재</p>
                  <p className="text-lg font-bold text-[#1D9E75]">{approvalWaiting}<span className="text-xs ml-1">건</span></p>
                </button>
              </div>
            </div>
          </div>

          {/* 최근 알림 (최대 5건 표시) */}
          <div className="col-span-12 lg:col-span-9">
            <div className="card p-6 h-full flex flex-col">
              <h3 className="font-bold text-gray-800 pb-3 mb-4 flex items-center border-b border-[#e5e7eb]">
                <Icon.Bell className="w-4 h-4 mr-2 text-[#1D9E75]" />
                최근 알림
              </h3>
              <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {recentAlarms.length === 0 ? (
                  <li className="text-sm text-gray-400 text-center py-4">최근 알림이 없습니다.</li>
                ) : (
                  recentAlarms.slice(0, 5).map((a) => {
                    const { Cmp: TypeIcon, bg, fg } = alarmIconFor(a.alarmType, a.alarmRefType)
                    return (
                      <li key={a.alarmId}>
                        <button
                          type="button"
                          onClick={() => {
                            if (!a.alarmIsRead) {
                              alarmApi.markAsRead(a.alarmId).catch(() => undefined)
                              setRecentAlarms((prev) => prev.map((x) => x.alarmId === a.alarmId ? { ...x, alarmIsRead: true } : x))
                            }
                            const refType = (a.alarmRefType || '').toUpperCase()
                            const isShareRelated = refType.includes('SHARE') || refType === 'INTEREST_CALENDAR_REQUEST'
                            if (a.alarmRefType === 'APPROVAL_DOCUMENT' && a.alarmRefId) {
                              openApprovalWindow({ viewDocId: a.alarmRefId })
                            } else if (isShareRelated) {
                              navigate('/calendar')
                            } else if (a.alarmLink) {
                              navigate(canonicalizeAlarmLink(a.alarmLink))
                            }
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-gray-50 ${!a.alarmIsRead ? 'bg-[#f0faf6]/40' : ''}`}
                        >
                          <div className={`w-6 h-6 rounded-full ${bg} ${fg} flex items-center justify-center shrink-0`}>
                            <TypeIcon className="w-3 h-3" />
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {!a.alarmIsRead && <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75] shrink-0" />}
                            <p className={`text-sm truncate ${a.alarmIsRead ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
                              {a.alarmTitle}
                            </p>
                          </div>
                          <span className="text-[11px] text-gray-400 shrink-0">{alarmTimeAgo(a.createdAt)}</span>
                        </button>
                      </li>
                    )
                  })
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
              <h3 className="font-bold text-gray-800 pb-3 mb-4 flex items-center border-b border-[#e5e7eb]">
                <Icon.Fingerprint className="w-4 h-4 mr-2 text-[#1D9E75]" />
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
                    className={`flex-1 inline-flex items-center justify-center gap-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${!checkedIn && !loading ? 'border border-[#1D9E75] text-[#1D9E75] hover:bg-[#E1F5EE]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                    <Icon.LogIn className="w-3.5 h-3.5" />출근
                  </button>
                  <button onClick={handleCheckOut} disabled={!checkedIn || checkedOut || loading}
                    className={`flex-1 inline-flex items-center justify-center gap-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${checkedIn && !checkedOut && !loading ? 'border border-[#1D9E75] text-[#1D9E75] hover:bg-[#E1F5EE]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                    <Icon.LogOut className="w-3.5 h-3.5" />퇴근
                  </button>
                </div>
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

      {monthlyTab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMonthlyTab(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[min(480px,calc(100vw-24px))] max-h-[70vh] flex flex-col">
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
          <div className="relative bg-white rounded-xl shadow-xl w-[min(360px,calc(100vw-24px))] p-6 text-center">
            <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${modal.type === 'success' ? 'bg-[#E1F5EE]' : 'bg-red-50'}`}>
              {modal.type === 'success'
                ? <Icon.Check className="w-5 h-5 text-[#1D9E75]" />
                : <Icon.X className="w-5 h-5 text-red-500" />}
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
