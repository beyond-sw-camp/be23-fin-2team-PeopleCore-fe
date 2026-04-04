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
}
