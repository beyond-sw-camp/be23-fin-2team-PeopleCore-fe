import api from './client'

export interface HrAdminPinStatus {
  hasPin: boolean
  updatedAt: string | null
}

export interface HrAdminPinVerifyResponse {
  hrAdminToken: string
  expiresInSeconds: number
}

export const hrAdminPinApi = {
  status: () =>
    api.get<HrAdminPinStatus>('/hr-service/auth/hr-admin-pin/status'),
  set: (loginPassword: string, newPin: string) =>
    api.post<void>('/hr-service/auth/hr-admin-pin', { loginPassword, newPin }),
  change: (currentPin: string, newPin: string) =>
    api.put<void>('/hr-service/auth/hr-admin-pin', { currentPin, newPin }),
  remove: (loginPassword: string) =>
    api.delete<void>('/hr-service/auth/hr-admin-pin', { data: { loginPassword } }),
  verify: (pin: string) =>
    api.post<HrAdminPinVerifyResponse>('/hr-service/auth/hr-admin-pin/verify', { pin }),
}
