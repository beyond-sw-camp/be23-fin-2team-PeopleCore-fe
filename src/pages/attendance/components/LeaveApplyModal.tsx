import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { vacationApi } from '../../../api/vacation'
import { attendanceApi } from '../../../api/attendance'
import { MOCK_HOLIDAYS } from '../../calendar/types'

/* ══════════════════════════════════════
   타입 & 상수
   ══════════════════════════════════════ */
type DayOption =
  | '종일'
  | '반차(전반)'
  | '반차(후반)'
  | '반반차(1/4)'
  | '반반차(2/4)'
  | '반반차(3/4)'
  | '반반차(4/4)'

const DAY_OPTION_VALUE: Record<DayOption, number> = {
  '종일': 1,
  '반차(전반)': 0.5,
  '반차(후반)': 0.5,
  '반반차(1/4)': 0.25,
  '반반차(2/4)': 0.25,
  '반반차(3/4)': 0.25,
  '반반차(4/4)': 0.25,
}

interface SelectedDate { key: string; option: DayOption }

/* ══════════════════════════════════════
   근무그룹 기반 유틸
   ══════════════════════════════════════ */
// JS Date.getDay(): 0(일) ~ 6(토)  ↔  서버 비트마스크: 월=bit0(1), ..., 일=bit6(64)
const jsDowToBitIndex = (jsDay: number) => (jsDay === 0 ? 6 : jsDay - 1)

const isWorkdayByMask = (date: Date, mask: number) =>
  (mask & (1 << jsDowToBitIndex(date.getDay()))) !== 0

const dateToKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// 공휴일 lookup — 휴가는 공휴일에 신청 불가 (이미 쉬는 날이라 차감 의미 없음)
const HOLIDAY_MAP: Map<string, string> = new Map(
  MOCK_HOLIDAYS.filter((h) => h.type === 'public').map((h) => [dateToKey(h.date), h.name]),
)
const isPublicHoliday = (date: Date) => HOLIDAY_MAP.has(dateToKey(date))
const holidayNameOf = (date: Date) => HOLIDAY_MAP.get(dateToKey(date)) ?? null

const hmsToMinutes = (hms: string): number => {
  const [h, m] = hms.split(':').map(Number)
  return h * 60 + (m || 0)
}

const minutesToHms = (mins: number): string => {
  const rounded = Math.round(mins)
  const h = Math.floor(rounded / 60)
  const m = rounded % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}

const hmsToHm = (hms: string): string => hms.slice(0, 5)

/**
 * 근무그룹 시간표(출근/퇴근/휴게) 기준으로 옵션별 [시작, 종료] HH:mm:ss 반환.
 * - 오전/오후 근무시간이 비대칭일 수 있어, 각 구간을 독립적으로 2등분.
 */
const computeOptionWindow = (
  wg: MyWorkGroupResponseDto,
  option: DayOption,
): { start: string; end: string } => {
  const s = hmsToMinutes(wg.startTime)
  const e = hmsToMinutes(wg.endTime)
  const bs = hmsToMinutes(wg.breakStart)
  const be = hmsToMinutes(wg.breakEnd)
  const morningMid = (s + bs) / 2
  const afternoonMid = (be + e) / 2
  switch (option) {
    case '종일':
      return { start: wg.startTime, end: wg.endTime }
    case '반차(전반)':
      return { start: wg.startTime, end: wg.breakStart }
    case '반차(후반)':
      return { start: wg.breakEnd, end: wg.endTime }
    case '반반차(1/4)':
      return { start: wg.startTime, end: minutesToHms(morningMid) }
    case '반반차(2/4)':
      return { start: minutesToHms(morningMid), end: wg.breakStart }
    case '반반차(3/4)':
      return { start: wg.breakEnd, end: minutesToHms(afternoonMid) }
    case '반반차(4/4)':
      return { start: minutesToHms(afternoonMid), end: wg.endTime }
  }
}

/** 휴가 일자 1건. 백엔드 스펙: {startAt, endAt, useDay} 3개 필드만. */
export interface VacReqItem {
  startAt: string   // "YYYY-MM-DDTHH:mm:ss"
  endAt: string     // "YYYY-MM-DDTHH:mm:ss" (startAt과 같은 날)
  useDay: number    // 1.0 | 0.5 | 0.25
}

/** 기간 지정 모드에서 [start, end] 사이의 근무일(mask 기반) 목록 생성 */
const enumerateWorkdays = (start: string, end: string, mask: number): string[] => {
  if (!start || !end) return []
  const out: string[] = []
  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  const cur = new Date(sy, sm - 1, sd)
  const last = new Date(ey, em - 1, ed)
  while (cur.getTime() <= last.getTime()) {
    if (isWorkdayByMask(cur, mask) && !isPublicHoliday(cur)) {
      out.push(dateToKey(cur))
    }
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

/** {date, option} 슬롯 배열 — items/display 양쪽에서 공용으로 씀 */
interface VacSlot { date: string; option: DayOption }

const collectVacSlots = (params: {
  selMode: '날짜 선택' | '기간 지정'
  selectedDates: SelectedDate[]
  rangeStart: string
  rangeEnd: string
  rangeOption: DayOption
  workGroup: MyWorkGroupResponseDto | null
}): VacSlot[] => {
  const { selMode, selectedDates, rangeStart, rangeEnd, rangeOption, workGroup } = params
  if (selMode === '기간 지정') {
    if (!rangeStart || !rangeEnd) return []
    const mask = workGroup?.workDayBitmask ?? 0b0011111 // 기본: 월~금 (bit0=월)
    return enumerateWorkdays(rangeStart, rangeEnd, mask).map((d) => ({ date: d, option: rangeOption }))
  }
  return [...selectedDates]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((d) => ({ date: d.key, option: d.option }))
}

/**
 * 슬롯 → 백엔드 전송용 VacReqItem 변환.
 * 근무그룹(workGroup)이 있어야 시작/종료 시각을 정확히 계산 가능.
 */
const buildVacReqItems = (slots: VacSlot[], workGroup: MyWorkGroupResponseDto | null): VacReqItem[] =>
  slots.map(({ date, option }) => {
    const win = workGroup
      ? computeOptionWindow(workGroup, option)
      : { start: '00:00:00', end: '23:59:59' }
    return {
      startAt: `${date}T${win.start}`,
      endAt: `${date}T${win.end}`,
      useDay: DAY_OPTION_VALUE[option],
    }
  })

/** "HH:mm:ss" → "HH:mm" */
const hm = (hms: string) => hms.slice(0, 5)

/**
 * 결재문서 "휴가 일자" 칸 표시용 문자열.
 * 각 슬롯을 "YYYY-MM-DD (옵션) HH:mm ~ HH:mm" 형식으로 줄바꿈 나열.
 */
const buildVacReqDatesText = (slots: VacSlot[], workGroup: MyWorkGroupResponseDto | null): string => {
  if (slots.length === 0) return ''
  return slots
    .map(({ date, option }) => {
      if (!workGroup) return `${date} (${option})`
      const win = computeOptionWindow(workGroup, option)
      return `${date} (${option}) ${hm(win.start)} ~ ${hm(win.end)}`
    })
    .join('\n')
}

export interface LeaveApplyData {
  /** 호환용: 실제로는 typeId 값이 들어감 (결재 서비스 prefill에서 infoId로 소비) */
  infoId: number
  type: string
  dates: SelectedDate[]
  rangeStart: string
  rangeEnd: string
  rangeOption: DayOption
  selMode: '날짜 선택' | '기간 지정'
  /** 결재문서 표시용 — 예: "2026-04-24 (종일) 09:00 ~ 18:00\n2026-04-25 (반차(전반)) 09:00 ~ 12:00" */
  vacReqDatesText: string
  /** 화면 표시용 합계(items.useDay 합). 백엔드 저장 ❌ — form_html의 "요청 휴가일수" 칸 바인딩용 */
  vacReqUseDay: number
  /** 휴가 일자 상세 목록 (백엔드 저장/검증용, 진실의 원천) */
  vacReqItems: VacReqItem[]
  vacReqReason: string
  attachments: File[]
}

/* ══════════════════════════════════════
   휴가 신청 모달
   ══════════════════════════════════════ */
export default function LeaveApplyModal({ onClose, onSubmitToApproval }: { onClose: () => void; onSubmitToApproval: (data: LeaveApplyData) => void }) {

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

  const typesQuery = useQuery({
    queryKey: ['vacation', 'myVacationTypes'],
    queryFn: () => vacationApi.getMyVacationTypes(),
  })
  const workGroupQuery = useQuery({
    queryKey: ['attendance', 'myWorkGroup'],
    queryFn: () => attendanceApi.getMyWorkGroup(),
    retry: false,
  })
  const types = typesQuery.data ?? []
  const workGroup = workGroupQuery.data ?? null
  const loading = typesQuery.isPending || workGroupQuery.isPending
  const initError: string | null = workGroupQuery.isError
    ? (() => {
        const err = workGroupQuery.error
        if (axios.isAxiosError(err) && err.response?.status === 409) {
          return '근무그룹이 배정되지 않았습니다. 관리자에게 문의해 주세요.'
        }
        return '근무그룹 정보를 불러오지 못했습니다.'
      })()
    : null

  const currentType = useMemo(
    () => types.find((t) => t.typeId === selectedTypeId) ?? null,
    [types, selectedTypeId],
  )

  // 새 API가 잔여량을 함께 반환. 음수는 선사용 허용 회사의 연차/월차에서 발생 가능.
  const remaining = currentType?.remainingDays ?? 0
  const maxDays = remaining

  // 선사용 허용 여부는 백엔드가 회사 정책(advance_use_active) AND 연차/월차 조건을 이미 반영해서 내려줌.
  const allowOverLimit = currentType?.allowAdvance ?? false

  // deductUnit=1.0 → 종일만, 0.5 → 반차, 0.25 → 반반차까지
  const allowPartialDay = currentType ? currentType.deductUnit < 1.0 : false
  const allowQuarterDay = currentType ? currentType.deductUnit <= 0.25 : false

  // 근무일 판정 — 근무그룹 비트마스크가 있으면 우선 사용, 없으면 주말 제외. 공휴일은 항상 제외.
  const isWorkingDate = (date: Date) => {
    if (isPublicHoliday(date)) return false
    return workGroup ? isWorkdayByMask(date, workGroup.workDayBitmask) : date.getDay() !== 0 && date.getDay() !== 6
  }

  const selectedCount = selMode === '날짜 선택'
    ? selectedDates.reduce((sum, d) => sum + DAY_OPTION_VALUE[d.option], 0)
    : (() => {
        if (!rangeStart || !rangeEnd) return 0
        const s = new Date(rangeStart); const e = new Date(rangeEnd)
        let count = 0; const cur = new Date(s)
        while (cur <= e) { if (isWorkingDate(cur)) count++; cur.setDate(cur.getDate() + 1) }
        return count * DAY_OPTION_VALUE[rangeOption]
      })()

  const countBusinessDays = (startKey: string, endKey: string) => {
    const s = new Date(startKey); const e = new Date(endKey)
    let count = 0; const cur = new Date(s)
    while (cur <= e) { if (isWorkingDate(cur)) count++; cur.setDate(cur.getDate() + 1) }
    return count
  }

  // 캘린더
  const firstDow = new Date(calYear, calMonth - 1, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth, 0).getDate()
  const calCells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const toggleDate = (day: number) => {
    const key = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (selectedDates.some((d) => d.key === key)) {
      setSelectedDates((prev) => prev.filter((d) => d.key !== key))
      setSubmitError(null)
      return
    }
    if (!allowOverLimit && selectedCount + DAY_OPTION_VALUE['종일'] > maxDays) {
      setSubmitError(`보유 잔여(${maxDays}일)를 초과하여 신청할 수 없습니다.`)
      return
    }
    setSubmitError(null)
    setSelectedDates((prev) => [...prev, { key, option: '종일' }])
  }

  const updateDateOption = (key: string, option: DayOption) => {
    if (!allowOverLimit) {
      const current = selectedDates.find((d) => d.key === key)
      if (current) {
        const delta = DAY_OPTION_VALUE[option] - DAY_OPTION_VALUE[current.option]
        if (selectedCount + delta > maxDays) {
          setSubmitError(`보유 잔여(${maxDays}일)를 초과하여 신청할 수 없습니다.`)
          return
        }
      }
    }
    setSubmitError(null)
    setSelectedDates((prev) => prev.map((d) => d.key === key ? { ...d, option } : d))
  }

  // 기간 지정 모드: 캘린더 클릭 — 1번째=시작, 2번째=종료, 3번째=초기화 후 재시작
  const handleRangeClick = (key: string) => {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(key)
      setRangeEnd('')
      setSubmitError(null)
      return
    }
    if (key < rangeStart) {
      setRangeStart(key)
      setSubmitError(null)
      return
    }
    if (!allowOverLimit) {
      const would = countBusinessDays(rangeStart, key) * DAY_OPTION_VALUE[rangeOption]
      if (would > maxDays) {
        setSubmitError(`보유 잔여(${maxDays}일)를 초과하여 신청할 수 없습니다.`)
        return
      }
    }
    setSubmitError(null)
    setRangeEnd(key)
  }

  const handleRangeOptionChange = (option: DayOption) => {
    if (!allowOverLimit && rangeStart && rangeEnd) {
      const would = countBusinessDays(rangeStart, rangeEnd) * DAY_OPTION_VALUE[option]
      if (would > maxDays) {
        setSubmitError(`보유 잔여(${maxDays}일)를 초과하여 신청할 수 없습니다.`)
        return
      }
    }
    setSubmitError(null)
    setRangeOption(option)
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
    && (allowOverLimit || selectedCount <= maxDays)

  const handleSubmit = () => {
    if (!currentType || submitting) return
    const slots = collectVacSlots({ selMode, selectedDates, rangeStart, rangeEnd, rangeOption, workGroup })
    if (slots.length === 0) { setSubmitError('휴가 일자를 선택해주세요.'); return }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const vacReqItems = buildVacReqItems(slots, workGroup)
      const vacReqDatesText = buildVacReqDatesText(slots, workGroup)
      const vacReqUseDay = vacReqItems.reduce((s, it) => s + it.useDay, 0)
      onSubmitToApproval({
        infoId: currentType.typeId,
        type: currentType.typeName,
        dates: selectedDates,
        rangeStart,
        rangeEnd,
        rangeOption,
        selMode,
        vacReqDatesText,
        vacReqUseDay,
        vacReqItems,
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
        <div className="relative bg-white rounded-xl shadow-xl w-[min(480px,calc(100vw-24px))] p-8 text-center text-[13px] text-gray-500">
          휴가 유형을 불러오는 중...
        </div>
      </div>
    )
  }

  if (initError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-[min(420px,calc(100vw-24px))] p-6">
          <div className="text-[14px] font-bold text-red-500 mb-2">휴가 신청 불가</div>
          <div className="text-[13px] text-gray-700 mb-5">{initError}</div>
          <div className="flex justify-end">
            <button onClick={onClose} className="px-4 py-1.5 text-[12px] bg-gray-900 text-white rounded-lg hover:bg-gray-800">확인</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-[min(720px,calc(100vw-24px))] flex flex-col max-h-[90vh]">
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
                          const dateObj = new Date(calYear, calMonth - 1, day)
                          const dow = dateObj.getDay()
                          const holidayName = holidayNameOf(dateObj)
                          const disabled = !isWorkingDate(dateObj)
                          return (
                            <button key={key} onClick={() => !disabled && toggleDate(day)}
                              title={holidayName ?? undefined}
                              className={`py-1.5 text-[13px] rounded transition-colors ${
                                isSelected ? 'bg-[#1D9E75] text-white font-bold'
                                : holidayName ? 'text-red-400 cursor-not-allowed'
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
                          {[...selectedDates].sort((a, b) => a.key.localeCompare(b.key)).map((d) => {
                            const win = workGroup ? computeOptionWindow(workGroup, d.option) : null
                            return (
                            <div key={d.key} className="flex items-center gap-2">
                              <span className="bg-[#1D9E75] text-white text-[11px] px-2 py-1 rounded-full flex items-center gap-1.5">
                                {formatDateShort(d.key)}
                                <button onClick={() => setSelectedDates((prev) => prev.filter((x) => x.key !== d.key))} className="hover:text-red-200">&times;</button>
                              </span>
                              {allowPartialDay ? (
                                <select value={d.option} onChange={(e) => updateDateOption(d.key, e.target.value as DayOption)}
                                  className="border border-gray-300 rounded px-2 py-1 text-[11px] outline-none text-gray-600">
                                  <option value="종일">종일</option>
                                  <option value="반차(전반)">반차(전반)</option>
                                  <option value="반차(후반)">반차(후반)</option>
                                  {allowQuarterDay && (
                                    <>
                                      <option value="반반차(1/4)">반반차(1/4)</option>
                                      <option value="반반차(2/4)">반반차(2/4)</option>
                                      <option value="반반차(3/4)">반반차(3/4)</option>
                                      <option value="반반차(4/4)">반반차(4/4)</option>
                                    </>
                                  )}
                                </select>
                              ) : (
                                <span className="text-[11px] text-gray-500">종일</span>
                              )}
                              {win && (
                                <span className="text-[11px] text-gray-500 tabular-nums">
                                  {hmsToHm(win.start)}~{hmsToHm(win.end)}
                                </span>
                              )}
                            </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    {/* 캘린더 — 기간 선택 (시작/종료 클릭) */}
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
                          const dateObj = new Date(calYear, calMonth - 1, day)
                          const dow = dateObj.getDay()
                          const holidayName = holidayNameOf(dateObj)
                          const isStart = rangeStart === key
                          const isEnd = rangeEnd === key
                          const isInRange = !!rangeStart && !!rangeEnd && key > rangeStart && key < rangeEnd
                          const disabled = !isWorkingDate(dateObj)
                          return (
                            <button key={key} onClick={() => !disabled && handleRangeClick(key)}
                              title={holidayName ?? undefined}
                              className={`py-1.5 text-[13px] transition-colors ${
                                isStart || isEnd ? 'bg-[#1D9E75] text-white font-bold rounded'
                                : isInRange ? 'bg-emerald-100 text-emerald-800'
                                : holidayName ? 'text-red-400 cursor-not-allowed rounded'
                                : disabled ? 'text-gray-300 cursor-not-allowed rounded'
                                : dow === 0 ? 'text-red-400 hover:bg-red-50 rounded'
                                : dow === 6 ? 'text-blue-400 hover:bg-blue-50 rounded'
                                : 'text-gray-900 hover:bg-gray-100 rounded'
                              }`}>
                              {day}
                            </button>
                          )
                        })}
                      </div>
                      <div className="mt-2 text-[11px] text-gray-400">
                        {!rangeStart ? '시작일을 선택하세요' : !rangeEnd ? '종료일을 선택하세요' : '다시 클릭하면 새 기간을 시작합니다'}
                      </div>
                    </div>

                    {/* 신청 정보 */}
                    <div className="flex-1 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[12px] text-gray-600 w-14 shrink-0">시작일</span>
                        <span className="text-[12px] text-gray-900 font-medium">{rangeStart || '-'}</span>
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-[12px] text-gray-600 w-14 shrink-0">종료일</span>
                        <span className="text-[12px] text-gray-900 font-medium">{rangeEnd || '-'}</span>
                      </div>
                      {(rangeStart || rangeEnd) && (
                        <button onClick={() => { setRangeStart(''); setRangeEnd('') }}
                          className="text-[11px] text-gray-500 hover:text-red-500 underline mb-3">
                          초기화
                        </button>
                      )}
                      {allowPartialDay && (
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-[12px] text-gray-600">적용</span>
                          <select value={rangeOption} onChange={(e) => handleRangeOptionChange(e.target.value as DayOption)}
                            className="border border-gray-300 rounded px-2 py-1 text-[11px] outline-none text-gray-600">
                            <option value="종일">종일</option>
                            <option value="반차(전반)">반차(전반)</option>
                            <option value="반차(후반)">반차(후반)</option>
                            {allowQuarterDay && (
                              <>
                                <option value="반반차(1/4)">반반차(1/4)</option>
                                <option value="반반차(2/4)">반반차(2/4)</option>
                                <option value="반반차(3/4)">반반차(3/4)</option>
                                <option value="반반차(4/4)">반반차(4/4)</option>
                              </>
                            )}
                          </select>
                          {workGroup && (() => {
                            const win = computeOptionWindow(workGroup, rangeOption)
                            return (
                              <span className="text-[11px] text-gray-500 tabular-nums">
                                {hmsToHm(win.start)}~{hmsToHm(win.end)}
                              </span>
                            )
                          })()}
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <span className="text-[13px] text-gray-600">신청휴가수</span>
                        <span className={`text-[15px] font-bold ${selectedCount > maxDays ? 'text-red-500' : 'text-gray-900'}`}>{selectedCount}일</span>
                      </div>
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
