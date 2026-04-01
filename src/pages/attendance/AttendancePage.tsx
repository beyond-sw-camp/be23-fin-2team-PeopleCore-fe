import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ApprovalFormModal from '../approval/ApprovalFormModal'

/* ══════════════════════════════════════
   타입
   ══════════════════════════════════════ */
interface LeaveRecord {
  id: number
  status: '완료' | '진행중' | '대기' | '취소'
  type: string
  days: number
  dateRange: string
  isPast: boolean
}

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

/* ══════════════════════════════════════
   Mock 데이터
   ══════════════════════════════════════ */
const LEAVE_SUMMARY = {
  period: '2026-02-09 ~ 2027-02-08',
  remaining: 2, used: 16, total: 18, years: 11,
  usedPercent: 88.9,
}

const LEAVE_TYPES = [
  { name: '보상휴가', desc: '초과근로에 해당하는 임금을...', sub: '' },
  { name: '출산휴가', desc: '신청 시 지급, 90d', sub: '~ 2026-06-19' },
  { name: '출산휴가-다태아', desc: '신청 시 지급, 120d', sub: '지급 120일 후 소멸' },
  { name: '배우자돌봄휴가', desc: '신청 시 지급, 20d', sub: '지급 120일 후 소멸' },
  { name: '가족돌봄휴가', desc: '신청 시 지급, 10d', sub: '무급' },
]

const UPCOMING_LEAVES: LeaveRecord[] = [
  { id: 1, status: '완료', type: '연차', days: 1, dateRange: '2026-04-10(금)', isPast: false },
  { id: 2, status: '완료', type: '연차', days: 1, dateRange: '2026-04-17(금)', isPast: false },
  { id: 3, status: '완료', type: '연차', days: 1, dateRange: '2026-04-23(목)', isPast: false },
  { id: 4, status: '완료', type: '연차', days: 1, dateRange: '2026-05-15(금)', isPast: false },
  { id: 5, status: '완료', type: '연차', days: 2, dateRange: '2026-05-28(목),\n2026-05-29(금)', isPast: false },
  { id: 6, status: '완료', type: '출산휴가', days: 1, dateRange: '2026-06-18(목)', isPast: false },
]

const PAST_LEAVES: LeaveRecord[] = [
  { id: 10, status: '진행중', type: '연차', days: 2, dateRange: '2026-03-30(월),\n2026-03-31(화)', isPast: true },
  { id: 11, status: '완료', type: '연차', days: 1, dateRange: '2026-03-27(금)', isPast: true },
  { id: 12, status: '진행중', type: '연차', days: 1, dateRange: '2026-03-25(수)', isPast: true },
  { id: 13, status: '완료', type: '연차', days: 1, dateRange: '2026-03-17(화)', isPast: true },
  { id: 14, status: '완료', type: '연차', days: 1, dateRange: '2026-03-13(금)', isPast: true },
  { id: 15, status: '완료', type: '연차', days: 1, dateRange: '2026-02-27(금)', isPast: true },
  { id: 16, status: '완료', type: '연차', days: 1, dateRange: '2026-02-25(수)', isPast: true },
  { id: 17, status: '완료', type: '연차', days: 1, dateRange: '2026-02-20(금)', isPast: true },
  { id: 18, status: '완료', type: '출산휴가', days: 1, dateRange: '2026-02-19(목)', isPast: true },
  { id: 19, status: '완료', type: '연차', days: 1, dateRange: '2026-02-13(금)', isPast: true },
]

const WEEK_DATA: WeekDay[] = [
  { label: '월', date: 30, isToday: false, checkIn: '09:32', checkOut: '11:58', workHours: '2h 25m', overHours: '2h 25m', leaveHours: '8h', type: '정상' },
  { label: '화', date: 31, isToday: true, checkIn: '09:40', workHours: '', leaveHours: '8h', type: '정상' },
  { label: '수', date: 1, isToday: false, type: '정상' },
  { label: '목', date: 2, isToday: false, type: '정상' },
  { label: '금', date: 3, isToday: false, type: '정상' },
  { label: '토', date: 4, isToday: false, type: '휴일' },
  { label: '일', date: 5, isToday: false, type: '휴일' },
]

const WEEK_SUMMARY = { accumulated: '18시간 25분', remainDays: 3, totalDays: 5, remainHours: '24h 00m', totalWeekHours: '40h', overHours: '2h 25m', leaveHours: '16h 00m' }

/* ── 월간 Mock 데이터 ── */
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

const MONTH_SUMMARY = {
  accumulated: '138시간 25분',
  workDays: 18,
  totalWorkDays: 22,
  remainHours: '37h 35m',
  totalMonthHours: '176h',
  overHours: '4h 50m',
  leaveDays: 3,
}

function generateMonthData(): MonthDay[] {
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

const MONTH_DATA = generateMonthData()

type MainTab = '휴가관리' | '근태관리' | '인사담당자'
type LeaveSubTab = '휴가현황' | '연차내역'
type AttendViewMode = '주간' | '월간'
type HrSubTab = '출퇴근' | '연차/휴가' | '초과근무' | '집계' | '정정'

/* ══════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════ */
export default function AttendancePage() {
  const [mainTab, setMainTab] = useState<MainTab>('휴가관리')
  const [leaveSubTab, setLeaveSubTab] = useState<LeaveSubTab>('휴가현황')
  const [attendViewMode, setAttendViewMode] = useState<AttendViewMode>('주간')
  const [leaveApplyOpen, setLeaveApplyOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [hrSubTab, setHrSubTab] = useState<HrSubTab>('출퇴근')
  const navigate = useNavigate()

  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const todayDate = new Date(2026, 2, 31)
  const todayStr = `${todayDate.getFullYear()}년 ${String(todayDate.getMonth() + 1).padStart(2, '0')}월 ${String(todayDate.getDate()).padStart(2, '0')}일 (${dayNames[todayDate.getDay()]}) ${String(todayDate.getHours()).padStart(2, '0')}:${String(todayDate.getMinutes()).padStart(2, '0')}`

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── 사이드 패널 ── */}
      <div className="w-[220px] bg-white border-r border-[#d1d5db] flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-[#d1d5db]">
          <h2 className="text-[15px] font-bold text-[#000000] mb-3">
            {mainTab === '휴가관리' ? '휴가' : mainTab === '근태관리' ? '근태' : '인사 담당자'}
          </h2>

          {mainTab === '휴가관리' && (
            <button onClick={() => setLeaveApplyOpen(true)}
              className="w-full py-2 border border-[#dde4e0] rounded-lg text-[13px] text-[#000000] font-medium hover:bg-[#E1F5EE] hover:border-[#1D9E75] transition-colors">
              휴가 신청
            </button>
          )}

          {mainTab === '근태관리' && (
            <div>
              <div className="text-[11px] text-gray-500 mb-2">{todayStr}</div>
              <div className="border border-gray-200 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                  <span>출근 시간</span><span>퇴근 시간</span>
                </div>
                <div className="flex items-center justify-between text-[14px] font-bold text-gray-900">
                  <span>09:40:00</span>
                  <span className="text-gray-300">→</span>
                  <span className="text-gray-400">-</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button className="py-2 border border-gray-300 rounded-lg text-[12px] text-gray-400 cursor-not-allowed">출근하기</button>
                <button className="py-2 border border-gray-300 rounded-lg text-[12px] text-gray-700 hover:bg-gray-50 transition-colors">퇴근하기</button>
              </div>
              <button className="w-full py-2 border border-[#1D9E75] rounded-lg text-[12px] text-[#1D9E75] font-medium hover:bg-[#E1F5EE] transition-colors">
                근무상태변경
              </button>
            </div>
          )}
        </div>

        {/* 사이드 메뉴 */}
        <nav className="p-2 space-y-0.5">
          {/* 휴가관리 */}
          <div
            onClick={() => setMainTab('휴가관리')}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] transition-colors ${mainTab === '휴가관리' ? 'text-[#1D9E75] font-medium' : 'text-[#000000] hover:bg-[#E1F5EE]'}`}
          >
            휴가 관리
          </div>
          {mainTab === '휴가관리' && (
            <div className="ml-4 space-y-0.5">
              <div onClick={() => setLeaveSubTab('휴가현황')}
                className={`px-3 py-1.5 text-[12px] cursor-pointer rounded transition-colors ${leaveSubTab === '휴가현황' ? 'text-[#1D9E75] font-medium' : 'text-gray-600 hover:bg-[#E1F5EE]'}`}>
                휴가현황
              </div>
              <div onClick={() => setLeaveSubTab('연차내역')}
                className={`px-3 py-1.5 text-[12px] cursor-pointer rounded transition-colors ${leaveSubTab === '연차내역' ? 'text-[#1D9E75] font-medium' : 'text-gray-600 hover:bg-[#E1F5EE]'}`}>
                연차내역
              </div>
            </div>
          )}

          {/* 근태관리 */}
          <div
            onClick={() => setMainTab('근태관리')}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-[13px] transition-colors ${mainTab === '근태관리' ? 'text-[#1D9E75] font-medium' : 'text-[#000000] hover:bg-[#E1F5EE]'}`}
          >
            근태 관리
          </div>

          {/* 인사 담당자 — TODO: 인사 담당자 권한일 때만 표시 */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider select-none">
              인사 담당자
            </div>
            <div className="space-y-0.5">
              {(['출퇴근', '연차/휴가', '초과근무', '집계', '정정'] as HrSubTab[]).map((sub) => (
                <div key={sub} onClick={() => { setMainTab('인사담당자'); setHrSubTab(sub) }}
                  className={`px-3 py-1.5 text-[12px] cursor-pointer rounded transition-colors ${mainTab === '인사담당자' && hrSubTab === sub ? 'text-[#1D9E75] font-medium bg-[#E1F5EE]' : 'text-gray-600 hover:bg-[#E1F5EE]'}`}>
                  {sub}
                </div>
              ))}
            </div>
          </div>
        </nav>
      </div>

      {/* ── 메인 콘텐츠 ── */}
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        {mainTab === '휴가관리' && leaveSubTab === '휴가현황' && <LeaveStatusView onOpenApply={() => setFormModalOpen(true)} />}
        {mainTab === '휴가관리' && leaveSubTab === '연차내역' && <LeaveHistoryView />}
        {mainTab === '근태관리' && <AttendanceView viewMode={attendViewMode} onViewModeChange={setAttendViewMode} onOpenApply={() => setFormModalOpen(true)} />}
        {mainTab === '인사담당자' && <HrManagerView subTab={hrSubTab} />}
      </div>

      <ApprovalFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onConfirm={(form) => {
          setFormModalOpen(false)
          navigate('/approval', { state: { openForm: { name: form.name, folder: form.folder, retention: form.retention } } })
        }}
        onAddFrequent={() => {}}
      />
      {leaveApplyOpen && <LeaveApplyModal onClose={() => setLeaveApplyOpen(false)} />}
    </div>
  )
}

/* ══════════════════════════════════════
   휴가현황 뷰
   ══════════════════════════════════════ */
function LeaveStatusView({ onOpenApply }: { onOpenApply: () => void }) {
  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 mb-4">휴가현황</h1>

      {/* 연차 현황 */}
      <h2 className="text-[14px] font-bold text-gray-900 mb-3">연차 현황</h2>
      <div className="border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="text-[13px] text-gray-700">{LEAVE_SUMMARY.period}</div>
            <div className="text-[11px] text-gray-400">입사일 기준</div>
          </div>
          <div className="text-[15px] font-semibold text-gray-900">2026-03-31</div>
        </div>
        <div className="flex items-center gap-6">
          {/* 프로그레스 바 영역 */}
          <div className="w-[280px] shrink-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1">
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-3 rounded-full ${LEAVE_SUMMARY.remaining <= 0 ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-[#1D9E75] to-[#4fc3a0]'}`} style={{ width: `${Math.min(LEAVE_SUMMARY.usedPercent, 100)}%` }} />
                </div>
              </div>
            </div>
            <span className={`text-[11px] font-medium ${LEAVE_SUMMARY.remaining <= 0 ? 'text-red-500' : 'text-[#1D9E75]'}`}>연차를 {LEAVE_SUMMARY.usedPercent}% 소진했습니다.</span>
            <div className="text-[11px] text-gray-400">소진률 {LEAVE_SUMMARY.usedPercent}% ({LEAVE_SUMMARY.used}/{LEAVE_SUMMARY.total})</div>
          </div>
          {/* 구분선 */}
          <div className="h-12 border-r border-gray-200" />
          {/* 수치 영역 */}
          <div className="flex flex-1">
            {[
              { label: '잔여 연차', value: `${LEAVE_SUMMARY.remaining}d`, color: LEAVE_SUMMARY.remaining <= 0 ? 'text-red-500' : 'text-[#1D9E75]' },
              { label: '사용 연차', value: `${LEAVE_SUMMARY.used}d`, color: 'text-gray-900' },
              { label: '총 연차', value: `${LEAVE_SUMMARY.total}d`, color: 'text-gray-900' },
              { label: '근속연수', value: `${LEAVE_SUMMARY.years}년`, color: 'text-gray-900' },
            ].map((s, i) => (
              <div key={s.label} className={`text-center flex-1 ${i < 3 ? 'border-r border-gray-200' : ''}`}>
                <div className="text-[11px] text-gray-500 mb-1">{s.label}</div>
                <div className={`text-[20px] font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 휴가신청 카드 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-bold text-gray-900">법적 근로 휴가 신청</h2>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {LEAVE_TYPES.map((t) => (
            <div key={t.name} onClick={onOpenApply} className="border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#1D9E75] hover:shadow-sm transition-all">
              <div className="text-[13px] font-semibold text-gray-900 mb-2">{t.name}</div>
              <div className="text-[11px] text-gray-500">{t.desc}</div>
              {t.sub && <div className="text-[10px] text-gray-400 mt-0.5">{t.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* 예정휴가 + 지난휴가 */}
      <div className="grid grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-xl p-5">
          <h3 className="text-[14px] font-bold text-gray-900 mb-3">예정휴가</h3>
          <table className="w-full text-[12px]">
            <thead><tr className="border-b border-gray-200">
              <th className="py-2 text-gray-500 font-medium text-left">상태</th>
              <th className="py-2 text-gray-500 font-medium text-left">휴가 종류</th>
              <th className="py-2 text-gray-500 font-medium text-left">휴가 일수</th>
              <th className="py-2 text-gray-500 font-medium text-left">휴가 기간</th>
            </tr></thead>
            <tbody>
              {UPCOMING_LEAVES.map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="py-2"><StatusBadge status={r.status} /></td>
                  <td className="py-2 text-gray-700">{r.type}</td>
                  <td className="py-2 text-gray-600">{r.days}d</td>
                  <td className="py-2 text-gray-600 whitespace-pre-line">{r.dateRange}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-bold text-gray-900">지난휴가</h3>
            <button className="text-[12px] text-gray-500 hover:text-[#1D9E75] transition-colors">더보기 &gt;</button>
          </div>
          <table className="w-full text-[12px]">
            <thead><tr className="border-b border-gray-200">
              <th className="py-2 text-gray-500 font-medium text-left">상태</th>
              <th className="py-2 text-gray-500 font-medium text-left">휴가 종류</th>
              <th className="py-2 text-gray-500 font-medium text-left">휴가 일수</th>
              <th className="py-2 text-gray-500 font-medium text-left">휴가 기간</th>
            </tr></thead>
            <tbody>
              {PAST_LEAVES.slice(0, 8).map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="py-2"><StatusBadge status={r.status} /></td>
                  <td className="py-2 text-gray-700">{r.type}</td>
                  <td className="py-2 text-gray-600">{r.days}d</td>
                  <td className="py-2 text-gray-600 whitespace-pre-line">{r.dateRange}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   연차내역 뷰
   ══════════════════════════════════════ */
const LEAVE_HISTORY_SUMMARY = {
  remaining: 0, used: 18, total: 18, generated: 20, adjusted: 0, expired: 0,
  hireDate: '2015-02-09', recognizedDate: '2015-02-09',
}

const LEAVE_MONTHLY = [
  { month: '2026-...', badge: '발생월', remaining: 7, usedReq: 11, usedReal: 7, total: 18, generated: 20, adjusted: 0, expired: 0, remainColor: 'text-[#1D9E75]' },
  { month: '2026-...', badge: '이번달', remaining: 0, usedReq: 7, usedReal: 8, total: 18, generated: 0, adjusted: 0, expired: 0, remainColor: 'text-red-500' },
  { month: '2026-04', badge: '', remaining: 0, usedReq: 0, usedReal: 3, total: 18, generated: 0, adjusted: 0, expired: 0, remainColor: 'text-red-500' },
  { month: '2026-05', badge: '', remaining: 0, usedReq: 0, usedReal: 3, total: 18, generated: 0, adjusted: 0, expired: 0, remainColor: 'text-red-500' },
  { month: '2026-06', badge: '', remaining: 0, usedReq: 0, usedReal: 0, total: 18, generated: 0, adjusted: 0, expired: 0, remainColor: 'text-red-500' },
]

function LeaveHistoryView() {
  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 mb-6">연차내역</h1>

      {/* 기간 선택 */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <button className="text-gray-400 hover:text-gray-600 transition-colors"><i className="fas fa-chevron-left" /></button>
        <span className="text-[18px] font-bold text-gray-900">2026-02-09 ~ 2027-02-08</span>
        <button className="text-gray-400 hover:text-gray-600 transition-colors"><i className="fas fa-chevron-right" /></button>
        <button className="text-[12px] text-gray-500 hover:text-[#1D9E75] ml-2 transition-colors">오늘</button>
      </div>

      {/* 연차현황 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-[15px] font-bold text-gray-900">연차현황</h2>
          <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">입사일 {LEAVE_HISTORY_SUMMARY.hireDate}</span>
          <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">인정입사일 {LEAVE_HISTORY_SUMMARY.recognizedDate}</span>
        </div>
        <div className="border border-gray-200 rounded-xl p-5">
          <div className="grid grid-cols-6 text-center">
            {[
              { label: '잔여 연차', value: `${LEAVE_HISTORY_SUMMARY.remaining}d`, color: LEAVE_HISTORY_SUMMARY.remaining <= 0 ? 'text-red-500' : 'text-[#1D9E75]' },
              { label: '사용(신청)연차', value: `${LEAVE_HISTORY_SUMMARY.used}d`, color: 'text-gray-900' },
              { label: '총 연차', value: `${LEAVE_HISTORY_SUMMARY.total}d`, color: 'text-gray-900' },
              { label: '발생 연차', value: `${LEAVE_HISTORY_SUMMARY.generated}d`, color: 'text-gray-900' },
              { label: '조정 연차', value: `${LEAVE_HISTORY_SUMMARY.adjusted}d`, color: 'text-gray-900' },
              { label: '소멸 연차', value: `${LEAVE_HISTORY_SUMMARY.expired}d`, color: 'text-gray-900' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-[11px] text-gray-500 mb-1">{s.label}</div>
                <div className={`text-[22px] font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 연차내역 테이블 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-bold text-gray-900">연차내역</h2>
        <button className="text-[12px] text-gray-500 hover:text-[#1D9E75] transition-colors flex items-center gap-1">
          <i className="fas fa-download text-[10px]" /> 엑셀 다운로드
        </button>
      </div>
      <table className="w-full text-[12px]">
        <thead><tr className="border-b border-gray-200">
          <th className="px-3 py-3 text-gray-500 font-medium text-left">연월</th>
          <th className="px-3 py-3 text-gray-500 font-medium text-left">잔여연차</th>
          <th className="px-3 py-3 text-gray-500 font-medium text-left">사용(신청)연차</th>
          <th className="px-3 py-3 text-gray-500 font-medium text-left">실사용(소진)연차</th>
          <th className="px-3 py-3 text-gray-500 font-medium text-left">총연차</th>
          <th className="px-3 py-3 text-gray-500 font-medium text-left">발생연차</th>
          <th className="px-3 py-3 text-gray-500 font-medium text-left">조정연차</th>
          <th className="px-3 py-3 text-gray-500 font-medium text-left">소멸연차</th>
        </tr></thead>
        <tbody>
          {LEAVE_MONTHLY.map((r, i) => (
            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-3 py-3 text-gray-700">
                <span>{r.month}</span>
                {r.badge && <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded ${r.badge === '발생월' ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'bg-yellow-50 text-yellow-600'}`}>{r.badge}</span>}
              </td>
              <td className={`px-3 py-3 font-semibold ${r.remainColor}`}>{r.remaining}d</td>
              <td className="px-3 py-3 text-gray-700">{r.usedReq}d</td>
              <td className="px-3 py-3 text-gray-700">{r.usedReal}d</td>
              <td className="px-3 py-3 text-gray-700">{r.total}d</td>
              <td className="px-3 py-3 text-gray-700">{r.generated}d</td>
              <td className="px-3 py-3 text-gray-700">{r.adjusted}d</td>
              <td className="px-3 py-3 text-gray-700">{r.expired}d</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ══════════════════════════════════════
   근태관리 뷰
   ══════════════════════════════════════ */
function AttendanceView({ viewMode, onViewModeChange, onOpenApply }: { viewMode: AttendViewMode; onViewModeChange: (m: AttendViewMode) => void; onOpenApply: () => void }) {
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

/* ══════════════════════════════════════
   상태 배지
   ══════════════════════════════════════ */
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    '완료': 'bg-gray-100 text-gray-600', '진행중': 'bg-[#E1F5EE] text-[#1D9E75]',
    '대기': 'bg-yellow-50 text-yellow-600', '취소': 'bg-red-50 text-red-500',
  }
  return <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${colors[status] ?? 'bg-gray-100 text-gray-500'}`}>{status}</span>
}

/* ══════════════════════════════════════
   휴가 신청 모달
   ══════════════════════════════════════ */
type DayOption = '종일' | '반차(오전)' | '반차(오후)' | '반반차'
const DAY_OPTION_VALUE: Record<DayOption, number> = { '종일': 1, '반차(오전)': 0.5, '반차(오후)': 0.5, '반반차': 0.25 }

const LEAVE_TYPE_OPTIONS = [
  { value: '연차', unit: '일', remaining: LEAVE_SUMMARY.remaining, desc: '연차 유급 휴가' },
  { value: '보상휴가', unit: '일', remaining: 0, desc: '초과근로에 해당하는 임금을...' },
  { value: '출산휴가', unit: '일', remaining: 90, desc: '출산 휴가' },
  { value: '출산휴가-다태아', unit: '일', remaining: 120, desc: '출산 휴가 (다태아)' },
  { value: '배우자돌봄휴가', unit: '일', remaining: 20, desc: '배우자 돌봄 휴가' },
  { value: '가족돌봄휴가', unit: '일', remaining: 10, desc: '가족 돌봄 휴가 (무급)' },
]

interface SelectedDate { key: string; option: DayOption }

function LeaveApplyModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState('연차')
  const [selMode, setSelMode] = useState<'날짜 선택' | '기간 지정'>('날짜 선택')
  const [calYear, setCalYear] = useState(2026)
  const [calMonth, setCalMonth] = useState(3)
  const [selectedDates, setSelectedDates] = useState<SelectedDate[]>([])
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')
  const [rangeOption, setRangeOption] = useState<DayOption>('종일')

  const currentType = LEAVE_TYPE_OPTIONS.find((t) => t.value === type) ?? LEAVE_TYPE_OPTIONS[0]
  const maxDays = currentType.remaining

  // 선택된 일수 합산
  const selectedCount = selMode === '날짜 선택'
    ? selectedDates.reduce((sum, d) => sum + DAY_OPTION_VALUE[d.option], 0)
    : (() => {
        if (!rangeStart || !rangeEnd) return 0
        const s = new Date(rangeStart); const e = new Date(rangeEnd)
        if (e < s) return 0
        let count = 0; const cur = new Date(s)
        while (cur <= e) { if (cur.getDay() !== 0 && cur.getDay() !== 6) count++; cur.setDate(cur.getDate() + 1) }
        return count * DAY_OPTION_VALUE[rangeOption]
      })()

  // 달력 생성
  const firstDay = new Date(calYear, calMonth - 1, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth, 0).getDate()
  const calCells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) calCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d)

  const toggleDate = (day: number) => {
    const dow = new Date(calYear, calMonth - 1, day).getDay()
    if (dow === 0 || dow === 6) return
    const key = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const existing = selectedDates.find((d) => d.key === key)
    if (existing) {
      setSelectedDates((prev) => prev.filter((d) => d.key !== key))
    } else {
      const nextCount = selectedDates.reduce((sum, d) => sum + DAY_OPTION_VALUE[d.option], 0) + 1
      if (nextCount > maxDays) return
      setSelectedDates((prev) => [...prev, { key, option: '종일' }])
    }
  }

  const updateDateOption = (key: string, option: DayOption) => {
    const newDates = selectedDates.map((d) => d.key === key ? { ...d, option } : d)
    const newCount = newDates.reduce((sum, d) => sum + DAY_OPTION_VALUE[d.option], 0)
    if (newCount > maxDays) return
    setSelectedDates(newDates)
  }

  const prevMonth = () => {
    if (calMonth === 1) { setCalYear((y) => y - 1); setCalMonth(12) }
    else setCalMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 12) { setCalYear((y) => y + 1); setCalMonth(1) }
    else setCalMonth((m) => m + 1)
  }

  const formatDateShort = (key: string) => {
    const parts = key.split('-')
    return `${parts[1]}/${parts[2]}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[720px] flex flex-col max-h-[90vh]">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-[16px] font-bold text-gray-900">휴가 신청</h2>
          <p className="text-[12px] text-gray-500 mt-1">신청할 휴가와 일자를 선택하여 전자결재 진행 시 휴가 신청이 완료됩니다.</p>
        </div>

        <div className="px-6 py-5 overflow-y-auto space-y-5">
          {/* 휴가유형 */}
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold text-gray-900 shrink-0">휴가유형 <span className="text-red-500">*</span></span>
            <select value={type} onChange={(e) => { setType(e.target.value); setSelectedDates([]); setRangeStart(''); setRangeEnd('') }}
              className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none">
              {LEAVE_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.value}</option>)}
            </select>
            <span className="text-[12px] text-[#1D9E75] font-medium">휴가신청단위 : {currentType.unit}</span>
          </div>
          <div className="text-[12px] text-gray-500 -mt-2 ml-[1px]">{currentType.desc}</div>

          {/* 보유 휴가 */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center gap-8">
            <span className="text-[13px] text-gray-600">보유 휴가</span>
            <span className={`text-[15px] font-bold ${maxDays <= 0 ? 'text-red-500' : 'text-gray-900'}`}>{maxDays}d</span>
          </div>

          {/* 휴가신청일 */}
          <div>
            <div className="flex items-center gap-4 mb-3">
              <span className="text-[13px] font-semibold text-gray-900 shrink-0">휴가신청일 <span className="text-red-500">*</span></span>
              <label className="flex items-center gap-1.5 text-[12px] text-gray-700 cursor-pointer">
                <input type="radio" name="selMode" checked={selMode === '날짜 선택'} onChange={() => { setSelMode('날짜 선택'); setRangeStart(''); setRangeEnd('') }} className="accent-[#1D9E75]" />
                날짜 선택
              </label>
              <label className="flex items-center gap-1.5 text-[12px] text-gray-700 cursor-pointer">
                <input type="radio" name="selMode" checked={selMode === '기간 지정'} onChange={() => { setSelMode('기간 지정'); setSelectedDates([]) }} className="accent-[#1D9E75]" />
                기간 지정
              </label>
            </div>

            {selMode === '날짜 선택' ? (
              <div className="flex gap-4">
                {/* 캘린더 */}
                <div className="border border-gray-200 rounded-lg p-4 w-[320px] shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={prevMonth} className="text-gray-400 hover:text-gray-600"><i className="fas fa-chevron-left text-[12px]" /></button>
                    <span className="text-[14px] font-bold text-gray-900">{calYear}년 {calMonth}월</span>
                    <button onClick={nextMonth} className="text-gray-400 hover:text-gray-600"><i className="fas fa-chevron-right text-[12px]" /></button>
                  </div>
                  <div className="grid grid-cols-7 text-center text-[11px] text-gray-500 mb-1">
                    {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                      <div key={d} className={i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : ''}>{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 text-center">
                    {calCells.map((day, idx) => {
                      if (day === null) return <div key={`e${idx}`} className="py-1.5" />
                      const key = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                      const isSelected = selectedDates.some((d) => d.key === key)
                      const dow = new Date(calYear, calMonth - 1, day).getDay()
                      const isWeekend = dow === 0 || dow === 6
                      const currentCount = selectedDates.reduce((sum, d) => sum + DAY_OPTION_VALUE[d.option], 0)
                      const wouldExceed = !isSelected && currentCount + 1 > maxDays
                      const disabled = isWeekend || wouldExceed
                      return (
                        <button key={key} onClick={() => !disabled && toggleDate(day)}
                          className={`py-1.5 text-[13px] rounded transition-colors ${
                            isSelected ? 'bg-[#1D9E75] text-white font-bold'
                            : disabled ? 'text-gray-300 cursor-not-allowed'
                            : dow === 0 ? 'text-red-400 hover:bg-red-50'
                            : dow === 6 ? 'text-blue-400 hover:bg-blue-50'
                            : 'text-gray-900 hover:bg-gray-100'
                          }`}>
                          {day}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 신청 정보 */}
                <div className="flex-1 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[13px] text-gray-600">신청휴가수</span>
                    <span className={`text-[15px] font-bold ${selectedCount > maxDays ? 'text-red-500' : 'text-gray-900'}`}>{selectedCount}d</span>
                    <button className="text-[11px] text-[#1D9E75] hover:underline ml-auto">신청가이드</button>
                  </div>
                  <div className="text-[11px] text-gray-400 space-y-1">
                    <p>반차, 반반차 등 휴가를 신청하는 경우 옵션을 변경해주세요.</p>
                    <p>소정근로시간이 같은 기간끼리 휴가신청이 가능합니다.</p>
                  </div>
                  {selectedDates.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {[...selectedDates].sort((a, b) => a.key.localeCompare(b.key)).map((d) => (
                        <div key={d.key} className="flex items-center gap-2">
                          <span className="bg-[#1D9E75] text-white text-[11px] px-2 py-1 rounded-full flex items-center gap-1.5">
                            {formatDateShort(d.key)}
                            <button onClick={() => setSelectedDates((prev) => prev.filter((x) => x.key !== d.key))} className="hover:text-red-200">&times;</button>
                          </span>
                          <select value={d.option} onChange={(e) => updateDateOption(d.key, e.target.value as DayOption)}
                            className="border border-gray-300 rounded px-2 py-1 text-[11px] outline-none text-gray-600">
                            <option value="종일">종일</option>
                            <option value="반차(오전)">반차(오전)</option>
                            <option value="반차(오후)">반차(오후)</option>
                            <option value="반반차">반반차</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex gap-4">
                {/* 기간 지정 */}
                <div className="border border-gray-200 rounded-lg p-4 flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[12px] text-gray-600">시작일</span>
                    <input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none" />
                    <span className="text-gray-400">~</span>
                    <span className="text-[12px] text-gray-600">종료일</span>
                    <input type="date" value={rangeEnd} onChange={(e) => {
                      const v = e.target.value
                      if (rangeStart && v) {
                        const s = new Date(rangeStart); const end = new Date(v)
                        let cnt = 0; const cur = new Date(s)
                        while (cur <= end) { if (cur.getDay() !== 0 && cur.getDay() !== 6) cnt++; cur.setDate(cur.getDate() + 1) }
                        if (cnt * DAY_OPTION_VALUE[rangeOption] > maxDays) return
                      }
                      setRangeEnd(v)
                    }} className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none" />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[12px] text-gray-600">적용</span>
                    <select value={rangeOption} onChange={(e) => setRangeOption(e.target.value as DayOption)}
                      className="border border-gray-300 rounded px-2 py-1 text-[11px] outline-none text-gray-600">
                      <option value="종일">종일</option>
                      <option value="반차(오전)">반차(오전)</option>
                      <option value="반차(오후)">반차(오후)</option>
                      <option value="반반차">반반차</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-gray-600">신청휴가수</span>
                    <span className={`text-[15px] font-bold ${selectedCount > maxDays ? 'text-red-500' : 'text-gray-900'}`}>{selectedCount}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-2">
                    <p>반차, 반반차 등 휴가를 신청하는 경우 옵션을 변경해주세요.</p>
                    <p>소정근로시간이 같은 기간끼리 휴가신청이 가능합니다.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">취소</button>
          <button onClick={onClose}
            disabled={selectedCount === 0 || selectedCount > maxDays}
            className={`px-5 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
              selectedCount > 0 && selectedCount <= maxDays
                ? 'bg-[#1D9E75] text-white hover:bg-[#178a65]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}>
            전자결재 상신
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   인사 담당자 뷰
   ══════════════════════════════════════ */
function HrManagerView({ subTab }: { subTab: HrSubTab }) {
  return (
    <div>
      {subTab === '출퇴근' && <HrAttendanceTab />}
      {subTab === '연차/휴가' && <HrLeaveVacationTab />}
      {subTab === '초과근무' && <HrOvertimeTab />}
      {subTab === '집계' && <HrStatsTab />}
      {subTab === '정정' && <HrCorrectionTab />}
    </div>
  )
}

/* ── 출퇴근 관리 ── */
const HR_ATTEND_MOCK = [
  { id: 1, empNo: '-', name: '강희계', dept: '경영', group: '기본그룹', checkIn: '09:53:43', checkOut: '18:00:00', workHours: '7h 6m 17s', leave: '8h', holiday: '', abnormal: '휴가 중 출근, 출퇴근 누...' },
  { id: 2, empNo: '-', name: '권시정', dept: '경영', group: '기본그룹', checkIn: '09:53:36', checkOut: '18:00:00', workHours: '7h 6m 17s', leave: '8h', holiday: '', abnormal: '휴가 중 출근, 출퇴근 누...' },
  { id: 3, empNo: '-', name: '김인재', dept: '경영', group: '기본그룹', checkIn: '09:40:00', checkOut: '18:00:00', workHours: '7h 20m 0s', leave: '8h', holiday: '', abnormal: '휴가 중 출근, 출퇴근 누...' },
  { id: 4, empNo: '-', name: '박지현', dept: '경영', group: '기본그룹', checkIn: '09:53:21', checkOut: '18:00:00', workHours: '7h 6m 39s', leave: '8h', holiday: '', abnormal: '휴가 중 출근, 출퇴근 누...' },
  { id: 5, empNo: '-', name: '이수진', dept: '경영', group: '기본그룹', checkIn: '-', checkOut: '-', workHours: '-', leave: '8h', holiday: '', abnormal: '결근' },
  { id: 6, empNo: '-', name: '박서준', dept: '개발', group: '기본그룹', checkIn: '09:05:12', checkOut: '19:30:00', workHours: '9h 24m 48s', leave: '8h', holiday: '', abnormal: '' },
  { id: 7, empNo: '-', name: '이민호', dept: '개발', group: '기본그룹', checkIn: '09:10:05', checkOut: '18:00:00', workHours: '7h 49m 55s', leave: '8h', holiday: '', abnormal: '' },
  { id: 8, empNo: '-', name: '송미래', dept: '인사', group: '기본그룹', checkIn: '08:50:30', checkOut: '-', workHours: '-', leave: '8h', holiday: '', abnormal: '' },
]

const TOTAL_EMP = 22

function HrAttendanceTab() {
  const [viewMode, setViewMode] = useState<'일자별' | '기간별'>('일자별')
  const [search, setSearch] = useState('')
  const [perPage, setPerPage] = useState(50)

  // 요약 데이터
  const summary = {
    normal: 0, late: 2, earlyLeave: 0, breakShort: 0,
    allDay: 0, leaveIn: 4, missPunch: 22, underHours: 2,
    offsite: 0, unapprovedOT: 4,
  }

  const filtered = search ? HR_ATTEND_MOCK.filter((d) => d.name.includes(search) || d.dept.includes(search)) : HR_ATTEND_MOCK

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 mb-4">전사 근태현황</h1>

      {/* 날짜 선택 */}
      <div className="flex items-center justify-center gap-3 mb-2">
        {viewMode === '일자별' ? (<>
          <button className="text-gray-400 hover:text-gray-600"><i className="fas fa-chevron-left" /></button>
          <span className="text-[18px] font-bold text-gray-900">2026-03-31</span>
          <button className="text-gray-400 hover:text-gray-600"><i className="fas fa-chevron-right" /></button>
          <button className="text-[12px] text-gray-500 hover:text-[#1D9E75] ml-2">오늘</button>
        </>) : (<>
          <input type="date" defaultValue="2026-03-01" className="bg-transparent text-[18px] font-bold text-gray-900 outline-none cursor-pointer" />
          <span className="text-[16px] text-gray-400">~</span>
          <input type="date" defaultValue="2026-03-31" className="bg-transparent text-[18px] font-bold text-gray-900 outline-none cursor-pointer" />
        </>)}
      </div>
      <div className="flex justify-end mb-4">
        <div className="flex border border-gray-300 rounded overflow-hidden">
          {(['일자별', '기간별'] as const).map((m) => (
            <button key={m} onClick={() => setViewMode(m)} className={`px-4 py-1.5 text-[12px] transition-colors ${viewMode === m ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{m}</button>
          ))}
        </div>
      </div>

      {/* 요약 카드 3그룹 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* 근무 상태 */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="text-[12px] text-gray-500 mb-3 flex items-center gap-1"><i className="far fa-clock text-[10px]" /> 근무 상태</div>
          <div className="grid grid-cols-1 gap-2">
            <div className="border border-gray-100 rounded-lg p-3">
              <span className="text-[11px] text-[#1D9E75] font-semibold border border-[#1D9E75] rounded px-1.5 py-0.5">정상</span>
              <div className="mt-2"><span className="text-[24px] font-bold text-gray-900">{summary.normal}</span><span className="text-[12px] text-gray-500 ml-0.5">명</span></div>
              <div className="text-[11px] text-gray-400">{Math.round(summary.normal / TOTAL_EMP * 100)}% {TOTAL_EMP}명 기준</div>
            </div>
            <div className="border border-gray-100 rounded-lg p-3">
              <span className="text-[11px] text-gray-500 font-semibold border border-gray-300 rounded px-1.5 py-0.5">종일근무상태</span>
              <div className="mt-2"><span className="text-[24px] font-bold text-gray-900">{summary.allDay}</span><span className="text-[12px] text-gray-500 ml-0.5">명</span></div>
              <div className="text-[11px] text-gray-400">{Math.round(summary.allDay / TOTAL_EMP * 100)}% {TOTAL_EMP}명 기준</div>
            </div>
          </div>
        </div>

        {/* 시간 및 기록 이상 */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="text-[12px] text-gray-500 mb-3 flex items-center gap-1"><i className="fas fa-exclamation-circle text-[10px] text-yellow-500" /> 시간 및 기록 이상</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '지각', value: summary.late, color: 'text-orange-500 border-orange-400' },
              { label: '조퇴', value: summary.earlyLeave, color: 'text-orange-500 border-orange-400' },
              { label: '휴게시간 부족', value: summary.breakShort, color: 'text-orange-500 border-orange-400' },
              { label: '휴가 중 출근', value: summary.leaveIn, color: 'text-yellow-600 border-yellow-400' },
              { label: '출퇴근 누락', value: summary.missPunch, color: 'text-red-500 border-red-400' },
              { label: '1일 소정근로시간 미달', value: summary.underHours, color: 'text-red-500 border-red-400' },
            ].map((c) => (
              <div key={c.label} className="border border-gray-100 rounded-lg p-3">
                <span className={`text-[11px] font-semibold border rounded px-1.5 py-0.5 ${c.color}`}>{c.label}</span>
                <div className="mt-2"><span className="text-[24px] font-bold text-gray-900">{c.value}</span><span className="text-[12px] text-gray-500 ml-0.5">명</span></div>
                <div className="text-[11px] text-gray-400">{Math.round(c.value / TOTAL_EMP * 100)}% {TOTAL_EMP}명 기준</div>
              </div>
            ))}
          </div>
        </div>

        {/* 비정상적 근무 상태 */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="text-[12px] text-gray-500 mb-3 flex items-center gap-1"><i className="fas fa-exclamation-triangle text-[10px] text-red-400" /> 비정상적 근무 상태</div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { label: '근무지 외 근태체크', value: summary.offsite, color: 'text-red-500 border-red-400' },
              { label: '미승인 초과근무', value: summary.unapprovedOT, color: 'text-red-500 border-red-400' },
            ].map((c) => (
              <div key={c.label} className="border border-gray-100 rounded-lg p-3">
                <span className={`text-[11px] font-semibold border rounded px-1.5 py-0.5 ${c.color}`}>{c.label}</span>
                <div className="mt-2"><span className="text-[24px] font-bold text-gray-900">{c.value}</span><span className="text-[12px] text-gray-500 ml-0.5">명</span></div>
                <div className="text-[11px] text-gray-400">{Math.round(c.value / TOTAL_EMP * 100)}% {TOTAL_EMP}명 기준</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 검색 + 엑셀 다운로드 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <select className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none">
            <option value="전체">재직상태 전체</option>
            <option value="재직" selected>재직상태 재직</option>
            <option value="퇴사">재직상태 퇴사</option>
          </select>
          <div className="flex items-center border border-gray-300 rounded px-2 py-1.5">
            <i className="fas fa-search text-gray-400 text-[11px] mr-2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="부서, 사번, 이름을 검색하세요.." className="text-[12px] outline-none bg-transparent w-48 placeholder-gray-400" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-[12px] text-gray-500 hover:text-[#1D9E75] flex items-center gap-1"><i className="fas fa-download text-[10px]" /> 엑셀 다운로드</button>
          <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none">
            {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
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
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">휴일대체</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">근태이상</th>
        </tr></thead>
        <tbody>
          {filtered.slice(0, perPage).map((d) => (
            <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2.5 text-gray-500">{d.empNo}</td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 shrink-0"><i className="fas fa-user" /></div>
                  <span className="text-gray-800 font-medium">{d.name}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-gray-600">{d.dept}</td>
              <td className="px-3 py-2.5 text-gray-600">{d.group}</td>
              <td className="px-3 py-2.5 text-[#1D9E75]">{d.checkIn}</td>
              <td className="px-3 py-2.5 text-gray-600">{d.checkOut}</td>
              <td className="px-3 py-2.5 text-gray-700">{d.workHours}</td>
              <td className="px-3 py-2.5 text-gray-600">{d.leave}</td>
              <td className="px-3 py-2.5 text-gray-500">{d.holiday || '-'}</td>
              <td className="px-3 py-2.5 text-red-500 max-w-[150px] truncate" title={d.abnormal}>{d.abnormal || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── 연차/휴가 관리 ── */
const HR_LEAVE_MOCK = [
  { id: 1, name: '강희계', position: '부장', dept: '경영', hireDate: '2017-01-01', retireDate: '', years: 9, period: '2026-01-01 ~ 2026-12-31', remaining: 4, used: 15, total: 19, generated: 19, carried: 0, adjusted: 0, expired: 0 },
  { id: 2, name: '권시정', position: '차장', dept: '경영', hireDate: '2014-12-31', retireDate: '', years: 11, period: '2025-12-31 ~ 2026-12-30', remaining: -5, used: 25, total: 20, generated: 20, carried: 0, adjusted: 0, expired: 0 },
  { id: 3, name: '김인재', position: '차장', dept: '경영', hireDate: '2015-02-09', retireDate: '', years: 11, period: '2026-02-09 ~ 2027-02-08', remaining: 0, used: 18, total: 18, generated: 20, carried: -2, adjusted: 0, expired: 0 },
  { id: 4, name: '박지현', position: '과장', dept: '경영', hireDate: '2020-05-24', retireDate: '', years: 5, period: '2025-05-24 ~ 2026-05-23', remaining: 13, used: 4, total: 17, generated: 17, carried: 0, adjusted: 0, expired: 0 },
  { id: 5, name: '이수진', position: '대리', dept: '경영', hireDate: '2023-12-31', retireDate: '', years: 2, period: '2025-12-31 ~ 2026-12-30', remaining: 15, used: 0, total: 15, generated: 15, carried: 0, adjusted: 0, expired: 0 },
  { id: 6, name: '박서준', position: '팀장', dept: '개발', hireDate: '2022-05-26', retireDate: '', years: 3, period: '2025-05-26 ~ 2026-05-25', remaining: 16, used: 0, total: 16, generated: 16, carried: 0, adjusted: 0, expired: 0 },
  { id: 7, name: '이민호', position: '과장', dept: '개발', hireDate: '2020-01-19', retireDate: '', years: 6, period: '2026-01-19 ~ 2027-01-18', remaining: 16, used: 1, total: 17, generated: 17, carried: 0, adjusted: 0, expired: 0 },
  { id: 8, name: '최예린', position: '대리', dept: '개발', hireDate: '2023-12-31', retireDate: '', years: 2, period: '2025-12-31 ~ 2026-12-30', remaining: 15, used: 0, total: 15, generated: 15, carried: 0, adjusted: 0, expired: 0 },
  { id: 9, name: '한도윤', position: '사원', dept: '개발', hireDate: '2025-05-30', retireDate: '', years: 0, period: '2026-01-01 ~ 2026-12-31', remaining: 9, used: 0, total: 9, generated: 2, carried: 0, adjusted: 0, expired: 0 },
  { id: 10, name: '송미래', position: '팀장', dept: '인사', hireDate: '2017-01-02', retireDate: '', years: 9, period: '2026-01-02 ~ 2027-01-01', remaining: 0, used: 0, total: 0, generated: 0, carried: 0, adjusted: 0, expired: 0 },
  { id: 11, name: '윤서연', position: '과장', dept: '인사', hireDate: '2020-06-01', retireDate: '', years: 5, period: '2025-06-01 ~ 2026-05-31', remaining: 11, used: 6, total: 17, generated: 17, carried: 0, adjusted: 0, expired: 0 },
]

const HR_VACATION_MOCK = [
  { id: 1, name: '권시정', dept: '경영', leaveType: '보상휴가', dayOption: '종일', dates: '2026-04-10', days: 1, status: '승인대기', appliedAt: '2026-03-28' },
  { id: 2, name: '박지현', dept: '경영', leaveType: '출산휴가', dayOption: '종일', dates: '2026-04-14 ~ 07-12', days: 90, status: '승인대기', appliedAt: '2026-03-29' },
  { id: 3, name: '이민호', dept: '개발', leaveType: '배우자돌봄휴가', dayOption: '종일', dates: '2026-04-15 ~ 04-16', days: 2, status: '승인대기', appliedAt: '2026-03-30' },
  { id: 4, name: '강희계', dept: '경영', leaveType: '보상휴가', dayOption: '종일', dates: '2026-04-11', days: 1, status: '승인완료', appliedAt: '2026-03-25' },
  { id: 5, name: '박서준', dept: '개발', leaveType: '가족돌봄휴가', dayOption: '반차(오전)', dates: '2026-04-07', days: 0.5, status: '승인완료', appliedAt: '2026-03-20' },
  { id: 6, name: '이수진', dept: '경영', leaveType: '출산휴가-다태아', dayOption: '종일', dates: '2026-04-20 ~ 08-17', days: 120, status: '승인대기', appliedAt: '2026-03-31' },
]

function HrLeaveVacationTab() {
  const [innerTab, setInnerTab] = useState<'휴가현황' | '연차' | '기타휴가' | '법적 근로 휴가 결재'>('휴가현황')
  const [deptFilter, setDeptFilter] = useState('전체')
  const [statusFilter, setStatusFilter] = useState('전체')
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [perPage, setPerPage] = useState(50)
  const depts = ['전체', ...new Set(HR_LEAVE_MOCK.map((d) => d.dept))]
  const filteredLeave = deptFilter === '전체' ? HR_LEAVE_MOCK : HR_LEAVE_MOCK.filter((d) => d.dept === deptFilter)
  const filteredVacation = statusFilter === '전체' ? HR_VACATION_MOCK : HR_VACATION_MOCK.filter((d) => d.status === statusFilter)
  const statusColor: Record<string, string> = { '승인대기': 'bg-yellow-50 text-yellow-600', '승인완료': 'bg-gray-100 text-gray-600', '반려': 'bg-red-50 text-red-500' }

  // 주간 캘린더 데이터
  const weekDays = [
    { day: 30, dow: '월', leaveCount: 2 },
    { day: 31, dow: '화', leaveCount: 4 },
    { day: 1, dow: '수', leaveCount: 1, isToday: true },
    { day: 2, dow: '목', leaveCount: 1 },
    { day: 3, dow: '금', leaveCount: 1 },
    { day: 4, dow: '토', leaveCount: 1 },
    { day: 5, dow: '일', leaveCount: 1 },
  ]

  // 선택된 날짜의 휴가자 목록
  const dayLeaveMock = [
    { empNo: '-', name: '권시정', position: '차장', dept: '경영', leaveType: '출산휴가', dates: '2026-03-01 ~ 2026-05-29', used: '90d', duration: '90d' },
  ]

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 mb-4">전사 휴가현황</h1>

      {/* 탭 */}
      <div className="flex items-center gap-2 mb-4">
        {(['휴가현황', '연차', '기타휴가'] as const).map((t) => (
          <button key={t} onClick={() => setInnerTab(t)} className={`px-4 py-1.5 text-[13px] rounded-full transition-colors ${innerTab === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t}</button>
        ))}
        <button onClick={() => setInnerTab('법적 근로 휴가 결재')} className={`px-4 py-1.5 text-[13px] rounded-full transition-colors ${innerTab === '법적 근로 휴가 결재' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>법적 근로 휴가 결재</button>
      </div>

      {/* 날짜 선택 - 중앙 */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <button className="text-gray-400 hover:text-gray-600"><i className="fas fa-chevron-left" /></button>
        <span className="text-[18px] font-bold text-gray-900">{innerTab === '연차' ? '2026-04' : innerTab === '기타휴가' ? '2026' : '2026-03-30 ~ 2026-04-05'}</span>
        <button className="text-gray-400 hover:text-gray-600"><i className="fas fa-chevron-right" /></button>
        <button className="text-[12px] text-gray-500 hover:text-[#1D9E75] ml-1">오늘</button>
      </div>

      {innerTab === '휴가현황' ? (<>
        {/* 주간 캘린더 */}
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
          <div className="grid grid-cols-7">
            {weekDays.map((d) => (
              <div key={d.day}
                onClick={() => setSelectedDay(d.day === selectedDay ? null : d.day)}
                className={`border-r border-gray-100 last:border-r-0 cursor-pointer transition-colors ${d.isToday && selectedDay === d.day ? 'bg-blue-50' : d.isToday ? 'bg-gray-50' : selectedDay === d.day ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
                  <span className={`text-[14px] font-semibold ${d.isToday ? 'text-white bg-blue-500 w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-900'}`}>{d.day}</span>
                  <span className={`text-[12px] ${d.isToday ? 'text-blue-500 font-medium' : 'text-gray-500'}`}>{d.dow}</span>
                </div>
                <div className="px-2 py-2 min-h-[60px]">
                  {d.leaveCount > 0 && (
                    <div className="bg-[#4fc3f7] text-white text-[11px] rounded px-2 py-1 flex items-center justify-between">
                      <span>휴가자</span>
                      <span className="font-bold">{d.leaveCount} 명</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {selectedDay !== null && (
            <div className="border-t border-gray-200 bg-white p-4">
              <div className="text-[12px] text-gray-500 mb-2">선택: {selectedDay}일 휴가자 상세</div>
            </div>
          )}
        </div>

        {/* 검색 + 페이지 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center border border-gray-300 rounded px-2 py-1.5">
            <i className="fas fa-search text-gray-400 text-[11px] mr-2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="부서, 사번, 이름을 검색하세요.." className="text-[12px] outline-none bg-transparent w-48 placeholder-gray-400" />
          </div>
          <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none">
            {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* 휴가자 테이블 */}
        <table className="w-full text-[12px]">
          <thead><tr className="border-b-2 border-gray-900">
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사번</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사원명</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서명</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">휴가유형</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">휴가사용일</th>
            <th className="px-3 py-2.5 text-right text-gray-700 font-medium">사용휴가</th>
            <th className="px-3 py-2.5 text-right text-gray-700 font-medium">휴가사용기간</th>
          </tr></thead>
          <tbody>
            {dayLeaveMock.map((d, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2.5 text-gray-500">{d.empNo}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 shrink-0"><i className="fas fa-user" /></div>
                    <span className="text-gray-800 font-medium">{d.name} {d.position}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-gray-600">{d.dept}</td>
                <td className="px-3 py-2.5 text-gray-700">{d.leaveType}</td>
                <td className="px-3 py-2.5 text-gray-600">{d.dates}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{d.used}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{d.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>) : innerTab === '연차' ? (<>
        {/* 검색 + 연차조정 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center border border-gray-300 rounded px-2 py-1.5">
            <i className="fas fa-search text-gray-400 text-[11px] mr-2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="부서, 사번, 이름을 검색하세요.." className="text-[12px] outline-none bg-transparent w-48 placeholder-gray-400" />
          </div>
          <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none">
            {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* 연차 테이블 */}
        <table className="w-full text-[12px]">
          <thead><tr className="border-b-2 border-gray-900">
            <th className="px-2 py-2.5 text-left text-gray-700 font-medium">사번</th>
            <th className="px-2 py-2.5 text-left text-gray-700 font-medium">사원명</th>
            <th className="px-2 py-2.5 text-left text-gray-700 font-medium">부서명</th>
            <th className="px-2 py-2.5 text-left text-gray-700 font-medium">입사일</th>
            <th className="px-2 py-2.5 text-left text-gray-700 font-medium">퇴사일</th>
            <th className="px-2 py-2.5 text-right text-gray-700 font-medium">근속연수</th>
            <th className="px-2 py-2.5 text-left text-gray-700 font-medium">연차사용기간</th>
            <th className="px-2 py-2.5 text-right text-gray-700 font-medium">잔여연차</th>
            <th className="px-2 py-2.5 text-right text-gray-700 font-medium">사용연차</th>
            <th className="px-2 py-2.5 text-right text-gray-700 font-medium">총연차</th>
            <th className="px-2 py-2.5 text-right text-gray-700 font-medium">발생연차</th>
            <th className="px-2 py-2.5 text-right text-gray-700 font-medium">이월연차</th>
            <th className="px-2 py-2.5 text-right text-gray-700 font-medium">조정연차</th>
            <th className="px-2 py-2.5 text-right text-gray-700 font-medium">소멸연차</th>
          </tr></thead>
          <tbody>
            {(search ? filteredLeave.filter((d) => d.name.includes(search) || d.dept.includes(search)) : filteredLeave).slice(0, perPage).map((d) => (
              <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-2 py-3 text-gray-500">-</td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 shrink-0"><i className="fas fa-user" /></div>
                    <span className="text-gray-800 font-medium">{d.name} {d.position}</span>
                  </div>
                </td>
                <td className="px-2 py-3 text-gray-600">{d.dept}</td>
                <td className="px-2 py-3 text-gray-600">{d.hireDate}</td>
                <td className="px-2 py-3 text-gray-400">{d.retireDate || ''}</td>
                <td className="px-2 py-3 text-right text-gray-700">{d.years}</td>
                <td className="px-2 py-3 text-gray-600 text-[11px]">{d.period}</td>
                <td className={`px-2 py-3 text-right font-semibold ${d.remaining < 0 ? 'text-red-500' : d.remaining === 0 ? 'text-red-500' : 'text-[#1D9E75]'}`}>{d.remaining}d</td>
                <td className="px-2 py-3 text-right text-gray-700">{d.used}d</td>
                <td className="px-2 py-3 text-right text-gray-700">{d.total}d</td>
                <td className="px-2 py-3 text-right text-gray-500">{d.generated}d</td>
                <td className={`px-2 py-3 text-right ${d.carried < 0 ? 'text-red-500' : 'text-gray-500'}`}>{d.carried}d</td>
                <td className="px-2 py-3 text-right text-gray-500">{d.adjusted}d</td>
                <td className="px-2 py-3 text-right text-gray-500">{d.expired}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>) : innerTab === '기타휴가' ? (<>
        {/* 기타휴가 - 직원별 법적 근로 휴가 사용 현황 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center border border-gray-300 rounded px-2 py-1.5">
            <i className="fas fa-search text-gray-400 text-[11px] mr-2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="부서, 사번, 이름을 검색하세요.." className="text-[12px] outline-none bg-transparent w-48 placeholder-gray-400" />
          </div>
          <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none">
            {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <table className="w-full text-[12px]">
          <thead><tr className="border-b-2 border-gray-900">
            <th className="px-2 py-2.5 text-left text-gray-700 font-medium">사번</th>
            <th className="px-2 py-2.5 text-left text-gray-700 font-medium">사원명</th>
            <th className="px-2 py-2.5 text-left text-gray-700 font-medium">부서명</th>
            {['보상휴가', '출산휴가', '출산휴가-다태아', '배우자돌봄휴가', '가족돌봄휴가'].map((t) => (
              <th key={t} className="px-2 py-2.5 text-right text-gray-700 font-medium">{t}</th>
            ))}
          </tr></thead>
          <tbody>
            {(search ? filteredLeave.filter((d) => d.name.includes(search) || d.dept.includes(search)) : filteredLeave).slice(0, perPage).map((d) => (
              <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-2 py-3 text-gray-500">-</td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 shrink-0"><i className="fas fa-user" /></div>
                    <span className="text-gray-800 font-medium">{d.name} {d.position}</span>
                  </div>
                </td>
                <td className="px-2 py-3 text-gray-600">{d.dept}</td>
                <td className="px-2 py-3 text-right text-gray-700">0d</td>
                <td className={`px-2 py-3 text-right ${d.name === '김인재' ? 'text-[#1D9E75] font-semibold' : 'text-gray-700'}`}>{d.name === '김인재' ? '2d' : d.name === '박지현' ? '90d' : '0d'}</td>
                <td className="px-2 py-3 text-right text-gray-700">0d</td>
                <td className="px-2 py-3 text-right text-gray-700">0d</td>
                <td className="px-2 py-3 text-right text-gray-700">0d</td>
              </tr>
            ))}
          </tbody>
        </table>

      </>) : innerTab === '법적 근로 휴가 결재' ? (<>
        {/* 법적 근로 휴가 결재 */}
        <div className="flex items-center gap-2 mb-6">
          {['전체', '승인대기', '승인완료', '반려'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1 text-[12px] rounded-full transition-colors ${statusFilter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
          ))}
        </div>
        <table className="w-full text-[12px]">
          <thead><tr className="border-b-2 border-gray-900">
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">신청자</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">휴가 유형</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사용 옵션</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">휴가일</th>
            <th className="px-3 py-2.5 text-right text-gray-700 font-medium">일수</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">신청일</th>
            <th className="px-3 py-2.5 text-left text-gray-700 font-medium">상태</th>
            <th className="px-3 py-2.5 text-right text-gray-700 font-medium">처리</th>
          </tr></thead>
          <tbody>
            {filteredVacation.map((d) => (
              <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2.5 text-gray-800 font-medium">{d.name}</td>
                <td className="px-3 py-2.5 text-gray-600">{d.dept}</td>
                <td className="px-3 py-2.5 text-gray-700">{d.leaveType}</td>
                <td className="px-3 py-2.5 text-gray-500">{d.dayOption}</td>
                <td className="px-3 py-2.5 text-gray-600">{d.dates}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{d.days}d</td>
                <td className="px-3 py-2.5 text-gray-500">{d.appliedAt}</td>
                <td className="px-3 py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${statusColor[d.status] ?? 'bg-gray-100 text-gray-500'}`}>{d.status}</span></td>
                <td className="px-3 py-2.5 text-right">
                  {d.status === '승인대기' && (<>
                    <button className="text-[11px] text-[#1D9E75] hover:underline mr-2">승인</button>
                    <button className="text-[11px] text-red-500 hover:underline">반려</button>
                  </>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>) : null}
    </div>
  )
}

/* ── 초과근무 관리 ── */
const HR_OVERTIME_MOCK = [
  { id: 1, name: '박서준', dept: '개발', type: '연장근무', date: '2026-03-28', hours: '2h', status: '승인대기', reason: '프로젝트 마감' },
  { id: 2, name: '이민호', dept: '개발', type: '야간근무', date: '2026-03-27', hours: '3h', status: '승인대기', reason: '서버 배포' },
  { id: 3, name: '강희계', dept: '경영', type: '휴일근무', date: '2026-03-29', hours: '8h', status: '승인완료', reason: '결산 마감' },
  { id: 4, name: '최예린', dept: '개발', type: '연장근무', date: '2026-03-26', hours: '1.5h', status: '승인완료', reason: '버그 수정' },
]

function HrOvertimeTab() {
  const [filter, setFilter] = useState('전체')
  const filtered = filter === '전체' ? HR_OVERTIME_MOCK : HR_OVERTIME_MOCK.filter((d) => d.status === filter)
  const statusColor: Record<string, string> = { '승인대기': 'bg-yellow-50 text-yellow-600', '승인완료': 'bg-gray-100 text-gray-600', '반려': 'bg-red-50 text-red-500' }
  const typeColor: Record<string, string> = { '연장근무': 'bg-purple-50 text-purple-600', '야간근무': 'bg-blue-50 text-blue-600', '휴일근무': 'bg-orange-50 text-orange-600' }

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 mb-4">초과근무 관리</h1>
      <div className="flex items-center gap-2 mb-4">
        {['전체', '승인대기', '승인완료', '반려'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 text-[12px] rounded-full transition-colors ${filter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
        ))}
      </div>
      <table className="w-full text-[12px]">
        <thead><tr className="border-b-2 border-gray-900">
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">신청자</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">유형</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">날짜</th>
          <th className="px-3 py-2.5 text-right text-gray-700 font-medium">시간</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사유</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">상태</th>
        </tr></thead>
        <tbody>
          {filtered.map((d) => (
            <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2.5 text-gray-800 font-medium">{d.name}</td>
              <td className="px-3 py-2.5 text-gray-600">{d.dept}</td>
              <td className="px-3 py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${typeColor[d.type] ?? ''}`}>{d.type}</span></td>
              <td className="px-3 py-2.5 text-gray-600">{d.date}</td>
              <td className="px-3 py-2.5 text-right text-gray-700 font-semibold">{d.hours}</td>
              <td className="px-3 py-2.5 text-gray-600">{d.reason}</td>
              <td className="px-3 py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${statusColor[d.status] ?? ''}`}>{d.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── 집계 ── */
const HR_STATS_DEPT = [
  { dept: '경영', headcount: 6, avgWork: '8h 02m', totalOvertime: '12h', lateCount: 3, absentCount: 1, leaveUsed: 41, weeklyAvg: '40.2h' },
  { dept: '개발', headcount: 4, avgWork: '8h 35m', totalOvertime: '28h', lateCount: 0, absentCount: 0, leaveUsed: 24, weeklyAvg: '43.5h' },
  { dept: '인사', headcount: 3, avgWork: '8h 10m', totalOvertime: '8h', lateCount: 1, absentCount: 0, leaveUsed: 18, weeklyAvg: '41.0h' },
]

function HrStatsTab() {
  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 mb-4">근태 집계</h1>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button className="text-gray-400 hover:text-gray-600"><i className="fas fa-chevron-left" /></button>
          <span className="text-[15px] font-semibold text-gray-900">2026년 03월</span>
          <button className="text-gray-400 hover:text-gray-600"><i className="fas fa-chevron-right" /></button>
        </div>
        <button className="text-[12px] text-gray-500 hover:text-[#1D9E75] flex items-center gap-1"><i className="fas fa-download text-[10px]" /> 리포트 다운로드</button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '전체 인원', value: '13명', color: 'text-gray-900' },
          { label: '이번달 지각', value: '4건', color: 'text-red-500' },
          { label: '이번달 결근', value: '1건', color: 'text-red-600' },
          { label: '52시간 초과 경고', value: '0명', color: 'text-[#1D9E75]' },
        ].map((c) => (
          <div key={c.label} className="border border-gray-200 rounded-xl p-4 text-center">
            <div className="text-[11px] text-gray-500 mb-1">{c.label}</div>
            <div className={`text-[22px] font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* 부서별 테이블 */}
      <h2 className="text-[14px] font-bold text-gray-900 mb-3">부서별 집계</h2>
      <table className="w-full text-[12px]">
        <thead><tr className="border-b-2 border-gray-900">
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서</th>
          <th className="px-3 py-2.5 text-right text-gray-700 font-medium">인원</th>
          <th className="px-3 py-2.5 text-right text-gray-700 font-medium">평균 근무</th>
          <th className="px-3 py-2.5 text-right text-gray-700 font-medium">초과근무 합계</th>
          <th className="px-3 py-2.5 text-right text-gray-700 font-medium">지각</th>
          <th className="px-3 py-2.5 text-right text-gray-700 font-medium">결근</th>
          <th className="px-3 py-2.5 text-right text-gray-700 font-medium">연차 사용</th>
          <th className="px-3 py-2.5 text-right text-gray-700 font-medium">주간 평균</th>
        </tr></thead>
        <tbody>
          {HR_STATS_DEPT.map((d) => (
            <tr key={d.dept} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2.5 text-gray-800 font-medium">{d.dept}</td>
              <td className="px-3 py-2.5 text-right text-gray-700">{d.headcount}명</td>
              <td className="px-3 py-2.5 text-right text-gray-700">{d.avgWork}</td>
              <td className="px-3 py-2.5 text-right text-gray-700">{d.totalOvertime}</td>
              <td className={`px-3 py-2.5 text-right ${d.lateCount > 0 ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>{d.lateCount}건</td>
              <td className={`px-3 py-2.5 text-right ${d.absentCount > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>{d.absentCount}건</td>
              <td className="px-3 py-2.5 text-right text-gray-700">{d.leaveUsed}d</td>
              <td className={`px-3 py-2.5 text-right font-semibold ${parseFloat(d.weeklyAvg) > 52 ? 'text-red-500' : parseFloat(d.weeklyAvg) > 48 ? 'text-yellow-600' : 'text-gray-700'}`}>{d.weeklyAvg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── 정정 ── */
const HR_CORRECTION_MOCK = [
  { id: 1, name: '권시정', dept: '경영', date: '2026-03-25', type: '출근 누락', before: '-', after: '09:05', reason: '단말기 오류로 출근 미기록', status: '승인대기', appliedAt: '2026-03-26' },
  { id: 2, name: '한도윤', dept: '개발', date: '2026-03-20', type: '퇴근 누락', before: '-', after: '18:30', reason: '퇴근 버튼 미클릭', status: '승인대기', appliedAt: '2026-03-21' },
  { id: 3, name: '이수진', dept: '경영', date: '2026-03-18', type: '지각 → 정상', before: '지각', after: '정상', reason: '외부 미팅 후 출근 (사전 승인)', status: '승인완료', appliedAt: '2026-03-19' },
]

function HrCorrectionTab() {
  const [filter, setFilter] = useState('전체')
  const filtered = filter === '전체' ? HR_CORRECTION_MOCK : HR_CORRECTION_MOCK.filter((d) => d.status === filter)
  const statusColor: Record<string, string> = { '승인대기': 'bg-yellow-50 text-yellow-600', '승인완료': 'bg-gray-100 text-gray-600', '반려': 'bg-red-50 text-red-500' }

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 mb-4">근태 정정</h1>
      <div className="flex items-center gap-2 mb-4">
        {['전체', '승인대기', '승인완료', '반려'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 text-[12px] rounded-full transition-colors ${filter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
        ))}
      </div>
      <table className="w-full text-[12px]">
        <thead><tr className="border-b-2 border-gray-900">
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">신청자</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">대상일</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">정정 유형</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">변경 전</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">변경 후</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사유</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">상태</th>
          <th className="px-3 py-2.5 text-right text-gray-700 font-medium">처리</th>
        </tr></thead>
        <tbody>
          {filtered.map((d) => (
            <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2.5 text-gray-800 font-medium">{d.name}</td>
              <td className="px-3 py-2.5 text-gray-600">{d.dept}</td>
              <td className="px-3 py-2.5 text-gray-600">{d.date}</td>
              <td className="px-3 py-2.5 text-gray-700">{d.type}</td>
              <td className="px-3 py-2.5 text-gray-400">{d.before}</td>
              <td className="px-3 py-2.5 text-[#1D9E75] font-medium">{d.after}</td>
              <td className="px-3 py-2.5 text-gray-600 max-w-[200px] truncate" title={d.reason}>{d.reason}</td>
              <td className="px-3 py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${statusColor[d.status] ?? ''}`}>{d.status}</span></td>
              <td className="px-3 py-2.5 text-right">
                {d.status === '승인대기' && (<>
                  <button className="text-[11px] text-[#1D9E75] hover:underline mr-2">승인</button>
                  <button className="text-[11px] text-red-500 hover:underline">반려</button>
                </>)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
