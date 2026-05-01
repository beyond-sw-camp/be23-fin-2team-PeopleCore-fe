import { useQuery } from '@tanstack/react-query'
import { openApprovalWindow } from '../../../utils/approvalWindow'
import {
  attendanceApi,
  ATTENDANCE_MODIFY_STATUS_BADGE,
} from '../../../api/attendance'
import { Skeleton } from '../../../components/ui/Skeleton'

interface Props {
  attenModiId: number
  onClose: () => void
}

const fmtHm = (iso: string | null) => (iso && iso.length >= 16) ? iso.slice(11, 16) : (iso ?? '-')
const fmtDate = (iso: string | null) => (iso && iso.length >= 10) ? iso.slice(0, 10) : (iso ?? '-')
const fmtDateTime = (iso: string | null) => {
  if (!iso) return '-'
  if (iso.length < 16) return iso
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`
}

export default function AttendanceModifyDetailModal({ attenModiId, onClose }: Props) {
  const detailQuery = useQuery({
    queryKey: ['attendance', 'modifyDetail', attenModiId],
    queryFn: () => attendanceApi.getAttendanceModify(attenModiId),
  })
  const detail = detailQuery.data ?? null
  const loading = detailQuery.isPending
  const error = detailQuery.isError ? '상세 정보를 불러오지 못했습니다.' : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(520px,calc(100vw-24px))] flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-gray-900">근태 정정 상세</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times" /></button>
        </div>

        <div className="px-6 py-5 overflow-y-auto space-y-4">
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}
          {error && <div className="text-[12px] text-red-500 py-6 text-center">{error}</div>}
          {detail && (
            <>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${ATTENDANCE_MODIFY_STATUS_BADGE[detail.attenStatus].cls}`}>
                  {ATTENDANCE_MODIFY_STATUS_BADGE[detail.attenStatus].text}
                </span>
                <span className="text-[12px] text-gray-500">#{detail.attenModiId}</span>
              </div>

              <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-1.5 text-[12px]">
                <div className="flex justify-between"><span className="text-gray-500">신청자</span><span className="text-gray-900 font-medium">{detail.attenEmpName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">부서</span><span className="text-gray-700">{detail.attenEmpDeptName ?? '-'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">직급/직책</span><span className="text-gray-700">{detail.attenEmpGrade ?? '-'} / {detail.attenEmpTitle ?? '-'}</span></div>
              </div>

              <div className="border border-gray-200 rounded-lg px-4 py-3 space-y-1.5 text-[12px]">
                <div className="flex justify-between"><span className="text-gray-500">대상일</span><span className="text-gray-900 font-medium">{detail.workDate}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">정정 출근</span><span className="text-[#1D9E75] font-medium">{fmtHm(detail.attenReqCheckIn)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">정정 퇴근</span><span className="text-[#1D9E75] font-medium">{fmtHm(detail.attenReqCheckOut)}</span></div>
              </div>

              <div>
                <div className="text-[12px] font-semibold text-gray-700 mb-1">사유</div>
                <div className="text-[12px] text-gray-700 border border-gray-200 rounded-lg px-3 py-2 whitespace-pre-wrap">{detail.attenReason}</div>
              </div>

              {detail.attenStatus === 'REJECTED' && detail.attenRejectReason && (
                <div>
                  <div className="text-[12px] font-semibold text-red-600 mb-1">반려 사유</div>
                  <div className="text-[12px] text-red-600 border border-red-200 bg-red-50 rounded-lg px-3 py-2 whitespace-pre-wrap">{detail.attenRejectReason}</div>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span>신청일 {fmtDateTime(detail.createdAt)}</span>
                <span>처리자 {detail.managerName ?? '-'}</span>
              </div>
              <div className="text-[11px] text-gray-400 text-right">최종수정 {fmtDate(detail.updatedAt)}</div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
          {detail?.approvalDocId != null && (
            <button
              onClick={() => { onClose(); if (detail.approvalDocId != null) openApprovalWindow({ viewDocId: detail.approvalDocId }) }}
              className="px-4 py-1.5 border border-[#1D9E75] text-[#1D9E75] text-[13px] font-medium rounded-md hover:bg-[#E1F5EE]"
            >
              결재문서 보기
            </button>
          )}
          <button onClick={onClose} className="px-5 py-1.5 bg-gray-900 text-white text-[13px] font-medium rounded-md hover:bg-gray-800">닫기</button>
        </div>
      </div>
    </div>
  )
}
