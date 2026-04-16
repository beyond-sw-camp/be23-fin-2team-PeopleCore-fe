import { useState, useEffect } from 'react'
import { empSalaryApi, severanceApi } from '../../api/payAdmin'
import type { EmpSalaryRes, SeveranceDetailRes } from '../../api/payAdmin'

function fmt(n: number | null | undefined) { return (n ?? 0).toLocaleString() }

const STATUS_LABEL: Record<string, string> = {
  CALCULATING: '산정중', CONFIRMED: '확정', APPROVED: '승인완료', PAID: '지급완료', PENDING: '미산정',
}
const STATUS_BADGE: Record<string, string> = {
  미산정: 'bg-gray-100 text-gray-500',
  산정중: 'bg-yellow-100 text-yellow-700',
  확정: 'bg-orange-100 text-orange-700',
  승인완료: 'bg-blue-100 text-blue-700',
  지급완료: 'bg-green-100 text-green-700',
}
const PENSION_LABEL: Record<string, string> = { severance: '퇴직금', DB: 'DB형', DC: 'DC형' }
const PENSION_BADGE: Record<string, string> = {
  severance: 'bg-orange-100 text-orange-700',
  DB: 'bg-purple-100 text-purple-700',
  DC: 'bg-gray-100 text-gray-500',
}

export default function SeveranceLedger() {
  const [search, setSearch] = useState('')
  const [retiredEmps, setRetiredEmps] = useState<EmpSalaryRes[]>([])
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState<number | null>(null)
  // empId → 산정 결과
  const [calcResults, setCalcResults] = useState<Record<number, SeveranceDetailRes>>({})

  const fetchRetired = () => {
    setLoading(true)
    empSalaryApi.getList({ keyword: search || undefined, empStatus: 'RESIGNED', size: 100 })
      .then(res => setRetiredEmps(res.content))
      .catch(err => console.error('퇴직자 조회 실패:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchRetired() }, [])

  const handleCalculate = (empId: number) => {
    setCalculating(empId)
    severanceApi.calculate({ empId })
      .then(res => {
        setCalcResults(prev => ({ ...prev, [empId]: res }))
        alert('퇴직금이 산정되었습니다.')
      })
      .catch(err => alert('산정 실패: ' + (err?.response?.data?.message || '오류')))
      .finally(() => setCalculating(null))
  }

  const filtered = retiredEmps  // 검색어 변경 시 fetchRetired로 재조회

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb]">
      <div className="max-w-[1300px] mx-auto">
        <div className="text-xs text-gray-400 mb-1">급여관리 &gt; 퇴직급여 &gt; 퇴직금대장(작성)</div>
        <h1 className="text-lg font-bold text-gray-800 mb-1">퇴직금대장(작성)</h1>
        <p className="text-xs text-gray-500 mb-5">퇴직자의 퇴직금을 산정하고 관리합니다.</p>

        <div className="flex items-center gap-3 mb-5 text-xs">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="사원명 검색.." className="border border-gray-200 rounded px-2.5 py-1.5 outline-none w-44" />
          <button onClick={fetchRetired} className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50">
            <i className="fas fa-search text-[10px] mr-1" />조회
          </button>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 mb-4 text-[11px] text-blue-700 space-y-0.5">
          <p>• <strong>퇴직금(severance)</strong>: 회사가 직접 계산·지급</p>
          <p>• <strong>DB형(확정급여)</strong>: 금융기관이 지급 → 산정만 가능</p>
          <p>• <strong>DC형(확정기여)</strong>: 매년 납입 완료 → 퇴직금대장 해당없음</p>
          <p>• 행의 <strong>"산정"</strong> 버튼을 클릭해 백엔드에서 퇴직금을 계산합니다.</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-xs min-w-[1200px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">사원명</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">부서</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">직위</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">입사일</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">퇴사일</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">유형</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">근속연수</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">3개월 평균급여</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">퇴직금액</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">세액</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">실지급액</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">상태</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={13} className="py-12 text-center text-gray-400">로딩 중...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={13} className="py-12 text-center text-gray-400">퇴직 처리된 사원이 없습니다.</td></tr>
              ) : filtered.map(emp => {
                const result = calcResults[emp.empId]
                const pensionType = result?.retirementType || '-'
                const sevStatusLabel = result ? (STATUS_LABEL[result.sevStatus] || result.sevStatus) : '미산정'
                const isCalculating = calculating === emp.empId
                return (
                  <tr key={emp.empId} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-3 text-gray-700">{emp.empName}</td>
                    <td className="py-2.5 px-3 text-gray-600">{emp.deptName}</td>
                    <td className="py-2.5 px-3 text-gray-600">{emp.titleName || '-'}</td>
                    <td className="py-2.5 px-3 text-gray-600">{emp.empHireDate}</td>
                    <td className="py-2.5 px-3 text-gray-600">{emp.empResignDate || '-'}</td>
                    <td className="py-2.5 px-3 text-center">
                      {result ? (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${PENSION_BADGE[pensionType] || 'bg-gray-100 text-gray-500'}`}>
                          {PENSION_LABEL[pensionType] || pensionType}
                        </span>
                      ) : <span className="text-[10px] text-gray-300">-</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-700">{result ? `${Number(result.serviceYears).toFixed(1)}년` : '-'}</td>
                    <td className="py-2.5 px-3 text-right text-gray-700">{result ? fmt(result.last3MonthPay) : '-'}</td>
                    <td className="py-2.5 px-3 text-right text-gray-800 font-medium">{result ? fmt(result.severanceAmount) : '-'}</td>
                    <td className="py-2.5 px-3 text-right text-gray-600">{result ? fmt(result.taxAmount) : '-'}</td>
                    <td className="py-2.5 px-3 text-right text-gray-800 font-medium">{result ? fmt(result.netAmount) : '-'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_BADGE[sevStatusLabel] || 'bg-gray-100 text-gray-500'}`}>{sevStatusLabel}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleCalculate(emp.empId)}
                        disabled={isCalculating}
                        className="text-[10px] text-white bg-[#2e9e6e] rounded px-2 py-0.5 hover:bg-[#26865d] disabled:opacity-40"
                      >
                        {isCalculating ? '산정중...' : result ? '재산정' : '산정'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
