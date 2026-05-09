import api from './client'

export interface LoginRequest {
  companyId: string
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  empName: string
  empRole: string
}

export interface FaceLoginRequest {
  image: string // base64 인코딩된 이미지
  companyId: string
}

export interface FaceRegisterRequest {
  image: string
  empId: number
}

export interface FaceRegisterResponse {
  status: string
  emp_id: number
  emp_name: string
  message: string
}

export interface FaceValidateResponse {
  valid: boolean
  message: string
}

export interface FaceEmployeeResponse {
  empId: number
  empName: string
  empNum: string
  deptName: string
  gradeName: string
  faceRegistered: boolean
  registeredAt: string | null
}

export const authApi = {
  login(data: LoginRequest) {
    return api.post<LoginResponse>('/hr-service/auth/login', data)
  },

  refresh(refreshToken: string) {
    return api.post<LoginResponse>('/hr-service/auth/refresh', { refreshToken })
  },

  logout() {
    return api.post('/hr-service/auth/logout')
  },

  faceLogin(data: FaceLoginRequest) {
    return api.post<LoginResponse>('/hr-service/auth/face/login', data)
  },

  faceRegister(data: FaceRegisterRequest) {
    return api.post<FaceRegisterResponse>('/hr-service/auth/face/register', data)
  },

  faceValidate(image: string) {
    return api.post<FaceValidateResponse>('/hr-service/auth/face/validate', { image })
  },

  getFaceUnregistered() {
    return api.get<FaceEmployeeResponse[]>('/hr-service/auth/face/employees/unregistered')
  },

  getFaceRegistered() {
    return api.get<FaceEmployeeResponse[]>('/hr-service/auth/face/employees/registered')
  },

  faceUnregister(empId: number) {
    return api.delete(`/hr-service/auth/face/unregister/${empId}`)
  },

  sendFindEmailSms(data: { companyId: string; empName: string; empBirthDate: string; empPhone: string }) {
    return api.post<void>('/hr-service/auth/email/sms/send', data)
  },

  verifyFindEmailSms(data: { companyId: string; empName: string; empBirthDate: string; empPhone: string; code: string }) {
    return api.post<{ empEmail: string }>('/hr-service/auth/email/sms/verify', data)
  },

  sendPasswordResetEmail(empEmail: string) {
    return api.post<void>('/hr-service/auth/password/email/send', { empEmail })
  },

  verifyPasswordResetEmail(empEmail: string, code: string) {
    return api.post<void>('/hr-service/auth/password/email/verify', { empEmail, code })
  },

  resetPasswordByEmail(empEmail: string, newPassword: string) {
    return api.post<void>('/hr-service/auth/password/email/reset', { empEmail, newPassword })
  },

  verifyPassword(password: string) {
    return api.post<{ valid: boolean }>('/hr-service/auth/verify-password', { password })
  },

  sendPersonalEmailChangeCode(newEmail: string) {
    return api.post<void>('/hr-service/auth/me/personal-email/send', { newEmail })
  },

  verifyAndUpdatePersonalEmail(newEmail: string, code: string) {
    return api.post<void>('/hr-service/auth/me/personal-email/verify', { newEmail, code })
  },
}

// ── 간편 비밀번호 ──
export interface SimplePasswordStatus {
  hasPin: boolean
  updatedAt: string | null
}

export const simplePasswordApi = {
  status: () =>
    api.get<SimplePasswordStatus>('/hr-service/auth/simple-password/status'),
  set: (loginPassword: string, newPin: string) =>
    api.post<void>('/hr-service/auth/simple-password', { loginPassword, newPin }),
  change: (currentPin: string, newPin: string) =>
    api.put<void>('/hr-service/auth/simple-password', { currentPin, newPin }),
  remove: (loginPassword: string) =>
    api.delete<void>('/hr-service/auth/simple-password', { data: { loginPassword } }),
}

// ── 로그인 이력 ──
export interface LoginHistoryItem {
  id: number
  ip: string | null
  userAgent: string | null
  loginMethod: string | null   // "PASSWORD" | "FACE"
  loginAt: string              // ISO datetime
}

export const loginHistoryApi = {
  list: (limit = 20) =>
    api.get<LoginHistoryItem[]>('/hr-service/auth/login-history', { params: { limit } }),
}
