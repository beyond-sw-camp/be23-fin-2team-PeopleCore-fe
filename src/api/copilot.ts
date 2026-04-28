import api from './client'

export type ChatRole = 'user' | 'assistant'

export interface HistoryTurn {
  role: ChatRole
  content: string
}

/**
 * 사용자가 현재 보고 있는 화면 컨텍스트.
 * Copilot 이 "이 결재 누구야?" 같은 화면-기반 발화에 답할 수 있도록 system prompt 에 합성된다.
 */
export interface PageContext {
  /** location.pathname (예: "/approval/123", "/hr/payroll") */
  route: string
}

export interface CopilotRequest {
  message: string
  history: HistoryTurn[]
  pageContext?: PageContext
}

export interface Citation {
  id: string
  type: 'EMPLOYEE' | 'DEPARTMENT' | 'APPROVAL' | 'CALENDAR' | string
  title: string
  link: string | null
}

export interface ToolCall {
  name: string
  input: Record<string, unknown>
  resultCount: number
}

/**
 * Copilot 응답에 실려오는 클라이언트 사이드 액션 directive.
 * FE 가 응답 수신 직후 type 별로 자동 실행 (예: 결재 모달 오픈).
 */
export interface CopilotAction {
  type: 'OPEN_APPROVAL_FORM' | string
  payload: Record<string, unknown>
}

export interface CopilotResponse {
  answer: string
  citations: Citation[]
  toolCalls: ToolCall[]
  actions?: CopilotAction[]
  stopReason: string
  usage: { inputTokens: number; outputTokens: number }
  model: string
}

export const copilotApi = {
  chat: (req: CopilotRequest) =>
    api.post<CopilotResponse>('/search-service/copilot/chat', req, { timeout: 60_000 }),
}
