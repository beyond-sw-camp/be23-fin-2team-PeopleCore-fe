const BASE_URL = '/api'

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  const token = localStorage.getItem('accessToken')
  const companyId = localStorage.getItem('companyId')
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (companyId) headers['X-User-Company'] = companyId
  return headers
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
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
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
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  return res
}
