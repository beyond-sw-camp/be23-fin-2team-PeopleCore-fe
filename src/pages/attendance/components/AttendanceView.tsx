import { useEffect, useMemo, useState } from 'react'
import { getWorkGroup, getWeeklyStandardHours, getDailyWorkHours } from './workGroupConfig'
import {
  attendanceApi,
  ATTENDANCE_MODIFY_STATUS_BADGE,
  type AttendanceMyWeeklySummary,
  type AttendanceModifyAdminRow,
  type AttendanceModifyStatus,
  type AttendanceModifyWeekDay,
  type HolidayReason,
  type WorkStatus,
} from '../../../api/attendance'
import { formatMinutes, minutesToHours } from '../../../utils/minuteFormat'
import AttendanceModifyDetailModal from './AttendanceModifyDetailModal'

/* ══════════════════════════════════════
   타입
   ══════════════════════════════════════ */
interface WeekDay {
  label: string
  date: number
  fullDate: string
  isToday: boolean
  isFuture: boolean
  isHoliday: boolean
  holidayReason: HolidayReason
  hasRecord: boolean
  checkIn?: string
  checkOut?: string
  workHours?: string
  recognizedOvertimeMinutes: number
  unrecognizedOvertimeMinutes: number
  workStatus: WorkStatus | null
  isVacation: boolean
  vacationTypeName: string | null
  vacationStart: string | null
  vacationEnd: string | null
  vacationUseDay: number | null
}

const HOLIDAY_REASON_LABEL: Record<NonNullable<HolidayReason>, string> = {
  NATIONAL: '공휴일',
  COMPANY: '회사휴일',
  WEEKLY_OFF: '휴무일',
}

const DAY_LABELS_KR: Record<string, string> = {
  MONDAY: '월', TUESDAY: '화', WEDNESDAY: '수', THURSDAY: '목',
  FRIDAY: '금', SATURDAY: '토', SUNDAY: '일',
}

const fmtHm = (iso: string | null) => (iso && iso.length >= 16) ? iso.slice(11, 16) : undefined

const fmtMin = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`


/* ══════════════════════════════════════
   근태관리 뷰
   ══════════════════════════════════════ */
export default function AttendanceView({ onOpenCorrection }: { onOpenApply?: () => void; onOpenCorrection?: (date?: string) => void }) {
  // TODO: API 연동
  // GET /api/attendance/my/weekly?weekStart=2026-03-30 → 일별 타임라인 실데이터

  const [userWorkGroup] = useState(getWorkGroup())
  const DAILY_HOURS = getDailyWorkHours(userWorkGroup)
  const WEEKLY_STD_HOURS = getWeeklyStandardHours(userWorkGroup)

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
  const progressPct = weeklyStdMin > 0 ? Math.min(100, Math.max(0, ((weekly?.workedMinutes ?? 0) / weeklyStdMin) * 100)) : 0
  const totalEffortMin = (weekly?.workedMinutes ?? 0) + (weekly?.approvedOvertimeMinutes ?? 0)
  const nearMaxWarning = maxWeeklyMin > 0 && totalEffortMin >= maxWeeklyMin * 0.9
  const groupName = wg?.groupName ?? userWorkGroup.name
  const groupStart = wg?.groupStartTime ?? userWorkGroup.startTime
  const groupEnd = wg?.groupEndTime ?? userWorkGroup.endTime

  // 주간 일별 타임라인 — GET /hr-service/attendance/modify/week?weekStart=...
  const [weekDays, setWeekDays] = useState<AttendanceModifyWeekDay[]>([])
  const [weekLoadError, setWeekLoadError] = useState(false)
  useEffect(() => {
    let aborted = false
    const fetchWeek = async () => {
      setWeekLoadError(false)
      try {
        const res = await attendanceApi.getAttendanceModifyWeek(dateParam)
        if (!aborted) setWeekDays(res.days)
      } catch {
        if (!aborted) { setWeekDays([]); setWeekLoadError(true) }
      }
    }
    void fetchWeek()
    return () => { aborted = true }
  }, [dateParam])

  const weekData = useMemo<WeekDay[]>(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0)
    return weekDays.map((d) => {
      const cur = new Date(d.workDate); cur.setHours(0, 0, 0, 0)
      const dateNum = Number(d.workDate.slice(8, 10))
      const actualMin = d.actualWorkMinutes ?? 0
      return {
        label: DAY_LABELS_KR[d.dayOfWeek] ?? d.dayOfWeek,
        date: dateNum,
        fullDate: d.workDate,
        isToday: cur.getTime() === now.getTime(),
        isFuture: cur > now,
        isHoliday: d.isHoliday,
        holidayReason: d.holidayReason,
        hasRecord: d.comRecId != null,
        checkIn: fmtHm(d.checkIn),
        checkOut: fmtHm(d.checkOut),
        workHours: actualMin > 0 ? `${Math.floor(actualMin / 60)}h ${actualMin % 60}m` : undefined,
        recognizedOvertimeMinutes: d.recognizedOvertimeMinutes,
        unrecognizedOvertimeMinutes: d.unrecognizedOvertimeMinutes,
        workStatus: d.workStatus,
        isVacation: d.isVacation,
        vacationTypeName: d.vacationTypeName,
        vacationStart: d.vacationStart,
        vacationEnd: d.vacationEnd,
        vacationUseDay: d.vacationUseDay,
      }
    })
  }, [weekDays])
  const MODIFY_PAGE_SIZE = 20
  const [modifyHistory, setModifyHistory] = useState<AttendanceModifyAdminRow[]>([])
  const [modifyTotal, setModifyTotal] = useState(0)
  const [modifyPage, setModifyPage] = useState(0)
  const [modifyFilter, setModifyFilter] = useState<'ALL' | AttendanceModifyStatus>('ALL')
  const [modifyLoading, setModifyLoading] = useState(false)
  const [modifyDetailId, setModifyDetailId] = useState<number | null>(null)
  useEffect(() => {
    let aborted = false
    Promise.resolve().then(() => { if (!aborted) setModifyLoading(true) })
    attendanceApi.getMyAttendanceModify({ page: modifyPage, size: MODIFY_PAGE_SIZE, sort: 'createdAt,DESC' })
      .then((res) => {
        if (aborted) return
        setModifyHistory(res.content)
        setModifyTotal(res.totalElements)
      })
      .catch(() => { if (!aborted) { setModifyHistory([]); setModifyTotal(0) } })
      .finally(() => { if (!aborted) setModifyLoading(false) })
    return () => { aborted = true }
  }, [modifyPage])
  const filteredModify = useMemo(
    () => modifyFilter === 'ALL' ? modifyHistory : modifyHistory.filter((r) => r.attenStatus === modifyFilter),
    [modifyHistory, modifyFilter]
  )
  const modifyTotalPages = Math.max(1, Math.ceil(modifyTotal / MODIFY_PAGE_SIZE))
  const fmtHmStr = (iso: string) => iso.length >= 16 ? iso.slice(11, 16) : iso
  const fmtDate = (iso: string) => iso.length >= 10 ? iso.slice(0, 10) : iso
  const MODIFY_TABS: { key: 'ALL' | AttendanceModifyStatus; label: string }[] = [
    { key: 'ALL', label: '전체' },
    { key: 'PENDING', label: '승인대기' },
    { key: 'APPROVED', label: '승인완료' },
    { key: 'REJECTED', label: '반려' },
    { key: 'CANCELED', label: '취소' },
  ]

  const modifyHistorySection = (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[14px] font-bold text-gray-900">
          내 근태 정정 신청 현황 <span className="text-gray-400 font-normal">{modifyTotal}</span>
        </h2>
      </div>
      <div className="flex items-center gap-2 mb-3">
        {MODIFY_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setModifyFilter(t.key)}
            className={`px-3 py-1 text-[11px] rounded-full transition-colors ${modifyFilter === t.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {modifyLoading ? (
        <div className="text-[12px] text-gray-400 py-8 text-center">불러오는 중...</div>
      ) : filteredModify.length === 0 ? (
        <div className="text-[12px] text-gray-400 py-8 text-center">정정 신청 내역이 없습니다.</div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-[12px]">
            <thead className="bg-gray-50">
              <tr className="text-gray-600">
                <th className="px-3 py-2 text-left font-medium">대상일</th>
                <th className="px-3 py-2 text-center font-medium">정정 출근</th>
                <th className="px-3 py-2 text-center font-medium">정정 퇴근</th>
                <th className="px-3 py-2 text-left font-medium">사유</th>
                <th className="px-3 py-2 text-center font-medium">상태</th>
                <th className="px-3 py-2 text-center font-medium">신청일</th>
              </tr>
            </thead>
            <tbody>
              {filteredModify.map((r) => {
                const badge = ATTENDANCE_MODIFY_STATUS_BADGE[r.attenStatus]
                return (
                  <tr
                    key={r.attenModiId}
                    onClick={() => setModifyDetailId(r.attenModiId)}
                    className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-3 py-2 text-gray-700">{r.workDate}</td>
                    <td className="px-3 py-2 text-center text-[#1D9E75] font-medium">{fmtHmStr(r.attenReqCheckIn)}</td>
                    <td className="px-3 py-2 text-center text-[#1D9E75] font-medium">{fmtHmStr(r.attenReqCheckOut)}</td>
                    <td className="px-3 py-2 text-gray-600 max-w-[220px] truncate" title={r.attenReason}>{r.attenReason}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${badge.cls}`}>{badge.text}</span>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-500">{fmtDate(r.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {modifyTotal > MODIFY_PAGE_SIZE && (
        <div className="flex items-center justify-end gap-1 mt-3">
          <button
            disabled={modifyPage === 0}
            onClick={() => setModifyPage((p) => Math.max(0, p - 1))}
            className="px-2 py-1 text-[12px] text-gray-600 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
          ><i className="fas fa-chevron-left" /></button>
          <span className="text-[12px] text-gray-600 px-2">{modifyPage + 1} / {modifyTotalPages}</span>
          <button
            disabled={modifyPage + 1 >= modifyTotalPages}
            onClick={() => setModifyPage((p) => Math.min(modifyTotalPages - 1, p + 1))}
            className="px-2 py-1 text-[12px] text-gray-600 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
          ><i className="fas fa-chevron-right" /></button>
        </div>
      )}
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-bold text-gray-900">내 근태현황</h1>
        {onOpenCorrection && (
          <button
            onClick={() => onOpenCorrection()}
            className="px-3 py-1.5 border border-[#1D9E75] text-[#1D9E75] text-[12px] font-medium rounded-md hover:bg-[#E1F5EE] transition-colors"
          >
            <i className="fas fa-edit mr-1" />근태 정정 신청
          </button>
        )}
      </div>

      {/* 기간 선택 */}
      <div className="flex items-center justify-center gap-3 mb-2">
        <button onClick={() => setWeekOffset((o) => o - 1)}
          className="text-gray-400 hover:text-gray-600 transition-colors"><i className="fas fa-chevron-left" /></button>
        <span className="text-[15px] font-semibold text-gray-900">{weekRangeLabel}</span>
        <button onClick={() => setWeekOffset((o) => o + 1)}
          className="text-gray-400 hover:text-gray-600 transition-colors"><i className="fas fa-chevron-right" /></button>
        <button onClick={() => setWeekOffset(0)}
          className="text-[12px] text-gray-500 hover:text-[#1D9E75] ml-2 transition-colors">오늘</button>
      </div>
      <div className="mb-4" />

      {/* 근무그룹 정보 */}
      <div className="text-[12px] text-gray-500 mb-4 flex items-center flex-wrap gap-2">
        <span>{groupName} ({groupStart} ~ {groupEnd})</span>
        <span className="text-gray-400">| 1일 {dailyHoursDisplay}h · 주 {weeklyStdHoursDisplay}h · 최대 {maxWeeklyHours}h</span>
        {weekly && weekly.abnormalDays > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[11px] font-medium">
            근태 이상 {weekly.abnormalDays}건
          </span>
        )}
        {nearMaxWarning && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[11px] font-medium">
            주 최대근무 {maxWeeklyHours}h 근접
          </span>
        )}
      </div>

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
                {weekData.map((d) => {
                  const rec = d.recognizedOvertimeMinutes
                  const unr = d.unrecognizedOvertimeMinutes
                  const hasBoth = rec > 0 && unr > 0
                  const totalOt = rec + unr
                  const handleCellClick = () => {
                    if (!onOpenCorrection) return
                    if (d.isFuture) return
                    if (unr > 0) {
                      if (window.confirm('미인증 초과 근무가 있습니다. 정정 신청하시겠어요?')) {
                        onOpenCorrection(d.fullDate)
                      }
                      return
                    }
                    onOpenCorrection(d.fullDate)
                  }
                  const clickable = !!onOpenCorrection && !d.isFuture
                  const holidayLabel = d.holidayReason ? HOLIDAY_REASON_LABEL[d.holidayReason] : '휴일'
                  const isAbsent = d.workStatus === 'ABSENT'
                  return (
                    <div
                      key={d.fullDate}
                      onClick={clickable ? handleCellClick : undefined}
                      className={`group relative p-2 border-r border-gray-100 last:border-r-0 text-[10px] ${d.isToday ? 'bg-gray-50/50 border border-[#1D9E75]/20 rounded' : ''} ${isAbsent ? 'bg-rose-50/40' : ''} ${clickable ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      title={!d.hasRecord && !d.isHoliday && !d.isFuture ? '기록 없음 — 클릭 시 정정 신청' : undefined}
                    >
                      <div className="space-y-1">
                        {/* 휴가 배지 */}
                        {d.isVacation && (
                          <div className="inline-flex flex-wrap items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-1 py-0.5 rounded text-[9px] font-semibold">
                            <span>{d.vacationTypeName ?? '휴가'}</span>
                            {(d.vacationUseDay ?? 0) < 1.0 && d.vacationStart && d.vacationEnd && (
                              <span className="font-normal">{fmtHm(d.vacationStart)}~{fmtHm(d.vacationEnd)}</span>
                            )}
                          </div>
                        )}
                        {/* 자동마감 / 결근 배지 */}
                        {d.workStatus === 'AUTO_CLOSED' && (
                          <div className="inline-block bg-purple-50 text-purple-600 border border-purple-200 px-1 py-0.5 rounded text-[9px] font-semibold">자동마감</div>
                        )}
                        {isAbsent && (
                          <div className="inline-block bg-rose-100 text-rose-700 border border-rose-300 px-1 py-0.5 rounded text-[9px] font-bold">결근</div>
                        )}

                        {d.isHoliday && !d.checkIn ? (
                          <div className="text-red-400 font-medium text-right">{holidayLabel}</div>
                        ) : d.checkIn ? (
                          <div className="space-y-1">
                            {/* 초과근무 배지 — 둘 다 있을 때 두 개 동시 노출 */}
                            {totalOt > 0 && (
                              <div className="flex flex-wrap items-center gap-1">
                                {rec > 0 && (
                                  <span className="bg-blue-50 text-blue-600 px-1 py-0.5 rounded text-[9px] font-semibold">인증 {fmtMin(rec)}</span>
                                )}
                                {unr > 0 && (
                                  <span className="bg-purple-100 text-purple-600 px-1 py-0.5 rounded text-[9px] font-semibold">미인증 {fmtMin(unr)}</span>
                                )}
                              </div>
                            )}
                            <div className="text-gray-600"><span className="text-[#1D9E75]">출</span> {d.checkIn} {d.checkOut && <><span className="text-gray-400">퇴</span> {d.checkOut}</>}</div>
                            {d.workHours && <div className="text-gray-400">근무 {d.workHours}</div>}
                            {hasBoth && (
                              <div className="text-gray-700">합계 <span className="font-semibold">{fmtMin(totalOt)} 초과</span></div>
                            )}
                          </div>
                        ) : !d.isFuture && !d.isVacation ? (
                          <div className="text-gray-300">기록 없음</div>
                        ) : null}
                      </div>
                      {clickable && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenCorrection!(d.fullDate) }}
                          className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] px-1.5 py-0.5 rounded bg-white border border-[#1D9E75] text-[#1D9E75] hover:bg-[#E1F5EE]"
                          title="근태 정정"
                        >
                          정정
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {weekData.length === 0 && (
            <div className="text-center py-12 text-[13px] text-gray-400 border border-gray-200 rounded-xl mb-6">
              {weekLoadError ? '근태 정보를 불러오지 못했습니다' : '근태 데이터가 없습니다'}
            </div>
          )}

      {modifyHistorySection}

      {modifyDetailId != null && (
        <AttendanceModifyDetailModal
          attenModiId={modifyDetailId}
          onClose={() => setModifyDetailId(null)}
        />
      )}
    </div>
  )
}
