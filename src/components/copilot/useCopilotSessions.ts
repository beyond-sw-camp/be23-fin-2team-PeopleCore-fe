import { useCallback, useEffect, useRef, useState } from 'react'
import type { Citation } from '../../api/copilot'

/**
 * Copilot 세션 영속화 hook.
 *
 * 보안 정책:
 *  - EXAONE 응답(민감 정보 — PII·급여·평가·휴가) 본문은 localStorage 에 평문 저장 X.
 *    저장 시 placeholder 로 마스킹, 화면 메모리(state)에는 원본 유지.
 *    패널 닫고 열면 마스킹된 버전이 표시 → 사용자가 다시 조회 유도.
 *
 * 운영 정책:
 *  - 최대 30 세션 LRU (오래된 것부터 삭제)
 *  - updatedAt 기준 30 일 만료
 *  - 사용자 명시 삭제 가능
 *
 * 데이터 모델:
 *  - StoredMessage: localStorage 형태 (마스킹 적용된 버전)
 *  - 화면용 messages: 원본 (EXAONE 응답 그대로)
 */

const STORAGE_KEY = 'copilot.sessions'
const CURRENT_KEY = 'copilot.currentSessionId'
const MAX_SESSIONS = 30
const MAX_AGE_DAYS = 30
const EXAONE_MASK = '[보안 정책에 따라 답변 본문이 저장되지 않습니다. 필요시 다시 조회해주세요.]'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  toolCallCount?: number
  error?: boolean
  /** 응답한 모델 식별자 (저장 시 EXAONE 마스킹 분기에 사용) */
  model?: string
  /** 복원된 메시지 중 본문이 마스킹된 것을 UI 가 구분하기 위한 플래그 */
  isSensitive?: boolean
}

export interface CopilotSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: ChatMessage[]
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function isExaoneModel(model?: string): boolean {
  return !!model && model.toLowerCase().startsWith('exaone')
}

/** 저장 직전 EXAONE assistant 응답을 마스킹. user 메시지·일반 assistant 는 원본 그대로. */
function maskForStorage(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((m) => {
    if (m.role === 'assistant' && !m.error && isExaoneModel(m.model)) {
      return { ...m, content: EXAONE_MASK, isSensitive: true }
    }
    return m
  })
}

/** 첫 user 메시지 발췌로 세션 제목 생성 (최대 30자). */
function deriveTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user')
  if (!firstUser) return '새 대화'
  const text = firstUser.content.trim().replace(/\s+/g, ' ')
  return text.length > 30 ? text.slice(0, 30) + '…' : text
}

function loadAllSessions(): CopilotSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // 만료 정리 (30일)
    const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000
    return parsed.filter((s: CopilotSession) => {
      const ts = new Date(s.updatedAt).getTime()
      return Number.isFinite(ts) && ts >= cutoff
    })
  } catch {
    return []
  }
}

function saveAllSessions(sessions: CopilotSession[]) {
  try {
    // updatedAt desc 정렬 + LRU (최대 MAX_SESSIONS 개)
    const sorted = [...sessions]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, MAX_SESSIONS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted))
  } catch {
    // localStorage 용량 초과 등 — 조용히 실패 (UX 영향 최소화)
  }
}

/** 로그아웃 시 호출 — 모든 Copilot 세션 + 현재 세션 ID 삭제. */
export function clearAllCopilotSessions() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(CURRENT_KEY)
  } catch {
    // ignore
  }
}

export function useCopilotSessions() {
  const [sessions, setSessions] = useState<CopilotSession[]>(() => loadAllSessions())
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(CURRENT_KEY)
    } catch {
      return null
    }
  })

  // 현재 세션이 sessions 목록에 없으면 (예: 만료·삭제) 새로 생성
  useEffect(() => {
    if (!currentSessionId || !sessions.find((s) => s.id === currentSessionId)) {
      const fresh: CopilotSession = {
        id: generateId(),
        title: '새 대화',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      }
      const next = [fresh, ...sessions]
      setSessions(next)
      setCurrentSessionId(fresh.id)
      saveAllSessions(next)
      try { localStorage.setItem(CURRENT_KEY, fresh.id) } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentSession = sessions.find((s) => s.id === currentSessionId) ?? null

  /** 세션 메시지 갱신 — 화면용 원본 ChatMessage[] 그대로 받아서 storage 엔 마스킹 적용. */
  const setMessagesForCurrent = useCallback(
    (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      setSessions((prev) => {
        const idx = prev.findIndex((s) => s.id === currentSessionId)
        if (idx < 0) return prev
        const cur = prev[idx]
        const newMessages = updater(cur.messages)
        const updated: CopilotSession = {
          ...cur,
          messages: newMessages,
          title: cur.title === '새 대화' ? deriveTitle(newMessages) : cur.title,
          updatedAt: new Date().toISOString(),
        }
        const next = [...prev]
        next[idx] = updated
        // storage 저장 시 EXAONE 마스킹 적용한 별도 배열
        const forStorage = next.map((s) =>
          s.id === updated.id ? { ...s, messages: maskForStorage(s.messages) } : s,
        )
        saveAllSessions(forStorage)
        return next
      })
    },
    [currentSessionId],
  )

  const startNewSession = useCallback(() => {
    const fresh: CopilotSession = {
      id: generateId(),
      title: '새 대화',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    }
    setSessions((prev) => {
      const next = [fresh, ...prev]
      // storage 엔 기존 세션의 마스킹된 버전 + 새 빈 세션
      const forStorage = next.map((s) =>
        s.id === fresh.id ? s : { ...s, messages: maskForStorage(s.messages) },
      )
      saveAllSessions(forStorage)
      return next
    })
    setCurrentSessionId(fresh.id)
    try { localStorage.setItem(CURRENT_KEY, fresh.id) } catch { /* ignore */ }
  }, [])

  const switchSession = useCallback((id: string) => {
    setCurrentSessionId(id)
    try { localStorage.setItem(CURRENT_KEY, id) } catch { /* ignore */ }
  }, [])

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id)
      const forStorage = next.map((s) => ({ ...s, messages: maskForStorage(s.messages) }))
      saveAllSessions(forStorage)
      // 현재 세션을 삭제한 경우 첫 세션으로 전환 (없으면 새로 생성은 useEffect 가)
      return next
    })
    if (id === currentSessionId) {
      const remaining = sessions.filter((s) => s.id !== id)
      const nextActive = remaining[0]
      if (nextActive) {
        setCurrentSessionId(nextActive.id)
        try { localStorage.setItem(CURRENT_KEY, nextActive.id) } catch { /* ignore */ }
      } else {
        // useEffect 가 새 세션 자동 생성하도록 null 셋
        setCurrentSessionId(null)
        try { localStorage.removeItem(CURRENT_KEY) } catch { /* ignore */ }
      }
    }
  }, [currentSessionId, sessions])

  // 다른 탭에서 storage 변경 감지 (logout 호출 등)
  const lastSyncRef = useRef(0)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === CURRENT_KEY || e.key === null) {
        const now = Date.now()
        if (now - lastSyncRef.current < 100) return // 디바운스
        lastSyncRef.current = now
        setSessions(loadAllSessions())
        try { setCurrentSessionId(localStorage.getItem(CURRENT_KEY)) } catch { /* ignore */ }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return {
    sessions,
    currentSession,
    currentSessionId,
    setMessagesForCurrent,
    startNewSession,
    switchSession,
    deleteSession,
  }
}
