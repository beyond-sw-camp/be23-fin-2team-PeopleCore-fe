import { useEffect, useMemo, useState } from 'react'
import {
  vacationApi,
  type MyVacationTypeResponse,
} from '../../../api/vacation'

/* ══════════════════════════════════════
   타입 & 상수
   ══════════════════════════════════════ */
type DayOption = '종일' | '반차(오전)' | '반차(오후)' | '반반차'
const DAY_OPTION_VALUE: Record<DayOption, number> = { '종일': 1, '반차(오전)': 0.5, '반차(오후)': 0.5, '반반차': 0.25 }

interface SelectedDate { key: string; option: DayOption }

export interface LeaveApplyData {
  /** 호환용: 실제로는 typeId 값이 들어감 (결재 서비스 prefill에서 infoId로 소비) */
  infoId: number
  type: string
  dates: SelectedDate[]
  rangeStart: string
  rangeEnd: string
  rangeOption: DayOption
  selMode: '날짜 선택' | '기간 지정'
  totalDays: number
  vacReqStartat: string
  vacReqEndat: string
  vacReqReason: string
  attachments: File[]
}

/* ══════════════════════════════════════
   휴가 신청 모달
   ══════════════════════════════════════ */
export default function LeaveApplyModal({ onClose, onSubmitToApproval }: { onClose: () => void; onSubmitToApproval: (data: LeaveApplyData) => void }) {
  const [types, setTypes] = useState<MyVacationTypeResponse[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)
  const [selMode, setSelMode] = useState<'날짜 선택' | '기간 지정'>('날짜 선택')

  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1)

  const [selectedDates, setSelectedDates] = useState<SelectedDate[]>([])
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')
  const [rangeOption, setRangeOption] = useState<DayOption>('종일')
  const [attachments, setAttachments] = useState<File[]>([])
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    let aborted = false
    const load = async () => {
      setLoading(true)
      try {
        const typesRes = await vacationApi.getMyVacationTypes()
        if (aborted) return
        setTypes(typesRes)
      } catch {
        // 서버 미응답 시 빈 상태
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    void load()
    return () => { aborted = true }
  }, [])

  const currentType = useMemo(
    () => types.find((t) => t.typeId === selectedTypeId) ?? null,
    [types, selectedTypeId],
  )

  // 새 API가 잔여량을 함께 반환. 음수는 선사용 허용 회사의 연차/월차에서 발생 가능.
  const remaining = currentType?.remainingDays ?? 0
  const maxDays = remaining

  // deductUnit=1.0 → 종일만, 0.5 → 반차, 0.25 → 반반차까지
  const allowPartialDay = currentType ? currentType.deductUnit < 1.0 : false
  const allowQuarterDay = currentType ? currentType.deductUnit <= 0.25 : false

  const selectedCount = selMode === '날짜 선택'
    ? selectedDates.reduce((sum, d) => sum + DAY_OPTION_VALUE[d.option], 0)
    : (() => {
        if (!rangeStart || !rangeEnd) return 0
        const s = new Date(rangeStart); const e = new Date(rangeEnd)
        let count = 0; const cur = new Date(s)
        while (cur <= e) { if (cur.getDay() !== 0 && cur.getDay() !== 6) count++; cur.setDate(cur.getDate() + 1) }
        return count * DAY_OPTION_VALUE[rangeOption]
      })()

  // 캘린더
  const firstDow = new Date(calYear, calMonth - 1, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth, 0).getDate()
  const calCells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const toggleDate = (day: number) => {
    const key = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (selectedDates.some((d) => d.key === key)) {
      setSelectedDates((prev) => prev.filter((d) => d.key !== key))
    } else {
      setSelectedDates((prev) => [...prev, { key, option: '종일' }])
    }
  }

  const updateDateOption = (key: string, option: DayOption) => {
    setSelectedDates((prev) => prev.map((d) => d.key === key ? { ...d, option } : d))
  }

  const prevMonth = () => {
    if (calMonth === 1) { setCalYear((y) => y - 1); setCalMonth(12) }
    else setCalMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 12) { setCalYear((y) => y + 1); setCalMonth(1) }
    else setCalMonth((m) => m + 1)
  }

  const formatDateShort = (key: string) => {
    const parts = key.split('-')
    return `${parts[1]}/${parts[2]}`
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const resetForm = () => {
    setSelectedDates([]); setRangeStart(''); setRangeEnd(''); setAttachments([]); setReason('')
  }

  const canSubmit = currentType
    && selectedCount > 0
    && selectedCount <= maxDays

  const computeRange = (): { start: string; end: string } | null => {
    if (selMode === '기간 지정') {
      if (!rangeStart || !rangeEnd) return null
      return { start: `${rangeStart}T00:00:00`, end: `${rangeEnd}T23:59:59` }
    }
    if (selectedDates.length === 0) return null
    const sorted = [...selectedDates].map((d) => d.key).sort()
    return { start: `${sorted[0]}T00:00:00`, end: `${sorted[sorted.length - 1]}T23:59:59` }
  }

  const handleSubmit = () => {
    if (!currentType || submitting) return
    const range = computeRange()
    if (!range) { setSubmitError('휴가 일자를 선택해주세요.'); return }
    setSubmitting(true)
    setSubmitError(null)
    try {
      onSubmitToApproval({
        infoId: currentType.typeId,
        type: currentType.typeName,
        dates: selectedDates,
        rangeStart,
        rangeEnd,
        rangeOption,
        selMode,
        totalDays: selectedCount,
        vacReqStartat: range.start,
        vacReqEndat: range.end,
        vacReqReason: reason.trim() || currentType.typeName,
        attachments,
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-[480px] p-8 text-center text-[13px] text-gray-500">
          휴가 유형을 불러오는 중...
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[720px] flex flex-col max-h-[90vh]">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-[16px] font-bold text-gray-900">휴가 신청</h2>
          <p className="text-[12px] text-gray-500 mt-1">휴가 유형과 일자를 선택한 뒤 전자결재를 상신합니다.</p>
        </div>

        <div className="px-6 py-5 overflow-y-auto space-y-5">
          {/* 휴가유형 */}
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold text-gray-900 shrink-0">휴가유형 <span className="text-red-500">*</span></span>
            <select value={selectedTypeId ?? ''}
              onChange={(e) => { setSelectedTypeId(e.target.value ? Number(e.target.value) : null); resetForm() }}
              className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none flex-1">
              <option value="">휴가 유형을 선택하세요</option>
              {types.map((t) => (
                <option key={t.typeId} value={t.typeId}>{t.typeName} ({t.typeCode})</option>
              ))}
            </select>
          </div>

          {/* 유형 미선택 시 안내 */}
          {!currentType && (
            <div className="text-center py-8 text-[13px] text-gray-400">휴가 유형을 선택해주세요</div>
          )}

          {/* 유형 선택 후 표시 */}
          {currentType && (
            <>
              {/* 보유 잔여 */}
              <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center gap-8">
                <span className="text-[13px] text-gray-600">보유 잔여</span>
                <span className={`text-[15px] font-bold ${remaining < 0 ? 'text-red-500' : remaining === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
                  {remaining}일
                </span>
                <span className="text-[11px] text-gray-500">{currentType.balanceYear}년도 기준</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${currentType.payType === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                  {currentType.payType === 'PAID' ? '유급' : '무급'}
                </span>
                {remaining < 0 && <span className="text-[11px] text-red-500 ml-auto">선사용 상태 (추가 신청 시 주의)</span>}
                {remaining === 0 && <span className="text-[11px] text-gray-500 ml-auto">잔여가 없습니다</span>}
              </div>

              {/* 휴가신청일 */}
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-[13px] font-semibold text-gray-900 shrink-0">휴가신청일 <span className="text-red-500">*</span></span>
                  <label className="flex items-center gap-1.5 text-[12px] text-gray-700 cursor-pointer">
                    <input type="radio" name="selMode" checked={selMode === '날짜 선택'} onChange={() => { setSelMode('날짜 선택'); setRangeStart(''); setRangeEnd('') }} className="accent-[#1D9E75]" />
                    날짜 선택
                  </label>
                  <label className="flex items-center gap-1.5 text-[12px] text-gray-700 cursor-pointer">
                    <input type="radio" name="selMode" checked={selMode === '기간 지정'} onChange={() => { setSelMode('기간 지정'); setSelectedDates([]) }} className="accent-[#1D9E75]" />
                    기간 지정
                  </label>
                </div>

                {selMode === '날짜 선택' ? (
                  <div className="flex gap-4">
                    {/* 캘린더 */}
                    <div className="border border-gray-200 rounded-lg p-4 w-[320px] shrink-0">
                      <div className="flex items-center justify-between mb-3">
                        <button onClick={prevMonth} className="text-gray-400 hover:text-gray-600"><i className="fas fa-chevron-left text-[12px]" /></button>
                        <span className="text-[14px] font-bold text-gray-900">{calYear}년 {calMonth}월</span>
                        <button onClick={nextMonth} className="text-gray-400 hover:text-gray-600"><i className="fas fa-chevron-right text-[12px]" /></button>
                      </div>
                      <div className="grid grid-cols-7 text-center text-[11px] text-gray-500 mb-1">
                        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                          <div key={d} className={i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : ''}>{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 text-center">
                        {calCells.map((day, idx) => {
                          if (day === null) return <div key={`e${idx}`} className="py-1.5" />
                          const key = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                          const isSelected = selectedDates.some((d) => d.key === key)
                          const dow = new Date(calYear, calMonth - 1, day).getDay()
                          const isWeekend = dow === 0 || dow === 6
                          const disabled = isWeekend
                          return (
                            <button key={key} onClick={() => !disabled && toggleDate(day)}
                              className={`py-1.5 text-[13px] rounded transition-colors ${
                                isSelected ? 'bg-[#1D9E75] text-white font-bold'
                                : disabled ? 'text-gray-300 cursor-not-allowed'
                                : dow === 0 ? 'text-red-400 hover:bg-red-50'
                                : dow === 6 ? 'text-blue-400 hover:bg-blue-50'
                                : 'text-gray-900 hover:bg-gray-100'
                              }`}>
                              {day}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* 신청 정보 */}
                    <div className="flex-1 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-[13px] text-gray-600">신청휴가수</span>
                        <span className={`text-[15px] font-bold ${selectedCount > maxDays ? 'text-red-500' : 'text-gray-900'}`}>{selectedCount}일</span>
                      </div>
                      {allowPartialDay && (
                        <div className="text-[11px] text-gray-400">반차{allowQuarterDay ? ', 반반차' : ''} 사용 시 옵션을 변경해주세요.</div>
                      )}
                      {selectedDates.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {[...selectedDates].sort((a, b) => a.key.localeCompare(b.key)).map((d) => (
                            <div key={d.key} className="flex items-center gap-2">
                              <span className="bg-[#1D9E75] text-white text-[11px] px-2 py-1 rounded-full flex items-center gap-1.5">
                                {formatDateShort(d.key)}
                                <button onClick={() => setSelectedDates((prev) => prev.filter((x) => x.key !== d.key))} className="hover:text-red-200">&times;</button>
                              </span>
                              {allowPartialDay ? (
                                <select value={d.option} onChange={(e) => updateDateOption(d.key, e.target.value as DayOption)}
                                  className="border border-gray-300 rounded px-2 py-1 text-[11px] outline-none text-gray-600">
                                  <option value="종일">종일</option>
                                  <option value="반차(오전)">반차(오전)</option>
                                  <option value="반차(오후)">반차(오후)</option>
                                  {allowQuarterDay && <option value="반반차">반반차</option>}
                                </select>
                              ) : (
                                <span className="text-[11px] text-gray-500">종일</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[12px] text-gray-600">시작일</span>
                      <input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none" />
                      <span className="text-gray-400">~</span>
                      <span className="text-[12px] text-gray-600">종료일</span>
                      <input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none" />
                    </div>
                    {allowPartialDay && (
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-[12px] text-gray-600">적용</span>
                        <select value={rangeOption} onChange={(e) => setRangeOption(e.target.value as DayOption)}
                          className="border border-gray-300 rounded px-2 py-1 text-[11px] outline-none text-gray-600">
                          <option value="종일">종일</option>
                          <option value="반차(오전)">반차(오전)</option>
                          <option value="반차(오후)">반차(오후)</option>
                          {allowQuarterDay && <option value="반반차">반반차</option>}
                        </select>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] text-gray-600">신청휴가수</span>
                      <span className={`text-[15px] font-bold ${selectedCount > maxDays ? 'text-red-500' : 'text-gray-900'}`}>{selectedCount}일</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 사유 */}
              <div>
                <span className="text-[13px] font-semibold text-gray-900 block mb-2">사유</span>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="휴가 사유를 입력하세요"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75] min-h-[60px] resize-y" />
              </div>

              {/* 첨부 (선택) */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[13px] font-semibold text-gray-900">증빙서류 <span className="text-[11px] text-gray-400">(선택)</span></span>
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
                          <button onClick={() => removeFile(i)} className="text-[11px] text-red-500 hover:underline ml-2">삭제</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-[11px] text-gray-400">
            {submitError && <span className="text-red-500">{submitError}</span>}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">취소</button>
            <button onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className={`px-5 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                canSubmit && !submitting
                  ? 'bg-[#1D9E75] text-white hover:bg-[#178a65]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}>
              {submitting ? '처리 중...' : '결재 상신'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
