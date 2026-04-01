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

/* ══════════════════════════════════════
   Mock 데이터
   ══════════════════════════════════════ */
export const WEEK_DATA: WeekDay[] = [
  { label: '월', date: 30, isToday: false, checkIn: '09:32', checkOut: '11:58', workHours: '2h 25m', overHours: '2h 25m', leaveHours: '8h', type: '정상' },
  { label: '화', date: 31, isToday: true, checkIn: '09:40', workHours: '', leaveHours: '8h', type: '정상' },
  { label: '수', date: 1, isToday: false, type: '정상' },
  { label: '목', date: 2, isToday: false, type: '정상' },
  { label: '금', date: 3, isToday: false, type: '정상' },
  { label: '토', date: 4, isToday: false, type: '휴일' },
  { label: '일', date: 5, isToday: false, type: '휴일' },
]

export const WEEK_SUMMARY = { accumulated: '18시간 25분', remainDays: 3, totalDays: 5, remainHours: '24h 00m', totalWeekHours: '40h', overHours: '2h 25m', leaveHours: '16h 00m' }

export const MONTH_SUMMARY = {
  accumulated: '138시간 25분',
  workDays: 18,
  totalWorkDays: 22,
  remainHours: '37h 35m',
  totalMonthHours: '176h',
  overHours: '4h 50m',
  leaveDays: 3,
}

export function generateMonthData(): MonthDay[] {
  const days: MonthDay[] = []
  // 2026년 3월: 일~토 (3/1 = 일요일)
  // 이전 달 채우기 (2월 마지막 주)
  // 3/1이 일요일이므로 이전달 필요 없음
  const firstDayOfWeek = 0 // 일요일
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push({ date: 22 + i, isCurrentMonth: false, isToday: false, isHoliday: false, type: '정상' })
  }
  const todayDate = 31
  for (let d = 1; d <= 31; d++) {
    const dow = (firstDayOfWeek + d - 1) % 7 // 0=일
    const isHoliday = dow === 0 || dow === 6
    const isToday = d === todayDate
    const isFuture = d > todayDate
    let type: MonthDay['type'] = '정상'
    let checkIn: string | undefined
    let checkOut: string | undefined
    let workHours: string | undefined
    let leaveType: string | undefined

    if (isHoliday) {
      type = '휴일'
    } else if (isFuture) {
      type = '미래'
    } else if (d === 13 || d === 25 || d === 27) {
      type = '휴가'
      leaveType = '연차'
    } else if (d === 5) {
      type = '지각'
      checkIn = '09:42'
      checkOut = '18:30'
      workHours = '8h 10m'
    } else if (d === todayDate) {
      type = '정상'
      checkIn = '09:40'
    } else if (!isHoliday && !isFuture) {
      type = '정상'
      checkIn = `09:${String(Math.floor(Math.random() * 10)).padStart(2, '0')}`
      checkOut = `18:${String(Math.floor(Math.random() * 30)).padStart(2, '0')}`
      workHours = `8h ${Math.floor(Math.random() * 30)}m`
    }
    days.push({ date: d, isCurrentMonth: true, isToday, isHoliday, type, checkIn, checkOut, workHours, leaveType })
  }
  // 다음 달 채우기
  const remaining = 7 - (days.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: i, isCurrentMonth: false, isToday: false, isHoliday: false, type: '미래' })
    }
  }
  return days
}

export const MONTH_DATA = generateMonthData()

/* ══════════════════════════════════════
   근태관리 뷰
   ══════════════════════════════════════ */
export default function AttendanceView({ viewMode, onViewModeChange, onOpenApply }: { viewMode: AttendViewMode; onViewModeChange: (m: AttendViewMode) => void; onOpenApply: () => void }) {
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
          {viewMode === '주간' ? '2026-03-30 ~ 2026-04-05' : '2026년 03월'}
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

      {/* 기본그룹 */}
      <div className="text-[12px] text-gray-500 mb-4">기본그룹 (09:00 ~ 18:00)</div>

      {viewMode === '주간' ? (
        <>
          {/* 주간 요약 카드 */}
          <div className="border border-gray-200 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-8">
              <div className="flex-1">
                <div className="text-[13px] text-gray-700 mb-1">
                  주간누적 <span className="text-[#1D9E75] font-bold">{WEEK_SUMMARY.accumulated}</span>
                </div>
                <div className="text-[11px] text-gray-400 mb-3">이번주 24시간 0분이 더 필요해요.</div>
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-3 bg-gradient-to-r from-[#1D9E75] to-[#7dd3b8] rounded-full" style={{ width: '35%' }} />
                  <div className="h-3 bg-yellow-400 rounded-full absolute top-0" style={{ left: '35%', width: '5%' }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span></span><span>40h</span><span>52h</span>
                </div>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">잔여 근무일</div>
                  <div className="text-[18px] font-bold text-[#1D9E75]">{WEEK_SUMMARY.remainDays}<span className="text-[11px] text-gray-400">/{WEEK_SUMMARY.totalDays}일</span></div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">잔여 근로시간</div>
                  <div className="text-[18px] font-bold text-[#1D9E75]">{WEEK_SUMMARY.remainHours}<span className="text-[11px] text-gray-400">/{WEEK_SUMMARY.totalWeekHours}</span></div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">총 근로시간</div>
                  <div className="text-[18px] font-bold text-gray-900">{WEEK_SUMMARY.overHours}</div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">휴가</div>
                  <div className="text-[18px] font-bold text-gray-900">{WEEK_SUMMARY.leaveHours}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 주간 타임라인 */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
            <div className="grid grid-cols-7 border-b border-gray-200">
              {WEEK_DATA.map((d) => (
                <div key={d.date} className={`py-3 text-center border-r border-gray-100 last:border-r-0 ${d.isToday ? 'bg-gray-50' : ''}`}>
                  <div className={`text-[11px] ${d.isToday ? 'text-[#1D9E75] font-bold' : 'text-gray-500'}`}>{d.label}</div>
                  <div className={`text-[14px] font-semibold ${d.isToday ? 'text-[#1D9E75]' : 'text-gray-900'}`}>{d.date}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 min-h-[120px]">
              {WEEK_DATA.map((d) => (
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

          {/* 상세 테이블 */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-[12px]">
              <thead><tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-gray-500 font-medium text-left">근무시작</th>
                <th className="px-4 py-3 text-gray-500 font-medium text-left">근무종료</th>
                <th className="px-4 py-3 text-gray-500 font-medium text-left">총 근로시간</th>
                <th className="px-4 py-3 text-gray-500 font-medium text-left">상세 근로시간</th>
                <th className="px-4 py-3 text-gray-500 font-medium text-right">승인요청내역</th>
              </tr></thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-3 text-[#1D9E75]">09:40:00</td>
                  <td className="px-4 py-3 text-gray-400">-</td>
                  <td className="px-4 py-3 text-gray-700">0h 0m 0s</td>
                  <td className="px-4 py-3 text-gray-600">소정 0h / 초과 0h (연장: 0h, 야간 0h, 휴일 0h)</td>
                  <td className="px-4 py-3 text-right"><button className="text-[11px] text-blue-500 border border-blue-200 rounded px-2 py-0.5">1 건 보기</button></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 타임라인 바 */}
          <div className="border border-gray-200 rounded-xl p-4 mb-6">
            <div className="flex items-center text-[10px] text-gray-400 mb-2">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="flex-1 text-center">{String(i).padStart(2, '0')}</div>
              ))}
            </div>
            <div className="relative h-6 bg-gray-100 rounded mb-1">
              <div className="absolute top-0 left-[25%] right-[4%] h-6 bg-blue-200 rounded text-[9px] text-blue-700 flex items-center pl-1">연차</div>
            </div>
            <div className="relative h-6 bg-gray-100 rounded mb-3">
              <div className="absolute top-0 left-[40%] w-[10%] h-6 bg-[#1D9E75]/30 rounded text-[9px] text-[#1D9E75] flex items-center pl-1">출근</div>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-gray-500">
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
          </div>

          {/* 근무상태 변경 이력 */}
          <div>
            <h2 className="text-[14px] font-bold text-gray-900 mb-2">근무상태 변경 이력 <span className="text-gray-400 font-normal">0</span></h2>
            <div className="text-[12px] text-gray-400 py-8 text-center">변경 이력이 없습니다.</div>
          </div>
        </>
      ) : (
        <>
          {/* 월간 요약 카드 */}
          <div className="border border-gray-200 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-8">
              <div className="flex-1">
                <div className="text-[13px] text-gray-700 mb-1">
                  월간누적 <span className="text-[#1D9E75] font-bold">{MONTH_SUMMARY.accumulated}</span>
                </div>
                <div className="text-[11px] text-gray-400 mb-3">이번달 {MONTH_SUMMARY.remainHours}이 더 필요해요.</div>
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-3 bg-gradient-to-r from-[#1D9E75] to-[#7dd3b8] rounded-full" style={{ width: '78%' }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span></span><span>{MONTH_SUMMARY.totalMonthHours}</span>
                </div>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">근무일</div>
                  <div className="text-[18px] font-bold text-[#1D9E75]">{MONTH_SUMMARY.workDays}<span className="text-[11px] text-gray-400">/{MONTH_SUMMARY.totalWorkDays}일</span></div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">잔여 근로시간</div>
                  <div className="text-[18px] font-bold text-[#1D9E75]">{MONTH_SUMMARY.remainHours}<span className="text-[11px] text-gray-400">/{MONTH_SUMMARY.totalMonthHours}</span></div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">초과 근로</div>
                  <div className="text-[18px] font-bold text-gray-900">{MONTH_SUMMARY.overHours}</div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 mb-1">휴가</div>
                  <div className="text-[18px] font-bold text-gray-900">{MONTH_SUMMARY.leaveDays}<span className="text-[11px] text-gray-400">일</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* 월간 캘린더 */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                <div key={d} className={`py-2 text-center text-[11px] font-medium border-r border-gray-100 last:border-r-0 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'}`}>{d}</div>
              ))}
            </div>
            {/* 날짜 셀 */}
            <div className="grid grid-cols-7">
              {MONTH_DATA.map((d, idx) => {
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

          {/* 월간 상세 테이블 */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-[12px]">
              <thead><tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-gray-500 font-medium text-left">날짜</th>
                <th className="px-4 py-3 text-gray-500 font-medium text-left">근무시작</th>
                <th className="px-4 py-3 text-gray-500 font-medium text-left">근무종료</th>
                <th className="px-4 py-3 text-gray-500 font-medium text-left">총 근로시간</th>
                <th className="px-4 py-3 text-gray-500 font-medium text-left">상태</th>
              </tr></thead>
              <tbody>
                {MONTH_DATA.filter((d) => d.isCurrentMonth && d.type !== '미래' && d.type !== '휴일').map((d) => (
                  <tr key={d.date} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700">3/{d.date}</td>
                    <td className="px-4 py-3 text-[#1D9E75]">{d.checkIn ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{d.checkOut ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{d.workHours ?? '-'}</td>
                    <td className="px-4 py-3">
                      {d.type === '휴가' && <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-blue-50 text-blue-500">{d.leaveType}</span>}
                      {d.type === '지각' && <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-red-50 text-red-500">지각</span>}
                      {d.type === '정상' && <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-gray-100 text-gray-600">정상</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 범례 */}
          <div className="flex items-center gap-4 text-[10px] text-gray-500 mb-6">
            <span><span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-1" />정상</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1" />지각</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1" />휴가</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-purple-400 mr-1" />초과근로</span>
          </div>

          {/* 근무상태 변경 이력 */}
          <div>
            <h2 className="text-[14px] font-bold text-gray-900 mb-2">근무상태 변경 이력 <span className="text-gray-400 font-normal">0</span></h2>
            <div className="text-[12px] text-gray-400 py-8 text-center">변경 이력이 없습니다.</div>
          </div>
        </>
      )}
    </div>
  )
}
