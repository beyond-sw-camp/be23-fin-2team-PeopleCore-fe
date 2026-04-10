import { useState } from 'react'

/* ══════════════════════════════════════
   타입
   ══════════════════════════════════════ */
interface OvertimeRecord {
  id: number; name: string; dept: string; type: string; date: string; hours: string; status: string; reason: string
}

/* ══════════════════════════════════════
   초과근무 탭
   ══════════════════════════════════════ */
export default function HrOvertimeTab() {
  const [filter, setFilter] = useState('전체')
  // TODO: GET /api/attendance/hr/overtime-requests?status=&page=0&size=50
  const [records] = useState<OvertimeRecord[]>([])
  const filtered = filter === '전체' ? records : records.filter((d) => d.status === filter)
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
