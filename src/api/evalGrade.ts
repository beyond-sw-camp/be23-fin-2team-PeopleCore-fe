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
export type SortDirection = 'ASC' | 'DESC'

export interface DraftListParams {
  deptId?: number
  keyword?: string
  sortField?: EvalGradeSortField
  sortDirection?: SortDirection
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

// ─── 팀별 Z-score 편향 보정 효과 요약 (자동 산정 차트용) ───
// 각 팀의 팀장 점수 평균: 보정 전(managerScore) vs 보정 후(managerScoreAdjusted)
export interface TeamBiasTeam {
  deptId: number
  deptName: string
  memberCount: number   // 팀장 점수 있는 사원 수
  originalAvg: number   // 보정 전 팀장 점수 평균
  adjustedAvg: number   // Z-score 보정 후 팀장 점수 평균
}

export interface TeamBiasResponseDto {
  minTeamSize: number      // 회사 규칙의 최소 팀 크기 — 미만이면 보정 제외
  teams: TeamBiasTeam[]
}

export async function fetchTeamBiasSummary(seasonId: number): Promise<TeamBiasResponseDto> {
  const { data } = await api.get<TeamBiasResponseDto>(`${base(seasonId)}/team-bias`)
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
  sortDirection?: SortDirection
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

// 자기평가 scaleTo 초과로 clip 된 사원 - 등급 상향 후보
export interface ClippedSelfEmployee {
  empId: number
  empName: string
  deptName: string
  rawSelfScore: number    // clip 전 원 점수
  selfScore: number       // clip 후 점수 (=scaleTo)
  autoGrade: string | null
}

export interface CalibrationReview {
  seasonId: number
  processedCount: number
  zeroStdDevTeams: TeamAnomaly[]
  undersizedTeams: TeamAnomaly[]
  clippedSelfEmployees: ClippedSelfEmployee[]
}

export async function fetchCalibrationReview(seasonId: number): Promise<CalibrationReview> {
  const { data } = await api.get<CalibrationReview>(`${base(seasonId)}/calibration/review`)
  return data
}

// ─── 최종 등급 확정 및 잠금 ───

export interface FinalizeSummaryDto {
  totalCount: number
  assignedCount: number
  unassignedCount: number
  calibratedCount: number
}

export async function fetchFinalizeSummary(seasonId: number): Promise<FinalizeSummaryDto> {
  const { data } = await api.get<FinalizeSummaryDto>(`${base(seasonId)}/finalize/summary`)
  return data
}

export interface UnassignedEmployeeDto {
  empId: number            // 확정 시 acknowledgedEmpIds 로 돌려받기 위한 식별자
  empNum: string
  empName: string
  deptName: string
  position: string
}

export interface UnassignedListParams {
  deptId?: number
  sortField?: EvalGradeSortField
  sortDirection?: SortDirection
  page?: number
  size?: number
}

export async function fetchUnassignedList(seasonId: number, params: UnassignedListParams = {}): Promise<SpringPage<UnassignedEmployeeDto>> {
  const { data } = await api.get<SpringPage<UnassignedEmployeeDto>>(
    `${base(seasonId)}/finalize/unassigned`,
    { params },
  )
  return data
}

export interface FinalizeDto {
  acknowledgedEmpIds?: number[]
  finalizedAt?: string
  lockedCount?: number
}

export async function finalizeGrades(seasonId: number, acknowledgedEmpIds: number[]): Promise<FinalizeDto> {
  const { data } = await api.post<FinalizeDto>(
    `${base(seasonId)}/finalize`,
    { acknowledgedEmpIds },
  )
  return data
}

// ─── 평가 결과 조회 (HR 전용) ───

export type SeasonOptionStatus = 'IN_PROGRESS' | 'FINALIZED'

export interface SeasonOptionDto {
  seasonId: number
  name: string
  status: SeasonOptionStatus
  finalizedAt: string | null
  startDate: string                 // "YYYY-MM-DD" - 프론트에서 오늘 이후 시즌 필터용
}

// HR 전체 시즌 목록 (최신순, CLOSED 포함)
export async function fetchAllResultSeasons(): Promise<SeasonOptionDto[]> {
  const { data } = await api.get<SeasonOptionDto[]>('/hr-service/eval/grades/seasons')
  return data
}

export interface FinalGradeListItemDto {
  gradeId: number
  empNum: string
  empName: string
  deptName: string
  position: string
  totalScore: number | null
  autoGrade: string | null
  finalGrade: string | null
  isCalibrated: boolean
}

export interface FinalListParams {
  deptId?: number
  keyword?: string
  unscoredOnly?: boolean
  sortField?: EvalGradeSortField
  page?: number
  size?: number
}

export async function fetchFinalList(seasonId: number, params: FinalListParams = {}): Promise<SpringPage<FinalGradeListItemDto>> {
  const { data } = await api.get<SpringPage<FinalGradeListItemDto>>(
    `${base(seasonId)}/list/final`,
    { params },
  )
  return data
}

// ─── 평가 결과 상세 (HR 전용) ───

export type DetailGoalType = 'KPI' | 'OKR'
export type DetailAchievementLevel = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' | 'INADEQUATE'

export interface DetailGoalEntry {
  goalType: DetailGoalType
  category: string
  title: string
  weight: number | null            // 가중치(%) - KPI 만 값, OKR 은 null
  targetValue: number | null
  targetUnit: string | null
}

export interface DetailItemScore {
  itemId: string            // "self" / "manager"
  itemName: string
  score: number | null
  weight: number
}

export interface DetailFile {
  fileId: number
  fileName: string
  fileUrl?: string
}

export interface DetailSelfEvalEntry {
  goalType: DetailGoalType
  title: string
  weight: number | null            // 가중치(%) - KPI 만 값, OKR 은 null
  targetValue: number | null
  targetUnit: string | null
  actualValue: number | null
  achievementLevel: DetailAchievementLevel | null
  achievementDetail: string
  files: DetailFile[]
}

export interface DetailManagerEvalEntry {
  grade: string | null
  comment: string | null
  feedback: string | null
}

export interface DetailCalibrationEntry {
  date: string
  fromGrade: string
  toGrade: string
  reason: string
  actor: string | null
}

export interface EvalGradeDetailDto {
  empNum: string
  empName: string
  deptName: string
  position: string
  seasonName: string
  finalGrade: string | null
  rankInSeason: number | null
  goals: DetailGoalEntry[]
  itemScores: DetailItemScore[]
  selfEvalEntries: DetailSelfEvalEntry[]
  managerEvalEntry: DetailManagerEvalEntry | null
  rawScore: number | null
  teamAvg: number | null
  teamStd: number | null
  companyAvg: number | null
  companyStd: number | null
  adjustedScore: number | null
  autoGrade: string | null
  calibrations: DetailCalibrationEntry[]
  lockedAt: string | null
}

export async function fetchGradeDetail(gradeId: number): Promise<EvalGradeDetailDto> {
  const { data } = await api.get<EvalGradeDetailDto>(`/hr-service/eval/grades/${gradeId}/detail`)
  return data
}

// ─── 본인 평가결과 (사원) ───

export type MyResultStatus = 'IN_PROGRESS' | 'FINALIZED'

export interface MySeasonOptionDto {
  seasonId: number
  name: string
  status: MyResultStatus
  finalizedAt: string | null
  startDate: string                 // "YYYY-MM-DD"
}

export async function fetchMySeasons(): Promise<MySeasonOptionDto[]> {
  const { data } = await api.get<MySeasonOptionDto[]>('/hr-service/eval/grades/my/seasons')
  return data
}

export interface MyResultGoal {
  goalType: 'KPI' | 'OKR'
  category: string
  title: string
  weight: number | null            // 가중치(%) - KPI 만 값, OKR 은 null
  targetValue: number | null
  targetUnit: string | null
  actualValue: number | null
  achievementRate: number | null
  selfLevel: DetailAchievementLevel | null
}

export interface MyEvalResultDto {
  status: MyResultStatus
  finalizedAt: string | null
  autoGrade: string | null
  managerGrade: string | null
  finalGrade: string | null
  feedback: string | null
  goals: MyResultGoal[]
}

export async function fetchMyResult(seasonId: number): Promise<MyEvalResultDto> {
  const { data } = await api.get<MyEvalResultDto>('/hr-service/eval/grades/my/result', { params: { seasonId } })
  return data
}
