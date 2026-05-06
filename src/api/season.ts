import api from './client'

// 백엔드 enum
export type SeasonStatusEnum = 'DRAFT' | 'OPEN' | 'CLOSED'
export type StageStatusEnum = 'WAITING' | 'IN_PROGRESS' | 'FINISHED'
export type StageTypeEnum = 'GOAL_ENTRY' | 'EVALUATION' | 'GRADING' | 'FINALIZATION'
export type SeasonPeriodEnum = 'FIRST_HALF' | 'SECOND_HALF' | 'ANNUAL'

// 한글 라벨 (프론트 표시용)
export type SeasonStatusLabel = '준비중' | '진행중' | '완료'
export type StageStatusLabel = '대기' | '진행중' | '마감'

// 평가주기 enum → 한글 라벨 (select option 표시 / 상세 표시 공용)
export const SEASON_PERIOD_LABEL: Record<SeasonPeriodEnum, string> = {
  FIRST_HALF: '상반기',
  SECOND_HALF: '하반기',
  ANNUAL: '연간',
}
export const SEASON_PERIOD_OPTIONS: SeasonPeriodEnum[] = ['FIRST_HALF', 'SECOND_HALF', 'ANNUAL']

// 백엔드 enum 이름을 라벨로 변환. 이미 라벨이거나 알 수 없는 값이면 원문 그대로 반환
export function toSeasonPeriodLabel(value: string | null | undefined): string {
  if (!value) return '-'
  return SEASON_PERIOD_LABEL[value as SeasonPeriodEnum] ?? value
}

// 고정 단계 타입 → 라벨 (EVALUATION 은 name 직접 사용)
export const STAGE_TYPE_LABEL: Record<string, string> = {
  GOAL_ENTRY: '목표등록',
  GRADING: '등급 산정 및 보정',
  FINALIZATION: '결과확정',
}

// 단계 표시 라벨 — name 우선, 없으면 type 으로 매핑
export function stageLabel(stage: { name?: string | null; type?: string | null }): string {
  if (stage.name) return stage.name
  if (stage.type && STAGE_TYPE_LABEL[stage.type]) return STAGE_TYPE_LABEL[stage.type]
  return stage.type ?? ''
}

export function toSeasonLabel(s: string): SeasonStatusLabel {
  if (s === 'DRAFT') return '준비중'
  if (s === 'OPEN') return '진행중'
  if (s === 'CLOSED') return '완료'
  // 이미 한글이면 그대로
  return (s as SeasonStatusLabel) ?? '준비중'
}

export function toStageLabel(s: string): StageStatusLabel {
  if (s === 'WAITING') return '대기'
  if (s === 'IN_PROGRESS') return '진행중'
  if (s === 'FINISHED') return '마감'
  return (s as StageStatusLabel) ?? '대기'
}

// ─── DTO 타입 ──────────────────────────────────────
export interface SeasonResponseDto {
  id: number
  name: string
  period: string
  startDate: string
  endDate: string
  status: string // enum name
}

export interface SeasonDropDto {
  id: number
  name: string
}

export interface StageDto {
  id: number
  name: string | null   // EVALUATION 만 값, 고정 단계(GOAL_ENTRY/GRADING/FINALIZATION)는 null
  type: string          // 백엔드 StageType enum 이름
  orderNo: number
  startDate: string
  endDate: string
  status: string
}

export interface EvaluationRulesDto {
  // 상세에서만 사용 — 타입은 any에 가깝게 유지(프론트 기존 UI는 defaultRules 사용)
  [k: string]: unknown
}

export interface SeasonDetailDto {
  id: number
  name: string
  period: string
  startDate: string
  endDate: string
  status: string
  stages: StageDto[]
  rules?: EvaluationRulesDto | null
}

export interface StageInput {
  startDate: string // YYYY-MM-DD
  endDate: string
}

export interface SeasonCreatePayload {
  name: string
  period: string
  startDate: string
  endDate: string
  stages: StageInput[] // 5개 고정 순서
}

export interface SeasonUpdatePayload {
  name: string
  period?: string
  startDate: string
  endDate: string
  // 옵션 — 함께 보내면 백엔드가 시즌+단계를 원자 업데이트 (DRAFT 단계 일정 동시 수정용)
  stages?: { stageId: number; startDate: string; endDate: string }[]
}

// ─── API 호출 ──────────────────────────────────────
const BASE = '/hr-service/eval/seasons'

export async function fetchSeasons(): Promise<SeasonResponseDto[]> {
  const { data } = await api.get<SeasonResponseDto[]>(BASE)
  return data
}

export async function fetchActiveSeasons(): Promise<SeasonDropDto[]> {
  const { data } = await api.get<SeasonDropDto[]>(`${BASE}/active`)
  return data
}

export async function fetchSeasonDetail(seasonId: number): Promise<SeasonDetailDto> {
  const { data } = await api.get<SeasonDetailDto>(`${BASE}/${seasonId}`)
  return data
}

// 현재 진행(OPEN) 시즌 상세 — 단계 게이트용. OPEN 시즌이 없으면 null
export async function fetchCurrentSeason(): Promise<SeasonDetailDto | null> {
  const { data } = await api.get<SeasonDetailDto | null>(`${BASE}/current`)
  return data
}

export async function createSeason(payload: SeasonCreatePayload): Promise<number> {
  const { data } = await api.post<number>(BASE, payload)
  return data
}

export async function updateSeason(seasonId: number, payload: SeasonUpdatePayload): Promise<SeasonResponseDto> {
  const { data } = await api.put<SeasonResponseDto>(`${BASE}/${seasonId}`, payload)
  return data
}

export async function deleteSeason(seasonId: number): Promise<void> {
  await api.delete(`${BASE}/${seasonId}`)
}

// TODO: 지우기 — 스케줄러 수동 실행 (임시/개발용)
export async function runSeasonScheduler(): Promise<void> {
  await api.post(`${BASE}/run-scheduler`)
}

// ─── 단계 API ──────────────────────────────────────
const STAGE_BASE = '/hr-service/eval/stages'

export interface StageDatesPayload {
  startDate?: string // YYYY-MM-DD
  endDate?: string
}

// 임시 개폐 — FINISHED <-> IN_PROGRESS 토글 (진행중 시즌만)
export async function toggleStageStatus(stageId: number): Promise<StageDto> {
  const { data } = await api.patch<StageDto>(`${STAGE_BASE}/${stageId}/toggle-status`)
  return data
}

// 날짜 수정 — 기간 연장(endDate만) / 자유 수정(start+end)
export async function updateStageDates(stageId: number, payload: StageDatesPayload): Promise<StageDto> {
  const { data } = await api.patch<StageDto>(`${STAGE_BASE}/${stageId}`, payload)
  return data
}

// TODO: 지우기 — 단계 스케줄러 수동 실행 (임시/개발용)
export async function runStageScheduler(stageId: number): Promise<void> {
  await api.post(`${STAGE_BASE}/${stageId}/run-scheduler`)
}
