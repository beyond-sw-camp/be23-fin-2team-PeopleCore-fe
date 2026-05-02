// ── 사원-평가자 매핑 (글로벌, 시즌 무관) ─────────────────────────────
// 백엔드 연결: GET/PUT /emp-evaluator/global, PATCH /emp-evaluator/global/{empId} (변경) /exclude (평가 제외)
// 백엔드 DTO 필드명(evaluateeEmpId, evaluatorEmpId)과 페이지 코드(empId, evaluatorId) 사이에 변환 어댑터 적용.

import api from './client'

// 페이지에서 사용하는 매핑 타입 (empId = 피평가자)
// excluded=true 면 evaluatorId 는 null
export interface EmpEvaluatorMapping {
  empId: number
  evaluatorId: number | null
  excluded: boolean
  // 백엔드 미보유 — 페이지 호환 위해 옵셔널로 둠
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

// 백엔드 응답 형식
interface BackendMappingDto {
  evaluateeEmpId: number
  evaluateeName: string
  evaluateeDeptName: string | null
  evaluatorEmpId: number | null
  evaluatorName: string | null
  evaluatorDeptName: string | null
  excluded: boolean
}

interface BackendGlobalResponse {
  mappings: BackendMappingDto[]
}

// 백엔드 → 프론트 변환
const fromBackend = (b: BackendMappingDto): EmpEvaluatorMapping => ({
  empId: b.evaluateeEmpId,
  evaluatorId: b.evaluatorEmpId,
  excluded: b.excluded,
})

// 프론트 → 백엔드 PUT 페이로드 변환
const toBackendPutItem = (m: EmpEvaluatorMapping) => ({
  evaluateeEmpId: m.empId,
  evaluatorEmpId: m.excluded ? null : m.evaluatorId,
  excluded: m.excluded,
})

export const empEvaluatorApi = {
  // 글로벌 매핑 조회
  getGlobal: async () => {
    const { data } = await api.get<BackendGlobalResponse>('/hr-service/emp-evaluator/global')
    return {
      data: {
        mappings: data.mappings.map(fromBackend),
      } as EmpEvaluatorGlobalConfig,
    }
  },

  // 글로벌 매핑 일괄 교체
  updateGlobal: async (mappings: EmpEvaluatorMapping[]) => {
    const { data } = await api.put<BackendGlobalResponse>(
      '/hr-service/emp-evaluator/global',
      { mappings: mappings.map(toBackendPutItem) },
    )
    return {
      data: {
        mappings: data.mappings.map(fromBackend),
      } as EmpEvaluatorGlobalConfig,
    }
  },

  // 시즌 진행 중 평가자 재지정 (퇴사로 풀린 미지정 행에만) — EvalGrade 박제값 update
  reassignDuringSeason: async (empId: number, newEvaluatorId: number) => {
    await api.patch(
      `/hr-service/emp-evaluator/season/${empId}/evaluator`,
      { newEvaluatorId },
    )
  },

  // 평가 제외 토글 (즉시 반영) — 그 시즌 평가 대상에서 제외
  markExcluded: async (empId: number) => {
    const { data } = await api.patch<BackendMappingDto>(
      `/hr-service/emp-evaluator/global/${empId}/exclude`,
      {},
    )
    return { data: fromBackend(data) }
  },

  // 시즌별 박제 매핑 조회 — 백엔드 endpoint 미구현
  getSeasonSnapshot: async (seasonId: number) => {
    return {
      data: {
        seasonId,
        snapshotAt: '',
        mappings: [] as EmpEvaluatorMapping[],
      } as EmpEvaluatorSeasonSnapshot,
    }
  },
}
