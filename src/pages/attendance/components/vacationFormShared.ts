/**
 * 휴가신청서 폼 공유 유틸 — LeaveApplyModal 과 ApprovalDocumentPage 의 VacationFormHandler 가 함께 사용.
 *
 * 백엔드 진실의 원천: vacReqItems[] = { startAt, endAt, useDay }.
 * UI 표시용으로는 vacReqDatesText (사람이 읽는 문자열), vacReqUseDay (합계) 도 같이 채워준다.
 */

import type { MyWorkGroupResponseDto } from '../../../api/attendance'

export type DayOption =
  | '종일'
  | '반차(전반)'
  | '반차(후반)'
  | '반반차(1/4)'
  | '반반차(2/4)'
  | '반반차(3/4)'
  | '반반차(4/4)'

export const DAY_OPTION_VALUE: Record<DayOption, number> = {
  '종일': 1,
  '반차(전반)': 0.5,
  '반차(후반)': 0.5,
  '반반차(1/4)': 0.25,
  '반반차(2/4)': 0.25,
  '반반차(3/4)': 0.25,
  '반반차(4/4)': 0.25,
}

/** 휴가 일자 1건. 백엔드 스펙: {startAt, endAt, useDay}. */
export interface VacReqItem {
  startAt: string   // "YYYY-MM-DDTHH:mm:ss"
  endAt: string     // "YYYY-MM-DDTHH:mm:ss" (startAt과 같은 날)
  useDay: number    // 1.0 | 0.5 | 0.25
}

export interface VacSlot { date: string; option: DayOption }

export const hmsToMinutes = (hms: string): number => {
  const [h, m] = hms.split(':').map(Number)
  return h * 60 + (m || 0)
}

export const minutesToHms = (mins: number): string => {
  const rounded = Math.round(mins)
  const h = Math.floor(rounded / 60)
  const m = rounded % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}

export const hmsToHm = (hms: string): string => hms.slice(0, 5)

/**
 * 근무그룹 시간표 기준으로 옵션별 [시작, 종료] HH:mm:ss 반환.
 * 오전/오후가 비대칭일 수 있어 각 구간을 독립적으로 2등분.
 */
export const computeOptionWindow = (
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

/** 슬롯 → 백엔드 전송용 VacReqItem 변환. workGroup 없으면 종일(00:00~23:59)로 폴백. */
export const buildVacReqItems = (slots: VacSlot[], workGroup: MyWorkGroupResponseDto | null): VacReqItem[] =>
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

/**
 * 결재문서 "휴가 일자" 칸 표시용 문자열.
 * 각 슬롯을 "YYYY-MM-DD (옵션) HH:mm ~ HH:mm" 으로 줄바꿈 나열.
 */
export const buildVacReqDatesText = (slots: VacSlot[], workGroup: MyWorkGroupResponseDto | null): string => {
  if (slots.length === 0) return ''
  return slots
    .map(({ date, option }) => {
      if (!workGroup) return `${date} (${option})`
      const win = computeOptionWindow(workGroup, option)
      return `${date} (${option}) ${hmsToHm(win.start)} ~ ${hmsToHm(win.end)}`
    })
    .join('\n')
}

/** 핸들러 ↔ ApprovalDocumentPage 사이의 파일 단위 인터페이스. */
export interface VacationHandlerState {
  infoId: number | null
  vacationTypeName: string
  vacReqDatesText: string
  vacReqUseDay: number
  vacReqItems: VacReqItem[]
}
