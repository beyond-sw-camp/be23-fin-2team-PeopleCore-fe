import { useSyncExternalStore } from 'react'

export type StageStatus = '대기' | '진행중' | '마감'

export interface StageEvent {
  id: string
  name: string        // 예: 안내 발송, 입력 마감 알림
  date: string        // YYYY-MM-DD
}

export interface Stage {
  id: string
  name: string
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

const DEFAULT_SEASONS: Season[] = [
  {
    id: 1, name: '2024년 상반기 정기평가', period: '상반기',
    startDate: '2024-06-01', endDate: '2024-06-30', status: '진행중',
    stages: [
      { id: sid(), name: '목표등록', startDate: '2024-06-01', endDate: '2024-06-07', status: '마감' },
      { id: sid(), name: '자기평가', startDate: '2024-06-08', endDate: '2024-06-14', status: '진행중' },
      { id: sid(), name: '상위자평가', startDate: '2024-06-15', endDate: '2024-06-21', status: '대기' },
      { id: sid(), name: '등급 산정 및 보정', startDate: '2024-06-22', endDate: '2024-06-28', status: '대기' },
      { id: sid(), name: '결과 확정', startDate: '2024-06-29', endDate: '2024-06-30', status: '대기' },
    ],
  },
  {
    id: 2, name: '2023년 하반기 정기평가', period: '하반기',
    startDate: '2023-12-01', endDate: '2023-12-31', status: '완료',
    stages: [
      { id: sid(), name: '목표등록', startDate: '2023-12-01', endDate: '2023-12-07', status: '마감' },
      { id: sid(), name: '자기평가', startDate: '2023-12-08', endDate: '2023-12-14', status: '마감' },
      { id: sid(), name: '상위자평가', startDate: '2023-12-15', endDate: '2023-12-21', status: '마감' },
      { id: sid(), name: '등급 산정 및 보정', startDate: '2023-12-22', endDate: '2023-12-28', status: '마감' },
      { id: sid(), name: '결과 확정', startDate: '2023-12-29', endDate: '2023-12-31', status: '마감' },
    ],
  },
  {
    id: 3, name: '2024년 하반기 정기평가', period: '하반기',
    startDate: '2024-12-01', endDate: '2024-12-31', status: '준비중',
    stages: [
      { id: sid(), name: '목표등록', startDate: '', endDate: '', status: '대기' },
      { id: sid(), name: '자기평가', startDate: '', endDate: '', status: '대기' },
      { id: sid(), name: '상위자평가', startDate: '', endDate: '', status: '대기' },
      { id: sid(), name: '등급 산정 및 보정', startDate: '', endDate: '', status: '대기' },
      { id: sid(), name: '결과 확정', startDate: '', endDate: '', status: '대기' },
    ],
  },
]

export function defaultStages(): Stage[] {
  return [
    { id: sid(), name: '목표등록', startDate: '', endDate: '', status: '대기' },
    { id: sid(), name: '자기평가', startDate: '', endDate: '', status: '대기' },
    { id: sid(), name: '상위자평가', startDate: '', endDate: '', status: '대기' },
    { id: sid(), name: '등급 산정 및 보정', startDate: '', endDate: '', status: '대기' },
    { id: sid(), name: '결과 확정', startDate: '', endDate: '', status: '대기' },
  ]
}

export function newStage(name = '새 단계'): Stage {
  return { id: sid(), name, startDate: '', endDate: '', status: '대기', events: [] }
}

export function newStageEvent(): StageEvent {
  return { id: sid(), name: '', date: '' }
}

const KEY = 'seasons-v1'
const listeners = new Set<() => void>()

function load(): Season[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_SEASONS
    return JSON.parse(raw) as Season[]
  } catch {
    return DEFAULT_SEASONS
  }
}

let state: Season[] = load()

export function getSeasons(): Season[] {
  return state
}

export function setSeasons(next: Season[]) {
  state = next
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
  listeners.forEach(l => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

export function useSeasons(): Season[] {
  return useSyncExternalStore(subscribe, getSeasons, getSeasons)
}

// 진행/설정 화면용: 마감(완료)되지 않은 시즌만 — 준비중 / 진행중
export function useActiveSeasons(): Season[] {
  const all = useSeasons()
  return all.filter(s => s.status !== '완료')
}
