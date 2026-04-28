import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface HrAdminSession {
  token: string
  expiresAt: number // epoch ms
}

interface HrAdminSessionContextValue {
  session: HrAdminSession | null
  remainingMs: number
  hasSession: boolean
  startSession: (token: string, expiresInSeconds: number) => void
  clearSession: () => void
}

const STORAGE_KEY = 'hrAdminSession'

const HrAdminSessionContext = createContext<HrAdminSessionContextValue | null>(null)

function readSession(): HrAdminSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as HrAdminSession
    if (!parsed?.token || !parsed?.expiresAt) return null
    if (parsed.expiresAt <= Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeSession(s: HrAdminSession) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

function removeSession() {
  sessionStorage.removeItem(STORAGE_KEY)
}

// eslint-disable-next-line react-refresh/only-export-components
export function getHrAdminToken(): string | null {
  const s = readSession()
  return s?.token ?? null
}

// eslint-disable-next-line react-refresh/only-export-components
export function clearHrAdminSession() {
  removeSession()
  window.dispatchEvent(new Event('hr-admin-session-cleared'))
}

export function HrAdminSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<HrAdminSession | null>(() => readSession())
  const [now, setNow] = useState<number>(() => Date.now())
  const intervalRef = useRef<number | null>(null)

  const startSession = useCallback((token: string, expiresInSeconds: number) => {
    const next: HrAdminSession = {
      token,
      expiresAt: Date.now() + expiresInSeconds * 1000,
    }
    writeSession(next)
    setSession(next)
  }, [])

  const clearSession = useCallback(() => {
    removeSession()
    setSession(null)
  }, [])

  useEffect(() => {
    const onCleared = () => setSession(null)
    window.addEventListener('hr-admin-session-cleared', onCleared)
    return () => window.removeEventListener('hr-admin-session-cleared', onCleared)
  }, [])

  useEffect(() => {
    if (!session) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now())
    intervalRef.current = window.setInterval(() => setNow(Date.now()), 1000)
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [session])

  useEffect(() => {
    if (session && session.expiresAt <= now) {
      removeSession()
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSession(null)
    }
  }, [now, session])

  const remainingMs = session ? Math.max(0, session.expiresAt - now) : 0

  const value = useMemo<HrAdminSessionContextValue>(
    () => ({
      session,
      remainingMs,
      hasSession: !!session && remainingMs > 0,
      startSession,
      clearSession,
    }),
    [session, remainingMs, startSession, clearSession],
  )

  return <HrAdminSessionContext.Provider value={value}>{children}</HrAdminSessionContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useHrAdminSession() {
  const ctx = useContext(HrAdminSessionContext)
  if (!ctx) throw new Error('useHrAdminSession must be used within HrAdminSessionProvider')
  return ctx
}

// eslint-disable-next-line react-refresh/only-export-components
export function formatRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const mm = Math.floor(totalSec / 60)
  const ss = totalSec % 60
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}
