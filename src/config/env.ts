if (!import.meta.env.VITE_API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not set. Check GitHub Actions secrets and .env files.')
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || ''
