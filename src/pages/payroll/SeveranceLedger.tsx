import { useState } from 'react'

function fmt(n: number) { return n.toLocaleString() }

type PensionType = 'severance' | 'DB' | 'DC'

interface SeveranceEmployee {
  name: string; dept: string; rank: string; hireDate: string; resignDate: string
  serviceYears: number; avg3mPay: number; severanceAmount: number; taxAmount: number; netAmount: number
  pensionType: PensionType
  status: '산정중' | '확정' | '지급완료' | '금융기관 지급 예정'
}

const MOCK_DATA: SeveranceEmployee[] = [
  { name: '오나영', dept: '경영지원팀', rank: '대리', hireDate: '2021-05-03', resignDate: '2026-03-31', serviceYears: 4.9, avg3mPay: 3833333, severanceAmount: 18803333, taxAmount: 0, netAmount: 18803333, pensionType: 'severance', status: '산정중' },
  { name: '김영수', dept: '영업팀', rank: '과장', hireDate: '2018-01-15', resignDate: '2026-03-28', serviceYears: 8.2, avg3mPay: 5200000, severanceAmount: 42640000, taxAmount: 1200000, netAmount: 41440000, pensionType: 'DB', status: '금융기관 지급 예정' },
]

export default function SeveranceLedger() {
  const [yearMonth, setYearMonth] = useState('2026-04')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | PensionType>('all')

  const filtered = MOCK_DATA.filter(e => {
    if (search && !e.name.includes(search)) return false
    if (e.pensionType === 'DC') return false
    if (typeFilter !== 'all' && e.pensionType !== typeFilter) return false
    return true
  })

  const handlePay = (name: string) => {
    // 실제로는 상태 변경 API 호출
    alert(`${name}님의 퇴직금 지급처리가 완료되었습니다.`)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb]">
      <div className="max-w-[1300px] mx-auto">
        <div className="text-xs text-gray-400 mb-1">급여관리 &gt; 퇴직급여 &gt; 퇴직금대장(작성)</div>
        <h1 className="text-lg font-bold text-gray-800 mb-1">퇴직금대장(작성)</h1>
        <p className="text-xs text-gray-500 mb-5">퇴직자의 퇴직금을 산정하고 관리합니다.</p>

        <div className="flex items-center gap-3 mb-5 text-xs">
          <input type="month" value={yearMonth} onChange={e => setYearMonth(e.target.value)} className="border border-gray-200 rounded px-2.5 py-1.5 outline-none" />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as 'all' | PensionType)} className="border border-gray-200 rounded px-2.5 py-1.5 outline-none">
            <option value="all">전체 유형</option>
            <option value="severance">퇴직금</option>
            <option value="DB">DB형</option>
          </select>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="사원명을 입력하세요.." className="border border-gray-200 rounded px-2.5 py-1.5 outline-none w-44" />
          <button className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50"><i className="fas fa-search text-[10px] mr-1" />조회</button>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 mb-4 text-[11px] text-blue-700 space-y-0.5">
          <p>• <strong>퇴직금(severance)</strong>: 회사가 직접 계산·지급 → 지급처리 가능</p>
          <p>• <strong>DB형(확정급여)</strong>: 금융기관이 지급 → 퇴직금액 조회만 가능, "금융기관 지급 예정" 표시</p>
          <p>• <strong>DC형(확정기여)</strong>: 매년 납입 완료 → 퇴직금대장 해당없음 (목록 제외)</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-xs min-w-[1100px]">
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
              {filtered.length > 0 ? filtered.map((emp, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3 text-gray-700">{emp.name}</td>
                  <td className="py-2.5 px-3 text-gray-600">{emp.dept}</td>
                  <td className="py-2.5 px-3 text-gray-600">{emp.rank}</td>
                  <td className="py-2.5 px-3 text-gray-600">{emp.hireDate}</td>
                  <td className="py-2.5 px-3 text-gray-600">{emp.resignDate}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      emp.pensionType === 'severance' ? 'bg-orange-100 text-orange-700' :
                      emp.pensionType === 'DB' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                    }`}>{emp.pensionType === 'severance' ? '퇴직금' : emp.pensionType + '형'}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-gray-700">{emp.serviceYears.toFixed(1)}년</td>
                  <td className="py-2.5 px-3 text-right text-gray-700">{fmt(emp.avg3mPay)}</td>
                  <td className="py-2.5 px-3 text-right text-gray-800 font-medium">{fmt(emp.severanceAmount)}</td>
                  <td className="py-2.5 px-3 text-right text-gray-600">{fmt(emp.taxAmount)}</td>
                  <td className="py-2.5 px-3 text-right text-gray-800 font-medium">{fmt(emp.netAmount)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      emp.status === '산정중' ? 'bg-yellow-100 text-yellow-700' :
                      emp.status === '확정' ? 'bg-orange-100 text-orange-700' :
                      emp.status === '지급완료' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{emp.status}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {emp.pensionType === 'severance' && emp.status !== '지급완료' ? (
                      <button onClick={() => handlePay(emp.name)} className="text-[10px] text-white bg-[#2e9e6e] rounded px-2 py-0.5 hover:bg-[#26865d]">지급처리</button>
                    ) : emp.pensionType === 'DB' ? (
                      <span className="text-[10px] text-gray-400">금융기관 지급</span>
                    ) : null}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={13} className="py-12 text-center text-gray-400">검색된 결과가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
