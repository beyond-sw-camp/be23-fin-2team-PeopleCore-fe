import { useState } from 'react'

type Tab = 'acquire' | 'loss'

export default function InsuranceReport() {
  const [activeTab, setActiveTab] = useState<Tab>('acquire')
  const [startDate, setStartDate] = useState('2026-03-01')
  const [endDate, setEndDate] = useState('2026-04-01')

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#f9fafb]">
      <div className="max-w-[1300px] mx-auto">
        <div className="text-xs text-gray-400 mb-1">급여관리 &gt; 사회보험 &gt; 신고대상 조회</div>
        <h1 className="text-lg font-bold text-gray-800 mb-1">신고대상 조회</h1>
        <p className="text-xs text-gray-500 mb-5">사원 입퇴사에 따른 신고대상정보를 참고할 수 있습니다.</p>

        {/* 필터 */}
        <div className="flex items-center gap-3 mb-4 text-xs">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border border-gray-200 rounded px-2.5 py-1.5 outline-none" />
          <span className="text-gray-400">~</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border border-gray-200 rounded px-2.5 py-1.5 outline-none" />
          <select className="border border-gray-200 rounded px-2.5 py-1.5 outline-none">
            <option>전체</option>
          </select>
          <input type="text" placeholder="사원명을 입력하세요.." className="border border-gray-200 rounded px-2.5 py-1.5 outline-none w-44" />
          <button className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50"><i className="fas fa-search text-[10px] mr-1" />조회</button>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-gray-200 mb-5">
          <button onClick={() => setActiveTab('acquire')} className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === 'acquire' ? 'border-gray-800 text-gray-800' : 'border-transparent text-gray-400'}`}>취득</button>
          <button onClick={() => setActiveTab('loss')} className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${activeTab === 'loss' ? 'border-gray-800 text-gray-800' : 'border-transparent text-gray-400'}`}>상실</button>
        </div>

        <div className="flex items-center justify-between mb-3 text-xs">
          <p className="text-gray-500">취득신고대상 목록 <span className="text-gray-400">※ 조회일 기준, 사회보험 공단에 취득일이 신고되지 않은 사원 목록입니다.</span></p>
          <button className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50">사회보험 취득신고 바로가기</button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-xs min-w-[1100px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">직원구분</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">사원명</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">부서</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">임원</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">입사일(자격...)</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">국민연금 취득일자</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">건강보험 취득일자</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">고용보험 취득일자</th>
                <th className="py-2.5 px-3 text-center font-medium text-gray-500">산재보험 취득일자</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colSpan={9} className="py-12 text-center text-gray-400">조회된 취득신고대상이 없습니다.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
