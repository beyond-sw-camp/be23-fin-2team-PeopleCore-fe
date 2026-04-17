import api from './client'

export type EmpRole = 'HR_SUPER_ADMIN' | 'HR_ADMIN' | 'EMPLOYEE'

export interface AdminUserResDto {
  empId: number
  empName: string
  empNum: string
  deptName: string | null
  gradeName: string | null
  empRole: EmpRole
  empEmail: string
  grantedAt: string | null
}

export interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export interface AdminListParams {
  keyword?: string
  deptId?: number
  empRole?: EmpRole
  sortField?: 'empName' | 'empNum' | 'role' | 'dept'
  page?: number
  size?: number
}

export async function fetchAdminList(params: AdminListParams = {}): Promise<SpringPage<AdminUserResDto>> {
  const { data } = await api.get<SpringPage<AdminUserResDto>>('/hr-service/permissions/admins', { params })
  return data
}

export async function grantSuperAdmin(empId: number): Promise<void> {
  await api.put(`/hr-service/permissions/admins/${empId}/grant`)
}

export async function revokeSuperAdmin(empId: number): Promise<void> {
  await api.put(`/hr-service/permissions/admins/${empId}/revoke`)
}

export interface PermissionHistoryResDto {
  permissionId: number
  empId: number
  empName: string
  empNum: string
  requestedRole: EmpRole
  currentRole: EmpRole
  status: 'GRANTED' | 'REVOKED'
  actorName: string | null
  processedAt: string
}

export async function fetchPermissionHistory(): Promise<PermissionHistoryResDto[]> {
  const { data } = await api.get<PermissionHistoryResDto[]>('/hr-service/permissions/history')
  return data
}
