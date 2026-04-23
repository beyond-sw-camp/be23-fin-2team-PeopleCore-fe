import api from './client'
import { defaultRules, type RulesState } from '../pages/eval/design/evaluationRulesData'

const BASE = '/hr-service/eval/rules'

// ─── 백엔드 응답 타입 (EvaluationRulesDto) ───

interface BackendEvalItem {
  id: string
  name: string
  weight: number
  locked?: boolean
  enabled?: boolean
}

interface BackendGradeItem {
  id: string
  label: string
  ratio: number
  color: string
}

interface BackendAdjustItem {
  id: string
  name: string
  points: number
  enabled: boolean
}

interface BackendRawScoreItem {
  gradeId: string
  rawScore: number
}

interface BackendTaskGradeWeight {
  상: number
  중: number
  하: number
}

interface BackendKpiScoring {
  cap: number
  scaleTo: number
  maintainTolerance: number
  underperformanceThreshold: number
  underperformanceFactor: number
}

export interface BackendRulesDto {
  items: BackendEvalItem[]
  grades: BackendGradeItem[]
  adjustments: BackendAdjustItem[]
  rawScoreTable: BackendRawScoreItem[]
  taskGradeWeights: BackendTaskGradeWeight
  kpiScoring: BackendKpiScoring
  useBiasAdjustment: boolean
  biasWeight: number
  minTeamSize: number
  formVersion: number
}

// ─── 백엔드 → 프론트 변환 ───

export function toFrontendRules(dto: BackendRulesDto): RulesState {
  // 백엔드가 빈 배열을 내려주면(DB form_values 가 NULL/손상) defaultRules 로 폴백
  // — `??` 는 null/undefined 만 걸러 빈 배열을 그대로 통과시키므로 length 체크 필수
  const items = dto.items?.length
    ? dto.items.map(it => ({
        id: it.id,
        name: it.name,
        weight: it.weight,
        locked: it.locked,
        enabled: it.enabled,
      }))
    : defaultRules.items
  const adjustments = dto.adjustments?.length
    ? dto.adjustments.map(a => ({
        id: a.id,
        name: a.name,
        points: a.points,
        enabled: a.enabled,
      }))
    : defaultRules.adjustments
  const grades = dto.grades?.length
    ? dto.grades.map(g => ({
        id: g.id,
        label: g.label,
        ratio: g.ratio,
        color: g.color,
      }))
    : defaultRules.grades
  const rawScoreTable = dto.rawScoreTable?.length
    ? dto.rawScoreTable.map(r => ({
        gradeId: r.gradeId,
        rawScore: r.rawScore,
      }))
    : defaultRules.rawScoreTable

  return {
    items,
    adjustments,
    grades,
    rawScoreTable,
    taskGradeWeights: dto.taskGradeWeights ?? { 상: 3, 중: 2, 하: 1 },
    kpiScoring: dto.kpiScoring ?? {
      cap: 120,
      scaleTo: 100,
      maintainTolerance: 0,
      underperformanceThreshold: 0,
      underperformanceFactor: 1.0,
    },
    useBiasAdjustment: dto.useBiasAdjustment ?? true,
    biasWeight: dto.biasWeight ?? 1.0,
    minTeamSize: dto.minTeamSize ?? 5,
  }
}

// ─── 프론트 → 백엔드 저장 요청 변환 ───

export function toSaveRequest(rules: RulesState) {
  return {
    itemList: rules.items.map(it => ({
      id: it.id,
      name: it.name,
      weight: it.weight,
      locked: it.locked,
      enabled: it.enabled,
    })),
    grades: rules.grades.map(g => ({
      id: g.id,
      label: g.label,
      ratio: g.ratio,
      color: g.color,
    })),
    adjustItems: rules.adjustments.map(a => ({
      id: a.id,
      name: a.name,
      points: a.points,
      enabled: a.enabled,
    })),
    gradeItems: rules.rawScoreTable.map(r => ({
      gradeId: r.gradeId,
      rawScore: r.rawScore,
    })),
    kpiScoringConfig: rules.kpiScoring,
    taskGradeWeight: rules.taskGradeWeights,
    useBiasAdjustment: rules.useBiasAdjustment,
    biasWeight: rules.biasWeight,
    minTeamSize: rules.minTeamSize,
  }
}

// ─── API 호출 ───

// 회사 규칙 조회 (X-User-Company 헤더 기반, 없으면 null)
export async function fetchRules(): Promise<BackendRulesDto | null> {
  const { data } = await api.get<BackendRulesDto | null>(BASE)
  return data
}

// 회사 규칙 저장/수정 (시즌 상태 무관하게 편집 가능)
export async function saveRules(rules: RulesState): Promise<BackendRulesDto> {
  const { data } = await api.put<BackendRulesDto>(BASE, toSaveRequest(rules))
  return data
}
