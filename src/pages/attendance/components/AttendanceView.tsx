import { useState } from 'react'
import { getWorkGroup, getWeeklyStandardHours, getMonthlyStandardHours, getDailyWorkHours } from './workGroupConfig'

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

interface WeekSummary {
  accumulated: string
  remainDays: number
  totalDays: number
  remainHours: string
  totalWeekHours: string
  overHours: string
  leaveHours: string
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
export default function AttendanceView({ viewMode, onViewModeChange, onOpenApply }: { viewMode: AttendViewMode; onViewModeChange: (m: AttendViewMode) => void; onOpenApply: () => void }) {
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

  const [weekData] = useState<WeekDay[]>([])
  const [weekSummary] = useState<WeekSummary>({
    accumulated: '0시간 0분', remainDays: 0, totalDays: userWorkGroup.workDays.length,
    remainHours: `${WEEKLY_STD_HOURS}h`, totalWeekHours: `${WEEKLY_STD_HOURS}h`,
    overHours: '0h', leaveHours: '0h',
  })
  const [monthData] = useState<MonthDay[]>([])
  const [monthSummary] = useState<MonthSummary>({
    accumulated: '0시간 0분', workDays: 0, totalWorkDays: MONTHLY_WORK_DAYS,
    remainHours: `${MONTHLY_STD_HOURS}h`, totalMonthHours: `${MONTHLY_STD_HOURS}h`,
    overHours: '0h', leaveDays: 0,
  })
  const [statusChanges] = useState<StatusChangeRecord[]>([])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-bold text-gray-900">내 근태현황</h1>
        <button onClick={onOpenApply}
          className="px-4 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-lg hover:bg-[#178a65] transition-colors">
          신청
        </button>
      </div>

      {/* 기간 선택 */}
      <div className="flex items-center justify-center gap-3 mb-2">
        <button className="text-gray-400 hover:text-gray-600 transition-colors"><i className="fas fa-chevron-left" /></button>
        <span className="text-[15px] font-semibold text-gray-900">
          {viewMode === '주간' ? '-' : '-'}
        </span>
        <button className="text-gray-400 hover:text-gray-600 transition-colors"><i className="fas fa-chevron-right" /></button>
        <button className="text-[12px] text-gray-500 hover:text-[#1D9E75] ml-2 transition-colors">오늘</button>
      </div>
      <div className="flex justify-center mb-4">
        <div className="flex border border-gray-300 rounded overflow-hidden">
          {(['주간', '월간'] as AttendViewMode[]).map((m) => (
            <button key={m} onClick={() => onViewModeChange(m)}
              className={`px-4 py-1.5 text-[12px] transition-colors ${viewMode === m ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* 근무그룹 정보 */}
      <div className="text-[12px] text-gray-500 mb-4">
        {userWorkGroup.name} ({userWorkGroup.startTime} ~ {userWorkGroup.endTime})
        <span className="ml-2 text-gray-400">| 1일 {DAILY_HOURS}h · 주 {WEEKLY_STD_HOURS}h · 최대 {userWorkGroup.maxWeeklyHours}h</span>
      </div>

      {viewMode === '주간' ? (
        <>

          {/* 주간 요약 카드 */}
          <div className="border border-gray-200 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-8">
              <div className="flex-1">
                <div className="text-[13px] text-gray-700 mb-1">
                  주간누적 <span className="text-[#1D9E75] font-bold">{weekSummary.accumulated}</span>
                </div>
                <div className="text-[11px] text-gray-400 mb-3">이번주 적정 근무시간({WEEKLY_STD_HOURS}h)까지 {weekSummary.remainHours}이 더 필요해요.</div>
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-3 bg-gradient-to-r from-[#1D9E75] to-[#7dd3b8] rounded-full" style={{ width: '0%' }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span></span><span>{WEEKLY_STD_HOURS}h</span><span>{userWorkGroup.maxWeeklyHours}h</span>
                </div>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">잔여 근무일</div>
                  <div className="text-[18px] font-bold text-[#1D9E75]">{weekSummary.remainDays}<span className="text-[11px] text-gray-400">/{weekSummary.totalDays}일</span></div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">잔여 근로시간</div>
                  <div className="text-[18px] font-bold text-[#1D9E75]">{weekSummary.remainHours}<span className="text-[11px] text-gray-400">/{weekSummary.totalWeekHours}</span></div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">총 근로시간</div>
                  <div className="text-[18px] font-bold text-gray-900">{weekSummary.overHours}</div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">휴가</div>
                  <div className="text-[18px] font-bold text-gray-900">{weekSummary.leaveHours}</div>
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
