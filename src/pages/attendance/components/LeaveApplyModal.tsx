import { useState } from 'react'
import { LEAVE_SUMMARY } from './LeaveStatusView'

/* ══════════════════════════════════════
   타입 & 상수
   ══════════════════════════════════════ */
export type DayOption = '종일' | '반차(오전)' | '반차(오후)' | '반반차'
export const DAY_OPTION_VALUE: Record<DayOption, number> = { '종일': 1, '반차(오전)': 0.5, '반차(오후)': 0.5, '반반차': 0.25 }

export const LEAVE_TYPE_OPTIONS = [
  { value: '연차', unit: '일', remaining: LEAVE_SUMMARY.remaining, desc: '연차 유급 휴가' },
  { value: '보상휴가', unit: '일', remaining: 0, desc: '초과근로에 해당하는 임금을...' },
  { value: '출산휴가', unit: '일', remaining: 90, desc: '출산 휴가' },
  { value: '출산휴가-다태아', unit: '일', remaining: 120, desc: '출산 휴가 (다태아)' },
  { value: '배우자돌봄휴가', unit: '일', remaining: 20, desc: '배우자 돌봄 휴가' },
  { value: '가족돌봄휴가', unit: '일', remaining: 10, desc: '가족 돌봄 휴가 (무급)' },
]

export interface SelectedDate { key: string; option: DayOption }

/* ══════════════════════════════════════
   휴가 신청 모달
   ══════════════════════════════════════ */
export default function LeaveApplyModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState('연차')
  const [selMode, setSelMode] = useState<'날짜 선택' | '기간 지정'>('날짜 선택')
  const [calYear, setCalYear] = useState(2026)
  const [calMonth, setCalMonth] = useState(3)
  const [selectedDates, setSelectedDates] = useState<SelectedDate[]>([])
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')
  const [rangeOption, setRangeOption] = useState<DayOption>('종일')

  const currentType = LEAVE_TYPE_OPTIONS.find((t) => t.value === type) ?? LEAVE_TYPE_OPTIONS[0]
  const maxDays = currentType.remaining

  // 선택된 일수 합산
  const selectedCount = selMode === '날짜 선택'
    ? selectedDates.reduce((sum, d) => sum + DAY_OPTION_VALUE[d.option], 0)
    : (() => {
        if (!rangeStart || !rangeEnd) return 0
        const s = new Date(rangeStart); const e = new Date(rangeEnd)
        if (e < s) return 0
        let count = 0; const cur = new Date(s)
        while (cur <= e) { if (cur.getDay() !== 0 && cur.getDay() !== 6) count++; cur.setDate(cur.getDate() + 1) }
        return count * DAY_OPTION_VALUE[rangeOption]
      })()

  // 달력 생성
  const firstDay = new Date(calYear, calMonth - 1, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth, 0).getDate()
  const calCells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) calCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d)

  const toggleDate = (day: number) => {
    const dow = new Date(calYear, calMonth - 1, day).getDay()
    if (dow === 0 || dow === 6) return
    const key = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const existing = selectedDates.find((d) => d.key === key)
    if (existing) {
      setSelectedDates((prev) => prev.filter((d) => d.key !== key))
    } else {
      const nextCount = selectedDates.reduce((sum, d) => sum + DAY_OPTION_VALUE[d.option], 0) + 1
      if (nextCount > maxDays) return
      setSelectedDates((prev) => [...prev, { key, option: '종일' }])
    }
  }

  const updateDateOption = (key: string, option: DayOption) => {
    const newDates = selectedDates.map((d) => d.key === key ? { ...d, option } : d)
    const newCount = newDates.reduce((sum, d) => sum + DAY_OPTION_VALUE[d.option], 0)
    if (newCount > maxDays) return
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[720px] flex flex-col max-h-[90vh]">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-[16px] font-bold text-gray-900">휴가 신청</h2>
          <p className="text-[12px] text-gray-500 mt-1">신청할 휴가와 일자를 선택하여 전자결재 진행 시 휴가 신청이 완료됩니다.</p>
        </div>

        <div className="px-6 py-5 overflow-y-auto space-y-5">
          {/* 휴가유형 */}
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-semibold text-gray-900 shrink-0">휴가유형 <span className="text-red-500">*</span></span>
            <select value={type} onChange={(e) => { setType(e.target.value); setSelectedDates([]); setRangeStart(''); setRangeEnd('') }}
              className="border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none">
              {LEAVE_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.value}</option>)}
            </select>
            <span className="text-[12px] text-[#1D9E75] font-medium">휴가신청단위 : {currentType.unit}</span>
          </div>
          <div className="text-[12px] text-gray-500 -mt-2 ml-[1px]">{currentType.desc}</div>

          {/* 보유 휴가 */}
          <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center gap-8">
            <span className="text-[13px] text-gray-600">보유 휴가</span>
            <span className={`text-[15px] font-bold ${maxDays <= 0 ? 'text-red-500' : 'text-gray-900'}`}>{maxDays}d</span>
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
                      const currentCount = selectedDates.reduce((sum, d) => sum + DAY_OPTION_VALUE[d.option], 0)
                      const wouldExceed = !isSelected && currentCount + 1 > maxDays
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
                    <span className={`text-[15px] font-bold ${selectedCount > maxDays ? 'text-red-500' : 'text-gray-900'}`}>{selectedCount}d</span>
                    <button className="text-[11px] text-[#1D9E75] hover:underline ml-auto">신청가이드</button>
                  </div>
                  <div className="text-[11px] text-gray-400 space-y-1">
                    <p>반차, 반반차 등 휴가를 신청하는 경우 옵션을 변경해주세요.</p>
                    <p>소정근로시간이 같은 기간끼리 휴가신청이 가능합니다.</p>
                  </div>
                  {selectedDates.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {[...selectedDates].sort((a, b) => a.key.localeCompare(b.key)).map((d) => (
                        <div key={d.key} className="flex items-center gap-2">
                          <span className="bg-[#1D9E75] text-white text-[11px] px-2 py-1 rounded-full flex items-center gap-1.5">
                            {formatDateShort(d.key)}
                            <button onClick={() => setSelectedDates((prev) => prev.filter((x) => x.key !== d.key))} className="hover:text-red-200">&times;</button>
                          </span>
                          <select value={d.option} onChange={(e) => updateDateOption(d.key, e.target.value as DayOption)}
                            className="border border-gray-300 rounded px-2 py-1 text-[11px] outline-none text-gray-600">
                            <option value="종일">종일</option>
                            <option value="반차(오전)">반차(오전)</option>
                            <option value="반차(오후)">반차(오후)</option>
                            <option value="반반차">반반차</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex gap-4">
                {/* 기간 지정 */}
                <div className="border border-gray-200 rounded-lg p-4 flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[12px] text-gray-600">시작일</span>
                    <input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none" />
                    <span className="text-gray-400">~</span>
                    <span className="text-[12px] text-gray-600">종료일</span>
                    <input type="date" value={rangeEnd} onChange={(e) => {
                      const v = e.target.value
                      if (rangeStart && v) {
                        const s = new Date(rangeStart); const end = new Date(v)
                        let cnt = 0; const cur = new Date(s)
                        while (cur <= end) { if (cur.getDay() !== 0 && cur.getDay() !== 6) cnt++; cur.setDate(cur.getDate() + 1) }
                        if (cnt * DAY_OPTION_VALUE[rangeOption] > maxDays) return
                      }
                      setRangeEnd(v)
                    }} className="border border-gray-300 rounded px-2 py-1.5 text-[12px] outline-none" />
                  </div>
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
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-gray-600">신청휴가수</span>
                    <span className={`text-[15px] font-bold ${selectedCount > maxDays ? 'text-red-500' : 'text-gray-900'}`}>{selectedCount}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-2">
                    <p>반차, 반반차 등 휴가를 신청하는 경우 옵션을 변경해주세요.</p>
                    <p>소정근로시간이 같은 기간끼리 휴가신청이 가능합니다.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
          <button onClick={onClose} className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors">취소</button>
          <button onClick={onClose}
            disabled={selectedCount === 0 || selectedCount > maxDays}
            className={`px-5 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
              selectedCount > 0 && selectedCount <= maxDays
                ? 'bg-[#1D9E75] text-white hover:bg-[#178a65]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}>
            전자결재 상신
          </button>
        </div>
      </div>
    </div>
  )
}
