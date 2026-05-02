import api from './client'
import type { GoalType } from './goal'

export type AchievementLevel = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'INADEQUATE'
export type SelfEvalApprovalStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'

export interface SelfEvalFileResponse {
  fileId: number
  originalFileName: string
  contentType: string
  fileSize: number
}

export interface SelfEvaluationResponse {
  // 목표 정보
  goalId: number
  goalType: GoalType
  category: string
  title: string
  description: string
  weight: number | null              // 가중치(%) — KPI 만 값, OKR 은 null
  kpiTemplateId: number | null
  targetValue: number | null
  targetUnit: string | null

  // 자기평가 필드 (미작성이면 selfEvalId 포함 전부 null, approval=DRAFT)
  selfEvalId: number | null
  actualValue: number | null
  achievementLevel: AchievementLevel | null
  achievementDetail: string | null
  evidence: string | null
  approval: SelfEvalApprovalStatus
  rejectReason: string | null
  submittedAt: string | null

  files: SelfEvalFileResponse[]
}

export interface SelfEvaluationDraftItem {
  goalId: number
  actualValue?: number | null
  achievementLevel?: AchievementLevel | null
  achievementDetail?: string | null
  evidence?: string | null
}

export interface SelfEvaluationDraftRequest {
  items: SelfEvaluationDraftItem[]
}

const base = '/hr-service/eval/self-evaluations'

// 본인 자기평가 목록 - 현재 OPEN 시즌 + 목표승인된 것
export async function fetchMySelfEvaluations(): Promise<SelfEvaluationResponse[]> {
  const { data } = await api.get<SelfEvaluationResponse[]>(base)
  return data
}

// 전체 임시저장 (submittedAt 유지)
export async function saveSelfEvalDraft(request: SelfEvaluationDraftRequest): Promise<SelfEvaluationResponse[]> {
  const { data } = await api.put<SelfEvaluationResponse[]>(`${base}/draft`, request)
  return data
}

// 전체 제출 (submittedAt=now, 반려 사유 초기화)
export async function submitSelfEvalAll(request: SelfEvaluationDraftRequest): Promise<SelfEvaluationResponse[]> {
  const { data } = await api.post<SelfEvaluationResponse[]>(`${base}/submit-all`, request)
  return data
}

// 근거 파일 업로드 (multipart → MinIO)
export async function uploadSelfEvalFile(goalId: number, file: File): Promise<SelfEvalFileResponse> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<SelfEvalFileResponse>(
    `${base}/${goalId}/files`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

// 근거 파일 삭제 (MinIO 객체까지 제거)
export async function deleteSelfEvalFile(goalId: number, fileId: number): Promise<void> {
  await api.delete(`${base}/${goalId}/files/${fileId}`)
}

// ─── 평가자 (팀장) 자기평가 검토 ───

export interface TeamMemberSelfEvaluationResponse {
  id: number                        // empId
  employeeName: string
  dept: string
  position: string
  submittedDate: string | null
  evaluations: SelfEvaluationResponse[]
}

// 팀원별 자기평가 묶음 조회 (평가자 가드)
export async function fetchTeamSelfEvaluations(): Promise<TeamMemberSelfEvaluationResponse[]> {
  const { data } = await api.get<TeamMemberSelfEvaluationResponse[]>(`${base}/team`)
  return data
}

// 단건 승인
export async function approveSelfEvaluation(goalId: number): Promise<SelfEvaluationResponse> {
  const { data } = await api.post<SelfEvaluationResponse>(`${base}/${goalId}/approve`)
  return data
}

// 단건 반려 (사유 필수)
export async function rejectSelfEvaluation(goalId: number, rejectReason: string): Promise<SelfEvaluationResponse> {
  const { data } = await api.post<SelfEvaluationResponse>(`${base}/${goalId}/reject`, { rejectReason })
  return data
}

// 특정 팀원의 대기 건 일괄 승인
export async function approveAllPendingSelfEvaluations(empId: number): Promise<SelfEvaluationResponse[]> {
  const { data } = await api.post<SelfEvaluationResponse[]>(`${base}/approve-all/${empId}`)
  return data
}

// 근거 파일 다운로드 URL — 인증 헤더 포함해서 fetch 해야 하므로 blob 으로 받기
export async function downloadSelfEvalFile(goalId: number, fileId: number, filename: string): Promise<void> {
  const response = await api.get(`${base}/${goalId}/files/${fileId}`, { responseType: 'blob' })
  const url = URL.createObjectURL(response.data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
