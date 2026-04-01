import { useState } from 'react'

function fmt(n: number) { return n.toLocaleString() }

type PensionType = 'severance' | 'DB' | 'DC'

interface EstimateEmployee {
  name: string; dept: string; rank: string; hireDate: string
  avg3m: number; annualBonus: number; bonusCalc: number; basePay: number; monthSeverance: number; months: number; total: number
  pensionType: PensionType
}

const MOCK_DATA: EstimateEmployee[] = [
  { name: '김민수', dept: '개발팀', rank: '대리', hireDate: '2022-03-02', avg3m: 4000000, annualBonus: 0, bonusCalc: 0, basePay: 1333333, monthSeverance: 1333333, months: 48, total: 16000000, pensionType: 'severance' },
  { name: '이서연', dept: '인사팀', rank: '과장', hireDate: '2020-07-15', avg3m: 4666667, annualBonus: 0, bonusCalc: 0, basePay: 1555556, monthSeverance: 1555556, months: 69, total: 26833333, pensionType: 'severance' },
  { name: '정하은', dept: '재무팀', rank: '차장', hireDate: '2018-04-20', avg3m: 5333333, annualBonus: 3500000, bonusCalc: 291667, basePay: 1875000, monthSeverance: 1875000, months: 96, total: 45000000, pensionType: 'DB' },
  { name: '윤재혁', dept: '개발팀', rank: '부장', hireDate: '2015-02-16', avg3m: 6500000, annualBonus: 3500000, bonusCalc: 291667, basePay: 2263889, monthSeverance: 2263889, months: 134, total: 75833333, pensionType: 'DB' },
  { name: '최유진', dept: '영업팀', rank: '주임', hireDate: '2021-11-10', avg3m: 3500000, annualBonus: 0, bonusCalc: 0, basePay: 1166667, monthSeverance: 1166667, months: 53, total: 0, pensionType: 'DC' },
]

export default function SeveranceEstimate() {
  const [baseDate, setBaseDate] = useState('2026-04-01')
  const [typeFilter, setTypeFilter] = useState<'all' | PensionType>('all')

  // DC형은 제외, 유형 필터 적용
  const filtered = MOCK_DATA.filter(e => {
    if (e.pensionType === 'DC') return false
    if (typeFilter !== 'all' && e.pensionType !== typeFilter) return false
    return true
  })
  const totalEstimate = filtered.reduce((a, e) => a + e.total, 0)

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
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as 'all' | PensionType)} className="border border-gray-200 rounded px-2.5 py-1.5 outline-none">
            <option value="all">전체 유형</option>
            <option value="severance">퇴직금</option>
            <option value="DB">DB형</option>
          </select>
          <input type="text" placeholder="사원명을 입력하세요.." className="border border-gray-200 rounded px-2.5 py-1.5 outline-none w-44" />
          <button className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50"><i className="fas fa-search text-[10px] mr-1" />조회</button>
        </div>

        <div className="bg-blue-50 rounded-lg p-3 mb-4 text-[11px] text-blue-700 space-y-0.5">
          <p>• <strong>퇴직금(severance)</strong>: 회사가 지급해야 할 부채 → 추계액 계산 필수 (회계상 충당금)</p>
          <p>• <strong>DB형</strong>: 금융기관에 적립 중 → 추계액 표시하되 "DB형" 표기</p>
          <p>• <strong>DC형</strong>: 이미 납입 완료 = 회사 부채 아님 → 목록 제외</p>
        </div>

        <div className="flex items-center gap-8 mb-4 text-xs">
          <span className="text-gray-600">사원 <span className="text-lg font-bold text-gray-800 ml-1">{filtered.length}</span> 명</span>
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
                <th className="py-2.5 px-2 text-center font-medium text-gray-500">유형</th>
                <th className="py-2.5 px-2 text-left font-medium text-gray-500">입사일</th>
                <th className="py-2.5 px-2 text-right font-medium text-gray-500">3개월 전 총 급...</th>
                <th className="py-2.5 px-2 text-right font-medium text-gray-500">연간상여액<br/>[B]</th>
                <th className="py-2.5 px-2 text-right font-medium text-gray-500">상여금가산금<br/>[C=Bx3/12]</th>
                <th className="py-2.5 px-2 text-right font-medium text-gray-500">기준급여<br/>[D=(A+C)/3]</th>
                <th className="py-2.5 px-2 text-right font-medium text-gray-500">월퇴직금산출액<br/>[E=D/12]</th>
                <th className="py-2.5 px-2 text-right font-medium text-gray-500">근무개월수<br/>[F]</th>
                <th className="py-2.5 px-2 text-right font-medium text-gray-500">퇴직금추계액<br/>[G=ExF]</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-2"><input type="checkbox" className="w-3 h-3" /></td>
                  <td className="py-2.5 px-2 text-gray-700">{emp.name}</td>
                  <td className="py-2.5 px-2 text-gray-600">{emp.dept}</td>
                  <td className="py-2.5 px-2 text-gray-600">{emp.rank}</td>
                  <td className="py-2.5 px-2 text-center">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      emp.pensionType === 'severance' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
                    }`}>{emp.pensionType === 'severance' ? '퇴직금' : emp.pensionType + '형'}</span>
                  </td>
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
              {filtered.length > 0 && (
                <tr className="bg-gray-50 border-t border-gray-300 font-medium">
                  <td className="py-2.5 px-2" />
                  <td className="py-2.5 px-2 text-gray-800" colSpan={4}>합계</td>
                  <td className="py-2.5 px-2" />
                  <td className="py-2.5 px-2 text-right text-gray-800">{fmt(filtered.reduce((a, e) => a + e.avg3m, 0))}</td>
                  <td className="py-2.5 px-2 text-right text-gray-800">{fmt(filtered.reduce((a, e) => a + e.annualBonus, 0))}</td>
                  <td className="py-2.5 px-2 text-right text-gray-800">{fmt(filtered.reduce((a, e) => a + e.bonusCalc, 0))}</td>
                  <td className="py-2.5 px-2 text-right text-gray-800">{fmt(filtered.reduce((a, e) => a + e.basePay, 0))}</td>
                  <td className="py-2.5 px-2 text-right text-gray-800">{fmt(filtered.reduce((a, e) => a + e.monthSeverance, 0))}</td>
                  <td className="py-2.5 px-2" />
                  <td className="py-2.5 px-2 text-right font-bold text-gray-800">{fmt(totalEstimate)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
