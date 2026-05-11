import { useEffect, useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import HrVacationRequestAdminView from './HrVacationRequestAdminView'
import HrVacationGrantModal from './HrVacationGrantModal'
import HrVacationAdjustmentHistoryModal from './HrVacationAdjustmentHistoryModal'
import HrEmployeeVacationDetailModal from './HrEmployeeVacationDetailModal'
import { vacationApi, useDaysLabel as formatDaysLabel, type VacationPromotionNoticeResponse } from '../../../api/vacation'
import { queryKeys } from '../../../lib/queryKeys'
import { SkeletonCards, SkeletonTableRows } from '../../../components/ui/Skeleton'

const STAGE_BADGE: Record<VacationPromotionNoticeResponse['noticeStage'], string> = {
  FIRST: 'bg-blue-50 text-blue-600',
  SECOND: 'bg-purple-50 text-purple-600',
}

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
  const [innerTab, setInnerTab] = useState<'기간별 휴가 현황' | '전사 휴가 현황' | '휴가 결재' | '연차 촉진 이력'>('기간별 휴가 현황')
  const [search, setSearch] = useState('')
  const [perPage, setPerPage] = useState(50)
  const [vacationPage, setVacationPage] = useState(0)  // 기간별 휴가 현황 클라 페이징
  const [leavePage, setLeavePage] = useState(0)         // 전사 휴가 현황 클라 페이징

  // 날짜 범위 (기간별 휴가 현황용)
  const [rangeStart, setRangeStart] = useState('2026-04-01')
  const [rangeEnd, setRangeEnd] = useState('2026-04-30')

  // 연차/휴가 일괄 부여 모달
  const [grantModalOpen, setGrantModalOpen] = useState(false)

  // 사원별 휴가 조정 이력 모달
  const [adjustHistory, setAdjustHistory] = useState<{ empId: number; empName: string } | null>(null)

  // 사원별 휴가 상세 모달 (전체 휴가 보기)
  const [empDetail, setEmpDetail] = useState<LeaveEmployee | null>(null)

  const periodEnabled = innerTab === '기간별 휴가 현황' && !!rangeStart && !!rangeEnd
  const periodQuery = useQuery({
    queryKey: queryKeys.vacation.adminPeriod({ startDate: rangeStart, endDate: rangeEnd }),
    queryFn: () => vacationApi.getAdminPeriodRequests({
      startDate: rangeStart,
      endDate: rangeEnd,
      statuses: ['PENDING', 'APPROVED'],
      page: 0,
      size: 500,
    }),
    enabled: periodEnabled,
  })

  const vacationRecords: VacationRecord[] = periodQuery.data
    ? periodQuery.data.page.content.map((r) => ({
        requestId: r.requestId,
        empId: r.empId,
        name: r.empName,
        dept: r.deptName ?? '',
        vacationTypeName: r.vacationTypeName,
        requestStartAt: r.requestStartAt,
        requestEndAt: r.requestEndAt,
        useDays: r.useDays,
      }))
    : []
  const vacationTotalElements = periodQuery.data?.page.totalElements ?? 0
  const vacationUniqueEmpCount = periodQuery.data?.uniqueEmployeeCount ?? 0
  const vacationTotalUseDays = periodQuery.data?.totalUseDays ?? 0
  const vacationLoading = periodQuery.isPending && periodEnabled
  const vacationError = periodQuery.isError
    ? ((periodQuery.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '기간별 휴가 현황을 불러오지 못했습니다.')
    : null

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

  const deptEnabled = innerTab === '전사 휴가 현황'
  const deptSummaryQuery = useQuery({
    queryKey: queryKeys.vacation.dashboardDepartments(yearFilter),
    queryFn: () => vacationApi.getDashboardDepartments({ year: yearFilter, lowUsageThreshold: 30 }),
    enabled: deptEnabled,
  })

  const deptIds = deptSummaryQuery.data?.map((s) => s.deptId) ?? []
  const memberQueries = useQueries({
    queries: deptIds.map((deptId) => ({
      queryKey: queryKeys.vacation.dashboardMembers(deptId, yearFilter),
      queryFn: () => vacationApi.getDashboardDepartmentMembers({ deptId, year: yearFilter, size: 500 }),
      enabled: deptEnabled,
    })),
  })

  const deptLeaveSummary: DeptLeaveSummary[] = (deptSummaryQuery.data ?? []).map((s) => ({
    dept: s.deptName,
    count: s.memberCount,
    totalLeave: s.totalDays,
    usedLeave: s.usedDays,
    avgPercent: s.avgUsageRate,
    lowUsage: s.lowUsageCount,
  }))

  const memberQueriesPending = memberQueries.some((q) => q.isPending && q.fetchStatus !== 'idle')
  const leaveEmployees: LeaveEmployee[] = memberQueries
    .flatMap((q) => q.data?.content ?? [])
    .map((m) => ({
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
    }))

  const deptLoading = deptEnabled && (deptSummaryQuery.isPending || memberQueriesPending)
  const deptError = deptSummaryQuery.isError
    ? ((deptSummaryQuery.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '전사 휴가 현황을 불러오지 못했습니다.')
    : null

  // 연차 촉진 이력
  const [noticeYear, setNoticeYear] = useState<number>(new Date().getFullYear())
  const [noticePage, setNoticePage] = useState(0)

  const noticesEnabled = innerTab === '연차 촉진 이력'
  const noticesQuery = useQuery({
    queryKey: queryKeys.vacation.promotionNotices({ year: noticeYear, page: noticePage, size: 20 }),
    queryFn: () => vacationApi.getAdminPromotionNotices({ year: noticeYear, page: noticePage, size: 20 }),
    enabled: noticesEnabled,
  })
  const notices: VacationPromotionNoticeResponse[] = noticesQuery.data?.content ?? []
  const noticesLoading = noticesEnabled && noticesQuery.isPending
  const noticeTotalPages = noticesQuery.data?.totalPages ?? 0
  const noticeTotal = noticesQuery.data?.totalElements ?? 0

  const firstCount = notices.filter((n) => n.noticeStage === 'FIRST').length
  const secondCount = notices.filter((n) => n.noticeStage === 'SECOND').length

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }
  const sortIcon = (key: typeof sortKey) => {
    if (sortKey !== key) return <i className="fas fa-sort text-[8px] text-gray-300 ml-1" />
    return sortAsc
      ? <i className="fas fa-sort-up text-[8px] text-gray-700 ml-1" />
      : <i className="fas fa-sort-down text-[8px] text-gray-700 ml-1" />
  }

  const filteredVacation = (() => {
    let list = vacationRecords
    if (search) list = list.filter((d) => d.name.includes(search) || d.dept.includes(search) || d.vacationTypeName.includes(search))
    return list
  })()

  const filteredLeave = (() => {
    let list = leaveEmployees
    if (deptFilter !== '전체') list = list.filter((d) => d.dept === deptFilter)
    if (lowUsageOnly) list = list.filter((d) => d.usedPercent < 30)
    if (search) list = list.filter((d) => d.name.includes(search) || d.dept.includes(search))
    return list.sort((a, b) => {
      const mul = sortAsc ? 1 : -1
      if (sortKey === 'name') return mul * a.name.localeCompare(b.name)
      return mul * (a[sortKey] - b[sortKey])
    })
  })()

  const vacationTotalPages = Math.max(1, Math.ceil(filteredVacation.length / perPage))
  const leaveTotalPages = Math.max(1, Math.ceil(filteredLeave.length / perPage))
  const vacationPageSafe = Math.min(vacationPage, vacationTotalPages - 1)
  const leavePageSafe = Math.min(leavePage, leaveTotalPages - 1)
  const pagedVacation = filteredVacation.slice(vacationPageSafe * perPage, (vacationPageSafe + 1) * perPage)
  const pagedLeave = filteredLeave.slice(leavePageSafe * perPage, (leavePageSafe + 1) * perPage)

  // 필터/검색/페이지크기 변경 시 페이지 리셋
  useEffect(() => { setVacationPage(0) }, [search, perPage, rangeStart, rangeEnd])
  useEffect(() => { setLeavePage(0) }, [search, perPage, deptFilter, lowUsageOnly, sortKey, sortAsc, yearFilter])

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 mb-4">전사 휴가 관리</h1>

      {/* 탭 */}
      <div className="flex items-center gap-2 mb-4">
        {(['기간별 휴가 현황', '전사 휴가 현황', '휴가 결재', '연차 촉진 이력'] as const).map((t) => (
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
              {vacationLoading ? (
                <SkeletonTableRows rows={6} cols={6} />
              ) : (
                pagedVacation.map((d) => {
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
                })
              )}
            </tbody>
          </table>
          {!vacationLoading && vacationError && (
            <div className="text-center py-12 text-[13px] text-red-500">{vacationError}</div>
          )}
          {!vacationLoading && !vacationError && filteredVacation.length === 0 && (
            <div className="text-center py-12 text-[13px] text-gray-400">해당 기간에 휴가자가 없습니다</div>
          )}

          {/* 페이지네이션 */}
          {!vacationLoading && !vacationError && vacationTotalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-[12px] text-gray-500">전체 {filteredVacation.length}건</div>
              <div className="flex items-center gap-1">
                <button
                  disabled={vacationPageSafe === 0}
                  onClick={() => setVacationPage(Math.max(0, vacationPageSafe - 1))}
                  className="px-2 py-1 text-[12px] text-gray-600 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
                ><i className="fas fa-chevron-left" /></button>
                <span className="text-[12px] text-gray-600 px-2">{vacationPageSafe + 1} / {vacationTotalPages}</span>
                <button
                  disabled={vacationPageSafe + 1 >= vacationTotalPages}
                  onClick={() => setVacationPage(Math.min(vacationTotalPages - 1, vacationPageSafe + 1))}
                  className="px-2 py-1 text-[12px] text-gray-600 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
                ><i className="fas fa-chevron-right" /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ 전사 휴가 현황 ═══ */}
      {innerTab === '전사 휴가 현황' && (
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
          {deptLoading && deptLeaveSummary.length === 0 && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <SkeletonCards count={4} />
            </div>
          )}
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

          {/* 부서 필터 (부서 수가 많아도 줄바꿈으로 안정적으로 표시) */}
          <div className="flex flex-wrap gap-1 mb-3">
            {['전체', ...deptLeaveSummary.map((s) => s.dept)].map((d) => (
              <button key={d} onClick={() => setDeptFilter(d)}
                className={`px-3 py-1.5 text-[12px] rounded-lg transition-colors ${deptFilter === d ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {d}
              </button>
            ))}
          </div>

          {/* 검색 + 연차 조정 */}
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-1.5 text-[12px] text-gray-600 cursor-pointer">
                <input type="checkbox" checked={lowUsageOnly} onChange={(e) => setLowUsageOnly(e.target.checked)} className="accent-[#1D9E75]" />
                소진율 30% 미만만
              </label>
              <div className="flex items-center border border-gray-300 rounded px-2 py-1.5">
                <i className="fas fa-search text-gray-400 text-[11px] mr-2" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름, 부서로 검색" className="text-[12px] outline-none bg-transparent w-40 placeholder-gray-400" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setGrantModalOpen(true)}
                className="px-3 py-1.5 text-[12px] bg-[#1D9E75] text-white rounded-lg hover:bg-[#178a65] transition-colors whitespace-nowrap">
                휴가 조정
              </button>
              <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none">
                {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          {/* 연차 테이블 */}
          <table className="w-full text-[12px]" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '13%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '5%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '14%' }} />
            </colgroup>
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
              {deptLoading && leaveEmployees.length === 0 ? (
                <SkeletonTableRows rows={8} cols={12} />
              ) : (
              pagedLeave.map((d) => (
                <tr key={d.id}
                  onClick={() => setEmpDetail(d)}
                  className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${d.hasApprovedAdjust ? 'bg-[#E1F5EE]/30' : ''}`}>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] text-gray-500 shrink-0"><i className="fas fa-user" /></div>
                      <span className="text-gray-800 font-medium hover:text-[#1D9E75]">{d.name} {d.position}</span>
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
                      onClick={(e) => { e.stopPropagation(); setAdjustHistory({ empId: d.id, empName: d.name }) }}
                      className="hover:underline"
                      title="조정 이력 보기">
                      {d.adjusted !== 0 ? `${d.adjusted > 0 ? '+' : ''}${d.adjusted}d` : '-'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${d.usedPercent >= 80 ? 'bg-[#1D9E75]' : d.usedPercent < 30 ? 'bg-orange-400' : 'bg-blue-400'}`}
                          style={{ width: `${Math.min(d.usedPercent, 100)}%` }} />
                      </div>
                      <span className={`text-[11px] w-10 text-right ${d.usedPercent >= 80 ? 'text-[#1D9E75] font-semibold' : d.usedPercent < 30 ? 'text-orange-500 font-semibold' : 'text-gray-800'}`}>
                        {d.usedPercent}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>

          {!deptLoading && deptError && (
            <div className="text-center py-12 text-[13px] text-red-500">{deptError}</div>
          )}
          {!deptLoading && !deptError && filteredLeave.length === 0 && (
            <div className="text-center py-12 text-[13px] text-gray-400">검색 결과가 없습니다</div>
          )}

          {/* 페이지네이션 */}
          {!deptLoading && !deptError && leaveTotalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-[12px] text-gray-500">전체 {filteredLeave.length}명</div>
              <div className="flex items-center gap-1">
                <button
                  disabled={leavePageSafe === 0}
                  onClick={() => setLeavePage(Math.max(0, leavePageSafe - 1))}
                  className="px-2 py-1 text-[12px] text-gray-600 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
                ><i className="fas fa-chevron-left" /></button>
                <span className="text-[12px] text-gray-600 px-2">{leavePageSafe + 1} / {leaveTotalPages}</span>
                <button
                  disabled={leavePageSafe + 1 >= leaveTotalPages}
                  onClick={() => setLeavePage(Math.min(leaveTotalPages - 1, leavePageSafe + 1))}
                  className="px-2 py-1 text-[12px] text-gray-600 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
                ><i className="fas fa-chevron-right" /></button>
              </div>
            </div>
          )}

          {/* 범례 */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
            <span className="text-[11px] text-gray-400">범례:</span>
            <span className="flex items-center gap-1.5 text-[11px]"><span className="w-2.5 h-2.5 rounded-full bg-orange-400" /> 소진율 30% 미만 (사용 촉진 권장)</span>
            <span className="flex items-center gap-1.5 text-[11px]"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> 소진율 30~80%</span>
            <span className="flex items-center gap-1.5 text-[11px]"><span className="w-2.5 h-2.5 rounded-full bg-[#1D9E75]" /> 소진율 80% 이상 (양호)</span>
          </div>
        </div>
      )}

      {/* ═══ 휴가 결재 ═══ */}
      {innerTab === '휴가 결재' && <HrVacationRequestAdminView />}

      {/* ═══ 연차 촉진 이력 ═══ */}
      {innerTab === '연차 촉진 이력' && (
        <div>
          {/* 필터 + 요약 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-gray-600">연도</span>
              <input type="number" value={noticeYear}
                onChange={(e) => { setNoticeYear(Number(e.target.value)); setNoticePage(0) }}
                className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none w-24 focus:border-[#1D9E75]" />
            </div>
            <div className="text-[11px] text-gray-400">총 {noticeTotal}건</div>
          </div>

          {/* 요약 카드 */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="border border-gray-200 rounded-xl p-4 bg-white">
              <p className="text-[11px] text-gray-400 mb-1">1차 통지</p>
              <p className="text-[22px] font-bold text-blue-600">{firstCount}건</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 bg-white">
              <p className="text-[11px] text-gray-400 mb-1">2차 통지</p>
              <p className="text-[22px] font-bold text-purple-600">{secondCount}건</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 bg-white">
              <p className="text-[11px] text-gray-400 mb-1">전체 통지</p>
              <p className="text-[22px] font-bold text-[#1D9E75]">{firstCount + secondCount}건</p>
            </div>
          </div>

          {noticesLoading ? (
            <table className="w-full text-[12px]">
              <thead><tr className="border-b-2 border-gray-900">
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사원 ID</th>
                <th className="px-3 py-2.5 text-center text-gray-700 font-medium">연도</th>
                <th className="px-3 py-2.5 text-center text-gray-700 font-medium">대상 잔여</th>
                <th className="px-3 py-2.5 text-center text-gray-700 font-medium">단계</th>
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">통지 발송일</th>
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">응답</th>
                <th className="px-3 py-2.5 text-right text-gray-700 font-medium">사용 예정일수</th>
                <th className="px-3 py-2.5 text-left text-gray-700 font-medium">응답일</th>
              </tr></thead>
              <tbody>
                <SkeletonTableRows rows={6} cols={8} />
              </tbody>
            </table>
          ) : (
            <>
              {/* 이력 테이블 */}
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b-2 border-gray-900">
                    <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사원 ID</th>
                    <th className="px-3 py-2.5 text-center text-gray-700 font-medium">연도</th>
                    <th className="px-3 py-2.5 text-center text-gray-700 font-medium">대상 잔여</th>
                    <th className="px-3 py-2.5 text-center text-gray-700 font-medium">단계</th>
                    <th className="px-3 py-2.5 text-left text-gray-700 font-medium">통지 발송일</th>
                    <th className="px-3 py-2.5 text-left text-gray-700 font-medium">응답</th>
                    <th className="px-3 py-2.5 text-right text-gray-700 font-medium">사용 예정일수</th>
                    <th className="px-3 py-2.5 text-left text-gray-700 font-medium">응답일</th>
                  </tr>
                </thead>
                <tbody>
                  {notices.map((n) => (
                    <tr key={n.noticeId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 text-gray-800 font-medium">#{n.empId}</td>
                      <td className="px-3 py-2.5 text-center text-gray-600">{n.noticeYear}</td>
                      <td className="px-3 py-2.5 text-center text-gray-800">{n.targetRemainingDays}일</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STAGE_BADGE[n.noticeStage]}`}>
                          {n.noticeStage === 'FIRST' ? '1차' : '2차'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 text-[11px]">{n.noticeSentAt.slice(0, 10)}</td>
                      <td className="px-3 py-2.5 text-gray-600 text-[11px] max-w-[200px] truncate" title={n.employeeResponse ?? ''}>
                        {n.employeeResponse ?? <span className="text-gray-300">미응답</span>}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-700">
                        {n.responseUsedDays !== null ? `${n.responseUsedDays}일` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 text-[11px]">
                        {n.responseRecordedAt ? n.responseRecordedAt.slice(0, 10) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {notices.length === 0 && (
                <div className="text-center py-12 text-[13px] text-gray-400">해당 연도에 통지 이력이 없습니다</div>
              )}

              {/* 페이지네이션 */}
              {noticeTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button onClick={() => setNoticePage(Math.max(0, noticePage - 1))} disabled={noticePage === 0}
                    className="px-3 py-1 text-[12px] border border-gray-300 rounded disabled:opacity-30">이전</button>
                  <span className="text-[12px] text-gray-500">{noticePage + 1} / {noticeTotalPages}</span>
                  <button onClick={() => setNoticePage(Math.min(noticeTotalPages - 1, noticePage + 1))} disabled={noticePage >= noticeTotalPages - 1}
                    className="px-3 py-1 text-[12px] border border-gray-300 rounded disabled:opacity-30">다음</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

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

      {/* ═══ 사원별 전체 휴가 상세 모달 ═══ */}
      <HrEmployeeVacationDetailModal
        open={empDetail !== null}
        onClose={() => setEmpDetail(null)}
        employee={empDetail}
        year={yearFilter}
      />
    </div>
  )
}
