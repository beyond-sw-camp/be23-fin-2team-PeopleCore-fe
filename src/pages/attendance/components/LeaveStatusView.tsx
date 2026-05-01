import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import StatusBadge from './StatusBadge'
import LeaveHistoryView from './LeaveHistoryView'
import {
  vacationApi,
  type VacationPromotionNoticeResponse,
  type VacationRequestStatus,
} from '../../../api/vacation'
import { queryKeys } from '../../../lib/queryKeys'
import { Skeleton, SkeletonCards } from '../../../components/ui/Skeleton'
import { openApprovalWindow } from '../../../utils/approvalWindow'

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
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [historyMode, setHistoryMode] = useState<'upcoming' | 'past' | null>(null)
  const minYear = new Date().getFullYear() - 2
  const maxYear = new Date().getFullYear() + 1

  // 카드 프리뷰는 요약 8건만 가져온다
  const PREVIEW_SIZE = 8

  const statusQuery = useQuery({
    queryKey: queryKeys.vacation.myBalance(year),
    queryFn: () => vacationApi.getMyStatus(year),
  })
  const noticesQuery = useQuery({
    queryKey: ['vacation', 'my', 'promotionNotices', year],
    queryFn: () => vacationApi.getMyPromotionNotices(year),
  })
  const upcomingQuery = useQuery({
    queryKey: ['vacation', 'my', 'upcomingPreview', year],
    queryFn: () => vacationApi.getMyUpcomingRequests(year, 0, PREVIEW_SIZE),
  })
  const pastQuery = useQuery({
    queryKey: ['vacation', 'my', 'pastPreview', year],
    queryFn: () => vacationApi.getMyPastRequests(year, 0, PREVIEW_SIZE),
  })

  const status = statusQuery.data ?? null
  const notices: VacationPromotionNoticeResponse[] = noticesQuery.data ?? []
  const upcomingLeaves = upcomingQuery.data?.content ?? []
  const pastLeaves = pastQuery.data?.content ?? []
  const loading = statusQuery.isPending

  const latestNotice = notices.length > 0 ? notices[notices.length - 1] : null

  const annual = status?.annual ?? null
  const others = status?.others ?? []

  const usedPercent = annual && annual.totalDays > 0
    ? Math.round((annual.usedDays / annual.totalDays) * 100)
    : 0

  if (loading) {
    return (
      <div>
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-32 w-full mb-6" />
        <div className="grid grid-cols-3 gap-3 mb-6">
          <SkeletonCards count={3} />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-[18px] font-bold text-gray-900">휴가현황</h1>
        <div className="flex items-center gap-1 ml-1">
          <button
            type="button"
            onClick={() => setYear((y) => Math.max(minYear, y - 1))}
            disabled={year <= minYear}
            aria-label="이전 연도"
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed">
            <i className="fas fa-chevron-left text-[11px]" />
          </button>
          <span className="text-[13px] font-semibold text-gray-800 min-w-[52px] text-center">{year}년</span>
          <button
            type="button"
            onClick={() => setYear((y) => Math.min(maxYear, y + 1))}
            disabled={year >= maxYear}
            aria-label="다음 연도"
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed">
            <i className="fas fa-chevron-right text-[11px]" />
          </button>
        </div>
      </div>

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

      {/* 연차 현황 카드 */}
      {annual ? (
        <>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[14px] font-bold text-gray-900">연차 현황</h2>
            {annual.pendingDays > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-yellow-50 text-yellow-600">결재 대기 {annual.pendingDays}일</span>
            )}
          </div>
          <div className="border border-gray-200 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[12px] text-gray-500">
                <span>{status?.year ?? year}년</span>
                <span>·</span>
                <span>
                  {annual.periodStart ?? '-'} ~ {annual.periodEnd ?? '무기한'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-[280px] shrink-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1">
                    <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-3 rounded-full ${annual.availableDays <= 0 ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-[#1D9E75] to-[#4fc3a0]'}`}
                        style={{ width: `${Math.min(usedPercent, 100)}%` }} />
                    </div>
                  </div>
                </div>
                <span className={`text-[11px] font-medium ${annual.availableDays <= 0 ? 'text-red-500' : 'text-[#1D9E75]'}`}>
                  연차를 {usedPercent}% 소진했습니다.
                </span>
                <div className="text-[11px] text-gray-400">소진률 {usedPercent}% ({annual.usedDays}/{annual.totalDays})</div>
              </div>
              <div className="h-12 border-r border-gray-200" />
              <div className="flex flex-1">
                {[
                  { label: '잔여', value: `${annual.availableDays}d`, color: annual.availableDays <= 0 ? 'text-red-500' : 'text-[#1D9E75]' },
                  { label: '사용', value: `${annual.usedDays}d`, color: 'text-gray-900' },
                  { label: '결재 대기', value: `${annual.pendingDays}d`, color: annual.pendingDays > 0 ? 'text-yellow-600' : 'text-gray-500' },
                  { label: '총', value: `${annual.totalDays}d`, color: 'text-gray-900' },
                  { label: '소멸', value: `${annual.expiredDays}d`, color: 'text-gray-500' },
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
          부여받은 연차가 없습니다.
        </div>
      )}

      {/* 기타 휴가 유형 */}
      {others.length > 0 && (
        <div className="mb-6">
          <h3 className="text-[13px] font-bold text-gray-900 mb-2">기타 휴가</h3>
          <div className="grid grid-cols-3 gap-3">
            {others.map((b) => (
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
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-bold text-gray-900">예정휴가</h3>
            <button onClick={() => setHistoryMode('upcoming')}
              className="text-[12px] text-[#1D9E75] hover:underline">더보기</button>
          </div>
          <table className="w-full text-[12px]">
            <thead><tr className="border-b border-gray-200">
              <th className="py-2 text-gray-500 font-medium text-left">상태</th>
              <th className="py-2 text-gray-500 font-medium text-left">휴가 종류</th>
              <th className="py-2 text-gray-500 font-medium text-left">일수</th>
              <th className="py-2 text-gray-500 font-medium text-left">기간</th>
            </tr></thead>
            <tbody>
              {upcomingLeaves.slice(0, 8).map((r) => {
                const hasDoc = r.approvalDocId != null
                return (
                  <tr
                    key={r.requestId}
                    onClick={() => { if (hasDoc) openApprovalWindow({ viewDocId: r.approvalDocId as number }) }}
                    className={`border-b border-gray-100 ${hasDoc ? 'cursor-pointer hover:bg-[#f7fbf9]' : ''}`}
                    title={hasDoc ? '결재문서 보기' : undefined}
                  >
                    <td className="py-2"><StatusBadge status={STATUS_LABEL_MAP[r.status]} /></td>
                    <td className="py-2 text-gray-700">{r.typeName}</td>
                    <td className="py-2 text-gray-600">{r.useDays}d</td>
                    <td className="py-2 text-gray-600 whitespace-pre-line">{formatPeriod(r.startAt, r.endAt)}</td>
                  </tr>
                )
              })}
              {upcomingLeaves.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-[13px] text-gray-400">예정된 휴가가 없습니다</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-bold text-gray-900">지난휴가</h3>
            <button onClick={() => setHistoryMode('past')}
              className="text-[12px] text-[#1D9E75] hover:underline">더보기</button>
          </div>
          <table className="w-full text-[12px]">
            <thead><tr className="border-b border-gray-200">
              <th className="py-2 text-gray-500 font-medium text-left">상태</th>
              <th className="py-2 text-gray-500 font-medium text-left">휴가 종류</th>
              <th className="py-2 text-gray-500 font-medium text-left">일수</th>
              <th className="py-2 text-gray-500 font-medium text-left">기간</th>
            </tr></thead>
            <tbody>
              {pastLeaves.slice(0, 8).map((r) => {
                const hasDoc = r.approvalDocId != null
                return (
                  <tr
                    key={r.requestId}
                    onClick={() => { if (hasDoc) openApprovalWindow({ viewDocId: r.approvalDocId as number }) }}
                    className={`border-b border-gray-100 ${hasDoc ? 'cursor-pointer hover:bg-[#f7fbf9]' : ''}`}
                    title={hasDoc ? '결재문서 보기' : undefined}
                  >
                    <td className="py-2"><StatusBadge status={STATUS_LABEL_MAP[r.status]} /></td>
                    <td className="py-2 text-gray-700">{r.typeName}</td>
                    <td className="py-2 text-gray-600">{r.useDays}d</td>
                    <td className="py-2 text-gray-600 whitespace-pre-line">{formatPeriod(r.startAt, r.endAt)}</td>
                  </tr>
                )
              })}
              {pastLeaves.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-[13px] text-gray-400">지난 휴가가 없습니다</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 예정/지난 휴가 모달 — 모드별로 분리 */}
      {historyMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setHistoryMode(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[min(1040px,calc(100vw-24px))] max-w-[95vw] max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <h2 className="text-[16px] font-bold text-gray-900">
                {historyMode === 'upcoming' ? '예정 휴가 전체보기' : '지난 휴가 전체보기'}
              </h2>
              <button onClick={() => setHistoryMode(null)}
                className="text-gray-400 hover:text-gray-600 text-[18px] leading-none">
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <LeaveHistoryView
                mode={historyMode}
                year={year}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
