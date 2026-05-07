// 백엔드가 저장하는 hr-service-local 경로(/employee/profile-images/...)를
// 브라우저(Vite proxy → 게이트웨이)가 도달 가능한 URL로 변환.
// chat의 getChatFileUrl과 동일 패턴.
export function resolveProfileImageUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('/employee/profile-images/')) return '/api/hr-service' + url
  return url
}
