import api from './client'

// 백엔드 enum
export type SeasonStatusEnum = 'DRAFT' | 'OPEN' | 'CLOSED'
export type StageStatusEnum = 'WAITING' | 'IN_PROGRESS' | 'FINISHED'

// 한글 라벨 (프론트 표시용)
export type SeasonStatusLabel = '준비중' | '진행중' | '완료'
export type StageStatusLabel = '대기' | '진행중' | '마감'

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
  name: string
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
