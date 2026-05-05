import { API_BASE_URL } from '../config/env'

const BASE_URL = API_BASE_URL

export class ApiError extends Error {
  status: number
  body: unknown
  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

/** Error / ApiError / axios 에러 어디서든 사용자에게 보여줄 메시지를 추출. */
export function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message
  const anyErr = err as { response?: { data?: unknown }; message?: string } | null
  const data = anyErr?.response?.data as Record<string, unknown> | string | undefined
  if (typeof data === 'string' && data.trim()) return data.trim()
  if (data && typeof data === 'object') {
    const pick = (k: string) => typeof (data as Record<string, unknown>)[k] === 'string'
      ? ((data as Record<string, unknown>)[k] as string).trim()
      : ''
    const head = pick('message') || pick('error')
    const detail = pick('detail')
    const traceId = pick('traceId')
    if (head || detail) {
      const parts = [head || fallback]
      if (detail && detail !== head) parts.push(`[상세] ${detail}`)
      if (traceId) parts.push(`[trace ${traceId}]`)
      return parts.join('\n')
    }
  }
  if (err instanceof Error && err.message && !/^API \d+:/.test(err.message)) {
    return err.message
  }
  return fallback
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  const token = localStorage.getItem('accessToken')
  const companyId = localStorage.getItem('companyId')
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (companyId) headers['X-User-Company'] = companyId
  return headers
}

/** 서버 응답 본문에서 사용자에게 보여줄 메시지를 추출. 실패 시 status 기반 기본 메시지. */
async function toApiError(res: Response): Promise<ApiError> {
  let body: unknown = null
  let backendMessage: string | null = null
  let backendDetail: string | null = null
  let traceId: string | null = null
  try {
    const contentType = res.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      body = await res.json()
      const rec = body as Record<string, unknown> | null
      const pick = (k: string) => typeof rec?.[k] === 'string' ? (rec![k] as string) : null
      backendMessage = pick('message') || pick('error') || null
      backendDetail = pick('detail')
      traceId = pick('traceId')
    } else {
      const text = await res.text()
      body = text
      if (text && text.length < 500) backendMessage = text
    }
  } catch {
    // 본문 파싱 실패 → status 기반 기본 메시지 사용
  }

  const fallback =
    res.status === 401 ? '인증이 필요합니다. 다시 로그인해주세요.'
    : res.status === 403 ? '권한이 없습니다.'
    : res.status === 404 ? '요청한 리소스를 찾을 수 없습니다.'
    : res.status >= 500 ? '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    : '요청 처리 중 오류가 발생했습니다.'

  const head = (backendMessage?.trim() || fallback)
  const parts = [head]
  if (backendDetail && backendDetail.trim() && backendDetail.trim() !== head) {
    parts.push(`[상세] ${backendDetail.trim()}`)
  }
  if (traceId) parts.push(`[trace ${traceId}]`)
  return new ApiError(parts.join('\n'), res.status, body)
}

/** JSON 기반 API 호출 (GET / PUT / DELETE 등) */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options?.headers,
    },
    credentials: 'include',
  })
  if (!res.ok) throw await toApiError(res)
  return res
}

/** Multipart 폼 데이터 전송 (POST - 파일 업로드) */
export async function apiFetchMultipart(path: string, body: FormData): Promise<Response> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: authHeaders(),          // Content-Type은 브라우저가 자동 설정
    body,
    credentials: 'include',
  })
  if (!res.ok) throw await toApiError(res)
  return res
}
