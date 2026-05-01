import { apiFetch, apiFetchMultipart } from './http'

export type SalaryContractSortField = 'EMP_NUM' | 'EMP_NAME' | 'CONTRACT_START'
export type SalaryFormType = 'SALARY_CONTRACT'

export interface FormFieldSetupResponse {
  id: number
  formType: string
  fieldKey: string
  label: string
  section: string
  fieldType: 'TEXT' | 'DATE' | 'SELECT' | 'NUMBER' | 'TEXTAREA' | 'RADIO' | 'FILE' | 'AUTO' | 'SEARCH'
  visible: boolean
  required: boolean
  sortOrder: number
  options?: string[] | null
  autoFillFrom?: string | null
  locked?: boolean
  isFixed?: boolean | null
}

export interface SalaryContractListResDto {
  id: number
  empNum: string
  empName: string
  department: string
  rank: string
  position: string
  employmentType: 'FULL' | 'CONTRACT'
  contractStart: string
}

export interface SalaryContractFieldDetail {
  fieldKey: string
  label: string
  section: string
  fieldType: string
  value: string
}

export interface SalaryContractDetailResDto {
  id: number
  empId: number
  empNum: string
  empName: string
  fields: SalaryContractFieldDetail[]
  fileName: string | null
  originalFileName: string | null
  registeredDate: string | null
}

export interface SalaryContractHistoryResDto {
  id: number
  empNum: string
  empName: string
  department: string
  rank: string
  annualSalary: number | null
  contractStart: string | null
  contractEnd: string | null
  salaryDiff: number | null
  salaryDiffRate: number | null
}

export interface SalaryContractCreateReq {
  empId: number
  fields: { fieldKey: string; value: string }[]
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface SalaryContractListParams {
  search?: string
  sortField?: SalaryContractSortField
  sortDirection?: 'ASC' | 'DESC'
  page?: number
  size?: number
}

export async function fetchFormSetup(formType: SalaryFormType = 'SALARY_CONTRACT'): Promise<FormFieldSetupResponse[]> {
  const res = await apiFetch(`/hr-service/form-setup/${formType}`)
  return res.json()
}

export async function fetchSalaryContractList(params: SalaryContractListParams): Promise<Page<SalaryContractListResDto>> {
  const q = new URLSearchParams()
  if (params.search) q.set('search', params.search)
  if (params.sortField) q.set('sortField', params.sortField)
  if (params.sortDirection) q.set('sortDirection', params.sortDirection)
  if (params.page !== undefined) q.set('page', String(params.page))
  if (params.size !== undefined) q.set('size', String(params.size))
  const res = await apiFetch(`/hr-service/salary-contract?${q.toString()}`)
  return res.json()
}

export async function fetchSalaryContractDetail(id: number): Promise<SalaryContractDetailResDto> {
  const res = await apiFetch(`/hr-service/salary-contract/${id}`)
  return res.json()
}

export async function fetchSalaryContractHistory(empId: number): Promise<SalaryContractHistoryResDto[]> {
  const res = await apiFetch(`/hr-service/salary-contract/history/${empId}`)
  return res.json()
}

export async function createSalaryContract(
  req: SalaryContractCreateReq,
  file?: File | null,
): Promise<SalaryContractDetailResDto> {
  const form = new FormData()
  form.append('data', new Blob([JSON.stringify(req)], { type: 'application/json' }))
  if (file) form.append('attachment', file)
  const res = await apiFetchMultipart('/hr-service/salary-contract', form)
  return res.json()
}

export async function deleteSalaryContract(id: number): Promise<void> {
  await apiFetch(`/hr-service/salary-contract/${id}`, { method: 'DELETE' })
}

export async function downloadSalaryContractFile(id: number, filename: string): Promise<void> {
  const res = await apiFetch(`/hr-service/salary-contract/${id}/file`)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
