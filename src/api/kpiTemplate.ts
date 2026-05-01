import api from './client'

export type KpiDirection = 'UP' | 'DOWN' | 'MAINTAIN'

export interface KpiTemplateResponse {
  kpiId: number
  deptId: number
  deptName: string
  gradeId: number | null         // null = 해당 부서 전 직급 공통
  gradeName: string | null       // null = "전 직급"
  categoryOptionId: number
  categoryLabel: string          // 예: "업무성과"
  unitOptionId: number
  unitLabel: string              // 예: "건", "%", "점"
  name: string
  description: string
  baseline: number | null        // 사내 평균 (집계 전이면 null)
  direction: KpiDirection
}

export interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface KpiTemplateListParams {
  deptId?: number
  gradeId?: number
  category?: string
  keyword?: string
  page?: number
  size?: number
}

const base = '/hr-service/eval/kpi-templates'

// KPI 템플릿 목록 (필터 + 페이징)
export async function fetchKpiTemplates(params: KpiTemplateListParams = {}): Promise<SpringPage<KpiTemplateResponse>> {
  const { data } = await api.get<SpringPage<KpiTemplateResponse>>(base, { params })
  return data
}

// 목표 등록 폼에서 드롭다운 채우기용 — size 크게 잡아 한 방에 모두
export async function fetchAllKpiTemplates(params: Omit<KpiTemplateListParams, 'page' | 'size'> = {}): Promise<KpiTemplateResponse[]> {
  const p = await fetchKpiTemplates({ ...params, page: 0, size: 1000 })
  return p.content
}

// 등록/수정 요청 바디 (gradeId null = 해당 부서 전 직급 공통)
export interface KpiTemplateRequest {
  deptId: number
  gradeId: number | null
  categoryOptionId: number
  unitOptionId: number
  name: string
  description: string
  direction: KpiDirection
}

export async function createKpiTemplate(payload: KpiTemplateRequest): Promise<KpiTemplateResponse> {
  const { data } = await api.post<KpiTemplateResponse>(base, payload)
  return data
}

export async function updateKpiTemplate(id: number, payload: KpiTemplateRequest): Promise<KpiTemplateResponse> {
  const { data } = await api.put<KpiTemplateResponse>(`${base}/${id}`, payload)
  return data
}

export async function deleteKpiTemplate(id: number): Promise<void> {
  await api.delete(`${base}/${id}`)
}
