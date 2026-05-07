import { API_BASE_URL } from '../config/env'

// 백엔드가 저장하는 hr-service-local 경로(/employee/profile-images/...)를
// 게이트웨이가 도달 가능한 절대 URL로 변환.
// dev: API_BASE_URL=/api → vite proxy가 /api 떼고 게이트웨이로 전달
// prod: API_BASE_URL=https://server.peoplecore.cloud → 게이트웨이 직접 호출
export function resolveProfileImageUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('/employee/profile-images/')) return `${API_BASE_URL}/hr-service` + url
  return url
}
