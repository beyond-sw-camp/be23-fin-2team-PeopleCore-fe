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
  // url 과 src 를 함께 보관 — async fetch 가 끝났을 때 prop 의 url 이 이미 다른 값으로 바뀌었거나
  // null 이 됐을 수 있으므로, 렌더 단에서 prop url 과 일치할 때만 표시한다.
  // 이렇게 두면 effect 본문에서 setState 를 동기 호출할 필요가 없어 react-hooks/set-state-in-effect 위반도 없다.
  const [state, setState] = useState<{ url: string; src: string } | null>(null)

  useEffect(() => {
    if (!url) return
    let objectUrl: string | undefined
    let cancelled = false

    api.get(`/collaboration-service${url}`, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(res.data as Blob)
        setState({ url, src: objectUrl })
      })
      .catch(() => {})

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url])

  if (!url || state?.url !== url) return null
  return <img src={state.src} alt={alt} {...rest} />
}
