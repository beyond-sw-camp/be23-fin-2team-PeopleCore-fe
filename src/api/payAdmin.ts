import api from './client'

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

export interface PayItemReq {
  payItemName: string
  payItemType: PayItemType
  isFixed?: boolean
  isTaxable?: boolean
  taxExemptLimit?: number
  payItemCategory?: string
  sortOrder?: number
}

export interface PayItemRes {
  payItemId: number
  payItemName: string
  payItemType: PayItemType
  isFixed: boolean
  isTaxable: boolean
  taxExemptLimit: number
  payItemCategory: string
  sortOrder: number
  isActive: boolean
  isLegal: boolean
}

export const paySettingsApi = {
  getBanks: () => api.get<BankRes[]>('/pay/superadmin/settings/banks').then(r => r.data),
  getSettings: () => api.get<PaySettingsRes>('/pay/superadmin/settings/payment').then(r => r.data),
  updateSettings: (data: PaySettingsReq) => api.put<PaySettingsRes>('/pay/superadmin/settings/payment', data).then(r => r.data),
}

export const payItemsApi = {
  getList: (type: PayItemType, name?: string) => api.get<PayItemRes[]>('/pay/superadmin/payitems', { params: { type, name } }).then(r => r.data),
  create: (data: PayItemReq) => api.post<PayItemRes>('/pay/superadmin/payitems', data).then(r => r.data),
  update: (id: number, data: PayItemReq) => api.put<PayItemRes>(`/pay/superadmin/payitems/${id}`, data).then(r => r.data),
  toggleActive: (id: number) => api.patch<PayItemRes>(`/pay/superadmin/payitems/${id}`).then(r => r.data),
  deleteItems: (ids: number[]) => api.delete('/pay/superadmin/payitems', { data: ids }),
}
