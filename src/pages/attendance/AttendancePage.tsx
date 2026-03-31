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
  { name: '새로운 휴가', desc: '신청 시 지급, 4d', sub: '월말 소멸' },
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

type MainTab = '휴가관리' | '근태관리'
type LeaveSubTab = '휴가현황' | '연차내역'
type AttendViewMode = '주간' | '월간'

/* ══════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════ */
export default function AttendancePage() {
  const [mainTab, setMainTab] = useState<MainTab>('휴가관리')
  const [leaveSubTab, setLeaveSubTab] = useState<LeaveSubTab>('휴가현황')
  const [attendViewMode, setAttendViewMode] = useState<AttendViewMode>('주간')
  const [leaveApplyOpen, setLeaveApplyOpen] = useState(false)
  const [formModalOpen, setFormModalOpen] = useState(false)
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
            {mainTab === '휴가관리' ? '휴가' : '근태'}
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
        </nav>
      </div>

      {/* ── 메인 콘텐츠 ── */}
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        {mainTab === '휴가관리' && leaveSubTab === '휴가현황' && <LeaveStatusView onOpenApply={() => setFormModalOpen(true)} />}
        {mainTab === '휴가관리' && leaveSubTab === '연차내역' && <LeaveHistoryView />}
        {mainTab === '근태관리' && <AttendanceView viewMode={attendViewMode} onViewModeChange={setAttendViewMode} onOpenApply={() => setFormModalOpen(true)} />}
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
          <h2 className="text-[14px] font-bold text-gray-900">휴가신청</h2>
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
  { value: '새로운 휴가', unit: '일', remaining: 4, desc: '신청 시 지급, 월말 소멸' },
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
