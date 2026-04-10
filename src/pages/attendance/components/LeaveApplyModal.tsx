import { useState } from 'react'

/* ══════════════════════════════════════
   타입 & 상수
   ══════════════════════════════════════ */
type DayOption = '종일' | '반차(오전)' | '반차(오후)' | '반반차'
const DAY_OPTION_VALUE: Record<DayOption, number> = { '종일': 1, '반차(오전)': 0.5, '반차(오후)': 0.5, '반반차': 0.25 }

/**
 * 시나리오별 휴가 카테고리
 *
 * annual     : 연차/월차 — 잔여에서 차감, 날짜선택/기간지정, 관리자 승인
 * legal      : 법적 근로 휴가 (출산, 육아 등) — 증빙 첨부, 인사과 승인, 승인 시 잔여 생성
 * statutory  : 경조/생리 등 법정일수 기반 — 잔여에서 차감, 인사과 승인
 * official   : 공가/출장/훈련 — 통지서 첨부, 잔여 차감 없음, 인사과 승인
 * compensatory: 보상휴가 — 초과근무 승인으로 자동 적립된 잔여에서 차감
 */
type LeaveCategory = 'annual' | 'legal' | 'statutory' | 'official' | 'compensatory'

interface LeaveTypeOption {
  value: string
  category: LeaveCategory
  desc: string
  requireAttachment: boolean
  deductBalance: boolean
  approver: '관리자' | '인사과'
}

// TODO: GET /api/attendance/leave-types?activeOnly=true 에서 가져올 목록
const LEAVE_TYPE_OPTIONS: LeaveTypeOption[] = []

interface SelectedDate { key: string; option: DayOption }

export interface LeaveApplyData {
  type: string
  category: LeaveCategory
  dates: SelectedDate[]
  rangeStart: string
  rangeEnd: string
  rangeOption: DayOption
  selMode: '날짜 선택' | '기간 지정'
  totalDays: number
  attachments: File[]
}

/* ══════════════════════════════════════
   휴가 신청 모달
   ══════════════════════════════════════ */
export default function LeaveApplyModal({ onClose, onSubmitToApproval }: { onClose: () => void; onSubmitToApproval: (data: LeaveApplyData) => void }) {
  const [type, setType] = useState('')
  const [selMode, setSelMode] = useState<'날짜 선택' | '기간 지정'>('날짜 선택')
  const [calYear, setCalYear] = useState(2026)
  const [calMonth, setCalMonth] = useState(4)
  const [selectedDates, setSelectedDates] = useState<SelectedDate[]>([])
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')
  const [rangeOption, setRangeOption] = useState<DayOption>('종일')
  const [attachments, setAttachments] = useState<File[]>([])

  // TODO: GET /api/attendance/my/leave-balance?type={type} 에서 가져올 값
  const [remaining] = useState(0)

  const currentType = LEAVE_TYPE_OPTIONS.find((t) => t.value === type)
  const category = currentType?.category
  const needsAttachment = currentType?.requireAttachment ?? false
  const deductsBalance = currentType?.deductBalance ?? true
  const maxDays = deductsBalance ? remaining : 9999

  // 날짜 선택/기간 지정에서는 반차/반반차 사용 가능 (연차, 경조, 보상)
  const allowPartialDay = category === 'annual' || category === 'statutory' || category === 'compensatory'

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
      const nextCount = selectedDates.reduce((sum, d) => sum + DAY_OPTION_VALUE[d.option], 0) + 1
      if (deductsBalance && nextCount > maxDays) return
      setSelectedDates((prev) => [...prev, { key, option: '종일' }])
    }
  }

  const updateDateOption = (key: string, option: DayOption) => {
    const newDates = selectedDates.map((d) => d.key === key ? { ...d, option } : d)
    const newCount = newDates.reduce((sum, d) => sum + DAY_OPTION_VALUE[d.option], 0)
    if (deductsBalance && newCount > maxDays) return
    setSelectedDates(newDates)
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
    setSelectedDates([]); setRangeStart(''); setRangeEnd(''); setAttachments([])
  }

  const canSubmit = currentType
    && selectedCount > 0
    && (deductsBalance ? selectedCount <= maxDays : true)
    && (needsAttachment ? attachments.length > 0 : true)

  const handleSubmit = () => {
    if (!currentType) return
    onSubmitToApproval({
      type,
      category: currentType.category,
      dates: selectedDates,
      rangeStart,
      rangeEnd,
      rangeOption,
      selMode,
      totalDays: selectedCount,
      attachments,
    })
  }

  // 카테고리별 그룹핑
  const groupedTypes: { label: string; category: string; types: LeaveTypeOption[] }[] = [
    { label: '연차/월차', category: 'annual', types: LEAVE_TYPE_OPTIONS.filter((t) => t.category === 'annual') },
    { label: '보상휴가', category: 'compensatory', types: LEAVE_TYPE_OPTIONS.filter((t) => t.category === 'compensatory') },
    { label: '경조/생리 휴가', category: 'statutory', types: LEAVE_TYPE_OPTIONS.filter((t) => t.category === 'statutory') },
    { label: '법적 근로 휴가 (인사과 승인)', category: 'legal', types: LEAVE_TYPE_OPTIONS.filter((t) => t.category === 'legal') },
    { label: '공가/출장/훈련', category: 'official', types: LEAVE_TYPE_OPTIONS.filter((t) => t.category === 'official') },
  ].filter((g) => g.types.length > 0)

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
            <select value={type} onChange={(e) => { setType(e.target.value); resetForm() }}
              className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none flex-1">
              <option value="">휴가 유형을 선택하세요</option>
              {groupedTypes.map((g) => (
                <optgroup key={g.category} label={g.label}>
                  {g.types.map((t) => <option key={t.value} value={t.value}>{t.value}</option>)}
                </optgroup>
              ))}
            </select>
            {currentType && (
              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                currentType.approver === '인사과' ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {currentType.approver} 승인
              </span>
            )}
          </div>
          {currentType && <div className="text-[12px] text-gray-500 -mt-2 ml-[1px]">{currentType.desc}</div>}

          {/* 유형 미선택 시 안내 */}
          {!currentType && (
            <div className="text-center py-8 text-[13px] text-gray-400">휴가 유형을 선택해주세요</div>
          )}

          {/* 유형 선택 후 표시 */}
          {currentType && (
            <>
              {/* 보유 잔여 (잔여 차감 유형만) */}
              {deductsBalance && (
                <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center gap-8">
                  <span className="text-[13px] text-gray-600">보유 잔여</span>
                  <span className={`text-[15px] font-bold ${remaining <= 0 ? 'text-red-500' : 'text-gray-900'}`}>{remaining}일</span>
                  {remaining <= 0 && <span className="text-[11px] text-red-500">잔여가 부족하여 신청할 수 없습니다</span>}
                </div>
              )}

              {/* 잔여 차감 없는 유형 안내 (공가/출장) */}
              {!deductsBalance && (
                <div className="bg-blue-50 rounded-lg px-4 py-3">
                  <p className="text-[11px] text-blue-600">이 휴가 유형은 잔여를 차감하지 않으며, 해당 일은 출근 인정 처리됩니다.</p>
                </div>
              )}

              {/* 휴가신청일 */}
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-[13px] font-semibold text-gray-900 shrink-0">휴가신청일 <span className="text-red-500">*</span></span>
                  {(category === 'annual' || category === 'statutory' || category === 'compensatory') && (
                    <>
                      <label className="flex items-center gap-1.5 text-[12px] text-gray-700 cursor-pointer">
                        <input type="radio" name="selMode" checked={selMode === '날짜 선택'} onChange={() => { setSelMode('날짜 선택'); setRangeStart(''); setRangeEnd('') }} className="accent-[#1D9E75]" />
                        날짜 선택
                      </label>
                      <label className="flex items-center gap-1.5 text-[12px] text-gray-700 cursor-pointer">
                        <input type="radio" name="selMode" checked={selMode === '기간 지정'} onChange={() => { setSelMode('기간 지정'); setSelectedDates([]) }} className="accent-[#1D9E75]" />
                        기간 지정
                      </label>
                    </>
                  )}
                </div>

                {/* 법적 휴가 / 공가: 기간 지정만 */}
                {(category === 'legal' || category === 'official') ? (
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
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] text-gray-600">신청일수</span>
                      <span className="text-[15px] font-bold text-gray-900">{selectedCount}일</span>
                    </div>
                  </div>
                ) : selMode === '날짜 선택' ? (
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
                          const currentCount = selectedDates.reduce((sum, d) => sum + DAY_OPTION_VALUE[d.option], 0)
                          const wouldExceed = !isSelected && deductsBalance && currentCount + 1 > maxDays
                          const disabled = isWeekend || wouldExceed
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
                        <span className={`text-[15px] font-bold ${deductsBalance && selectedCount > maxDays ? 'text-red-500' : 'text-gray-900'}`}>{selectedCount}일</span>
                      </div>
                      {allowPartialDay && (
                        <div className="text-[11px] text-gray-400 space-y-1">
                          <p>반차, 반반차 등 휴가를 신청하는 경우 옵션을 변경해주세요.</p>
                        </div>
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
                                  <option value="반반차">반반차</option>
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
                  /* 기간 지정 */
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[12px] text-gray-600">시작일</span>
                      <input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none" />
                      <span className="text-gray-400">~</span>
                      <span className="text-[12px] text-gray-600">종료일</span>
                      <input type="date" value={rangeEnd} onChange={(e) => {
                        const v = e.target.value
                        if (rangeStart && v && deductsBalance) {
                          const s = new Date(rangeStart); const end = new Date(v)
                          let cnt = 0; const cur = new Date(s)
                          while (cur <= end) { if (cur.getDay() !== 0 && cur.getDay() !== 6) cnt++; cur.setDate(cur.getDate() + 1) }
                          if (cnt * DAY_OPTION_VALUE[rangeOption] > maxDays) return
                        }
                        setRangeEnd(v)
                      }} className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none" />
                    </div>
                    {allowPartialDay && (
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-[12px] text-gray-600">적용</span>
                        <select value={rangeOption} onChange={(e) => setRangeOption(e.target.value as DayOption)}
                          className="border border-gray-300 rounded px-2 py-1 text-[11px] outline-none text-gray-600">
                          <option value="종일">종일</option>
                          <option value="반차(오전)">반차(오전)</option>
                          <option value="반차(오후)">반차(오후)</option>
                          <option value="반반차">반반차</option>
                        </select>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] text-gray-600">신청휴가수</span>
                      <span className={`text-[15px] font-bold ${deductsBalance && selectedCount > maxDays ? 'text-red-500' : 'text-gray-900'}`}>{selectedCount}일</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 증빙서류 첨부 (법적 휴가, 공가) */}
              {needsAttachment && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[13px] font-semibold text-gray-900">증빙서류 <span className="text-red-500">*</span></span>
                    <span className="text-[11px] text-gray-400">
                      {category === 'legal' && '출산증명서, 진단서 등 증빙서류를 첨부해주세요'}
                      {category === 'official' && '소집통지서, 출장명령서 등을 첨부해주세요'}
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
                            <button onClick={() => removeFile(i)} className="text-[11px] text-red-500 hover:underline ml-2">삭제</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="text-[11px] text-gray-400">
            {currentType?.approver === '인사과' && '이 휴가는 인사과 승인이 필요합니다'}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">취소</button>
            <button onClick={handleSubmit}
              disabled={!canSubmit}
              className={`px-5 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
                canSubmit
                  ? 'bg-[#1D9E75] text-white hover:bg-[#178a65]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}>
              {currentType?.approver === '인사과' ? '인사과 승인 요청' : '전자결재 상신'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
