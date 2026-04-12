// 평가 규칙 공유 데이터
// EvaluationRules (admin 설정) ↔ GradeDraftAuto (등급 산정) 등에서 공유
// TODO: 백엔드 연동 시 GET /evaluation-rules?seasonId= 로 교체

export interface EvalItem {
  id: string
  name: string
  weight: number       // 가중치 %
}

export interface AdjustItem {
  id: string
  name: string         // 예: 근태 감점, 징계, 표창 가산
  points: number       // 음수=감점, 양수=가산
  enabled: boolean
}

export interface GradeItem {
  id: string
  label: string        // S, A, A+, ...
  minScore: number     // 컷오프 점수
  ratio: number        // 강제배분 목표 %
  color: string
}

export interface TaskGradeWeight {
  상: number
  중: number
  하: number
}

export interface RulesState {
  items: EvalItem[]
  adjustments: AdjustItem[]
  grades: GradeItem[]
  taskGradeWeights: TaskGradeWeight   // 목표별 업무등급 가중 배수
  useBiasAdjustment: boolean
  biasWeight: number
  minTeamSize: number
}

export const gradePalette = ['#7c3aed', '#2e9e6e', '#3b82f6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#6366f1']

export const defaultRules: RulesState = {
  items: [
    { id: 'self', name: '자기평가', weight: 30 },
    { id: 'manager', name: '상위자평가', weight: 70 },
  ],
  adjustments: [
    { id: 'attendance', name: '근태 감점', points: -2, enabled: true },
    { id: 'discipline', name: '징계 감점', points: -5, enabled: true },
    { id: 'award', name: '표창 가산', points: 3, enabled: true },
  ],
  grades: [
    { id: 'S', label: 'S', minScore: 90, ratio: 10, color: '#7c3aed' },
    { id: 'A', label: 'A', minScore: 80, ratio: 20, color: '#2e9e6e' },
    { id: 'B', label: 'B', minScore: 70, ratio: 40, color: '#3b82f6' },
    { id: 'C', label: 'C', minScore: 60, ratio: 20, color: '#f59e0b' },
    { id: 'D', label: 'D', minScore: 0,  ratio: 10, color: '#ef4444' },
  ],
  taskGradeWeights: { 상: 3, 중: 2, 하: 1 },
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
