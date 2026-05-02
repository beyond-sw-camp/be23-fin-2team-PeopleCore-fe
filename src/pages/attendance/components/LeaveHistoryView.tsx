import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import StatusBadge from './StatusBadge'
import {
  vacationApi,
  type MyVacationRequestItem,
  type VacationRequestStatus,
} from '../../../api/vacation'
import { approvalApi } from '../../../api/approval'
import { queryKeys } from '../../../lib/queryKeys'
import { SkeletonTableRows } from '../../../components/ui/Skeleton'
import { openApprovalWindow } from '../../../utils/approvalWindow'

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

const CANCELABLE: VacationRequestStatus[] = ['PENDING']

export type LeaveHistoryMode = 'upcoming' | 'past'

interface Props {
  mode: LeaveHistoryMode
  year: number
  onChanged?: () => void
}

const PAGE_SIZE = 10

export default function LeaveHistoryView({ mode, year, onChanged }: Props) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [cancelTarget, setCancelTarget] = useState<MyVacationRequestItem | null>(null)

  // year/mode 변경 시 첫 페이지로
  useEffect(() => {
    setPage(0)
  }, [year, mode])

  const listQuery = useQuery({
    queryKey: ['vacation', 'my', mode, year, page, PAGE_SIZE],
    queryFn: () => (mode === 'upcoming'
      ? vacationApi.getMyUpcomingRequests(year, page, PAGE_SIZE)
      : vacationApi.getMyPastRequests(year, page, PAGE_SIZE)),
  })

  const items: MyVacationRequestItem[] = listQuery.data?.content ?? []
  const totalElements = listQuery.data?.totalElements ?? 0
  const totalPages = listQuery.data?.totalPages ?? 0
  const loading = listQuery.isPending
  const loadError = listQuery.isError
    ? (() => {
        const status = (listQuery.error as { response?: { status?: number } })?.response?.status
        if (status === 400) return '잘못된 요청입니다.'
        if (status === 401) return '인증이 만료되었습니다. 다시 로그인해 주세요.'
        return '휴가 목록을 불러오지 못했습니다.'
      })()
    : null

  const cancelMutation = useMutation({
    mutationFn: (docId: number) => approvalApi.recallDocument(docId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.vacation.all })
      setCancelTarget(null)
      alert('회수되었습니다.')
      onChanged?.()
    },
    onError: () => {
      alert('회수에 실패했습니다.')
    },
  })
  const canceling = cancelMutation.isPending

  const submitCancel = () => {
    if (!cancelTarget) return
    if (cancelTarget.approvalDocId == null) {
      alert('연결된 결재 문서를 찾을 수 없어 회수할 수 없습니다.')
      return
    }
    cancelMutation.mutate(cancelTarget.approvalDocId)
  }

  const emptyMessage = mode === 'upcoming' ? '예정된 휴가가 없습니다' : '지난 휴가가 없습니다'
  const safeTotalPages = Math.max(totalPages, 1)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[12px] text-gray-500">총 {totalElements}건</div>
      </div>

      {loading ? (
        <table className="w-full text-[12px]">
          <tbody>
            <SkeletonTableRows rows={5} cols={mode === 'upcoming' ? 5 : 4} />
          </tbody>
        </table>
      ) : loadError ? (
        <div className="py-12 text-center text-[13px] text-red-500">{loadError}</div>
      ) : (
        <>
          <table className="w-full text-[12px]">
            <thead><tr className="border-b-2 border-gray-900">
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">상태</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">휴가 유형</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">기간</th>
              <th className="px-3 py-2.5 text-right text-gray-700 font-medium">일수</th>
              {mode === 'upcoming' && (
                <th className="px-3 py-2.5 text-right text-gray-700 font-medium">관리</th>
              )}
            </tr></thead>
            <tbody>
              {items.map((r) => {
                const hasDoc = r.approvalDocId != null
                return (
                  <tr
                    key={r.requestId}
                    onClick={() => { if (hasDoc) openApprovalWindow({ viewDocId: r.approvalDocId as number }) }}
                    className={`border-b border-gray-100 transition-colors ${hasDoc ? 'cursor-pointer hover:bg-[#f7fbf9]' : 'hover:bg-gray-50'}`}
                    title={hasDoc ? '결재문서 보기' : undefined}
                  >
                    <td className="px-3 py-2.5">
                      <StatusBadge status={STATUS_LABEL_MAP[r.status]} />
                    </td>
                    <td className="px-3 py-2.5 text-gray-700 font-medium">{r.typeName}</td>
                    <td className="px-3 py-2.5 text-gray-600">{formatPeriod(r.startAt, r.endAt)}</td>
                    <td className="px-3 py-2.5 text-right text-gray-700 font-semibold">{r.useDays}d</td>
                    {mode === 'upcoming' && (
                      <td className="px-3 py-2.5 text-right">
                        {CANCELABLE.includes(r.status) ? (
                          <button onClick={(e) => { e.stopPropagation(); setCancelTarget(r) }}
                            className="text-[11px] text-red-500 hover:underline">취소</button>
                        ) : (
                          <span className="text-[11px] text-gray-300">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>

          {items.length === 0 && (
            <div className="py-12 text-center text-[13px] text-gray-400">{emptyMessage}</div>
          )}

          <div className="flex items-center justify-center gap-2 mt-4">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
              className="px-3 py-1 text-[12px] border border-gray-300 rounded disabled:opacity-30">이전</button>
            <span className="text-[12px] text-gray-500">{page + 1} / {safeTotalPages}</span>
            <button onClick={() => setPage(Math.min(safeTotalPages - 1, page + 1))}
              disabled={page >= safeTotalPages - 1}
              className="px-3 py-1 text-[12px] border border-gray-300 rounded disabled:opacity-30">다음</button>
          </div>
        </>
      )}

      {cancelTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setCancelTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[min(480px,calc(100vw-24px))]">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-[16px] font-bold text-gray-900">휴가 신청 취소</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-gray-50 rounded-lg px-4 py-3 text-[12px] text-gray-700 space-y-1">
                <div className="font-semibold">{cancelTarget.typeName}</div>
                <div>{formatPeriod(cancelTarget.startAt, cancelTarget.endAt)} ({cancelTarget.useDays}일)</div>
                <div className="text-gray-500">현재 상태: {STATUS_LABEL_MAP[cancelTarget.status]}</div>
              </div>
              <div className="text-[12px] text-gray-600">
                이 휴가 신청의 결재 문서를 회수합니다. 진행하시겠습니까?
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button onClick={() => setCancelTarget(null)}
                className="px-5 py-2 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50">닫기</button>
              <button onClick={submitCancel}
                disabled={canceling}
                className={`px-5 py-2 text-[13px] font-medium rounded-md transition-colors ${canceling ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'}`}>
                {canceling ? '처리 중...' : '취소 신청'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
