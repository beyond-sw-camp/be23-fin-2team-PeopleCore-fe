import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '../api/auth'
import type { LoginRequest } from '../api/auth'
import { getAccessToken, setTokens, clearTokens, parseJwt } from '../utils/token'

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

  const logout = useCallback(() => {
    authApi.logout().catch(() => {})
    clearTokens()
    setUser(null)
  }, [])

  const isHRAdmin = user?.empRole === 'HR_ADMIN' || user?.empRole === 'HR_SUPER_ADMIN'
  const isHRSuperAdmin = user?.empRole === 'HR_SUPER_ADMIN'

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isHRAdmin, isHRSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
