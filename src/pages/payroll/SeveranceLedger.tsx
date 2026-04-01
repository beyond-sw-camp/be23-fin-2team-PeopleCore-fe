import { useState } from 'react'

export default function SeveranceLedger() {
  const [yearMonth, setYearMonth] = useState('2026-04')

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb]">
      <div className="max-w-[1300px] mx-auto">
        <div className="text-xs text-gray-400 mb-1">급여관리 &gt; 퇴직급여 &gt; 퇴직금대장(작성)</div>
        <h1 className="text-lg font-bold text-gray-800 mb-1">퇴직금대장(작성)</h1>
        <p className="text-xs text-gray-500 mb-5">퇴직자의 퇴직금을 산정하고 관리합니다.</p>

        <div className="flex items-center gap-3 mb-5 text-xs">
          <input type="month" value={yearMonth} onChange={e => setYearMonth(e.target.value)} className="border border-gray-200 rounded px-2.5 py-1.5 outline-none" />
          <input type="text" placeholder="사원명을 입력하세요.." className="border border-gray-200 rounded px-2.5 py-1.5 outline-none w-44" />
          <button className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50"><i className="fas fa-search text-[10px] mr-1" />조회</button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-xs min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-2.5 px-3 text-left w-8"><input type="checkbox" className="w-3 h-3" /></th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">사원명</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">부서</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">직위</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">입사일</th>
                <th className="py-2.5 px-3 text-left font-medium text-gray-500">퇴사일</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">근속연수</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">3개월 평균급여</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">퇴직금액</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">세액</th>
                <th className="py-2.5 px-3 text-right font-medium text-gray-500">실지급액</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">상태</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={12} className="py-12 text-center text-gray-400">검색된 결과가 없습니다.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
