import { useState } from 'react'

export default function LeaveRuleView() {
  const [rules] = useState([
    { id: 1, minYears: 0, maxYears: 1, days: 1, desc: '월 1일 (월차)' },
    { id: 2, minYears: 1, maxYears: 3, days: 15, desc: '' },
    { id: 3, minYears: 3, maxYears: 5, days: 16, desc: '' },
    { id: 4, minYears: 5, maxYears: 7, days: 17, desc: '' },
    { id: 5, minYears: 7, maxYears: null as number | null, days: 20, desc: '' },
  ])

  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">연차 발생 규칙 설정</h3>
      <p className="text-[12px] text-gray-400 mb-5">근속연수별 연차 발생일수 규칙을 정의합니다</p>

      <div className="flex justify-end mb-4">
        <button className="px-3 py-1.5 text-[11px] border border-gray-300 rounded hover:bg-gray-50">규칙 추가</button>
      </div>

      <table className="w-full text-[12px]">
        <thead><tr className="border-b-2 border-gray-900">
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">근속연수 (이상)</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">근속연수 (미만)</th>
          <th className="px-3 py-2.5 text-right text-gray-700 font-medium">발생 연차</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">비고</th>
          <th className="px-3 py-2.5 text-right text-gray-700 font-medium">관리</th>
        </tr></thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2.5 text-gray-800">{r.minYears}년</td>
              <td className="px-3 py-2.5 text-gray-600">{r.maxYears !== null ? `${r.maxYears}년` : '무제한'}</td>
              <td className="px-3 py-2.5 text-right text-[#1D9E75] font-semibold">{r.days}일</td>
              <td className="px-3 py-2.5 text-gray-500">{r.desc}</td>
              <td className="px-3 py-2.5 text-right">
                <button className="text-[11px] text-[#1D9E75] hover:underline mr-2">수정</button>
                <button className="text-[11px] text-red-500 hover:underline">삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mt-6">
        <button className="px-5 py-2 bg-[#1D9E75] text-white text-[13px] font-medium rounded-lg hover:bg-[#178a65] transition-colors">저장</button>
      </div>
    </div>
  )
}
