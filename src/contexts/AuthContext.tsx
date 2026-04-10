import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '../api/auth'
import type { LoginRequest } from '../api/auth'
import { getAccessToken, getRefreshToken, setTokens, clearTokens, parseJwt } from '../utils/token'
import axios from 'axios'

export interface AuthUser {
  empId: string
  companyId: string
  empName: string
  empRole: 'HR_SUPER_ADMIN' | 'HR_ADMIN' | 'EMPLOYEE'
  departmentId: string
  gradeId: string
  titleId: string
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  login: (data: LoginRequest) => Promise<void>
  faceLogin: (image: string) => Promise<void>
  logout: () => void
  isHRAdmin: boolean
  isHRSuperAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 앱 초기 로드 시 저장된 토큰으로 유저 복원
  useEffect(() => {
    // TODO: 개발용 로그인 우회 — 배포 전 반드시 제거
    const DEV_BYPASS_LOGIN = false
    if (DEV_BYPASS_LOGIN) {
      setUser({
        empId: '1',
        companyId: 'dev-company',
        empName: '김인재',
        empRole: 'HR_SUPER_ADMIN',
        departmentId: '1',
        gradeId: '1',
        titleId: '1',
      })
      localStorage.setItem('companyId', 'dev-company')
      localStorage.setItem('empId', '1')
      localStorage.setItem('empRole', 'HR_SUPER_ADMIN')
      setIsLoading(false)
      return
    }

    const token = getAccessToken()
    if (token) {
      const payload = parseJwt(token)
      if (payload && payload.exp * 1000 > Date.now()) {
        setUser({
          empId: payload.sub,
          companyId: payload.companyId,
          empName: payload.name,
          empRole: payload.role as AuthUser['empRole'],
          departmentId: payload.departmentId,
          gradeId: payload.gradeId,
          titleId: payload.titleId,
        })
        localStorage.setItem('companyId', payload.companyId)
        localStorage.setItem('empId', payload.sub)
        localStorage.setItem('empRole', payload.role)
      } else {
        clearTokens()
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (data: LoginRequest) => {
    const { data: res } = await authApi.login(data)
    setTokens(res.accessToken, res.refreshToken)
    const payload = parseJwt(res.accessToken)
    if (payload) {
      localStorage.setItem('companyId', payload.companyId)
      setUser({
        empId: payload.sub,
        companyId: payload.companyId,
        empName: res.empName,
        empRole: res.empRole as AuthUser['empRole'],
        departmentId: payload.departmentId,
        gradeId: payload.gradeId,
        titleId: payload.titleId,
      })
    }
  }, [])

  const faceLogin = useCallback(async (image: string) => {
    const { data: res } = await authApi.faceLogin({ image })
    setTokens(res.accessToken, res.refreshToken)
    const payload = parseJwt(res.accessToken)
    if (payload) {
      localStorage.setItem('companyId', payload.companyId)
      setUser({
        empId: payload.sub,
        companyId: payload.companyId,
        empName: res.empName,
        empRole: res.empRole as AuthUser['empRole'],
        departmentId: payload.departmentId,
        gradeId: payload.gradeId,
        titleId: payload.titleId,
      })
    }
  }, [])

  const logout = useCallback(() => {
    const refreshToken = getRefreshToken()
    clearTokens()
    setUser(null)
    // 토큰 삭제 후 서버에 로그아웃 알림 (실패해도 무시)
    if (refreshToken) {
      axios.post('/api/hr-service/auth/logout', { refreshToken }).catch(() => {})
    }
  }, [])

  const isHRAdmin = user?.empRole === 'HR_ADMIN' || user?.empRole === 'HR_SUPER_ADMIN'
  const isHRSuperAdmin = user?.empRole === 'HR_SUPER_ADMIN'

  return (
    <AuthContext.Provider value={{ user, isLoading, login, faceLogin, logout, isHRAdmin, isHRSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
