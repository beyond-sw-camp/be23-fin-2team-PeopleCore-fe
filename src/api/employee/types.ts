export type EmpType = 'FULL' | 'CONTRACT' | 'DISPATCHED'
export type EmpStatus = 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED'
export type EmployeeSortField = 'EMP_NUM' | 'EMP_NAME'

export interface EmployeeListDto {
  empNum: string
  empName: string
  deptName: string
  gradeName: string
  titleName: string
  empType: EmpType
  empHireDate: string
  empStatus: EmpStatus
}

export interface EmployeeKardDto {
  total: number
  active: number
  onLeave: number
  hiredThisMonth: number
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface DepartmentDto {
  id: number
  deptName: string
  deptCode: string
}

export interface EmployeeListParams {
  keyword?: string
  deptId?: number
  empType?: EmpType
  empStatus?: EmpStatus
  sortField?: EmployeeSortField
  page?: number
  size?: number
}

export const EMP_TYPE_LABEL: Record<EmpType, string> = {
  FULL: '정규직',
  CONTRACT: '계약직',
  DISPATCHED: '파견직',
}

export const EMP_STATUS_LABEL: Record<EmpStatus, string> = {
  ACTIVE: '재직',
  ON_LEAVE: '휴직',
  RESIGNED: '퇴직',
}
