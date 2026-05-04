import { useEffect, useRef, useState } from 'react'
import {
  approvalApi,
  type ApprovalLineStatus,
  type ApprovalStatus,
  type DocumentDetailResponse,
} from '../../api/approval'

const STATUS_BADGE: Record<ApprovalStatus, { text: string; cls: string }> = {
  DRAFT: { text: '임시저장', cls: 'bg-gray-100 text-gray-700' },
  PENDING: { text: '진행중', cls: 'bg-blue-50 text-blue-600' },
  APPROVED: { text: '승인', cls: 'bg-emerald-50 text-emerald-600' },
  REJECTED: { text: '반려', cls: 'bg-red-50 text-red-500' },
  CANCELED: { text: '회수', cls: 'bg-gray-100 text-gray-500' },
}

const LINE_STATUS_LABEL: Record<ApprovalLineStatus, string> = {
  PENDING: '대기',
  APPROVED: '승인',
  REJECTED: '반려',
  DELEGATED: '위임',
  CANCELED: '취소',
}

interface Props {
  docId: number
}

export default function ApprovalDocumentInlineView({ docId }: Props) {
  const [doc, setDoc] = useState<DocumentDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [prevDocId, setPrevDocId] = useState(docId)
  const formRef = useRef<HTMLDivElement>(null)

  // docId 변경 시 렌더 중 동기적으로 state 리셋 (effect 내 setState 회피)
  if (prevDocId !== docId) {
    setPrevDocId(docId)
    setDoc(null)
    setLoading(true)
    setError(null)
  }

  useEffect(() => {
    let aborted = false
    approvalApi.getDocument(docId)
      .then(({ data }) => { if (!aborted) setDoc(data) })
      .catch(() => { if (!aborted) setError('결재 문서를 불러오지 못했습니다.') })
      .finally(() => { if (!aborted) setLoading(false) })
    return () => { aborted = true }
  }, [docId])

  // formHtml + docData 바인딩 (readonly) — ApprovalDocumentPage의 조회 경로와 동일 규칙
  useEffect(() => {
    if (!formRef.current || !doc) return
    formRef.current.innerHTML = doc.formHtml
    formRef.current.classList.add('form-readonly')

    // .form-title 숨김 — 헤더에서 docTitle 별도 표시
    formRef.current.querySelectorAll<HTMLElement>('.form-title').forEach((el) => {
      el.style.display = 'none'
    })

    formRef.current.querySelectorAll<HTMLInputElement>('input, textarea, select').forEach((el, idx) => {
      if (!el.name) el.name = `field_${idx}`
    })

    const data: Record<string, unknown> = doc.docData ? JSON.parse(doc.docData) : {}
    Object.entries(data).forEach(([name, value]) => {
      if (value === null || value === undefined) return
      if (typeof value === 'object') return
      const strValue = String(value)
      const els = formRef.current!.querySelectorAll<HTMLInputElement>(`[name="${name}"]`)
      els.forEach((el) => {
        if (el.type === 'radio') {
          el.checked = el.value === strValue
        } else if (el.type === 'checkbox') {
          el.checked = strValue === 'true'
        } else {
          // BE는 LocalDateTime 풀 포맷으로 저장 — input[type=date/time]은 짧은 포맷만 허용
          let normalized = strValue
          if (el.type === 'date' && strValue.includes('T')) normalized = strValue.slice(0, 10)
          else if (el.type === 'time' && strValue.includes('T')) normalized = strValue.slice(11, 16)
          el.value = normalized
          if (el.type === 'date' || el.type === 'time') el.setAttribute('value', normalized)
        }
        // textarea는 disabled 시 휠 스크롤이 막히므로 readonly만 사용
        if (el.tagName === 'TEXTAREA') {
          el.setAttribute('readonly', 'readonly')
        } else {
          el.disabled = true
          el.setAttribute('readonly', 'readonly')
        }
      })
    })

    // 휴가 일자 textarea — 선택한 일수만큼 한 줄씩 표시 (textarea 대신 리스트 렌더)
    const vacDatesEl = formRef.current.querySelector<HTMLTextAreaElement>('textarea[name="vacReqDatesText"]')
    if (vacDatesEl) {
      const lines = (vacDatesEl.value || '').split('\n').map((s) => s.trim()).filter(Boolean)
      let listEl = vacDatesEl.parentElement?.querySelector<HTMLDivElement>('.vac-dates-list') ?? null
      if (!listEl) {
        listEl = document.createElement('div')
        listEl.className = 'vac-dates-list'
        listEl.style.display = 'flex'
        listEl.style.flexDirection = 'column'
        listEl.style.gap = '4px'
        vacDatesEl.insertAdjacentElement('afterend', listEl)
      }
      listEl.innerHTML = lines
        .map((line) => `<div style="padding:6px 10px;border:1px solid #e5e7eb;border-radius:4px;background:#f9fafb;font-size:12px;color:#374151;">${line.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string))}</div>`)
        .join('')
      vacDatesEl.style.display = 'none'
    }
  }, [doc])

  const handleAttachmentDownload = async (attachId: number) => {
    try {
      const { data: url } = await approvalApi.getAttachmentDownloadUrl(attachId)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      alert('첨부파일을 다운로드할 수 없습니다.')
    }
  }

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 min-h-[200px] bg-gray-50 flex items-center justify-center">
        <span className="text-sm text-gray-400">결재 문서를 불러오는 중...</span>
      </div>
    )
  }
  if (error || !doc) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 min-h-[200px] bg-gray-50 flex items-center justify-center">
        <span className="text-sm text-red-500">{error ?? '문서를 찾을 수 없습니다.'}</span>
      </div>
    )
  }

  const statusBadge = STATUS_BADGE[doc.approvalStatus] ?? { text: doc.approvalStatus, cls: 'bg-gray-100 text-gray-600' }
  const submittedDate = doc.docSubmittedAt ? doc.docSubmittedAt.slice(0, 10) : '-'
  const approverLines = doc.approvalLines
    .filter((l) => l.approvalRole === 'APPROVER')
    .sort((a, b) => a.lineStep - b.lineStep)

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            {doc.isEmergency && (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-50 text-red-500 font-medium shrink-0">긴급</span>
            )}
            <h4 className="text-sm font-semibold text-gray-900 truncate">{doc.docTitle}</h4>
          </div>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${statusBadge.cls}`}>{statusBadge.text}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">문서번호</span>
            <span className="text-gray-700 font-mono">{doc.docNum || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">양식</span>
            <span className="text-gray-700">{doc.formName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">기안자</span>
            <span className="text-gray-700">{doc.empName} ({doc.empDeptName})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">상신일</span>
            <span className="text-gray-700">{submittedDate}</span>
          </div>
        </div>
      </div>

      {/* 결재선 */}
      {approverLines.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-700 mb-2">결재선</div>
          <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr className="text-gray-500">
                <th className="px-3 py-2 text-center font-medium w-14">순서</th>
                <th className="px-3 py-2 text-center font-medium">결재자</th>
                <th className="px-3 py-2 text-center font-medium w-20">상태</th>
                <th className="px-3 py-2 text-center font-medium w-36">처리일시</th>
              </tr>
            </thead>
            <tbody>
              {approverLines.map((l) => (
                <tr key={l.lineId} className="border-t border-gray-100">
                  <td className="px-3 py-2 text-center text-gray-500">{l.lineStep}</td>
                  <td className="px-3 py-2 text-center text-gray-700">
                    {l.empName} <span className="text-gray-400">({l.empGrade} · {l.empDeptName})</span>
                  </td>
                  <td className="px-3 py-2 text-center text-gray-700">
                    {LINE_STATUS_LABEL[l.approvalLineStatus] ?? l.approvalLineStatus}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-500">
                    {l.lineProcessedAt ? l.lineProcessedAt.slice(0, 16).replace('T', ' ') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 양식 본문 */}
      <div className="border border-gray-200 rounded-lg p-5 bg-white">
        <div ref={formRef} />
      </div>

      {/* 첨부 */}
      {doc.attachments?.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-700 mb-2">첨부파일 ({doc.attachments.length})</div>
          <ul className="border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white">
            {doc.attachments.map((a) => (
              <li key={a.attachId} className="flex items-center justify-between px-4 py-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleAttachmentDownload(a.attachId)}
                  className="flex items-center gap-2 text-gray-700 hover:text-[#1D9E75] truncate"
                >
                  <i className="fas fa-paperclip text-gray-400" />
                  <span className="truncate">{a.fileName}</span>
                </button>
                <span className="text-gray-400 shrink-0 ml-3">{(a.fileSize / 1024).toFixed(1)} KB</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
