import { useState } from 'react'

/* ══════════════════════════════════════
   타입
   ══════════════════════════════════════ */
interface CorrectionRecord {
  id: number; name: string; dept: string; date: string; type: string
  before: string; after: string; reason: string; status: string; appliedAt: string
}

/* ══════════════════════════════════════
   정정 관리 탭
   ══════════════════════════════════════ */
export default function HrCorrectionTab() {
  const [filter, setFilter] = useState('전체')
  // TODO: GET /api/attendance/hr/correction-requests?status=&search=&page=0&size=50
  const [records] = useState<CorrectionRecord[]>([])
  const filtered = filter === '전체' ? records : records.filter((d) => d.status === filter)
  const statusColor: Record<string, string> = { '승인대기': 'bg-yellow-50 text-yellow-600', '승인완료': 'bg-gray-100 text-gray-600', '반려': 'bg-red-50 text-red-500' }

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 mb-4">정정 관리</h1>
      <div className="flex items-center gap-2 mb-4">
        {['전체', '승인대기', '승인완료', '반려'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 text-[12px] rounded-full transition-colors ${filter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
        ))}
      </div>
      <table className="w-full text-[12px]">
        <thead><tr className="border-b-2 border-gray-900">
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">신청자</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">대상일</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">정정 유형</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">변경 전</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">변경 후</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사유</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">신청일</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">상태</th>
          <th className="px-3 py-2.5 text-right text-gray-700 font-medium">처리</th>
        </tr></thead>
        <tbody>
          {filtered.map((d) => (
            <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2.5 text-gray-800 font-medium">{d.name}</td>
              <td className="px-3 py-2.5 text-gray-600">{d.dept}</td>
              <td className="px-3 py-2.5 text-gray-600">{d.date}</td>
              <td className="px-3 py-2.5 text-gray-700">{d.type}</td>
              <td className="px-3 py-2.5 text-gray-400">{d.before}</td>
              <td className="px-3 py-2.5 text-[#1D9E75] font-medium">{d.after}</td>
              <td className="px-3 py-2.5 text-gray-600 max-w-[200px] truncate" title={d.reason}>{d.reason}</td>
              <td className="px-3 py-2.5 text-gray-500">{d.appliedAt}</td>
              <td className="px-3 py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${statusColor[d.status] ?? ''}`}>{d.status}</span></td>
              <td className="px-3 py-2.5 text-right">
                {d.status === '승인대기' && (<>
                  <button className="text-[11px] text-[#1D9E75] hover:underline mr-2">승인</button>
                  <button className="text-[11px] text-red-500 hover:underline">반려</button>
                </>)}
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={10} className="py-8 text-center text-[13px] text-gray-400">정정 신청 내역이 없습니다</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
