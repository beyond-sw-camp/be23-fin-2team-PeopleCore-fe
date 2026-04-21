import { useEffect, useState } from 'react'
import {
  vacationApi,
  type VacationRequestResponse,
  type VacationRequestStatus,
  VACATION_REQUEST_STATUS_LABEL,
} from '../../../api/vacation'

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

const CANCELABLE: VacationRequestStatus[] = ['PENDING', 'APPROVED']

/* ── 더미 데이터 (서버 응답이 비어있거나 실패 시 fallback) ── */
const DUMMY_HISTORY: VacationRequestResponse[] = [
  {
    requestId: -201, typeId: 2, typeCode: 'ANNUAL', typeName: '연차',
    empId: 0, empName: '홍길동', empDeptName: '개발팀', empGrade: '대리', empTitle: null,
    startAt: '2026-05-04T00:00:00', endAt: '2026-05-04T23:59:59', useDays: 1,
    reason: '가족 행사', status: 'PENDING', managerId: null, processedAt: null,
    rejectReason: null, approvalDocId: null, createdAt: '2026-04-20T10:15:00',
  },
  {
    requestId: -202, typeId: 2, typeCode: 'ANNUAL', typeName: '연차',
    empId: 0, empName: '홍길동', empDeptName: '개발팀', empGrade: '대리', empTitle: null,
    startAt: '2026-06-01T00:00:00', endAt: '2026-06-02T23:59:59', useDays: 2,
    reason: '여름휴가', status: 'APPROVED', managerId: 1, processedAt: '2026-04-19T14:00:00',
    rejectReason: null, approvalDocId: 1001, createdAt: '2026-04-18T09:30:00',
  },
  {
    requestId: -203, typeId: 1, typeCode: 'MONTHLY', typeName: '월차',
    empId: 0, empName: '홍길동', empDeptName: '개발팀', empGrade: '대리', empTitle: null,
    startAt: '2026-04-10T00:00:00', endAt: '2026-04-10T23:59:59', useDays: 1,
    reason: '개인 사유', status: 'APPROVED', managerId: 1, processedAt: '2026-04-07T10:00:00',
    rejectReason: null, approvalDocId: 1000, createdAt: '2026-04-06T09:00:00',
  },
  {
    requestId: -204, typeId: 2, typeCode: 'ANNUAL', typeName: '연차',
    empId: 0, empName: '홍길동', empDeptName: '개발팀', empGrade: '대리', empTitle: null,
    startAt: '2026-03-17T00:00:00', endAt: '2026-03-17T12:00:00', useDays: 0.5,
    reason: '병원 진료', status: 'APPROVED', managerId: 1, processedAt: '2026-03-15T11:20:00',
    rejectReason: null, approvalDocId: 997, createdAt: '2026-03-14T16:00:00',
  },
  {
    requestId: -205, typeId: 2, typeCode: 'ANNUAL', typeName: '연차',
    empId: 0, empName: '홍길동', empDeptName: '개발팀', empGrade: '대리', empTitle: null,
    startAt: '2026-02-10T00:00:00', endAt: '2026-02-11T23:59:59', useDays: 2,
    reason: '개인 사유', status: 'APPROVED', managerId: 1, processedAt: '2026-02-05T10:00:00',
    rejectReason: null, approvalDocId: 988, createdAt: '2026-02-04T09:00:00',
  },
  {
    requestId: -206, typeId: 2, typeCode: 'ANNUAL', typeName: '연차',
    empId: 0, empName: '홍길동', empDeptName: '개발팀', empGrade: '대리', empTitle: null,
    startAt: '2026-01-22T00:00:00', endAt: '2026-01-22T23:59:59', useDays: 1,
    reason: '경조사', status: 'REJECTED', managerId: 1, processedAt: '2026-01-20T15:30:00',
    rejectReason: '해당 기간 팀 마감 일정', approvalDocId: 970, createdAt: '2026-01-19T13:20:00',
  },
  {
    requestId: -207, typeId: 2, typeCode: 'ANNUAL', typeName: '연차',
    empId: 0, empName: '홍길동', empDeptName: '개발팀', empGrade: '대리', empTitle: null,
    startAt: '2025-12-30T00:00:00', endAt: '2025-12-31T23:59:59', useDays: 2,
    reason: '연말 휴가', status: 'CANCELED', managerId: 1, processedAt: '2025-12-28T16:45:00',
    rejectReason: null, approvalDocId: 950, createdAt: '2025-12-27T14:00:00',
  },
]

export default function LeaveHistoryView() {
  const [requests, setRequests] = useState<VacationRequestResponse[]>([])
  const [page, setPage] = useState(0)
  const [size] = useState(20)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  const [cancelTarget, setCancelTarget] = useState<VacationRequestResponse | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [canceling, setCanceling] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await vacationApi.getMyRequests({ page, size })
      if (res.content.length === 0 && page === 0) {
        setRequests(DUMMY_HISTORY)
        setTotalElements(DUMMY_HISTORY.length)
        setTotalPages(1)
      } else {
        setRequests(res.content)
        setTotalElements(res.totalElements)
        setTotalPages(res.totalPages)
      }
    } catch {
      setRequests(DUMMY_HISTORY)
      setTotalElements(DUMMY_HISTORY.length)
      setTotalPages(1)
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
    setCancelReason('')
  }

  const submitCancel = async () => {
    if (!cancelTarget) return
    setCanceling(true)
    try {
      await vacationApi.cancelMyRequest(cancelTarget.requestId, {
        reason: cancelReason.trim() === '' ? undefined : cancelReason.trim(),
      })
      setCancelTarget(null)
      alert('취소되었습니다.')
      await load()
    } catch (e) {
      const code = (e as { response?: { data?: { code?: string } } })?.response?.data?.code
      if (code === 'INVALID_REQUEST_STATUS_TRANSITION') alert('이미 종결된 신청은 취소할 수 없습니다.')
      else if (code === 'VACATION_REQ_NOT_FOUND') alert('신청 내역을 찾을 수 없습니다.')
      else if (code === 'FORBIDDEN') alert('본인 신청만 취소할 수 있습니다.')
      else alert('취소에 실패했습니다.')
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

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                className="px-3 py-1 text-[12px] border border-gray-300 rounded disabled:opacity-30">이전</button>
              <span className="text-[12px] text-gray-500">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1 text-[12px] border border-gray-300 rounded disabled:opacity-30">다음</button>
            </div>
          )}
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
              <div>
                <label className="text-[12px] text-gray-700 font-medium block mb-2">취소 사유 <span className="text-[11px] text-gray-400">(선택)</span></label>
                <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="예: 일정 변경"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75] min-h-[80px] resize-y" />
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
