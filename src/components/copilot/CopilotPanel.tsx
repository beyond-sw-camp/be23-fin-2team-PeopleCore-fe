import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { copilotApi, type Citation, type CopilotAction, type HistoryTurn, type PageContext } from '../../api/copilot'
import { openApprovalWindow, type PrefilledApprover } from '../../utils/approvalWindow'
import { useCopilotSessions, type ChatMessage } from './useCopilotSessions'

interface CopilotPanelProps {
  /** Drawer 헤더의 닫기 버튼 표시 (Drawer 모드일 때만 true) */
  onClose?: () => void
  /** 패널 외곽 클래스 — Drawer / Dashboard 임베드에 따라 다른 컨테이너 스타일 적용 */
  className?: string
  /** 헤더 영역 표시 여부 (Dashboard 임베드 시엔 카드 자체에 헤더가 있을 수 있어 숨김) */
  showHeader?: boolean
  /** 헤더 타이틀 (기본: "AI 코파일럿") */
  title?: string
}

/**
 * Copilot 채팅 UI. Drawer / Dashboard 사이드 양쪽에서 공용.
 * 메시지는 컴포넌트 로컬 state — 새로고침/패널 재오픈 시 초기화 (MVP).
 * history 는 API 호출 시 user/assistant 텍스트만 직렬화 (서버 stateless 계약).
 */
export default function CopilotPanel({
  onClose,
  className = '',
  showHeader = true,
  title = 'AI 코파일럿',
}: CopilotPanelProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    sessions,
    currentSession,
    setMessagesForCurrent,
    startNewSession,
    switchSession,
    deleteSession,
  } = useCopilotSessions()
  const messages = currentSession?.messages ?? []
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 새 메시지 도착 시 자동 스크롤
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  /**
   * LLM 응답의 클라이언트 액션 directive 를 실행한다.
   * 현재 지원: OPEN_APPROVAL_FORM (결재 모달 자동 오픈)
   */
  const runAction = useCallback((action: CopilotAction) => {
    if (action.type === 'OPEN_APPROVAL_FORM') {
      const p = action.payload as {
        formCode?: string
        formId?: number
        formName?: string
        folderName?: string
        formRetentionYear?: number | string
        prefill?: Record<string, unknown>
        initialApprovers?: PrefilledApprover[]
      }
      if (!p.formCode) return
      // BE(ApprovalClient.resolveFormByCode)가 채워 보낸 formId/folder/retention 이 있으면 그대로 사용.
      // 그래야 ApprovalModalHost 가 /approval/form 목록을 추가 조회해 매칭하는 단계를 건너뛰고
      // 모달 본문(양식 HTML)을 즉시 렌더한다. 누락된 경우엔 기존 폴백(목록 lookup) 으로 동작.
      const resolvedFormId = typeof p.formId === 'number' && p.formId > 0 ? p.formId : undefined
      const retention = p.formRetentionYear != null ? String(p.formRetentionYear) : ''
      openApprovalWindow({
        openForm: {
          formCode: p.formCode,
          formId: resolvedFormId,
          name: p.formName ?? '',
          folder: p.folderName ?? '',
          retention,
        },
        prefill: p.prefill ? { formCode: p.formCode, ...p.prefill } : { formCode: p.formCode },
        initialApprovers: p.initialApprovers,
      })
    }
  }, [])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    const history: HistoryTurn[] = messages
      .filter((m) => !m.error)
      .map((m) => ({ role: m.role, content: m.content }))

    setMessagesForCurrent((prev) => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)

    const pageContext: PageContext = { route: location.pathname }

    try {
      const { data } = await copilotApi.chat({ message: text, history, pageContext })
      setMessagesForCurrent((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          citations: data.citations,
          toolCallCount: data.toolCalls?.length ?? 0,
          // model 필드 — 저장 시 EXAONE 응답 마스킹 분기에 사용
          model: data.model,
        },
      ])
      // LLM 이 prefill_approval_form 등 클라이언트 액션 도구를 호출했을 때 자동 실행
      data.actions?.forEach(runAction)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      const msg = status === 503
        ? 'AI 서비스가 비활성 상태입니다. 관리자에게 문의해 주세요. (API 키 미설정)'
        : (err as { response?: { data?: { error?: string } } })?.response?.data?.error
          ?? 'AI 응답을 받지 못했습니다. 잠시 후 다시 시도해 주세요.'
      setMessagesForCurrent((prev) => [...prev, { role: 'assistant', content: msg, error: true }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [input, loading, messages, runAction, location.pathname, setMessagesForCurrent])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // IME 조합 중 Enter 무시 (한글 자모 합성 깨짐 방지)
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const onCitationClick = (c: Citation) => {
    if (c.type === 'APPROVAL') {
      openApprovalWindow({ viewDocId: Number(c.id.replace(/^APPROVAL_/, '')) })
      return
    }
    if (c.type === 'EMPLOYEE') {
      window.dispatchEvent(new CustomEvent('open-orgchart', { detail: { empId: c.id.replace(/^EMPLOYEE_/, '') } }))
      return
    }
    if (c.type === 'DEPARTMENT') {
      window.dispatchEvent(new CustomEvent('open-orgchart', { detail: { deptId: c.id.replace(/^DEPARTMENT_/, '') } }))
      return
    }
    if (c.type === 'CALENDAR') {
      navigate('/calendar', { state: { viewEventId: Number(c.id.replace(/^CALENDAR_/, '')) } })
      return
    }
    if (c.link) navigate(c.link)
  }

  const handleNewSession = () => {
    startNewSession()
    setShowHistory(false)
    setInput('')
  }

  const handlePickSession = (id: string) => {
    switchSession(id)
    setShowHistory(false)
  }

  return (
    <div className={`flex flex-col bg-white ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#E1F5EE] flex items-center justify-center">
              <i className="fa-solid fa-wand-magic-sparkles text-[12px] text-[#1D9E75]" />
            </div>
            <span className="text-[14px] font-bold text-gray-800">{title}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleNewSession}
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-[#1D9E75] rounded hover:bg-gray-100"
              title="새 대화 시작"
              aria-label="새 대화"
            >
              <i className="fa-solid fa-plus text-[13px]" />
            </button>
            <button
              onClick={() => setShowHistory((v) => !v)}
              className={`w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 ${
                showHistory ? 'text-[#1D9E75]' : 'text-gray-400 hover:text-gray-600'
              }`}
              title="이전 대화 목록"
              aria-label="이전 대화"
            >
              <i className="fa-regular fa-clock text-[13px]" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                aria-label="닫기"
              >
                <i className="fa-solid fa-xmark text-[14px]" />
              </button>
            )}
          </div>
        </div>
      )}

      {showHistory ? (
        <SessionListPanel
          sessions={sessions}
          currentSessionId={currentSession?.id ?? null}
          onPick={handlePickSession}
          onDelete={deleteSession}
        />
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {messages.length === 0 && !loading && <EmptyState />}

          {messages.map((m, i) => (
            <Bubble key={i} message={m} onCitationClick={onCitationClick} />
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-[12px] text-gray-400 px-3 py-2">
              <i className="fa-solid fa-circle-notch fa-spin text-[#1D9E75]" />
              <span>응답을 생성하고 있어요…</span>
            </div>
          )}
        </div>
      )}

      <div className="px-3 py-3 border-t border-gray-200 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="사원·부서·결재·일정에 대해 물어보세요. (Enter 전송, Shift+Enter 줄바꿈)"
            rows={2}
            className="flex-1 resize-none text-[13px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent placeholder-gray-400"
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              !input.trim() || loading
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-[#1D9E75] text-white hover:bg-[#178a65]'
            }`}
            aria-label="전송"
          >
            <i className="fa-solid fa-paper-plane text-[13px]" />
          </button>
        </div>
      </div>
    </div>
  )
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24 && d.toDateString() === now.toDateString()) return `${diffHr}시간 전`
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return '어제'
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function SessionListPanel({
  sessions,
  currentSessionId,
  onPick,
  onDelete,
}: {
  sessions: Array<{ id: string; title: string; updatedAt: string; messages: ChatMessage[] }>
  currentSessionId: string | null
  onPick: (id: string) => void
  onDelete: (id: string) => void
}) {
  // 빈 세션은 목록에서 숨김 (방금 만들어진 새 세션)
  const visible = sessions.filter((s) => s.messages.length > 0)

  if (visible.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
          <i className="fa-regular fa-clock text-[18px] text-gray-400" />
        </div>
        <p className="text-[13px] font-semibold text-gray-700">이전 대화가 없습니다</p>
        <p className="text-[11px] text-gray-400 mt-1">대화를 시작하면 이곳에 기록됩니다</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 min-h-0">
      {visible.map((s) => {
        const isActive = s.id === currentSessionId
        const lastMsgCount = s.messages.length
        return (
          <div
            key={s.id}
            className={`group relative flex items-start gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
              isActive ? 'bg-[#F2FAF6] border border-[#1D9E75]/30' : 'hover:bg-gray-50 border border-transparent'
            }`}
            onClick={() => onPick(s.id)}
          >
            <i className={`fa-regular fa-comment-dots text-[12px] mt-0.5 ${isActive ? 'text-[#1D9E75]' : 'text-gray-400'}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-[12px] font-medium truncate ${isActive ? 'text-[#1D9E75]' : 'text-gray-800'}`}>
                {s.title || '새 대화'}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {formatRelativeTime(s.updatedAt)} · {lastMsgCount}개 메시지
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('이 대화를 삭제하시겠어요?')) onDelete(s.id)
              }}
              className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 rounded transition-opacity"
              aria-label="대화 삭제"
              title="삭제"
            >
              <i className="fa-solid fa-trash text-[10px]" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center pt-8 pb-4">
      <div className="w-12 h-12 rounded-2xl bg-[#E1F5EE] flex items-center justify-center mb-3">
        <i className="fa-solid fa-wand-magic-sparkles text-[18px] text-[#1D9E75]" />
      </div>
      <p className="text-[13px] font-semibold text-gray-700">무엇을 도와드릴까요?</p>
      <p className="text-[11px] text-gray-400 mt-1">사내 데이터를 검색해 답변합니다</p>
    </div>
  )
}

function Bubble({
  message,
  onCitationClick,
}: {
  message: ChatMessage
  onCitationClick: (c: Citation) => void
}) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-[#1D9E75] text-white rounded-br-sm'
            : message.error
              ? 'bg-red-50 text-red-700 border border-red-100 rounded-bl-sm'
              : message.isSensitive
                ? 'bg-amber-50 text-amber-800 border border-amber-200 rounded-bl-sm'
                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }`}
      >
        {!isUser && message.isSensitive && (
          <p className="text-[10px] text-amber-600 mb-1.5 flex items-center gap-1">
            <i className="fa-solid fa-lock text-[9px]" />
            <span>민감 정보 답변 — 본문 미저장</span>
          </p>
        )}
        <p className="leading-relaxed">{message.content}</p>

        {!isUser && !message.error && message.citations && message.citations.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-gray-200/70">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              참조 ({message.citations.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {message.citations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onCitationClick(c)}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-white border border-gray-200 hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors"
                  title={c.title}
                >
                  <i className={`text-[9px] ${typeIcon(c.type)}`} />
                  <span className="max-w-[140px] truncate">{c.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!isUser && !message.error && (message.toolCallCount ?? 0) > 0 && (!message.citations || message.citations.length === 0) && (
          <p className="mt-2 text-[10px] text-gray-400">
            <i className="fa-solid fa-magnifying-glass mr-1" />
            검색 {message.toolCallCount}회 — 관련 결과 없음
          </p>
        )}
      </div>
    </div>
  )
}

function typeIcon(type: string): string {
  switch (type) {
    case 'EMPLOYEE': return 'fa-solid fa-user'
    case 'DEPARTMENT': return 'fa-solid fa-sitemap'
    case 'APPROVAL': return 'fa-solid fa-file-signature'
    case 'CALENDAR': return 'fa-solid fa-calendar-days'
    default: return 'fa-solid fa-link'
  }
}
