import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { attendanceApi, WORK_STATUS_LABEL, WORK_STATUS_BADGE, formatHm } from '../../../api/attendance'

export interface AttendanceCorrectionData {
  formId: number
  formCode: string
  /** CommuteRecord 없는 날 정정 신청은 null → BE 가 INSERT */
  comRecId: number | null
  correctionDate: string
  empName: string
  currentCheckIn: string | null
  currentCheckOut: string | null
  afterCheckIn: string
  afterCheckOut: string
  reason: string
  files: File[]
}

interface Props {
  initialDate?: string
  onClose: () => void
  onSubmit: (data: AttendanceCorrectionData) => void
  onNavigateHistory?: () => void
}

function extractErrorCode(e: unknown): { code?: string; message?: string; httpStatus?: number } {
  if (typeof e === 'object' && e !== null && 'response' in e) {
    const res = (e as { response?: { status?: number; data?: { message?: string; errorCode?: string; code?: string } } }).response
    return {
      httpStatus: res?.status,
      code: res?.data?.errorCode ?? res?.data?.code,
      message: res?.data?.message,
    }
  }
  return {}
}

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const fmtHm = (iso: string | null) => (iso && iso.length >= 16) ? iso.slice(11, 16) : ''

const minutesBetween = (startHm: string, endHm: string): number => {
  if (!startHm || !endHm) return 0
  const [sh, sm] = startHm.split(':').map(Number)
  const [eh, em] = endHm.split(':').map(Number)
  let diff = (eh * 60 + em) - (sh * 60 + sm)
  if (diff <= 0) diff += 24 * 60
  return diff
}

export default function AttendanceCorrectionModal({ initialDate, onClose, onSubmit, onNavigateHistory }: Props) {
  const [correctionDate, setCorrectionDate] = useState<string>(initialDate ?? todayStr())
  const [afterCheckIn, setAfterCheckIn] = useState<string>('')
  const [afterCheckOut, setAfterCheckOut] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)

  const prefillQuery = useQuery({
    queryKey: ['attendance', 'modifyPrefill', correctionDate],
    queryFn: () => attendanceApi.getAttendanceModifyPrefill(correctionDate),
  })
  const prefill = prefillQuery.data ?? null
  const loadingRecord = prefillQuery.isPending
  const errorInfo = prefillQuery.isError ? extractErrorCode(prefillQuery.error) : { code: undefined, message: undefined }
  const errorCode = errorInfo.code ?? null
  const errorMessage = errorInfo.message ?? null

  // 신규 생성 모드(prefill에 currentCheckIn/Out null)면 빈 폼 유지, 아니면 현재 시각으로 초기화
  useEffect(() => {
    if (!prefill) return
    setAfterCheckIn(prefill.currentCheckIn ? fmtHm(prefill.currentCheckIn) : '')
    setAfterCheckOut(prefill.currentCheckOut ? fmtHm(prefill.currentCheckOut) : '')
  }, [prefill])

  const isNewMode = !!prefill && prefill.comRecId == null

  const inputMinutes = useMemo(
    () => minutesBetween(afterCheckIn, afterCheckOut),
    [afterCheckIn, afterCheckOut],
  )

  const currentInHm = fmtHm(prefill?.currentCheckIn ?? null)
  const currentOutHm = fmtHm(prefill?.currentCheckOut ?? null)
  const changed = useMemo(() => {
    return afterCheckIn !== currentInHm || afterCheckOut !== currentOutHm
  }, [afterCheckIn, afterCheckOut, currentInHm, currentOutHm])

  // 주간 한도 검증 — 단순화: groupBreak 없이 (newOut-newIn) 으로 계산 (보수적 표시).
  // BE 가 정확한 group break 차감 후 최종 검증하므로 FE 는 안내용.
  const currentDayActualWork = useMemo(() => {
    if (!currentInHm || !currentOutHm) return 0
    return Math.max(0, minutesBetween(currentInHm, currentOutHm))
  }, [currentInHm, currentOutHm])

  const modifiedActual = Math.max(0, inputMinutes)
  const expectedAfter = (prefill?.weekUsedMinutes ?? 0) - currentDayActualWork + modifiedActual
  const weeklyMax = prefill?.weeklyMaxMinutes ?? 0
  const exceedAction = prefill?.exceedAction ?? 'NOTIFY'
  const weeklyExceeded = weeklyMax > 0 && expectedAfter > weeklyMax
  const weeklyRemaining = Math.max(0, weeklyMax - (prefill?.weekUsedMinutes ?? 0))

  const isBlocked = errorCode === 'ATTENDANCE_MODIFY_PENDING_EXISTS'
    || errorCode === 'ATTENDANCE_MODIFY_FORM_NOT_FOUND'

  const blockedByWeeklyLimit = exceedAction === 'BLOCK' && weeklyExceeded

  const canSubmit = !!prefill
    && !isBlocked
    && !blockedByWeeklyLimit
    && !!correctionDate
    && !!reason.trim()
    && inputMinutes > 0
    && (isNewMode || changed)
    && !submitting

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : []
    setFiles((prev) => [...prev, ...selected])
    e.target.value = ''
  }

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx))

  const handleConfirm = async () => {
    if (!canSubmit || !prefill) return
    setSubmitting(true)
    try {
      onSubmit({
        formId: prefill.formId,
        formCode: prefill.formCode,
        comRecId: prefill.comRecId,
        correctionDate,
        empName: prefill.empName,
        currentCheckIn: prefill.currentCheckIn,
        currentCheckOut: prefill.currentCheckOut,
        afterCheckIn,
        afterCheckOut,
        reason: reason.trim(),
        files,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(560px,calc(100vw-24px))] flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-[16px] font-bold text-gray-900">근태 정정 신청</h2>
          <p className="text-[12px] text-gray-500 mt-1">신청 후 결재선 선택을 통해 전자결재가 상신됩니다.</p>
        </div>

        <div className="px-6 py-5 overflow-y-auto space-y-4">
          {/* 날짜 */}
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold text-gray-900 shrink-0 w-20">날짜 <span className="text-red-500">*</span></span>
            <input
              type="date"
              value={correctionDate}
              max={todayStr()}
              onChange={(e) => setCorrectionDate(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none"
            />
          </div>

          {/* 선택한 날짜 출퇴근 기록 */}
          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[12px] font-semibold text-gray-700">
                선택일 출퇴근 기록
                {isNewMode && (
                  <span className="ml-2 inline-block px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 font-semibold">신규 생성</span>
                )}
              </div>
              {prefill?.isAutoClosed && (
                <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-purple-50 text-purple-600 font-semibold">자동마감 복구</span>
              )}
            </div>
            {loadingRecord ? (
              <div className="text-[12px] text-gray-400">불러오는 중...</div>
            ) : prefill ? (
              isNewMode ? (
                <div className="space-y-1.5">
                  <div className="text-[12px] text-gray-500">기록 없음 — 출퇴근 시각을 직접 입력해주세요.</div>
                  <div className="text-[11px] text-gray-400">{prefill.empName} · {prefill.deptName ?? '-'} · {prefill.gradeName ?? '-'}</div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3 text-[12px]">
                    {prefill.workStatus && (
                      <span className={`inline-block px-2 py-0.5 rounded border ${WORK_STATUS_BADGE[prefill.workStatus]}`}>
                        {WORK_STATUS_LABEL[prefill.workStatus]}
                      </span>
                    )}
                    <span className="text-gray-600">
                      <span className="text-[#1D9E75] mr-1">출</span>{fmtHm(prefill.currentCheckIn) || '-'}
                      <span className="mx-2 text-gray-300">|</span>
                      <span className="text-gray-500 mr-1">퇴</span>{fmtHm(prefill.currentCheckOut) || '-'}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400">{prefill.empName} · {prefill.deptName ?? '-'} · {prefill.gradeName ?? '-'}</div>
                </div>
              )
            ) : errorCode === 'ATTENDANCE_MODIFY_PENDING_EXISTS' ? (
              <div className="flex items-center justify-between gap-2">
                <div className="text-[12px] text-orange-600">이미 진행 중인 정정 신청이 있습니다.</div>
                {onNavigateHistory && (
                  <button
                    onClick={onNavigateHistory}
                    className="text-[11px] px-2 py-0.5 rounded border border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    내 신청 이력
                  </button>
                )}
              </div>
            ) : errorCode === 'ATTENDANCE_MODIFY_FORM_NOT_FOUND' ? (
              <div className="text-[12px] text-red-500">근태정정 양식이 설정되지 않았습니다. 관리자에게 문의해주세요.</div>
            ) : errorMessage ? (
              <div className="text-[12px] text-red-500">{errorMessage}</div>
            ) : (
              <div className="text-[12px] text-gray-400">기록이 없습니다.</div>
            )}
          </div>

          {/* 주간 한도 표시 */}
          {prefill && weeklyMax > 0 && (
            <div className={`rounded-lg px-4 py-2.5 border text-[12px] ${
              weeklyExceeded
                ? (exceedAction === 'BLOCK' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700')
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}>
              <div className="flex items-center justify-between">
                <span>
                  주간 누적 <strong>{formatHm(prefill.weekUsedMinutes)}</strong> / 한도 <strong>{formatHm(weeklyMax)}</strong>
                  <span className="ml-2 text-gray-500">(잔여 {formatHm(weeklyRemaining)})</span>
                </span>
                {inputMinutes > 0 && (
                  <span className="text-[11px]">
                    예상 합계 <strong>{formatHm(Math.max(0, expectedAfter))}</strong>
                  </span>
                )}
              </div>
              {weeklyExceeded && (
                <div className="mt-1 text-[11px]">
                  {exceedAction === 'BLOCK'
                    ? `주간 최대 근무시간(${formatHm(weeklyMax)})을 초과합니다. 정정 신청이 불가합니다.`
                    : `주간 최대 근무시간(${formatHm(weeklyMax)})을 초과할 수 있습니다.`}
                </div>
              )}
            </div>
          )}

          {/* 정정 시간 */}
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold text-gray-900 shrink-0 w-20">정정 시간 <span className="text-red-500">*</span></span>
            <input
              type="time"
              value={afterCheckIn}
              onChange={(e) => setAfterCheckIn(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none"
            />
            <span className="text-gray-400">~</span>
            <input
              type="time"
              value={afterCheckOut}
              onChange={(e) => setAfterCheckOut(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none"
            />
          </div>

          {/* 사유 */}
          <div>
            <div className="text-[13px] font-semibold text-gray-900 mb-1.5">사유 <span className="text-red-500">*</span></div>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="정정이 필요한 사유를 입력해주세요"
              className="w-full border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75] resize-none"
            />
          </div>

          {/* 첨부파일 */}
          <div>
            <div className="text-[13px] font-semibold text-gray-900 mb-1.5">첨부파일</div>
            <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-dashed border-gray-300 rounded cursor-pointer hover:border-[#1D9E75] hover:bg-[#E1F5EE]/30 text-[12px] text-gray-600">
              <i className="fas fa-paperclip" />
              파일 선택
              <input type="file" multiple className="hidden" onChange={handleFileChange} />
            </label>
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between text-[12px] text-gray-700 bg-gray-50 rounded px-3 py-1.5">
                    <span className="truncate">{f.name} <span className="text-gray-400 ml-1">({Math.ceil(f.size / 1024)}KB)</span></span>
                    <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 ml-2"><i className="fas fa-times" /></button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!isNewMode && !changed && prefill && (
            <p className="text-[12px] text-gray-400">출근 또는 퇴근 시간을 기존 기록과 다르게 입력해주세요.</p>
          )}
          {inputMinutes <= 0 && (afterCheckIn || afterCheckOut) && (
            <p className="text-[12px] text-red-500">퇴근 시각은 출근 시각보다 늦어야 합니다.</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">취소</button>
          <button
            onClick={handleConfirm}
            disabled={!canSubmit}
            className={`px-5 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
              canSubmit ? 'bg-[#1D9E75] text-white hover:bg-[#178a65]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
