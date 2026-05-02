import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '../api/auth'
import type { LoginRequest } from '../api/auth'
import { getAccessToken, getRefreshToken, setTokens, clearTokens, parseJwt } from '../utils/token'
import axios from 'axios'
import { connectStomp, disconnectStomp, subscribeTo } from '../services/stompClient'
import { chatApi } from '../api/chat'
import { evaluatorRoleApi } from '../api/evaluatorRole'
import { fetchEmployeeDetail } from '../api/employee/employeeApi'
import type { StompSubscription } from '@stomp/stompjs'

export interface AuthUser {
  empId: string
  companyId: string
  empName: string
  empRole: 'HR_SUPER_ADMIN' | 'HR_ADMIN' | 'EMPLOYEE'
  departmentId: string
  gradeId: string
  titleId: string
  // 로그인 직후 fetchEmployeeDetail로 1회 보강. JWT에는 ID만 있어서
  // 양식 자동 매핑에 필요한 한국어 이름을 별도로 받아 캐싱한다.
  deptName?: string
  gradeName?: string
  titleName?: string
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
  faceLogin: (image: string, companyId: string) => Promise<void>
  logout: () => void
  isHRAdmin: boolean
  isHRSuperAdmin: boolean
  isEvaluator: boolean
  chatUnreadCount: number
  setChatUnreadCount: (n: number | ((prev: number) => number)) => void
  lastUnreadEvent: UnreadEvent | null
  setActiveViewingRoomId: (roomId: number | null) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEvaluator, setIsEvaluator] = useState(false)
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
      localStorage.setItem('empId', '1')
      localStorage.setItem('empRole', 'HR_SUPER_ADMIN')
      setIsLoading(false)
      return
    }

    const token = getAccessToken()
    if (token) {
      const payload = parseJwt(token)
      if (payload && payload.exp * 1000 > Date.now()) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // user가 set되면 사원 상세를 1회 fetch해서 deptName/gradeName/titleName을 보강.
  // 이 정보는 결재 양식 자동 매핑(휴가신청서 등)에 사용된다.
  useEffect(() => {
    if (!user?.empId) return
    if (user.deptName && user.gradeName && user.titleName) return
    fetchEmployeeDetail(Number(user.empId))
      .then((emp) => {
        setUser((prev) => prev ? {
          ...prev,
          deptName: emp.deptName,
          gradeName: emp.gradeName,
          titleName: emp.titleName,
        } : prev)
      })
      .catch(() => { /* 보강 실패해도 기본 동작에는 영향 없음 */ })
  }, [user?.empId, user?.deptName, user?.gradeName, user?.titleName])

  // user 변경 시 평가자(팀장) 지정 여부 조회
  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsEvaluator(false)
      return
    }
    let cancelled = false
    evaluatorRoleApi.me()
      .then(({ data }) => { if (!cancelled) setIsEvaluator(!!data?.evaluator) })
      .catch(() => { if (!cancelled) setIsEvaluator(false) })
    return () => { cancelled = true }
  }, [user])

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const faceLogin = useCallback(async (image: string, companyId: string) => {
    const { data: res } = await authApi.faceLogin({ image, companyId })
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
    const refreshToken = getRefreshToken()
    clearTokens()
    setUser(null)
    // Copilot 세션 (대화 이력) 도 함께 삭제 — 다른 사용자 PC 로그인 시 노출 방지
    try {
      localStorage.removeItem('copilot.sessions')
      localStorage.removeItem('copilot.currentSessionId')
    } catch { /* ignore */ }
    // 토큰 삭제 후 서버에 로그아웃 알림 (실패해도 무시)
    if (refreshToken) {
      axios.post('/api/hr-service/auth/logout', { refreshToken }).catch(() => {})
    }
  }, [])

  const isHRAdmin = user?.empRole === 'HR_ADMIN' || user?.empRole === 'HR_SUPER_ADMIN'
  const isHRSuperAdmin = user?.empRole === 'HR_SUPER_ADMIN'

  return (
    <AuthContext.Provider value={{
      user, isLoading, login, faceLogin, logout, isHRAdmin, isHRSuperAdmin, isEvaluator,
      chatUnreadCount, setChatUnreadCount, lastUnreadEvent, setActiveViewingRoomId,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
