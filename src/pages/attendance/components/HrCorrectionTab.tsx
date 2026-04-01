import { useState } from 'react'

/* ══════════════════════════════════════
   Mock 데이터
   ══════════════════════════════════════ */
const HR_CORRECTION_MOCK = [
  { id: 1, name: '권시정', dept: '경영', date: '2026-03-25', type: '출근 누락', before: '-', after: '09:05', reason: '단말기 오류로 출근 미기록', status: '승인대기', appliedAt: '2026-03-26' },
  { id: 2, name: '한도윤', dept: '개발', date: '2026-03-20', type: '퇴근 누락', before: '-', after: '18:30', reason: '퇴근 버튼 미클릭', status: '승인대기', appliedAt: '2026-03-21' },
  { id: 3, name: '이수진', dept: '경영', date: '2026-03-18', type: '지각 → 정상', before: '지각', after: '정상', reason: '외부 미팅 후 출근 (사전 승인)', status: '승인완료', appliedAt: '2026-03-19' },
]

/* ══════════════════════════════════════
   정정 탭
   ══════════════════════════════════════ */
export default function HrCorrectionTab() {
  const [filter, setFilter] = useState('전체')
  const filtered = filter === '전체' ? HR_CORRECTION_MOCK : HR_CORRECTION_MOCK.filter((d) => d.status === filter)
  const statusColor: Record<string, string> = { '승인대기': 'bg-yellow-50 text-yellow-600', '승인완료': 'bg-gray-100 text-gray-600', '반려': 'bg-red-50 text-red-500' }

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 mb-4">근태 정정</h1>
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
              <td className="px-3 py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${statusColor[d.status] ?? ''}`}>{d.status}</span></td>
              <td className="px-3 py-2.5 text-right">
                {d.status === '승인대기' && (<>
                  <button className="text-[11px] text-[#1D9E75] hover:underline mr-2">승인</button>
                  <button className="text-[11px] text-red-500 hover:underline">반려</button>
                </>)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
