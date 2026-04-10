import axios from 'axios'
import { getAccessToken, getRefreshToken, setTokens, clearTokens, isTokenExpired } from '../utils/token'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// 요청 인터셉터: JWT 토큰 + 회사ID 헤더 자동 추가
api.interceptors.request.use(config => {
  const token = getAccessToken()
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  const companyId = localStorage.getItem('companyId') || ''
  if (companyId) {
    config.headers['X-User-Company'] = companyId
  }
  const empId = localStorage.getItem('empId') || ''
  if (empId) {
    config.headers['X-User-Id'] = empId
  }
  const empRole = localStorage.getItem('empRole') || ''
  if (empRole) {
    config.headers['X-User-Role'] = empRole
  }
  return config
})

// 응답 인터셉터: 401 시 토큰 갱신 시도
let isRefreshing = false
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(p => {
    if (token) p.resolve(token)
    else p.reject(error)
  })
  failedQueue = []
}

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    // 네트워크 에러(백엔드 미실행)는 리다이렉트 없이 그대로 reject
    if (!error.response) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = getRefreshToken()
      if (!refreshToken || isTokenExpired(refreshToken)) {
        // DEV_BYPASS 모드(토큰 없이 동작)에서는 리다이렉트하지 않음
        const accessToken = getAccessToken()
        if (!accessToken && !refreshToken) {
          return Promise.reject(error)
        }
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`
              resolve(api(originalRequest))
            },
            reject,
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post('/api/hr-service/auth/refresh', { refreshToken })
        setTokens(data.accessToken, data.refreshToken)
        processQueue(null, data.accessToken)
        originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api
