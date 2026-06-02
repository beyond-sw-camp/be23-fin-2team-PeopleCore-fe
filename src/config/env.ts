// 개발 모드(npm run dev)에서는 .env 없이도 /api 폴백 → Vite 프록시로 동작.
// 운영 빌드(vite build)에서는 환경변수 누락 시 즉시 에러로 잘못된 배포를 차단.
const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '/api' : undefined)

if (!apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL is not set. Check GitHub Actions secrets and .env files.')
}

export const API_BASE_URL = apiBaseUrl
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || ''
