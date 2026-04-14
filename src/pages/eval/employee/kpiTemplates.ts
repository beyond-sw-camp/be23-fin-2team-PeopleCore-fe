// KPI 지표 마스터 (백엔드 enum과 1:1 매핑)
// 사원은 이 템플릿에서 지표를 선택하고 목표값만 입력한다.

export type KpiDirection = 'UP' | 'DOWN' | 'MAINTAIN'        // 상향 / 하향 / 유지
export type KpiUnit = 'PERCENT' | 'COUNT' | 'WON' | 'HOUR' | 'SCORE' | 'DAY'
export type KpiCategory = '업무성과' | '역량개발' | '조직기여'
export type KpiDepartment = 'COMMON' | '영업팀' | '개발팀' | '인사팀' | '재무팀' | '마케팅팀'

export const departmentLabel: Record<KpiDepartment, string> = {
  COMMON: '전사 공통',
  '영업팀': '영업팀',
  '개발팀': '개발팀',
  '인사팀': '인사팀',
  '재무팀': '재무팀',
  '마케팅팀': '마케팅팀',
}

export const directionLabel: Record<KpiDirection, string> = {
  UP: '상향',
  DOWN: '하향',
  MAINTAIN: '유지',
}

export const unitLabel: Record<KpiUnit, string> = {
  PERCENT: '%',
  COUNT: '건',
  WON: '원',
  HOUR: '시간',
  SCORE: '점',
  DAY: '일',
}

export interface KpiTemplate {
  id: number
  department: KpiDepartment  // 적용 부서 (COMMON = 전사 공통)
  category: KpiCategory
  name: string            // 지표명 (= 목표 제목)
  description: string     // 측정 기준 설명
  direction: KpiDirection
  unit: KpiUnit
  baseline?: number       // 사내 평균 실적 — 동일 지표를 사용한 사원들의 평균(AVG). 목표 현실성 판단용
}

export const kpiTemplates: KpiTemplate[] = [
  // 영업팀
  { id: 1, department: '영업팀', category: '업무성과', name: '신규 고객 유치 건수',
    description: '분기 내 신규 계약 체결 고객 수',
    direction: 'UP', unit: 'COUNT', baseline: 15 },
  { id: 2, department: '영업팀', category: '업무성과', name: '매출 목표 달성률',
    description: '할당 매출 대비 실적 비율',
    direction: 'UP', unit: 'PERCENT', baseline: 92 },
  { id: 3, department: '영업팀', category: '업무성과', name: '계약 갱신율',
    description: '기존 고객 계약 갱신 비율',
    direction: 'UP', unit: 'PERCENT', baseline: 78 },
  { id: 4, department: '영업팀', category: '업무성과', name: '고객 만족도(CSAT)',
    description: '분기 CS 응대 만족도 평균 점수(5점 만점 환산 %)',
    direction: 'UP', unit: 'PERCENT', baseline: 85 },
  { id: 5, department: '영업팀', category: '업무성과', name: 'CS 응답 시간',
    description: '문의 접수부터 1차 응답까지 평균 시간',
    direction: 'DOWN', unit: 'HOUR', baseline: 4 },

  // 개발팀
  { id: 6, department: '개발팀', category: '업무성과', name: '불량/하자 발생률',
    description: '전체 산출물 대비 불량 비율',
    direction: 'DOWN', unit: 'PERCENT', baseline: 2.5 },
  { id: 7, department: '개발팀', category: '업무성과', name: '스프린트 완료율',
    description: '계획 스토리포인트 대비 완료 비율',
    direction: 'UP', unit: 'PERCENT', baseline: 80 },
  { id: 8, department: '개발팀', category: '업무성과', name: '운영 장애 건수',
    description: '담당 서비스의 P1/P2 장애 발생 건수',
    direction: 'DOWN', unit: 'COUNT', baseline: 2 },
  { id: 9, department: '개발팀', category: '업무성과', name: '코드 리뷰 평균 응답시간',
    description: 'PR 등록부터 첫 리뷰까지 평균 시간',
    direction: 'DOWN', unit: 'HOUR', baseline: 8 },

  // 재무팀
  { id: 10, department: '재무팀', category: '업무성과', name: '예산 집행률',
    description: '계획 예산 대비 실제 집행 비율 (100% 유지 권장)',
    direction: 'MAINTAIN', unit: 'PERCENT', baseline: 103 },
  { id: 11, department: '재무팀', category: '업무성과', name: '비용 절감액',
    description: '전년 동기 대비 절감 금액',
    direction: 'UP', unit: 'WON', baseline: 3000000 },

  // 전사 공통 - 역량개발
  { id: 12, department: 'COMMON', category: '역량개발', name: '직무 자격증 취득 수',
    description: '직무 관련 공인 자격증 신규 취득 개수',
    direction: 'UP', unit: 'COUNT', baseline: 0 },
  { id: 13, department: 'COMMON', category: '역량개발', name: '교육 이수 시간',
    description: '사내·외 직무 교육 누적 이수 시간',
    direction: 'UP', unit: 'HOUR', baseline: 12 },
  { id: 14, department: 'COMMON', category: '역량개발', name: '사내 강의 진행 횟수',
    description: '직무 지식 공유 세션 진행 횟수',
    direction: 'UP', unit: 'COUNT', baseline: 1 },

  // 전사 공통 - 조직기여
  { id: 15, department: 'COMMON', category: '조직기여', name: '신규 입사자 멘토링',
    description: '담당 멘티 온보딩 완료 인원',
    direction: 'UP', unit: 'COUNT', baseline: 0 },
  { id: 16, department: 'COMMON', category: '조직기여', name: '업무 매뉴얼 작성',
    description: '팀 공유용 표준 문서 신규 작성 건수',
    direction: 'UP', unit: 'COUNT', baseline: 1 },
  // 근태 준수율은 KPI가 아니라 별도 감점 트랙(AttendancePenalty)에서 처리
  { id: 18, department: 'COMMON', category: '조직기여', name: '프로세스 개선 제안',
    description: '채택된 업무 개선 제안 건수',
    direction: 'UP', unit: 'COUNT', baseline: 1 },
]

// 방향에 따른 달성률 계산
// maintainTolerance: MAINTAIN에서 목표 대비 ±n% 이내는 무조건 100% 처리
export function calcAchievementRate(
  direction: KpiDirection,
  target: number,
  actual: number,
  maintainTolerance: number = 0,
): number {
  if (target === 0) return 0
  switch (direction) {
    case 'UP':
      return Math.round((actual / target) * 100)
    case 'DOWN':
      if (actual === 0) return 200
      return Math.round((target / actual) * 100)
    case 'MAINTAIN': {
      const deviationPct = Math.abs(actual - target) / target * 100
      if (deviationPct <= maintainTolerance) return 100
      const adjusted = deviationPct - maintainTolerance
      return Math.max(0, Math.round(100 - adjusted))
    }
  }
}

// KPI 달성률 → 점수
// cap: 상한 (기본 120)
// underperformanceThreshold/Factor: rate가 threshold 미만이면 factor 배율 곱함
export function calcKpiScore(
  rate: number,
  cap: number = 120,
  underperformanceThreshold: number = 0,
  underperformanceFactor: number = 1.0,
): number {
  const capped = Math.min(cap, Math.max(0, rate))
  if (underperformanceThreshold > 0 && rate < underperformanceThreshold) {
    return capped * underperformanceFactor
  }
  return capped
}
