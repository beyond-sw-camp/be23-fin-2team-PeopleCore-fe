import { apiFetch } from '../http'
import type {
  EmployeeListDto,
  EmployeeKardDto,
  PageResponse,
  EmployeeListParams,
  DepartmentDto,
} from './types'

export async function fetchEmployeeList(params: EmployeeListParams): Promise<PageResponse<EmployeeListDto>> {
  const query = new URLSearchParams()
  if (params.keyword)               query.set('keyword', params.keyword)
  if (params.deptId !== undefined)  query.set('deptId', String(params.deptId))
  if (params.empType)               query.set('empType', params.empType)
  if (params.empStatus)             query.set('empStatus', params.empStatus)
  if (params.sortField)             query.set('sortField', params.sortField)
  if (params.page !== undefined)    query.set('page', String(params.page))
  if (params.size !== undefined)    query.set('size', String(params.size))

  const res = await apiFetch(`/hr-service/employee?${query.toString()}`)
  return res.json()
}

export async function fetchEmployeeKard(): Promise<EmployeeKardDto> {
  const res = await apiFetch('/hr-service/employee/kard')
  return res.json()
}

export async function fetchDepartmentList(): Promise<DepartmentDto[]> {
  const res = await apiFetch('/hr-service/departments')
  return res.json()
}
