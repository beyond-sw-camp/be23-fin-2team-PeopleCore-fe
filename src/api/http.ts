const BASE_URL = 'http://localhost:8080'

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const token = localStorage.getItem('accessToken')
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  return res
}
