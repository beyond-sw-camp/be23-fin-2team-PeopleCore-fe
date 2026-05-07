import { useEffect, useState } from 'react'
import api from '../../api/client'

// 결재 서명 이미지 표시 — <img src> 가 axios 인터셉터를 우회해 JWT 헤더를 못 보내
// 401(→SPA index.html)이 되는 문제를 회피하기 위해 axios 로 직접 blob 을 받아
// URL.createObjectURL 로 일회용 src 를 만든다.
//
// url: 백엔드가 응답에 담아주는 상대경로 — "/approval/signatures/{empId}/file?v=..."
//      axios baseURL + "/collaboration-service" 가 자동으로 앞에 붙음.

interface Props extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  url: string | null | undefined
}

export default function SignatureImage({ url, alt = '서명', ...rest }: Props) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!url) { setSrc(null); return }
    let objectUrl: string | undefined
    let cancelled = false

    api.get(`/collaboration-service${url}`, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(res.data as Blob)
        setSrc(objectUrl)
      })
      .catch(() => { if (!cancelled) setSrc(null) })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url])

  if (!src) return null
  return <img src={src} alt={alt} {...rest} />
}
