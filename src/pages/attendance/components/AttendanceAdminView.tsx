import { useState } from 'react'

/* ══════════════════════════════════════
   Mock 데이터
   ══════════════════════════════════════ */
interface DailyStats {
  date: string
  day: string
  totalEmp: number
  normal: number
  late: number
  earlyLeave: number
  absent: number
  onLeave: number
  overtime: number
}

interface DeptSummary {
  dept: string
  totalEmp: number
  attendRate: number
  lateRate: number
  avgOvertimeHours: number
  overtimeCount: number
  absentCount: number
}

interface OvertimeEmployee {
  id: number
  empNo: string
  name: string
  dept: string
  position: string
  weeklyHours: number
  overtimeHours: number
  maxWeeklyHours: number
  status: '정상' | '경고' | '초과'
}

const TOTAL_EMP = 22

const WEEKLY_STATS: DailyStats[] = [
  { date: '2026-03-30', day: '월', totalEmp: TOTAL_EMP, normal: 18, late: 2, earlyLeave: 0, absent: 0, onLeave: 2, overtime: 3 },
  { date: '2026-03-31', day: '화', totalEmp: TOTAL_EMP, normal: 17, late: 3, earlyLeave: 1, absent: 0, onLeave: 1, overtime: 4 },
  { date: '2026-04-01', day: '수', totalEmp: TOTAL_EMP, normal: 19, late: 1, earlyLeave: 0, absent: 1, onLeave: 1, overtime: 2 },
  { date: '2026-04-02', day: '목', totalEmp: TOTAL_EMP, normal: 16, late: 2, earlyLeave: 1, absent: 0, onLeave: 3, overtime: 5 },
  { date: '2026-04-03', day: '금', totalEmp: TOTAL_EMP, normal: 18, late: 1, earlyLeave: 0, absent: 0, onLeave: 3, overtime: 2 },
]

const DEPT_SUMMARY: DeptSummary[] = [
  { dept: '경영', totalEmp: 8, attendRate: 93.5, lateRate: 12.5, avgOvertimeHours: 2.3, overtimeCount: 2, absentCount: 1 },
  { dept: '개발', totalEmp: 9, attendRate: 97.8, lateRate: 4.4, avgOvertimeHours: 6.8, overtimeCount: 5, absentCount: 0 },
  { dept: '인사', totalEmp: 5, attendRate: 100, lateRate: 0, avgOvertimeHours: 1.2, overtimeCount: 1, absentCount: 0 },
]

const OVERTIME_EMPLOYEES: OvertimeEmployee[] = [
  { id: 1, empNo: 'EMP006', name: '박서준', dept: '개발', position: '팀장', weeklyHours: 53.2, overtimeHours: 13.2, maxWeeklyHours: 52, status: '초과' },
  { id: 2, empNo: 'EMP012', name: '김태리', dept: '개발', position: '선임', weeklyHours: 55.0, overtimeHours: 15.0, maxWeeklyHours: 52, status: '초과' },
  { id: 3, empNo: 'EMP015', name: '조인성', dept: '개발', position: '팀장', weeklyHours: 48.5, overtimeHours: 8.5, maxWeeklyHours: 52, status: '경고' },
  { id: 4, empNo: 'EMP017', name: '공유진', dept: '개발', position: '선임', weeklyHours: 46.0, overtimeHours: 6.0, maxWeeklyHours: 52, status: '정상' },
  { id: 5, empNo: 'EMP011', name: '정해인', dept: '경영', position: '과장', weeklyHours: 45.0, overtimeHours: 5.0, maxWeeklyHours: 52, status: '정상' },
  { id: 6, empNo: 'EMP022', name: '신민아', dept: '경영', position: '대리', weeklyHours: 44.5, overtimeHours: 4.5, maxWeeklyHours: 52, status: '정상' },
]

const statusColor: Record<string, string> = {
  '정상': 'bg-green-50 text-green-700',
  '경고': 'bg-yellow-50 text-yellow-600',
  '초과': 'bg-red-50 text-red-600',
}

/* ══════════════════════════════════════
   컴포넌트
   ══════════════════════════════════════ */
export default function AttendanceAdminView() {
  const [innerTab, setInnerTab] = useState<'주간현황' | '부서별현황' | '초과근무'>('주간현황')

  // 주간 요약 계산
  const weekTotal = WEEKLY_STATS.reduce((acc, d) => ({
    normal: acc.normal + d.normal,
    late: acc.late + d.late,
    earlyLeave: acc.earlyLeave + d.earlyLeave,
    absent: acc.absent + d.absent,
    onLeave: acc.onLeave + d.onLeave,
    overtime: acc.overtime + d.overtime,
  }), { normal: 0, late: 0, earlyLeave: 0, absent: 0, onLeave: 0, overtime: 0 })

  const weekAttendRate = Math.round((weekTotal.normal + weekTotal.late + weekTotal.earlyLeave) / (WEEKLY_STATS.length * TOTAL_EMP) * 1000) / 10
  const weekLateRate = Math.round(weekTotal.late / (WEEKLY_STATS.length * TOTAL_EMP) * 1000) / 10

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">관리자 근태 현황</h3>
      <p className="text-[12px] text-gray-400 mb-5">출근율, 지각률, 초과근무 현황을 한눈에 모니터링합니다</p>

      {/* ── 요약 카드 ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="border border-gray-200 rounded-xl p-4 bg-white">
          <p className="text-[11px] text-gray-400 mb-1">이번 주 출근율</p>
          <p className="text-[22px] font-bold text-[#1D9E75]">{weekAttendRate}%</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-4 bg-white">
          <p className="text-[11px] text-gray-400 mb-1">이번 주 지각률</p>
          <p className={`text-[22px] font-bold ${weekLateRate > 5 ? 'text-red-500' : 'text-gray-800'}`}>{weekLateRate}%</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-4 bg-white">
          <p className="text-[11px] text-gray-400 mb-1">결근</p>
          <p className={`text-[22px] font-bold ${weekTotal.absent > 0 ? 'text-red-500' : 'text-gray-800'}`}>{weekTotal.absent}건</p>
        </div>
        <div className="border border-gray-200 rounded-xl p-4 bg-white">
          <p className="text-[11px] text-gray-400 mb-1">초과근무 인원</p>
          <p className="text-[22px] font-bold text-orange-500">{OVERTIME_EMPLOYEES.filter((e) => e.status === '초과').length}명</p>
        </div>
      </div>

      {/* ── 탭 ── */}
      <div className="flex items-center gap-2 mb-4">
        {(['주간현황', '부서별현황', '초과근무'] as const).map((t) => (
          <button key={t} onClick={() => setInnerTab(t)}
            className={`px-4 py-1.5 text-[13px] rounded-full transition-colors ${innerTab === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ═══ 주간현황 ═══ */}
      {innerTab === '주간현황' && (
        <div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b-2 border-gray-900">
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
              </tr>
            </thead>
            <tbody>
              {WEEKLY_STATS.map((d) => {
                const attend = Math.round((d.normal + d.late + d.earlyLeave) / d.totalEmp * 1000) / 10
                return (
                  <tr key={d.date} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5 text-gray-800">{d.date}</td>
                    <td className="px-3 py-2.5 text-gray-600">{d.day}</td>
                    <td className="px-3 py-2.5 text-center text-gray-800">{d.totalEmp}</td>
                    <td className="px-3 py-2.5 text-center text-[#1D9E75] font-medium">{d.normal}</td>
                    <td className="px-3 py-2.5 text-center">
                      {d.late > 0 ? <span className="text-orange-500 font-medium">{d.late}</span> : <span className="text-gray-400">0</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {d.earlyLeave > 0 ? <span className="text-yellow-600">{d.earlyLeave}</span> : <span className="text-gray-400">0</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {d.absent > 0 ? <span className="text-red-500 font-medium">{d.absent}</span> : <span className="text-gray-400">0</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center text-blue-500">{d.onLeave}</td>
                    <td className="px-3 py-2.5 text-center">
                      {d.overtime > 0 ? <span className="text-orange-500">{d.overtime}</span> : <span className="text-gray-400">0</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${attend >= 95 ? 'bg-green-50 text-green-700' : attend >= 90 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
                        {attend}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ 부서별현황 ═══ */}
      {innerTab === '부서별현황' && (
        <div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서</th>
                <th className="px-3 py-2.5 text-center text-gray-700 font-medium">인원</th>
                <th className="px-3 py-2.5 text-center text-gray-700 font-medium">출근율</th>
                <th className="px-3 py-2.5 text-center text-gray-700 font-medium">지각률</th>
                <th className="px-3 py-2.5 text-center text-gray-700 font-medium">결근</th>
                <th className="px-3 py-2.5 text-center text-gray-700 font-medium">평균 초과근무</th>
                <th className="px-3 py-2.5 text-center text-gray-700 font-medium">초과근무 인원</th>
              </tr>
            </thead>
            <tbody>
              {DEPT_SUMMARY.map((d) => (
                <tr key={d.dept} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5 text-gray-800 font-medium">{d.dept}</td>
                  <td className="px-3 py-2.5 text-center text-gray-600">{d.totalEmp}명</td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${d.attendRate >= 95 ? 'bg-[#1D9E75]' : 'bg-orange-400'}`}
                          style={{ width: `${d.attendRate}%` }} />
                      </div>
                      <span className={`text-[11px] ${d.attendRate >= 95 ? 'text-[#1D9E75]' : 'text-orange-500'} font-medium`}>{d.attendRate}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={d.lateRate > 5 ? 'text-red-500 font-medium' : 'text-gray-600'}>{d.lateRate}%</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {d.absentCount > 0 ? <span className="text-red-500 font-medium">{d.absentCount}건</span> : <span className="text-gray-400">0건</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={d.avgOvertimeHours > 5 ? 'text-orange-500 font-medium' : 'text-gray-600'}>{d.avgOvertimeHours}h</span>
                  </td>
                  <td className="px-3 py-2.5 text-center text-gray-600">{d.overtimeCount}명</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ 초과근무 ═══ */}
      {innerTab === '초과근무' && (
        <div>
          <div className="flex items-center gap-3 mb-3 p-3 bg-orange-50 rounded-lg">
            <span className="text-[12px] text-orange-700">주 최대 근무시간: <strong>52시간</strong> | 경고 기준: <strong>48시간</strong></span>
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사번</th>
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">이름</th>
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서</th>
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">직급</th>
                <th className="px-3 py-2.5 text-center text-gray-700 font-medium">주간 근무</th>
                <th className="px-3 py-2.5 text-center text-gray-700 font-medium">초과근무</th>
                <th className="px-3 py-2.5 text-center text-gray-700 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {OVERTIME_EMPLOYEES.map((e) => (
                <tr key={e.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${e.status === '초과' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-3 py-2.5 text-gray-500">{e.empNo}</td>
                  <td className="px-3 py-2.5 text-gray-800 font-medium">{e.name}</td>
                  <td className="px-3 py-2.5 text-gray-600">{e.dept}</td>
                  <td className="px-3 py-2.5 text-gray-600">{e.position}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={e.weeklyHours > e.maxWeeklyHours ? 'text-red-500 font-semibold' : 'text-gray-800'}>
                      {e.weeklyHours}h
                    </span>
                    <span className="text-gray-400 text-[10px]"> / {e.maxWeeklyHours}h</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={e.overtimeHours > 12 ? 'text-red-500 font-semibold' : 'text-orange-500'}>{e.overtimeHours}h</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] ${statusColor[e.status]}`}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
