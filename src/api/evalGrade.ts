import api from './client'

export interface DraftListItemDto {
  empNum: string
  name: string
  deptName: string
  position: string
  totalScore: number | null
  autoGrade: string | null
}

export interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export type EvalGradeSortField = 'EMP_NUM' | 'EMP_NAME' | 'TOTAL_SCORE' | 'AUTO_GRADE'

export interface DraftListParams {
  deptId?: number
  keyword?: string
  sortField?: EvalGradeSortField
  page?: number
  size?: number
}

const base = (seasonId: number) => `/hr-service/eval/grades/${seasonId}`

export async function fetchDraftList(seasonId: number, params: DraftListParams = {}): Promise<SpringPage<DraftListItemDto>> {
  const { data } = await api.get<SpringPage<DraftListItemDto>>(`${base(seasonId)}/list/draft`, { params })
  return data
}

export async function calculateGrades(seasonId: number): Promise<void> {
  await api.post(`${base(seasonId)}/calculate`)
}

export async function applyBiasAdjustment(seasonId: number): Promise<void> {
  await api.post(`${base(seasonId)}/bias-adjust/apply`)
}

// 강제배분 응답 — 재실행 시 보정 이력 있으면 requiresConfirm=true 로 와서 프론트에서 재확인 필요
export interface DistributionApplyResultDto {
  success: boolean         // true = 배분 완료
  noChange: boolean        // cohort 변화 없음 → 실행 스킵
  requiresConfirm: boolean // 보정 이력 존재 → 확인 후 confirm=true 재호출 필요
  pendingResetCount: number // requiresConfirm=true 시 삭제 예정 보정 건수
  distributedCount: number // success=true 시 배분된 인원
  resetCount: number       // success=true 시 리셋된 보정 건수
}

export async function applyDistribution(seasonId: number, confirm = false): Promise<DistributionApplyResultDto> {
  const { data } = await api.post<DistributionApplyResultDto>(
    `${base(seasonId)}/distribution/apply`,
    null,
    { params: { confirm } },
  )
  return data
}

// ─── 6. 실제 vs 목표 분포 + 보정 건수 ───

export type DiffStatus = 'MATCH' | 'OVER' | 'UNDER'

export interface GradeDiff {
  label: string
  color: string
  targetRatio: number
  targetCount: number
  actualCount: number
  diff: number
  status: DiffStatus
}

export interface DistributionDiffDto {
  grades: GradeDiff[]
  totalCount: number
  mismatchCount: number
  calibrationCount: number
  allMatch: boolean
}

export async function fetchDistributionDiff(seasonId: number): Promise<DistributionDiffDto> {
  const { data } = await api.get<DistributionDiffDto>(`${base(seasonId)}/distribution-diff`)
  return data
}

// ─── 7. 보정 페이지 사원 목록 ───

export interface CalibrationListItemDto {
  gradeId: number
  empNum: string
  name: string
  deptName: string
  position: string
  totalScore: number | null
  autoGrade: string | null
  adjustedGrade: string | null
  reason: string | null
  adjusterName: string | null
  calibrated: boolean
}

export interface CalibrationListParams {
  deptId?: number
  keyword?: string
  sortField?: EvalGradeSortField
  page?: number
  size?: number
}

export async function fetchCalibrationList(seasonId: number, params: CalibrationListParams = {}): Promise<SpringPage<CalibrationListItemDto>> {
  const { data } = await api.get<SpringPage<CalibrationListItemDto>>(`${base(seasonId)}/list/calibration`, { params })
  return data
}

// ─── 8. 보정 이력 (건별) ───

export interface CalibrationHistoryDto {
  calibrationId: number
  gradeId: number
  empNum: string
  empName: string
  deptName: string
  fromGrade: string
  toGrade: string
  reason: string
  adjusterName: string | null
  createdAt: string
}

export async function fetchCalibrations(seasonId: number): Promise<CalibrationHistoryDto[]> {
  const { data } = await api.get<CalibrationHistoryDto[]>(`${base(seasonId)}/calibrations`)
  return data
}

// ─── 9. 일괄 보정 저장 ───

export interface CalibrationItemRequest {
  gradeId: number
  toGrade: string
  reason: string
}

export interface CalibrationBatchResultDto {
  success: boolean
  saveCount: number
  currentDiff: GradeDiff[] | null
}

export async function batchSaveCalibration(seasonId: number, items: CalibrationItemRequest[]): Promise<CalibrationBatchResultDto> {
  const { data } = await api.post<CalibrationBatchResultDto>(`${base(seasonId)}/calibration/batch`, items)
  return data
}

// ─── 4. 편향보정 이상 팀 조회 ───

export interface TeamAnomaly {
  deptId: number
  deptName: string
}

export interface BiasAdjustAnomalies {
  seasonId: number
  processedCount: number
  zeroStdDevTeams: TeamAnomaly[]
  undersizedTeams: TeamAnomaly[]
}

export async function fetchBiasAdjustAnomalies(seasonId: number): Promise<BiasAdjustAnomalies> {
  const { data } = await api.get<BiasAdjustAnomalies>(`${base(seasonId)}/bias-adjust/anomalies`)
  return data
}
