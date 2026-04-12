// KPI 지표 마스터 (백엔드 enum과 1:1 매핑)
// 사원은 이 템플릿에서 지표를 선택하고 목표값만 입력한다.

export type KpiDirection = 'UP' | 'DOWN' | 'MAINTAIN'        // 상향 / 하향 / 유지
export type KpiUnit = 'PERCENT' | 'COUNT' | 'WON' | 'HOUR' | 'SCORE' | 'DAY'
export type KpiCycle = 'MONTH' | 'QUARTER' | 'HALF' | 'YEAR'
export type KpiCategory = '업무성과' | '역량개발' | '조직기여'

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

export const cycleLabel: Record<KpiCycle, string> = {
  MONTH: '월',
  QUARTER: '분기',
  HALF: '반기',
  YEAR: '연',
}

export interface KpiTemplate {
  id: number
  category: KpiCategory
  name: string            // 지표명 (= 목표 제목)
  description: string     // 측정 기준 설명
  direction: KpiDirection
  unit: KpiUnit
  cycle: KpiCycle
  defaultTarget?: number  // 권장 목표값 (가이드용)
}

export const kpiTemplates: KpiTemplate[] = [
  // 업무성과 - 영업/매출
  { id: 1, category: '업무성과', name: '신규 고객 유치 건수',
    description: '분기 내 신규 계약 체결 고객 수',
    direction: 'UP', unit: 'COUNT', cycle: 'QUARTER', defaultTarget: 20 },
  { id: 2, category: '업무성과', name: '매출 목표 달성률',
    description: '할당 매출 대비 실적 비율',
    direction: 'UP', unit: 'PERCENT', cycle: 'QUARTER', defaultTarget: 100 },
  { id: 3, category: '업무성과', name: '계약 갱신율',
    description: '기존 고객 계약 갱신 비율',
    direction: 'UP', unit: 'PERCENT', cycle: 'HALF', defaultTarget: 85 },

  // 업무성과 - 품질/CS
  { id: 4, category: '업무성과', name: '고객 만족도(CSAT)',
    description: '분기 CS 응대 만족도 평균 점수(5점 만점 환산 %)',
    direction: 'UP', unit: 'PERCENT', cycle: 'QUARTER', defaultTarget: 90 },
  { id: 5, category: '업무성과', name: 'CS 응답 시간',
    description: '문의 접수부터 1차 응답까지 평균 시간',
    direction: 'DOWN', unit: 'HOUR', cycle: 'MONTH', defaultTarget: 2 },
  { id: 6, category: '업무성과', name: '불량/하자 발생률',
    description: '전체 산출물 대비 불량 비율',
    direction: 'DOWN', unit: 'PERCENT', cycle: 'QUARTER', defaultTarget: 1 },

  // 업무성과 - 개발/생산성
  { id: 7, category: '업무성과', name: '스프린트 완료율',
    description: '계획 스토리포인트 대비 완료 비율',
    direction: 'UP', unit: 'PERCENT', cycle: 'MONTH', defaultTarget: 90 },
  { id: 8, category: '업무성과', name: '운영 장애 건수',
    description: '담당 서비스의 P1/P2 장애 발생 건수',
    direction: 'DOWN', unit: 'COUNT', cycle: 'QUARTER', defaultTarget: 0 },
  { id: 9, category: '업무성과', name: '코드 리뷰 평균 응답시간',
    description: 'PR 등록부터 첫 리뷰까지 평균 시간',
    direction: 'DOWN', unit: 'HOUR', cycle: 'MONTH', defaultTarget: 4 },

  // 업무성과 - 비용
  { id: 10, category: '업무성과', name: '예산 집행률',
    description: '계획 예산 대비 실제 집행 비율 (100% 유지 권장)',
    direction: 'MAINTAIN', unit: 'PERCENT', cycle: 'QUARTER', defaultTarget: 100 },
  { id: 11, category: '업무성과', name: '비용 절감액',
    description: '전년 동기 대비 절감 금액',
    direction: 'UP', unit: 'WON', cycle: 'HALF', defaultTarget: 5000000 },

  // 역량개발
  { id: 12, category: '역량개발', name: '직무 자격증 취득 수',
    description: '직무 관련 공인 자격증 신규 취득 개수',
    direction: 'UP', unit: 'COUNT', cycle: 'YEAR', defaultTarget: 1 },
  { id: 13, category: '역량개발', name: '교육 이수 시간',
    description: '사내·외 직무 교육 누적 이수 시간',
    direction: 'UP', unit: 'HOUR', cycle: 'HALF', defaultTarget: 20 },
  { id: 14, category: '역량개발', name: '사내 강의 진행 횟수',
    description: '직무 지식 공유 세션 진행 횟수',
    direction: 'UP', unit: 'COUNT', cycle: 'HALF', defaultTarget: 2 },

  // 조직기여
  { id: 15, category: '조직기여', name: '신규 입사자 멘토링',
    description: '담당 멘티 온보딩 완료 인원',
    direction: 'UP', unit: 'COUNT', cycle: 'HALF', defaultTarget: 1 },
  { id: 16, category: '조직기여', name: '업무 매뉴얼 작성',
    description: '팀 공유용 표준 문서 신규 작성 건수',
    direction: 'UP', unit: 'COUNT', cycle: 'QUARTER', defaultTarget: 2 },
  { id: 17, category: '조직기여', name: '근태 준수율',
    description: '정시 출근일 비율',
    direction: 'UP', unit: 'PERCENT', cycle: 'MONTH', defaultTarget: 100 },
  { id: 18, category: '조직기여', name: '프로세스 개선 제안',
    description: '채택된 업무 개선 제안 건수',
    direction: 'UP', unit: 'COUNT', cycle: 'YEAR', defaultTarget: 3 },
]

// 방향에 따른 달성률 계산
export function calcAchievementRate(
  direction: KpiDirection,
  target: number,
  actual: number,
): number {
  if (target === 0) return 0
  switch (direction) {
    case 'UP':
      return Math.round((actual / target) * 100)
    case 'DOWN':
      // 실적이 작을수록 좋음. actual=0이면 200% 상한
      if (actual === 0) return 200
      return Math.round((target / actual) * 100)
    case 'MAINTAIN': {
      const deviation = Math.abs(actual - target) / target
      return Math.max(0, Math.round((1 - deviation) * 100))
    }
  }
}
