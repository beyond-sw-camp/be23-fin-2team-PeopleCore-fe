import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '../api/auth'
import type { LoginRequest } from '../api/auth'
import { getAccessToken, setTokens, clearTokens, parseJwt } from '../utils/token'
import { connectStomp, disconnectStomp, subscribeTo } from '../services/stompClient'
import { chatApi } from '../api/chat'
import type { StompSubscription } from '@stomp/stompjs'

export interface AuthUser {
  empId: string
  companyId: string
  empName: string
  empRole: 'HR_SUPER_ADMIN' | 'HR_ADMIN' | 'EMPLOYEE'
  departmentId: string
  gradeId: string
  titleId: string
}

export interface UnreadEvent {
  roomId: number
  senderName: string
  content: string
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  login: (data: LoginRequest) => Promise<void>
  faceLogin: (image: string) => Promise<void>
  logout: () => void
  isHRAdmin: boolean
  isHRSuperAdmin: boolean
  chatUnreadCount: number
  setChatUnreadCount: (n: number | ((prev: number) => number)) => void
  lastUnreadEvent: UnreadEvent | null
  setActiveViewingRoomId: (roomId: number | null) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [chatUnreadCount, setChatUnreadCount] = useState(0)
  const [lastUnreadEvent, setLastUnreadEvent] = useState<UnreadEvent | null>(null)
  const unreadSubRef = useRef<StompSubscription | null>(null)
  const activeViewingRoomIdRef = useRef<number | null>(null)

  const setActiveViewingRoomId = useCallback((roomId: number | null) => {
    activeViewingRoomIdRef.current = roomId
  }, [])

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
      } else {
        clearTokens()
      }
    }
    setIsLoading(false)
  }, [])

  // user가 존재하면 STOMP 연결 + 전역 unread 구독
  useEffect(() => {
    if (user) {
      connectStomp(() => {
        // 연결 성공 후 전역 unread 구독
        unreadSubRef.current?.unsubscribe()
        unreadSubRef.current = subscribeTo(
          `/sub/user/${user.empId}/unread`,
          (msg) => {
            const event: UnreadEvent = JSON.parse(msg.body)

            // 현재 보고 있는 방이면 unread 증가 안 함 + 자동 읽음 처리
            if (activeViewingRoomIdRef.current === event.roomId) {
              chatApi.markAsRead(event.roomId).catch(() => {})
              return
            }

            setChatUnreadCount((prev) => prev + 1)
            setLastUnreadEvent(event)
          }
        )
      })
    } else {
      unreadSubRef.current?.unsubscribe()
      disconnectStomp()
      setChatUnreadCount(0)
    }
    return () => {
      unreadSubRef.current?.unsubscribe()
      disconnectStomp()
    }
  }, [user])

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
      localStorage.setItem('lastCompanyCode', payload.companyId)
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
    <AuthContext.Provider value={{
      user, isLoading, login, faceLogin, logout, isHRAdmin, isHRSuperAdmin,
      chatUnreadCount, setChatUnreadCount, lastUnreadEvent, setActiveViewingRoomId,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
