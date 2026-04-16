/** 분 → "N시간 M분" 문자열. 분만 있으면 "M분", 시간만 떨어지면 "N시간" */
export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes == null || minutes <= 0) return '0분'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}분`
  if (m === 0) return `${h}시간`
  return `${h}시간 ${m}분`
}

/** 분 → 시간 소수 1자리 (예: 3120 → 52.0) */
export function minutesToHours(minutes: number | null | undefined): number {
  if (minutes == null) return 0
  return Math.round((minutes / 60) * 10) / 10
}

/** 시간 → 분 (예: 52 → 3120) */
export function hoursToMinutes(hours: number): number {
  return Math.round(hours * 60)
}
