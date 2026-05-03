import { useState, useEffect, useCallback } from 'react'
import { severanceApi } from '../../api/payAdmin'
import type { SeveranceEstimateSummaryRes, SeveranceEstimateRowRes } from '../../api/payAdmin'
import Pagination from '../../components/Pagination'

const PAGE_SIZE = 15

function fmt(n: number | null | undefined) { return (n ?? 0).toLocaleString() }

type TypeFilter = '' | 'severance' | 'DB' | 'DC'

const TYPE_LABEL: Record<string, string> = { severance: '퇴직금', DB: 'DB형', DC: 'DC형' }
const TYPE_BADGE: Record<string, string> = {
  severance: 'bg-orange-100 text-orange-700',
  DB: 'bg-purple-100 text-purple-700',
  DC: 'bg-blue-100 text-blue-700',
}

export default function SeveranceEstimate() {
  const [baseDate, setBaseDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('')
  const [summary, setSummary] = useState<SeveranceEstimateSummaryRes | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const fetchEstimate = useCallback(() => {
    setLoading(true)
    severanceApi.estimate(baseDate, typeFilter || undefined)
      .then(setSummary)
      .catch(err => { console.error('퇴직금추계액 조회 실패:', err); setSummary(null) })
      .finally(() => setLoading(false))
  }, [baseDate, typeFilter])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchEstimate() }, [fetchEstimate])

  const employees = summary?.employees || []
  const pagedEmployees = employees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1) }, [summary])

  return (
    <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-[#f9fafb]">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-xs text-gray-400 mb-1">급여관리 &gt; 퇴직급여 &gt; 퇴직금추계액</div>
        <h1 className="text-lg font-bold text-gray-800 mb-1">퇴직금추계액</h1>
        <p className="text-xs text-gray-500 mb-5">재직 중 근속 1년 이상 사원 전원을 대상으로 "오늘 퇴직한다고 가정할 때"의 회사 부담 퇴직금을 추정합니다. 재무제표 퇴직급여충당부채 산정용.</p>

        {/* 필터 */}
        <div className="flex items-center gap-3 mb-5 text-xs flex-wrap">
          <span className="text-gray-500">기준일</span>
          <input type="date" value={baseDate} onChange={e => setBaseDate(e.target.value)} className="border border-gray-200 rounded px-2.5 py-1.5 outline-none" />
          <span className="text-gray-500 ml-3">퇴직유형</span>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as TypeFilter)} className="border border-gray-200 rounded px-2.5 py-1.5 outline-none">
            <option value="">전체</option>
            <option value="severance">퇴직금 (severance)</option>
            <option value="DB">DB형</option>
            <option value="DC">DC형</option>
          </select>
          <button onClick={fetchEstimate} className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50">
            <i className="fas fa-search text-[10px] mr-1" />조회
          </button>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">대상자</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{summary?.totalEmployees ?? 0} <span className="text-sm font-normal">명</span></div>
          </div>
          <div className="bg-white border border-orange-200 rounded-lg p-4 bg-orange-50/30">
            <div className="text-xs text-orange-600">퇴직금(severance)</div>
            <div className="text-sm font-bold text-gray-800 mt-1">{summary?.severanceCount ?? 0}명 · <span className="text-orange-600">{fmt(summary?.severanceAmount)}</span> 원</div>
          </div>
          <div className="bg-white border border-purple-200 rounded-lg p-4 bg-purple-50/30">
            <div className="text-xs text-purple-600">DB형</div>
            <div className="text-sm font-bold text-gray-800 mt-1">{summary?.dbCount ?? 0}명 · <span className="text-purple-600">{fmt(summary?.dbAmount)}</span> 원</div>
          </div>
          <div className="bg-white border border-blue-200 rounded-lg p-4 bg-blue-50/30">
            <div className="text-xs text-blue-600">DC형 차액</div>
            <div className="text-sm font-bold text-gray-800 mt-1">{summary?.dcCount ?? 0}명 · <span className="text-blue-600">{fmt(summary?.dcDiffAmount)}</span> 원</div>
          </div>
        </div>

        {/* 총 추정액 */}
        <div className="bg-[#f0f9f6] border border-[#2e9e6e] rounded-lg px-5 py-4 mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#2e9e6e] font-semibold">총 회사 부담 추정액 (기준일 {summary?.baseDate || baseDate})</div>
            <div className="text-[10px] text-gray-500 mt-0.5">severance + DB 전액 지급분 + DC 차액의 합계</div>
          </div>
          <div className="text-2xl font-bold text-[#2e9e6e]">{fmt(summary?.totalEstimateAmount)} <span className="text-sm font-normal">원</span></div>
        </div>

        {/* 안내 */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-700 space-y-1 mb-4">
          <p className="font-semibold">ℹ️ 산정 기준</p>
          <p>• <strong>대상</strong>: 재직(ACTIVE/ON_LEAVE) 상태이고 기준일 기준 근속 1년 이상인 사원 전원</p>
          <p>• <strong>공식</strong>: 퇴직금 = 1일 평균임금 × 30 × (근속일수 / 365)</p>
          <p>• <strong>DC형</strong>은 "추가 지급 차액" (산정액 − 기적립금)만 회사 부담으로 집계됩니다.</p>
          <p>• 본 조회는 <strong>DB에 저장되지 않는 순수 계산 결과</strong>입니다.</p>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-xs min-w-[1200px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">사원명</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">부서</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">직급</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">입사일</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">근속연수</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">유형</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">1일 평균임금</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">법정 퇴직금</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">DC 기적립</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">DC 차액</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500 bg-[#f0f9f6]">회사부담 추정액</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="py-12 text-center text-gray-400">로딩 중...</td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={11} className="py-12 text-center text-gray-400">조회된 대상자가 없습니다.</td></tr>
              ) : pagedEmployees.map((e: SeveranceEstimateRowRes) => (
                <tr key={e.empId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3 text-gray-800 font-medium">{e.empName}</td>
                  <td className="py-2.5 px-3 text-gray-600">{e.deptName || '-'}</td>
                  <td className="py-2.5 px-3 text-gray-600">{e.gradeName || '-'}</td>
                  <td className="py-2.5 px-3 text-gray-600">{e.hireDate}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700">{Number(e.serviceYears).toFixed(1)}년</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${TYPE_BADGE[e.retirementType] || 'bg-gray-100'}`}>
                      {TYPE_LABEL[e.retirementType] || e.retirementType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-gray-600">{fmt(Math.round(Number(e.avgDailyWage)))}</td>
                  <td className="py-2.5 px-3 text-right text-gray-800">{fmt(e.estimatedSeverance)}</td>
                  <td className="py-2.5 px-3 text-right text-gray-500">{e.retirementType === 'DC' ? fmt(e.dcDepositedTotal) : '-'}</td>
                  <td className="py-2.5 px-3 text-right text-blue-600">{e.retirementType === 'DC' ? fmt(e.dcDiffAmount) : '-'}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#2e9e6e] bg-[#f0f9f6]/50">{fmt(e.displayAmount)}</td>
                </tr>
              ))}
            </tbody>
            {employees.length > 0 && summary && (
              <tfoot>
                <tr className="bg-gray-100 border-t-2 border-gray-300 font-semibold">
                  <td colSpan={10} className="py-2.5 px-3 text-right text-gray-700">합계</td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#2e9e6e] bg-[#f0f9f6]">{fmt(summary.totalEstimateAmount)} 원</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <Pagination page={page} total={employees.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>
    </div>
  )
}
