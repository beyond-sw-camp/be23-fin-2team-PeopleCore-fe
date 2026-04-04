import api from './client'

// ── 부서 (Department) ─────────────────────────────────
export interface DepartmentTreeResponse {
  id: number
  parentDeptId: number | null
  deptName: string
  deptCode: string
  memberCount: number
  children: DepartmentTreeResponse[]
}

export interface DepartmentCreateRequest {
  parentDeptId: number | null
  deptName: string
  deptCode: string
}

export interface DepartmentUpdateRequest {
  parentDeptId?: number | null
  deptName?: string
  deptCode?: string
}

export const departmentApi = {
  getTree() {
    return api.get<DepartmentTreeResponse[]>('/hr-service/departments/tree')
  },
  getList() {
    return api.get<DepartmentTreeResponse[]>('/hr-service/departments')
  },
  getById(deptId: number) {
    return api.get<DepartmentTreeResponse>(`/hr-service/departments/${deptId}`)
  },
  create(data: DepartmentCreateRequest) {
    return api.post('/hr-service/departments', data)
  },
  update(deptId: number, data: DepartmentUpdateRequest) {
    return api.put(`/hr-service/departments/${deptId}`, data)
  },
  delete(deptId: number) {
    return api.delete(`/hr-service/departments/${deptId}`)
  },
}

// ── 사원 (Employee) ───────────────────────────────────
export interface EmployeeListItem {
  empNum: string
  empName: string
  deptName: string
  gradeName: string
  titleName: string
  empType: string
  empHireDate: string
  empStatus: string
}

export interface EmployeeListParams {
  keyword?: string
  deptId?: number
  empType?: string
  empStatus?: string
  page?: number
  size?: number
  sort?: string
}

export interface EmployeeKardResponse {
  totalCount: number
  activeCount: number
  leaveCount: number
  hiredThisMonth: number
}

export const employeeApi = {
  getList(params?: EmployeeListParams) {
    return api.get<{ content: EmployeeListItem[]; totalElements: number }>('/hr-service/employee', { params })
  },
  getKard() {
    return api.get<EmployeeKardResponse>('/hr-service/employee/kard')
  },
}

// ── 직급 (Grade) ──────────────────────────────────────
export interface GradeResponse {
  gradeId: number
  gradeName: string
  gradeCode: string
  gradeOrder: number
}

export interface GradeRequest {
  gradeName: string
  gradeCode: string
  gradeOrder?: number
}

export const gradeApi = {
  getList() {
    return api.get<GradeResponse[]>('/hr-service/grades')
  },
  create(data: GradeRequest) {
    return api.post('/hr-service/grades', data)
  },
  update(gradeId: number, data: Partial<GradeRequest>) {
    return api.patch(`/hr-service/grades/${gradeId}`, data)
  },
  delete(gradeId: number) {
    return api.delete(`/hr-service/grades/${gradeId}`)
  },
  updateOrder(orders: { gradeId: number; gradeOrder: number }[]) {
    return api.patch('/hr-service/grades/order', orders)
  },
}

// ── 직위 (Title) ──────────────────────────────────────
export interface TitleResponse {
  titleId: number
  titleName: string
  titleCode: string
}

export interface TitleRequest {
  titleName: string
  titleCode: string
}

export const titleApi = {
  getList() {
    return api.get<TitleResponse[]>('/hr-service/titles')
  },
  create(data: TitleRequest) {
    return api.post('/hr-service/titles', data)
  },
  update(titleId: number, data: Partial<TitleRequest>) {
    return api.patch(`/hr-service/titles/${titleId}`, data)
  },
  delete(titleId: number) {
    return api.delete(`/hr-service/titles/${titleId}`)
  },
}
