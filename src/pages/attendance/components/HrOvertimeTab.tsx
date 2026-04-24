import { useEffect, useState } from 'react'
import { openApprovalWindow } from '../../../utils/approvalWindow'
import { attendanceApi, type OvertimeRequestAdminRow, type OvertimeRequestAdminTab, type OtStatus, type OtType } from '../../../api/attendance'

const TABS: { key: OvertimeRequestAdminTab; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '승인대기' },
  { key: 'approved', label: '승인완료' },
  { key: 'rejected', label: '반려' },
]

const STATUS_BADGE: Record<OtStatus, { text: string; cls: string }> = {
  PENDING: { text: '승인대기', cls: 'bg-yellow-50 text-yellow-600' },
  APPROVED: { text: '승인완료', cls: 'bg-gray-100 text-gray-600' },
  REJECTED: { text: '반려', cls: 'bg-red-50 text-red-500' },
  CANCELED: { text: '취소', cls: 'bg-gray-100 text-gray-500' },
}

const TYPE_BADGE: Record<OtType, string> = {
  연장근무: 'bg-purple-50 text-purple-600',
  야간근무: 'bg-blue-50 text-blue-600',
  휴일근무: 'bg-orange-50 text-orange-600',
}

const PAGE_SIZE = 20

export default function HrOvertimeTab() {
  const [tab, setTab] = useState<OvertimeRequestAdminTab>('all')
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState<OvertimeRequestAdminRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let aborted = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 탭/페이지 변경 시 로딩 플래그 즉시 표시
    setLoading(true)
    attendanceApi.getOvertimeRequestsAdmin(tab, page, PAGE_SIZE)
      .then((res) => { if (aborted) return; setRows(res.content); setTotal(res.totalElements) })
      .catch(() => { if (aborted) return; setRows([]); setTotal(0) })
      .finally(() => { if (!aborted) setLoading(false) })
    return () => { aborted = true }
  }, [tab, page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 mb-4">초과근무 관리</h1>
      <div className="flex items-center gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(0) }}
            className={`px-3 py-1 text-[12px] rounded-full transition-colors ${tab === t.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t.label}
          </button>
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
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">결재문서</th>
        </tr></thead>
        <tbody>
          {loading && rows.length === 0 && (
            <tr><td colSpan={8} className="py-8 text-center text-[13px] text-gray-400">불러오는 중...</td></tr>
          )}
          {!loading && rows.length === 0 && (
            <tr><td colSpan={8} className="py-8 text-center text-[13px] text-gray-400">데이터가 없습니다</td></tr>
          )}
          {rows.map((d) => {
            const status = STATUS_BADGE[d.otStatus]
            return (
              <tr key={d.otId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2.5 text-gray-800 font-medium">{d.empName}</td>
                <td className="px-3 py-2.5 text-gray-600">{d.deptName}</td>
                <td className="px-3 py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${TYPE_BADGE[d.otType] ?? 'bg-gray-100 text-gray-600'}`}>{d.otType}</span></td>
                <td className="px-3 py-2.5 text-gray-600">{d.otDate}</td>
                <td className="px-3 py-2.5 text-right text-gray-700 font-semibold">{d.durationLabel}</td>
                <td className="px-3 py-2.5 text-gray-600 max-w-[280px] truncate" title={d.otReason}>{d.otReason}</td>
                <td className="px-3 py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${status.cls}`}>{status.text}</span></td>
                <td className="px-3 py-2.5">
                  <button
                    disabled={d.approvalDocId == null}
                    onClick={() => d.approvalDocId != null && openApprovalWindow({ viewDocId: d.approvalDocId })}
                    className={`text-[11px] px-2 py-0.5 rounded border ${d.approvalDocId != null ? 'border-[#1D9E75] text-[#1D9E75] hover:bg-[#F0FAF6]' : 'border-gray-200 text-gray-300 cursor-not-allowed'}`}
                  >
                    문서
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {total > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-[12px] text-gray-500">전체 {total}건</div>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-2 py-1 text-[12px] text-gray-600 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
            ><i className="fas fa-chevron-left" /></button>
            <span className="text-[12px] text-gray-600 px-2">{page + 1} / {totalPages}</span>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="px-2 py-1 text-[12px] text-gray-600 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
            ><i className="fas fa-chevron-right" /></button>
          </div>
        </div>
      )}
    </div>
  )
}
