import { useState } from 'react'
import StatusBadge from './StatusBadge'
import { LEAVE_SUMMARY, LEAVE_POLICY } from './attendanceMockData'

/* ══════════════════════════════════════
   타입
   ══════════════════════════════════════ */
interface LeaveRecord {
  id: number
  status: '완료' | '진행중' | '대기' | '취소'
  type: string
  days: number
  dateRange: string
  isPast: boolean
}

/* ══════════════════════════════════════
   휴가현황 뷰
   ══════════════════════════════════════ */
export default function LeaveStatusView({ onOpenApply: _onOpenApply }: { onOpenApply: () => void }) {
  // TODO: API 연동 → GET /api/attendance/my/leave-summary, GET /api/attendance/my/leave-records
  // TODO: 캘린더 완성 후 예정휴가 데이터를 캘린더 모듈에 자동 연동 (upcomingLeaves → 캘린더 이벤트)
  const [upcomingLeaves] = useState<LeaveRecord[]>([])
  const [pastLeaves] = useState<LeaveRecord[]>([])

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 mb-4">휴가현황</h1>

      {/* 연차/월차 현황 */}
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[14px] font-bold text-gray-900">{LEAVE_SUMMARY.years < 1 ? '월차' : '연차'} 현황</h2>
        {LEAVE_SUMMARY.years < 1 && <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-blue-50 text-blue-600">월차</span>}
      </div>
      <div className="border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="text-[13px] text-gray-700">{LEAVE_SUMMARY.period}</div>
            <div className="text-[11px] text-gray-400">{LEAVE_POLICY === '입사일' ? '입사일 기준' : '회계연도 기준'}</div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {/* 프로그레스 바 영역 */}
          <div className="w-[280px] shrink-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1">
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-3 rounded-full ${LEAVE_SUMMARY.remaining <= 0 ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-[#1D9E75] to-[#4fc3a0]'}`} style={{ width: `${Math.min(LEAVE_SUMMARY.usedPercent, 100)}%` }} />
                </div>
              </div>
            </div>
            <span className={`text-[11px] font-medium ${LEAVE_SUMMARY.remaining <= 0 ? 'text-red-500' : 'text-[#1D9E75]'}`}>{LEAVE_SUMMARY.years < 1 ? '월차' : '연차'}를 {LEAVE_SUMMARY.usedPercent}% 소진했습니다.</span>
            <div className="text-[11px] text-gray-400">소진률 {LEAVE_SUMMARY.usedPercent}% ({LEAVE_SUMMARY.used}/{LEAVE_SUMMARY.total})</div>
          </div>
          {/* 구분선 */}
          <div className="h-12 border-r border-gray-200" />
          {/* 수치 영역 */}
          <div className="flex flex-1">
            {[
              { label: LEAVE_SUMMARY.years < 1 ? '잔여 월차' : '잔여 연차', value: `${LEAVE_SUMMARY.remaining}d`, color: LEAVE_SUMMARY.remaining <= 0 ? 'text-red-500' : 'text-[#1D9E75]' },
              { label: LEAVE_SUMMARY.years < 1 ? '사용 월차' : '사용 연차', value: `${LEAVE_SUMMARY.used}d`, color: 'text-gray-900' },
              { label: LEAVE_SUMMARY.years < 1 ? '총 월차' : '총 연차', value: `${LEAVE_SUMMARY.total}d`, color: 'text-gray-900' },
              { label: '근속연수', value: `${LEAVE_SUMMARY.years}년`, color: 'text-gray-900' },
              { label: '소멸 연차', value: `${LEAVE_SUMMARY.expired}d`, color: 'text-gray-500' },
              { label: '소멸 예정', value: `${LEAVE_SUMMARY.willExpire}d`, color: LEAVE_SUMMARY.willExpire > 0 ? 'text-orange-500' : 'text-gray-500' },
            ].map((s, i, arr) => (
              <div key={s.label} className={`text-center flex-1 ${i < arr.length - 1 ? 'border-r border-gray-200' : ''}`}>
                <div className="text-[11px] text-gray-500 mb-1">{s.label}</div>
                <div className={`text-[20px] font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
        {LEAVE_SUMMARY.willExpire > 0 && (
          <div className="mt-3 px-3 py-2 bg-orange-50 rounded-lg text-[11px] text-orange-600">
            <i className="fas fa-exclamation-triangle mr-1" />
            {LEAVE_SUMMARY.expireDate} 까지 미사용 시 {LEAVE_SUMMARY.willExpire}일이 소멸됩니다.
          </div>
        )}
      </div>

      {/* 예정휴가 + 지난휴가 */}
      <div className="grid grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-xl p-5">
          <h3 className="text-[14px] font-bold text-gray-900 mb-3">예정휴가</h3>
          <table className="w-full text-[12px]">
            <thead><tr className="border-b border-gray-200">
              <th className="py-2 text-gray-500 font-medium text-left">상태</th>
              <th className="py-2 text-gray-500 font-medium text-left">휴가 종류</th>
              <th className="py-2 text-gray-500 font-medium text-left">휴가 일수</th>
              <th className="py-2 text-gray-500 font-medium text-left">휴가 기간</th>
            </tr></thead>
            <tbody>
              {upcomingLeaves.map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="py-2"><StatusBadge status={r.status} /></td>
                  <td className="py-2 text-gray-700">{r.type}</td>
                  <td className="py-2 text-gray-600">{r.days}d</td>
                  <td className="py-2 text-gray-600 whitespace-pre-line">{r.dateRange}</td>
                </tr>
              ))}
              {upcomingLeaves.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-[13px] text-gray-400">예정된 휴가가 없습니다</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-bold text-gray-900">지난휴가</h3>
            <button className="text-[12px] text-gray-500 hover:text-[#1D9E75] transition-colors">더보기 &gt;</button>
          </div>
          <table className="w-full text-[12px]">
            <thead><tr className="border-b border-gray-200">
              <th className="py-2 text-gray-500 font-medium text-left">상태</th>
              <th className="py-2 text-gray-500 font-medium text-left">휴가 종류</th>
              <th className="py-2 text-gray-500 font-medium text-left">휴가 일수</th>
              <th className="py-2 text-gray-500 font-medium text-left">휴가 기간</th>
            </tr></thead>
            <tbody>
              {pastLeaves.slice(0, 8).map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="py-2"><StatusBadge status={r.status} /></td>
                  <td className="py-2 text-gray-700">{r.type}</td>
                  <td className="py-2 text-gray-600">{r.days}d</td>
                  <td className="py-2 text-gray-600 whitespace-pre-line">{r.dateRange}</td>
                </tr>
              ))}
              {pastLeaves.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-[13px] text-gray-400">지난 휴가가 없습니다</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
