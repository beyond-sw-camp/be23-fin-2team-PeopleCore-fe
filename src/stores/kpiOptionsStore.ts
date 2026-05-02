import { useSyncExternalStore } from 'react'

export interface CodeOption {
  code: string
  label: string
}

export type DepartmentLevel = number | 'leaf'

export interface KpiOptionsState {
  categories: string[]                  // 단순 문자열 배열
  departments: CodeOption[]             // 조직도에서 선택된 depth의 부서들 (code=deptId, label=deptName)
  departmentLevel: DepartmentLevel      // 조직도 depth 선택값 (1=최상위, 'leaf'=최하위 리프)
  directions: CodeOption[]              // UP/DOWN/MAINTAIN + 증가형/감소형/유지형
  units: CodeOption[]                   // PERCENT/COUNT/WON/HOUR/SCORE/DAY + %/건/원/...
}

const DEFAULT: KpiOptionsState = {
  categories: ['업무성과', '역량개발', '조직기여'],
  departments: [],
  departmentLevel: 'leaf',
  directions: [
    { code: 'UP', label: '증가형' },
    { code: 'DOWN', label: '감소형' },
    { code: 'MAINTAIN', label: '유지형' },
  ],
  units: [
    { code: 'PERCENT', label: '%' },
    { code: 'COUNT', label: '건' },
    { code: 'WON', label: '원' },
    { code: 'HOUR', label: '시간' },
    { code: 'SCORE', label: '점' },
    { code: 'DAY', label: '일' },
  ],
}

const KEY = 'kpi-options-v1'
const listeners = new Set<() => void>()

function load(): KpiOptionsState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT
    const parsed = JSON.parse(raw)
    return { ...DEFAULT, ...parsed }
  } catch { return DEFAULT }
}

let state: KpiOptionsState = load()

export function getKpiOptions(): KpiOptionsState {
  return state
}

export function setKpiOptions(next: KpiOptionsState) {
  state = next
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
  listeners.forEach(l => l())
}

export function resetKpiOptions() {
  setKpiOptions(DEFAULT)
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

export function useKpiOptions(): KpiOptionsState {
  return useSyncExternalStore(subscribe, getKpiOptions, getKpiOptions)
}
