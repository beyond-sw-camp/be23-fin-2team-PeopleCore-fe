import { useState } from 'react'

/* ══════════════════════════════════════
   Mock 데이터
   ══════════════════════════════════════ */
const HR_LEAVE_MOCK = [
  { id: 1, name: '강희계', position: '부장', dept: '경영', hireDate: '2017-01-01', retireDate: '', years: 9, period: '2026-01-01 ~ 2026-12-31', remaining: 4, used: 15, total: 19, generated: 19, carried: 0, adjusted: 0, expired: 0, hasApprovedAdjust: false },
  { id: 2, name: '권시정', position: '차장', dept: '경영', hireDate: '2014-12-31', retireDate: '', years: 11, period: '2025-12-31 ~ 2026-12-30', remaining: -5, used: 25, total: 20, generated: 20, carried: 0, adjusted: 2, expired: 0, hasApprovedAdjust: true },
  { id: 3, name: '김인재', position: '차장', dept: '경영', hireDate: '2015-02-09', retireDate: '', years: 11, period: '2026-02-09 ~ 2027-02-08', remaining: 0, used: 18, total: 18, generated: 20, carried: -2, adjusted: 0, expired: 0, hasApprovedAdjust: false },
  { id: 4, name: '박지현', position: '과장', dept: '경영', hireDate: '2020-05-24', retireDate: '', years: 5, period: '2025-05-24 ~ 2026-05-23', remaining: 13, used: 4, total: 17, generated: 17, carried: 0, adjusted: 1, expired: 0, hasApprovedAdjust: true },
  { id: 5, name: '이수진', position: '대리', dept: '경영', hireDate: '2023-12-31', retireDate: '', years: 2, period: '2025-12-31 ~ 2026-12-30', remaining: 15, used: 0, total: 15, generated: 15, carried: 0, adjusted: 0, expired: 0, hasApprovedAdjust: false },
  { id: 6, name: '박서준', position: '팀장', dept: '개발', hireDate: '2022-05-26', retireDate: '', years: 3, period: '2025-05-26 ~ 2026-05-25', remaining: 16, used: 0, total: 16, generated: 16, carried: 0, adjusted: 0, expired: 0, hasApprovedAdjust: false },
  { id: 7, name: '이민호', position: '과장', dept: '개발', hireDate: '2020-01-19', retireDate: '', years: 6, period: '2026-01-19 ~ 2027-01-18', remaining: 16, used: 1, total: 17, generated: 17, carried: 0, adjusted: 0, expired: 0, hasApprovedAdjust: false },
  { id: 8, name: '최예린', position: '대리', dept: '개발', hireDate: '2023-12-31', retireDate: '', years: 2, period: '2025-12-31 ~ 2026-12-30', remaining: 15, used: 0, total: 15, generated: 15, carried: 0, adjusted: 0, expired: 0, hasApprovedAdjust: false },
  { id: 9, name: '한도윤', position: '사원', dept: '개발', hireDate: '2025-05-30', retireDate: '', years: 0, period: '2026-01-01 ~ 2026-12-31', remaining: 9, used: 0, total: 9, generated: 2, carried: 0, adjusted: 0, expired: 0, hasApprovedAdjust: false },
  { id: 10, name: '송미래', position: '팀장', dept: '인사', hireDate: '2017-01-02', retireDate: '', years: 9, period: '2026-01-02 ~ 2027-01-01', remaining: 0, used: 0, total: 0, generated: 0, carried: 0, adjusted: 0, expired: 0, hasApprovedAdjust: false },
  { id: 11, name: '윤서연', position: '과장', dept: '인사', hireDate: '2020-06-01', retireDate: '', years: 5, period: '2025-06-01 ~ 2026-05-31', remaining: 11, used: 6, total: 17, generated: 17, carried: 0, adjusted: 0, expired: 0, hasApprovedAdjust: false },
]

const HR_VACATION_MOCK = [
  { id: 1, name: '권시정', dept: '경영', leaveType: '보상휴가', dayOption: '종일', startDate: '2026-04-10', endDate: '2026-04-10', days: 1, status: '승인대기', appliedAt: '2026-03-28', isLegal: false },
  { id: 2, name: '박지현', dept: '경영', leaveType: '출산휴가', dayOption: '종일', startDate: '2026-04-14', endDate: '2026-07-12', days: 90, status: '승인대기', appliedAt: '2026-03-29', isLegal: true },
  { id: 3, name: '이민호', dept: '개발', leaveType: '배우자출산휴가', dayOption: '종일', startDate: '2026-04-15', endDate: '2026-04-16', days: 2, status: '승인대기', appliedAt: '2026-03-30', isLegal: true },
  { id: 4, name: '강희계', dept: '경영', leaveType: '보상휴가', dayOption: '종일', startDate: '2026-04-11', endDate: '2026-04-11', days: 1, status: '승인완료', appliedAt: '2026-03-25', isLegal: false },
  { id: 5, name: '박서준', dept: '개발', leaveType: '가족돌봄휴가', dayOption: '반차(오전)', startDate: '2026-04-07', endDate: '2026-04-07', days: 0.5, status: '승인완료', appliedAt: '2026-03-20', isLegal: true },
  { id: 6, name: '이수진', dept: '경영', leaveType: '출산휴가(다태아)', dayOption: '종일', startDate: '2026-04-20', endDate: '2026-08-17', days: 120, status: '승인대기', appliedAt: '2026-03-31', isLegal: true },
  { id: 7, name: '김인재', dept: '경영', leaveType: '연차', dayOption: '종일', startDate: '2026-04-03', endDate: '2026-04-03', days: 1, status: '승인완료', appliedAt: '2026-03-28', isLegal: false },
  { id: 8, name: '윤서연', dept: '인사', leaveType: '연차', dayOption: '반차(오후)', startDate: '2026-04-08', endDate: '2026-04-08', days: 0.5, status: '승인완료', appliedAt: '2026-03-27', isLegal: false },
]

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

  // 날짜 범위로 휴가자 필터링
  const rangeFilteredVacation = HR_VACATION_MOCK.filter((d) => {
    if (innerTab === '휴가 결재') return true
    return d.startDate <= rangeEnd && d.endDate >= rangeStart
  })

  const filteredVacation = (() => {
    let list = rangeFilteredVacation
    if (statusFilter !== '전체') list = list.filter((d) => d.status === statusFilter)
    if (search) list = list.filter((d) => d.name.includes(search) || d.dept.includes(search))
    return list
  })()

  const filteredLeave = (() => {
    let list = HR_LEAVE_MOCK
    if (showApprovedAdjustOnly) list = list.filter((d) => d.hasApprovedAdjust)
    if (search) list = list.filter((d) => d.name.includes(search) || d.dept.includes(search))
    return list
  })()

  const approvedAdjustCount = HR_LEAVE_MOCK.filter((d) => d.hasApprovedAdjust).length

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
          {/* 검색 + 연차 조정 버튼 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-300 rounded px-2 py-1.5">
                <i className="fas fa-search text-gray-400 text-[11px] mr-2" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름, 부서로 검색" className="text-[12px] outline-none bg-transparent w-48 placeholder-gray-400" />
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
              <th className="px-2 py-2.5 text-left text-gray-700 font-medium">사원명</th>
              <th className="px-2 py-2.5 text-left text-gray-700 font-medium">부서</th>
              <th className="px-2 py-2.5 text-left text-gray-700 font-medium">입사일</th>
              <th className="px-2 py-2.5 text-right text-gray-700 font-medium">근속</th>
              <th className="px-2 py-2.5 text-center text-gray-700 font-medium">구분</th>
              <th className="px-2 py-2.5 text-left text-gray-700 font-medium">연차 사용기간</th>
              <th className="px-2 py-2.5 text-right text-gray-700 font-medium">잔여</th>
              <th className="px-2 py-2.5 text-right text-gray-700 font-medium">사용</th>
              <th className="px-2 py-2.5 text-right text-gray-700 font-medium">총연차</th>
              <th className="px-2 py-2.5 text-right text-gray-700 font-medium">발생</th>
              <th className="px-2 py-2.5 text-right text-gray-700 font-medium">조정</th>
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
                </tr>
              ))}
            </tbody>
          </table>
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
                  {HR_LEAVE_MOCK
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
                const emp = HR_LEAVE_MOCK.find((d) => String(d.id) === adjustTarget)
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
