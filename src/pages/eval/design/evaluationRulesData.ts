// 평가 규칙 공유 데이터
// EvaluationRules (admin 설정) ↔ GradeDraftAuto (등급 산정) 등에서 공유
// TODO: 백엔드 연동 시 GET /evaluation-rules?seasonId= 로 교체

export interface EvalItem {
  id: string
  name: string
  weight: number       // 가중치 %
  locked?: boolean     // true면 시스템 고정 항목 (이름 변경/삭제 불가) - 자기평가, 상위자평가
  enabled?: boolean    // 고정 항목 사용 여부 (체크박스). 미지정이면 true로 간주
}

export interface AdjustItem {
  id: string
  name: string         // 예: 지각, 무단결근
  points: number       // 건당 감점 (음수)
  enabled: boolean
  locked?: boolean     // true면 시스템 고정 항목 (이름·점수·삭제 불가, 사용 토글만 가능) - 지각/무단결근
}

export interface GradeItem {
  id: string
  label: string        // S, A, A+, ...
  ratio: number        // 강제배분 목표 %
  color: string
}

// 등급 원점수 변환표 — ③ 등급체계와 독립적으로 관리 (라벨 매칭으로 연결)
export interface GradeRawScoreItem {
  id: string        // React key 용 내부 식별자
  label: string     // 등급 라벨 — ③ 등급체계 라벨과 동일해야 매핑 가능 (독립 편집)
  rawScore: number  // 팀장이 이 라벨 부여 시 managerScore로 환산되는 값
}

export interface TaskGradeWeight {
  상: number
  중: number
  하: number
}

export interface KpiScoringConfig {
  cap: number                    // KPI 점수 상한 (기본 120)
  scaleTo: number                // 리스케일 목표값 (기본 100)
  maintainTolerance: number      // MAINTAIN 방향 허용 이탈 %. 0이면 선형, 2면 ±2% 내 만점
  underperformanceThreshold: number  // 미달 기준 % (기본 0 = 패널티 없음). 예: 60
  underperformanceFactor: number     // 미달 구간 점수 배율 (기본 1.0 = 없음). 예: 0.5
}

export interface RulesState {
  items: EvalItem[]
  adjustments: AdjustItem[]
  grades: GradeItem[]
  rawScoreTable: GradeRawScoreItem[]  // 등급 원점수 변환표 (grades와 gradeId로 연결)
  taskGradeWeights: TaskGradeWeight   // 목표별 업무등급 가중 배수
  kpiScoring: KpiScoringConfig        // KPI 점수 환산 규칙
  useBiasAdjustment: boolean
  biasWeight: number
  minTeamSize: number
}

export const gradePalette = ['#7c3aed', '#2e9e6e', '#3b82f6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#6366f1']

// 시스템 고정 가감 항목 id — 이름·점수·삭제 불가 (근태 시스템이 이 id로 이벤트를 적재)
export const LOCKED_ADJUST_IDS = ['late', 'absent'] as const

export const defaultRules: RulesState = {
  items: [
    { id: 'self', name: '자기평가', weight: 30, locked: true, enabled: true },
    { id: 'manager', name: '상위자평가', weight: 70, locked: true, enabled: true },
  ],
  adjustments: [
    { id: 'late', name: '지각', points: -2, enabled: true, locked: true },
    { id: 'absent', name: '무단결근', points: -5, enabled: true, locked: true },
  ],
  grades: [
    { id: 'S', label: 'S', ratio: 10, color: '#7c3aed' },
    { id: 'A', label: 'A', ratio: 20, color: '#2e9e6e' },
    { id: 'B', label: 'B', ratio: 40, color: '#3b82f6' },
    { id: 'C', label: 'C', ratio: 20, color: '#f59e0b' },
    { id: 'D', label: 'D', ratio: 10, color: '#ef4444' },
  ],
  rawScoreTable: [
    { id: 'rs-S', label: 'S', rawScore: 100 },
    { id: 'rs-A', label: 'A', rawScore: 90 },
    { id: 'rs-B', label: 'B', rawScore: 80 },
    { id: 'rs-C', label: 'C', rawScore: 70 },
    { id: 'rs-D', label: 'D', rawScore: 60 },
  ],
  taskGradeWeights: { 상: 3, 중: 2, 하: 1 },
  kpiScoring: {
    cap: 120,
    scaleTo: 100,
    maintainTolerance: 0,
    underperformanceThreshold: 0,
    underperformanceFactor: 1.0,
  },
  useBiasAdjustment: true,
  biasWeight: 1.0,
  minTeamSize: 5,
}

// 목표별 정규화 비중 계산 (합계 100%)
export function computeGoalWeights<T extends { grade: '상' | '중' | '하' }>(
  goals: T[],
  weights: TaskGradeWeight,
): number[] {
  if (goals.length === 0) return []
  const raw = goals.map(g => weights[g.grade] ?? 0)
  const sum = raw.reduce((s, n) => s + n, 0)
  if (sum === 0) return goals.map(() => 100 / goals.length)
  return raw.map(r => (r / sum) * 100)
}
