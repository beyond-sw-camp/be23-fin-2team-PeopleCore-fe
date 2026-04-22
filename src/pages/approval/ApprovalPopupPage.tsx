import { useEffect, useMemo, useState } from 'react'
import ApprovalDocumentPage, { type TempSavedDoc } from './ApprovalDocumentPage'
import {
  consumeApprovalWindowState,
  broadcastApprovalCompleted,
  type ApprovalWindowState,
} from '../../utils/approvalWindow'
import { approvalApi } from '../../api/approval'

/**
 * 팝업 창 전용 전자결재 페이지.
 * 사이드바/양식 목록 없이 기안 폼 또는 문서 조회만 단독 렌더.
 */
export default function ApprovalPopupPage() {
  const [state, setState] = useState<ApprovalWindowState | null>(() => consumeApprovalWindowState())
  const [resolvedFormId, setResolvedFormId] = useState<number | null>(() => {
    const fid = state?.openForm?.formId
    return typeof fid === 'number' && fid > 0 ? fid : null
  })
  const [formLookupLoading, setFormLookupLoading] = useState(false)

  // formCode만 있고 formId 없는 경우 양식 목록에서 조회
  useEffect(() => {
    if (!state?.openForm) return
    const { formId, formCode } = state.openForm
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
          setState((prev) => prev ? ({
            ...prev,
            openForm: {
              ...prev.openForm,
              formId: matched.formId,
              name: matched.formName,
              folder: matched.folderName,
              retention: String(matched.formRetentionYear),
              formCode: matched.formCode,
            },
          }) : prev)
        }
      })
      .catch(() => { /* 무시 */ })
      .finally(() => { if (!aborted) setFormLookupLoading(false) })
    return () => { aborted = true }
  }, [state?.openForm])

  // 탭 닫기/새로고침 시 부모에게 알림 (beforeunload 안에서는 broadcast가 비동기라 실패할 수 있어 보조 수단)
  useEffect(() => {
    const handler = () => { broadcastApprovalCompleted({ type: 'closed' }) }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  // prefill → Record<string,string>
  const prefillData = useMemo<Record<string, string> | undefined>(() => {
    if (!state?.prefill) return undefined
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(state.prefill)) {
      if (v === undefined || v === null) continue
      out[k] = String(v)
    }
    return out
  }, [state?.prefill])

  const docDataOverride = useMemo<Record<string, string> | undefined>(() => {
    if (!state?.docDataOverride) return undefined
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(state.docDataOverride)) {
      if (v === undefined || v === null) continue
      out[k] = String(v)
    }
    return out
  }, [state?.docDataOverride])

  // 임시저장 문서 재열기 시 사용할 초기 docData
  const tempInitialDocData = useMemo<Record<string, string> | undefined>(() => {
    if (!state?.initialDocData) return undefined
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(state.initialDocData)) {
      if (v === undefined || v === null) continue
      out[k] = String(v)
    }
    return out
  }, [state?.initialDocData])

  const handleTempSave = (_doc: TempSavedDoc) => {
    broadcastApprovalCompleted({ type: 'tempsaved', formCode: state?.openForm?.formCode })
    window.close()
  }

  const handleBack = () => {
    // 정상 종료 경로. 상신/취소 모두 onBack으로 수렴하므로 'submitted'로 단정하지 않고 'closed' 브로드캐스트.
    // 부모는 closed 수신 시 관련 목록/잔여를 refetch.
    broadcastApprovalCompleted({ type: 'closed', formCode: state?.openForm?.formCode })
    window.close()
  }

  if (!state) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-[14px] text-gray-600 mb-3">결재 정보를 찾을 수 없습니다.</p>
          <p className="text-[12px] text-gray-400 mb-4">창을 닫고 다시 시도해주세요.</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 text-[12px] bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            창 닫기
          </button>
        </div>
      </div>
    )
  }

  // 문서 조회 모드
  if (state.viewDocId) {
    return (
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-white">
        <ApprovalDocumentPage
          form={{ formId: 0, name: '', folder: '', retention: '' }}
          onBack={handleBack}
          readOnly
          viewDocId={state.viewDocId}
        />
      </div>
    )
  }

  // 기안 작성 모드
  if (state.openForm) {
    if (formLookupLoading || resolvedFormId === null) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-white text-[13px] text-gray-500">
          양식을 불러오는 중...
        </div>
      )
    }

    const prefillLockKey = prefillData?.formCode
      ? `${prefillData.formCode}_${prefillData.otDate ?? prefillData.vacReqStartat ?? prefillData.request_date ?? Date.now()}`
      : null

    return (
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-white">
        <ApprovalDocumentPage
          key={prefillLockKey ?? `form-${resolvedFormId}-${state.editingTempId ?? 'new'}`}
          form={{
            formId: resolvedFormId,
            name: state.openForm.name ?? '',
            folder: state.openForm.folder ?? '',
            retention: state.openForm.retention ?? '',
            formCode: state.openForm.formCode,
          }}
          onBack={handleBack}
          onTempSave={handleTempSave}
          initialDocData={tempInitialDocData ?? prefillData}
          extraDocData={docDataOverride}
          editingTempId={state.editingTempId}
          lockForm={!!prefillData}
        />
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-white text-[13px] text-gray-500">
      열 수 있는 결재 대상이 없습니다.
      <button
        onClick={() => window.close()}
        className="ml-3 px-3 py-1 text-[12px] bg-gray-900 text-white rounded-lg hover:bg-gray-800"
      >
        창 닫기
      </button>
    </div>
  )
}
