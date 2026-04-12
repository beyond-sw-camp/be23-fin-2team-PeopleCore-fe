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
  const [records] = useState<OvertimeRecord[]>([
    { id: 1, name: '김민수', dept: '개발팀', type: '연장근무', date: '2026-04-10', hours: '2h 30m', status: '승인대기', reason: '프로젝트 마감 대응' },
    { id: 2, name: '이서연', dept: '개발팀', type: '야간근무', date: '2026-04-09', hours: '3h 00m', status: '승인완료', reason: '서버 긴급 점검' },
    { id: 3, name: '박지훈', dept: '개발팀', type: '연장근무', date: '2026-04-08', hours: '1h 30m', status: '승인완료', reason: '릴리즈 준비' },
    { id: 4, name: '최유진', dept: '인사팀', type: '연장근무', date: '2026-04-07', hours: '2h 00m', status: '반려', reason: '개인 사유', },
    { id: 5, name: '정하늘', dept: '인사팀', type: '휴일근무', date: '2026-04-05', hours: '4h 00m', status: '승인완료', reason: '채용 행사 진행' },
    { id: 6, name: '강도윤', dept: '마케팅팀', type: '연장근무', date: '2026-04-11', hours: '1h 00m', status: '승인대기', reason: '캠페인 기획 마무리' },
    { id: 7, name: '윤서현', dept: '마케팅팀', type: '야간근무', date: '2026-04-06', hours: '2h 45m', status: '승인완료', reason: '광고 소재 최종 검수' },
    { id: 8, name: '임재호', dept: '영업팀', type: '휴일근무', date: '2026-04-04', hours: '5h 00m', status: '승인완료', reason: '고객사 주말 미팅' },
    { id: 9, name: '한소희', dept: '영업팀', type: '연장근무', date: '2026-04-10', hours: '1h 45m', status: '승인대기', reason: '견적서 작성' },
    { id: 10, name: '오준혁', dept: '기획팀', type: '연장근무', date: '2026-04-09', hours: '2h 15m', status: '반려', reason: '사전 결재 누락' },
    { id: 11, name: '신예린', dept: '기획팀', type: '야간근무', date: '2026-04-08', hours: '3h 30m', status: '승인완료', reason: '분기 전략 회의 준비' },
    { id: 12, name: '조태민', dept: '개발팀', type: '연장근무', date: '2026-04-11', hours: '2h 00m', status: '승인대기', reason: '버그 수정' },
  ])
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
