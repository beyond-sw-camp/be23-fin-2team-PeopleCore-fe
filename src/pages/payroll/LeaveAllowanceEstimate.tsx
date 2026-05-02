import { useState, useEffect, useCallback } from 'react'
import { leaveAllowanceApi } from '../../api/payAdmin'
import type { LeaveAllowanceRes, LeaveAllowanceSummaryRes, AllowanceType } from '../../api/payAdmin'

type Mode = 'fiscal' | 'anniversary' | 'resigned'

function fmt(n: number | null | undefined) { return (n ?? 0).toLocaleString() }

export default function LeaveAllowanceEstimate() {
  const [policyBaseType, setPolicyBaseType] = useState<'FISCAL' | 'HIRE' | null>(null)
  const [mode, setMode] = useState<Mode>('fiscal')
  const [year, setYear] = useState(2026)
  const [summary, setSummary] = useState<LeaveAllowanceSummaryRes | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkedIds, setCheckedIds] = useState<number[]>([])

  // 회사 정책 타입 조회
  useEffect(() => {
    leaveAllowanceApi.getPolicyType()
      .then(res => {
        setPolicyBaseType(res.policyBaseType)
        setMode(res.policyBaseType === 'FISCAL' ? 'fiscal' : 'anniversary')
      })
      .catch(err => console.error('연차 정책 조회 실패:', err))
  }, [])

  const fetchList = useCallback(() => {
    if (!policyBaseType) return
    setLoading(true)
    setCheckedIds([])
    const promise = mode === 'resigned' ? leaveAllowanceApi.getResignedList(year) : leaveAllowanceApi.getFiscalYearList(year)
    promise
      .then(setSummary)
      .catch(err => { console.error('연차수당 목록 조회 실패:', err); setSummary(null) })
      .finally(() => setLoading(false))
  }, [mode, year, policyBaseType])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchList() }, [fetchList])

  const data = summary?.employees || []

  const toggleCheck = (id: number) => {
    setCheckedIds(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id])
  }
  const toggleAll = () => {
    if (checkedIds.length === data.length) setCheckedIds([])
    else setCheckedIds(data.map(e => e.allowanceId))
  }

  const handleCalculate = () => {
    if (data.length === 0) { alert('대상자가 없습니다.'); return }
    const targetEmpIds = data
      .filter(e => checkedIds.length === 0 || checkedIds.includes(e.allowanceId))
      .map(e => e.empId)
    if (targetEmpIds.length === 0) { alert('산정할 사원을 선택하세요.'); return }
    const type: AllowanceType = mode === 'fiscal' ? 'FISCAL_YEAR' : mode === 'anniversary' ? 'ANNIVERSARY' : 'RESIGNED'
    leaveAllowanceApi.calculate(year, type, targetEmpIds)
      .then(() => { alert(`${targetEmpIds.length}명 산정 완료`); fetchList() })
      .catch(err => alert('산정 실패: ' + (err?.response?.data?.message || '오류')))
  }

  const handleApply = () => {
    const targets = data.filter(e => checkedIds.length === 0 || checkedIds.includes(e.allowanceId))
    const applicable = targets.filter(e => e.status === 'CALCULATED')
    if (applicable.length === 0) { alert('급여대장에 반영할 산정완료 건이 없습니다.'); return }
    if (!confirm(`${applicable.length}명의 연차수당을 급여대장에 반영하시겠습니까?`)) return
    leaveAllowanceApi.applyToPayroll(applicable.map(e => e.allowanceId))
      .then(result => {
        const msg = result.skippedCount > 0
          ? `${applicable.length}명 중 ${result.appliedCount}명 반영, ${result.skippedCount}명 skip\n(skip 사유: 이미 지급완료 또는 결재 진행중)`
          : `${result.appliedCount}명 반영 완료`
        alert(msg)
        fetchList()
      })
      .catch(err => alert('급여반영 실패: ' + (err?.response?.data?.message || '오류')))
  }

  const statusBadge = (s: string) => {
    if (s === 'PENDING') return <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">미산정</span>
    if (s === 'CALCULATED') return <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">산정완료</span>
    if (s === 'EXEMPTED') return <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600" title="촉진 1·2차 완료로 수당 면제 (근기법 제61조)">수당면제</span>
    return <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">급여반영</span>
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb]">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-xs text-gray-400 mb-1">급여관리 &gt; 연차수당 산정</div>
        <h1 className="text-lg font-bold text-gray-800 mb-1">연차수당 산정</h1>
        <p className="text-xs text-gray-500 mb-5">연말 미사용 연차 또는 퇴직자의 잔여 연차에 대해 수당을 산정하고 급여대장에 반영합니다.</p>

        {/* 회사 연차 기준 안내 */}
        {policyBaseType && (
          <div className="mb-4 text-[11px] inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
            <span className="text-gray-500">회사 연차 기준:</span>
            <span className={`font-semibold ${policyBaseType === 'FISCAL' ? 'text-[#1D9E75]' : 'text-blue-600'}`}>
              {policyBaseType === 'FISCAL' ? '회계연도 기준' : '입사일 기준'}
            </span>
            <span className="text-gray-400">· 인사통합 &gt; 근태정책 &gt; 연차 발생 규칙에서 변경</span>
          </div>
        )}

        {/* 모드 탭 */}
        <div className="flex border-b border-gray-200 mb-5">
          {policyBaseType === 'FISCAL' && (
            <button onClick={() => setMode('fiscal')}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${mode === 'fiscal' ? 'border-gray-800 text-gray-800' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              연말 미사용 연차 산정
            </button>
          )}
          {policyBaseType === 'HIRE' && (
            <button onClick={() => setMode('anniversary')}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${mode === 'anniversary' ? 'border-gray-800 text-gray-800' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              입사기념일 도래 사원
            </button>
          )}
          <button onClick={() => setMode('resigned')}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${mode === 'resigned' ? 'border-gray-800 text-gray-800' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            퇴직자 연차 정산
          </button>
        </div>

        {/* 상단 컨트롤 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-500">기준연도</span>
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="border border-gray-200 rounded px-2 py-1.5 text-xs outline-none">
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
          </div>
          <button onClick={fetchList} className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50">
            <i className="fas fa-search text-[10px] mr-1" />조회
          </button>
          <button onClick={handleCalculate} className="px-3 py-1.5 text-xs border border-[#2e9e6e] text-[#2e9e6e] rounded hover:bg-[#f0f9f6]">
            <i className="fas fa-calculator text-[10px] mr-1" />수당 산정
          </button>
          <button onClick={handleApply} className="px-3 py-1.5 text-xs text-white bg-[#2e9e6e] rounded hover:bg-[#26865d]">
            <i className="fas fa-file-invoice text-[10px] mr-1" />급여대장 반영
          </button>
        </div>

        {/* 요약 */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">대상자</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{summary?.totalTarget ?? 0} <span className="text-sm font-normal">명</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">산정 완료</div>
            <div className="text-xl font-bold text-orange-600 mt-1">{summary?.calculatedCount ?? 0} <span className="text-sm font-normal">명</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">급여 반영</div>
            <div className="text-xl font-bold text-[#2e9e6e] mt-1">{summary?.appliedCount ?? 0} <span className="text-sm font-normal">명</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">총 산정액</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{fmt(summary?.totalAllowanceAmount)} <span className="text-sm font-normal">원</span></div>
          </div>
        </div>

        {/* 안내 */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-700 space-y-1 mb-4">
          <p className="font-semibold">ℹ️ 산정 방식</p>
          <p>• <strong>일 통상임금</strong> = 통상임금 ÷ 209 × 8</p>
          <p>• <strong>연차수당</strong> = 미사용 연차일수 × 일 통상임금</p>
          <p>• 산정된 수당은 "급여대장 반영" 클릭 시 해당 사원의 급여대장 <strong>연차수당</strong> 항목에 자동 입력됩니다.</p>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-2.5 px-3 text-left w-8"><input type="checkbox" className="w-3 h-3" checked={data.length > 0 && checkedIds.length === data.length} onChange={toggleAll} /></th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">상태</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">사원명</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">부서</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">직급</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">입사일</th>
                {mode === 'resigned' && <th className="py-2.5 px-3 text-left font-medium text-gray-500">퇴직일</th>}
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">통상임금</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">일 통상임금</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">부여/사용</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">미사용</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">산정 금액</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">반영월</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={mode === 'resigned' ? 13 : 12} className="py-12 text-center text-gray-400">로딩 중...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={mode === 'resigned' ? 13 : 12} className="py-12 text-center text-gray-400">대상자가 없습니다.</td></tr>
              ) : data.map((emp: LeaveAllowanceRes) => (
                <tr key={emp.allowanceId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3"><input type="checkbox" className="w-3 h-3" checked={checkedIds.includes(emp.allowanceId)} onChange={() => toggleCheck(emp.allowanceId)} /></td>
                  <td className="py-2 px-3">{statusBadge(emp.status)}</td>
                  <td className="py-2 px-3 text-gray-800 font-medium">{emp.empName}</td>
                  <td className="py-2 px-3 text-gray-600">{emp.deptName}</td>
                  <td className="py-2 px-3 text-gray-600">{emp.gradeName || '-'}</td>
                  <td className="py-2 px-3 text-gray-600">{emp.hireDate}</td>
                  {mode === 'resigned' && <td className="py-2 px-3 text-red-500">{emp.resignDate || '-'}</td>}
                  <td className="py-2 px-3 text-right text-gray-700">{fmt(emp.normalMonthlySalary)}</td>
                  <td className="py-2 px-3 text-right text-gray-700">{fmt(emp.dailyWage)}</td>
                  <td className="py-2 px-3 text-right text-gray-500">{emp.totalLeaveDays} / {emp.usedLeaveDays}</td>
                  <td className="py-2 px-3 text-right text-gray-800">{emp.unusedLeaveDays} 일</td>
                  <td className="py-2 px-3 text-right font-bold text-[#2e9e6e]">{fmt(emp.allowanceAmount)}</td>
                  <td className="py-2 px-3 text-gray-600">{emp.appliedMonth || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
