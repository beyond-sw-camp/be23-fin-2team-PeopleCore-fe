import { useEffect, useSyncExternalStore } from 'react'
import {
  fetchSeasons,
  fetchSeasonDetail,
  createSeason as apiCreateSeason,
  updateSeason as apiUpdateSeason,
  deleteSeason as apiDeleteSeason,
  toggleStageStatus as apiToggleStageStatus,
  updateStageDates as apiUpdateStageDates,
  toSeasonLabel,
  toStageLabel,
  type SeasonCreatePayload,
  type SeasonUpdatePayload,
  type SeasonResponseDto,
  type SeasonDetailDto,
  type StageDto,
  type StageDatesPayload,
} from '../api/season'

export type StageStatus = '대기' | '진행중' | '마감'

export interface StageEvent {
  id: string
  name: string
  date: string
}

export interface Stage {
  id: string         // 문자열 ID (백엔드 Long → string 변환)
  name: string | null   // EVALUATION 만 값, 고정 단계는 null (type 기반 매핑)
  type?: string | null  // 백엔드 StageType (GOAL_ENTRY/EVALUATION/GRADING/FINALIZATION)
  startDate: string
  endDate: string
  status: StageStatus
  events?: StageEvent[]
}

export interface Season {
  id: number
  name: string
  period: string
  startDate: string
  endDate: string
  status: '준비중' | '진행중' | '완료'
  stages: Stage[]
}

const sid = () => Math.random().toString(36).slice(2, 10)

// 빈 단계 5개 — 신규 시즌 폼용 (백엔드 단계명 고정)
const FIXED_STAGE_NAMES = ['목표등록', '자기평가', '상위자평가', '등급 산정 및 보정', '결과확정']

export function defaultStages(): Stage[] {
  return FIXED_STAGE_NAMES.map(name => ({
    id: sid(), name, startDate: '', endDate: '', status: '대기',
  }))
}

export function newStage(name = '새 단계'): Stage {
  return { id: sid(), name, startDate: '', endDate: '', status: '대기', events: [] }
}

export function newStageEvent(): StageEvent {
  return { id: sid(), name: '', date: '' }
}

// ─── 상태 관리 ─────────────────────────────────────
let state: Season[] = []
let loaded = false
let loading = false
const listeners = new Set<() => void>()

function emit() { listeners.forEach(l => l()) }

function mapSummary(dto: SeasonResponseDto): Season {
  return {
    id: dto.id,
    name: dto.name,
    period: dto.period,
    startDate: dto.startDate,
    endDate: dto.endDate,
    status: toSeasonLabel(dto.status),
    stages: [], // summary 조회에는 stage 없음 → 상세에서 보충
  }
}

function mapStage(dto: StageDto): Stage {
  return {
    id: String(dto.id),
    name: dto.name,
    type: dto.type,
    startDate: dto.startDate ?? '',
    endDate: dto.endDate ?? '',
    status: toStageLabel(dto.status),
  }
}

function mapDetail(dto: SeasonDetailDto): Season {
  return {
    id: dto.id,
    name: dto.name,
    period: dto.period,
    startDate: dto.startDate,
    endDate: dto.endDate,
    status: toSeasonLabel(dto.status),
    stages: (dto.stages ?? []).sort((a, b) => a.orderNo - b.orderNo).map(mapStage),
  }
}

export function getSeasons(): Season[] { return state }

// 로컬 상태 덮어쓰기 (API와 동기화 없이 UI 단에서만 변경할 때)
export function setSeasons(next: Season[]) {
  state = next
  emit()
}

export async function refreshSeasons(): Promise<void> {
  loading = true
  try {
    const list = await fetchSeasons()
    state = list.map(mapSummary)
    loaded = true
    emit()
  } finally {
    loading = false
  }
}

export async function loadSeasonDetail(seasonId: number): Promise<Season> {
  const dto = await fetchSeasonDetail(seasonId)
  const season = mapDetail(dto)
  const idx = state.findIndex(s => s.id === seasonId)
  if (idx >= 0) {
    state = [...state.slice(0, idx), season, ...state.slice(idx + 1)]
  } else {
    state = [...state, season]
  }
  emit()
  return season
}

export async function createSeasonAction(payload: SeasonCreatePayload): Promise<number> {
  const id = await apiCreateSeason(payload)
  await refreshSeasons()
  return id
}

export async function updateSeasonAction(seasonId: number, payload: SeasonUpdatePayload): Promise<void> {
  await apiUpdateSeason(seasonId, payload)
  await refreshSeasons()
}

export async function deleteSeasonAction(seasonId: number): Promise<void> {
  await apiDeleteSeason(seasonId)
  state = state.filter(s => s.id !== seasonId)
  emit()
}

// 단계 상태 토글 (임시 개폐) — 응답받은 단계로 로컬 상태 갱신
export async function toggleStageStatusAction(seasonId: number, stageId: number): Promise<void> {
  const updated = await apiToggleStageStatus(stageId)
  state = state.map(s => {
    if (s.id !== seasonId) return s
    return {
      ...s,
      stages: s.stages.map(st => st.id === String(updated.id) ? mapStage(updated) : st),
    }
  })
  emit()
}

// 단계 날짜 수정 — 기간추가/자유수정 공용
export async function updateStageDatesAction(
  seasonId: number,
  stageId: number,
  payload: StageDatesPayload,
): Promise<void> {
  const updated = await apiUpdateStageDates(stageId, payload)
  state = state.map(s => {
    if (s.id !== seasonId) return s
    return {
      ...s,
      stages: s.stages.map(st => st.id === String(updated.id) ? mapStage(updated) : st),
    }
  })
  emit()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  // 첫 구독 시 자동 로드
  if (!loaded && !loading) {
    refreshSeasons().catch(() => { /* 네트워크 오류는 각 호출부에서 처리 */ })
  }
  return () => { listeners.delete(cb) }
}

export function useSeasons(): Season[] {
  return useSyncExternalStore(subscribe, getSeasons, getSeasons)
}

// 상세가 비어있는 시즌은 마운트 시 상세 로드
export function useSeasonWithDetail(seasonId: number | null): Season | null {
  const seasons = useSeasons()
  const found = seasons.find(s => s.id === seasonId) ?? null
  useEffect(() => {
    if (seasonId && found && found.stages.length === 0) {
      loadSeasonDetail(seasonId).catch(() => {})
    }
  }, [seasonId, found])
  return found
}

// 진행/설정 화면용: 완료 제외
export function useActiveSeasons(): Season[] {
  return useSeasons().filter(s => s.status !== '완료')
}

// 평가 규칙 편집용: 준비중만
export function useDraftSeasons(): Season[] {
  return useSeasons().filter(s => s.status === '준비중')
}
