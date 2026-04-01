import { useState } from 'react'

// insurance_rates 테이블 기준 요율 (2026년)
const RATES = {
  nationalPension: 0.045,      // 국민연금 4.5% (근로자)
  healthInsurance: 0.03545,     // 건강보험 3.545% (근로자)
  longTermCare: 0.1281,         // 장기요양 건강보험의 12.81%
  employmentInsurance: 0.009,   // 고용보험 0.9% (근로자) - 관리자 설정
  industrialAccident: 0.007,    // 산재보험 0.7% (사업주 전액) - 관리자 설정
  // 사업주 부담
  employer_nationalPension: 0.045,
  employer_healthInsurance: 0.03545,
  employer_longTermCare: 0.1281,
  employer_employmentInsurance: 0.0135, // 고용보험 사업주 1.35%
}

const MOCK_EMPLOYEES = [
  { name: '김민수', dept: '개발팀', rank: '대리', monthlySalary: 4000000 },
  { name: '이서연', dept: '인사팀', rank: '과장', monthlySalary: 4666667 },
  { name: '박지훈', dept: '마케팅팀', rank: '사원', monthlySalary: 3000000 },
  { name: '최유진', dept: '영업팀', rank: '주임', monthlySalary: 3500000 },
  { name: '정하은', dept: '재무팀', rank: '차장', monthlySalary: 5333333 },
  { name: '한승우', dept: '개발팀', rank: '사원', monthlySalary: 2333333 },
  { name: '윤재혁', dept: '개발팀', rank: '부장', monthlySalary: 6500000 },
]

function fmt(n: number) { return Math.round(n).toLocaleString() }

function calcInsurance(salary: number) {
  const np = salary * RATES.nationalPension
  const hi = salary * RATES.healthInsurance
  const ltc = hi * RATES.longTermCare
  const ei = salary * RATES.employmentInsurance
  const workerTotal = np + hi + ltc + ei

  const emp_np = salary * RATES.employer_nationalPension
  const emp_hi = salary * RATES.employer_healthInsurance
  const emp_ltc = emp_hi * RATES.employer_longTermCare
  const emp_ei = salary * RATES.employer_employmentInsurance
  const emp_ia = salary * RATES.industrialAccident
  const employerTotal = emp_np + emp_hi + emp_ltc + emp_ei + emp_ia

  return { np, hi, ltc, ei, ia: 0, workerTotal, emp_np, emp_hi, emp_ltc, emp_ei, emp_ia, employerTotal }
}

export default function InsuranceSettle() {
  const [year, setYear] = useState('2026')
  const [month, setMonth] = useState('04')
  const [searched, setSearched] = useState(false)

  const handleSearch = () => setSearched(true)

  const data = searched ? MOCK_EMPLOYEES.map(e => ({ ...e, ...calcInsurance(e.monthlySalary) })) : []

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb]">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-xs text-gray-400 mb-1">급여관리 &gt; 사회보험 &gt; 정산보험료</div>
        <h1 className="text-lg font-bold text-gray-800 mb-1">정산보험료</h1>
        <p className="text-xs text-gray-500 mb-5">사회보험 정산 내역을 관리합니다.</p>

        {/* 필터 */}
        <div className="flex items-center gap-3 mb-5 text-xs">
          <span className="text-gray-500">정산연/월</span>
          <select value={year} onChange={e => { setYear(e.target.value); setSearched(false) }} className="border border-gray-200 rounded px-2.5 py-1.5 outline-none">
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
          <select value={month} onChange={e => { setMonth(e.target.value); setSearched(false) }} className="border border-gray-200 rounded px-2.5 py-1.5 outline-none">
            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
          <input type="text" placeholder="사원명을 입력하세요.." className="border border-gray-200 rounded px-2.5 py-1.5 outline-none w-44" />
          <button onClick={handleSearch} className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50"><i className="fas fa-search text-[10px] mr-1" />조회</button>
        </div>

        {/* 요율 정보 */}
        {searched && (
          <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 flex items-center gap-6 text-xs text-gray-500">
            <span>국민연금 {(RATES.nationalPension * 100).toFixed(1)}%</span>
            <span>건강보험 {(RATES.healthInsurance * 100).toFixed(3)}%</span>
            <span>장기요양 건강보험의 {(RATES.longTermCare * 100).toFixed(2)}%</span>
            <span>고용보험(근로자) {(RATES.employmentInsurance * 100).toFixed(1)}%</span>
            <span>고용보험(사업주) {(RATES.employer_employmentInsurance * 100).toFixed(2)}%</span>
            <span>산재보험 {(RATES.industrialAccident * 100).toFixed(1)}%</span>
          </div>
        )}

        {/* 테이블 */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-xs min-w-[1200px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">사원명</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">부서</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">보수월액</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">국민연금</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">건강보험</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">장기요양</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">고용보험</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">산재</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500 bg-blue-50">근로자부담합계</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500 bg-green-50">사업주부담합계</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? data.map((emp, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3 text-gray-700">{emp.name}</td>
                  <td className="py-2.5 px-3 text-gray-600">{emp.dept}</td>
                  <td className="py-2.5 px-3 text-right text-gray-800">{fmt(emp.monthlySalary)}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700">{fmt(emp.np)}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700">{fmt(emp.hi)}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700">{fmt(emp.ltc)}</td>
                  <td className="py-2.5 px-3 text-right text-gray-700">{fmt(emp.ei)}</td>
                  <td className="py-2.5 px-3 text-right text-gray-400">-</td>
                  <td className="py-2.5 px-3 text-right font-medium text-blue-700 bg-blue-50/50">{fmt(emp.workerTotal)}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-green-700 bg-green-50/50">{fmt(emp.employerTotal)}</td>
                </tr>
              )) : (
                <tr><td colSpan={10} className="py-12 text-center text-gray-400">검색된 결과가 없습니다.</td></tr>
              )}
              {data.length > 0 && (
                <tr className="bg-gray-50 border-t border-gray-300 font-medium">
                  <td className="py-2.5 px-3 text-gray-800" colSpan={2}>합계</td>
                  <td className="py-2.5 px-3 text-right text-gray-800">{fmt(data.reduce((a, e) => a + e.monthlySalary, 0))}</td>
                  <td className="py-2.5 px-3 text-right text-gray-800">{fmt(data.reduce((a, e) => a + e.np, 0))}</td>
                  <td className="py-2.5 px-3 text-right text-gray-800">{fmt(data.reduce((a, e) => a + e.hi, 0))}</td>
                  <td className="py-2.5 px-3 text-right text-gray-800">{fmt(data.reduce((a, e) => a + e.ltc, 0))}</td>
                  <td className="py-2.5 px-3 text-right text-gray-800">{fmt(data.reduce((a, e) => a + e.ei, 0))}</td>
                  <td className="py-2.5 px-3 text-right text-gray-400">-</td>
                  <td className="py-2.5 px-3 text-right font-bold text-blue-700 bg-blue-50/50">{fmt(data.reduce((a, e) => a + e.workerTotal, 0))}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-green-700 bg-green-50/50">{fmt(data.reduce((a, e) => a + e.employerTotal, 0))}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
