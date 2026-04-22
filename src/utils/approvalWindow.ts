/**
 * 전자결재 팝업 창 유틸
 *
 * - 결재 진입(기안 작성 / 문서 조회) 시 브라우저 새 창으로 띄운다.
 * - react-router의 navigation state는 창 간 전달이 불가능하므로 localStorage를 브리지로 사용.
 * - 팝업 차단기 대응: window.open은 반드시 사용자 클릭 이벤트 동기 흐름 안에서 호출해야 한다.
 *   API 호출 같은 비동기 작업을 먼저 수행한 뒤 open하면 브라우저가 차단한다.
 */

const STORAGE_PREFIX = 'approval-popup-state:'
const BROADCAST_CHANNEL = 'approval-popup'
const WINDOW_FEATURES = 'width=1200,height=900,scrollbars=yes,resizable=yes'

/** 팝업 창 라우팅에 실어 보내는 state (기존 navigate state와 동일 shape) */
export interface ApprovalWindowState {
  openForm?: {
    formId?: number
    name?: string
    folder?: string
    retention?: string
    formCode?: string
  }
  viewDocId?: number
  prefill?: Record<string, unknown>
  docDataOverride?: Record<string, unknown>
  /** 임시저장 문서 재열기 — 해당 docId를 ApprovalDocumentPage의 editingTempId로 전달 */
  editingTempId?: number
  /** 임시저장 문서 재열기 시 초기 docData */
  initialDocData?: Record<string, string>
  leaveData?: unknown
  grantRequestData?: unknown
  overtimeData?: unknown
  correctionData?: unknown
  requireHrAdminApprover?: boolean
}

/** 팝업이 부모 창에 알리는 이벤트 */
export interface ApprovalCompletedEvent {
  type: 'submitted' | 'tempsaved' | 'canceled' | 'closed'
  docId?: number
  formCode?: string
}

function generateKey(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * 전자결재 팝업 창 열기.
 * 반드시 사용자 클릭 핸들러의 동기 흐름 안에서 호출할 것 (팝업 차단 회피).
 * @returns 열린 Window 또는 null(차단된 경우)
 */
export function openApprovalWindow(state: ApprovalWindowState): Window | null {
  const key = generateKey()
  const storageKey = STORAGE_PREFIX + key
  try {
    localStorage.setItem(storageKey, JSON.stringify(state))
  } catch {
    // storage 꽉 찬 경우 — 기존 팝업 state 중 오래된 것 정리
    purgeStaleState()
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
    } catch {
      alert('일시적으로 결재 창을 열 수 없습니다. 브라우저를 새로고침 후 다시 시도해주세요.')
      return null
    }
  }

  const url = `/approval-popup?k=${encodeURIComponent(key)}`
  const popup = window.open(url, `approval-popup-${key}`, WINDOW_FEATURES)
  if (!popup) {
    localStorage.removeItem(storageKey)
    alert('팝업이 차단되었습니다. 브라우저 주소창의 팝업 허용 설정을 확인해주세요.')
    return null
  }
  popup.focus()
  return popup
}

/**
 * 팝업 페이지에서 URL의 ?k= 키로 state를 꺼내고 localStorage에서 즉시 제거.
 * 새로고침/뒤로가기 등으로 재진입 시 state가 사라지므로, 팝업 페이지는 한 번만 상태를 읽어 자체 보관해야 한다.
 */
export function consumeApprovalWindowState(): ApprovalWindowState | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const key = params.get('k')
  if (!key) return null
  const storageKey = STORAGE_PREFIX + key
  const raw = localStorage.getItem(storageKey)
  if (!raw) return null
  localStorage.removeItem(storageKey)
  try {
    return JSON.parse(raw) as ApprovalWindowState
  } catch {
    return null
  }
}

/**
 * 오랫동안 방치된 팝업 state 정리 (storage 포화 대비).
 * 키에 포함된 Date.now() 값으로 1시간 이상 된 항목 제거.
 */
function purgeStaleState(): void {
  const now = Date.now()
  const oneHour = 60 * 60 * 1000
  const toRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k || !k.startsWith(STORAGE_PREFIX)) continue
    const tsPart = k.slice(STORAGE_PREFIX.length).split('-')[0]
    const ts = parseInt(tsPart ?? '0', 36)
    if (!Number.isFinite(ts) || now - ts > oneHour) toRemove.push(k)
  }
  toRemove.forEach((k) => localStorage.removeItem(k))
}

/** 팝업 → 부모 창: 결재 처리 결과 브로드캐스트 */
export function broadcastApprovalCompleted(event: ApprovalCompletedEvent): void {
  try {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL)
    channel.postMessage(event)
    // 약간의 지연 후 close (메시지 전달 보장)
    setTimeout(() => channel.close(), 50)
  } catch {
    // BroadcastChannel 미지원 환경 — storage event로 폴백
    try {
      localStorage.setItem(`${STORAGE_PREFIX}event`, JSON.stringify({ ...event, at: Date.now() }))
      localStorage.removeItem(`${STORAGE_PREFIX}event`)
    } catch {
      // 무시
    }
  }
}

/**
 * 부모 창에서 팝업 완료 이벤트 구독.
 * @returns 구독 해제 함수
 */
export function subscribeApprovalCompleted(callback: (event: ApprovalCompletedEvent) => void): () => void {
  let channel: BroadcastChannel | null = null
  let storageHandler: ((e: StorageEvent) => void) | null = null

  try {
    channel = new BroadcastChannel(BROADCAST_CHANNEL)
    channel.onmessage = (msg) => {
      const data = msg.data as ApprovalCompletedEvent | null
      if (data && typeof data.type === 'string') callback(data)
    }
  } catch {
    // storage event 폴백
    storageHandler = (e: StorageEvent) => {
      if (e.key !== `${STORAGE_PREFIX}event` || !e.newValue) return
      try {
        const data = JSON.parse(e.newValue) as ApprovalCompletedEvent
        callback(data)
      } catch {
        // 무시
      }
    }
    window.addEventListener('storage', storageHandler)
  }

  return () => {
    if (channel) channel.close()
    if (storageHandler) window.removeEventListener('storage', storageHandler)
  }
}
