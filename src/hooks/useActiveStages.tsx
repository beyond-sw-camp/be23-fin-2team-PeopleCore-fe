import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  fetchActiveSeasons,
  fetchSeasonDetail,
  STAGE_TYPE_LABEL,
  type StageDto,
} from '../api/season'

// 활성 시즌의 단계 상태 — 사이드바 게이팅·페이지 진입 게이팅 공용.
// EvalLayout 에서 Provider 로 주입해 하위 트리 전체가 한 번만 fetch 함.

export type StageKey = 'GOAL_ENTRY' | 'SELF_EVAL' | 'MANAGER_EVAL' | 'GRADING' | 'FINALIZATION'

// 단계 상태 — 활성 시즌에 해당 단계가 없으면 null
export type StageStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | null

interface ActiveStagesValue {
  loading: boolean
  seasonId: number | null
  seasonName: string | null
  stages: StageDto[]
  // 단계 키 → IN_PROGRESS 인지 (쓰기 액션 게이트용)
  isOpen: (key: StageKey) => boolean
  // 단계 키 → 원본 상태 (StageGate 가 마감 후 read-only 분기에 사용)
  getStatus: (key: StageKey) => StageStatus
  // 현재 진행중 단계의 사람용 라벨 ("자기평가" / "목표등록" / "진행중 단계 없음")
  currentLabel: string
}

const Ctx = createContext<ActiveStagesValue | null>(null)

function matchStage(s: StageDto, key: StageKey): boolean {
  switch (key) {
    case 'GOAL_ENTRY':    return s.type === 'GOAL_ENTRY'
    case 'SELF_EVAL':     return s.type === 'EVALUATION' && s.name === '자기평가'
    case 'MANAGER_EVAL':  return s.type === 'EVALUATION' && s.name === '상위자평가'
    case 'GRADING':       return s.type === 'GRADING'
    case 'FINALIZATION':  return s.type === 'FINALIZATION'
  }
}

export function ActiveStagesProvider({ children }: { children: ReactNode }) {
  const [seasonId, setSeasonId] = useState<number | null>(null)
  const [seasonName, setSeasonName] = useState<string | null>(null)
  const [stages, setStages] = useState<StageDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const actives = await fetchActiveSeasons()
        if (!actives?.length) return
        const detail = await fetchSeasonDetail(actives[0].id)
        if (cancelled) return
        setSeasonId(detail.id)
        setSeasonName(detail.name)
        setStages(detail.stages ?? [])
      } catch {
        // 비로그인/권한 없음 등 — 그냥 빈 상태로 둔다
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const isOpen = (key: StageKey) =>
    stages.some(s => matchStage(s, key) && s.status === 'IN_PROGRESS')

  const getStatus = (key: StageKey): StageStatus => {
    const s = stages.find(st => matchStage(st, key))
    if (!s) return null
    if (s.status === 'WAITING' || s.status === 'IN_PROGRESS' || s.status === 'FINISHED') {
      return s.status
    }
    return null
  }

  const inProgress = stages.find(s => s.status === 'IN_PROGRESS')
  const currentLabel = inProgress
    ? (inProgress.name || STAGE_TYPE_LABEL[inProgress.type] || inProgress.type)
    : '진행중 단계 없음'

  const value: ActiveStagesValue = {
    loading,
    seasonId,
    seasonName,
    stages,
    isOpen,
    getStatus,
    currentLabel,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useActiveStages(): ActiveStagesValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useActiveStages must be used inside <ActiveStagesProvider>')
  return v
}

export const STAGE_KEY_LABEL: Record<StageKey, string> = {
  GOAL_ENTRY:   '목표 등록',
  SELF_EVAL:    '자기평가',
  MANAGER_EVAL: '상위자평가',
  GRADING:      '등급 산정',
  FINALIZATION: '결과 확정',
}
