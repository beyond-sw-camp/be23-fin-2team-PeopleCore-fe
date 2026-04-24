import api from './client'
import type { KpiDirection } from './kpiTemplate'

// ─── 팀원 목록 ───

export interface TeamMemberEvalListDto {
  empId: number
  name: string
  dept: string
  position: string
  kpiCount: number
  okrCount: number
  selfEvalSubmitted: boolean
  managerEvalSubmitted: boolean
}

export async function fetchTeamMembers(): Promise<TeamMemberEvalListDto[]> {
  const { data } = await api.get<TeamMemberEvalListDto[]>('/hr-service/eval/manager-evaluations/team-members')
  return data
}

// ─── 팀원 달성도 (플로팅 패널용) ───

export interface AchievementKpiItem {
  category: string
  title: string
  targetValue: number | null
  targetUnit: string | null
  actualValue: number | null
  direction: KpiDirection
}

export interface AchievementOkrItem {
  category: string
  title: string
  selfLevel: string | null        // EXCELLENT/GOOD/AVERAGE/POOR/INADEQUATE
}

export interface ManagerEvalAchievementDto {
  kpiList: AchievementKpiItem[]
  okrList: AchievementOkrItem[]
}

export async function fetchAchievement(empId: number): Promise<ManagerEvalAchievementDto> {
  const { data } = await api.get<ManagerEvalAchievementDto>(`/hr-service/eval/manager-evaluations/${empId}/achievement`)
  return data
}

// ─── 기존 평가 조회 (임시저장 복구/수정용) ───

export interface ManagerEvalDetailDto {
  grade: string | null              // S/A/B/C/D
  comment: string | null
  feedback: string | null
  submittedAt: string | null        // null = 임시저장 or 미시작
}

export async function fetchManagerEvaluation(empId: number): Promise<ManagerEvalDetailDto> {
  const { data } = await api.get<ManagerEvalDetailDto>(`/hr-service/eval/manager-evaluations/${empId}`)
  return data
}

// ─── 임시 저장 / 제출 ───

export interface ManagerEvalRequest {
  grade?: string | null
  comment?: string | null
  feedback?: string | null
}

export async function saveManagerEvalDraft(empId: number, request: ManagerEvalRequest): Promise<void> {
  await api.put(`/hr-service/eval/manager-evaluations/${empId}/draft`, request)
}

export async function submitManagerEval(empId: number, request: ManagerEvalRequest): Promise<void> {
  await api.post(`/hr-service/eval/manager-evaluations/${empId}/submit`, request)
}

// ─── 팀 결과 조회 (평가자) ───

export type MyResultStatus = 'IN_PROGRESS' | 'FINALIZED'

export interface MySeasonOptionDto {
  seasonId: number
  name: string
  status: MyResultStatus
  finalizedAt: string | null
  startDate: string                 // "YYYY-MM-DD"
}

// 평가자가 참여한 시즌 목록 (최신순, 과거 포함)
export async function fetchTeamResultSeasons(): Promise<MySeasonOptionDto[]> {
  const { data } = await api.get<MySeasonOptionDto[]>('/hr-service/eval/manager-evaluations/team-results/seasons')
  return data
}

export interface TeamMemberResultDto {
  empId: number
  empName: string
  position: string
  managerGradeId: string | null
  autoGradeId: string | null
  finalGradeId: string | null
  managerComment: string | null
  managerFeedback: string | null
}

// 팀원 최종 평가결과 일괄 조회
export async function fetchTeamResults(seasonId: number, gradeFilter?: string): Promise<TeamMemberResultDto[]> {
  const params: Record<string, string | number> = { seasonId }
  if (gradeFilter && gradeFilter !== 'ALL') params.gradeFilter = gradeFilter
  const { data } = await api.get<TeamMemberResultDto[]>('/hr-service/eval/manager-evaluations/team-results', { params })
  return data
}
