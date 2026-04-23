import api from './client'

// KpiOption 번들 (카테고리 / 단위 라벨 + 부서 depth)
//   - id null → 신규(insert), id 있음 → 기존 row (rename/재정렬 diff)
//   - departmentLevel: "1".."N" 또는 "leaf"

export interface KpiOptionItem {
  id: number | null
  label: string
}

export interface KpiOptionBundle {
  categories: KpiOptionItem[]
  units: KpiOptionItem[]
  departmentLevel: string
}

const base = '/hr-service/eval/kpi-option'

export async function fetchKpiOptionBundle(): Promise<KpiOptionBundle> {
  const { data } = await api.get<KpiOptionBundle>(base)
  return data
}

export async function saveKpiOptionBundle(req: KpiOptionBundle): Promise<KpiOptionBundle> {
  const { data } = await api.put<KpiOptionBundle>(base, req)
  return data
}

export async function resetKpiOptionBundle(): Promise<KpiOptionBundle> {
  const { data } = await api.post<KpiOptionBundle>(`${base}/reset`)
  return data
}
