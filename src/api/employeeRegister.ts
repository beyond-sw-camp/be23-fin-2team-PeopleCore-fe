import api from './client'

// ── 신규 사원 등록 요청 ──
export interface EmployeeRegisterReq {
  empName: string
  empNameEn?: string
  birthDate: string
  gender: 'MALE' | 'FEMALE'
  phone: string
  personalEmail: string
  zipCode?: string
  address?: string
  addressDetail?: string
  hireDate: string
  empType: 'FULL' | 'CONTRACT' | 'PARTTIME'
  contractEndDate?: string
  deptId: number
  gradeId: number
  titleId: number
  companyEmail: string
  pwMethod: 'AUTO' | 'MANUAL'
  password?: string
  mailQuota?: number
  authTemplateId?: number
}

// ── 등록 응답 ──
export interface EmployeeRegisterRes {
  empId: number
  empNum: string
  companyEmail: string
  createdAt: string
}

// ── 사번 자동 생성 응답 ──
export interface EmpNumGenerateRes {
  empNum: string
}

// ── 신규 사원 등록 API ──
export const employeeRegisterApi = {
  generateEmpNum() {
    return api.post<EmpNumGenerateRes>('/hr-service/employee/generate-empnum')
  },

  register(data: EmployeeRegisterReq) {
    return api.post<EmployeeRegisterRes>('/hr-service/employee', data)
  },

  saveDraft(data: Partial<EmployeeRegisterReq>) {
    return api.post('/hr-service/employee/draft', data)
  },

  getDraft() {
    return api.get<Partial<EmployeeRegisterReq>>('/hr-service/employee/draft')
  },
}
