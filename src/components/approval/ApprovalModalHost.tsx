import { useEffect, useMemo, useRef, useState } from 'react'
import ApprovalDocumentPage, { type TempSavedDoc } from '../../pages/approval/ApprovalDocumentPage'
import { type OrgMember } from '../../pages/approval/approvalTypes'
import {
  registerApprovalOpener,
  emitApprovalCompleted,
  type ApprovalWindowState,
  type PrefilledApprover,
} from '../../utils/approvalWindow'
import { approvalApi } from '../../api/approval'

/**
 * 전역 전자결재 모달 호스트.
 *
 * - App 루트에 한 번 마운트되어 openApprovalWindow() 요청을 수신해 모달로 렌더.
 * - 취소 버튼 / X / ESC / backdrop 클릭 시 dirty 상태를 검사해 필요하면
 *   "임시저장 하시겠습니까?" 확인 모달을 띄운다.
 */

interface ModalInstance {
  key: number
  state: ApprovalWindowState
  attachments?: File[]
}

export default function ApprovalModalHost() {
  const [instance, setInstance] = useState<ModalInstance | null>(null)
  const [resolvedFormId, setResolvedFormId] = useState<number | null>(null)
  const [formLookupLoading, setFormLookupLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const isDirtyRef = useRef<(() => boolean) | null>(null)
  const tempSaveRef = useRef<(() => void) | null>(null)
  const keyCounter = useRef(0)

  // 오픈 리스너 등록
  useEffect(() => {
    return registerApprovalOpener((state, attachments) => {
      keyCounter.current += 1
      setInstance({ key: keyCounter.current, state, attachments })
      const fid = state.openForm?.formId
      setResolvedFormId(typeof fid === 'number' && fid > 0 ? fid : null)
      setConfirmOpen(false)
    })
  }, [])

  // formCode만 있고 formId 없는 경우 양식 목록에서 조회
  useEffect(() => {
    if (!instance?.state.openForm) return
    const { formId, formCode } = instance.state.openForm
    if (typeof formId === 'number' && formId > 0) {
      setResolvedFormId(formId)
      return
    }
    if (!formCode) return
    let aborted = false
    setFormLookupLoading(true)
    approvalApi.getForms()
      .then(({ data }) => {
        if (aborted) return
        const matched = data.find((f) => f.formCode === formCode)
        if (matched) {
          setResolvedFormId(matched.formId)
          setInstance((prev) => prev ? ({
            ...prev,
            state: {
              ...prev.state,
              openForm: {
                ...prev.state.openForm,
                formId: matched.formId,
                name: matched.formName,
                folder: matched.folderName,
                retention: String(matched.formRetentionYear),
                formCode: matched.formCode,
              },
            },
          }) : prev)
        }
      })
      .catch(() => { /* 무시 */ })
      .finally(() => { if (!aborted) setFormLookupLoading(false) })
    return () => { aborted = true }
  }, [instance?.state.openForm])

  const state = instance?.state

  // prefill → Record<string,string>
  const prefillData = useMemo<Record<string, string> | undefined>(() => {
    if (!state?.prefill) return undefined
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(state.prefill)) {
      if (v === undefined || v === null) continue
      out[k] = String(v)
    }
    return Object.keys(out).length ? out : undefined
  }, [state?.prefill])

  const docDataOverride = useMemo<Record<string, unknown> | undefined>(() => {
    if (!state?.docDataOverride) return undefined
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(state.docDataOverride)) {
      if (v === undefined) continue
      out[k] = v
    }
    return out
  }, [state?.docDataOverride])

  const tempInitialDocData = useMemo<Record<string, string> | undefined>(() => {
    if (!state?.initialDocData) return undefined
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(state.initialDocData)) {
      if (v === undefined || v === null) continue
      out[k] = String(v)
    }
    return out
  }, [state?.initialDocData])

  // PrefilledApprover(서버 응답 형식) → OrgMember(모달 내부 형식) 변환
  const initialApprovers = useMemo<OrgMember[] | undefined>(() => {
    const list = state?.initialApprovers
    if (!list || list.length === 0) return undefined
    return list.map((a: PrefilledApprover) => ({
      id: String(a.empId),
      empId: a.empId,
      name: a.empName,
      position: a.empGrade ?? '',
      department: a.empDeptName ?? '',
      deptId: a.empDeptId,
      grade: a.empGrade,
      title: a.empTitle,
    }))
  }, [state?.initialApprovers])

  // ESC로 닫기 요청 — dirty 체크 후 확인 모달
  useEffect(() => {
    if (!instance) return
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // 확인 모달이 열려있으면 그것만 닫음
      if (confirmOpen) {
        setConfirmOpen(false)
        return
      }
      requestClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance, confirmOpen])

  if (!instance || !state) return null

  const closeAndNotify = (eventType: 'closed' | 'tempsaved' | 'submitted' = 'closed') => {
    emitApprovalCompleted({ type: eventType, formCode: state.openForm?.formCode })
    setInstance(null)
    setConfirmOpen(false)
    isDirtyRef.current = null
    tempSaveRef.current = null
  }

  // 성공 경로 (상신/회수/승인 등) — 확인 없이 바로 닫기
  const handleBack = () => {
    closeAndNotify('closed')
  }

  // 임시저장 성공 콜백 (handleTempSave 내부 또는 확인 모달 '임시저장' 버튼 경로)
  const handleTempSaveDone = (_doc: TempSavedDoc) => {
    closeAndNotify('tempsaved')
  }

  // 사용자의 닫기 의도 (취소 버튼 / X / ESC / backdrop)
  const requestClose = () => {
    const dirty = isDirtyRef.current?.() ?? false
    if (dirty) setConfirmOpen(true)
    else closeAndNotify('closed')
  }

  // 확인 모달 버튼들
  const handleConfirmTempSave = () => {
    // 임시저장 트리거 후 onTempSave 콜백이 closeAndNotify 호출.
    // tempSaveRef가 없거나 실패하면 모달은 열린 상태로 유지.
    setConfirmOpen(false)
    tempSaveRef.current?.()
  }
  // "취소" 버튼: 임시저장 없이 결재 화면에서 나간다.
  const handleConfirmDiscard = () => {
    closeAndNotify('closed')
  }
  // ESC / backdrop click: 확인 모달만 닫고 결재 화면에 머무른다.
  const handleConfirmDismiss = () => {
    setConfirmOpen(false)
  }

  const handleBackdropClick = () => {
    requestClose()
  }

  const isViewMode = !!state.viewDocId
  const isDraftMode = !!state.openForm && !isViewMode

  let content: React.ReactNode = null
  if (isViewMode) {
    content = (
      <ApprovalDocumentPage
        key={`view-${state.viewDocId}-${instance.key}`}
        form={{ formId: 0, name: '', folder: '', retention: '' }}
        onBack={handleBack}
        readOnly
        viewDocId={state.viewDocId}
        onNavigateToDoc={(newDocId) => {
          setInstance((prev) => prev ? { ...prev, state: { ...prev.state, viewDocId: newDocId } } : prev)
        }}
      />
    )
  } else if (isDraftMode) {
    if (formLookupLoading || resolvedFormId === null) {
      content = (
        <div className="flex-1 flex items-center justify-center bg-white text-[13px] text-gray-500">
          양식을 불러오는 중...
        </div>
      )
    } else {
      const prefillLockKey = prefillData?.formCode
        ? `${prefillData.formCode}_${prefillData.otDate ?? prefillData.vacReqStartat ?? prefillData.request_date ?? instance.key}`
        : null

      content = (
        <ApprovalDocumentPage
          key={prefillLockKey ?? `form-${resolvedFormId}-${state.editingTempId ?? 'new'}-${instance.key}`}
          form={{
            formId: resolvedFormId,
            name: state.openForm?.name ?? '',
            folder: state.openForm?.folder ?? '',
            retention: state.openForm?.retention ?? '',
            formCode: state.openForm?.formCode,
          }}
          onBack={handleBack}
          onRequestCancel={requestClose}
          onTempSave={handleTempSaveDone}
          initialDocData={tempInitialDocData ?? prefillData}
          extraDocData={docDataOverride}
          editingTempId={state.editingTempId}
          lockForm={!!prefillData}
          initialAttachments={instance.attachments}
          initialApprovers={initialApprovers}
          tempSaveRef={tempSaveRef}
          isDirtyRef={isDirtyRef}
          customHtmlTemplate={state.customHtmlTemplate}
        />
      )
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleBackdropClick() }}
    >
      <div className="relative w-full max-w-[1400px] h-[95vh] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden">
        <button
          onClick={requestClose}
          className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900"
          title="닫기 (ESC)"
          aria-label="닫기"
        >
          <i className="fas fa-times text-[14px]" />
        </button>
        <div className="flex-1 flex flex-col overflow-hidden">
          {content}
        </div>
      </div>

      {confirmOpen && (
        <div
          className="absolute inset-0 z-[90] flex items-center justify-center bg-black/40"
          onMouseDown={(e) => { if (e.target === e.currentTarget) handleConfirmDismiss() }}
        >
          <div className="bg-white rounded-lg shadow-xl w-[380px] p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-2">임시저장 하시겠습니까?</h3>
            <p className="text-[12px] text-gray-600 mb-5">
              작성 중인 내용을 임시저장 하시겠습니까?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleConfirmDiscard}
                className="px-4 py-1.5 text-[12px] text-gray-700 border border-gray-300 hover:bg-gray-50 rounded"
              >
                취소
              </button>
              <button
                onClick={handleConfirmTempSave}
                className="px-4 py-1.5 text-[12px] bg-[#1D9E75] text-white hover:bg-[#178a65] rounded"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
