import { useEffect, useState } from 'react'
import {
  vacationApi,
  type VacationRequestResponse,
  type VacationRequestStatus,
  VACATION_REQUEST_STATUS_LABEL,
} from '../../../api/vacation'
import { approvalApi } from '../../../api/approval'

const STATUS_BADGE: Record<VacationRequestStatus, string> = {
  PENDING: 'bg-yellow-50 text-yellow-600',
  APPROVED: 'bg-[#E1F5EE] text-[#1D9E75]',
  REJECTED: 'bg-red-50 text-red-500',
  CANCELED: 'bg-gray-100 text-gray-500',
}

function formatPeriod(startAt: string, endAt: string): string {
  const s = startAt.slice(0, 10)
  const e = endAt.slice(0, 10)
  return s === e ? s : `${s} ~ ${e}`
}

const CANCELABLE: VacationRequestStatus[] = ['PENDING']

export default function LeaveHistoryView() {
  const [requests, setRequests] = useState<VacationRequestResponse[]>([])
  const [page, setPage] = useState(0)
  const [size] = useState(20)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [cancelTarget, setCancelTarget] = useState<VacationRequestResponse | null>(null)
  const [canceling, setCanceling] = useState(false)

  const load = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await vacationApi.getMyRequests({ page, size })
      setRequests(res.content)
      setTotalElements(res.totalElements)
      setTotalPages(res.totalPages)
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status
      if (status === 400) setLoadError('페이지 파라미터가 올바르지 않습니다.')
      else if (status === 401) setLoadError('인증이 만료되었습니다. 다시 로그인해 주세요.')
      else setLoadError('신청 이력을 불러오지 못했습니다.')
      setRequests([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size])

  const openCancel = (req: VacationRequestResponse) => {
    setCancelTarget(req)
  }

  const submitCancel = async () => {
    if (!cancelTarget) return
    if (cancelTarget.approvalDocId == null) {
      alert('연결된 결재 문서를 찾을 수 없어 회수할 수 없습니다.')
      return
    }
    setCanceling(true)
    try {
      await approvalApi.recallDocument(cancelTarget.approvalDocId)
      setCancelTarget(null)
      alert('회수되었습니다.')
      await load()
    } catch {
      alert('회수에 실패했습니다.')
    } finally {
      setCanceling(false)
    }
  }

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 mb-4">내 신청 이력</h1>

      <div className="flex items-center justify-between mb-4">
        <div className="text-[12px] text-gray-500">총 {totalElements}건</div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[13px] text-gray-400">불러오는 중...</div>
      ) : loadError ? (
        <div className="py-12 text-center text-[13px] text-red-500">{loadError}</div>
      ) : (
        <>
          <table className="w-full text-[12px]">
            <thead><tr className="border-b-2 border-gray-900">
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">신청일</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">휴가 유형</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">기간</th>
              <th className="px-3 py-2.5 text-right text-gray-700 font-medium">일수</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사유</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">상태</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">처리일</th>
              <th className="px-3 py-2.5 text-right text-gray-700 font-medium">관리</th>
            </tr></thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.requestId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5 text-gray-500">{r.createdAt.slice(0, 10)}</td>
                  <td className="px-3 py-2.5 text-gray-700 font-medium">{r.typeName}</td>
                  <td className="px-3 py-2.5 text-gray-600">{formatPeriod(r.startAt, r.endAt)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700 font-semibold">{r.useDays}d</td>
                  <td className="px-3 py-2.5 text-gray-600 text-[11px] max-w-[240px] truncate" title={r.reason ?? ''}>
                    {r.reason ?? <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${STATUS_BADGE[r.status]}`}>
                      {VACATION_REQUEST_STATUS_LABEL[r.status]}
                    </span>
                    {r.status === 'REJECTED' && r.rejectReason && (
                      <div className="text-[10px] text-red-500 mt-1 max-w-[180px] truncate" title={r.rejectReason}>
                        사유: {r.rejectReason}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 text-[11px]">
                    {r.processedAt ? r.processedAt.slice(0, 10) : '-'}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {CANCELABLE.includes(r.status) ? (
                      <button onClick={() => openCancel(r)}
                        className="text-[11px] text-red-500 hover:underline">취소</button>
                    ) : (
                      <span className="text-[11px] text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {requests.length === 0 && (
            <div className="py-12 text-center text-[13px] text-gray-400">신청 내역이 없습니다</div>
          )}

          {/* 페이지네이션 — 1페이지여도 항상 표시 */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
              className="px-3 py-1 text-[12px] border border-gray-300 rounded disabled:opacity-30">이전</button>
            <span className="text-[12px] text-gray-500">{page + 1} / {Math.max(totalPages, 1)}</span>
            <button onClick={() => setPage(Math.min(Math.max(totalPages - 1, 0), page + 1))}
              disabled={page >= Math.max(totalPages - 1, 0)}
              className="px-3 py-1 text-[12px] border border-gray-300 rounded disabled:opacity-30">다음</button>
          </div>
        </>
      )}

      {/* 취소 모달 */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setCancelTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[480px]">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-[16px] font-bold text-gray-900">휴가 신청 취소</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-gray-50 rounded-lg px-4 py-3 text-[12px] text-gray-700 space-y-1">
                <div className="font-semibold">{cancelTarget.typeName}</div>
                <div>{formatPeriod(cancelTarget.startAt, cancelTarget.endAt)} ({cancelTarget.useDays}일)</div>
                <div className="text-gray-500">현재 상태: {VACATION_REQUEST_STATUS_LABEL[cancelTarget.status]}</div>
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
