import { useEffect, useMemo, useState } from 'react'
import { getWorkGroup } from './workGroupConfig'
import { attendanceApi, ATTENDANCE_CARD_LABEL, ATTENDANCE_CARD_BADGE, type AttendanceCardType, type DailyListItem, type DailyCardItem, type EmploymentFilter } from '../../../api/attendance'

// 주간 최대근무시간 & 경고 기준은 근무그룹 정책에서 가져옴
// TODO: GET /api/attendance/my/work-group 또는 GET /api/attendance/hr/weekly-hour-policy 에서 가져올 값
const DEFAULT_GROUP = getWorkGroup('기본그룹')
const MAX_WEEKLY_HOURS = DEFAULT_GROUP.maxWeeklyHours
const WARNING_HOURS = DEFAULT_GROUP.warningHours

/* ══════════════════════════════════════
   타입
   ══════════════════════════════════════ */
type CategoryKey = '정상' | '종일근무상태' | '지각' | '조퇴' | '휴가 중 출근' | '출퇴근 누락' | '1일 소정근로시간 미달' | '근무지 외 근태체크' | '미승인 초과근무' | '최대근무시간 초과'

const ABNORMAL_ONLY: ReadonlySet<AttendanceCardType> = new Set([
  'MAX_HOUR_EXCEED', 'UNAPPROVED_OT', 'MISSING_COMMUTE', 'OFFSITE',
  'LATE', 'EARLY_LEAVE', 'VACATION_ATTEND', 'UNDER_MIN_HOUR',
])

const DISPLAY_ORDER: AttendanceCardType[] = [
  'MAX_HOUR_EXCEED',
  'UNAPPROVED_OT',
  'MISSING_COMMUTE',
  'OFFSITE',
  'LATE',
  'EARLY_LEAVE',
  'VACATION_ATTEND',
  'UNDER_MIN_HOUR',
]
const DISPLAY_ORDER_INDEX = new Map<AttendanceCardType, number>(DISPLAY_ORDER.map((v, i) => [v, i]))

const CATEGORY_TO_CARD: Record<CategoryKey, AttendanceCardType> = {
  '정상': 'NORMAL',
  '종일근무상태': 'WORKING',
  '지각': 'LATE',
  '조퇴': 'EARLY_LEAVE',
  '휴가 중 출근': 'VACATION_ATTEND',
  '출퇴근 누락': 'MISSING_COMMUTE',
  '1일 소정근로시간 미달': 'UNDER_MIN_HOUR',
  '근무지 외 근태체크': 'OFFSITE',
  '미승인 초과근무': 'UNAPPROVED_OT',
  '최대근무시간 초과': 'MAX_HOUR_EXCEED',
}

const formatHm = (iso: string | null): string => {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const formatMinutes = (m: number | null): string => {
  if (m == null) return '-'
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${h}h ${String(mm).padStart(2, '0')}m`
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

interface DailyAttendance {
  date: string
  day: string
  checkIn: string
  checkOut: string
  workHours: string
  overtime: string
  status: string
  note: string
}

/* ══════════════════════════════════════
   전사 근태현황 탭
   ══════════════════════════════════════ */
export default function HrAttendanceTab() {
  const [viewMode, setViewMode] = useState<'일자별' | '기간별' | '집계'>('일자별')
  const [aggregateTab, setAggregateTab] = useState<'주간현황' | '부서별현황' | '초과근무'>('주간현황')
  const [weekAnchor, setWeekAnchor] = useState<Date>(() => mondayOf(new Date()))
  const [date, setDate] = useState<string>(todayStr())
  const [employmentFilter, setEmploymentFilter] = useState<EmploymentFilter>('ACTIVE')
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [perPage, setPerPage] = useState(50)
  const [page, setPage] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<DailyCardItem | null>(null)

  const [summaryCounts, setSummaryCounts] = useState<Record<AttendanceCardType, number>>({
    NORMAL: 0, WORKING: 0, LATE: 0, EARLY_LEAVE: 0, VACATION_ATTEND: 0,
    MISSING_COMMUTE: 0, UNDER_MIN_HOUR: 0, OFFSITE: 0, UNAPPROVED_OT: 0, MAX_HOUR_EXCEED: 0,
  })
  const [listContent, setListContent] = useState<DailyListItem[]>([])
  const [listTotal, setListTotal] = useState(0)
  const [listLoading, setListLoading] = useState(false)

  const [cardContent, setCardContent] = useState<DailyCardItem[]>([])
  const [cardLoading, setCardLoading] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  // keyword debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setKeyword(searchInput.trim())
      setPage(0)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  // summary + list 병렬 호출
  useEffect(() => {
    if (viewMode !== '일자별') return
    let cancelled = false
    setListLoading(true)
    Promise.all([
      attendanceApi.getDailySummary(date, employmentFilter),
      attendanceApi.getDailyList({ date, employmentFilter, keyword: keyword || undefined, page, size: perPage }),
    ])
      .then(([sum, list]) => {
        if (cancelled) return
        setSummaryCounts(sum.counts)
        setListContent(list.content)
        setListTotal(list.totalElements)
      })
      .catch((e) => {
        if (cancelled) return
        console.error('daily summary/list 조회 실패', e)
      })
      .finally(() => {
        if (!cancelled) setListLoading(false)
      })
    return () => { cancelled = true }
  }, [viewMode, date, employmentFilter, keyword, page, perPage])

  // 카드 클릭 시 drilldown 조회
  useEffect(() => {
    if (!selectedCategory) {
      setCardContent([])
      return
    }
    const cardType = CATEGORY_TO_CARD[selectedCategory]
    let cancelled = false
    setCardLoading(true)
    attendanceApi.getDailyCard({ date, cardType, employmentFilter, page: 0, size: 100 })
      .then((res) => { if (!cancelled) setCardContent(res.content) })
      .catch((e) => { if (!cancelled) console.error('card 조회 실패', e) })
      .finally(() => { if (!cancelled) setCardLoading(false) })
    return () => { cancelled = true }
  }, [selectedCategory, date, employmentFilter])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(listTotal / perPage)), [listTotal, perPage])

  const [employeeDetail] = useState<DailyAttendance[]>([
    { date: '2026-04-06', day: '월', checkIn: '08:55', checkOut: '18:10', workHours: '8h 15m', overtime: '-', status: '정상', note: '' },
    { date: '2026-04-07', day: '화', checkIn: '09:00', checkOut: '20:00', workHours: '10h 00m', overtime: '2h', status: '초과근무', note: '사전결재' },
    { date: '2026-04-08', day: '수', checkIn: '08:58', checkOut: '18:05', workHours: '8h 07m', overtime: '-', status: '정상', note: '' },
    { date: '2026-04-09', day: '목', checkIn: '09:05', checkOut: '18:00', workHours: '7h 55m', overtime: '-', status: '지각', note: '5분 지각' },
    { date: '2026-04-10', day: '금', checkIn: '08:50', checkOut: '19:30', workHours: '9h 40m', overtime: '1h 30m', status: '초과근무', note: '사후결재' },
  ])

  // 집계 뷰용 state
  // TODO: GET /api/attendance/hr/aggregate-summary → 요약 카드
  // TODO: GET /api/attendance/hr/weekly-stats → 주간 일별 통계
  // TODO: GET /api/attendance/hr/dept-summary → 부서별 현황
  // TODO: GET /api/attendance/hr/overtime-employees → 초과근무 사원 목록
  const [aggregateSummary] = useState({ attendRate: 96.5, lateRate: 3.2, absentCount: 1, over52Count: 1 })
  const weeklyStats = useMemo(() => {
    const dayKr = ['일', '월', '화', '수', '목', '금', '토']
    // 월~일 7일치 mock (백엔드 집계 API 연결 시 교체)
    const seed = [
      { normal: 10, late: 1, earlyLeave: 0, absent: 0, onLeave: 1, overtime: 2 },
      { normal: 9, late: 2, earlyLeave: 0, absent: 0, onLeave: 1, overtime: 3 },
      { normal: 11, late: 0, earlyLeave: 0, absent: 0, onLeave: 1, overtime: 2 },
      { normal: 9, late: 1, earlyLeave: 1, absent: 0, onLeave: 1, overtime: 2 },
      { normal: 8, late: 2, earlyLeave: 1, absent: 1, onLeave: 0, overtime: 4 },
      { normal: 0, late: 0, earlyLeave: 0, absent: 0, onLeave: 0, overtime: 1 },
      { normal: 0, late: 0, earlyLeave: 0, absent: 0, onLeave: 0, overtime: 0 },
    ]
    return seed.map((s, i) => {
      const d = new Date(weekAnchor)
      d.setDate(d.getDate() + i)
      const isWeekend = d.getDay() === 0 || d.getDay() === 6
      return { date: fmtMD(d), day: dayKr[d.getDay()], totalEmp: isWeekend ? s.overtime + s.normal : 12, ...s }
    })
  }, [weekAnchor])
  const [deptSummary] = useState<{ dept: string; totalEmp: number; attendRate: number; lateRate: number; absentCount: number; avgOvertimeHours: number; overtimeCount: number; weeklyAvg: number }[]>([
    { dept: '개발팀', totalEmp: 4, attendRate: 98.5, lateRate: 4.2, absentCount: 0, avgOvertimeHours: 5.3, overtimeCount: 3, weeklyAvg: 45 },
    { dept: '인사팀', totalEmp: 2, attendRate: 100, lateRate: 0, absentCount: 0, avgOvertimeHours: 0.5, overtimeCount: 0, weeklyAvg: 40 },
    { dept: '마케팅팀', totalEmp: 2, attendRate: 95, lateRate: 2.1, absentCount: 0, avgOvertimeHours: 2.5, overtimeCount: 1, weeklyAvg: 41 },
    { dept: '영업팀', totalEmp: 2, attendRate: 90, lateRate: 5, absentCount: 1, avgOvertimeHours: 3.8, overtimeCount: 1, weeklyAvg: 42 },
    { dept: '기획팀', totalEmp: 2, attendRate: 98, lateRate: 3.5, absentCount: 0, avgOvertimeHours: 1.2, overtimeCount: 0, weeklyAvg: 41 },
  ])
  const [overtimeEmployees] = useState<{ empNo: string; name: string; dept: string; position: string; weeklyHours: number; overtimeHours: number; status: '정상' | '경고' | '초과' }[]>([
    { empNo: 'EMP003', name: '박지훈', dept: '개발팀', position: '사원', weeklyHours: 54, overtimeHours: 14, status: '초과' },
    { empNo: 'EMP008', name: '임재호', dept: '영업팀', position: '부장', weeklyHours: 49, overtimeHours: 9, status: '경고' },
    { empNo: 'EMP001', name: '김민수', dept: '개발팀', position: '과장', weeklyHours: 46, overtimeHours: 6, status: '경고' },
    { empNo: 'EMP006', name: '강도윤', dept: '마케팅팀', position: '차장', weeklyHours: 43, overtimeHours: 3, status: '정상' },
    { empNo: 'EMP010', name: '오준혁', dept: '기획팀', position: '과장', weeklyHours: 42, overtimeHours: 2, status: '정상' },
  ])

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
          <input type="date" defaultValue="2026-03-01" className="bg-transparent text-[18px] font-bold text-gray-900 outline-none cursor-pointer" />
          <span className="text-[16px] text-gray-400">~</span>
          <input type="date" defaultValue="2026-03-31" className="bg-transparent text-[18px] font-bold text-gray-900 outline-none cursor-pointer" />
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
            { label: '이번 주 출근율', value: `${aggregateSummary.attendRate}%`, color: 'text-[#1D9E75]' },
            { label: '이번 주 지각률', value: `${aggregateSummary.lateRate}%`, color: aggregateSummary.lateRate > 5 ? 'text-red-500' : 'text-gray-800' },
            { label: '결근', value: `${aggregateSummary.absentCount}건`, color: aggregateSummary.absentCount > 0 ? 'text-red-500' : 'text-gray-800' },
            { label: `${MAX_WEEKLY_HOURS}시간 초과`, value: `${aggregateSummary.over52Count}명`, color: aggregateSummary.over52Count > 0 ? 'text-red-600' : 'text-[#1D9E75]' },
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
                const attend = d.totalEmp > 0 ? Math.round((d.normal + d.late + d.earlyLeave) / d.totalEmp * 1000) / 10 : 0
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
                <tr key={d.dept} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5 text-gray-800 font-medium">{d.dept}</td>
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
                  <td className={`px-3 py-2.5 text-center font-semibold ${d.weeklyAvg > MAX_WEEKLY_HOURS ? 'text-red-500' : d.weeklyAvg > WARNING_HOURS ? 'text-yellow-600' : 'text-gray-700'}`}>{d.weeklyAvg}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 초과근무 */}
        {aggregateTab === '초과근무' && (
          <div>
            <div className="flex items-center gap-3 mb-3 p-3 bg-orange-50 rounded-lg">
              <span className="text-[12px] text-orange-700">주 최대 근무시간: <strong>{MAX_WEEKLY_HOURS}시간</strong> | 경고 기준: <strong>{WARNING_HOURS}시간</strong></span>
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
                  <tr key={e.empNo} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${e.status === '초과' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-3 py-2.5 text-gray-500">{e.empNo}</td>
                    <td className="px-3 py-2.5 text-gray-800 font-medium">{e.name}</td>
                    <td className="px-3 py-2.5 text-gray-600">{e.dept}</td>
                    <td className="px-3 py-2.5 text-gray-600">{e.position}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={e.weeklyHours > MAX_WEEKLY_HOURS ? 'text-red-500 font-semibold' : 'text-gray-800'}>{e.weeklyHours}h</span>
                      <span className="text-gray-400 text-[10px]"> / {MAX_WEEKLY_HOURS}h</span>
                    </td>
                    <td className="px-3 py-2.5 text-center"><span className={e.overtimeHours > 12 ? 'text-red-500 font-semibold' : 'text-orange-500'}>{e.overtimeHours}h</span></td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] ${e.status === '정상' ? 'bg-green-50 text-green-700' : e.status === '경고' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>{e.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>) : (<>

      {/* 요약 카드 3그룹 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* 근무 상태 */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="text-[12px] text-gray-500 mb-3 flex items-center gap-1"><i className="far fa-clock text-[10px]" /> 근무 상태</div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { label: '정상' as CategoryKey, value: summaryCounts.NORMAL, color: 'text-[#1D9E75] border-[#1D9E75]' },
              { label: '종일근무상태' as CategoryKey, value: summaryCounts.WORKING, color: 'text-gray-500 border-gray-300' },
            ].map((c) => (
              <div key={c.label} className="border border-gray-100 rounded-lg p-3 hover:border-gray-300 transition-colors cursor-pointer" onClick={() => c.value > 0 && setSelectedCategory(c.label)}>
                <span className={`text-[11px] font-semibold border rounded px-1.5 py-0.5 ${c.color}`}>{c.label}</span>
                <div className="mt-2">
                  <span className={`text-[24px] font-bold text-gray-900 ${c.value > 0 ? 'hover:text-[#1D9E75] cursor-pointer' : ''}`}>{c.value}</span>
                  <span className="text-[12px] text-gray-500 ml-0.5">명</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 시간 및 기록 이상 */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="text-[12px] text-gray-500 mb-3 flex items-center gap-1"><i className="fas fa-exclamation-circle text-[10px] text-yellow-500" /> 시간 및 기록 이상</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '지각' as CategoryKey, value: summaryCounts.LATE, color: 'text-orange-500 border-orange-400' },
              { label: '조퇴' as CategoryKey, value: summaryCounts.EARLY_LEAVE, color: 'text-orange-500 border-orange-400' },
              { label: '휴가 중 출근' as CategoryKey, value: summaryCounts.VACATION_ATTEND, color: 'text-yellow-600 border-yellow-400' },
              { label: '출퇴근 누락' as CategoryKey, value: summaryCounts.MISSING_COMMUTE, color: 'text-red-500 border-red-400' },
              { label: '1일 소정근로시간 미달' as CategoryKey, value: summaryCounts.UNDER_MIN_HOUR, color: 'text-red-500 border-red-400' },
            ].map((c) => (
              <div key={c.label} className="border border-gray-100 rounded-lg p-3 hover:border-gray-300 transition-colors cursor-pointer" onClick={() => c.value > 0 && setSelectedCategory(c.label)}>
                <span className={`text-[11px] font-semibold border rounded px-1.5 py-0.5 ${c.color}`}>{c.label}</span>
                <div className="mt-2">
                  <span className={`text-[24px] font-bold text-gray-900 ${c.value > 0 ? 'hover:text-[#1D9E75] cursor-pointer' : ''}`}>{c.value}</span>
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
              { label: '근무지 외 근태체크' as CategoryKey, value: summaryCounts.OFFSITE, color: 'text-red-500 border-red-400' },
              { label: '미승인 초과근무' as CategoryKey, value: summaryCounts.UNAPPROVED_OT, color: 'text-red-500 border-red-400' },
              { label: '최대근무시간 초과' as CategoryKey, value: summaryCounts.MAX_HOUR_EXCEED, color: 'text-red-600 border-red-600', icon: 'fas fa-skull-crossbones' },
            ].map((c) => (
              <div key={c.label} className={`border rounded-lg p-3 hover:border-gray-300 transition-colors cursor-pointer ${c.label === '최대근무시간 초과' ? 'border-red-200 bg-red-50/50' : 'border-gray-100'}`} onClick={() => c.value > 0 && setSelectedCategory(c.label)}>
                <span className={`text-[11px] font-semibold border rounded px-1.5 py-0.5 ${c.color}`}>{c.label}</span>
                <div className="mt-2">
                  <span className={`text-[24px] font-bold ${c.label === '최대근무시간 초과' && c.value > 0 ? 'text-red-600' : 'text-gray-900'} ${c.value > 0 ? 'hover:text-[#1D9E75] cursor-pointer' : ''}`}>{c.value}</span>
                  <span className="text-[12px] text-gray-500 ml-0.5">명</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 카테고리별 사원 리스트 모달 */}
      {selectedCategory && !selectedEmployee && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setSelectedCategory(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-[640px] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-gray-900">{selectedCategory}</h2>
                <span className="text-[13px] text-gray-500">({cardContent.length}명)</span>
              </div>
              <button onClick={() => setSelectedCategory(null)} className="text-gray-400 hover:text-gray-600 text-[18px]"><i className="fas fa-times" /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-3">
              {cardLoading ? (
                <div className="text-center py-12 text-gray-400 text-[13px]">불러오는 중...</div>
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
                          <td className={`px-3 py-2.5 font-semibold ${weeklyHours > MAX_WEEKLY_HOURS ? 'text-red-500' : weeklyHours > WARNING_HOURS ? 'text-yellow-600' : 'text-gray-700'}`}>{emp.weeklyWorkedText}</td>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setSelectedEmployee(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-[780px] max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
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
              const weeklyHours = selectedEmployee.weeklyWorkedMinutes / 60
              const isOver = weeklyHours > MAX_WEEKLY_HOURS
              const isWarning = weeklyHours > WARNING_HOURS
              return (
                <div className="px-6 py-4 grid grid-cols-4 gap-3 border-b border-gray-100">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-[11px] text-gray-500 mb-1">주간 근무시간</div>
                    <div className={`text-[18px] font-bold ${isOver ? 'text-red-500' : 'text-gray-900'}`}>{selectedEmployee.weeklyWorkedText}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-[11px] text-gray-500 mb-1">카테고리</div>
                    <div className="text-[12px] font-semibold text-gray-800">{selectedCategory}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-[11px] text-gray-500 mb-1">사유</div>
                    <div className="text-[12px] font-medium text-gray-700 truncate" title={selectedEmployee.detail}>{selectedEmployee.detail}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-[11px] text-gray-500 mb-1">{MAX_WEEKLY_HOURS}시간 현황</div>
                    <div className={`text-[18px] font-bold ${isOver ? 'text-red-500' : isWarning ? 'text-yellow-600' : 'text-[#1D9E75]'}`}>
                      {isOver ? '초과' : isWarning ? '주의' : '정상'}
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
                    <th className="px-3 py-2.5 text-left text-gray-700 font-medium">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeDetail.map((row) => (
                    <tr key={row.date} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 text-gray-800 font-medium">{row.date}</td>
                      <td className={`px-3 py-2.5 ${row.day === '토' ? 'text-blue-500' : row.day === '일' ? 'text-red-500' : 'text-gray-600'}`}>{row.day}</td>
                      <td className="px-3 py-2.5 text-[#1D9E75]">{row.checkIn}</td>
                      <td className="px-3 py-2.5 text-gray-600">{row.checkOut}</td>
                      <td className="px-3 py-2.5 text-gray-700">{row.workHours}</td>
                      <td className={`px-3 py-2.5 ${row.overtime !== '-' ? 'text-orange-500 font-semibold' : 'text-gray-400'}`}>{row.overtime}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-[11px] px-1.5 py-0.5 rounded ${
                          row.status === '정상' ? 'bg-green-50 text-green-600' :
                          row.status === '휴일' || row.status === '휴일근무' ? 'bg-blue-50 text-blue-600' :
                          row.status === '지각' ? 'bg-orange-50 text-orange-600' :
                          'bg-red-50 text-red-600'
                        }`}>{row.status}</span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 text-[11px]">{row.note || '-'}</td>
                    </tr>
                  ))}
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
      <table className="w-full text-[12px]">
        <thead><tr className="border-b-2 border-gray-900">
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
          {listLoading && listContent.length === 0 && (
            <tr><td colSpan={9} className="py-8 text-center text-[13px] text-gray-400">불러오는 중...</td></tr>
          )}
          {!listLoading && listContent.length === 0 && (
            <tr><td colSpan={9} className="py-8 text-center text-[13px] text-gray-400">데이터가 없습니다</td></tr>
          )}
          {listContent.map((d) => (
            <tr key={d.empId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
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
                  const expanded = expandedRows.has(d.empId)
                  const toggle = () => setExpandedRows((prev) => {
                    const next = new Set(prev)
                    if (next.has(d.empId)) next.delete(d.empId); else next.add(d.empId)
                    return next
                  })
                  return (
                    <div className="relative flex items-center gap-1">
                      <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border ${ATTENDANCE_CARD_BADGE[primary]}`}>
                        {ATTENDANCE_CARD_LABEL[primary]}
                      </span>
                      {rest.length > 0 && (
                        <>
                          <button
                            onClick={toggle}
                            className="text-[10px] px-1.5 py-0.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
                          >
                            {expanded ? '닫기' : `+${rest.length}`}
                          </button>
                          {expanded && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={toggle} />
                              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-20 bg-white border border-gray-200 rounded-lg shadow-lg px-2.5 py-2 flex flex-wrap gap-1 whitespace-nowrap">
                                <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-l border-b border-gray-200 rotate-45" />
                                {rest.map((s) => (
                                  <span key={s} className={`inline-block text-[10px] px-1.5 py-0.5 rounded border ${ATTENDANCE_CARD_BADGE[s]}`}>
                                    {ATTENDANCE_CARD_LABEL[s]}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )
                })()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 페이지네이션 */}
      {listTotal > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-[12px] text-gray-500">전체 {listTotal}건</div>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-2 py-1 text-[12px] text-gray-600 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
            ><i className="fas fa-chevron-left" /></button>
            <span className="text-[12px] text-gray-600 px-2">{page + 1} / {totalPages}</span>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="px-2 py-1 text-[12px] text-gray-600 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
            ><i className="fas fa-chevron-right" /></button>
          </div>
        </div>
      )}
      </>)}
    </div>
  )
}
