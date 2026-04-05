/* ══════════════════════════════════════
   근무그룹 설정 & 계산 로직
   ══════════════════════════════════════ */

export interface WorkGroupConfig {
  id: number
  name: string
  type: string
  startTime: string       // 출근시간 "09:00"
  endTime: string         // 퇴근시간 "18:00"
  breakStart: string      // 휴게시간 시작 "12:00"
  breakEnd: string        // 휴게시간 종료 "13:00"
  workDays: string[]      // 근무요일 ['월','화','수','목','금']
  maxWeeklyHours: number  // 주간 최대근무시간 (정책 설정값)
  warningHours: number    // 경고 기준 시간
}

/** 시간 문자열("HH:MM")을 분으로 변환 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** 1일 소정근로시간 (시간 단위) = (퇴근-출근) - 휴게시간 */
export function getDailyWorkHours(group: WorkGroupConfig): number {
  const totalMin = timeToMinutes(group.endTime) - timeToMinutes(group.startTime)
  const breakMin = timeToMinutes(group.breakEnd) - timeToMinutes(group.breakStart)
  return Math.max(0, totalMin - breakMin) / 60
}

/** 주간 적정 근무시간 = 1일 소정근로시간 * 근무요일 수 */
export function getWeeklyStandardHours(group: WorkGroupConfig): number {
  return getDailyWorkHours(group) * group.workDays.length
}

/** 월간 적정 근무시간 (근무일수 기준) */
export function getMonthlyStandardHours(group: WorkGroupConfig, workDaysInMonth: number): number {
  return getDailyWorkHours(group) * workDaysInMonth
}

/* ══════════════════════════════════════
   Mock 근무그룹 데이터
   ══════════════════════════════════════ */
export const WORK_GROUPS: WorkGroupConfig[] = [
  {
    id: 1,
    name: '기본그룹',
    type: '고정근로',
    startTime: '09:00',
    endTime: '18:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    workDays: ['월', '화', '수', '목', '금'],
    maxWeeklyHours: 52,
    warningHours: 48,
  },
]

/** 그룹 이름으로 근무그룹 설정 조회 (기본값: 기본그룹) */
export function getWorkGroup(groupName: string = '기본그룹'): WorkGroupConfig {
  return WORK_GROUPS.find((g) => g.name === groupName) ?? WORK_GROUPS[0]
}
