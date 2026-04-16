import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  attendanceApi,
  ATTENDANCE_MODIFY_STATUS_BADGE,
  type AttendanceModifyAdminRow,
  type AttendanceModifyStatus,
} from '../../../api/attendance'
import AttendanceModifyDetailModal from './AttendanceModifyDetailModal'

type FilterKey = 'ALL' | AttendanceModifyStatus

const TABS: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'PENDING', label: '승인대기' },
  { key: 'APPROVED', label: '승인완료' },
  { key: 'REJECTED', label: '반려' },
  { key: 'CANCELED', label: '취소' },
]

const PAGE_SIZE = 20

const fmtHm = (iso: string) => iso.length >= 16 ? iso.slice(11, 16) : iso
const fmtDate = (iso: string) => iso.length >= 10 ? iso.slice(0, 10) : iso

export default function HrCorrectionTab() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<FilterKey>('ALL')
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState<AttendanceModifyAdminRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)

  useEffect(() => {
    let aborted = false
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await attendanceApi.getAttendanceModifyAdmin({
          status: tab === 'ALL' ? undefined : tab,
          page,
          size: PAGE_SIZE,
        })
        if (!aborted) { setRows(res.content); setTotal(res.totalElements) }
      } catch {
        if (!aborted) { setRows([]); setTotal(0) }
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    void fetchData()
    return () => { aborted = true }
  }, [tab, page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <h1 className="text-[18px] font-bold text-gray-900 mb-4">정정 관리</h1>
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
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">직급</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">대상일</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">정정 출근</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">정정 퇴근</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">사유</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">신청일</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">상태</th>
          <th className="px-3 py-2.5 text-left text-gray-700 font-medium">결재문서</th>
        </tr></thead>
        <tbody>
          {loading && rows.length === 0 && (
            <tr><td colSpan={10} className="py-8 text-center text-[13px] text-gray-400">불러오는 중...</td></tr>
          )}
          {!loading && rows.length === 0 && (
            <tr><td colSpan={10} className="py-8 text-center text-[13px] text-gray-400">정정 신청 내역이 없습니다</td></tr>
          )}
          {rows.map((d) => {
            const status = ATTENDANCE_MODIFY_STATUS_BADGE[d.attenStatus]
            return (
              <tr
                key={d.attenModiId}
                onClick={() => setDetailId(d.attenModiId)}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-3 py-2.5 text-gray-800 font-medium">{d.attenEmpName}</td>
                <td className="px-3 py-2.5 text-gray-600">{d.attenEmpDeptName ?? '-'}</td>
                <td className="px-3 py-2.5 text-gray-600">{d.attenEmpGrade ?? '-'}</td>
                <td className="px-3 py-2.5 text-gray-600">{d.workDate}</td>
                <td className="px-3 py-2.5 text-[#1D9E75] font-medium">{fmtHm(d.attenReqCheckIn)}</td>
                <td className="px-3 py-2.5 text-[#1D9E75] font-medium">{fmtHm(d.attenReqCheckOut)}</td>
                <td className="px-3 py-2.5 text-gray-600 max-w-[240px] truncate" title={d.attenReason}>{d.attenReason}</td>
                <td className="px-3 py-2.5 text-gray-500">{fmtDate(d.createdAt)}</td>
                <td className="px-3 py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${status.cls}`}>{status.text}</span></td>
                <td className="px-3 py-2.5">
                  <button
                    disabled={d.approvalDocId == null}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (d.approvalDocId != null) navigate('/approval', { state: { viewDocId: d.approvalDocId } })
                    }}
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

      {detailId != null && (
        <AttendanceModifyDetailModal
          attenModiId={detailId}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  )
}
