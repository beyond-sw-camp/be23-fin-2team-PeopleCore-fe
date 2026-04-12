import { useState } from 'react'

/* ══════════════════════════════════════
   Mock 데이터
   ══════════════════════════════════════ */
/* ══════════════════════════════════════
   타입
   ══════════════════════════════════════ */
interface LeaveEmployee {
  id: number; name: string; position: string; dept: string; hireDate: string; years: number
  period: string; remaining: number; used: number; total: number; generated: number; adjusted: number; hasApprovedAdjust: boolean
  usedPercent: number
}

interface DeptLeaveSummary {
  dept: string; count: number; totalLeave: number; usedLeave: number; avgPercent: number; lowUsage: number
}

interface VacationRecord {
  id: number; name: string; dept: string; leaveType: string; dayOption: string
  startDate: string; endDate: string; days: number; status: string; appliedAt: string; isLegal: boolean
}

const statusColor: Record<string, string> = { '승인대기': 'bg-yellow-50 text-yellow-600', '승인완료': 'bg-gray-100 text-gray-600', '반려': 'bg-red-50 text-red-500' }

/* ══════════════════════════════════════
   전사 휴가 관리 탭
   ══════════════════════════════════════ */
export default function HrLeaveVacationTab() {
  const [innerTab, setInnerTab] = useState<'기간별 휴가 현황' | '전사 연차 현황' | '휴가 결재'>('기간별 휴가 현황')
  const [search, setSearch] = useState('')
  const [perPage, setPerPage] = useState(50)
  const [statusFilter, setStatusFilter] = useState('전체')

  // 날짜 범위 (기간별 휴가 현황용)
  const [rangeStart, setRangeStart] = useState('2026-04-01')
  const [rangeEnd, setRangeEnd] = useState('2026-04-30')

  // 연차 조정 승인 건 필터
  const [showApprovedAdjustOnly, setShowApprovedAdjustOnly] = useState(false)

  // 연차 조정 모달
  const [adjustModal, setAdjustModal] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState('')
  const [adjustDays, setAdjustDays] = useState(0)
  const [adjustReason, setAdjustReason] = useState('')
  const [adjustSearch, setAdjustSearch] = useState('')

  // TODO: API 연동
  // GET /api/attendance/hr/vacation-list?startDate=&endDate=&search=&page=0&size=50 → 기간별 휴가 현황
  // GET /api/attendance/hr/vacation-summary?startDate=&endDate= → 기간별 요약 카드
  // GET /api/attendance/hr/leave-status?search=&page=0&size=50 → 전사 연차 현황
  // POST /api/attendance/hr/leave-adjust → 연차 조정
  // GET /api/attendance/hr/leave-requests?status=&search=&page=0&size=50 → 휴가 결재 목록
  // PATCH /api/attendance/hr/leave-requests/{id}/decide → 휴가 승인/반려
  const [vacationRecords] = useState<VacationRecord[]>([
    { id: 1, name: '김민수', dept: '개발팀', leaveType: '연차', dayOption: '종일', startDate: '2026-04-03', endDate: '2026-04-03', days: 1, status: '승인완료', appliedAt: '2026-03-28', isLegal: true },
    { id: 2, name: '이서연', dept: '개발팀', leaveType: '반차(오전)', dayOption: '반차', startDate: '2026-04-08', endDate: '2026-04-08', days: 0.5, status: '승인완료', appliedAt: '2026-04-02', isLegal: true },
    { id: 3, name: '박지훈', dept: '개발팀', leaveType: '연차', dayOption: '종일', startDate: '2026-04-15', endDate: '2026-04-16', days: 2, status: '승인대기', appliedAt: '2026-04-10', isLegal: true },
    { id: 4, name: '최유진', dept: '인사팀', leaveType: '경조사', dayOption: '종일', startDate: '2026-04-10', endDate: '2026-04-10', days: 1, status: '승인완료', appliedAt: '2026-04-07', isLegal: false },
    { id: 5, name: '정하늘', dept: '인사팀', leaveType: '연차', dayOption: '종일', startDate: '2026-04-11', endDate: '2026-04-11', days: 1, status: '승인완료', appliedAt: '2026-04-05', isLegal: true },
    { id: 6, name: '강도윤', dept: '마케팅팀', leaveType: '병가', dayOption: '종일', startDate: '2026-04-09', endDate: '2026-04-09', days: 1, status: '반려', appliedAt: '2026-04-08', isLegal: false },
    { id: 7, name: '윤서현', dept: '마케팅팀', leaveType: '연차', dayOption: '종일', startDate: '2026-04-20', endDate: '2026-04-22', days: 3, status: '승인대기', appliedAt: '2026-04-11', isLegal: true },
    { id: 8, name: '임재호', dept: '영업팀', leaveType: '반차(오후)', dayOption: '반차', startDate: '2026-04-14', endDate: '2026-04-14', days: 0.5, status: '승인완료', appliedAt: '2026-04-09', isLegal: true },
    { id: 9, name: '한소희', dept: '영업팀', leaveType: '연차', dayOption: '종일', startDate: '2026-04-17', endDate: '2026-04-17', days: 1, status: '승인대기', appliedAt: '2026-04-11', isLegal: true },
    { id: 10, name: '오준혁', dept: '기획팀', leaveType: '연차', dayOption: '종일', startDate: '2026-04-24', endDate: '2026-04-24', days: 1, status: '승인완료', appliedAt: '2026-04-10', isLegal: true },
  ])
  const [leaveEmployees] = useState<LeaveEmployee[]>([
    { id: 1, name: '김민수', position: '과장', dept: '개발팀', hireDate: '2019-03-02', years: 7, period: '2026-01-01 ~ 2026-12-31', remaining: 12, used: 3, total: 15, generated: 15, adjusted: 0, hasApprovedAdjust: false, usedPercent: 20 },
    { id: 2, name: '이서연', position: '대리', dept: '개발팀', hireDate: '2022-06-15', years: 3, period: '2026-01-01 ~ 2026-12-31', remaining: 10.5, used: 4.5, total: 15, generated: 15, adjusted: 0, hasApprovedAdjust: false, usedPercent: 30 },
    { id: 3, name: '박지훈', position: '사원', dept: '개발팀', hireDate: '2024-01-08', years: 2, period: '2026-01-01 ~ 2026-12-31', remaining: 14, used: 1, total: 15, generated: 15, adjusted: 0, hasApprovedAdjust: false, usedPercent: 7 },
    { id: 4, name: '최유진', position: '과장', dept: '인사팀', hireDate: '2018-11-01', years: 8, period: '2026-01-01 ~ 2026-12-31', remaining: 11, used: 5, total: 16, generated: 15, adjusted: 1, hasApprovedAdjust: true, usedPercent: 31 },
    { id: 5, name: '정하늘', position: '대리', dept: '인사팀', hireDate: '2021-02-18', years: 5, period: '2026-01-01 ~ 2026-12-31', remaining: 13, used: 2, total: 15, generated: 15, adjusted: 0, hasApprovedAdjust: false, usedPercent: 13 },
    { id: 6, name: '강도윤', position: '차장', dept: '마케팅팀', hireDate: '2016-08-05', years: 10, period: '2026-01-01 ~ 2026-12-31', remaining: 14, used: 3, total: 17, generated: 17, adjusted: 0, hasApprovedAdjust: false, usedPercent: 17 },
    { id: 7, name: '윤서현', position: '사원', dept: '마케팅팀', hireDate: '2024-07-22', years: 1, period: '2026-01-01 ~ 2026-12-31', remaining: 11, used: 0, total: 11, generated: 11, adjusted: 0, hasApprovedAdjust: false, usedPercent: 0 },
    { id: 8, name: '임재호', position: '부장', dept: '영업팀', hireDate: '2015-06-01', years: 11, period: '2026-01-01 ~ 2026-12-31', remaining: 13.5, used: 3.5, total: 17, generated: 17, adjusted: 0, hasApprovedAdjust: false, usedPercent: 20 },
    { id: 9, name: '한소희', position: '대리', dept: '영업팀', hireDate: '2022-04-14', years: 3, period: '2026-01-01 ~ 2026-12-31', remaining: 15, used: 0, total: 15, generated: 15, adjusted: 0, hasApprovedAdjust: false, usedPercent: 0 },
    { id: 10, name: '오준혁', position: '과장', dept: '기획팀', hireDate: '2019-12-08', years: 6, period: '2026-01-01 ~ 2026-12-31', remaining: 12, used: 3, total: 15, generated: 15, adjusted: 0, hasApprovedAdjust: false, usedPercent: 20 },
    { id: 11, name: '신예린', position: '사원', dept: '기획팀', hireDate: '2025-01-06', years: 1, period: '2026-01-01 ~ 2026-12-31', remaining: 11, used: 0, total: 11, generated: 11, adjusted: 0, hasApprovedAdjust: false, usedPercent: 0 },
    { id: 12, name: '조태민', position: '사원', dept: '개발팀', hireDate: '2025-02-11', years: 1, period: '2026-01-01 ~ 2026-12-31', remaining: 11, used: 0, total: 11, generated: 11, adjusted: 0, hasApprovedAdjust: false, usedPercent: 0 },
  ])
  const [deptLeaveSummary] = useState<DeptLeaveSummary[]>([
    { dept: '개발팀', count: 4, totalLeave: 56, usedLeave: 8.5, avgPercent: 15, lowUsage: 2 },
    { dept: '인사팀', count: 2, totalLeave: 31, usedLeave: 7, avgPercent: 23, lowUsage: 0 },
    { dept: '마케팅팀', count: 2, totalLeave: 28, usedLeave: 3, avgPercent: 11, lowUsage: 1 },
    { dept: '영업팀', count: 2, totalLeave: 32, usedLeave: 3.5, avgPercent: 11, lowUsage: 1 },
    { dept: '기획팀', count: 2, totalLeave: 26, usedLeave: 3, avgPercent: 12, lowUsage: 1 },
  ])

  // 전사 연차 현황 필터/정렬
  const [deptFilter, setDeptFilter] = useState('전체')
  const [lowUsageOnly, setLowUsageOnly] = useState(false)
  const [sortKey, setSortKey] = useState<'usedPercent' | 'remaining' | 'name'>('usedPercent')
  const [sortAsc, setSortAsc] = useState(true)

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }
  const sortIcon = (key: typeof sortKey) => sortKey === key ? (sortAsc ? ' ▲' : ' ▼') : ''

  const filteredVacation = (() => {
    let list = vacationRecords
    if (statusFilter !== '전체') list = list.filter((d) => d.status === statusFilter)
    if (search) list = list.filter((d) => d.name.includes(search) || d.dept.includes(search))
    return list
  })()

  const filteredLeave = (() => {
    let list = leaveEmployees
    if (showApprovedAdjustOnly) list = list.filter((d) => d.hasApprovedAdjust)
    if (deptFilter !== '전체') list = list.filter((d) => d.dept === deptFilter)
    if (lowUsageOnly) list = list.filter((d) => d.usedPercent < 30)
    if (search) list = list.filter((d) => d.name.includes(search) || d.dept.includes(search))
    return list.sort((a, b) => {
      const mul = sortAsc ? 1 : -1
      if (sortKey === 'name') return mul * a.name.localeCompare(b.name)
      return mul * (a[sortKey] - b[sortKey])
    })
  })()

  const approvedAdjustCount = leaveEmployees.filter((d) => d.hasApprovedAdjust).length

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 mb-4">전사 휴가 관리</h1>

      {/* 탭 */}
      <div className="flex items-center gap-2 mb-4">
        {(['기간별 휴가 현황', '전사 연차 현황', '휴가 결재'] as const).map((t) => (
          <button key={t} onClick={() => { setInnerTab(t); setSearch(''); setStatusFilter('전체') }}
            className={`px-4 py-1.5 text-[13px] rounded-full transition-colors ${innerTab === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ═══ 기간별 휴가 현황 ═══ */}
      {innerTab === '기간별 휴가 현황' && (
        <div>
          {/* 날짜 범위 선택 */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <button onClick={() => (document.getElementById('range-start') as any)?.showPicker?.()} className="text-[18px] font-bold text-gray-900 hover:text-[#1D9E75] transition-colors cursor-pointer">
                {rangeStart}
              </button>
              <input id="range-start" type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)}
                className="absolute inset-0 opacity-0 w-0 h-0" />
            </div>
            <span className="text-[16px] text-gray-400">~</span>
            <div className="relative">
              <button onClick={() => (document.getElementById('range-end') as any)?.showPicker?.()} className="text-[18px] font-bold text-gray-900 hover:text-[#1D9E75] transition-colors cursor-pointer">
                {rangeEnd}
              </button>
              <input id="range-end" type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)}
                className="absolute inset-0 opacity-0 w-0 h-0" />
            </div>
            <button onClick={() => { const today = new Date().toISOString().slice(0, 10); setRangeStart(today); setRangeEnd(today) }}
              className="text-[12px] text-gray-500 hover:text-[#1D9E75] ml-2 transition-colors">오늘</button>
          </div>

          {/* 요약 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-[11px] text-gray-500 mb-1">해당 기간 휴가자</div>
              <div className="text-[22px] font-bold text-gray-900">{filteredVacation.length}명</div>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-[11px] text-gray-500 mb-1">승인대기</div>
              <div className="text-[22px] font-bold text-yellow-600">{filteredVacation.filter((d) => d.status === '승인대기').length}건</div>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-[11px] text-gray-500 mb-1">승인완료</div>
              <div className="text-[22px] font-bold text-[#1D9E75]">{filteredVacation.filter((d) => d.status === '승인완료').length}건</div>
            </div>
          </div>

          {/* 검색 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center border border-gray-300 rounded px-2 py-1.5">
              <i className="fas fa-search text-gray-400 text-[11px] mr-2" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름, 부서로 검색" className="text-[12px] outline-none bg-transparent w-48 placeholder-gray-400" />
            </div>
            <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none">
              {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* 휴가자 리스트 */}
          <table className="w-full text-[12px]">
            <thead><tr className="border-b-2 border-gray-900">
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사원명</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">휴가유형</th>
              <th className="px-3 py-2.5 text-center text-gray-700 font-medium">구분</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사용옵션</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">휴가기간</th>
              <th className="px-3 py-2.5 text-right text-gray-700 font-medium">일수</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">상태</th>
            </tr></thead>
            <tbody>
              {filteredVacation.slice(0, perPage).map((d) => (
                <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 shrink-0"><i className="fas fa-user" /></div>
                      <span className="text-gray-800 font-medium">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600">{d.dept}</td>
                  <td className="px-3 py-2.5 text-gray-700">{d.leaveType}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${d.isLegal ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                      {d.isLegal ? '법정' : '일반'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-500">{d.dayOption}</td>
                  <td className="px-3 py-2.5 text-gray-600">{d.startDate === d.endDate ? d.startDate : `${d.startDate} ~ ${d.endDate}`}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700 font-semibold">{d.days}d</td>
                  <td className="px-3 py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${statusColor[d.status] ?? 'bg-gray-100 text-gray-500'}`}>{d.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredVacation.length === 0 && (
            <div className="text-center py-12 text-[13px] text-gray-400">해당 기간에 휴가자가 없습니다</div>
          )}
        </div>
      )}

      {/* ═══ 전사 연차 현황 ═══ */}
      {innerTab === '전사 연차 현황' && (
        <div>
          {/* 부서별 요약 카드 */}
          {deptLeaveSummary.length > 0 && (
            <div className={`grid grid-cols-${Math.min(deptLeaveSummary.length, 4)} gap-4 mb-6`}>
              {deptLeaveSummary.map((s) => (
                <div key={s.dept} className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => setDeptFilter(s.dept)}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[13px] font-semibold text-gray-800">{s.dept}</span>
                    <span className="text-[11px] text-gray-400">{s.count}명</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                    <div className={`h-2 rounded-full transition-all ${s.avgPercent >= 80 ? 'bg-[#1D9E75]' : s.avgPercent < 30 ? 'bg-orange-400' : 'bg-blue-400'}`}
                      style={{ width: `${Math.min(s.avgPercent, 100)}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">평균 소진율 <strong className={s.avgPercent < 30 ? 'text-orange-500' : 'text-[#1D9E75]'}>{s.avgPercent}%</strong></span>
                    {s.lowUsage > 0 && <span className="text-orange-500">소진율 낮음 {s.lowUsage}명</span>}
                  </div>
                  <div className="flex gap-4 mt-2 text-[11px] text-gray-400">
                    <span>총 {s.totalLeave}일</span>
                    <span>사용 {s.usedLeave}일</span>
                    <span>잔여 {s.totalLeave - s.usedLeave}일</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 필터 + 검색 + 연차 조정 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {['전체', ...deptLeaveSummary.map((s) => s.dept)].map((d) => (
                  <button key={d} onClick={() => setDeptFilter(d)}
                    className={`px-3 py-1.5 text-[12px] rounded-lg transition-colors ${deptFilter === d ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {d}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-1.5 text-[12px] text-gray-600 cursor-pointer ml-2">
                <input type="checkbox" checked={lowUsageOnly} onChange={(e) => setLowUsageOnly(e.target.checked)} className="accent-[#1D9E75]" />
                소진율 30% 미만만
              </label>
              <div className="flex items-center border border-gray-300 rounded px-2 py-1.5 ml-2">
                <i className="fas fa-search text-gray-400 text-[11px] mr-2" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름, 부서로 검색" className="text-[12px] outline-none bg-transparent w-40 placeholder-gray-400" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {approvedAdjustCount > 0 && (
                <button onClick={() => setShowApprovedAdjustOnly(!showApprovedAdjustOnly)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-lg border transition-colors ${showApprovedAdjustOnly ? 'border-[#1D9E75] bg-[#E1F5EE] text-[#1D9E75]' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                  <i className="fas fa-check-circle text-[10px]" />
                  연차 조정 승인 {approvedAdjustCount}건
                </button>
              )}
              <button onClick={() => { setAdjustModal(true); setAdjustTarget(''); setAdjustDays(0); setAdjustReason('') }}
                className="px-3 py-1.5 text-[12px] bg-[#1D9E75] text-white rounded-lg hover:bg-[#178a65] transition-colors">
                연차 조정
              </button>
              <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none">
                {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          {/* 연차 테이블 */}
          <table className="w-full text-[12px]">
            <thead><tr className="border-b-2 border-gray-900">
              <th className="px-2 py-2.5 text-left text-gray-700 font-medium cursor-pointer hover:text-[#1D9E75]" onClick={() => handleSort('name')}>사원명{sortIcon('name')}</th>
              <th className="px-2 py-2.5 text-left text-gray-700 font-medium">부서</th>
              <th className="px-2 py-2.5 text-left text-gray-700 font-medium">입사일</th>
              <th className="px-2 py-2.5 text-right text-gray-700 font-medium">근속</th>
              <th className="px-2 py-2.5 text-center text-gray-700 font-medium">구분</th>
              <th className="px-2 py-2.5 text-left text-gray-700 font-medium">연차 사용기간</th>
              <th className="px-2 py-2.5 text-right text-gray-700 font-medium cursor-pointer hover:text-[#1D9E75]" onClick={() => handleSort('remaining')}>잔여{sortIcon('remaining')}</th>
              <th className="px-2 py-2.5 text-right text-gray-700 font-medium">사용</th>
              <th className="px-2 py-2.5 text-right text-gray-700 font-medium">총연차</th>
              <th className="px-2 py-2.5 text-right text-gray-700 font-medium">발생</th>
              <th className="px-2 py-2.5 text-right text-gray-700 font-medium">조정</th>
              <th className="px-2 py-2.5 text-center text-gray-700 font-medium cursor-pointer hover:text-[#1D9E75]" onClick={() => handleSort('usedPercent')}>소진율{sortIcon('usedPercent')}</th>
            </tr></thead>
            <tbody>
              {filteredLeave.slice(0, perPage).map((d) => (
                <tr key={d.id} onClick={() => { setAdjustModal(true); setAdjustTarget(String(d.id)); setAdjustDays(0); setAdjustReason('') }}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${d.hasApprovedAdjust ? 'bg-[#E1F5EE]/30' : ''}`}>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 shrink-0"><i className="fas fa-user" /></div>
                      <span className="text-gray-800 font-medium">{d.name} {d.position}</span>
                      {d.hasApprovedAdjust && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#E1F5EE] text-[#1D9E75] font-semibold">조정승인</span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-gray-600">{d.dept}</td>
                  <td className="px-2 py-3 text-gray-600">{d.hireDate}</td>
                  <td className="px-2 py-3 text-right text-gray-700">{d.years}년</td>
                  <td className="px-2 py-3 text-center"><span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${d.years < 1 ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>{d.years < 1 ? '월차' : '연차'}</span></td>
                  <td className="px-2 py-3 text-gray-600 text-[11px]">{d.period}</td>
                  <td className={`px-2 py-3 text-right font-semibold ${d.remaining <= 0 ? 'text-red-500' : 'text-[#1D9E75]'}`}>{d.remaining}d</td>
                  <td className="px-2 py-3 text-right text-gray-700">{d.used}d</td>
                  <td className="px-2 py-3 text-right text-gray-700">{d.total}d</td>
                  <td className="px-2 py-3 text-right text-gray-500">{d.generated}d</td>
                  <td className={`px-2 py-3 text-right ${d.adjusted !== 0 ? 'text-[#1D9E75] font-semibold' : 'text-gray-500'}`}>{d.adjusted !== 0 ? `${d.adjusted > 0 ? '+' : ''}${d.adjusted}d` : '-'}</td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${d.usedPercent >= 100 ? 'bg-red-500' : d.usedPercent >= 80 ? 'bg-[#1D9E75]' : d.usedPercent < 30 ? 'bg-orange-400' : 'bg-blue-400'}`}
                          style={{ width: `${Math.min(d.usedPercent, 100)}%` }} />
                      </div>
                      <span className={`text-[11px] w-10 text-right ${d.usedPercent >= 100 ? 'text-red-600 font-semibold' : d.usedPercent >= 80 ? 'text-[#1D9E75] font-semibold' : d.usedPercent < 30 ? 'text-orange-500 font-semibold' : 'text-gray-800'}`}>
                        {d.usedPercent}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLeave.length === 0 && (
            <div className="text-center py-12 text-[13px] text-gray-400">검색 결과가 없습니다</div>
          )}

          {/* 범례 */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
            <span className="text-[11px] text-gray-400">범례:</span>
            <span className="flex items-center gap-1.5 text-[11px]"><span className="w-2.5 h-2.5 rounded-full bg-orange-400" /> 소진율 30% 미만 (사용 촉진 권장)</span>
            <span className="flex items-center gap-1.5 text-[11px]"><span className="w-2.5 h-2.5 rounded-full bg-[#1D9E75]" /> 소진율 80% 이상</span>
            <span className="flex items-center gap-1.5 text-[11px]"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> 초과 사용</span>
          </div>
        </div>
      )}

      {/* ═══ 휴가 결재 ═══ */}
      {innerTab === '휴가 결재' && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            {['전체', '승인대기', '승인완료', '반려'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1 text-[12px] rounded-full transition-colors ${statusFilter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center border border-gray-300 rounded px-2 py-1.5">
              <i className="fas fa-search text-gray-400 text-[11px] mr-2" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름, 부서로 검색" className="text-[12px] outline-none bg-transparent w-48 placeholder-gray-400" />
            </div>
          </div>

          <table className="w-full text-[12px]">
            <thead><tr className="border-b-2 border-gray-900">
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">신청자</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">휴가 유형</th>
              <th className="px-3 py-2.5 text-center text-gray-700 font-medium">구분</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사용 옵션</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">휴가기간</th>
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
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${d.isLegal ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                      {d.isLegal ? '법정' : '일반'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-500">{d.dayOption}</td>
                  <td className="px-3 py-2.5 text-gray-600">{d.startDate === d.endDate ? d.startDate : `${d.startDate} ~ ${d.endDate}`}</td>
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
        </div>
      )}

      {/* ═══ 연차 조정 모달 ═══ */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setAdjustModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[480px]">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-[16px] font-bold text-gray-900">연차 조정</h2>
              <p className="text-[12px] text-gray-500 mt-1">대상 직원을 선택하고 연차를 수동으로 조정합니다</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* 직원 선택 */}
              <div>
                <span className="text-[12px] text-gray-700 font-medium mb-2 block">대상 직원 <span className="text-red-500">*</span></span>
                <div className="flex items-center border border-gray-300 rounded px-2 py-1.5 mb-2">
                  <i className="fas fa-search text-gray-400 text-[11px] mr-2" />
                  <input value={adjustSearch} onChange={(e) => setAdjustSearch(e.target.value)}
                    placeholder="이름, 부서로 검색" className="text-[12px] outline-none bg-transparent w-full placeholder-gray-400" />
                </div>
                <div className="border border-gray-200 rounded max-h-[140px] overflow-y-auto">
                  {leaveEmployees
                    .filter((d) => !adjustSearch || d.name.includes(adjustSearch) || d.dept.includes(adjustSearch))
                    .map((d) => (
                    <div key={d.id} onClick={() => setAdjustTarget(String(d.id))}
                      className={`flex items-center justify-between px-3 py-2 text-[12px] cursor-pointer transition-colors ${
                        adjustTarget === String(d.id) ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'hover:bg-gray-50'
                      }`}>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[8px] text-gray-500"><i className="fas fa-user" /></div>
                        <span className="font-medium">{d.name} {d.position}</span>
                        <span className="text-gray-400">{d.dept}</span>
                      </div>
                      <span className={`font-semibold ${d.remaining <= 0 ? 'text-red-500' : 'text-gray-600'}`}>잔여 {d.remaining}d</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 선택된 직원 정보 + 조정 입력 */}
              {adjustTarget && (() => {
                const emp = leaveEmployees.find((d) => String(d.id) === adjustTarget)
                if (!emp) return null
                const after = emp.remaining + adjustDays
                return (<>
                  <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between">
                    <div className="text-[12px] text-gray-600">
                      <span className="font-semibold text-gray-800">{emp.name} {emp.position}</span> ({emp.dept})
                    </div>
                    <div className="flex items-center gap-4 text-[12px]">
                      <span>현재 잔여 <span className={`font-bold ${emp.remaining <= 0 ? 'text-red-500' : 'text-[#1D9E75]'}`}>{emp.remaining}d</span></span>
                      {adjustDays !== 0 && (<>
                        <span className="text-gray-400">→</span>
                        <span>조정 후 <span className={`font-bold ${after <= 0 ? 'text-red-500' : 'text-[#1D9E75]'}`}>{after}d</span></span>
                      </>)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[12px] text-gray-700 w-24 shrink-0 font-medium">조정 일수 <span className="text-red-500">*</span></span>
                    <div className="flex items-center gap-2">
                      <input type="number" value={adjustDays} onChange={(e) => setAdjustDays(Number(e.target.value))}
                        className="border border-gray-300 rounded px-3 py-2 text-[13px] outline-none w-24 focus:border-[#1D9E75]" />
                      <span className="text-[12px] text-gray-500">일 (음수 = 차감)</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="text-[12px] text-gray-700 w-24 shrink-0 font-medium mt-2">조정 사유 <span className="text-red-500">*</span></span>
                    <textarea value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="조정 사유를 입력하세요"
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75] min-h-[80px] resize-y" />
                  </div>
                </>)
              })()}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button onClick={() => setAdjustModal(false)}
                className="px-5 py-2 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50">취소</button>
              <button onClick={() => setAdjustModal(false)}
                disabled={!adjustTarget || adjustDays === 0 || !adjustReason.trim()}
                className={`px-5 py-2 text-[13px] font-medium rounded-md transition-colors ${adjustTarget && adjustDays !== 0 && adjustReason.trim() ? 'bg-[#1D9E75] text-white hover:bg-[#178a65]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                조정 적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
