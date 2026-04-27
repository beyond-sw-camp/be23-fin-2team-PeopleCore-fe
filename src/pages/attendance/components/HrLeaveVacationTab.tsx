import { useEffect, useState } from 'react'
import HrVacationRequestAdminView from './HrVacationRequestAdminView'
import HrVacationGrantModal from './HrVacationGrantModal'
import HrVacationAdjustmentHistoryModal from './HrVacationAdjustmentHistoryModal'
import { vacationApi, useDaysLabel as formatDaysLabel } from '../../../api/vacation'

/* ══════════════════════════════════════
   타입
   ══════════════════════════════════════ */
interface LeaveEmployee {
  id: number; name: string; position: string; dept: string; hireDate: string; years: number
  period: string; remaining: number; remainingLegal: number; remainingSpecial: number
  used: number; total: number; generated: number; adjusted: number; hasApprovedAdjust: boolean
  usedPercent: number
}

interface DeptLeaveSummary {
  dept: string; count: number; totalLeave: number; usedLeave: number; avgPercent: number; lowUsage: number
}

interface VacationRecord {
  requestId: number
  empId: number
  name: string
  dept: string
  vacationTypeName: string
  requestStartAt: string
  requestEndAt: string
  useDays: number
}

/* ══════════════════════════════════════
   전사 휴가 관리 탭
   ══════════════════════════════════════ */
export default function HrLeaveVacationTab() {
  const [innerTab, setInnerTab] = useState<'기간별 휴가 현황' | '부서별 휴가 현황' | '휴가 결재'>('기간별 휴가 현황')
  const [search, setSearch] = useState('')
  const [perPage, setPerPage] = useState(50)

  // 날짜 범위 (기간별 휴가 현황용)
  const [rangeStart, setRangeStart] = useState('2026-04-01')
  const [rangeEnd, setRangeEnd] = useState('2026-04-30')

  // 연차 조정 승인 건 필터
  const [showApprovedAdjustOnly, setShowApprovedAdjustOnly] = useState(false)

  // 연차/휴가 일괄 부여 모달
  const [grantModalOpen, setGrantModalOpen] = useState(false)

  // 사원별 휴가 조정 이력 모달
  const [adjustHistory, setAdjustHistory] = useState<{ empId: number; empName: string } | null>(null)

  const [vacationRecords, setVacationRecords] = useState<VacationRecord[]>([])
  const [vacationTotalElements, setVacationTotalElements] = useState(0)
  const [vacationUniqueEmpCount, setVacationUniqueEmpCount] = useState(0)
  const [vacationTotalUseDays, setVacationTotalUseDays] = useState(0)
  const [vacationLoading, setVacationLoading] = useState(false)
  const [vacationError, setVacationError] = useState<string | null>(null)

  useEffect(() => {
    if (innerTab !== '기간별 휴가 현황') return
    if (!rangeStart || !rangeEnd) return
    let ignore = false
    setVacationLoading(true)
    setVacationError(null)
    vacationApi.getAdminPeriodRequests({
      startDate: rangeStart,
      endDate: rangeEnd,
      statuses: ['PENDING', 'APPROVED'],
      page: 0,
      size: 500,
    })
      .then((res) => {
        if (ignore) return
        setVacationRecords(res.page.content.map((r) => ({
          requestId: r.requestId,
          empId: r.empId,
          name: r.empName,
          dept: r.deptName ?? '',
          vacationTypeName: r.vacationTypeName,
          requestStartAt: r.requestStartAt,
          requestEndAt: r.requestEndAt,
          useDays: r.useDays,
        })))
        setVacationTotalElements(res.page.totalElements)
        setVacationUniqueEmpCount(res.uniqueEmployeeCount)
        setVacationTotalUseDays(res.totalUseDays)
      })
      .catch((e) => {
        if (ignore) return
        setVacationError(e?.response?.data?.message ?? '기간별 휴가 현황을 불러오지 못했습니다.')
        setVacationRecords([])
        setVacationTotalElements(0)
        setVacationUniqueEmpCount(0)
        setVacationTotalUseDays(0)
      })
      .finally(() => { if (!ignore) setVacationLoading(false) })
    return () => { ignore = true }
  }, [innerTab, rangeStart, rangeEnd])

  const [leaveEmployees, setLeaveEmployees] = useState<LeaveEmployee[]>([])
  const [deptLeaveSummary, setDeptLeaveSummary] = useState<DeptLeaveSummary[]>([])
  const [deptLoading, setDeptLoading] = useState(false)
  const [deptError, setDeptError] = useState<string | null>(null)

  // 전사 연차 현황 필터/정렬
  const [deptFilter, setDeptFilter] = useState('전체')
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear())
  const yearOptions = (() => {
    const cur = new Date().getFullYear()
    return [cur - 2, cur - 1, cur, cur + 1]
  })()
  const [lowUsageOnly, setLowUsageOnly] = useState(false)
  const [sortKey, setSortKey] = useState<'usedPercent' | 'remaining' | 'name'>('usedPercent')
  const [sortAsc, setSortAsc] = useState(true)

  useEffect(() => {
    if (innerTab !== '부서별 휴가 현황') return
    let ignore = false
    setDeptLoading(true)
    setDeptError(null)
    vacationApi.getDashboardDepartments({ year: yearFilter, lowUsageThreshold: 30 })
      .then(async (summaries) => {
        if (ignore) return
        setDeptLeaveSummary(summaries.map((s) => ({
          dept: s.deptName,
          count: s.memberCount,
          totalLeave: s.totalDays,
          usedLeave: s.usedDays,
          avgPercent: s.avgUsageRate,
          lowUsage: s.lowUsageCount,
        })))
        const pages = await Promise.all(
          summaries.map((s) =>
            vacationApi.getDashboardDepartmentMembers({ deptId: s.deptId, year: yearFilter, size: 500 }),
          ),
        )
        if (ignore) return
        const members = pages.flatMap((p) => p.content)
        setLeaveEmployees(members.map((m) => ({
          id: m.empId,
          name: m.empName,
          position: m.empGrade,
          dept: m.deptName,
          hireDate: m.empHireDate,
          years: m.serviceYears,
          period: m.periodStart && m.periodEnd ? `${m.periodStart} ~ ${m.periodEnd}` : '-',
          remaining: (m.statutoryAvailable ?? 0) + (m.specialAvailable ?? 0),
          remainingLegal: m.statutoryAvailable,
          remainingSpecial: m.specialAvailable,
          used: m.usedDays,
          total: m.totalDays,
          generated: m.accruedDays,
          adjusted: m.adjustedDays,
          hasApprovedAdjust: m.adjustedDays !== 0,
          usedPercent: m.usageRate,
        })))
      })
      .catch((e) => {
        if (ignore) return
        setDeptError(e?.response?.data?.message ?? '부서별 휴가 현황을 불러오지 못했습니다.')
        setDeptLeaveSummary([])
        setLeaveEmployees([])
      })
      .finally(() => { if (!ignore) setDeptLoading(false) })
    return () => { ignore = true }
  }, [innerTab, yearFilter])

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }
  const sortIcon = (key: typeof sortKey) => sortKey === key ? (sortAsc ? ' ▲' : ' ▼') : ''

  const filteredVacation = (() => {
    let list = vacationRecords
    if (search) list = list.filter((d) => d.name.includes(search) || d.dept.includes(search) || d.vacationTypeName.includes(search))
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
        {(['기간별 휴가 현황', '부서별 휴가 현황', '휴가 결재'] as const).map((t) => (
          <button key={t} onClick={() => { setInnerTab(t); setSearch('') }}
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
              <button onClick={() => (document.getElementById('range-start') as HTMLInputElement | null)?.showPicker?.()} className="text-[18px] font-bold text-gray-900 hover:text-[#1D9E75] transition-colors cursor-pointer">
                {rangeStart}
              </button>
              <input id="range-start" type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)}
                className="absolute inset-0 opacity-0 w-0 h-0" />
            </div>
            <span className="text-[16px] text-gray-400">~</span>
            <div className="relative">
              <button onClick={() => (document.getElementById('range-end') as HTMLInputElement | null)?.showPicker?.()} className="text-[18px] font-bold text-gray-900 hover:text-[#1D9E75] transition-colors cursor-pointer">
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
              <div className="text-[22px] font-bold text-gray-900">{vacationUniqueEmpCount}명</div>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-[11px] text-gray-500 mb-1">총 사용 일수</div>
              <div className="text-[22px] font-bold text-[#1D9E75]">{vacationTotalUseDays}일</div>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-[11px] text-gray-500 mb-1">총 신청 건수</div>
              <div className="text-[22px] font-bold text-blue-600">{vacationTotalElements}건</div>
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
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사용옵션</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">휴가기간</th>
              <th className="px-3 py-2.5 text-right text-gray-700 font-medium">일수</th>
            </tr></thead>
            <tbody>
              {filteredVacation.slice(0, perPage).map((d) => {
                const startDate = d.requestStartAt.slice(0, 10)
                const endDate = d.requestEndAt.slice(0, 10)
                return (
                  <tr key={d.requestId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 shrink-0"><i className="fas fa-user" /></div>
                        <span className="text-gray-800 font-medium">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{d.dept}</td>
                    <td className="px-3 py-2.5 text-gray-700">{d.vacationTypeName}</td>
                    <td className="px-3 py-2.5 text-gray-500">{formatDaysLabel(d.useDays)}</td>
                    <td className="px-3 py-2.5 text-gray-600">{startDate === endDate ? startDate : `${startDate} ~ ${endDate}`}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700 font-semibold">{d.useDays}d</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {vacationLoading && (
            <div className="text-center py-12 text-[13px] text-gray-400">불러오는 중...</div>
          )}
          {!vacationLoading && vacationError && (
            <div className="text-center py-12 text-[13px] text-red-500">{vacationError}</div>
          )}
          {!vacationLoading && !vacationError && filteredVacation.length === 0 && (
            <div className="text-center py-12 text-[13px] text-gray-400">해당 기간에 휴가자가 없습니다</div>
          )}
        </div>
      )}

      {/* ═══ 부서별 휴가 현황 ═══ */}
      {innerTab === '부서별 휴가 현황' && (
        <div>
          {/* 연도 선택 */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <button onClick={() => setYearFilter((y) => y - 1)}
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors">
              <i className="fas fa-chevron-left text-[11px]" />
            </button>
            <select value={yearFilter} onChange={(e) => setYearFilter(Number(e.target.value))}
              className="text-[18px] font-bold text-gray-900 bg-transparent border-none outline-none cursor-pointer hover:text-[#1D9E75] transition-colors">
              {yearOptions.map((y) => <option key={y} value={y}>{y}년</option>)}
            </select>
            <button onClick={() => setYearFilter((y) => y + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors">
              <i className="fas fa-chevron-right text-[11px]" />
            </button>
          </div>

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
              <button onClick={() => setGrantModalOpen(true)}
                className="px-3 py-1.5 text-[12px] bg-[#1D9E75] text-white rounded-lg hover:bg-[#178a65] transition-colors">
                휴가 조정
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
              <th className="px-4 py-2.5 text-right text-gray-700 font-medium cursor-pointer hover:text-[#1D9E75]" onClick={() => handleSort('remaining')}>잔여 법정 연월차{sortIcon('remaining')}</th>
              <th className="px-4 py-2.5 text-right text-gray-700 font-medium">잔여 특별휴가</th>
              <th className="px-4 py-2.5 text-right text-gray-700 font-medium">사용</th>
              <th className="px-4 py-2.5 text-right text-gray-700 font-medium">총연차</th>
              <th className="px-4 py-2.5 text-right text-gray-700 font-medium">발생</th>
              <th className="px-4 py-2.5 text-right text-gray-700 font-medium">조정</th>
              <th className="px-4 py-2.5 text-center text-gray-700 font-medium cursor-pointer hover:text-[#1D9E75]" onClick={() => handleSort('usedPercent')}>소진율{sortIcon('usedPercent')}</th>
            </tr></thead>
            <tbody>
              {filteredLeave.slice(0, perPage).map((d) => (
                <tr key={d.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${d.hasApprovedAdjust ? 'bg-[#E1F5EE]/30' : ''}`}>
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
                  <td className={`px-4 py-3 text-right font-semibold ${d.remainingLegal <= 0 ? 'text-red-500' : 'text-[#1D9E75]'}`}>{d.remainingLegal}d</td>
                  <td className={`px-4 py-3 text-right font-semibold ${d.remainingSpecial <= 0 ? 'text-gray-400' : 'text-blue-600'}`}>{d.remainingSpecial}d</td>
                  <td className="px-4 py-3 text-right text-gray-700">{d.used}d</td>
                  <td className="px-4 py-3 text-right text-gray-700">{d.total}d</td>
                  <td className="px-4 py-3 text-right text-gray-500">{d.generated}d</td>
                  <td className={`px-4 py-3 text-right ${d.adjusted !== 0 ? 'text-[#1D9E75] font-semibold' : 'text-gray-500'}`}>
                    <button
                      type="button"
                      onClick={() => setAdjustHistory({ empId: d.id, empName: d.name })}
                      className="hover:underline"
                      title="조정 이력 보기">
                      {d.adjusted !== 0 ? `${d.adjusted > 0 ? '+' : ''}${d.adjusted}d` : '-'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
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

          {deptLoading && (
            <div className="text-center py-12 text-[13px] text-gray-400">불러오는 중...</div>
          )}
          {!deptLoading && deptError && (
            <div className="text-center py-12 text-[13px] text-red-500">{deptError}</div>
          )}
          {!deptLoading && !deptError && filteredLeave.length === 0 && (
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
      {innerTab === '휴가 결재' && <HrVacationRequestAdminView />}

      {/* ═══ 연차/휴가 일괄 부여 모달 ═══ */}
      <HrVacationGrantModal open={grantModalOpen} onClose={() => setGrantModalOpen(false)} />

      {/* ═══ 사원별 휴가 조정 이력 모달 ═══ */}
      <HrVacationAdjustmentHistoryModal
        open={adjustHistory !== null}
        onClose={() => setAdjustHistory(null)}
        empId={adjustHistory?.empId ?? null}
        empName={adjustHistory?.empName}
        year={yearFilter}
      />
    </div>
  )
}
