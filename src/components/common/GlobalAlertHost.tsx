import { useEffect, useState } from 'react'
import AlertModal from './AlertModal'

type AlertType = 'success' | 'error' | 'warning' | 'info'

interface PendingAlert {
  id: number
  message: string
  type: AlertType
  title?: string
}

type Listener = (item: PendingAlert) => void
const listeners: Listener[] = []
let nextId = 1

// 키워드 기반으로 성공/에러 톤을 자동 판정 — native alert() 호출부에 타입 지정이 없기 때문.
const inferType = (msg: string): AlertType => {
  if (/실패|오류|에러|error/i.test(msg)) return 'error'
  if (/경고|주의/i.test(msg)) return 'warning'
  if (/완료|성공|저장|삭제|등록|수정/.test(msg)) return 'success'
  return 'info'
}

export function showGlobalAlert(message: string, type?: AlertType, title?: string) {
  const item: PendingAlert = {
    id: nextId++,
    message,
    type: type ?? inferType(message),
    title,
  }
  listeners.forEach((l) => l(item))
}

let installed = false
/**
 * window.alert 를 전역 모달로 오버라이드. 앱 루트에서 한 번만 호출.
 * native alert 는 동기 블로킹이지만, 모달은 비동기 non-blocking 으로 동작한다는
 * 점만 주의하면 대부분의 기존 호출부는 그대로 호환된다.
 */
export function installGlobalAlert() {
  if (installed) return
  installed = true
  window.alert = (msg?: unknown) => {
    showGlobalAlert(msg == null ? '' : String(msg))
  }
}

export default function GlobalAlertHost() {
  const [queue, setQueue] = useState<PendingAlert[]>([])

  useEffect(() => {
    const l: Listener = (item) => setQueue((prev) => [...prev, item])
    listeners.push(l)
    return () => {
      const idx = listeners.indexOf(l)
      if (idx >= 0) listeners.splice(idx, 1)
    }
  }, [])

  const current = queue[0]
  if (!current) return null
  const close = () => setQueue((prev) => prev.slice(1))

  return (
    <AlertModal
      isOpen
      type={current.type}
      title={current.title}
      message={current.message}
      onClose={close}
    />
  )
}
