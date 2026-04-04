import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// 요청 인터셉터: 회사ID 헤더 자동 추가
api.interceptors.request.use(config => {
  // TODO: 로그인 후 저장된 companyId로 교체
  const companyId = localStorage.getItem('companyId') || ''
  if (companyId) {
    config.headers['X-User-Company'] = companyId
  }
  return config
})

export default api
