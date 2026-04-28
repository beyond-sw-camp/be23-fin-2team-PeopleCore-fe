// ── 사원-평가자 매핑 (글로벌, 시즌 무관) ─────────────────────────────
// HR 이 상시 유지하는 회사 단위 매핑. 시즌 확정(finalize) 시점에 그 시즌명으로 박제.
// 시즌 진행 중 평가자 변경은 글로벌에서 처리 → 진행 중 시즌의 평가에도 즉시 반영.
// NOTE: 백엔드 미구현, localStorage mock. 붙일 때 MOCK_MODE=false.

import api from './client'

const MOCK_MODE = true
const STORAGE_KEY = 'mock.empEvaluatorGlobalV1'
// 시즌 박제 (이력 조회용) — 백엔드 자동 박제 시뮬레이션
const SNAPSHOT_KEY = 'mock.empEvaluatorSnapshotsV1'

export interface EmpEvaluatorMapping {
  empId: number
  evaluatorId: number
  // 변경 이력 (audit) — 마지막 변경 정보. 시즌 진행 중 변경 시 갱신.
  lastChangedAt?: string
  lastChangedReason?: string
  lastChangedByHr?: number
}

export interface EmpEvaluatorGlobalConfig {
  mappings: EmpEvaluatorMapping[]
}

export interface EmpEvaluatorSeasonSnapshot {
  seasonId: number
  snapshotAt: string
  mappings: EmpEvaluatorMapping[]
}

export type ChangeReason = 'EVALUATOR_RETIRED' | 'MANUAL_CHANGE' | 'OTHER'

const readGlobal = (): EmpEvaluatorGlobalConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('[empEvaluatorApi mock] parse failed', e)
  }
  const seed = { mappings: [] }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
  return seed
}

const writeGlobal = (config: EmpEvaluatorGlobalConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

const readSnapshots = (): Record<number, EmpEvaluatorSeasonSnapshot> => {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('[empEvaluatorApi mock] snapshots parse failed', e)
  }
  return {}
}

const writeSnapshots = (snaps: Record<number, EmpEvaluatorSeasonSnapshot>) => {
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snaps))
}

const wrap = <T>(data: T, delayMs = 180): Promise<{ data: T }> =>
  new Promise(resolve => setTimeout(() => resolve({ data }), delayMs))

export const empEvaluatorApi = {
  // 글로벌 매핑 조회 (HR 작업용)
  getGlobal: () => {
    if (MOCK_MODE) return wrap(readGlobal())
    return api.get<EmpEvaluatorGlobalConfig>('/hr-service/emp-evaluator/global')
  },

  // 글로벌 매핑 저장 (전체 교체)
  updateGlobal: (mappings: EmpEvaluatorMapping[]) => {
    if (MOCK_MODE) {
      const next = { mappings }
      writeGlobal(next)
      return wrap(next, 280)
    }
    return api.put<EmpEvaluatorGlobalConfig>('/hr-service/emp-evaluator/global', { mappings })
  },

  // 평가자 1명 변경 (즉시 반영, audit 로그 남김)
  changeEvaluator: (empId: number, newEvaluatorId: number, reason: ChangeReason = 'MANUAL_CHANGE') => {
    if (MOCK_MODE) {
      const cfg = readGlobal()
      const idx = cfg.mappings.findIndex(m => m.empId === empId)
      if (idx < 0) return Promise.reject(new Error('해당 매핑이 없습니다'))
      cfg.mappings[idx] = {
        ...cfg.mappings[idx],
        evaluatorId: newEvaluatorId,
        lastChangedAt: new Date().toISOString(),
        lastChangedReason: reason,
      }
      writeGlobal(cfg)
      return wrap<EmpEvaluatorMapping>(cfg.mappings[idx], 220)
    }
    return api.patch<EmpEvaluatorMapping>(
      `/hr-service/emp-evaluator/global/${empId}`,
      { newEvaluatorId, reason },
    )
  },

  // 시즌별 박제 매핑 조회 (이력 조회 read-only)
  getSeasonSnapshot: (seasonId: number) => {
    if (MOCK_MODE) {
      const snaps = readSnapshots()
      const snap = snaps[seasonId]
      return wrap<EmpEvaluatorSeasonSnapshot | null>(snap ?? null)
    }
    return api.get<EmpEvaluatorSeasonSnapshot | null>(
      `/hr-service/seasons/${seasonId}/evaluator-snapshot`,
    )
  },

  // mock 전용 — 시즌 확정(finalize) 시뮬레이션. 실제 백엔드는 시즌 확정 트랜잭션에서 자동 박제.
  // 박제는 그 시즌의 seasonId 로 키잉되며, UI 에선 그 시즌 name 으로 식별됨.
  __mockFinalizeSnapshot: (seasonId: number) => {
    if (!MOCK_MODE) return Promise.resolve()
    const cfg = readGlobal()
    const snaps = readSnapshots()
    snaps[seasonId] = {
      seasonId,
      snapshotAt: new Date().toISOString(),
      mappings: cfg.mappings.map(m => ({ ...m })),
    }
    writeSnapshots(snaps)
    return wrap(null, 200)
  },
}
