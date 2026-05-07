import { API_BASE_URL } from '../config/env'

// 백엔드 collaboration-service 가 응답에 담아주는 결재 파일 상대경로
// (/approval/signatures/{empId}/file?v=..., /approval/document/attachments/{id}/file)
// 를 게이트웨이가 도달 가능한 절대 URL 로 변환.
// MinIO presigned URL 대신 백엔드 프록시 GET 으로 바뀐 변경에 대응.
// dev: API_BASE_URL=/api → vite proxy 가 /api 떼고 게이트웨이로 전달
// prod: API_BASE_URL=https://server.peoplecore.cloud → 게이트웨이 직접 호출
export function resolveApprovalFileUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('/approval/')) return `${API_BASE_URL}/collaboration-service` + url
  return url
}
