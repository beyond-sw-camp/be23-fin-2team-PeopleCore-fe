import { useEffect, useMemo, useState } from 'react'
import { vacationApi, type VacationGrantableTypeResponse } from '../../../api/vacation'

export interface VacationGrantRequestData {
  typeId: number
  typeCode: string
  typeName: string
  /** MISCARRIAGE 는 서버가 자동 산정하므로 0 */
  requestDays: number
  reason: string
  /** MISCARRIAGE 일 때만 값, 그 외 null */
  pregnancyWeeks: number | null
  attachments: File[]
}

const isMiscarriage = (code: string) => code === 'MISCARRIAGE'

export default function VacationGrantRequestModal({
  onClose,
  onSubmitToApproval,
}: {
  onClose: () => void
  onSubmitToApproval: (data: VacationGrantRequestData) => void
}) {
  const [types, setTypes] = useState<VacationGrantableTypeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)
  const [requestDays, setRequestDays] = useState<string>('')
  const [pregnancyWeeks, setPregnancyWeeks] = useState<string>('')
  const [reason, setReason] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    let aborted = false
    vacationApi
      .getGrantableTypes()
      .then((res) => { if (!aborted) setTypes(res) })
      .catch(() => {})
      .finally(() => { if (!aborted) setLoading(false) })
    return () => { aborted = true }
  }, [])

  const currentType = useMemo(
    () => types.find((t) => t.typeId === selectedTypeId) ?? null,
    [types, selectedTypeId],
  )

  const miscarriage = !!currentType && isMiscarriage(currentType.typeCode)
  const requestDaysNumber = Number(requestDays)
  const pregnancyWeeksNumber = Number(pregnancyWeeks)

  const exceedsGrantable =
    !miscarriage
    && currentType !== null
    && currentType.grantableDays !== null
    && requestDays !== ''
    && Number.isFinite(requestDaysNumber)
    && requestDaysNumber > currentType.grantableDays

  const isValidDays = miscarriage
    ? true
    : requestDays !== ''
      && Number.isFinite(requestDaysNumber)
      && requestDaysNumber > 0
      && !exceedsGrantable

  const isValidPregnancyWeeks = !miscarriage
    || (pregnancyWeeks !== '' && Number.isFinite(pregnancyWeeksNumber) && pregnancyWeeksNumber > 0 && pregnancyWeeksNumber <= 45)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const canSubmit =
    !!currentType
    && isValidDays
    && isValidPregnancyWeeks
    && reason.trim().length > 0

  const handleSubmit = () => {
    if (!currentType || submitting) return
    if (!isValidDays) {
      if (exceedsGrantable && currentType.grantableDays !== null) {
        setSubmitError(`남은 신청 가능 일수(${currentType.grantableDays}일)를 초과할 수 없습니다.`)
      } else {
        setSubmitError('신청 일수를 확인해주세요.')
      }
      return
    }
    if (!isValidPregnancyWeeks) {
      setSubmitError('임신 주수를 1~45 사이로 입력해주세요.')
      return
    }
    if (reason.trim().length === 0) {
      setSubmitError('사유를 입력해주세요.')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      onSubmitToApproval({
        typeId: currentType.typeId,
        typeCode: currentType.typeCode,
        typeName: currentType.typeName,
        requestDays: miscarriage ? 0 : requestDaysNumber,
        reason: reason.trim(),
        pregnancyWeeks: miscarriage ? pregnancyWeeksNumber : null,
        attachments,
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-3">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-[480px] p-8 text-center text-[13px] text-gray-500">
          신청 가능한 휴가 유형을 불러오는 중...
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-[640px] flex flex-col max-h-[90vh]">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-[16px] font-bold text-gray-900">휴가 부여 요청</h2>
          <p className="text-[12px] text-gray-500 mt-1">
            법정휴가 또는 회사 제공 휴가의 부여를 요청합니다. 결재라인에 HR_ADMIN 이상 권한자가 반드시 포함되어야 합니다.
          </p>
        </div>

        <div className="px-6 py-5 overflow-y-auto space-y-5">
          {/* 휴가 종류 */}
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold text-gray-900 shrink-0 w-[90px]">
              휴가 종류 <span className="text-red-500">*</span>
            </span>
            <select
              value={selectedTypeId ?? ''}
              onChange={(e) => {
                setSelectedTypeId(e.target.value ? Number(e.target.value) : null)
                setRequestDays('')
                setPregnancyWeeks('')
                setSubmitError(null)
              }}
              disabled={types.length === 0}
              className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none flex-1 disabled:bg-gray-50"
            >
              <option value="">
                {types.length === 0 ? '신청 가능한 휴가가 없습니다' : '휴가 종류를 선택하세요'}
              </option>
              {types.map((t) => (
                <option key={t.typeId} value={t.typeId}>
                  {t.typeName}
                  {t.cap !== null ? ` (${t.cap}일 한도)` : ' (한도 없음)'}
                </option>
              ))}
            </select>
          </div>

          {/* 선택된 유형 요약 */}
          {currentType && (
            <div className="bg-gray-50 rounded-lg px-4 py-3 grid grid-cols-3 gap-y-1.5 gap-x-6">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500">연간 한도</span>
                <span className="text-[13px] font-semibold text-gray-900">
                  {currentType.cap !== null ? `${currentType.cap}일` : '한도 없음'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500">부여받은 일수</span>
                <span className="text-[13px] font-semibold text-gray-900">{currentType.totalDays}일</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500">사용 가능 잔여</span>
                <span className="text-[13px] font-semibold text-gray-900">{currentType.availableDays}일</span>
              </div>
              {currentType.pendingGrantDays > 0 && (
                <div className="flex items-center gap-2 col-span-3">
                  <span className="text-[11px] text-yellow-600">부여 결재 대기 중 {currentType.pendingGrantDays}일</span>
                </div>
              )}
              <div className="flex items-center gap-2 col-span-3 border-t border-gray-200 pt-2 mt-1">
                <span className="text-[11px] text-gray-500">추가 신청 가능</span>
                <span className={`text-[14px] font-bold ${
                  currentType.grantableDays === null
                    ? 'text-gray-900'
                    : currentType.grantableDays <= 0
                      ? 'text-red-500'
                      : 'text-[#1D9E75]'
                }`}>
                  {currentType.grantableDays === null ? '한도 없음' : `${currentType.grantableDays}일`}
                </span>
                {currentType.grantableDays !== null && currentType.grantableDays <= 0 && (
                  <span className="text-[11px] text-red-500">올해 한도를 모두 소진했습니다</span>
                )}
              </div>
            </div>
          )}

          {/* MISCARRIAGE 전용: 임신 주수 */}
          {currentType && miscarriage && (
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-semibold text-gray-900 shrink-0 w-[90px]">
                임신 주수 <span className="text-red-500">*</span>
              </span>
              <input
                type="number"
                min="1"
                max="45"
                step="1"
                value={pregnancyWeeks}
                onChange={(e) => setPregnancyWeeks(e.target.value)}
                placeholder="예: 12"
                className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none w-[140px]"
              />
              <span className="text-[12px] text-gray-500">주</span>
              <span className="text-[11px] text-gray-400 ml-2">※ 주수에 따라 부여 일수는 서버에서 자동 산정됩니다</span>
            </div>
          )}

          {/* 신청 일수 (MISCARRIAGE 외) */}
          {currentType && !miscarriage && (
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-semibold text-gray-900 shrink-0 w-[90px]">
                  신청 일수 <span className="text-red-500">*</span>
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={requestDays}
                  onChange={(e) => setRequestDays(e.target.value)}
                  placeholder={
                    currentType.grantableDays !== null
                      ? `1 ~ ${currentType.grantableDays}일 입력`
                      : '일수 입력'
                  }
                  className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none flex-1"
                />
                <span className="text-[12px] text-gray-500">일</span>
              </div>
              {exceedsGrantable && currentType.grantableDays !== null && (
                <div className="ml-[102px] mt-1.5 text-[11px] text-red-500">
                  남은 신청 가능 일수({currentType.grantableDays}일)를 초과할 수 없습니다
                </div>
              )}
            </div>
          )}

          {/* 사유 */}
          <div>
            <span className="text-[13px] font-semibold text-gray-900 block mb-2">
              사유 <span className="text-red-500">*</span>
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="휴가 부여 요청 사유를 입력하세요 (예: 2026-06-15 출산 예정)"
              className="w-full border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75] min-h-[80px] resize-y"
            />
          </div>

          {/* 증빙서류 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[13px] font-semibold text-gray-900">
                증빙서류 <span className="text-[11px] text-gray-400">(진단서, 가족관계증명서 등)</span>
              </span>
            </div>
            <div className="border border-dashed border-gray-300 rounded-lg p-4">
              <label className="flex items-center justify-center gap-2 cursor-pointer text-[12px] text-gray-500 hover:text-[#1D9E75] transition-colors">
                <i className="fas fa-cloud-upload-alt" />
                파일을 선택하거나 드래그하세요
                <input type="file" multiple onChange={handleFileChange} className="hidden" />
              </label>
              {attachments.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {attachments.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded px-3 py-1.5">
                      <span className="text-[11px] text-gray-700 truncate">{f.name}</span>
                      <button
                        onClick={() => removeFile(i)}
                        className="text-[11px] text-red-500 hover:underline ml-2"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-[11px] text-gray-400">
            {submitError && <span className="text-red-500">{submitError}</span>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className={`px-5 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                canSubmit && !submitting
                  ? 'bg-[#1D9E75] text-white hover:bg-[#178a65]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {submitting ? '처리 중...' : '결재 상신'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
