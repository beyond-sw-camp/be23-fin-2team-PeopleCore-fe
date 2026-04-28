/**
 * 전자결재 모달 유틸
 *
 * - 결재 진입(기안 작성 / 문서 조회) 요청을 전역 모달 호스트(ApprovalModalHost)에 전달한다.
 * - SPA 내부 모달로 렌더되므로 창 간 통신 / 브라우저 팝업 차단 이슈 없음.
 * - 기존 공개 API(openApprovalWindow / subscribeApprovalCompleted / ApprovalWindowState / ApprovalCompletedEvent)는
 *   그대로 유지하여 기존 호출부를 수정하지 않는다.
 */

/**
 * 결재 모달 오픈 시 결재선에 미리 채울 사용자.
 * Copilot 의 prefill_approval_form 도구가 EMPLOYEE 검색으로 해결한 결과를 그대로 매핑.
 */
export interface PrefilledApprover {
  empId: number
  empName: string
  empDeptId?: number
  empDeptName?: string
  empGrade?: string
  empTitle?: string
}

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
  /** 결재선 prefill — Copilot 이 사용자 발화에서 추출한 결재자 목록을 모달 결재선에 그대로 채움 */
  initialApprovers?: PrefilledApprover[]
  leaveData?: unknown
  grantRequestData?: unknown
  overtimeData?: unknown
  correctionData?: unknown
}

/** 팝업이 부모 창에 알리는 이벤트 */
export interface ApprovalCompletedEvent {
  type: 'submitted' | 'tempsaved' | 'canceled' | 'closed'
  docId?: number
  formCode?: string
}

type OpenListener = (state: ApprovalWindowState, attachments?: File[]) => void
type CompletedListener = (event: ApprovalCompletedEvent) => void

let openListener: OpenListener | null = null
const completedListeners = new Set<CompletedListener>()

/** ApprovalModalHost가 자신을 오픈 리스너로 등록 */
export function registerApprovalOpener(listener: OpenListener): () => void {
  openListener = listener
  return () => {
    if (openListener === listener) openListener = null
  }
}

/** 모달이 완료/닫힘 이벤트를 내부 구독자에게 브로드캐스트 */
export function emitApprovalCompleted(event: ApprovalCompletedEvent): void {
  completedListeners.forEach((cb) => {
    try { cb(event) } catch { /* ignore */ }
  })
}

/**
 * 전자결재 모달 열기.
 * @param state - 폼/문서 state
 * @param attachments - File 목록 (휴가/초과근무 등에서 이어받는 첨부파일)
 */
export function openApprovalWindow(state: ApprovalWindowState, attachments?: File[]): null {
  if (!openListener) {
    console.warn('[approvalWindow] ApprovalModalHost가 아직 마운트되지 않았습니다.')
    return null
  }
  openListener(state, attachments)
  return null
}

/**
 * 결재 완료 이벤트 구독.
 * @returns 구독 해제 함수
 */
export function subscribeApprovalCompleted(callback: CompletedListener): () => void {
  completedListeners.add(callback)
  return () => { completedListeners.delete(callback) }
}
