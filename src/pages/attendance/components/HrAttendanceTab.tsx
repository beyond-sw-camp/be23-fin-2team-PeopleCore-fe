import { useState } from 'react'
import { getWorkGroup } from './workGroupConfig'

// 주간 최대근무시간 & 경고 기준은 근무그룹 정책에서 가져옴
const DEFAULT_GROUP = getWorkGroup('기본그룹')
const MAX_WEEKLY_HOURS = DEFAULT_GROUP.maxWeeklyHours
const WARNING_HOURS = DEFAULT_GROUP.warningHours

/* ══════════════════════════════════════
   Mock 데이터
   ══════════════════════════════════════ */
const HR_ATTEND_MOCK = [
  { id: 1, empNo: 'EMP001', name: '강희계', dept: '경영', group: '기본그룹', checkIn: '09:53:43', checkOut: '18:00:00', workHours: '7h 6m 17s', leave: '8h', holiday: '', abnormal: '휴가 중 출근, 출퇴근 누락' },
  { id: 2, empNo: 'EMP002', name: '권시정', dept: '경영', group: '기본그룹', checkIn: '09:53:36', checkOut: '18:00:00', workHours: '7h 6m 17s', leave: '8h', holiday: '', abnormal: '휴가 중 출근, 출퇴근 누락' },
  { id: 3, empNo: 'EMP003', name: '김인재', dept: '경영', group: '기본그룹', checkIn: '09:40:00', checkOut: '18:00:00', workHours: '7h 20m 0s', leave: '8h', holiday: '', abnormal: '휴가 중 출근, 출퇴근 누락' },
  { id: 4, empNo: 'EMP004', name: '박지현', dept: '경영', group: '기본그룹', checkIn: '09:53:21', checkOut: '18:00:00', workHours: '7h 6m 39s', leave: '8h', holiday: '', abnormal: '휴가 중 출근, 출퇴근 누락' },
  { id: 5, empNo: 'EMP005', name: '이수진', dept: '경영', group: '기본그룹', checkIn: '-', checkOut: '-', workHours: '-', leave: '8h', holiday: '', abnormal: '결근' },
  { id: 6, empNo: 'EMP006', name: '박서준', dept: '개발', group: '기본그룹', checkIn: '09:05:12', checkOut: '19:30:00', workHours: '9h 24m 48s', leave: '8h', holiday: '', abnormal: '' },
  { id: 7, empNo: 'EMP007', name: '이민호', dept: '개발', group: '기본그룹', checkIn: '09:10:05', checkOut: '18:00:00', workHours: '7h 49m 55s', leave: '8h', holiday: '', abnormal: '' },
  { id: 8, empNo: 'EMP008', name: '송미래', dept: '인사', group: '기본그룹', checkIn: '08:50:30', checkOut: '-', workHours: '-', leave: '8h', holiday: '', abnormal: '' },
]

const TOTAL_EMP = 22

/* 카테고리별 해당 사원 Mock 데이터 */
type CategoryKey = '정상' | '종일근무상태' | '지각' | '조퇴' | '휴게시간 부족' | '휴가 중 출근' | '출퇴근 누락' | '1일 소정근로시간 미달' | '근무지 외 근태체크' | '미승인 초과근무' | '최대근무시간 초과'

interface CategoryEmployee {
  id: number
  empNo: string
  name: string
  dept: string
  position: string
  weeklyHours: string
  detail: string
}

const CATEGORY_EMPLOYEES: Record<CategoryKey, CategoryEmployee[]> = {
  '정상': [],
  '종일근무상태': [],
  '지각': [
    { id: 1, empNo: 'EMP001', name: '강희계', dept: '경영', position: '사원', weeklyHours: '40.2h', detail: '09:53 출근 (53분 지각)' },
    { id: 2, empNo: 'EMP002', name: '권시정', dept: '경영', position: '사원', weeklyHours: '39.8h', detail: '09:53 출근 (53분 지각)' },
  ],
  '조퇴': [],
  '휴게시간 부족': [],
  '휴가 중 출근': [
    { id: 1, empNo: 'EMP001', name: '강희계', dept: '경영', position: '사원', weeklyHours: '40.2h', detail: '연차 사용일에 출근 기록' },
    { id: 3, empNo: 'EMP003', name: '김인재', dept: '경영', position: '대리', weeklyHours: '41.5h', detail: '연차 사용일에 출근 기록' },
    { id: 4, empNo: 'EMP004', name: '박지현', dept: '경영', position: '사원', weeklyHours: '38.9h', detail: '연차 사용일에 출근 기록' },
    { id: 2, empNo: 'EMP002', name: '권시정', dept: '경영', position: '사원', weeklyHours: '39.8h', detail: '연차 사용일에 출근 기록' },
  ],
  '출퇴근 누락': [
    { id: 1, empNo: 'EMP001', name: '강희계', dept: '경영', position: '사원', weeklyHours: '40.2h', detail: '퇴근 미체크 3건' },
    { id: 2, empNo: 'EMP002', name: '권시정', dept: '경영', position: '사원', weeklyHours: '39.8h', detail: '퇴근 미체크 2건' },
    { id: 3, empNo: 'EMP003', name: '김인재', dept: '경영', position: '대리', weeklyHours: '41.5h', detail: '출근 미체크 1건' },
    { id: 4, empNo: 'EMP004', name: '박지현', dept: '경영', position: '사원', weeklyHours: '38.9h', detail: '퇴근 미체크 4건' },
    { id: 5, empNo: 'EMP005', name: '이수진', dept: '경영', position: '사원', weeklyHours: '-', detail: '출퇴근 미체크 5건' },
    { id: 6, empNo: 'EMP006', name: '박서준', dept: '개발', position: '선임', weeklyHours: '53.2h', detail: '퇴근 미체크 2건' },
    { id: 7, empNo: 'EMP007', name: '이민호', dept: '개발', position: '사원', weeklyHours: '42.0h', detail: '출근 미체크 1건' },
    { id: 8, empNo: 'EMP008', name: '송미래', dept: '인사', position: '대리', weeklyHours: '40.5h', detail: '퇴근 미체크 3건' },
    { id: 9, empNo: 'EMP009', name: '최유리', dept: '개발', position: '사원', weeklyHours: '44.0h', detail: '출근 미체크 2건' },
    { id: 10, empNo: 'EMP010', name: '한지민', dept: '인사', position: '사원', weeklyHours: '39.5h', detail: '퇴근 미체크 1건' },
    { id: 11, empNo: 'EMP011', name: '정해인', dept: '경영', position: '과장', weeklyHours: '45.0h', detail: '출퇴근 미체크 3건' },
    { id: 12, empNo: 'EMP012', name: '김태리', dept: '개발', position: '선임', weeklyHours: '55.0h', detail: '퇴근 미체크 2건' },
    { id: 13, empNo: 'EMP013', name: '서강준', dept: '인사', position: '사원', weeklyHours: '38.0h', detail: '출근 미체크 1건' },
    { id: 14, empNo: 'EMP014', name: '윤아진', dept: '경영', position: '사원', weeklyHours: '40.0h', detail: '퇴근 미체크 2건' },
    { id: 15, empNo: 'EMP015', name: '조인성', dept: '개발', position: '팀장', weeklyHours: '48.5h', detail: '퇴근 미체크 1건' },
    { id: 16, empNo: 'EMP016', name: '배수지', dept: '경영', position: '사원', weeklyHours: '41.0h', detail: '출근 미체크 3건' },
    { id: 17, empNo: 'EMP017', name: '공유진', dept: '개발', position: '선임', weeklyHours: '46.0h', detail: '퇴근 미체크 2건' },
    { id: 18, empNo: 'EMP018', name: '전지현', dept: '인사', position: '과장', weeklyHours: '42.5h', detail: '출퇴근 미체크 1건' },
    { id: 19, empNo: 'EMP019', name: '남주혁', dept: '경영', position: '사원', weeklyHours: '39.0h', detail: '퇴근 미체크 4건' },
    { id: 20, empNo: 'EMP020', name: '한효주', dept: '개발', position: '사원', weeklyHours: '43.0h', detail: '출근 미체크 2건' },
    { id: 21, empNo: 'EMP021', name: '이종석', dept: '인사', position: '사원', weeklyHours: '37.5h', detail: '퇴근 미체크 1건' },
    { id: 22, empNo: 'EMP022', name: '신민아', dept: '경영', position: '대리', weeklyHours: '44.5h', detail: '출퇴근 미체크 2건' },
  ],
  '1일 소정근로시간 미달': [
    { id: 1, empNo: 'EMP001', name: '강희계', dept: '경영', position: '사원', weeklyHours: '40.2h', detail: '7h 6m 근무 (54분 미달)' },
    { id: 2, empNo: 'EMP002', name: '권시정', dept: '경영', position: '사원', weeklyHours: '39.8h', detail: '7h 6m 근무 (54분 미달)' },
  ],
  '근무지 외 근태체크': [],
  '미승인 초과근무': [
    { id: 6, empNo: 'EMP006', name: '박서준', dept: '개발', position: '선임', weeklyHours: '53.2h', detail: '미승인 연장근무 3건 (총 4.5h)' },
    { id: 12, empNo: 'EMP012', name: '김태리', dept: '개발', position: '선임', weeklyHours: '55.0h', detail: '미승인 연장근무 5건 (총 8h)' },
    { id: 15, empNo: 'EMP015', name: '조인성', dept: '개발', position: '팀장', weeklyHours: '48.5h', detail: '미승인 야간근무 2건 (총 6h)' },
    { id: 17, empNo: 'EMP017', name: '공유진', dept: '개발', position: '선임', weeklyHours: '46.0h', detail: '미승인 연장근무 1건 (총 2h)' },
  ],
  '최대근무시간 초과': [
    { id: 6, empNo: 'EMP006', name: '박서준', dept: '개발', position: '선임', weeklyHours: '53.2h', detail: '주 최대근무시간 초과 (1.2h 초과)' },
    { id: 12, empNo: 'EMP012', name: '김태리', dept: '개발', position: '선임', weeklyHours: '55.0h', detail: '주 최대근무시간 초과 (3h 초과)' },
  ],
}

/* 사원 상세 근무 현황 Mock 데이터 */
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

const EMPLOYEE_DETAIL: Record<string, DailyAttendance[]> = {
  'EMP001': [
    { date: '2026-03-31', day: '화', checkIn: '09:53:43', checkOut: '18:00:00', workHours: '7h 6m', overtime: '-', status: '지각', note: '휴가 중 출근' },
    { date: '2026-03-30', day: '월', checkIn: '09:02:10', checkOut: '18:05:00', workHours: '8h 3m', overtime: '-', status: '정상', note: '' },
    { date: '2026-03-28', day: '토', checkIn: '-', checkOut: '-', workHours: '-', overtime: '-', status: '휴일', note: '' },
    { date: '2026-03-27', day: '금', checkIn: '08:55:00', checkOut: '18:30:00', workHours: '8h 35m', overtime: '0h 30m', status: '정상', note: '' },
    { date: '2026-03-26', day: '목', checkIn: '09:00:05', checkOut: '-', workHours: '-', overtime: '-', status: '퇴근누락', note: '' },
    { date: '2026-03-25', day: '수', checkIn: '09:10:00', checkOut: '18:00:00', workHours: '7h 50m', overtime: '-', status: '정상', note: '' },
    { date: '2026-03-24', day: '화', checkIn: '09:01:00', checkOut: '18:00:00', workHours: '7h 59m', overtime: '-', status: '정상', note: '' },
  ],
  'EMP006': [
    { date: '2026-03-31', day: '화', checkIn: '09:05:12', checkOut: '19:30:00', workHours: '9h 25m', overtime: '1h 25m', status: '정상', note: '미승인 초과근무' },
    { date: '2026-03-30', day: '월', checkIn: '08:50:00', checkOut: '20:00:00', workHours: '10h 10m', overtime: '2h 10m', status: '정상', note: '미승인 초과근무' },
    { date: '2026-03-28', day: '토', checkIn: '10:00:00', checkOut: '15:00:00', workHours: '5h 0m', overtime: '5h 0m', status: '휴일근무', note: '미승인 초과근무' },
    { date: '2026-03-27', day: '금', checkIn: '08:55:00', checkOut: '21:00:00', workHours: '11h 5m', overtime: '3h 5m', status: '정상', note: '' },
    { date: '2026-03-26', day: '목', checkIn: '09:00:00', checkOut: '19:00:00', workHours: '9h 0m', overtime: '1h 0m', status: '정상', note: '' },
    { date: '2026-03-25', day: '수', checkIn: '09:05:00', checkOut: '18:30:00', workHours: '8h 25m', overtime: '0h 25m', status: '정상', note: '' },
    { date: '2026-03-24', day: '화', checkIn: '09:00:00', checkOut: '18:00:00', workHours: '8h 0m', overtime: '-', status: '정상', note: '' },
  ],
  'EMP012': [
    { date: '2026-03-31', day: '화', checkIn: '08:45:00', checkOut: '21:30:00', workHours: '11h 45m', overtime: '3h 45m', status: '정상', note: '미승인 초과근무' },
    { date: '2026-03-30', day: '월', checkIn: '08:50:00', checkOut: '20:30:00', workHours: '10h 40m', overtime: '2h 40m', status: '정상', note: '미승인 초과근무' },
    { date: '2026-03-28', day: '토', checkIn: '09:00:00', checkOut: '18:00:00', workHours: '9h 0m', overtime: '9h 0m', status: '휴일근무', note: '' },
    { date: '2026-03-27', day: '금', checkIn: '09:00:00', checkOut: '20:00:00', workHours: '10h 0m', overtime: '2h 0m', status: '정상', note: '미승인 초과근무' },
    { date: '2026-03-26', day: '목', checkIn: '08:55:00', checkOut: '19:30:00', workHours: '9h 35m', overtime: '1h 35m', status: '정상', note: '' },
    { date: '2026-03-25', day: '수', checkIn: '09:00:00', checkOut: '-', workHours: '-', overtime: '-', status: '퇴근누락', note: '' },
    { date: '2026-03-24', day: '화', checkIn: '09:10:00', checkOut: '18:00:00', workHours: '7h 50m', overtime: '-', status: '정상', note: '' },
  ],
}

// 기본 상세 데이터 (위에 없는 사원용)
const DEFAULT_DETAIL: DailyAttendance[] = [
  { date: '2026-03-31', day: '화', checkIn: '09:00:00', checkOut: '18:00:00', workHours: '8h 0m', overtime: '-', status: '정상', note: '' },
  { date: '2026-03-30', day: '월', checkIn: '09:05:00', checkOut: '18:00:00', workHours: '7h 55m', overtime: '-', status: '정상', note: '' },
  { date: '2026-03-27', day: '금', checkIn: '09:00:00', checkOut: '18:30:00', workHours: '8h 30m', overtime: '0h 30m', status: '정상', note: '' },
  { date: '2026-03-26', day: '목', checkIn: '09:00:00', checkOut: '18:00:00', workHours: '8h 0m', overtime: '-', status: '정상', note: '' },
  { date: '2026-03-25', day: '수', checkIn: '09:10:00', checkOut: '18:00:00', workHours: '7h 50m', overtime: '-', status: '정상', note: '' },
]

/* ══════════════════════════════════════
   전사 근태현황 탭
   ══════════════════════════════════════ */
export default function HrAttendanceTab() {
  const [viewMode, setViewMode] = useState<'일자별' | '기간별' | '집계'>('일자별')
  const [search, setSearch] = useState('')
  const [perPage, setPerPage] = useState(50)
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<CategoryEmployee | null>(null)

  // 요약 데이터
  const summary = {
    normal: 0, late: 2, earlyLeave: 0, breakShort: 0,
    allDay: 0, leaveIn: 4, missPunch: 22, underHours: 2,
    offsite: 0, unapprovedOT: 4, over52: 2,
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
        </>) : viewMode === '기간별' ? (<>
          <input type="date" defaultValue="2026-03-01" className="bg-transparent text-[18px] font-bold text-gray-900 outline-none cursor-pointer" />
          <span className="text-[16px] text-gray-400">~</span>
          <input type="date" defaultValue="2026-03-31" className="bg-transparent text-[18px] font-bold text-gray-900 outline-none cursor-pointer" />
        </>) : (<>
          <button className="text-gray-400 hover:text-gray-600"><i className="fas fa-chevron-left" /></button>
          <span className="text-[18px] font-bold text-gray-900">2026년 03월</span>
          <button className="text-gray-400 hover:text-gray-600"><i className="fas fa-chevron-right" /></button>
        </>)}
      </div>
      <div className="flex justify-end mb-4">
        <div className="flex border border-gray-300 rounded overflow-hidden">
          {(['일자별', '기간별', '집계'] as const).map((m) => (
            <button key={m} onClick={() => setViewMode(m)} className={`px-4 py-1.5 text-[12px] transition-colors ${viewMode === m ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{m}</button>
          ))}
        </div>
      </div>

      {viewMode === '집계' ? (<>
        {/* 집계 요약 카드 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: '전체 인원', value: '13명', color: 'text-gray-900' },
            { label: '이번달 지각', value: '4건', color: 'text-red-500' },
            { label: '이번달 결근', value: '1건', color: 'text-red-600' },
            { label: `${MAX_WEEKLY_HOURS}시간 초과 경고`, value: '0명', color: 'text-[#1D9E75]' },
          ].map((c) => (
            <div key={c.label} className="border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-[11px] text-gray-500 mb-1">{c.label}</div>
              <div className={`text-[22px] font-bold ${c.color}`}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* 부서별 집계 테이블 */}
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
            {[
              { dept: '경영', headcount: 6, avgWork: '8h 02m', totalOvertime: '12h', lateCount: 3, absentCount: 1, leaveUsed: 41, weeklyAvg: '40.2h' },
              { dept: '개발', headcount: 4, avgWork: '8h 35m', totalOvertime: '28h', lateCount: 0, absentCount: 0, leaveUsed: 24, weeklyAvg: '43.5h' },
              { dept: '인사', headcount: 3, avgWork: '8h 10m', totalOvertime: '8h', lateCount: 1, absentCount: 0, leaveUsed: 18, weeklyAvg: '41.0h' },
            ].map((d) => (
              <tr key={d.dept} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2.5 text-gray-800 font-medium">{d.dept}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{d.headcount}명</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{d.avgWork}</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{d.totalOvertime}</td>
                <td className={`px-3 py-2.5 text-right ${d.lateCount > 0 ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>{d.lateCount}건</td>
                <td className={`px-3 py-2.5 text-right ${d.absentCount > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>{d.absentCount}건</td>
                <td className="px-3 py-2.5 text-right text-gray-700">{d.leaveUsed}d</td>
                <td className={`px-3 py-2.5 text-right font-semibold ${parseFloat(d.weeklyAvg) > MAX_WEEKLY_HOURS ? 'text-red-500' : parseFloat(d.weeklyAvg) > WARNING_HOURS ? 'text-yellow-600' : 'text-gray-700'}`}>{d.weeklyAvg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>) : (<>

      {/* 요약 카드 3그룹 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* 근무 상태 */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="text-[12px] text-gray-500 mb-3 flex items-center gap-1"><i className="far fa-clock text-[10px]" /> 근무 상태</div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { label: '정상' as CategoryKey, value: summary.normal, color: 'text-[#1D9E75] border-[#1D9E75]' },
              { label: '종일근무상태' as CategoryKey, value: summary.allDay, color: 'text-gray-500 border-gray-300' },
            ].map((c) => (
              <div key={c.label} className="border border-gray-100 rounded-lg p-3 hover:border-gray-300 transition-colors cursor-pointer" onClick={() => c.value > 0 && setSelectedCategory(c.label)}>
                <span className={`text-[11px] font-semibold border rounded px-1.5 py-0.5 ${c.color}`}>{c.label}</span>
                <div className="mt-2">
                  <span className={`text-[24px] font-bold text-gray-900 ${c.value > 0 ? 'hover:text-[#1D9E75] cursor-pointer' : ''}`}>{c.value}</span>
                  <span className="text-[12px] text-gray-500 ml-0.5">명</span>
                </div>
                <div className="text-[11px] text-gray-400">{Math.round(c.value / TOTAL_EMP * 100)}% {TOTAL_EMP}명 기준</div>
              </div>
            ))}
          </div>
        </div>

        {/* 시간 및 기록 이상 */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="text-[12px] text-gray-500 mb-3 flex items-center gap-1"><i className="fas fa-exclamation-circle text-[10px] text-yellow-500" /> 시간 및 기록 이상</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '지각' as CategoryKey, value: summary.late, color: 'text-orange-500 border-orange-400' },
              { label: '조퇴' as CategoryKey, value: summary.earlyLeave, color: 'text-orange-500 border-orange-400' },
              { label: '휴게시간 부족' as CategoryKey, value: summary.breakShort, color: 'text-orange-500 border-orange-400' },
              { label: '휴가 중 출근' as CategoryKey, value: summary.leaveIn, color: 'text-yellow-600 border-yellow-400' },
              { label: '출퇴근 누락' as CategoryKey, value: summary.missPunch, color: 'text-red-500 border-red-400' },
              { label: '1일 소정근로시간 미달' as CategoryKey, value: summary.underHours, color: 'text-red-500 border-red-400' },
            ].map((c) => (
              <div key={c.label} className="border border-gray-100 rounded-lg p-3 hover:border-gray-300 transition-colors cursor-pointer" onClick={() => c.value > 0 && setSelectedCategory(c.label)}>
                <span className={`text-[11px] font-semibold border rounded px-1.5 py-0.5 ${c.color}`}>{c.label}</span>
                <div className="mt-2">
                  <span className={`text-[24px] font-bold text-gray-900 ${c.value > 0 ? 'hover:text-[#1D9E75] cursor-pointer' : ''}`}>{c.value}</span>
                  <span className="text-[12px] text-gray-500 ml-0.5">명</span>
                </div>
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
              { label: '근무지 외 근태체크' as CategoryKey, value: summary.offsite, color: 'text-red-500 border-red-400' },
              { label: '미승인 초과근무' as CategoryKey, value: summary.unapprovedOT, color: 'text-red-500 border-red-400' },
              { label: '최대근무시간 초과' as CategoryKey, value: summary.over52, color: 'text-red-600 border-red-600', icon: 'fas fa-skull-crossbones' },
            ].map((c) => (
              <div key={c.label} className={`border rounded-lg p-3 hover:border-gray-300 transition-colors cursor-pointer ${c.label === '최대근무시간 초과' ? 'border-red-200 bg-red-50/50' : 'border-gray-100'}`} onClick={() => c.value > 0 && setSelectedCategory(c.label)}>
                <span className={`text-[11px] font-semibold border rounded px-1.5 py-0.5 ${c.color}`}>{c.label}</span>
                <div className="mt-2">
                  <span className={`text-[24px] font-bold ${c.label === '최대근무시간 초과' && c.value > 0 ? 'text-red-600' : 'text-gray-900'} ${c.value > 0 ? 'hover:text-[#1D9E75] cursor-pointer' : ''}`}>{c.value}</span>
                  <span className="text-[12px] text-gray-500 ml-0.5">명</span>
                </div>
                <div className="text-[11px] text-gray-400">{Math.round(c.value / TOTAL_EMP * 100)}% {TOTAL_EMP}명 기준</div>
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
                <span className="text-[13px] text-gray-500">({CATEGORY_EMPLOYEES[selectedCategory]?.length ?? 0}명)</span>
              </div>
              <button onClick={() => setSelectedCategory(null)} className="text-gray-400 hover:text-gray-600 text-[18px]"><i className="fas fa-times" /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-3">
              {(CATEGORY_EMPLOYEES[selectedCategory]?.length ?? 0) === 0 ? (
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
                    {CATEGORY_EMPLOYEES[selectedCategory]?.map((emp) => (
                      <tr
                        key={emp.id + emp.empNo}
                        className="border-b border-gray-100 hover:bg-[#F0FAF6] transition-colors cursor-pointer"
                        onClick={() => setSelectedEmployee(emp)}
                      >
                        <td className="px-3 py-2.5 text-gray-500">{emp.empNo}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 shrink-0"><i className="fas fa-user" /></div>
                            <span className="text-gray-800 font-medium hover:text-[#1D9E75]">{emp.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-gray-600">{emp.dept}</td>
                        <td className="px-3 py-2.5 text-gray-600">{emp.position}</td>
                        <td className={`px-3 py-2.5 font-semibold ${parseFloat(emp.weeklyHours) > MAX_WEEKLY_HOURS ? 'text-red-500' : parseFloat(emp.weeklyHours) > WARNING_HOURS ? 'text-yellow-600' : 'text-gray-700'}`}>{emp.weeklyHours}</td>
                        <td className="px-3 py-2.5 text-gray-500 max-w-[160px] truncate" title={emp.detail}>{emp.detail}</td>
                      </tr>
                    ))}
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
                  <h2 className="text-[16px] font-bold text-gray-900">{selectedEmployee.name} <span className="text-[12px] font-normal text-gray-500">({selectedEmployee.empNo})</span></h2>
                  <div className="text-[11px] text-gray-500">{selectedEmployee.dept} · {selectedEmployee.position}</div>
                </div>
              </div>
              <button onClick={() => { setSelectedEmployee(null); setSelectedCategory(null) }} className="text-gray-400 hover:text-gray-600 text-[18px]"><i className="fas fa-times" /></button>
            </div>

            {/* 요약 카드 */}
            <div className="px-6 py-4 grid grid-cols-4 gap-3 border-b border-gray-100">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-[11px] text-gray-500 mb-1">주간 근무시간</div>
                <div className={`text-[18px] font-bold ${parseFloat(selectedEmployee.weeklyHours) > MAX_WEEKLY_HOURS ? 'text-red-500' : 'text-gray-900'}`}>{selectedEmployee.weeklyHours}</div>
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
                <div className={`text-[18px] font-bold ${parseFloat(selectedEmployee.weeklyHours) > MAX_WEEKLY_HOURS ? 'text-red-500' : parseFloat(selectedEmployee.weeklyHours) > WARNING_HOURS ? 'text-yellow-600' : 'text-[#1D9E75]'}`}>
                  {parseFloat(selectedEmployee.weeklyHours) > MAX_WEEKLY_HOURS ? '초과' : parseFloat(selectedEmployee.weeklyHours) > WARNING_HOURS ? '주의' : '정상'}
                </div>
              </div>
            </div>

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
                  {(EMPLOYEE_DETAIL[selectedEmployee.empNo] ?? DEFAULT_DETAIL).map((row) => (
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
      </>)}
    </div>
  )
}
