import { useState } from 'react'

/* ══════════════════════════════════════
   타입
   ══════════════════════════════════════ */
interface LeaveHistorySummary {
  remaining: number; used: number; total: number; generated: number; adjusted: number; expired: number
  hireDate: string; recognizedDate: string
}

interface LeaveMonthly {
  month: string; badge: string; remaining: number; usedReq: number; usedReal: number
  total: number; generated: number; adjusted: number; expired: number
}

/* ══════════════════════════════════════
   휴가내역 뷰
   ══════════════════════════════════════ */
export default function LeaveHistoryView() {
  // TODO: API 연동 → GET /api/attendance/my/leave-history-summary, GET /api/attendance/my/leave-history-monthly
  const [summary] = useState<LeaveHistorySummary>({
    remaining: 0, used: 0, total: 0, generated: 0, adjusted: 0, expired: 0,
    hireDate: '', recognizedDate: '',
  })
  const [monthly] = useState<LeaveMonthly[]>([])
  const [period] = useState('')

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 mb-6">휴가내역</h1>

      {/* 기간 선택 */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <button className="text-gray-400 hover:text-gray-600 transition-colors"><i className="fas fa-chevron-left" /></button>
        <span className="text-[18px] font-bold text-gray-900">{period || '-'}</span>
        <button className="text-gray-400 hover:text-gray-600 transition-colors"><i className="fas fa-chevron-right" /></button>
        <button className="text-[12px] text-gray-500 hover:text-[#1D9E75] ml-2 transition-colors">오늘</button>
      </div>

      {/* 연차현황 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-[15px] font-bold text-gray-900">연차현황</h2>
          {summary.hireDate && <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">입사일 {summary.hireDate}</span>}
          {summary.recognizedDate && <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">인정입사일 {summary.recognizedDate}</span>}
        </div>
        <div className="border border-gray-200 rounded-xl p-5">
          <div className="grid grid-cols-6 text-center">
            {[
              { label: '잔여 연차', value: `${summary.remaining}d`, color: summary.remaining <= 0 ? 'text-red-500' : 'text-[#1D9E75]' },
              { label: '사용(신청)연차', value: `${summary.used}d`, color: 'text-gray-900' },
              { label: '총 연차', value: `${summary.total}d`, color: 'text-gray-900' },
              { label: '발생 연차', value: `${summary.generated}d`, color: 'text-gray-900' },
              { label: '조정 연차', value: `${summary.adjusted}d`, color: 'text-gray-900' },
              { label: '소멸 연차', value: `${summary.expired}d`, color: 'text-gray-900' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-[11px] text-gray-500 mb-1">{s.label}</div>
                <div className={`text-[22px] font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 휴가내역 테이블 */}
      <h2 className="text-[14px] font-bold text-gray-900 mb-3">휴가내역</h2>
      <table className="w-full text-[12px]">
        <thead><tr className="border-b border-gray-200">
          <th className="px-3 py-3 text-gray-500 font-medium text-left">연월</th>
          <th className="px-3 py-3 text-gray-500 font-medium text-left">잔여연차</th>
          <th className="px-3 py-3 text-gray-500 font-medium text-left">사용(신청)연차</th>
          <th className="px-3 py-3 text-gray-500 font-medium text-left">실사용(소진)연차</th>
          <th className="px-3 py-3 text-gray-500 font-medium text-left">총연차</th>
          <th className="px-3 py-3 text-gray-500 font-medium text-left">발생연차</th>
          <th className="px-3 py-3 text-gray-500 font-medium text-left">조정연차</th>
          <th className="px-3 py-3 text-gray-500 font-medium text-left">소멸연차</th>
        </tr></thead>
        <tbody>
          {monthly.map((r, i) => (
            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-3 py-3 text-gray-700">
                <span>{r.month}</span>
                {r.badge && <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded ${r.badge === '발생월' ? 'bg-[#E1F5EE] text-[#1D9E75]' : 'bg-yellow-50 text-yellow-600'}`}>{r.badge}</span>}
              </td>
              <td className={`px-3 py-3 font-semibold ${r.remaining <= 0 ? 'text-red-500' : 'text-[#1D9E75]'}`}>{r.remaining}d</td>
              <td className="px-3 py-3 text-gray-700">{r.usedReq}d</td>
              <td className="px-3 py-3 text-gray-700">{r.usedReal}d</td>
              <td className="px-3 py-3 text-gray-700">{r.total}d</td>
              <td className="px-3 py-3 text-gray-700">{r.generated}d</td>
              <td className="px-3 py-3 text-gray-700">{r.adjusted}d</td>
              <td className="px-3 py-3 text-gray-700">{r.expired}d</td>
            </tr>
          ))}
          {monthly.length === 0 && (
            <tr><td colSpan={8} className="py-8 text-center text-[13px] text-gray-400">휴가 내역이 없습니다</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
