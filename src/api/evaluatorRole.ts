// ── 평가자 역할 설정 ─────────────────────────────
// 회사당 1개 선택. 같은 부서에 해당 직급/직책 보유자가 2명 이상이면 부서별 override 로 1명 지정.
// NOTE: 백엔드 미구현, localStorage mock. 붙일 때 MOCK_MODE=false.

import api from './client'

const MOCK_MODE = false
const STORAGE_KEY = 'mock.evaluatorRoleConfig'

export type EvaluatorRoleMode = 'GRADE' | 'TITLE'

// 저장된 부서별 1명 지정
export interface DeptOverride {
  deptId: number
  empId: number
}

export interface EvaluatorRoleConfig {
  mode: EvaluatorRoleMode
  grantedTargetId: number | null
  overrides: DeptOverride[]
}

export interface EvaluatorRoleUpdateRequest {
  mode: EvaluatorRoleMode
  grantedTargetId: number
  overrides: DeptOverride[]
}

export interface MyEvaluatorRole {
  evaluator: boolean
}

// preview — 선택한 grade/title 에 매칭되는 사원을 부서별로 묶어서 반환
export interface DeptCandidate {
  empId: number
  empName: string
}

export interface DeptResolution {
  deptId: number
  deptName: string
  candidates: DeptCandidate[]
  conflict: boolean           // candidates.length >= 2
}

export interface EvaluatorRolePreviewResponse {
  mode: EvaluatorRoleMode
  grantedTargetId: number
  depts: DeptResolution[]
}

// ── mock storage ──
const SEED_CONFIG: EvaluatorRoleConfig = {
  mode: 'GRADE',
  grantedTargetId: null,
  overrides: [],
}

const readMock = (): EvaluatorRoleConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('[evaluatorRoleApi mock] parse failed', e)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_CONFIG))
  return SEED_CONFIG
}

const writeMock = (config: EvaluatorRoleConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

const wrap = <T>(data: T, delayMs = 180): Promise<{ data: T }> =>
  new Promise(resolve => setTimeout(() => resolve({ data }), delayMs))

// ── preview mock 데이터 ──
// grade/title id 별로 부서 매칭 결과 시뮬레이션.
// - GRADE=1 (부장): 개발팀 1명, 영업팀 2명(충돌), 인사팀 0명, 마케팅팀 3명(충돌)
// - GRADE=2 (과장): 개발팀 2명(충돌), 영업팀 1명, 인사팀 1명, 마케팅팀 1명
// - TITLE=1 (개발팀장): 개발팀 1명
// - TITLE=2 (영업팀장): 영업팀 1명
// 나머지 조합은 빈 응답.
const PREVIEW_MOCKS: Record<string, DeptResolution[]> = {
  'GRADE:1': [
    { deptId: 10, deptName: '개발팀', candidates: [{ empId: 101, empName: '김개발' }], conflict: false },
    { deptId: 20, deptName: '영업팀', candidates: [
      { empId: 201, empName: '박영업' },
      { empId: 202, empName: '최영업' },
    ], conflict: true },
    { deptId: 30, deptName: '인사팀', candidates: [], conflict: false },
    { deptId: 40, deptName: '마케팅팀', candidates: [
      { empId: 401, empName: '홍마케' },
      { empId: 402, empName: '이마케' },
      { empId: 403, empName: '정마케' },
    ], conflict: true },
  ],
  'GRADE:2': [
    { deptId: 10, deptName: '개발팀', candidates: [
      { empId: 110, empName: '강과장' },
      { empId: 111, empName: '서과장' },
    ], conflict: true },
    { deptId: 20, deptName: '영업팀', candidates: [{ empId: 210, empName: '노과장' }], conflict: false },
    { deptId: 30, deptName: '인사팀', candidates: [{ empId: 310, empName: '유과장' }], conflict: false },
    { deptId: 40, deptName: '마케팅팀', candidates: [{ empId: 410, empName: '한과장' }], conflict: false },
  ],
  'TITLE:1': [
    { deptId: 10, deptName: '개발팀', candidates: [{ empId: 101, empName: '김개발' }], conflict: false },
  ],
  'TITLE:2': [
    { deptId: 20, deptName: '영업팀', candidates: [{ empId: 201, empName: '박영업' }], conflict: false },
  ],
}

const readPreviewMock = (mode: EvaluatorRoleMode, targetId: number): EvaluatorRolePreviewResponse => {
  const key = `${mode}:${targetId}`
  const depts = PREVIEW_MOCKS[key] ?? []
  return { mode, grantedTargetId: targetId, depts }
}

export const evaluatorRoleApi = {
  getConfig: () => {
    if (MOCK_MODE) return wrap(readMock())
    return api.get<EvaluatorRoleConfig>('/hr-service/evaluator-role/config')
  },

  // 선택한 mode+targetId 에 대한 부서별 매칭 결과 조회 (저장 전 확인용)
  preview: (mode: EvaluatorRoleMode, grantedTargetId: number) => {
    if (MOCK_MODE) return wrap(readPreviewMock(mode, grantedTargetId))
    return api.get<EvaluatorRolePreviewResponse>(
      `/hr-service/evaluator-role/preview?mode=${mode}&targetId=${grantedTargetId}`,
    )
  },

  updateConfig: (request: EvaluatorRoleUpdateRequest) => {
    if (MOCK_MODE) {
      const next: EvaluatorRoleConfig = {
        mode: request.mode,
        grantedTargetId: request.grantedTargetId,
        overrides: request.overrides,
      }
      writeMock(next)
      console.info('[evaluatorRoleApi mock] saved', next)
      return wrap(next, 300)
    }
    return api.put<EvaluatorRoleConfig>('/hr-service/evaluator-role/config', request)
  },

  me: () => {
    if (MOCK_MODE) return wrap<MyEvaluatorRole>({ evaluator: true })
    return api.get<MyEvaluatorRole>('/hr-service/evaluator-role/me')
  },
}
