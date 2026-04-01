import { useState } from 'react'

/* ══════════════════════════════════════
   Mock 데이터
   ══════════════════════════════════════ */
export const HR_OVERTIME_MOCK = [
  { id: 1, name: '박서준', dept: '개발', type: '연장근무', date: '2026-03-28', hours: '2h', status: '승인대기', reason: '프로젝트 마감' },
  { id: 2, name: '이민호', dept: '개발', type: '야간근무', date: '2026-03-27', hours: '3h', status: '승인대기', reason: '서버 배포' },
  { id: 3, name: '강희계', dept: '경영', type: '휴일근무', date: '2026-03-29', hours: '8h', status: '승인완료', reason: '결산 마감' },
  { id: 4, name: '최예린', dept: '개발', type: '연장근무', date: '2026-03-26', hours: '1.5h', status: '승인완료', reason: '버그 수정' },
]

/* ══════════════════════════════════════
   초과근무 탭
   ══════════════════════════════════════ */
export default function HrOvertimeTab() {
  const [filter, setFilter] = useState('전체')
  const filtered = filter === '전체' ? HR_OVERTIME_MOCK : HR_OVERTIME_MOCK.filter((d) => d.status === filter)
  const statusColor: Record<string, string> = { '승인대기': 'bg-yellow-50 text-yellow-600', '승인완료': 'bg-gray-100 text-gray-600', '반려': 'bg-red-50 text-red-500' }
  const typeColor: Record<string, string> = { '연장근무': 'bg-purple-50 text-purple-600', '야간근무': 'bg-blue-50 text-blue-600', '휴일근무': 'bg-orange-50 text-orange-600' }

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 mb-4">초과근무 관리</h1>
      <div className="flex items-center gap-2 mb-4">
        {['전체', '승인대기', '승인완료', '반려'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 text-[12px] rounded-full transition-colors ${filter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
        ))}
      </div>
      <table className="w-full text-[12px]">
        <thead><tr className="border-b-2 border-gray-900">
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">신청자</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">유형</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">날짜</th>
          <th className="px-3 py-2.5 text-right text-gray-700 font-medium">시간</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사유</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">상태</th>
        </tr></thead>
        <tbody>
          {filtered.map((d) => (
            <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2.5 text-gray-800 font-medium">{d.name}</td>
              <td className="px-3 py-2.5 text-gray-600">{d.dept}</td>
              <td className="px-3 py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${typeColor[d.type] ?? ''}`}>{d.type}</span></td>
              <td className="px-3 py-2.5 text-gray-600">{d.date}</td>
              <td className="px-3 py-2.5 text-right text-gray-700 font-semibold">{d.hours}</td>
              <td className="px-3 py-2.5 text-gray-600">{d.reason}</td>
              <td className="px-3 py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${statusColor[d.status] ?? ''}`}>{d.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
