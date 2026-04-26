import { useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchWorkforceSummary,
  fetchWorkforceByDept,
  fetchWorkforceTrend,
  fetchExpiringContracts,
  type WorkforceSummaryDto,
  type DeptWorkforceDto,
  type MonthlyTrendDto,
  type ExpiringContractDto,
} from '../../api/hrStatus'

export default function WorkforceStatus() {
  const [selectedDept, setSelectedDept] = useState('')
  const [contractsExpanded, setContractsExpanded] = useState(false)
  const monthlyScrollRef = useRef<HTMLDivElement>(null)
  const [monthColWidth, setMonthColWidth] = useState(64)
  const scrollMonthly = (cols: number) =>
    monthlyScrollRef.current?.scrollBy({ left: cols * (monthColWidth + 16), behavior: 'smooth' })

  const [summary, setSummary] = useState<WorkforceSummaryDto | null>(null)
  const [deptData, setDeptData] = useState<DeptWorkforceDto[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyTrendDto[]>([])
  const [expiringContracts, setExpiringContracts] = useState<ExpiringContractDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const [s, d, t, e] = await Promise.all([
          fetchWorkforceSummary(),
          fetchWorkforceByDept(),
          fetchWorkforceTrend(),
          fetchExpiringContracts(),
        ])
        if (cancelled) return
        setSummary(s)
        setDeptData(d)
        setMonthlyData(t)
        setExpiringContracts(e)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '데이터 조회 실패')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // 부서 필터링 후 집합
  const filteredDepts = useMemo(
    () => deptData.filter(d => !selectedDept || d.deptName === selectedDept),
    [deptData, selectedDept],
  )

  const maxDeptSize = useMemo(
    () => (deptData.length ? Math.max(...deptData.map(d => d.total)) : 1),
    [deptData],
  )

  // 직급 컬럼: 전체 데이터에서 등장한 gradeName을 모아서 동적 생성
  const gradeColumns = useMemo(() => {
    const set = new Set<string>()
    deptData.forEach(d => d.gradeCounts.forEach(g => set.add(g.gradeName)))
    return Array.from(set)
  }, [deptData])

  const gradeCountOf = (dept: DeptWorkforceDto, gradeName: string) =>
    dept.gradeCounts.find(g => g.gradeName === gradeName)?.count ?? 0

  // 월별 막대차트 정규화용 최댓값
  const maxMonthly = useMemo(() => {
    const all = monthlyData.flatMap(m => [m.hired, m.resigned])
    return all.length ? Math.max(...all, 1) : 1
  }, [monthlyData])

  const latestMonthly = monthlyData[monthlyData.length - 1]

  // 컨테이너 너비를 측정해서 6개월이 화면에 꽉 차도록 컬럼 폭 계산
  useEffect(() => {
    const el = monthlyScrollRef.current
    if (!el) return
    const update = () => {
      const visible = el.clientWidth
      const gap = 16
      const cols = 6
      const w = (visible - gap * (cols - 1)) / cols
      setMonthColWidth(Math.max(40, Math.floor(w)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 데이터 로드 후 최신 월이 보이도록 끝으로 스크롤
  useEffect(() => {
    if (!monthlyData.length) return
    const el = monthlyScrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [monthlyData])

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">불러오는 중…</div>
  }
  if (error) {
    return <div className="flex-1 flex items-center justify-center text-red-500 text-sm">{error}</div>
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › <span className="text-[#1D9E75] font-medium">인력 현황</span>
      </div>

      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">인력 현황</h1>
        <p className="text-xs text-gray-400 mt-1">부서별 인원, 입퇴사 추이, 계약 만료 예정자를 한눈에 확인합니다. (emp-7, emp-8, emp-11)</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">전체 재직 인원</div>
          <div className="text-2xl font-bold text-gray-900">
            {summary?.total ?? 0}
            <span className="text-sm font-normal text-gray-400 ml-1">명</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">이번 달 입사</div>
          <div className="text-2xl font-bold text-[#1D9E75]">
            {summary?.hiredThisMonth ?? latestMonthly?.hired ?? 0}
            <span className="text-sm font-normal text-gray-400 ml-1">명</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">이번 달 퇴사</div>
          <div className="text-2xl font-bold text-red-400">
            {summary?.resignedThisMonth ?? latestMonthly?.resigned ?? 0}
            <span className="text-sm font-normal text-gray-400 ml-1">명</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-400 mb-1">계약 만료 예정</div>
          <div className="text-2xl font-bold text-yellow-500">
            {summary?.contractExpiring ?? expiringContracts.length}
            <span className="text-sm font-normal text-gray-400 ml-1">명</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* 부서별 인원 현황 */}
        <div className="col-span-8">
          <div className="card p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">부서별 인원 현황</h3>
              <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 outline-none">
                <option value="">전체 부서</option>
                {deptData.map(d => <option key={d.deptName} value={d.deptName}>{d.deptName}</option>)}
              </select>
            </div>
            {/* Bar Chart */}
            <div className="space-y-3 mb-5">
              {filteredDepts.map(d => (
                <div key={d.deptName} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 text-right shrink-0">{d.deptName}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div className="bg-[#1D9E75] h-full rounded-full flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${(d.total / maxDeptSize) * 100}%` }}>
                      <span className="text-xs text-white font-medium">{d.total}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 w-24">
                    평균 {d.avgYears}년 {d.avgMonths}개월
                  </span>
                </div>
              ))}
            </div>

            {/* Detail Table */}
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 font-medium text-gray-500">부서</th>
                  {gradeColumns.map(g => (
                    <th key={g} className="text-center py-2 font-medium text-gray-500">{g}</th>
                  ))}
                  <th className="text-center py-2 font-medium text-gray-500">합계</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepts.map(d => (
                  <tr key={d.deptName} className="border-b border-gray-50">
                    <td className="py-2 font-medium text-gray-700">{d.deptName}</td>
                    {gradeColumns.map(g => (
                      <td key={g} className="py-2 text-center text-gray-600">{gradeCountOf(d, g)}</td>
                    ))}
                    <td className="py-2 text-center font-semibold text-gray-900">{d.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 월별 입퇴사 추이 */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">월별 인력 변동 추이</h3>
            <div className="relative">
              <button
                onClick={() => scrollMonthly(-3)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm text-gray-600 hover:border-[#1D9E75] hover:text-[#1D9E75] flex items-center justify-center transition-colors"
                aria-label="이전 월"
              >
                <i className="fa-solid fa-chevron-left text-[12px]" />
              </button>
              <button
                onClick={() => scrollMonthly(3)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm text-gray-600 hover:border-[#1D9E75] hover:text-[#1D9E75] flex items-center justify-center transition-colors"
                aria-label="다음 월"
              >
                <i className="fa-solid fa-chevron-right text-[12px]" />
              </button>
              <div className="pointer-events-none absolute left-8 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10" />
              <div className="pointer-events-none absolute right-8 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10" />

              <div
                ref={monthlyScrollRef}
                className="overflow-x-auto hide-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
                <div className="flex items-end gap-4 h-40 min-w-min">
                  {monthlyData.map(m => {
                    const barWidth = Math.max(12, Math.min(40, Math.floor((monthColWidth - 6) / 2)))
                    return (
                      <div
                        key={m.month}
                        className="shrink-0 flex flex-col items-center gap-1"
                        style={{ width: `${monthColWidth}px` }}
                      >
                        <div className="flex items-end gap-1.5 h-28 w-full justify-center">
                          <div
                            className="bg-[#1D9E75] rounded-t-sm transition-all"
                            style={{ width: `${barWidth}px`, height: `${(m.hired / maxMonthly) * 100}%` }}
                            title={`입사 ${m.hired}명`}
                          />
                          <div
                            className="bg-red-300 rounded-t-sm transition-all"
                            style={{ width: `${barWidth}px`, height: `${(m.resigned / maxMonthly) * 100}%` }}
                            title={`퇴사 ${m.resigned}명`}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">{m.month.split('-')[1]}월</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-[#1D9E75] rounded-sm"></div>
                <span className="text-xs text-gray-500">입사</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-red-300 rounded-sm"></div>
                <span className="text-xs text-gray-500">퇴사</span>
              </div>
            </div>
          </div>
        </div>

        {/* 계약 만료 예정자 */}
        <div className="col-span-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">계약 만료 예정자</h3>
              <span className="text-xs px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-full font-medium">{expiringContracts.length}명</span>
            </div>
            <div className="relative">
              <div
                className={`space-y-3 transition-all ${
                  contractsExpanded ? 'max-h-[420px] overflow-y-auto pr-1' : 'max-h-[420px] overflow-hidden'
                }`}
              >
                {expiringContracts.map(emp => (
                  <div key={emp.empNum} className="p-3 border border-gray-100 rounded-lg hover:border-[#1D9E75] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{emp.empName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        emp.daysLeft <= 30 ? 'bg-red-50 text-red-500' : 'bg-yellow-50 text-yellow-600'
                      }`}>
                        D-{emp.daysLeft}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">부서</span>
                        <span className="text-gray-600">{emp.deptName}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">고용형태</span>
                        <span className="text-gray-600">{emp.empType}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">만료일</span>
                        <span className="text-gray-600">{emp.expiryDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 그라데이션 + 더보기 (3명 초과 + 접힌 상태일 때만) */}
              {expiringContracts.length > 3 && !contractsExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/90 to-transparent flex items-end justify-center pb-2 pointer-events-none">
                  <button
                    onClick={() => setContractsExpanded(true)}
                    className="pointer-events-auto text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors shadow-sm"
                  >
                    더보기 ({expiringContracts.length - 3}명) <i className="fas fa-chevron-down ml-1 text-[10px]"></i>
                  </button>
                </div>
              )}
            </div>

            {/* 접기 버튼 (펼쳐진 상태일 때) */}
            {expiringContracts.length > 3 && contractsExpanded && (
              <button
                onClick={() => setContractsExpanded(false)}
                className="mt-3 w-full text-xs py-1.5 text-gray-500 hover:text-[#1D9E75] transition-colors"
              >
                접기 <i className="fas fa-chevron-up ml-1 text-[10px]"></i>
              </button>
            )}

            <div className="mt-4 text-[11px] text-gray-400">
              <i className="fas fa-info-circle mr-1"></i>
              만료 30일 기준입니다
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
