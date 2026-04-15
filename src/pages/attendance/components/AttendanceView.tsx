import { useEffect, useMemo, useState } from 'react'
import { getWorkGroup, getWeeklyStandardHours, getMonthlyStandardHours, getDailyWorkHours } from './workGroupConfig'
import { attendanceApi, type AttendanceMyWeeklySummary } from '../../../api/attendance'
import { formatMinutes, minutesToHours } from '../../../utils/minuteFormat'

/* ══════════════════════════════════════
   타입
   ══════════════════════════════════════ */
export type AttendViewMode = '주간' | '월간'

interface WeekDay {
  label: string
  date: number
  isToday: boolean
  checkIn?: string
  checkOut?: string
  workHours?: string
  overHours?: string
  leaveHours?: string
  type: '정상' | '지각' | '휴일' | '휴가' | '결근'
}

interface MonthDay {
  date: number
  isCurrentMonth: boolean
  isToday: boolean
  isHoliday: boolean
  checkIn?: string
  checkOut?: string
  workHours?: string
  type: '정상' | '지각' | '휴일' | '휴가' | '결근' | '미래'
  leaveType?: string
}

interface MonthSummary {
  accumulated: string
  workDays: number
  totalWorkDays: number
  remainHours: string
  totalMonthHours: string
  overHours: string
  leaveDays: number
}

interface StatusChangeRecord {
  id: number
  date: string
  beforeStatus: string
  afterStatus: string
  reason: string
  approvedAt: string | null
}

/* ══════════════════════════════════════
   근태관리 뷰
   ══════════════════════════════════════ */
export default function AttendanceView({ viewMode }: { viewMode: AttendViewMode; onViewModeChange: (m: AttendViewMode) => void; onOpenApply?: () => void }) {
  // TODO: API 연동
  // GET /api/attendance/my/work-group → 내 근무그룹
  // GET /api/attendance/my/weekly?weekStart=2026-03-30 → 주간 데이터
  // GET /api/attendance/my/monthly?year=2026&month=3 → 월간 데이터
  // GET /api/attendance/my/status-changes?page=0&size=10 → 상태 변경 이력

  const [userWorkGroup] = useState(getWorkGroup())
  const DAILY_HOURS = getDailyWorkHours(userWorkGroup)
  const WEEKLY_STD_HOURS = getWeeklyStandardHours(userWorkGroup)
  const MONTHLY_WORK_DAYS = 22
  const MONTHLY_STD_HOURS = getMonthlyStandardHours(userWorkGroup, MONTHLY_WORK_DAYS)

  // 기준일 (오늘) — 주간/월간 라벨 계산용
  const today = useMemo(() => new Date(), [])
  const [weekOffset, setWeekOffset] = useState(0)
  const weekMonday = useMemo(() => {
    const d = new Date(today)
    const day = d.getDay()
    const diffToMon = day === 0 ? -6 : 1 - day
    const mon = new Date(d); mon.setDate(d.getDate() + diffToMon + weekOffset * 7)
    mon.setHours(0, 0, 0, 0)
    return mon
  }, [today, weekOffset])
  const weekRangeLabel = useMemo(() => {
    const sun = new Date(weekMonday); sun.setDate(weekMonday.getDate() + 6)
    const fmt = (x: Date) => `${x.getFullYear()}.${String(x.getMonth() + 1).padStart(2, '0')}.${String(x.getDate()).padStart(2, '0')}`
    return `${fmt(weekMonday)} ~ ${fmt(sun)}`
  }, [weekMonday])
  const monthLabel = `${today.getFullYear()}년 ${today.getMonth() + 1}월`

  // 주간 요약 API 조회 — weekOffset 변경 시 재조회
  const dateParam = useMemo(() => {
    const y = weekMonday.getFullYear()
    const m = String(weekMonday.getMonth() + 1).padStart(2, '0')
    const d = String(weekMonday.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [weekMonday])
  const [summary, setSummary] = useState<AttendanceMyWeeklySummary | null>(null)
  useEffect(() => {
    let cancelled = false
    attendanceApi.getMyWeeklySummary(dateParam)
      .then((res) => { if (!cancelled) setSummary(res) })
      .catch(() => { if (!cancelled) setSummary(null) })
    return () => { cancelled = true }
  }, [dateParam])

  // 서버값 우선, 없으면 로컬 workGroupConfig 기본값으로 폴백
  const wg = summary?.workGroup
  const weekly = summary?.weekly
  const dailyHoursDisplay = wg ? minutesToHours(wg.dailyWorkMinutes) : DAILY_HOURS
  const weeklyStdHoursDisplay = wg ? minutesToHours(wg.weeklyWorkMinutes) : WEEKLY_STD_HOURS
  const maxWeeklyHours = wg ? Math.floor(wg.companyWeeklyMaxMinutes / 60) : userWorkGroup.maxWeeklyHours
  const weeklyStdMin = wg?.weeklyWorkMinutes ?? WEEKLY_STD_HOURS * 60
  const maxWeeklyMin = wg?.companyWeeklyMaxMinutes ?? userWorkGroup.maxWeeklyHours * 60
  const accumulatedMin = (weekly?.workedMinutes ?? 0) + (weekly?.vacationMinutes ?? 0)
  const progressPct = maxWeeklyMin > 0 ? Math.min(100, Math.max(0, (accumulatedMin / maxWeeklyMin) * 100)) : 0
  const groupName = wg?.groupName ?? userWorkGroup.name
  const groupStart = wg?.groupStartTime ?? userWorkGroup.startTime
  const groupEnd = wg?.groupEndTime ?? userWorkGroup.endTime

  // 더미 데이터 — 백엔드 API 연동 전 화면 확인용
  const weekData = useMemo<WeekDay[]>(() => {
    const labels = ['월', '화', '수', '목', '금', '토', '일']
    const now = new Date(); now.setHours(0, 0, 0, 0)
    return labels.map((label, i) => {
      const cur = new Date(weekMonday); cur.setDate(weekMonday.getDate() + i)
      const isToday = cur.getTime() === now.getTime()
      const isWeekend = i >= 5
      if (isWeekend) return { label, date: cur.getDate(), isToday, type: '휴일' }
      const isPast = cur < now
      const isFuture = cur > now
      if (isFuture) return { label, date: cur.getDate(), isToday, type: '정상' }
      if (!isPast && !isToday) return { label, date: cur.getDate(), isToday, type: '정상' }
      return {
        label, date: cur.getDate(), isToday,
        checkIn: i === 1 ? '09:12' : '09:00',
        checkOut: isPast || isToday ? (i === 0 ? '19:30' : '18:05') : undefined,
        workHours: '8h',
        overHours: i === 0 ? '1h 30m' : undefined,
        type: i === 1 ? '지각' : '정상',
      }
    })
  }, [weekMonday])
  const [monthData] = useState<MonthDay[]>(() => {
    const y = today.getFullYear(); const m = today.getMonth()
    const first = new Date(y, m, 1)
    const last = new Date(y, m + 1, 0)
    const startPad = first.getDay()
    const cells: MonthDay[] = []
    for (let i = 0; i < startPad; i++) {
      const d = new Date(y, m, -startPad + i + 1)
      cells.push({ date: d.getDate(), isCurrentMonth: false, isToday: false, isHoliday: false, type: '정상' })
    }
    for (let day = 1; day <= last.getDate(); day++) {
      const cur = new Date(y, m, day)
      const dow = cur.getDay()
      const isToday = day === today.getDate()
      const isFuture = cur > today
      const isWeekend = dow === 0 || dow === 6
      let entry: MonthDay
      if (isWeekend) entry = { date: day, isCurrentMonth: true, isToday, isHoliday: true, type: '휴일' }
      else if (isFuture) entry = { date: day, isCurrentMonth: true, isToday, isHoliday: false, type: '미래' }
      else if (day === 7) entry = { date: day, isCurrentMonth: true, isToday, isHoliday: false, type: '휴가', leaveType: '연차' }
      else if (day === 9) entry = { date: day, isCurrentMonth: true, isToday, isHoliday: false, checkIn: '09:18', checkOut: '18:10', workHours: '7h 52m', type: '지각' }
      else entry = { date: day, isCurrentMonth: true, isToday, isHoliday: false, checkIn: '09:00', checkOut: isToday ? undefined : '18:05', workHours: '8h', type: '정상' }
      cells.push(entry)
    }
    while (cells.length % 7 !== 0) {
      const d = cells.length - startPad - last.getDate() + 1
      cells.push({ date: d, isCurrentMonth: false, isToday: false, isHoliday: false, type: '정상' })
    }
    return cells
  })
  const [monthSummary] = useState<MonthSummary>({
    accumulated: '64시간 0분', workDays: 8, totalWorkDays: MONTHLY_WORK_DAYS,
    remainHours: `${MONTHLY_STD_HOURS - 64}h`, totalMonthHours: `${MONTHLY_STD_HOURS}h`,
    overHours: '3h 30m', leaveDays: 1,
  })
  const [statusChanges] = useState<StatusChangeRecord[]>([
    { id: 1, date: '2026-04-09', beforeStatus: '지각', afterStatus: '정상', reason: '교통체증 정정 신청', approvedAt: '2026-04-10T11:20:00' },
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-bold text-gray-900">내 근태현황</h1>
      </div>

      {/* 기간 선택 */}
      <div className="flex items-center justify-center gap-3 mb-2">
        <button onClick={() => viewMode === '주간' && setWeekOffset((o) => o - 1)}
          className="text-gray-400 hover:text-gray-600 transition-colors"><i className="fas fa-chevron-left" /></button>
        <span className="text-[15px] font-semibold text-gray-900">
          {viewMode === '주간' ? weekRangeLabel : monthLabel}
        </span>
        <button onClick={() => viewMode === '주간' && setWeekOffset((o) => o + 1)}
          className="text-gray-400 hover:text-gray-600 transition-colors"><i className="fas fa-chevron-right" /></button>
        <button onClick={() => setWeekOffset(0)}
          className="text-[12px] text-gray-500 hover:text-[#1D9E75] ml-2 transition-colors">오늘</button>
      </div>
      <div className="mb-4" />

      {/* 근무그룹 정보 */}
      <div className="text-[12px] text-gray-500 mb-4">
        {groupName} ({groupStart} ~ {groupEnd})
        <span className="ml-2 text-gray-400">| 1일 {dailyHoursDisplay}h · 주 {weeklyStdHoursDisplay}h · 최대 {maxWeeklyHours}h</span>
        {weekly && weekly.abnormalDays > 0 && (
          <span className="ml-2 text-red-500">· 근태 이상 {weekly.abnormalDays}건</span>
        )}
      </div>

      {viewMode === '주간' ? (
        <>

          {/* 주간 요약 카드 */}
          <div className="border border-gray-200 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-8">
              <div className="flex-1">
                <div className="text-[13px] text-gray-700 mb-1">
                  주간누적 <span className="text-[#1D9E75] font-bold">{formatMinutes(accumulatedMin)}</span>
                </div>
                <div className="text-[11px] text-gray-400 mb-3">
                  이번주 적정 근무시간({weeklyStdHoursDisplay}h)까지 {formatMinutes(weekly?.remainingMinutes ?? weeklyStdMin)}이 더 필요해요.
                </div>
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-3 bg-gradient-to-r from-[#1D9E75] to-[#7dd3b8] rounded-full" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span></span><span>{weeklyStdHoursDisplay}h</span><span>{maxWeeklyHours}h</span>
                </div>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">잔여 근무일</div>
                  <div className="text-[18px] font-bold text-[#1D9E75]">
                    {weekly?.remainingDays ?? 0}<span className="text-[11px] text-gray-400">/{weekly?.workDays ?? userWorkGroup.workDays.length}일</span>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">잔여 근로시간</div>
                  <div className="text-[18px] font-bold text-[#1D9E75]">
                    {formatMinutes(weekly?.remainingMinutes ?? weeklyStdMin)}<span className="text-[11px] text-gray-400">/{weeklyStdHoursDisplay}h</span>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">초과 근로시간</div>
                  <div className="text-[18px] font-bold text-gray-900">{formatMinutes(weekly?.approvedOvertimeMinutes ?? 0)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">휴가</div>
                  <div className="text-[18px] font-bold text-gray-900">{formatMinutes(weekly?.vacationMinutes ?? 0)}</div>
                </div>
              </div>
            </div>
          </div>


          {/* 주간 타임라인 */}
          {weekData.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
              <div className="grid grid-cols-7 border-b border-gray-200">
                {weekData.map((d) => (
                  <div key={d.date} className={`py-3 text-center border-r border-gray-100 last:border-r-0 ${d.isToday ? 'bg-gray-50' : ''}`}>
                    <div className={`text-[11px] ${d.isToday ? 'text-[#1D9E75] font-bold' : 'text-gray-500'}`}>{d.label}</div>
                    <div className={`text-[14px] font-semibold ${d.isToday ? 'text-[#1D9E75]' : 'text-gray-900'}`}>{d.date}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 min-h-[120px]">
                {weekData.map((d) => (
                  <div key={d.date} className={`p-2 border-r border-gray-100 last:border-r-0 text-[10px] ${d.isToday ? 'bg-gray-50/50 border border-[#1D9E75]/20 rounded' : ''}`}>
                    {d.type === '휴일' ? (
                      <div className="text-red-400 font-medium text-right">휴일</div>
                    ) : d.checkIn ? (
                      <div className="space-y-1">
                        {d.overHours && <div className="bg-[#1D9E75] text-white px-1 py-0.5 rounded text-[9px] inline-block">{d.overHours}</div>}
                        <div className="text-gray-600"><span className="text-[#1D9E75]">출</span> {d.checkIn} {d.checkOut && <><span className="text-gray-400">퇴</span> {d.checkOut}</>}</div>
                        {d.leaveHours && <div className="text-blue-500">| {d.leaveHours} 연차</div>}
                        {d.overHours && <div className="text-purple-500">| {d.overHours} 초과</div>}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {weekData.length === 0 && (
            <div className="text-center py-12 text-[13px] text-gray-400 border border-gray-200 rounded-xl mb-6">근태 데이터가 없습니다</div>
          )}

          {/* 범례 */}
          <div className="flex items-center gap-4 text-[10px] text-gray-500 mb-6">
            <span><span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-1" />정상</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1" />근태이상</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-purple-400 mr-1" />수정</span>
            <span className="ml-4"><span className="inline-block w-2 h-2 rounded-full bg-[#1D9E75] mr-1" />업무시간</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-gray-300 mr-1" />업무미포함시간</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-gray-200 mr-1" />휴게시간</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-1" />승인 초과근로</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1" />야간근로</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1" />휴가</span>
          </div>

          {/* 근무상태 변경 이력 */}
          <div>
            <h2 className="text-[14px] font-bold text-gray-900 mb-2">근무상태 변경 이력 <span className="text-gray-400 font-normal">{statusChanges.length}</span></h2>
            {statusChanges.length === 0 && <div className="text-[12px] text-gray-400 py-8 text-center">변경 이력이 없습니다.</div>}
          </div>
        </>
      ) : (
        <>
          {/* 월간 요약 카드 */}
          <div className="border border-gray-200 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-8">
              <div className="flex-1">
                <div className="text-[13px] text-gray-700 mb-1">
                  월간누적 <span className="text-[#1D9E75] font-bold">{monthSummary.accumulated}</span>
                </div>
                <div className="text-[11px] text-gray-400 mb-3">이번달 {monthSummary.remainHours}이 더 필요해요.</div>
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-3 bg-gradient-to-r from-[#1D9E75] to-[#7dd3b8] rounded-full" style={{ width: '0%' }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span></span><span>{monthSummary.totalMonthHours}</span>
                </div>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">근무일</div>
                  <div className="text-[18px] font-bold text-[#1D9E75]">{monthSummary.workDays}<span className="text-[11px] text-gray-400">/{monthSummary.totalWorkDays}일</span></div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">잔여 근로시간</div>
                  <div className="text-[18px] font-bold text-[#1D9E75]">{monthSummary.remainHours}<span className="text-[11px] text-gray-400">/{monthSummary.totalMonthHours}</span></div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">초과 근로</div>
                  <div className="text-[18px] font-bold text-gray-900">{monthSummary.overHours}</div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">휴가</div>
                  <div className="text-[18px] font-bold text-gray-900">{monthSummary.leaveDays}<span className="text-[11px] text-gray-400">일</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* 월간 캘린더 */}
          {monthData.length > 0 ? (
            <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
              <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                  <div key={d} className={`py-2 text-center text-[11px] font-medium border-r border-gray-100 last:border-r-0 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'}`}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthData.map((d, idx) => {
                  const dow = idx % 7
                  return (
                    <div key={idx}
                      className={`min-h-[90px] p-1.5 border-r border-b border-gray-100 last:border-r-0 text-[10px] ${
                        !d.isCurrentMonth ? 'bg-gray-50/50' : d.isToday ? 'bg-[#f0faf5]' : ''
                      }`}
                    >
                      <div className={`text-[12px] font-semibold mb-1 ${
                        !d.isCurrentMonth ? 'text-gray-300'
                          : d.isToday ? 'text-white bg-[#1D9E75] w-6 h-6 rounded-full flex items-center justify-center'
                          : dow === 0 ? 'text-red-400'
                          : dow === 6 ? 'text-blue-400'
                          : 'text-gray-900'
                      }`}>
                        {d.date}
                      </div>
                      {d.isCurrentMonth && d.type === '휴일' && (
                        <div className="text-red-400 font-medium">휴일</div>
                      )}
                      {d.isCurrentMonth && d.type === '휴가' && (
                        <div className="bg-blue-100 text-blue-600 px-1 py-0.5 rounded text-[9px] inline-block">{d.leaveType}</div>
                      )}
                      {d.isCurrentMonth && d.type === '지각' && (
                        <div className="space-y-0.5">
                          <div className="bg-red-100 text-red-500 px-1 py-0.5 rounded text-[9px] inline-block">지각</div>
                          <div className="text-gray-500">{d.checkIn} ~ {d.checkOut}</div>
                          <div className="text-gray-400">{d.workHours}</div>
                        </div>
                      )}
                      {d.isCurrentMonth && d.type === '정상' && d.checkIn && (
                        <div className="space-y-0.5">
                          <div className="text-gray-500">{d.checkIn} ~ {d.checkOut ?? '-'}</div>
                          {d.workHours && <div className="text-gray-400">{d.workHours}</div>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[13px] text-gray-400 border border-gray-200 rounded-xl mb-6">근태 데이터가 없습니다</div>
          )}

          {/* 범례 */}
          <div className="flex items-center gap-4 text-[10px] text-gray-500 mb-6">
            <span><span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-1" />정상</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1" />지각</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1" />휴가</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-purple-400 mr-1" />초과근로</span>
          </div>

          {/* 근무상태 변경 이력 */}
          <div>
            <h2 className="text-[14px] font-bold text-gray-900 mb-2">근무상태 변경 이력 <span className="text-gray-400 font-normal">{statusChanges.length}</span></h2>
            {statusChanges.length === 0 && <div className="text-[12px] text-gray-400 py-8 text-center">변경 이력이 없습니다.</div>}
          </div>
        </>
      )}
    </div>
  )
}
