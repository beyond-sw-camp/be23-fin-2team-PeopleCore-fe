import { useState } from 'react'

function fmt(n: number) { return n.toLocaleString() }

const MOCK_DATA = [
  { name: '김민수', dept: '개발팀', rank: '대리', hireDate: '2022-03-02', avg3m: 4000000, annualBonus: 0, bonusCalc: 0, basePay: 1333333, monthSeverance: 1333333, months: 48, total: 16000000 },
  { name: '이서연', dept: '인사팀', rank: '과장', hireDate: '2020-07-15', avg3m: 4666667, annualBonus: 0, bonusCalc: 0, basePay: 1555556, monthSeverance: 1555556, months: 69, total: 26833333 },
  { name: '정하은', dept: '재무팀', rank: '차장', hireDate: '2018-04-20', avg3m: 5333333, annualBonus: 3500000, bonusCalc: 291667, basePay: 1875000, monthSeverance: 1875000, months: 96, total: 45000000 },
  { name: '윤재혁', dept: '개발팀', rank: '부장', hireDate: '2015-02-16', avg3m: 6500000, annualBonus: 3500000, bonusCalc: 291667, basePay: 2263889, monthSeverance: 2263889, months: 134, total: 75833333 },
]

export default function SeveranceEstimate() {
  const [baseDate, setBaseDate] = useState('2026-04-01')

  const totalEstimate = MOCK_DATA.reduce((a, e) => a + e.total, 0)

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb]">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-xs text-gray-400 mb-1">급여관리 &gt; 퇴직급여 &gt; 퇴직금추계액</div>
        <h1 className="text-lg font-bold text-gray-800 mb-1">퇴직금추계액</h1>
        <p className="text-xs text-gray-500 mb-5">1년 이상 재직자의 예상 퇴직급여를 확인합니다.</p>

        {/* 필터 */}
        <div className="flex items-center gap-3 mb-4 text-xs">
          <span className="text-gray-500">기준일</span>
          <input type="date" value={baseDate} onChange={e => setBaseDate(e.target.value)} className="border border-gray-200 rounded px-2.5 py-1.5 outline-none" />
          <input type="text" placeholder="사원명을 입력하세요.." className="border border-gray-200 rounded px-2.5 py-1.5 outline-none w-44" />
          <button className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50"><i className="fas fa-search text-[10px] mr-1" />조회</button>
        </div>

        <div className="flex items-center gap-8 mb-4 text-xs">
          <span className="text-gray-600">사원 <span className="text-lg font-bold text-gray-800 ml-1">{MOCK_DATA.length}</span> 명</span>
          <span className="text-gray-500">※ 조회일 기준, 재직기간이 1년 이상인 사원만 해당합니다.</span>
          <span className="text-gray-600 ml-auto">퇴직금 추계액 <span className="text-lg font-bold text-gray-800 ml-1">{fmt(totalEstimate)}</span> 원</span>
        </div>

        <div className="flex items-center justify-end mb-2">
          <button className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:bg-gray-50">엑셀 다운로드</button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-xs min-w-[1200px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-2.5 px-2 text-left w-8"><input type="checkbox" className="w-3 h-3" /></th>
                <th className="py-2.5 px-2 text-left font-medium text-gray-500">사원명</th>
                <th className="py-2.5 px-2 text-left font-medium text-gray-500">부서</th>
                <th className="py-2.5 px-2 text-left font-medium text-gray-500">직위</th>
                <th className="py-2.5 px-2 text-left font-medium text-gray-500">입사일</th>
                <th className="py-2.5 px-2 text-right font-medium text-gray-500">추계액 기준<br/>3개월 전 총 급...</th>
                <th className="py-2.5 px-2 text-right font-medium text-gray-500">연간상여액<br/>[B]</th>
                <th className="py-2.5 px-2 text-right font-medium text-gray-500">상여금가산금<br/>[C=B x 3/12]</th>
                <th className="py-2.5 px-2 text-right font-medium text-gray-500">기준급여<br/>[D=(A+C)/3]</th>
                <th className="py-2.5 px-2 text-right font-medium text-gray-500">월퇴직금산출액<br/>[E=D/12]</th>
                <th className="py-2.5 px-2 text-right font-medium text-gray-500">근무개월수<br/>[F]</th>
                <th className="py-2.5 px-2 text-right font-medium text-gray-500">퇴직금추계액<br/>[G=E x F]</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_DATA.map((emp, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-2"><input type="checkbox" className="w-3 h-3" /></td>
                  <td className="py-2.5 px-2 text-blue-600">{emp.name}</td>
                  <td className="py-2.5 px-2 text-gray-600">{emp.dept}</td>
                  <td className="py-2.5 px-2 text-gray-600">{emp.rank}</td>
                  <td className="py-2.5 px-2 text-gray-600">{emp.hireDate}</td>
                  <td className="py-2.5 px-2 text-right text-gray-800">{fmt(emp.avg3m)}</td>
                  <td className="py-2.5 px-2 text-right text-gray-800">{fmt(emp.annualBonus)}</td>
                  <td className="py-2.5 px-2 text-right text-gray-800">{fmt(emp.bonusCalc)}</td>
                  <td className="py-2.5 px-2 text-right text-gray-800">{fmt(emp.basePay)}</td>
                  <td className="py-2.5 px-2 text-right text-gray-800">{fmt(emp.monthSeverance)}</td>
                  <td className="py-2.5 px-2 text-right text-gray-800">{emp.months}</td>
                  <td className="py-2.5 px-2 text-right font-medium text-gray-800">{fmt(emp.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
