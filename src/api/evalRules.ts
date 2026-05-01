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

interface BackendRawScoreItem {
  gradeId: string
  rawScore: number
}

interface BackendKpiScoring {
  cap: number
  maintainTolerance: number
  underperformanceThreshold: number
  underperformanceFactor: number
}

export interface BackendRulesDto {
  items: BackendEvalItem[]
  grades: BackendGradeItem[]
  rawScoreTable: BackendRawScoreItem[]
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
  const grades = dto.grades?.length
    ? dto.grades.map(g => ({
        id: g.id,
        label: g.label,
        ratio: g.ratio,
        color: g.color,
      }))
    : defaultRules.grades
  // 백엔드는 여전히 gradeId 필드를 사용하지만, ⑥ 변환표가 ③과 독립으로 분리되면서
  // 프론트는 gradeId 문자열을 라벨로 그대로 받아 label 필드에 채운다.
  const rawScoreTable = dto.rawScoreTable?.length
    ? dto.rawScoreTable.map((r, i) => ({
        id: r.gradeId || `rs-${i}`,
        label: r.gradeId,
        rawScore: r.rawScore,
      }))
    : defaultRules.rawScoreTable

  return {
    items,
    grades,
    rawScoreTable,
    kpiScoring: dto.kpiScoring ?? {
      cap: 120,
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
    gradeItems: rules.rawScoreTable.map(r => ({
      gradeId: r.label,
      rawScore: r.rawScore,
    })),
    kpiScoringConfig: rules.kpiScoring,
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
