import api from './client'
import { defaultRules, LOCKED_ADJUST_IDS, type RulesState } from '../pages/eval/design/evaluationRulesData'

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
  threshold?: number
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
  // 고정 항목(지각/무단결근)은 DB 값 대신 defaultRules 값으로 강제 덮어씀 — 이름/점수 변조 방지
  const lockedDefaults = new Map(defaultRules.adjustments.filter(a => a.locked).map(a => [a.id, a]))
  const adjustments = dto.adjustments?.length
    ? dto.adjustments.map(a => {
        const pinned = lockedDefaults.get(a.id)
        const threshold = a.threshold ?? 0
        if (pinned) {
          return { id: pinned.id, name: pinned.name, points: pinned.points, threshold, enabled: a.enabled, locked: true }
        }
        return { id: a.id, name: a.name, points: a.points, threshold, enabled: a.enabled }
      })
    : defaultRules.adjustments.map(a => ({ ...a }))
  // DB 에 고정 항목이 누락되어 있으면 defaults 로 보강
  for (const id of LOCKED_ADJUST_IDS) {
    if (!adjustments.some(a => a.id === id)) {
      const d = lockedDefaults.get(id)
      if (d) adjustments.unshift({ ...d })
    }
  }
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
      threshold: a.threshold,
      enabled: a.enabled,
    })),
    gradeItems: rules.rawScoreTable.map(r => ({
      gradeId: r.label,
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
