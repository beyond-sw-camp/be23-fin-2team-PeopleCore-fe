// ── 평가자 역할 조회 (사이드바 메뉴 분기용) ─────────────────────────────
// 본인이 누군가의 평가자인지 여부만 조회. 매핑 작업은 empEvaluator API 사용.

import api from './client'

export interface MyEvaluatorRole {
  evaluator: boolean
}

export const evaluatorRoleApi = {
  // 로그인 사용자가 평가자인지 — 사이드바/메뉴 분기용
  me: () => api.get<MyEvaluatorRole>('/hr-service/evaluator-role/me'),
}
