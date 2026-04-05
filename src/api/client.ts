import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const companyId = localStorage.getItem('companyId') || ''
  if (companyId) {
    config.headers['X-User-Company'] = companyId
  }
  return config
})

export default api
