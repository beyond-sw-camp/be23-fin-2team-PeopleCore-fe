import api from './client'

// 백엔드 enum 값
export type GoalType = 'KPI' | 'OKR'
export type TaskGrade = 'HIGH' | 'MID' | 'LOW'
export type GoalApprovalStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'

export interface GoalResponse {
  id: number
  goalType: GoalType
  category: string
  title: string
  description: string
  grade: TaskGrade
  kpiTemplateId: number | null
  targetValue: number | null
  targetUnit: string | null
  approval: GoalApprovalStatus
  submittedAt: string | null
  rejectReason: string | null
  ratio: number | null           // 승인 목표 중 비율(%) - 미승인/단건응답은 null
}

export interface GoalRequest {
  goalType: GoalType
  grade: TaskGrade
  kpiTemplateId?: number | null
  targetValue?: number | null
  category?: string | null
  title?: string | null
  description?: string | null
}

const base = '/hr-service/eval/goals'

// 본인 목표 목록 - 현재 OPEN 시즌
export async function fetchMyGoals(): Promise<GoalResponse[]> {
  const { data } = await api.get<GoalResponse[]>(base)
  return data
}

export async function createGoal(payload: GoalRequest): Promise<GoalResponse> {
  const { data } = await api.post<GoalResponse>(base, payload)
  return data
}

export async function updateGoal(id: number, payload: GoalRequest): Promise<GoalResponse> {
  const { data } = await api.put<GoalResponse>(`${base}/${id}`, payload)
  return data
}

// 삭제 결과 - cascade 확인 플로우 지원
//   confirm=false 재호출 시: requiresConfirm=true + cascadedOkrs 로 옴 → 프론트 다이얼로그 → confirm=true 재호출
//   그 외: success=true, cascade 없이 정상 삭제
export interface CascadedGoal {
  goalId: number
  title: string
}

export interface GoalDeleteResult {
  success: boolean
  requiresConfirm: boolean
  cascadedOkrs: CascadedGoal[]
}

export async function deleteGoal(id: number, confirm = false): Promise<GoalDeleteResult> {
  const { data } = await api.delete<GoalDeleteResult>(`${base}/${id}`, { params: { confirm } })
  return data
}

// 본인 작성중/반려 목표 전체 제출
export async function submitAllDrafts(): Promise<GoalResponse[]> {
  const { data } = await api.post<GoalResponse[]>(`${base}/submit-all`)
  return data
}

// ─── 평가자 (팀장) 승인 화면 ───

export interface TeamMemberGoalResponse {
  id: number              // empId
  employeeName: string
  dept: string
  position: string
  submittedDate: string | null
  goals: GoalResponse[]
}

// 팀원별 목표 묶음 조회 (평가자 가드)
export async function fetchTeamGoals(): Promise<TeamMemberGoalResponse[]> {
  const { data } = await api.get<TeamMemberGoalResponse[]>(`${base}/team`)
  return data
}

// 단건 승인
export async function approveGoal(goalId: number): Promise<GoalResponse> {
  const { data } = await api.post<GoalResponse>(`${base}/${goalId}/approve`)
  return data
}

// 단건 반려 (사유 필수)
export async function rejectGoal(goalId: number, rejectReason: string): Promise<GoalResponse> {
  const { data } = await api.post<GoalResponse>(`${base}/${goalId}/reject`, { rejectReason })
  return data
}

// 특정 팀원의 대기 건 일괄 승인
export async function approveAllPending(empId: number): Promise<GoalResponse[]> {
  const { data } = await api.post<GoalResponse[]>(`${base}/approve-all/${empId}`)
  return data
}
