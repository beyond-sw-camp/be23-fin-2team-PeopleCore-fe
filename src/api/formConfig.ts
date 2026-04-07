import api from './client'

// ── 타입 ──
export type FormType = 'EMPLOYEE_REGISTER' | 'SALARY_CONTRACT' | 'HR_ORDER' | 'RESIGN_REGISTER'
export type FieldType = 'TEXT' | 'DATE' | 'SELECT' | 'NUMBER' | 'TEXTAREA' | 'RADIO' | 'FILE' | 'AUTO' | 'SEARCH'

export interface FormFieldSetupRes {
  id: number
  formType: FormType
  fieldKey: string
  label: string
  section: string
  fieldType: FieldType
  visible: boolean
  required: boolean
  sortOrder: number
  options: string[] | null
  autoFillFrom: string | null
  locked: boolean | null
}

export interface FormFieldSetupReq {
  fieldKey: string
  label: string
  section: string
  fieldType: FieldType
  visible: boolean
  required: boolean
  sortOrder: number
  options?: string[]
  autoFillFrom?: string
}

// ── 폼 설정 API ──
export const formSetupApi = {
  // 폼 구성 조회
  getSetup(formType: FormType) {
    return api.get<FormFieldSetupRes[]>(`/hr-service/form-setup/${formType}`)
  },

  // 폼 구성 일괄 저장 (관리자)
  saveSetup(formType: FormType, fields: FormFieldSetupReq[]) {
    return api.put(`/hr-service/form-setup/${formType}`, fields)
  },

  // 기본값으로 초기화 (관리자)
  resetSetup(formType: FormType) {
    return api.post(`/hr-service/form-setup/${formType}/reset`)
  },
}
