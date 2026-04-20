import { useEffect, useMemo, useState } from 'react'
import StatusBadge from './StatusBadge'
import {
  vacationApi,
  type VacationBalanceResponse,
  type VacationPromotionNoticeResponse,
  type VacationRequestResponse,
  type VacationRequestStatus,
} from '../../../api/vacation'

/* ══════════════════════════════════════
   유틸
   ══════════════════════════════════════ */
const STATUS_LABEL_MAP: Record<VacationRequestStatus, '진행중' | '완료' | '대기' | '취소'> = {
  PENDING: '대기',
  APPROVED: '완료',
  REJECTED: '취소',
  CANCELED: '취소',
}

function formatPeriod(startAt: string, endAt: string): string {
  const s = startAt.slice(0, 10)
  const e = endAt.slice(0, 10)
  return s === e ? s : `${s} ~ ${e}`
}

/* ══════════════════════════════════════
   휴가현황 뷰
   ══════════════════════════════════════ */
export default function LeaveStatusView({ onOpenApply: _onOpenApply }: { onOpenApply: () => void }) {
  const [balances, setBalances] = useState<VacationBalanceResponse[]>([])
  const [requests, setRequests] = useState<VacationRequestResponse[]>([])
  const [notices, setNotices] = useState<VacationPromotionNoticeResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let aborted = false
    const load = async () => {
      setLoading(true)
      try {
        const [balRes, reqRes, noticeRes] = await Promise.all([
          vacationApi.getMyBalances(),
          vacationApi.getMyRequests({ page: 0, size: 50 }),
          vacationApi.getMyPromotionNotices().catch(() => [] as VacationPromotionNoticeResponse[]),
        ])
        if (aborted) return
        setBalances(balRes)
        setRequests(reqRes.content)
        setNotices(noticeRes)
      } catch {
        // 서버 미응답 시 빈 상태
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    void load()
    return () => { aborted = true }
  }, [])

  const latestNotice = notices.length > 0 ? notices[notices.length - 1] : null

  // 메인 카드: ANNUAL 우선, 없으면 MONTHLY, 없으면 첫 번째
  const mainBalance = useMemo(() => {
    if (balances.length === 0) return null
    return (
      balances.find((b) => b.typeCode === 'ANNUAL')
      ?? balances.find((b) => b.typeCode === 'MONTHLY')
      ?? balances[0]
    )
  }, [balances])

  const otherBalances = useMemo(
    () => balances.filter((b) => b.balanceId !== mainBalance?.balanceId),
    [balances, mainBalance],
  )

  // 예정/지난 휴가 분리
  const today = new Date().toISOString().slice(0, 10)
  const upcomingLeaves = requests.filter((r) => r.startAt.slice(0, 10) >= today)
  const pastLeaves = requests.filter((r) => r.startAt.slice(0, 10) < today)

  const usedPercent = mainBalance && mainBalance.totalDays > 0
    ? Math.round((mainBalance.usedDays / mainBalance.totalDays) * 100)
    : 0

  if (loading) {
    return <div className="py-12 text-center text-[13px] text-gray-400">불러오는 중...</div>
  }

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 mb-4">휴가현황</h1>

      {/* 촉진 통지 배너 */}
      {latestNotice && (
        <div className={`rounded-lg p-4 mb-4 border ${
          latestNotice.noticeStage === 'SECOND'
            ? 'bg-red-50 border-red-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-start gap-3">
            <i className={`fas fa-bullhorn text-[14px] mt-0.5 ${latestNotice.noticeStage === 'SECOND' ? 'text-red-500' : 'text-yellow-600'}`} />
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-gray-800 mb-1">
                연차 사용 촉진 안내 ({latestNotice.noticeStage === 'FIRST' ? '1차' : '2차'})
              </div>
              <div className="text-[12px] text-gray-700">
                {latestNotice.noticeStage === 'FIRST'
                  ? `${latestNotice.noticeSentAt.slice(0, 10)}에 만료 예정 연차 ${latestNotice.targetRemainingDays}일에 대한 사용 계획 제출이 요청되었습니다.`
                  : `만료 예정 연차 ${latestNotice.targetRemainingDays}일에 대해 회사가 사용일자를 지정했습니다.`}
              </div>
              {latestNotice.employeeResponse && (
                <div className="text-[11px] text-gray-600 mt-2 bg-white/60 rounded px-2 py-1.5">
                  <span className="font-semibold">응답: </span>{latestNotice.employeeResponse}
                  {latestNotice.responseUsedDays !== null && ` (${latestNotice.responseUsedDays}일)`}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 메인 잔여 카드 */}
      {mainBalance ? (
        <>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[14px] font-bold text-gray-900">{mainBalance.typeName} 현황</h2>
            {mainBalance.typeCode === 'MONTHLY' && (
              <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-blue-50 text-blue-600">월차</span>
            )}
            {mainBalance.pendingDays > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-yellow-50 text-yellow-600">결재 대기 {mainBalance.pendingDays}일</span>
            )}
          </div>
          <div className="border border-gray-200 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[12px] text-gray-500">
                <span>{mainBalance.balanceYear}년</span>
                <span>·</span>
                <span>{mainBalance.grantedAt} ~ {mainBalance.expiresAt ?? '무기한'}</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-[280px] shrink-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1">
                    <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-3 rounded-full ${mainBalance.availableDays <= 0 ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-[#1D9E75] to-[#4fc3a0]'}`}
                        style={{ width: `${Math.min(usedPercent, 100)}%` }} />
                    </div>
                  </div>
                </div>
                <span className={`text-[11px] font-medium ${mainBalance.availableDays <= 0 ? 'text-red-500' : 'text-[#1D9E75]'}`}>
                  {mainBalance.typeName}를 {usedPercent}% 소진했습니다.
                </span>
                <div className="text-[11px] text-gray-400">소진률 {usedPercent}% ({mainBalance.usedDays}/{mainBalance.totalDays})</div>
              </div>
              <div className="h-12 border-r border-gray-200" />
              <div className="flex flex-1">
                {[
                  { label: '잔여', value: `${mainBalance.availableDays}d`, color: mainBalance.availableDays <= 0 ? 'text-red-500' : 'text-[#1D9E75]' },
                  { label: '사용', value: `${mainBalance.usedDays}d`, color: 'text-gray-900' },
                  { label: '결재 대기', value: `${mainBalance.pendingDays}d`, color: mainBalance.pendingDays > 0 ? 'text-yellow-600' : 'text-gray-500' },
                  { label: '총', value: `${mainBalance.totalDays}d`, color: 'text-gray-900' },
                  { label: '소멸', value: `${mainBalance.expiredDays}d`, color: 'text-gray-500' },
                ].map((s, i, arr) => (
                  <div key={s.label} className={`text-center flex-1 ${i < arr.length - 1 ? 'border-r border-gray-200' : ''}`}>
                    <div className="text-[11px] text-gray-500 mb-1">{s.label}</div>
                    <div className={`text-[20px] font-bold ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="border border-gray-200 rounded-xl p-8 mb-6 text-center text-[13px] text-gray-400">
          부여받은 휴가가 없습니다.
        </div>
      )}

      {/* 기타 휴가 유형 */}
      {otherBalances.length > 0 && (
        <div className="mb-6">
          <h3 className="text-[13px] font-bold text-gray-900 mb-2">기타 휴가</h3>
          <div className="grid grid-cols-3 gap-3">
            {otherBalances.map((b) => (
              <div key={b.balanceId} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-semibold text-gray-800">{b.typeName}</span>
                  <span className="text-[10px] text-gray-400">{b.balanceYear}</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <span className={`text-[18px] font-bold ${b.availableDays <= 0 ? 'text-red-500' : 'text-[#1D9E75]'}`}>{b.availableDays}</span>
                    <span className="text-[11px] text-gray-500"> / {b.totalDays}d</span>
                  </div>
                  {b.pendingDays > 0 && (
                    <span className="text-[10px] text-yellow-600">대기 {b.pendingDays}d</span>
                  )}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  {b.expiresAt ? `${b.expiresAt} 만료` : '무기한'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 예정휴가 + 지난휴가 */}
      <div className="grid grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-xl p-5">
          <h3 className="text-[14px] font-bold text-gray-900 mb-3">예정휴가</h3>
          <table className="w-full text-[12px]">
            <thead><tr className="border-b border-gray-200">
              <th className="py-2 text-gray-500 font-medium text-left">상태</th>
              <th className="py-2 text-gray-500 font-medium text-left">휴가 종류</th>
              <th className="py-2 text-gray-500 font-medium text-left">일수</th>
              <th className="py-2 text-gray-500 font-medium text-left">기간</th>
            </tr></thead>
            <tbody>
              {upcomingLeaves.map((r) => (
                <tr key={r.requestId} className="border-b border-gray-100">
                  <td className="py-2"><StatusBadge status={STATUS_LABEL_MAP[r.status]} /></td>
                  <td className="py-2 text-gray-700">{r.typeName}</td>
                  <td className="py-2 text-gray-600">{r.useDays}d</td>
                  <td className="py-2 text-gray-600 whitespace-pre-line">{formatPeriod(r.startAt, r.endAt)}</td>
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
          </div>
          <table className="w-full text-[12px]">
            <thead><tr className="border-b border-gray-200">
              <th className="py-2 text-gray-500 font-medium text-left">상태</th>
              <th className="py-2 text-gray-500 font-medium text-left">휴가 종류</th>
              <th className="py-2 text-gray-500 font-medium text-left">일수</th>
              <th className="py-2 text-gray-500 font-medium text-left">기간</th>
            </tr></thead>
            <tbody>
              {pastLeaves.slice(0, 8).map((r) => (
                <tr key={r.requestId} className="border-b border-gray-100">
                  <td className="py-2"><StatusBadge status={STATUS_LABEL_MAP[r.status]} /></td>
                  <td className="py-2 text-gray-700">{r.typeName}</td>
                  <td className="py-2 text-gray-600">{r.useDays}d</td>
                  <td className="py-2 text-gray-600 whitespace-pre-line">{formatPeriod(r.startAt, r.endAt)}</td>
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
