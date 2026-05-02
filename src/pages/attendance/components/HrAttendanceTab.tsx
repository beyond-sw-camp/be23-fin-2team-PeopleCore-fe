import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { attendanceApi, ATTENDANCE_CARD_LABEL, ATTENDANCE_CARD_BADGE, WEEKLY_WORK_STATUS_LABEL, type AttendanceCardType, type DailyCardItem, type DailyListItem, type EmploymentFilter, type PeriodListItem, type DayOfWeekEn } from '../../../api/attendance'
import { queryKeys } from '../../../lib/queryKeys'
import { SkeletonTableRows } from '../../../components/ui/Skeleton'

const DOW_KR: Record<DayOfWeekEn, string> = { MONDAY: '월', TUESDAY: '화', WEDNESDAY: '수', THURSDAY: '목', FRIDAY: '금', SATURDAY: '토', SUNDAY: '일' }
import { formatMinutes } from '../../../utils/minuteFormat'

// 주 최대 근무시간/경고 기준은 회사 초과근무 정책(GET /overtime/policy)에서 조회
// 정책 미설정 회사는 백엔드 defaultPolicy() (52/45) 가 내려옴

/* ══════════════════════════════════════
   타입
   ══════════════════════════════════════ */
type CategoryKey = '정상' | '지각' | '조퇴' | '휴가 중 출근' | '출퇴근 누락' | '1일 소정근로시간 미달' | '결근' | '미승인 초과근무' | '최대근무시간 초과'

const ABNORMAL_ONLY: ReadonlySet<AttendanceCardType> = new Set([
  'MAX_HOUR_EXCEED', 'UNAPPROVED_OT', 'ABSENT', 'MISSING_COMMUTE',
  'LATE', 'EARLY_LEAVE', 'VACATION_ATTEND', 'UNDER_MIN_HOUR',
])

const DISPLAY_ORDER: AttendanceCardType[] = [
  'MAX_HOUR_EXCEED',
  'UNAPPROVED_OT',
  'ABSENT',
  'MISSING_COMMUTE',
  'LATE',
  'EARLY_LEAVE',
  'VACATION_ATTEND',
  'UNDER_MIN_HOUR',
]
const DISPLAY_ORDER_INDEX = new Map<AttendanceCardType, number>(DISPLAY_ORDER.map((v, i) => [v, i]))

const CATEGORY_TO_CARD: Record<CategoryKey, AttendanceCardType> = {
  '정상': 'NORMAL',
  '지각': 'LATE',
  '조퇴': 'EARLY_LEAVE',
  '휴가 중 출근': 'VACATION_ATTEND',
  '출퇴근 누락': 'MISSING_COMMUTE',
  '1일 소정근로시간 미달': 'UNDER_MIN_HOUR',
  '결근': 'ABSENT',
  '미승인 초과근무': 'UNAPPROVED_OT',
  '최대근무시간 초과': 'MAX_HOUR_EXCEED',
}

const formatHm = (iso: string | null): string => {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const todayStr = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const shiftDate = (date: string, days: number): string => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 해당 날짜가 속한 주의 월요일
const mondayOf = (d: Date): Date => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dow = x.getDay() // 0(일)~6(토)
  const offset = dow === 0 ? -6 : 1 - dow
  x.setDate(x.getDate() + offset)
  return x
}

// "월 1일이 속한 주"를 N주차=1 로 라벨링
const weekLabel = (monday: Date): { year: number; month: number; weekNum: number; start: Date; end: Date } => {
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  // 해당 주의 소속 월 = 일요일의 월 (경계주 처리)
  const ownerYear = sunday.getFullYear()
  const ownerMonth = sunday.getMonth()
  const firstOfOwner = new Date(ownerYear, ownerMonth, 1)
  const firstMon = mondayOf(firstOfOwner)
  const diffDays = Math.round((monday.getTime() - firstMon.getTime()) / (1000 * 60 * 60 * 24))
  const weekNum = Math.floor(diffDays / 7) + 1
  return { year: ownerYear, month: ownerMonth + 1, weekNum, start: monday, end: sunday }
}

const fmtMD = (d: Date): string => `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`

/* ══════════════════════════════════════
   전사 근태현황 탭
   ══════════════════════════════════════ */
export default function HrAttendanceTab({ initialDate }: { initialDate?: string } = {}) {
  const [viewMode, setViewMode] = useState<'일자별' | '기간별' | '집계'>('일자별')
  const [aggregateTab, setAggregateTab] = useState<'주간현황' | '부서별현황' | '초과근무'>('주간현황')
  const [weekAnchor, setWeekAnchor] = useState<Date>(() => mondayOf(initialDate ? new Date(initialDate) : new Date()))
  const [date, setDate] = useState<string>(initialDate ?? todayStr())
  const [employmentFilter, setEmploymentFilter] = useState<EmploymentFilter>('ACTIVE')
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [perPage, setPerPage] = useState(50)
  const [page, setPage] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<DailyCardItem | null>(null)

  const EMPTY_COUNTS: Record<AttendanceCardType, number> = {
    NORMAL: 0, LATE: 0, EARLY_LEAVE: 0, VACATION_ATTEND: 0,
    MISSING_COMMUTE: 0, UNDER_MIN_HOUR: 0, UNAPPROVED_OT: 0, MAX_HOUR_EXCEED: 0, ABSENT: 0,
  }

  const [openPopover, setOpenPopover] = useState<{
    empId: number
    anchorRect: { top: number; left: number; right: number; bottom: number; width: number; height: number }
    statuses: AttendanceCardType[]
  } | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    if (!openPopover) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPopoverPos(null)
      return
    }
    if (!popoverRef.current) return
    const popRect = popoverRef.current.getBoundingClientRect()
    const { anchorRect } = openPopover
    const margin = 8
    const vw = window.innerWidth
    const vh = window.innerHeight
    const w = popRect.width
    const h = popRect.height

    let left = anchorRect.right + margin
    let top = anchorRect.top + anchorRect.height / 2 - h / 2

    if (left + w > vw - margin) {
      const leftSide = anchorRect.left - margin - w
      if (leftSide >= margin) {
        left = leftSide
      } else {
        left = Math.min(anchorRect.left, vw - w - margin)
        top = anchorRect.bottom + margin
      }
    }
    top = Math.max(margin, Math.min(top, vh - h - margin))
    setPopoverPos({ top, left })
  }, [openPopover])

  useEffect(() => {
    if (!openPopover) return
    const close = () => setOpenPopover(null)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [openPopover])

  // keyword debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setKeyword(searchInput.trim())
      setPage(0)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const dailyEnabled = viewMode === '일자별'
  const summaryQuery = useQuery({
    queryKey: queryKeys.attendance.admin({ scope: 'dailySummary', date, employmentFilter }),
    queryFn: () => attendanceApi.getDailySummary(date, employmentFilter),
    enabled: dailyEnabled,
  })
  const listQuery = useQuery({
    queryKey: queryKeys.attendance.admin({ scope: 'dailyList', date, employmentFilter, keyword, page, size: perPage }),
    queryFn: () => attendanceApi.getDailyList({ date, employmentFilter, keyword: keyword || undefined, page, size: perPage }),
    enabled: dailyEnabled,
  })
  const summaryCounts = summaryQuery.data?.counts ?? EMPTY_COUNTS
  const listContent = listQuery.data?.content ?? []
  const listTotal = listQuery.data?.totalElements ?? 0
  const listLoading = dailyEnabled && (summaryQuery.isPending || listQuery.isPending)

  const cardQuery = useQuery({
    queryKey: queryKeys.attendance.admin({
      scope: 'dailyCard', date, employmentFilter,
      cardType: selectedCategory ? CATEGORY_TO_CARD[selectedCategory] : null,
    }),
    queryFn: () => {
      const cardType = CATEGORY_TO_CARD[selectedCategory!]
      return attendanceApi.getDailyCard({ date, cardType, employmentFilter, page: 0, size: 100 })
    },
    enabled: !!selectedCategory,
  })
  const cardContent = selectedCategory ? (cardQuery.data?.content ?? []) : []
  const cardLoading = !!selectedCategory && cardQuery.isPending

  const policyQuery = useQuery({
    queryKey: queryKeys.attendance.overtimePolicy(),
    queryFn: () => attendanceApi.getOvertimePolicy(),
  })
  const policy = policyQuery.data ?? null
  const maxWeeklyHours = policy ? Math.floor(policy.otPolicyWeeklyMaxMinutes / 60) : 52
  const warningHours = policy ? Math.floor(policy.otPolicyWarningMinutes / 60) : 45

  const historyQuery = useQuery({
    queryKey: queryKeys.attendance.admin({
      scope: 'employeeHistory',
      empId: selectedEmployee?.empId ?? null,
      date,
      cardType: selectedCategory ? CATEGORY_TO_CARD[selectedCategory] : null,
    }),
    queryFn: () => attendanceApi.getEmployeeHistory({
      empId: selectedEmployee!.empId,
      date,
      cardType: selectedCategory ? CATEGORY_TO_CARD[selectedCategory] : undefined,
      page: 0,
      size: 100,
    }),
    enabled: !!selectedEmployee,
  })
  const historyHeader = selectedEmployee ? (historyQuery.data?.header ?? null) : null
  const historyRows = selectedEmployee ? (historyQuery.data?.history.content ?? []) : []
  const historyLoading = !!selectedEmployee && historyQuery.isPending

  // 기간별 뷰 state
  const [periodStart, setPeriodStart] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() - 6)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [periodEnd, setPeriodEnd] = useState<string>(todayStr())

  const weekStartStr = useMemo(() => {
    const y = weekAnchor.getFullYear()
    const m = String(weekAnchor.getMonth() + 1).padStart(2, '0')
    const dd = String(weekAnchor.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  }, [weekAnchor])

  const aggregateEnabled = viewMode === '집계'
  const headlineQuery = useQuery({
    queryKey: queryKeys.attendance.admin({ scope: 'aggregateHeadline', weekStartStr, employmentFilter }),
    queryFn: () => attendanceApi.getAggregateHeadline(weekStartStr, employmentFilter),
    enabled: aggregateEnabled,
  })
  const headline = headlineQuery.data ?? null

  const weeklyStatsQuery = useQuery({
    queryKey: queryKeys.attendance.admin({ scope: 'weeklyStats', weekStartStr, employmentFilter }),
    queryFn: () => attendanceApi.getWeeklyStats(weekStartStr, employmentFilter),
    enabled: aggregateEnabled && aggregateTab === '주간현황',
  })
  const weeklyStatsRaw = weeklyStatsQuery.data ?? []

  const deptSummaryQuery = useQuery({
    queryKey: queryKeys.attendance.admin({ scope: 'deptSummary', weekStartStr, employmentFilter }),
    queryFn: () => attendanceApi.getDeptSummary(weekStartStr, employmentFilter),
    enabled: aggregateEnabled && aggregateTab === '부서별현황',
  })
  const deptSummary = deptSummaryQuery.data ?? []

  const overtimeEmployeesQuery = useQuery({
    queryKey: queryKeys.attendance.admin({ scope: 'overtimeEmployees', weekStartStr, employmentFilter, keyword }),
    queryFn: () => attendanceApi.getOvertimeEmployees({ weekStart: weekStartStr, employmentFilter, keyword: keyword || undefined, page: 0, size: 100 }),
    enabled: aggregateEnabled && aggregateTab === '초과근무',
  })
  const overtimeEmployees = overtimeEmployeesQuery.data?.content ?? []

  const periodEnabled = viewMode === '기간별'
  const periodQuery = useQuery({
    queryKey: queryKeys.attendance.admin({ scope: 'periodList', start: periodStart, end: periodEnd, employmentFilter, keyword, page, size: perPage }),
    queryFn: () => attendanceApi.getPeriodList({ start: periodStart, end: periodEnd, employmentFilter, keyword: keyword || undefined, page, size: perPage }),
    enabled: periodEnabled,
  })
  const periodContent = periodQuery.data?.content ?? []
  const periodTotal = periodQuery.data?.totalElements ?? 0
  const periodLoading = periodEnabled && periodQuery.isPending

  const weeklyStats = useMemo(() =>
    weeklyStatsRaw.map((s) => ({
      date: fmtMD(new Date(s.date)),
      day: DOW_KR[s.dayOfWeek],
      totalEmp: s.totalEmp, normal: s.normal, late: s.late, earlyLeave: s.earlyLeave,
      absent: s.absent, onLeave: s.onLeave, overtime: s.overtime, attendRate: s.attendRate,
    })),
  [weeklyStatsRaw])

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 mb-4">전사 근태현황</h1>

      {/* 날짜 선택 */}
      <div className="flex items-center justify-center gap-3 mb-2">
        {viewMode === '일자별' ? (<>
          <button onClick={() => { setDate(shiftDate(date, -1)); setPage(0) }} className="text-gray-400 hover:text-gray-600"><i className="fas fa-chevron-left" /></button>
          <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setPage(0) }} className="bg-transparent text-[18px] font-bold text-gray-900 outline-none cursor-pointer" />
          <button onClick={() => { setDate(shiftDate(date, 1)); setPage(0) }} className="text-gray-400 hover:text-gray-600"><i className="fas fa-chevron-right" /></button>
          <button onClick={() => { setDate(todayStr()); setPage(0) }} className="text-[12px] text-gray-500 hover:text-[#1D9E75] ml-2">오늘</button>
        </>) : viewMode === '기간별' ? (<>
          <input type="date" value={periodStart} onChange={(e) => { setPeriodStart(e.target.value); setPage(0) }} className="bg-transparent text-[18px] font-bold text-gray-900 outline-none cursor-pointer" />
          <span className="text-[16px] text-gray-400">~</span>
          <input type="date" value={periodEnd} onChange={(e) => { setPeriodEnd(e.target.value); setPage(0) }} className="bg-transparent text-[18px] font-bold text-gray-900 outline-none cursor-pointer" />
        </>) : (() => {
          const wl = weekLabel(weekAnchor)
          const shiftWeek = (days: number) => {
            const next = new Date(weekAnchor)
            next.setDate(next.getDate() + days)
            setWeekAnchor(next)
          }
          return (<>
            <button onClick={() => shiftWeek(-7)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-chevron-left" /></button>
            <span className="text-[18px] font-bold text-gray-900">{wl.year}년 {String(wl.month).padStart(2, '0')}월 {wl.weekNum}주차</span>
            <span className="text-[12px] text-gray-500">({fmtMD(wl.start)} ~ {fmtMD(wl.end)})</span>
            <button onClick={() => shiftWeek(7)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-chevron-right" /></button>
            <button onClick={() => setWeekAnchor(mondayOf(new Date()))} className="text-[12px] text-gray-500 hover:text-[#1D9E75] ml-2">이번 주</button>
          </>)
        })()}
      </div>
      <div className="flex justify-end mb-4">
        <div className="flex border border-gray-300 rounded overflow-hidden">
          {(['일자별', '기간별', '집계'] as const).map((m) => (
            <button key={m} onClick={() => setViewMode(m)} className={`px-4 py-1.5 text-[12px] transition-colors ${viewMode === m ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{m}</button>
          ))}
        </div>
      </div>

      {viewMode === '집계' ? (<>
        {/* 요약 카드 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: '이번 주 출근율', value: headline ? `${headline.attendanceRate.toFixed(1)}%` : '-', color: 'text-[#1D9E75]' },
            { label: '이번 주 지각률', value: headline ? `${headline.lateRate.toFixed(1)}%` : '-', color: headline && headline.lateRate > 5 ? 'text-red-500' : 'text-gray-800' },
            { label: '결근', value: headline ? `${headline.absentCount}건` : '-', color: headline && headline.absentCount > 0 ? 'text-red-500' : 'text-gray-800' },
            { label: `${maxWeeklyHours}시간 초과`, value: headline ? `${headline.weeklyMaxExceedCount}명` : '-', color: headline && headline.weeklyMaxExceedCount > 0 ? 'text-red-600' : 'text-[#1D9E75]' },
          ].map((c) => (
            <div key={c.label} className="border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-[11px] text-gray-500 mb-1">{c.label}</div>
              <div className={`text-[22px] font-bold ${c.color}`}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* 집계 서브탭 */}
        <div className="flex items-center gap-2 mb-4">
          {(['주간현황', '부서별현황', '초과근무'] as const).map((t) => (
            <button key={t} onClick={() => setAggregateTab(t)}
              className={`px-4 py-1.5 text-[13px] rounded-full transition-colors ${aggregateTab === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* 주간현황 */}
        {aggregateTab === '주간현황' && (
          <table className="w-full text-[12px]">
            <thead><tr className="border-b-2 border-gray-900">
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">날짜</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">요일</th>
              <th className="px-3 py-2.5 text-center text-gray-700 font-medium">전체</th>
              <th className="px-3 py-2.5 text-center text-gray-700 font-medium">정상출근</th>
              <th className="px-3 py-2.5 text-center text-gray-700 font-medium">지각</th>
              <th className="px-3 py-2.5 text-center text-gray-700 font-medium">조퇴</th>
              <th className="px-3 py-2.5 text-center text-gray-700 font-medium">결근</th>
              <th className="px-3 py-2.5 text-center text-gray-700 font-medium">휴가</th>
              <th className="px-3 py-2.5 text-center text-gray-700 font-medium">초과근무</th>
              <th className="px-3 py-2.5 text-center text-gray-700 font-medium">출근율</th>
            </tr></thead>
            <tbody>
              {weeklyStats.length === 0 && (
                <tr><td colSpan={10} className="py-8 text-center text-[13px] text-gray-400">데이터가 없습니다</td></tr>
              )}
              {weeklyStats.map((d) => {
                const attend = d.attendRate
                return (
                  <tr key={d.date} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5 text-gray-800">{d.date}</td>
                    <td className="px-3 py-2.5 text-gray-600">{d.day}</td>
                    <td className="px-3 py-2.5 text-center text-gray-800">{d.totalEmp}</td>
                    <td className="px-3 py-2.5 text-center text-[#1D9E75] font-medium">{d.normal}</td>
                    <td className="px-3 py-2.5 text-center">{d.late > 0 ? <span className="text-orange-500 font-medium">{d.late}</span> : <span className="text-gray-400">0</span>}</td>
                    <td className="px-3 py-2.5 text-center">{d.earlyLeave > 0 ? <span className="text-yellow-600">{d.earlyLeave}</span> : <span className="text-gray-400">0</span>}</td>
                    <td className="px-3 py-2.5 text-center">{d.absent > 0 ? <span className="text-red-500 font-medium">{d.absent}</span> : <span className="text-gray-400">0</span>}</td>
                    <td className="px-3 py-2.5 text-center text-blue-500">{d.onLeave}</td>
                    <td className="px-3 py-2.5 text-center">{d.overtime > 0 ? <span className="text-orange-500">{d.overtime}</span> : <span className="text-gray-400">0</span>}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${attend >= 95 ? 'bg-green-50 text-green-700' : attend >= 90 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>{attend}%</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* 부서별현황 */}
        {aggregateTab === '부서별현황' && (
          <table className="w-full text-[12px]">
            <thead><tr className="border-b-2 border-gray-900">
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서</th>
              <th className="px-3 py-2.5 text-center text-gray-700 font-medium">인원</th>
              <th className="px-3 py-2.5 text-center text-gray-700 font-medium">출근율</th>
              <th className="px-3 py-2.5 text-center text-gray-700 font-medium">지각률</th>
              <th className="px-3 py-2.5 text-center text-gray-700 font-medium">결근</th>
              <th className="px-3 py-2.5 text-center text-gray-700 font-medium">평균 초과근무</th>
              <th className="px-3 py-2.5 text-center text-gray-700 font-medium">초과근무 인원</th>
              <th className="px-3 py-2.5 text-center text-gray-700 font-medium">주간 평균</th>
            </tr></thead>
            <tbody>
              {deptSummary.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-[13px] text-gray-400">데이터가 없습니다</td></tr>
              )}
              {deptSummary.map((d) => (
                <tr key={d.deptId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5 text-gray-800 font-medium">{d.deptName}</td>
                  <td className="px-3 py-2.5 text-center text-gray-600">{d.totalEmp}명</td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${d.attendRate >= 95 ? 'bg-[#1D9E75]' : 'bg-orange-400'}`} style={{ width: `${d.attendRate}%` }} />
                      </div>
                      <span className={`text-[11px] ${d.attendRate >= 95 ? 'text-[#1D9E75]' : 'text-orange-500'} font-medium`}>{d.attendRate}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center"><span className={d.lateRate > 5 ? 'text-red-500 font-medium' : 'text-gray-600'}>{d.lateRate}%</span></td>
                  <td className="px-3 py-2.5 text-center">{d.absentCount > 0 ? <span className="text-red-500 font-medium">{d.absentCount}건</span> : <span className="text-gray-400">0건</span>}</td>
                  <td className="px-3 py-2.5 text-center"><span className={d.avgOvertimeHours > 5 ? 'text-orange-500 font-medium' : 'text-gray-600'}>{d.avgOvertimeHours}h</span></td>
                  <td className="px-3 py-2.5 text-center text-gray-600">{d.overtimeCount}명</td>
                  <td className={`px-3 py-2.5 text-center font-semibold ${d.weeklyAvg > maxWeeklyHours ? 'text-red-500' : d.weeklyAvg > warningHours ? 'text-yellow-600' : 'text-gray-700'}`}>{d.weeklyAvg}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 초과근무 */}
        {aggregateTab === '초과근무' && (
          <div>
            <div className="flex items-center gap-3 mb-3 p-3 bg-orange-50 rounded-lg">
              <span className="text-[12px] text-orange-700">주 최대 근무시간: <strong>{maxWeeklyHours}시간</strong> | 경고 기준: <strong>{warningHours}시간</strong></span>
            </div>
            <table className="w-full text-[12px]">
              <thead><tr className="border-b-2 border-gray-900">
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사번</th>
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">이름</th>
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서</th>
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">직급</th>
                <th className="px-3 py-2.5 text-center text-gray-700 font-medium">주간 근무</th>
                <th className="px-3 py-2.5 text-center text-gray-700 font-medium">초과근무</th>
                <th className="px-3 py-2.5 text-center text-gray-700 font-medium">상태</th>
              </tr></thead>
              <tbody>
                {overtimeEmployees.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-[13px] text-gray-400">데이터가 없습니다</td></tr>
                )}
                {overtimeEmployees.map((e) => (
                  <tr key={e.empId} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${e.status === 'EXCEEDED' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-3 py-2.5 text-gray-500">{e.empNum}</td>
                    <td className="px-3 py-2.5 text-gray-800 font-medium">{e.empName}</td>
                    <td className="px-3 py-2.5 text-gray-600">{e.deptName ?? '-'}</td>
                    <td className="px-3 py-2.5 text-gray-600">{e.gradeName ?? '-'}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={e.weeklyWorkMinutes > e.weeklyMaxMinute ? 'text-red-500 font-semibold' : 'text-gray-800'}>{formatMinutes(e.weeklyWorkMinutes)}</span>
                      <span className="text-gray-400 text-[10px]"> / {formatMinutes(e.weeklyMaxMinute)}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center"><span className={e.overtimeMinutes > 12 * 60 ? 'text-red-500 font-semibold' : 'text-orange-500'}>{formatMinutes(e.overtimeMinutes)}</span></td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] ${e.status === 'NORMAL' ? 'bg-green-50 text-green-700' : e.status === 'WARNING' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>{WEEKLY_WORK_STATUS_LABEL[e.status]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>) : (<>

      {viewMode === '일자별' && (
      /* 요약 카드 3그룹 */
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* 근무 상태 */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="text-[12px] text-gray-500 mb-3 flex items-center gap-1"><i className="far fa-clock text-[10px]" /> 근무 상태</div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { label: '정상' as CategoryKey, value: summaryCounts.NORMAL, color: 'text-[#1D9E75] border-[#1D9E75]' },
            ].map((c) => (
              <div key={c.label} className="border border-gray-100 rounded-lg p-3 flex items-center justify-between hover:border-gray-300 transition-colors cursor-pointer" onClick={() => c.value > 0 && setSelectedCategory(c.label)}>
                <span className={`text-[11px] font-semibold border rounded px-1.5 py-0.5 ${c.color}`}>{c.label}</span>
                <div>
                  <span className={`text-[20px] font-bold text-gray-900 ${c.value > 0 ? 'hover:text-[#1D9E75] cursor-pointer' : ''}`}>{c.value}</span>
                  <span className="text-[12px] text-gray-500 ml-0.5">명</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 시간 및 기록 이상 */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="text-[12px] text-gray-500 mb-3 flex items-center gap-1"><i className="fas fa-exclamation-circle text-[10px] text-yellow-500" /> 시간 및 기록 이상</div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { label: '지각' as CategoryKey, value: summaryCounts.LATE, color: 'text-orange-500 border-orange-400' },
              { label: '조퇴' as CategoryKey, value: summaryCounts.EARLY_LEAVE, color: 'text-orange-500 border-orange-400' },
              { label: '휴가 중 출근' as CategoryKey, value: summaryCounts.VACATION_ATTEND, color: 'text-yellow-600 border-yellow-400' },
              { label: '출퇴근 누락' as CategoryKey, value: summaryCounts.MISSING_COMMUTE, color: 'text-red-500 border-red-400' },
              { label: '1일 소정근로시간 미달' as CategoryKey, value: summaryCounts.UNDER_MIN_HOUR, color: 'text-red-500 border-red-400' },
            ].map((c) => (
              <div key={c.label} className="border border-gray-100 rounded-lg p-3 flex items-center justify-between hover:border-gray-300 transition-colors cursor-pointer" onClick={() => c.value > 0 && setSelectedCategory(c.label)}>
                <span className={`text-[11px] font-semibold border rounded px-1.5 py-0.5 ${c.color}`}>{c.label}</span>
                <div>
                  <span className={`text-[20px] font-bold text-gray-900 ${c.value > 0 ? 'hover:text-[#1D9E75] cursor-pointer' : ''}`}>{c.value}</span>
                  <span className="text-[12px] text-gray-500 ml-0.5">명</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 비정상적 근무 상태 */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="text-[12px] text-gray-500 mb-3 flex items-center gap-1"><i className="fas fa-exclamation-triangle text-[10px] text-red-400" /> 비정상적 근무 상태</div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { label: '결근' as CategoryKey, value: summaryCounts.ABSENT, color: 'text-red-500 border-red-400' },
              { label: '미승인 초과근무' as CategoryKey, value: summaryCounts.UNAPPROVED_OT, color: 'text-red-500 border-red-400' },
              { label: '최대근무시간 초과' as CategoryKey, value: summaryCounts.MAX_HOUR_EXCEED, color: 'text-red-600 border-red-600', icon: 'fas fa-skull-crossbones' },
            ].map((c) => (
              <div key={c.label} className={`border rounded-lg p-3 flex items-center justify-between hover:border-gray-300 transition-colors cursor-pointer ${c.label === '최대근무시간 초과' ? 'border-red-200 bg-red-50/50' : 'border-gray-100'}`} onClick={() => c.value > 0 && setSelectedCategory(c.label)}>
                <span className={`text-[11px] font-semibold border rounded px-1.5 py-0.5 ${c.color}`}>{c.label}</span>
                <div>
                  <span className={`text-[20px] font-bold ${c.label === '최대근무시간 초과' && c.value > 0 ? 'text-red-600' : 'text-gray-900'} ${c.value > 0 ? 'hover:text-[#1D9E75] cursor-pointer' : ''}`}>{c.value}</span>
                  <span className="text-[12px] text-gray-500 ml-0.5">명</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* 카테고리별 사원 리스트 모달 */}
      {selectedCategory && !selectedEmployee && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-3" onClick={() => setSelectedCategory(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[640px] max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-gray-900">{selectedCategory}</h2>
                <span className="text-[13px] text-gray-500">({cardContent.length}명)</span>
              </div>
              <button onClick={() => setSelectedCategory(null)} className="text-gray-400 hover:text-gray-600 text-[18px]"><i className="fas fa-times" /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-3">
              {cardLoading ? (
                <table className="w-full text-[12px]">
                  <tbody>
                    <SkeletonTableRows rows={5} cols={6} />
                  </tbody>
                </table>
              ) : cardContent.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-[13px]">해당 카테고리에 해당하는 사원이 없습니다.</div>
              ) : (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b-2 border-gray-900">
                      <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사번</th>
                      <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사원명</th>
                      <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서</th>
                      <th className="px-3 py-2.5 text-left text-gray-700 font-medium">직급</th>
                      <th className="px-3 py-2.5 text-left text-gray-700 font-medium">주간 근무</th>
                      <th className="px-3 py-2.5 text-left text-gray-700 font-medium">상세</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cardContent.map((emp) => {
                      const weeklyHours = emp.weeklyWorkedMinutes / 60
                      return (
                        <tr
                          key={emp.empId}
                          className="border-b border-gray-100 hover:bg-[#F0FAF6] transition-colors cursor-pointer"
                          onClick={() => setSelectedEmployee(emp)}
                        >
                          <td className="px-3 py-2.5 text-gray-500">{emp.empNum}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 shrink-0"><i className="fas fa-user" /></div>
                              <span className="text-gray-800 font-medium hover:text-[#1D9E75]">{emp.empName}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-gray-600">{emp.deptName ?? '-'}</td>
                          <td className="px-3 py-2.5 text-gray-600">{emp.gradeName ?? '-'}</td>
                          <td className={`px-3 py-2.5 font-semibold ${weeklyHours > maxWeeklyHours ? 'text-red-500' : weeklyHours > warningHours ? 'text-yellow-600' : 'text-gray-700'}`}>{emp.weeklyWorkedText}</td>
                          <td className="px-3 py-2.5 text-gray-500 max-w-[160px] truncate" title={emp.detail}>{emp.detail}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
              <button onClick={() => setSelectedCategory(null)} className="px-4 py-2 text-[12px] text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 사원 상세 근무 현황 모달 */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-3" onClick={() => setSelectedEmployee(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[780px] max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedEmployee(null)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-arrow-left" /></button>
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[11px] text-gray-500"><i className="fas fa-user" /></div>
                <div>
                  <h2 className="text-[16px] font-bold text-gray-900">{selectedEmployee.empName} <span className="text-[12px] font-normal text-gray-500">({selectedEmployee.empNum})</span></h2>
                  <div className="text-[11px] text-gray-500">{selectedEmployee.deptName ?? '-'} · {selectedEmployee.gradeName ?? '-'}</div>
                </div>
              </div>
              <button onClick={() => { setSelectedEmployee(null); setSelectedCategory(null) }} className="text-gray-400 hover:text-gray-600 text-[18px]"><i className="fas fa-times" /></button>
            </div>

            {/* 요약 카드 */}
            {(() => {
              const h = historyHeader
              const weeklyMaxMin = h?.weeklyMaxMinute ?? (maxWeeklyHours * 60)
              const statusColor = h?.weeklyStatus === 'EXCEEDED' ? 'text-red-500'
                : h?.weeklyStatus === 'WARNING' ? 'text-yellow-600' : 'text-[#1D9E75]'
              return (
                <div className="px-6 py-4 grid grid-cols-3 gap-3 border-b border-gray-100">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-[11px] text-gray-500 mb-1">주간 근무시간</div>
                    <div className={`text-[18px] font-bold ${h?.weeklyStatus === 'EXCEEDED' ? 'text-red-500' : 'text-gray-900'}`}>
                      {h ? h.weeklyWorkText : selectedEmployee.weeklyWorkedText}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-[11px] text-gray-500 mb-1">카테고리</div>
                    <div className="text-[12px] font-semibold text-gray-800">{selectedCategory}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-[11px] text-gray-500 mb-1">{formatMinutes(weeklyMaxMin)} 현황</div>
                    <div className={`text-[18px] font-bold ${statusColor}`}>
                      {h?.weeklyStatus ? WEEKLY_WORK_STATUS_LABEL[h.weeklyStatus] : '-'}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* 상세 근무 리스트 */}
            <div className="overflow-y-auto flex-1 px-6 py-3">
              <h3 className="text-[13px] font-bold text-gray-900 mb-3">일별 근무 현황</h3>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b-2 border-gray-900">
                    <th className="px-3 py-2.5 text-left text-gray-700 font-medium">날짜</th>
                    <th className="px-3 py-2.5 text-left text-gray-700 font-medium">요일</th>
                    <th className="px-3 py-2.5 text-left text-gray-700 font-medium">출근</th>
                    <th className="px-3 py-2.5 text-left text-gray-700 font-medium">퇴근</th>
                    <th className="px-3 py-2.5 text-left text-gray-700 font-medium">근무시간</th>
                    <th className="px-3 py-2.5 text-left text-gray-700 font-medium">초과근무</th>
                    <th className="px-3 py-2.5 text-left text-gray-700 font-medium">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLoading && historyRows.length === 0 && (
                    <SkeletonTableRows rows={4} cols={7} />
                  )}
                  {!historyLoading && historyRows.length === 0 && (
                    <tr><td colSpan={7} className="py-8 text-center text-[13px] text-gray-400">근무 기록이 없습니다</td></tr>
                  )}
                  {historyRows.map((row) => {
                    const dayKr = DOW_KR[row.dayOfWeek]
                    const primary = row.attendanceStatuses[0]
                    const rest = row.attendanceStatuses.slice(1)
                    return (
                      <tr key={row.workDate} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5 text-gray-800 font-medium">{row.workDate}</td>
                        <td className={`px-3 py-2.5 ${dayKr === '토' ? 'text-blue-500' : dayKr === '일' ? 'text-red-500' : 'text-gray-600'}`}>{dayKr}</td>
                        <td className="px-3 py-2.5 text-[#1D9E75]">{formatHm(row.checkInAt)}</td>
                        <td className="px-3 py-2.5 text-gray-600">{formatHm(row.checkOutAt)}</td>
                        <td className="px-3 py-2.5 text-gray-700">{row.workText ?? '-'}</td>
                        <td className={`px-3 py-2.5 ${row.overtimeText ? 'text-orange-500 font-semibold' : 'text-gray-400'}`}>{row.overtimeText ?? '-'}</td>
                        <td className="px-3 py-2.5">
                          {primary ? (
                            <div className="flex items-center gap-1">
                              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border ${ATTENDANCE_CARD_BADGE[primary]}`}>
                                {ATTENDANCE_CARD_LABEL[primary]}
                              </span>
                              {rest.length > 0 && (
                                <span className="text-[10px] text-gray-500">+{rest.length}</span>
                              )}
                            </div>
                          ) : <span className="text-gray-400">-</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3 border-t border-gray-100 flex justify-between items-center">
              <button onClick={() => setSelectedEmployee(null)} className="px-4 py-2 text-[12px] text-gray-600 hover:text-gray-800 flex items-center gap-1"><i className="fas fa-arrow-left text-[10px]" /> 목록으로</button>
              <button onClick={() => { setSelectedEmployee(null); setSelectedCategory(null) }} className="px-4 py-2 text-[12px] text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 검색 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <select
            value={employmentFilter}
            onChange={(e) => { setEmploymentFilter(e.target.value as EmploymentFilter); setPage(0) }}
            className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none"
          >
            <option value="ALL">재직상태 전체</option>
            <option value="ACTIVE">재직상태 재직</option>
            <option value="ON_LEAVE">재직상태 휴직</option>
          </select>
          <div className="flex items-center border border-gray-300 rounded px-2 py-1.5">
            <i className="fas fa-search text-gray-400 text-[11px] mr-2" />
            <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="부서, 사번, 이름을 검색하세요.." className="text-[12px] outline-none bg-transparent w-48 placeholder-gray-400" />
          </div>
        </div>
        <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(0) }} className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none">
          {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {/* 테이블 */}
      {(() => {
        const isPeriod = viewMode === '기간별'
        const rows: (DailyListItem | PeriodListItem)[] = isPeriod ? periodContent : listContent
        const loading = isPeriod ? periodLoading : listLoading
        const colSpan = isPeriod ? 10 : 9
        return (
      <table className="w-full text-[12px]">
        <thead><tr className="border-b-2 border-gray-900">
          {isPeriod && <th className="px-3 py-2.5 text-left text-gray-700 font-medium">날짜</th>}
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사번</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사원명</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서명</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">근무그룹명</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">출근시간</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">퇴근시간</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">총 근로시간</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">휴가</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">근태이상</th>
        </tr></thead>
        <tbody>
          {loading && rows.length === 0 && (
            <SkeletonTableRows rows={6} cols={colSpan} />
          )}
          {!loading && rows.length === 0 && (
            <tr><td colSpan={colSpan} className="py-8 text-center text-[13px] text-gray-400">데이터가 없습니다</td></tr>
          )}
          {rows.map((d) => (
            <tr key={isPeriod ? `${(d as PeriodListItem).workDate}-${d.empId}` : d.empId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              {isPeriod && <td className="px-3 py-2.5 text-gray-700">{(d as PeriodListItem).workDate}</td>}
              <td className="px-3 py-2.5 text-gray-500">{d.empNum}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 shrink-0"><i className="fas fa-user" /></div>
                  <span className="text-gray-800 font-medium">{d.empName}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-gray-600">{d.deptName ?? '-'}</td>
              <td className="px-3 py-2.5 text-gray-600">{d.workGroupName ?? '-'}</td>
              <td className="px-3 py-2.5 text-[#1D9E75]">{formatHm(d.checkInAt)}</td>
              <td className="px-3 py-2.5 text-gray-600">{formatHm(d.checkOutAt)}</td>
              <td className="px-3 py-2.5 text-gray-700">{formatMinutes(d.totalWorkMinutes)}</td>
              <td className="px-3 py-2.5 text-gray-600">{d.vacationTypeName ?? '-'}</td>
              <td className="px-3 py-2.5">
                {(() => {
                  const anomalies = d.attendanceStatuses
                    .filter((s) => ABNORMAL_ONLY.has(s))
                    .sort((a, b) => (DISPLAY_ORDER_INDEX.get(a) ?? 99) - (DISPLAY_ORDER_INDEX.get(b) ?? 99))
                  if (anomalies.length === 0) return <span className="text-gray-400">-</span>
                  const primary = anomalies[0]
                  const rest = anomalies.slice(1)
                  const expanded = openPopover?.empId === d.empId
                  return (
                    <div className="flex items-center gap-1">
                      <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border ${ATTENDANCE_CARD_BADGE[primary]}`}>
                        {ATTENDANCE_CARD_LABEL[primary]}
                      </span>
                      {rest.length > 0 && (
                        <button
                          onClick={(e) => {
                            if (expanded) {
                              setOpenPopover(null)
                            } else {
                              const r = e.currentTarget.getBoundingClientRect()
                              setOpenPopover({
                                empId: d.empId,
                                anchorRect: { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height },
                                statuses: rest,
                              })
                            }
                          }}
                          className="text-[10px] px-1.5 py-0.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                          {expanded ? '닫기' : `+${rest.length}`}
                        </button>
                      )}
                    </div>
                  )
                })()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
        )
      })()}

      {/* 페이지네이션 */}
      {(() => {
        const total = viewMode === '기간별' ? periodTotal : listTotal
        const pages = Math.max(1, Math.ceil(total / perPage))
        if (total <= 0) return null
        return (
        <div className="flex items-center justify-between mt-4">
          <div className="text-[12px] text-gray-500">전체 {total}건</div>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-2 py-1 text-[12px] text-gray-600 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
            ><i className="fas fa-chevron-left" /></button>
            <span className="text-[12px] text-gray-600 px-2">{page + 1} / {pages}</span>
            <button
              disabled={page + 1 >= pages}
              onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              className="px-2 py-1 text-[12px] text-gray-600 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
            ><i className="fas fa-chevron-right" /></button>
          </div>
        </div>
        )
      })()}
      </>)}

      {openPopover && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpenPopover(null)} />
          <div
            ref={popoverRef}
            style={popoverPos
              ? { top: popoverPos.top, left: popoverPos.left }
              : { top: 0, left: 0, visibility: 'hidden' }}
            className="fixed z-40 bg-white border border-gray-200 rounded-lg shadow-lg px-2.5 py-2 flex flex-wrap gap-1 max-w-[280px]"
          >
            {openPopover.statuses.map((s) => (
              <span key={s} className={`inline-block text-[10px] px-1.5 py-0.5 rounded border ${ATTENDANCE_CARD_BADGE[s]}`}>
                {ATTENDANCE_CARD_LABEL[s]}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
