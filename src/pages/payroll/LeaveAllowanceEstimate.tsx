import { useState, useMemo } from 'react'

type Mode = 'yearend' | 'hiredate' | 'resignation'
type GrantBasis = 'fiscal' | 'hire'

interface LeaveEmployee {
  empNo: string
  name: string
  dept: string
  rank: string
  hireDate: string
  resignDate?: string
  ordinaryWage: number        // 통상임금 (월)
  totalLeaves: number         // 부여 연차(일)
  usedLeaves: number          // 사용 연차(일)
  status: '미산정' | '산정완료' | '급여반영'
  appliedYearMonth?: string   // 급여에 반영된 연월
}

// 통상임금 기준 일당 = 통상임금 / 209 * 8
function dailyWage(ordinaryWage: number) {
  return Math.round((ordinaryWage / 209) * 8)
}

function fmt(n: number) { return n.toLocaleString() }

const MOCK_YEAREND: LeaveEmployee[] = [
  { empNo: 'PC2024001', name: '김민수', dept: '개발팀', rank: '대리', hireDate: '2022-03-02', ordinaryWage: 3500000, totalLeaves: 15, usedLeaves: 10, status: '미산정' },
  { empNo: 'PC2024002', name: '이서연', dept: '인사팀', rank: '과장', hireDate: '2020-07-15', ordinaryWage: 4200000, totalLeaves: 17, usedLeaves: 15, status: '미산정' },
  { empNo: 'PC2024003', name: '박지훈', dept: '마케팅팀', rank: '사원', hireDate: '2023-09-01', ordinaryWage: 2700000, totalLeaves: 11, usedLeaves: 7, status: '미산정' },
  { empNo: 'PC2024004', name: '최유진', dept: '영업팀', rank: '주임', hireDate: '2021-11-10', ordinaryWage: 3000000, totalLeaves: 15, usedLeaves: 12, status: '미산정' },
  { empNo: 'PC2024005', name: '정하은', dept: '재무팀', rank: '차장', hireDate: '2018-04-20', ordinaryWage: 4800000, totalLeaves: 20, usedLeaves: 18, status: '미산정' },
]

// 입사일 기준: 선택한 월에 입사기념일이 도래하는 사원 (MOCK: 월별 필터는 화면에서 처리)
const MOCK_HIREDATE: LeaveEmployee[] = [
  { empNo: 'PC2024001', name: '김민수', dept: '개발팀', rank: '대리', hireDate: '2022-03-02', ordinaryWage: 3500000, totalLeaves: 15, usedLeaves: 13, status: '미산정' },
  { empNo: 'PC2024006', name: '한승우', dept: '개발팀', rank: '사원', hireDate: '2024-03-10', ordinaryWage: 2500000, totalLeaves: 12, usedLeaves: 10, status: '미산정' },
]

const MOCK_RESIGNATION: LeaveEmployee[] = [
  { empNo: 'PC2023012', name: '오세훈', dept: '개발팀', rank: '대리', hireDate: '2021-01-05', resignDate: '2026-04-30', ordinaryWage: 3600000, totalLeaves: 15, usedLeaves: 4, status: '미산정' },
  { empNo: 'PC2023008', name: '김수빈', dept: '기획팀', rank: '사원', hireDate: '2022-09-01', resignDate: '2026-03-31', ordinaryWage: 2800000, totalLeaves: 11, usedLeaves: 2, status: '산정완료' },
]

export default function LeaveAllowanceEstimate() {
  const grantBasis = (localStorage.getItem('leaveGrantBasis') as GrantBasis) || 'hire'
  const [mode, setMode] = useState<Mode>(grantBasis === 'fiscal' ? 'yearend' : 'hiredate')
  const [year, setYear] = useState(2026)
  const [hireMonth, setHireMonth] = useState('2026-04')
  const [yearendData, setYearendData] = useState<LeaveEmployee[]>(MOCK_YEAREND)
  const [hiredateData, setHiredateData] = useState<LeaveEmployee[]>(MOCK_HIREDATE)
  const [resignationData, setResignationData] = useState<LeaveEmployee[]>(MOCK_RESIGNATION)
  const [overrides, setOverrides] = useState<Record<string, number>>({})  // empNo → 수정된 미사용일수
  const [checkedNos, setCheckedNos] = useState<string[]>([])

  const data = mode === 'yearend' ? yearendData : mode === 'hiredate' ? hiredateData : resignationData
  const setData = mode === 'yearend' ? setYearendData : mode === 'hiredate' ? setHiredateData : setResignationData

  const getRemaining = (emp: LeaveEmployee) => {
    if (overrides[emp.empNo] !== undefined) return overrides[emp.empNo]
    return emp.totalLeaves - emp.usedLeaves
  }

  const getAmount = (emp: LeaveEmployee) => getRemaining(emp) * dailyWage(emp.ordinaryWage)

  const toggleCheck = (no: string) => {
    setCheckedNos(prev => prev.includes(no) ? prev.filter(n => n !== no) : [...prev, no])
  }
  const toggleAll = () => {
    if (checkedNos.length === data.length) setCheckedNos([])
    else setCheckedNos(data.map(e => e.empNo))
  }

  const handleCalculate = () => {
    const targets = checkedNos.length > 0 ? checkedNos : data.map(e => e.empNo)
    setData(prev => prev.map(e => targets.includes(e.empNo) && e.status === '미산정' ? { ...e, status: '산정완료' as const } : e))
    setCheckedNos([])
  }

  const handleApplyToPayroll = () => {
    const targets = checkedNos.length > 0 ? checkedNos : data.map(e => e.empNo)
    const ym = mode === 'yearend' ? `${year}-12` : mode === 'hiredate' ? hireMonth : '-'
    setData(prev => prev.map(e => targets.includes(e.empNo) && e.status === '산정완료' ? { ...e, status: '급여반영' as const, appliedYearMonth: ym } : e))
    setCheckedNos([])
    const label = mode === 'yearend' ? `${year}년 12월` : mode === 'hiredate' ? `${hireMonth}` : '퇴직 정산'
    alert(`${targets.length}명의 연차수당이 ${label} 급여에 반영되었습니다.`)
  }

  const handleOverride = (empNo: string, value: string) => {
    const num = Number(value.replace(/[^0-9.]/g, '')) || 0
    setOverrides(prev => ({ ...prev, [empNo]: num }))
  }

  const summary = useMemo(() => {
    const totalPeople = data.length
    const calculated = data.filter(e => e.status !== '미산정').length
    const applied = data.filter(e => e.status === '급여반영').length
    const totalAmount = data.reduce((sum, e) => sum + getAmount(e), 0)
    return { totalPeople, calculated, applied, totalAmount }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, overrides])

  const statusBadge = (s: LeaveEmployee['status']) => {
    const cls = s === '미산정' ? 'bg-yellow-100 text-yellow-700' : s === '산정완료' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
    return <span className={`text-[10px] px-1.5 py-0.5 rounded ${cls}`}>{s}</span>
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb]">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-xs text-gray-400 mb-1">급여관리 &gt; 연차수당 산정</div>
        <h1 className="text-lg font-bold text-gray-800 mb-1">연차수당 산정</h1>
        <p className="text-xs text-gray-500 mb-5">연말 미사용 연차 또는 퇴직자의 잔여 연차에 대해 수당을 산정하고 급여대장에 반영합니다.</p>

        {/* 회사 연차 기준 안내 */}
        <div className="mb-4 text-[11px] inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
          <span className="text-gray-500">회사 연차 기준:</span>
          <span className={`font-semibold ${grantBasis === 'fiscal' ? 'text-[#1D9E75]' : 'text-blue-600'}`}>
            {grantBasis === 'fiscal' ? '회계연도 기준 (1/1 ~ 12/31 일괄)' : '입사일 기준 (사원별 입사기념일)'}
          </span>
          <span className="text-gray-400">· 인사통합 &gt; 근태정책 &gt; 연차 발생 규칙에서 변경</span>
        </div>

        {/* 모드 탭 */}
        <div className="flex border-b border-gray-200 mb-5">
          {grantBasis === 'fiscal' && (
            <button
              onClick={() => { setMode('yearend'); setCheckedNos([]) }}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${mode === 'yearend' ? 'border-gray-800 text-gray-800' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              연말 미사용 연차 산정
            </button>
          )}
          {grantBasis === 'hire' && (
            <button
              onClick={() => { setMode('hiredate'); setCheckedNos([]) }}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${mode === 'hiredate' ? 'border-gray-800 text-gray-800' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              입사기념일 도래 사원
            </button>
          )}
          <button
            onClick={() => { setMode('resignation'); setCheckedNos([]) }}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${mode === 'resignation' ? 'border-gray-800 text-gray-800' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            퇴직자 연차 정산
          </button>
        </div>

        {/* 상단 컨트롤 */}
        <div className="flex items-center gap-3 mb-4">
          {mode === 'yearend' && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500">기준연도</span>
              <select value={year} onChange={e => setYear(Number(e.target.value))} className="border border-gray-200 rounded px-2 py-1.5 text-xs outline-none">
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}년</option>)}
              </select>
            </div>
          )}
          {mode === 'hiredate' && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500">기준월</span>
              <input type="month" value={hireMonth} onChange={e => setHireMonth(e.target.value)} className="border border-gray-200 rounded px-2 py-1.5 text-xs outline-none" />
              <span className="text-[10px] text-gray-400">· 해당 월에 연차 발생 1주기가 도래하는 사원만 표시</span>
            </div>
          )}
          <button onClick={handleCalculate} className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50">
            <i className="fas fa-calculator text-[10px] mr-1" />수당 산정
          </button>
          <button onClick={handleApplyToPayroll} className="px-3 py-1.5 text-xs text-white bg-[#2e9e6e] rounded hover:bg-[#26865d]">
            <i className="fas fa-file-invoice text-[10px] mr-1" />급여대장 반영
          </button>
        </div>

        {/* 요약 */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">대상자</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{summary.totalPeople} <span className="text-sm font-normal">명</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">산정 완료</div>
            <div className="text-xl font-bold text-orange-600 mt-1">{summary.calculated} <span className="text-sm font-normal">명</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">급여 반영</div>
            <div className="text-xl font-bold text-[#2e9e6e] mt-1">{summary.applied} <span className="text-sm font-normal">명</span></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">총 산정액</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{fmt(summary.totalAmount)} <span className="text-sm font-normal">원</span></div>
          </div>
        </div>

        {/* 안내 */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-700 space-y-1 mb-4">
          <p className="font-semibold">ℹ️ 산정 방식</p>
          <p>• <strong>일 통상임금 = 통상임금 ÷ 209 × 8</strong></p>
          <p>• <strong>연차수당 = 미사용 연차일수 × 일 통상임금</strong></p>
          <p>• 산정된 수당은 "급여대장 반영" 클릭 시 해당 사원의 {mode === 'yearend' ? '12월' : mode === 'hiredate' ? '선택한 기준월' : '퇴직월'} 급여대장의 <strong>연차수당</strong> 항목에 자동 입력됩니다.</p>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-2.5 px-3 text-left w-8"><input type="checkbox" className="w-3 h-3" checked={checkedNos.length === data.length && data.length > 0} onChange={toggleAll} /></th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">상태</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">사원명</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">부서</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">직위</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">입사일</th>
                {mode === 'resignation' && <th className="py-2.5 px-3 text-left font-medium text-gray-500">퇴직일</th>}
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">통상임금</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">일 통상임금</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">부여/사용</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">미사용(수정가능)</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">산정 금액</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">반영월</th>
              </tr>
            </thead>
            <tbody>
              {data.map(emp => {
                const remaining = getRemaining(emp)
                const daily = dailyWage(emp.ordinaryWage)
                const amount = remaining * daily
                const locked = emp.status === '급여반영'
                return (
                  <tr key={emp.empNo} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3"><input type="checkbox" className="w-3 h-3" checked={checkedNos.includes(emp.empNo)} onChange={() => toggleCheck(emp.empNo)} /></td>
                    <td className="py-2 px-3">{statusBadge(emp.status)}</td>
                    <td className="py-2 px-3 text-gray-800 font-medium">{emp.name}</td>
                    <td className="py-2 px-3 text-gray-600">{emp.dept}</td>
                    <td className="py-2 px-3 text-gray-600">{emp.rank}</td>
                    <td className="py-2 px-3 text-gray-600">{emp.hireDate}</td>
                    {mode === 'resignation' && <td className="py-2 px-3 text-red-500">{emp.resignDate || '-'}</td>}
                    <td className="py-2 px-3 text-right text-gray-700">{fmt(emp.ordinaryWage)}</td>
                    <td className="py-2 px-3 text-right text-gray-700">{fmt(daily)}</td>
                    <td className="py-2 px-3 text-right text-gray-500">{emp.totalLeaves} / {emp.usedLeaves}</td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        disabled={locked}
                        value={remaining}
                        onChange={e => handleOverride(emp.empNo, e.target.value)}
                        className={`w-16 text-right text-xs border border-gray-200 rounded px-1.5 py-0.5 outline-none focus:border-[#2e9e6e] ${locked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                      />
                      <span className="text-[10px] text-gray-400 ml-1">일</span>
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-[#2e9e6e]">{fmt(amount)}</td>
                    <td className="py-2 px-3 text-gray-600">{emp.appliedYearMonth || '-'}</td>
                  </tr>
                )
              })}
              {data.length === 0 && (
                <tr><td colSpan={mode === 'resignation' ? 13 : 12} className="py-12 text-center text-gray-400">대상자가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
