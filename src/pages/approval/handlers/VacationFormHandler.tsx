import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { vacationApi } from '../../../api/vacation'
import { attendanceApi } from '../../../api/attendance'
import {
  type DayOption,
  computeOptionWindow,
  hmsToHm,
  type VacationHandlerState,
} from '../../attendance/components/vacationFormShared'

/**
 * 전자결재 탭에서 "휴가신청서" 양식을 직접 선택해 기안할 때 form HTML 위에 입혀지는 핸들러.
 *
 * 기존 LeaveApplyModal 의 캘린더 UI 대신, 요구사항 명세에 맞춰 간단한 행 단위 입력을 제공한다:
 *   [날짜 picker] [시작시간] [종료시간] [구분 select] [삭제]
 *   [+ 일자 추가]
 *
 * 핸들러는 자체 상태(휴가 종류 + 행 배열)에서 다음을 도출해 onChange 로 부모에 통보:
 *   - infoId, vacationTypeName            → 식별자/표시
 *   - vacReqDatesText                     → 결재문서 표시용 다중행 문자열
 *   - vacReqUseDay                        → 자동계산 합계 (사용자 입력 X)
 *   - vacReqItems                         → 백엔드 진실의 원천 (startAt/endAt/useDay)
 *
 * 잔여 검증 실패 시 onValidationChange 로 에러 문자열 전파 → 상신 버튼 비활성화.
 */

// 명세에 맞춘 단순 4-옵션 (기존 7-옵션 시스템보다 좁힘 — 사용자가 시간을 직접 조정 가능)
type SimpleOption = '종일' | '반차(오전)' | '반차(오후)' | '반반차'

const SIMPLE_TO_FULL: Record<SimpleOption, DayOption> = {
  '종일': '종일',
  '반차(오전)': '반차(전반)',
  '반차(오후)': '반차(후반)',
  '반반차': '반반차(1/4)',
}

const SIMPLE_USE_DAY: Record<SimpleOption, number> = {
  '종일': 1,
  '반차(오전)': 0.5,
  '반차(오후)': 0.5,
  '반반차': 0.25,
}

// workGroup 미로딩 시 사용하는 폴백 시간대
const FALLBACK_WINDOWS: Record<SimpleOption, [string, string]> = {
  '종일': ['09:00', '18:00'],
  '반차(오전)': ['09:00', '12:00'],
  '반차(오후)': ['13:00', '18:00'],
  '반반차': ['09:00', '11:00'],
}

interface RowState {
  id: string
  date: string       // YYYY-MM-DD
  startTime: string  // HH:mm
  endTime: string    // HH:mm
  option: SimpleOption
}

const todayStr = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const newId = (): string =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

interface Props {
  onChange: (state: VacationHandlerState) => void
  onValidationChange: (error: string | null) => void
}

export default function VacationFormHandler({ onChange, onValidationChange }: Props) {
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)
  const [rows, setRows] = useState<RowState[]>(() => [{
    id: newId(),
    date: todayStr(),
    startTime: '09:00',
    endTime: '18:00',
    option: '종일',
  }])

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
  const currentType = useMemo(
    () => types.find((t) => t.typeId === selectedTypeId) ?? null,
    [types, selectedTypeId],
  )

  const remaining = currentType?.remainingDays ?? 0
  const allowOverLimit = currentType?.allowAdvance ?? false
  const allowPartialDay = currentType ? currentType.deductUnit < 1.0 : false
  const allowQuarterDay = currentType ? currentType.deductUnit <= 0.25 : false

  const allowedOptions = useMemo<SimpleOption[]>(() => {
    const opts: SimpleOption[] = ['종일']
    if (allowPartialDay) opts.push('반차(오전)', '반차(오후)')
    if (allowQuarterDay) opts.push('반반차')
    return opts
  }, [allowPartialDay, allowQuarterDay])

  const defaultWindowFor = (option: SimpleOption): [string, string] => {
    if (workGroup) {
      const win = computeOptionWindow(workGroup, SIMPLE_TO_FULL[option])
      return [hmsToHm(win.start), hmsToHm(win.end)]
    }
    return FALLBACK_WINDOWS[option]
  }

  const totalUseDay = rows.reduce((s, r) => s + SIMPLE_USE_DAY[r.option], 0)

  // 휴가 유형 로드 후 첫 행에 workGroup 기반 시간을 한 번만 적용 (사용자가 손대기 전에)
  const appliedDefaultsRef = useRef(false)
  useEffect(() => {
    if (appliedDefaultsRef.current) return
    if (!workGroup) return
    appliedDefaultsRef.current = true
    setRows((prev) => prev.map((r) => {
      const [s, e] = defaultWindowFor(r.option)
      return { ...r, startTime: s, endTime: e }
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workGroup])

  const validationError = useMemo<string | null>(() => {
    if (!currentType) return '휴가 종류를 선택해주세요.'
    if (rows.length === 0) return '휴가 일자를 추가해주세요.'
    for (const r of rows) {
      if (!r.date) return '날짜를 입력해주세요.'
      if (!r.startTime || !r.endTime) return '시작/종료 시간을 입력해주세요.'
      if (r.endTime <= r.startTime) return `${r.date}: 종료 시간이 시작 시간보다 빨라요.`
    }
    if (!allowOverLimit && totalUseDay > remaining) {
      return `보유 잔여(${remaining}일)를 초과하여 신청할 수 없습니다.`
    }
    return null
  }, [currentType, rows, allowOverLimit, totalUseDay, remaining])

  // 부모에 상태 통지
  useEffect(() => {
    if (!currentType) {
      onChange({
        infoId: null,
        vacationTypeName: '',
        vacReqDatesText: '',
        vacReqUseDay: 0,
        vacReqItems: [],
      })
      return
    }
    const items = rows.map((r) => ({
      startAt: `${r.date}T${r.startTime}:00`,
      endAt: `${r.date}T${r.endTime}:00`,
      useDay: SIMPLE_USE_DAY[r.option],
    }))
    const text = rows.map((r) => {
      const fullOpt = SIMPLE_TO_FULL[r.option]
      return `${r.date} (${fullOpt}) ${r.startTime} ~ ${r.endTime}`
    }).join('\n')
    onChange({
      infoId: currentType.typeId,
      vacationTypeName: currentType.typeName,
      vacReqDatesText: text,
      vacReqUseDay: totalUseDay,
      vacReqItems: items,
    })
  }, [currentType, rows, totalUseDay, onChange])

  useEffect(() => {
    onValidationChange(validationError)
  }, [validationError, onValidationChange])

  const addRow = () => {
    const opt: SimpleOption = '종일'
    const [s, e] = defaultWindowFor(opt)
    setRows((prev) => [...prev, { id: newId(), date: todayStr(), startTime: s, endTime: e, option: opt }])
  }
  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id))
  const updateRow = (id: string, patch: Partial<RowState>) => {
    setRows((prev) => prev.map((r) => {
      if (r.id !== id) return r
      const next: RowState = { ...r, ...patch }
      // 옵션 변경 시 시간 자동 갱신
      if (patch.option && patch.option !== r.option) {
        const [s, e] = defaultWindowFor(patch.option)
        next.startTime = s
        next.endTime = e
      }
      return next
    }))
  }

  if (typesQuery.isPending) {
    return <div className="text-[12px] text-gray-500 px-3 py-3">휴가 유형을 불러오는 중...</div>
  }
  if (typesQuery.isError) {
    return <div className="text-[12px] text-red-500 px-3 py-3">휴가 유형을 불러오지 못했습니다.</div>
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-3 bg-gray-50/40">
      {/* 휴가 종류 select + 잔여 배지 */}
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <label className="text-[13px] font-semibold text-gray-900 shrink-0">
          휴가 종류 <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedTypeId ?? ''}
          onChange={(e) => setSelectedTypeId(e.target.value ? Number(e.target.value) : null)}
          className="border border-gray-300 rounded px-3 py-1 text-[12px] outline-none"
        >
          <option value="">선택하세요</option>
          {types.map((t) => (
            <option key={t.typeId} value={t.typeId}>{t.typeName} ({t.typeCode})</option>
          ))}
        </select>
        {currentType && (
          <>
            <span className={`text-[12px] ${remaining < 0 ? 'text-red-500 font-bold' : 'text-gray-700'}`}>
              보유 잔여 <strong>{remaining}일</strong>
            </span>
            <span className="text-[11px] text-gray-500">{currentType.balanceYear}년도 기준</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${currentType.payType === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
              {currentType.payType === 'PAID' ? '유급' : '무급'}
            </span>
          </>
        )}
      </div>

      {/* 행 단위 일자 입력 */}
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={r.date}
              onChange={(e) => updateRow(r.id, { date: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none"
            />
            <input
              type="time"
              value={r.startTime}
              onChange={(e) => updateRow(r.id, { startTime: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none"
            />
            <span className="text-[12px] text-gray-500">~</span>
            <input
              type="time"
              value={r.endTime}
              onChange={(e) => updateRow(r.id, { endTime: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none"
            />
            <select
              value={r.option}
              onChange={(e) => updateRow(r.id, { option: e.target.value as SimpleOption })}
              className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none"
            >
              {allowedOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(r.id)}
                className="px-2 py-1 text-[11px] text-red-500 hover:bg-red-50 rounded"
              >
                삭제
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-2 text-[12px] text-[#1D9E75] hover:underline"
      >
        + 일자 추가
      </button>

      {/* 자동계산 합계 (입력 불가) */}
      <div className="mt-3 flex items-center gap-3">
        <span className="text-[13px] text-gray-600">요청 휴가일수</span>
        <span className={`text-[15px] font-bold ${!allowOverLimit && totalUseDay > remaining ? 'text-red-500' : 'text-gray-900'}`}>
          {totalUseDay}일
        </span>
        {!currentType && <span className="text-[11px] text-gray-400">(휴가 종류 선택 후 검증)</span>}
      </div>

      {validationError && (
        <div className="mt-2 text-[11px] text-red-500">{validationError}</div>
      )}
    </div>
  )
}
