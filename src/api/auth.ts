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

  // 현재 유저 비밀번호 재확인 (민감 액션 전 본인확인용)
  verifyPassword(password: string) {
    return api.post<{ valid: boolean }>('/hr-service/auth/verify-password', { password })
  },
}
