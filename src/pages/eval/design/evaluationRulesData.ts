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

export interface GradeItem {
  id: string
  label: string        // S, A, A+, ...
  ratio: number        // 강제배분 목표 %
  color: string
}

// 등급 원점수 변환표 — 팀장이 선택할 수 있는 등급 옵션 + 원점수 환산값.
// 백엔드 산정 흐름: ManagerEvaluation.gradeLabel ↔ rawScoreTable.label 직매칭.
export interface GradeRawScoreItem {
  id: string        // React key 용 내부 식별자
  label: string     // 등급 라벨 — 팀장이 부여하는 라벨 그대로
  rawScore: number  // 팀장이 이 라벨 부여 시 managerScore로 환산되는 값
}

export interface TaskGradeWeight {
  상: number
  중: number
  하: number
}

export interface KpiScoringConfig {
  cap: number                    // KPI 점수 상한 (기본 120). 자기평가 만점은 100 고정 (별도 설정 없음)
  maintainTolerance: number      // MAINTAIN 방향 허용 이탈 %. 0이면 선형, 2면 ±2% 내 만점
  underperformanceThreshold: number  // 미달 기준 % (기본 0 = 패널티 없음). 예: 60
  underperformanceFactor: number     // 미달 구간 점수 배율 (기본 1.0 = 없음). 예: 0.5
}

export interface RulesState {
  items: EvalItem[]
  grades: GradeItem[]
  rawScoreTable: GradeRawScoreItem[]  // 등급 원점수 변환표 (grades와 gradeId로 연결)
  taskGradeWeights: TaskGradeWeight   // 목표별 업무등급 가중 배수
  kpiScoring: KpiScoringConfig        // KPI 점수 환산 규칙
  useBiasAdjustment: boolean
  biasWeight: number
  minTeamSize: number
}

export const gradePalette = ['#7c3aed', '#2e9e6e', '#3b82f6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#6366f1']

export const defaultRules: RulesState = {
  items: [
    { id: 'self', name: '자기평가', weight: 30, locked: true, enabled: true },
    { id: 'manager', name: '상위자평가', weight: 70, locked: true, enabled: true },
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
