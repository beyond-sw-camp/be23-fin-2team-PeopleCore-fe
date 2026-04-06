import api from './client'

// ── 타입 ──
export interface BankRes {
  bankCode: string
  bankName: string
}

export interface PaySettingsReq {
  salaryPayMonth: 'CURRENT' | 'NEXT'
  salaryPayDay: number | null
  salaryPayLastDay: boolean
  mainBankCode: string
}

export interface PaySettingsRes {
  companyPaySettingsId: number
  salaryPayDay: number | null
  salaryPayLastDay: boolean
  salaryPayMonth: 'CURRENT' | 'NEXT'
  salaryPayMonthLabel: string
  mainBankCode: string
  mainBankName: string
  updatedAt: string
}

export type PayItemType = 'PAYMENT' | 'DEDUCTION'
export type PayItemCategory = 'SALARY' | 'ALLOWANCE' | 'BONUS' | 'INSURANCE' | 'TAX' | 'OTHER_DEDUCTION'

export interface PayItemReq {
  payItemName: string
  payItemType: PayItemType
  isFixed?: boolean
  isTaxable?: boolean
  taxExemptLimit?: number
  payItemCategory?: PayItemCategory
  sortOrder?: number
}

export type LegalCalcType = 'OVERTIME' | 'NIGHT' | 'HOLIDAY' | 'LEAVE' | null

export interface PayItemRes {
  payItemId: number
  payItemName: string
  payItemType: PayItemType
  isFixed: boolean
  isTaxable: boolean
  taxExemptLimit: number
  payItemCategory: PayItemCategory
  sortOrder: number
  isActive: boolean
  isLegal: boolean
  legalCalcType: LegalCalcType
}

// ── 보험요율 타입 ──
export interface InsuranceRatesRes {
  insuranceRatesId: number
  year: number
  nationalPension: number
  healthInsurance: number
  longTermCare: number
  employInsurance: number
  employInsuranceEmployer: number
  pensionUpperLimit: number
  pensionLowerLimit: number
  validFrom: string
  validTo: string
  updatedAt: string
}

export interface InsuranceJobTypesReq {
  name: string
  description?: string
  industrialAccidentRate: number
}

export interface InsuranceJobTypesRes {
  jobTypesId: number
  name: string
  description: string
  industrialAccidentRate: number
  isActive: boolean
}

// ── 보험요율 API ──
export const insuranceApi = {
  getRates: (year?: number) =>
    year
      ? api.get<InsuranceRatesRes>(`/hr-service/pay/superadmin/insurance/rates/${year}`).then(r => r.data)
      : api.get<InsuranceRatesRes>('/hr-service/pay/superadmin/insurance/rates').then(r => r.data),

  updateEmployerRate: (employmentInsuranceEmployer: number) =>
    api.put('/hr-service/pay/superadmin/insurance/rates/employer', { employmentInsuranceEmployer }).then(r => r.data),

  getJobTypes: () =>
    api.get<InsuranceJobTypesRes[]>('/hr-service/pay/superadmin/insurance/jobtypes').then(r => r.data),

  createJobType: (data: InsuranceJobTypesReq) =>
    api.post<InsuranceJobTypesRes>('/hr-service/pay/superadmin/insurance/jobtypes', data).then(r => r.data),

  updateJobType: (id: number, data: InsuranceJobTypesReq) =>
    api.put<InsuranceJobTypesRes>(`/hr-service/pay/superadmin/insurance/jobtypes/${id}`, data).then(r => r.data),

  toggleJobType: (id: number) =>
    api.patch<InsuranceJobTypesRes>(`/hr-service/pay/superadmin/insurance/jobtypes/${id}`).then(r => r.data),

  deleteJobType: (id: number) =>
    api.delete(`/hr-service/pay/superadmin/insurance/jobtypes/${id}`),
}

// ── 퇴직연금 설정 타입 ──
export type PensionType = 'severance' | 'DB' | 'DC' | 'DB_DC'

export interface RetirementSettingsReq {
  pensionType: PensionType
  pensionProvider?: string
  pensionAccount?: string
}

export interface RetirementSettingsRes {
  retirementSettingsId: number
  pensionType: PensionType
  pensionProvider: string | null
  pensionAccount: string | null
}

// ── 퇴직연금 설정 API ──
export const retirementApi = {
  getSettings: () =>
    api.get<RetirementSettingsRes>('/hr-service/pay/superadmin/retirement').then(r => r.data),

  saveSettings: (data: RetirementSettingsReq) =>
    api.put<RetirementSettingsRes>('/hr-service/pay/superadmin/retirement', data).then(r => r.data),
}

// ── 급여지급 설정 API ──
export const paySettingsApi = {
  getBanks: () =>
    api.get<BankRes[]>('/hr-service/pay/superadmin/settings/banks').then(r => r.data),

  getSettings: () =>
    api.get<PaySettingsRes>('/hr-service/pay/superadmin/settings/payment').then(r => r.data),

  updateSettings: (data: PaySettingsReq) =>
    api.put<PaySettingsRes>('/hr-service/pay/superadmin/settings/payment', data).then(r => r.data),
}

// ── 지급/공제 항목 API ──
export const payItemsApi = {
  getList: (type: PayItemType, name?: string, isLegal?: boolean) =>
    api.get<PayItemRes[]>('/hr-service/pay/superadmin/payitems', { params: { type, name, isLegal } }).then(r => r.data),

  create: (data: PayItemReq) =>
    api.post<PayItemRes>('/hr-service/pay/superadmin/payitems', data).then(r => r.data),

  update: (id: number, data: PayItemReq) =>
    api.put<PayItemRes>(`/hr-service/pay/superadmin/payitems/${id}`, data).then(r => r.data),

  toggleActive: (id: number) =>
    api.patch<PayItemRes>(`/hr-service/pay/superadmin/payitems/${id}`).then(r => r.data),

  deleteItems: (ids: number[]) =>
    api.delete('/hr-service/pay/superadmin/payitems', { data: ids }),
}
