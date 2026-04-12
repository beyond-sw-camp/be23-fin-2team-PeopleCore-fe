import { useState } from 'react'
import { getWorkGroup } from './workGroupConfig'

// 주간 최대근무시간 & 경고 기준은 근무그룹 정책에서 가져옴
// TODO: GET /api/attendance/my/work-group 또는 GET /api/attendance/hr/weekly-hour-policy 에서 가져올 값
const DEFAULT_GROUP = getWorkGroup('기본그룹')
const MAX_WEEKLY_HOURS = DEFAULT_GROUP.maxWeeklyHours
const WARNING_HOURS = DEFAULT_GROUP.warningHours

/* ══════════════════════════════════════
   타입
   ══════════════════════════════════════ */
interface HrAttendRecord {
  id: number; empNo: string; name: string; dept: string; group: string
  checkIn: string; checkOut: string; workHours: string; leave: string; holiday: string; abnormal: string
}

const TOTAL_EMP = 12

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
  const [search, setSearch] = useState('')
  const [perPage, setPerPage] = useState(50)
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<CategoryEmployee | null>(null)

  // TODO: API 연동
  // GET /api/attendance/hr/daily?date=2026-03-31 → 일자별 전사 근태
  // GET /api/attendance/hr/summary?date=2026-03-31 → 카테고리별 요약
  // GET /api/attendance/hr/category/{category}?date=2026-03-31 → 카테고리별 사원 목록
  // GET /api/attendance/hr/employee/{empNo}/detail?date=2026-03-31 → 사원 상세 일별 근무
  // GET /api/attendance/hr/monthly-aggregate?year=2026&month=3 → 월간 집계 (부서별)
  const [attendRecords] = useState<HrAttendRecord[]>([
    { id: 1, empNo: 'EMP001', name: '김민수', dept: '개발팀', group: '기본그룹', checkIn: '08:55', checkOut: '18:10', workHours: '8h 15m', leave: '-', holiday: '-', abnormal: '-' },
    { id: 2, empNo: 'EMP002', name: '이서연', dept: '개발팀', group: '기본그룹', checkIn: '09:12', checkOut: '18:05', workHours: '7h 53m', leave: '-', holiday: '-', abnormal: '지각' },
    { id: 3, empNo: 'EMP003', name: '박지훈', dept: '개발팀', group: '기본그룹', checkIn: '08:50', checkOut: '20:30', workHours: '10h 40m', leave: '-', holiday: '-', abnormal: '초과근무' },
    { id: 4, empNo: 'EMP004', name: '최유진', dept: '인사팀', group: '기본그룹', checkIn: '09:00', checkOut: '18:00', workHours: '8h 00m', leave: '-', holiday: '-', abnormal: '-' },
    { id: 5, empNo: 'EMP005', name: '정하늘', dept: '인사팀', group: '기본그룹', checkIn: '-', checkOut: '-', workHours: '0h', leave: '연차', holiday: '-', abnormal: '-' },
    { id: 6, empNo: 'EMP006', name: '강도윤', dept: '마케팅팀', group: '기본그룹', checkIn: '09:03', checkOut: '17:30', workHours: '7h 27m', leave: '-', holiday: '-', abnormal: '조퇴' },
    { id: 7, empNo: 'EMP007', name: '윤서현', dept: '마케팅팀', group: '기본그룹', checkIn: '08:58', checkOut: '18:15', workHours: '8h 17m', leave: '-', holiday: '-', abnormal: '-' },
    { id: 8, empNo: 'EMP008', name: '임재호', dept: '영업팀', group: '기본그룹', checkIn: '09:00', checkOut: '19:45', workHours: '9h 45m', leave: '-', holiday: '-', abnormal: '초과근무' },
    { id: 9, empNo: 'EMP009', name: '한소희', dept: '영업팀', group: '기본그룹', checkIn: '-', checkOut: '-', workHours: '0h', leave: '-', holiday: '-', abnormal: '출퇴근 누락' },
    { id: 10, empNo: 'EMP010', name: '오준혁', dept: '기획팀', group: '기본그룹', checkIn: '08:45', checkOut: '18:00', workHours: '8h 15m', leave: '-', holiday: '-', abnormal: '-' },
    { id: 11, empNo: 'EMP011', name: '신예린', dept: '기획팀', group: '기본그룹', checkIn: '09:05', checkOut: '18:00', workHours: '7h 55m', leave: '-', holiday: '-', abnormal: '지각' },
    { id: 12, empNo: 'EMP012', name: '조태민', dept: '개발팀', group: '기본그룹', checkIn: '09:00', checkOut: '18:10', workHours: '8h 10m', leave: '-', holiday: '-', abnormal: '-' },
  ])
  const [summary] = useState({
    normal: 7, late: 2, earlyLeave: 1, breakShort: 0,
    allDay: 10, leaveIn: 0, missPunch: 1, underHours: 1,
    offsite: 0, unapprovedOT: 2, over52: 1,
  })
  const [categoryEmployees] = useState<Record<CategoryKey, CategoryEmployee[]>>({
    '정상': [
      { id: 1, empNo: 'EMP001', name: '김민수', dept: '개발팀', position: '과장', weeklyHours: '42h', detail: '정시 출퇴근' },
      { id: 4, empNo: 'EMP004', name: '최유진', dept: '인사팀', position: '과장', weeklyHours: '40h', detail: '정시 출퇴근' },
      { id: 7, empNo: 'EMP007', name: '윤서현', dept: '마케팅팀', position: '사원', weeklyHours: '41h', detail: '정시 출퇴근' },
      { id: 10, empNo: 'EMP010', name: '오준혁', dept: '기획팀', position: '과장', weeklyHours: '41h', detail: '정시 출퇴근' },
      { id: 12, empNo: 'EMP012', name: '조태민', dept: '개발팀', position: '사원', weeklyHours: '40h', detail: '정시 출퇴근' },
    ],
    '종일근무상태': [
      { id: 1, empNo: 'EMP001', name: '김민수', dept: '개발팀', position: '과장', weeklyHours: '42h', detail: '근무중' },
      { id: 2, empNo: 'EMP002', name: '이서연', dept: '개발팀', position: '대리', weeklyHours: '39h', detail: '근무중' },
      { id: 3, empNo: 'EMP003', name: '박지훈', dept: '개발팀', position: '사원', weeklyHours: '50h', detail: '근무중' },
    ],
    '지각': [
      { id: 2, empNo: 'EMP002', name: '이서연', dept: '개발팀', position: '대리', weeklyHours: '39h', detail: '12분 지각' },
      { id: 11, empNo: 'EMP011', name: '신예린', dept: '기획팀', position: '사원', weeklyHours: '39h', detail: '5분 지각' },
    ],
    '조퇴': [
      { id: 6, empNo: 'EMP006', name: '강도윤', dept: '마케팅팀', position: '차장', weeklyHours: '37h', detail: '30분 조퇴' },
    ],
    '휴게시간 부족': [],
    '휴가 중 출근': [],
    '출퇴근 누락': [
      { id: 9, empNo: 'EMP009', name: '한소희', dept: '영업팀', position: '대리', weeklyHours: '32h', detail: '출근 체크 누락' },
    ],
    '1일 소정근로시간 미달': [
      { id: 6, empNo: 'EMP006', name: '강도윤', dept: '마케팅팀', position: '차장', weeklyHours: '37h', detail: '7h 27m (0h 33m 미달)' },
    ],
    '근무지 외 근태체크': [],
    '미승인 초과근무': [
      { id: 3, empNo: 'EMP003', name: '박지훈', dept: '개발팀', position: '사원', weeklyHours: '50h', detail: '2h 30m 미승인' },
      { id: 8, empNo: 'EMP008', name: '임재호', dept: '영업팀', position: '부장', weeklyHours: '48h', detail: '1h 45m 미승인' },
    ],
    '최대근무시간 초과': [
      { id: 3, empNo: 'EMP003', name: '박지훈', dept: '개발팀', position: '사원', weeklyHours: '54h', detail: '주 54h (2h 초과)' },
    ],
  })
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
  const [weeklyStats] = useState<{ date: string; day: string; totalEmp: number; normal: number; late: number; earlyLeave: number; absent: number; onLeave: number; overtime: number }[]>([
    { date: '04/06', day: '월', totalEmp: 12, normal: 10, late: 1, earlyLeave: 0, absent: 0, onLeave: 1, overtime: 2 },
    { date: '04/07', day: '화', totalEmp: 12, normal: 9, late: 2, earlyLeave: 0, absent: 0, onLeave: 1, overtime: 3 },
    { date: '04/08', day: '수', totalEmp: 12, normal: 11, late: 0, earlyLeave: 0, absent: 0, onLeave: 1, overtime: 2 },
    { date: '04/09', day: '목', totalEmp: 12, normal: 9, late: 1, earlyLeave: 1, absent: 0, onLeave: 1, overtime: 2 },
    { date: '04/10', day: '금', totalEmp: 12, normal: 8, late: 2, earlyLeave: 1, absent: 1, onLeave: 0, overtime: 4 },
  ])
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

  const filtered = search ? attendRecords.filter((d) => d.name.includes(search) || d.dept.includes(search)) : attendRecords

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
                <span className="text-[13px] text-gray-500">({categoryEmployees[selectedCategory]?.length ?? 0}명)</span>
              </div>
              <button onClick={() => setSelectedCategory(null)} className="text-gray-400 hover:text-gray-600 text-[18px]"><i className="fas fa-times" /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-3">
              {(categoryEmployees[selectedCategory]?.length ?? 0) === 0 ? (
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
                    {categoryEmployees[selectedCategory]?.map((emp) => (
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
        <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none">
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
