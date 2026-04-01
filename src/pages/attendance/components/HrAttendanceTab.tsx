import { useState } from 'react'

/* ══════════════════════════════════════
   Mock 데이터
   ══════════════════════════════════════ */
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

/* ══════════════════════════════════════
   전사 근태현황 탭
   ══════════════════════════════════════ */
export default function HrAttendanceTab() {
  const [viewMode, setViewMode] = useState<'일자별' | '기간별' | '집계'>('일자별')
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
            { label: '52시간 초과 경고', value: '0명', color: 'text-[#1D9E75]' },
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
                <td className={`px-3 py-2.5 text-right font-semibold ${parseFloat(d.weeklyAvg) > 52 ? 'text-red-500' : parseFloat(d.weeklyAvg) > 48 ? 'text-yellow-600' : 'text-gray-700'}`}>{d.weeklyAvg}</td>
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
      </>)}
    </div>
  )
}
