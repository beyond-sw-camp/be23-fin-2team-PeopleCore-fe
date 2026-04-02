/* ══════════════════════════════════════
   공유 Mock 데이터 (여러 컴포넌트에서 import)
   ══════════════════════════════════════ */

export const LEAVE_POLICY: '입사일' | '회계연도' = '입사일'

export const LEAVE_SUMMARY = {
  period: LEAVE_POLICY === '입사일' ? '2026-02-09 ~ 2027-02-08' : '2026-01-01 ~ 2026-12-31',
  remaining: 2, used: 16, total: 18, years: 11,
  usedPercent: 88.9,
  expired: 0,
  willExpire: 2,
  expireDate: LEAVE_POLICY === '입사일' ? '2027-02-08' : '2026-12-31',
}
