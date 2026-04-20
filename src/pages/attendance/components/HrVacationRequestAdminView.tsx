import { useEffect, useState } from 'react'
import {
  vacationApi,
  type VacationRequestResponse,
  type VacationRequestStatus,
  VACATION_REQUEST_STATUS_LABEL,
} from '../../../api/vacation'

const STATUS_TABS: VacationRequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELED']

const STATUS_BADGE: Record<VacationRequestStatus, string> = {
  PENDING: 'bg-yellow-50 text-yellow-600',
  APPROVED: 'bg-[#E1F5EE] text-[#1D9E75]',
  REJECTED: 'bg-red-50 text-red-500',
  CANCELED: 'bg-gray-100 text-gray-500',
}

function formatDateRange(startAt: string, endAt: string): string {
  const s = startAt.slice(0, 10)
  const e = endAt.slice(0, 10)
  return s === e ? s : `${s} ~ ${e}`
}

export default function HrVacationRequestAdminView() {
  const [status, setStatus] = useState<VacationRequestStatus>('PENDING')
  const [page, setPage] = useState(0)
  const [size] = useState(20)
  const [data, setData] = useState<VacationRequestResponse[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const [cancelTarget, setCancelTarget] = useState<VacationRequestResponse | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [canceling, setCanceling] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await vacationApi.getAdminRequests({ status, page, size })
      setData(res.content)
      setTotalElements(res.totalElements)
      setTotalPages(res.totalPages)
    } catch {
      setData([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page, size])

  const handleStatusChange = (s: VacationRequestStatus) => {
    setStatus(s)
    setPage(0)
    setSearch('')
  }

  const filtered = search
    ? data.filter((d) => d.empName.includes(search) || (d.empDeptName ?? '').includes(search))
    : data

  const openCancel = (req: VacationRequestResponse) => {
    setCancelTarget(req)
    setCancelReason('')
  }

  const submitCancel = async () => {
    if (!cancelTarget || !cancelReason.trim()) return
    setCanceling(true)
    try {
      await vacationApi.adminCancelRequest(cancelTarget.requestId, { reason: cancelReason.trim() })
      setCancelTarget(null)
      await load()
    } catch (e) {
      const code = (e as { response?: { data?: { code?: string } } })?.response?.data?.code
      if (code === 'VACATION_REQ_NOT_FOUND') alert('신청 건을 찾을 수 없습니다.')
      else alert('직권 취소에 실패했습니다.')
    } finally {
      setCanceling(false)
    }
  }

  const canCancel = (s: VacationRequestStatus) => s === 'PENDING' || s === 'APPROVED'

  return (
    <div>
      {/* 상태 탭 */}
      <div className="flex items-center gap-2 mb-6">
        {STATUS_TABS.map((s) => (
          <button key={s} onClick={() => handleStatusChange(s)}
            className={`px-3 py-1 text-[12px] rounded-full transition-colors ${status === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {VACATION_REQUEST_STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center border border-gray-300 rounded px-2 py-1.5">
          <i className="fas fa-search text-gray-400 text-[11px] mr-2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="이름, 부서로 검색" className="text-[12px] outline-none bg-transparent w-48 placeholder-gray-400" />
        </div>
        <div className="text-[11px] text-gray-400">총 {totalElements}건</div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[13px] text-gray-400">불러오는 중...</div>
      ) : (
        <>
          <table className="w-full text-[12px]">
            <thead><tr className="border-b-2 border-gray-900">
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">신청자</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">부서</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">직급/직책</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">휴가 유형</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">휴가기간</th>
              <th className="px-3 py-2.5 text-right text-gray-700 font-medium">일수</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">신청일</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">상태</th>
              <th className="px-3 py-2.5 text-right text-gray-700 font-medium">처리</th>
            </tr></thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.requestId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5 text-gray-800 font-medium">{d.empName}</td>
                  <td className="px-3 py-2.5 text-gray-600">{d.empDeptName ?? '-'}</td>
                  <td className="px-3 py-2.5 text-gray-500 text-[11px]">
                    {[d.empGrade, d.empTitle].filter(Boolean).join(' / ') || '-'}
                  </td>
                  <td className="px-3 py-2.5 text-gray-700">{d.typeName}</td>
                  <td className="px-3 py-2.5 text-gray-600">{formatDateRange(d.startAt, d.endAt)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-700 font-semibold">{d.useDays}d</td>
                  <td className="px-3 py-2.5 text-gray-500">{d.createdAt.slice(0, 10)}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${STATUS_BADGE[d.status]}`}>
                      {VACATION_REQUEST_STATUS_LABEL[d.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {canCancel(d.status) ? (
                      <button onClick={() => openCancel(d)}
                        className="text-[11px] text-red-500 hover:underline">직권 취소</button>
                    ) : (
                      <span className="text-[11px] text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-[13px] text-gray-400">해당 상태의 신청이 없습니다</div>
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

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <i className="fas fa-info-circle text-blue-400 mt-0.5 text-[12px]" />
          <div className="text-[11px] text-blue-600 space-y-1">
            <p><strong>승인·반려</strong>는 전자결재 문서에서 처리합니다.</p>
            <p><strong>직권 취소</strong>는 PENDING(결재 대기 해제) 또는 APPROVED(사용 복원) 상태에서만 가능합니다.</p>
          </div>
        </div>
      </div>

      {/* 직권 취소 모달 */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setCancelTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[480px]">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-[16px] font-bold text-gray-900">휴가 신청 직권 취소</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-gray-50 rounded-lg px-4 py-3 text-[12px] text-gray-700 space-y-1">
                <div><strong>{cancelTarget.empName}</strong> · {cancelTarget.empDeptName ?? '-'}</div>
                <div>{cancelTarget.typeName} · {formatDateRange(cancelTarget.startAt, cancelTarget.endAt)} ({cancelTarget.useDays}일)</div>
                <div className="text-gray-500">현재 상태: {VACATION_REQUEST_STATUS_LABEL[cancelTarget.status]}</div>
              </div>
              <div>
                <label className="text-[12px] text-gray-700 font-medium block mb-2">
                  취소 사유 <span className="text-red-500">*</span>
                </label>
                <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="직권 취소 사유를 입력하세요"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75] min-h-[80px] resize-y" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button onClick={() => setCancelTarget(null)}
                className="px-5 py-2 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50">취소</button>
              <button onClick={submitCancel}
                disabled={!cancelReason.trim() || canceling}
                className={`px-5 py-2 text-[13px] font-medium rounded-md transition-colors ${cancelReason.trim() && !canceling ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                {canceling ? '처리 중...' : '직권 취소'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
