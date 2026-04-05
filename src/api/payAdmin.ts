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

export type LegalCalcType = 'OVERTIME' | 'NIGHT' | 'HOLIDAY' | 'ANNUAL_LEAVE' | null

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

// ── 급여지급 설정 API ──
export const paySettingsApi = {
  getBanks: () =>
    api.get<BankRes[]>('/pay/superadmin/settings/banks').then(r => r.data),

  getSettings: () =>
    api.get<PaySettingsRes>('/pay/superadmin/settings/payment').then(r => r.data),

  updateSettings: (data: PaySettingsReq) =>
    api.put<PaySettingsRes>('/pay/superadmin/settings/payment', data).then(r => r.data),
}

// ── 지급/공제 항목 API ──
export const payItemsApi = {
  getList: (type: PayItemType, name?: string) =>
    api.get<PayItemRes[]>('/pay/superadmin/payitems', { params: { type, name } }).then(r => r.data),

  create: (data: PayItemReq) =>
    api.post<PayItemRes>('/pay/superadmin/payitems', data).then(r => r.data),

  update: (id: number, data: PayItemReq) =>
    api.put<PayItemRes>(`/pay/superadmin/payitems/${id}`, data).then(r => r.data),

  toggleActive: (id: number) =>
    api.patch<PayItemRes>(`/pay/superadmin/payitems/${id}`).then(r => r.data),

  deleteItems: (ids: number[]) =>
    api.delete('/pay/superadmin/payitems', { data: ids }),
}
