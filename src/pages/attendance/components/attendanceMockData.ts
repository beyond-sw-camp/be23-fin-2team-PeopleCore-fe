/* ══════════════════════════════════════
   공유 타입 & 빈 초기값 (API 연동 전)
   ══════════════════════════════════════ */

export const LEAVE_POLICY: '입사일' | '회계연도' = '입사일'

export const LEAVE_SUMMARY = {
  period: '',
  remaining: 0, used: 0, total: 0, years: 0,
  usedPercent: 0,
  expired: 0,
  willExpire: 0,
  expireDate: '',
}
