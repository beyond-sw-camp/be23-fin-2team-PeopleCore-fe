import api from '../api/client'

// 결재 첨부파일 다운로드 — <a href download> 가 axios 인터셉터를 우회해 JWT 가 안 붙어
// 401 이 되는 문제를 회피하기 위해 axios 로 blob 을 받아 a 태그로 직접 다운로드를 트리거한다.
//
// url: 백엔드 응답의 상대경로 — "/approval/document/attachments/{attachId}/file"
//      axios baseURL + "/collaboration-service" 가 자동으로 앞에 붙음.
export async function downloadAttachment(url: string, fileName?: string): Promise<void> {
  const res = await api.get(`/collaboration-service${url}`, { responseType: 'blob' })
  const blobUrl = URL.createObjectURL(res.data as Blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = fileName || 'download'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(blobUrl)
}
