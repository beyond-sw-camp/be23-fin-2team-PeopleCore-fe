import React, { useState, useRef, useEffect, useCallback } from 'react'
import ApprovalInfoModal from './ApprovalInfoModal'
import { type OrgMember } from './approvalTypes'
import { useAuth } from '../../contexts/AuthContext'
import { approvalApi, type ApprovalLineRequest, type DocumentCreateRequest, type DocumentDetailResponse, type CommentResponse } from '../../api/approval'

interface FormInfo {
  formId: number
  name: string
  folder: string
  retention: string
  formHtml?: string
}

interface AttachedFile {
  file: File
  name: string
  size: number
}

export interface TempSavedDoc {
  id: number
  form: FormInfo
  docData: Record<string, string>
  savedAt: string
}

interface ApprovalDocumentPageProps {
  form: FormInfo
  onBack: () => void
  onTempSave?: (doc: TempSavedDoc) => void
  readOnly?: boolean
  initialDocData?: Record<string, string>
  editingTempId?: number
  /** 문서 상세 조회 모드 (기존 문서 열기) */
  viewDocId?: number
  /** 외부에서 임시저장 트리거용 ref */
  tempSaveRef?: React.RefObject<(() => void) | null>
}

const RETENTION_OPTIONS = ['1년', '3년', '5년', '10년', '영구']


/* ── 댓글 아이템 ── */
function CommentItem({ comment: c, currentEmpId, editingCommentId, editInput, onEditStart, onEditCancel, onEditSave, onEditInputChange, onDelete, onReplyToggle }: {
  comment: CommentResponse
  currentEmpId: number
  editingCommentId: number | null
  editInput: string
  onEditStart: (id: number, content: string) => void
  onEditCancel: () => void
  onEditSave: () => void
  onEditInputChange: (v: string) => void
  onDelete: () => void
  onReplyToggle?: () => void
}) {
  const isEditing = editingCommentId === c.commentId
  const isMine = c.empId === currentEmpId

  return (
      <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-gray-900">{c.empName}</span>
            <span className="text-[11px] text-gray-400">{c.empDeptName} · {c.empGradeName}</span>
          </div>
          <span className="text-[11px] text-gray-300">{c.createdAt?.replace('T', ' ').slice(0, 16)}</span>
        </div>
        {isEditing ? (
            <div className="flex gap-2">
              <input
                  type="text"
                  value={editInput}
                  onChange={(e) => onEditInputChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') onEditSave() }}
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-[12px] outline-none focus:border-[#1D9E75]"
              />
              <button onClick={onEditSave} className="text-[11px] text-[#1D9E75] hover:underline">저장</button>
              <button onClick={onEditCancel} className="text-[11px] text-gray-400 hover:underline">취소</button>
            </div>
        ) : (
            <p className="text-[12px] text-gray-700 leading-relaxed">{c.content}</p>
        )}
        {!isEditing && (
            <div className="flex gap-3 mt-2">
              {onReplyToggle && <button onClick={onReplyToggle} className="text-[11px] text-gray-400 hover:text-[#1D9E75]">답글</button>}
              {isMine && (
                  <>
                    <button onClick={() => onEditStart(c.commentId, c.content)} className="text-[11px] text-gray-400 hover:text-[#1D9E75]">수정</button>
                    <button onClick={onDelete} className="text-[11px] text-gray-400 hover:text-red-500">삭제</button>
                  </>
              )}
            </div>
        )}
      </div>
  )
}

export default function ApprovalDocumentPage({
                                               form,
                                               onBack,
                                               onTempSave,
                                               readOnly = false,
                                               initialDocData,
                                               editingTempId,
                                               viewDocId,
                                               tempSaveRef,
                                             }: ApprovalDocumentPageProps) {
  const { user } = useAuth()
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [approvers, setApprovers] = useState<OrgMember[]>([])
  const [ccList, setCcList] = useState<OrgMember[]>([])
  const [viewers, setViewers] = useState<OrgMember[]>([])
  const [bottomTab, setBottomTab] = useState<'결재선' | '문서정보' | '댓글'>('결재선')
  const [comments, setComments] = useState<CommentResponse[]>([])
  const [commentInput, setCommentInput] = useState('')
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [replyInput, setReplyInput] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editInput, setEditInput] = useState('')
  const [_docData, setDocData] = useState<Record<string, string>>(initialDocData ?? {})
  const [docTitleInput, setDocTitleInput] = useState('')
  const [isEmergency, setIsEmergency] = useState(false)
  const [retention, setRetention] = useState(form.retention)
  const [submitting, setSubmitting] = useState(false)

  // 문서 상세 (조회 모드)
  const [docDetail, setDocDetail] = useState<DocumentDetailResponse | null>(null)
  const [formHtml, setFormHtml] = useState('')
  const [loadingForm, setLoadingForm] = useState(false)

  // 승인/반려 상태
  const [approving, setApproving] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [opinionModalOpen, setOpinionModalOpen] = useState(false)

  // 파일첨부 state
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const currentUser = {
    name: user?.empName ?? '사용자',
    position: '',
    department: '',
  }

  const today = new Date()
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}(${dayNames[today.getDay()]})`

  const totalFileSize = attachedFiles.reduce((s, f) => s + f.size, 0)
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0MB'
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  // 양식 HTML 로딩 (API에서 formHtml 가져오기)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- 화면 전환 시 로딩/상세 상태 리셋 필요
  useEffect(() => {
    const loadDocId = viewDocId ?? editingTempId
    if (loadDocId) {
      // 문서 상세 조회 모드 (기존 문서 또는 임시저장 문서)
      setLoadingForm(true)
      approvalApi.getDocument(loadDocId)
          .then(({ data }) => {
            setDocDetail(data)
            setDocTitleInput(data.docTitle ?? '')
            setFormHtml(data.formHtml)
            setDocData(data.docData ? JSON.parse(data.docData) : {})
            setIsEmergency(data.isEmergency)
            // 결재선 복원
            const approverMembers: OrgMember[] = data.approvalLines
                .filter((l) => l.approvalRole === 'APPROVER')
                .map((l) => ({ id: String(l.empId), empId: l.empId, name: l.empName, position: l.empGrade, department: l.empDeptName, deptId: l.empDeptId }))
            const ccMembers: OrgMember[] = data.approvalLines
                .filter((l) => l.approvalRole === 'REFERENCE')
                .map((l) => ({ id: String(l.empId), empId: l.empId, name: l.empName, position: l.empGrade, department: l.empDeptName, deptId: l.empDeptId }))
            const viewerMembers: OrgMember[] = data.approvalLines
                .filter((l) => l.approvalRole === 'VIEWER')
                .map((l) => ({ id: String(l.empId), empId: l.empId, name: l.empName, position: l.empGrade, department: l.empDeptName, deptId: l.empDeptId }))
            setApprovers(approverMembers)
            setCcList(ccMembers)
            setViewers(viewerMembers)

          })
          .catch((err) => { console.error('문서 조회 실패:', err); alert('문서를 불러올 수 없습니다.') })
          .finally(() => setLoadingForm(false))
      // 댓글 로딩
      approvalApi.getComments(loadDocId)
          .then(({ data }) => setComments(data))
          .catch(() => { /* ignore */ })
    } else if (form.formId) {
      // 새 문서 작성 - 양식 HTML 가져오기
      setDocDetail(null)
      setLoadingForm(true)
      approvalApi.getFormDetail(form.formId)
          .then(({ data }) => {
            setFormHtml(data.formHtml)
          })
          .catch(() => {
            setFormHtml(`<h2 class="form-title">${form.name}</h2><table class="form-table"><tr><td class="form-label">제목</td><td><input type="text" name="title" placeholder="제목을 입력하세요"></td></tr><tr><td class="form-label" style="vertical-align:top;">내용</td><td><textarea name="content" rows="14" placeholder="내용을 입력하세요"></textarea></td></tr></table>`)
          })
          .finally(() => setLoadingForm(false))
    }
  }, [viewDocId, editingTempId, form.formId, form.name])

  /* ── form_html 렌더링 + doc_data 바인딩 ── */
  const collectValues = useCallback(() => {
    if (!formRef.current) return
    const data: Record<string, string> = {}
    formRef.current.querySelectorAll<HTMLInputElement>('input, textarea, select').forEach((el) => {
      if (!el.name) return
      if (el.type === 'radio') {
        if (el.checked) data[el.name] = el.value
      } else if (el.type === 'checkbox') {
        data[el.name] = el.checked ? 'true' : 'false'
      } else {
        data[el.name] = el.value
      }
    })
    setDocData(data)
  }, [])

  useEffect(() => {
    if (!formRef.current || !formHtml) return
    formRef.current.innerHTML = formHtml

    // name 속성이 없는 input/textarea/select에 자동 name 부여
    formRef.current.querySelectorAll<HTMLInputElement>('input, textarea, select').forEach((el, idx) => {
      if (!el.name) el.name = `field_${idx}`
    })

    if (readOnly) formRef.current.classList.add('form-readonly')

    const dataToFill = (initialDocData && Object.keys(initialDocData).length > 0)
        ? initialDocData
        : (docDetail?.docData ? JSON.parse(docDetail.docData) : {})
    Object.entries(dataToFill).forEach(([name, value]) => {
      const els = formRef.current!.querySelectorAll<HTMLInputElement>(`[name="${name}"]`)
      els.forEach((el) => {
        if (el.type === 'radio') {
          el.checked = el.value === value
        } else if (el.type === 'checkbox') {
          el.checked = value === 'true'
        } else {
          el.value = value as string
        }
      })
    })

    if (!readOnly) {
      const handler = () => collectValues()
      formRef.current.addEventListener('input', handler)
      formRef.current.addEventListener('change', handler)
      const ref = formRef.current
      return () => {
        ref.removeEventListener('input', handler)
        ref.removeEventListener('change', handler)
      }
    }
  }, [formHtml, readOnly, initialDocData, collectValues, docDetail])

  /* ── 파일 추가 ── */
  const addFiles = (files: FileList | File[]) => {
    const newFiles = Array.from(files).map((f) => ({
      file: f,
      name: f.name,
      size: f.size,
    }))
    setAttachedFiles((prev) => [...prev, ...newFiles])
  }

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
  }

  /* ── 댓글 핸들러 ── */
  const handleAddComment = async () => {
    if (!commentInput.trim() || !viewDocId) return
    try {
      const { data } = await approvalApi.createComment(viewDocId, { parentCommentId: null, content: commentInput.trim() })
      setComments((p) => [...p, data])
      setCommentInput('')
    } catch { alert('댓글 등록에 실패했습니다.') }
  }

  const handleAddReply = async (parentId: number) => {
    if (!replyInput.trim() || !viewDocId) return
    try {
      const { data } = await approvalApi.createComment(viewDocId, { parentCommentId: parentId, content: replyInput.trim() })
      setComments((p) => [...p, data])
      setReplyInput('')
      setReplyTo(null)
    } catch { alert('답글 등록에 실패했습니다.') }
  }

  const handleEditComment = async (commentId: number) => {
    if (!editInput.trim() || !viewDocId) return
    try {
      const { data } = await approvalApi.updateComment(viewDocId, commentId, { content: editInput.trim() })
      setComments((p) => p.map((c) => c.commentId === commentId ? data : c))
      setEditingCommentId(null)
    } catch { alert('댓글 수정에 실패했습니다.') }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!viewDocId || !confirm('댓글을 삭제하시겠습니까?')) return
    try {
      await approvalApi.deleteComment(viewDocId, commentId)
      setComments((p) => p.filter((c) => c.commentId !== commentId))
    } catch { alert('댓글 삭제에 실패했습니다.') }
  }

  /* ── 결재선 → API 요청 형식 변환 ── */
  const buildApprovalLines = (): ApprovalLineRequest[] => {
    const lines: ApprovalLineRequest[] = []
    approvers.forEach((a, idx) => {
      lines.push({
        empId: a.empId ?? Number(a.id),
        empName: a.name,
        empDeptId: a.deptId,
        empDeptName: a.department,
        empGrade: a.position,
        empTitle: a.title ?? '',
        approvalRole: 'APPROVER',
        lineStep: idx + 1,
      })
    })
    ccList.forEach((m) => {
      lines.push({
        empId: m.empId ?? Number(m.id),
        empName: m.name,
        empDeptId: m.deptId,
        empDeptName: m.department,
        empGrade: m.position,
        empTitle: m.title ?? '',
        approvalRole: 'REFERENCE',
        lineStep: 0,
      })
    })
    viewers.forEach((m) => {
      lines.push({
        empId: m.empId ?? Number(m.id),
        empName: m.name,
        empDeptId: m.deptId,
        empDeptName: m.department,
        empGrade: m.position,
        empTitle: m.title ?? '',
        approvalRole: 'VIEWER',
        lineStep: 0,
      })
    })
    return lines
  }

  const buildRequest = (): DocumentCreateRequest => {
    collectValues()
    // formRef에서 최신 값 직접 수집
    const latestData: Record<string, string> = {}
    if (formRef.current) {
      formRef.current.querySelectorAll<HTMLInputElement>('input, textarea, select').forEach((el) => {
        if (!el.name) return
        if (el.type === 'radio') { if (el.checked) latestData[el.name] = el.value }
        else if (el.type === 'checkbox') { latestData[el.name] = el.checked ? 'true' : 'false' }
        else { latestData[el.name] = el.value }
      })
    }
    return {
      formId: docDetail?.formId ?? form.formId,
      docTitle: docTitleInput.trim() || latestData.title || latestData['제목'] || docDetail?.docTitle || form.name,
      docType: form.folder,
      docData: JSON.stringify(latestData),
      isEmergency,
      approvalLines: buildApprovalLines(),
    }
  }

  /* ── 임시저장 ── */
  const handleTempSave = async () => {
    setSubmitting(true)
    try {
      const req = buildRequest()
      let docId: number
      if (editingTempId) {
        await approvalApi.updateTempDocument(editingTempId, {
          docTitle: req.docTitle,
          docData: req.docData,
          isEmergency: req.isEmergency,
          approvalLines: req.approvalLines,
        })
        docId = editingTempId
      } else {
        const { data } = await approvalApi.createTempDocument(req)
        docId = data
      }
      onTempSave?.({
        id: docId,
        form,
        docData: JSON.parse(req.docData),
        savedAt: new Date().toISOString(),
      })
      alert('임시저장되었습니다.')
      onBack()
    } catch (err) {
      console.error('임시저장 실패:', err)
      alert('임시저장에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  // 외부에서 임시저장 트리거할 수 있도록 ref 등록
  useEffect(() => {
    if (tempSaveRef) tempSaveRef.current = handleTempSave
    return () => { if (tempSaveRef) tempSaveRef.current = null }
  })

  /* ── 문서 액션 조건 ── */
  const isDrafter = readOnly && docDetail && String(docDetail.empId) === user?.empId
  const canApprove = readOnly && docDetail && docDetail.approvalLines?.some(
      (l) => String(l.empId) === user?.empId && l.approvalRole === 'APPROVER' && l.approvalLineStatus === 'PENDING'
  )
  const canRecall = isDrafter && docDetail?.approvalStatus === 'PENDING'
  const canResubmit = isDrafter && docDetail?.approvalStatus === 'REJECTED'
  const canReceive = readOnly && docDetail && docDetail.approvalStatus === 'APPROVED' && docDetail.approvalLines?.some(
      (l) => String(l.empId) === user?.empId && l.approvalRole === 'APPROVER' && !l.isRead
  )
  const canRead = readOnly && docDetail && docDetail.approvalLines?.some(
      (l) => String(l.empId) === user?.empId && l.approvalRole === 'VIEWER' && !l.isRead
  )
  const canCcConfirm = readOnly && docDetail && docDetail.approvalLines?.some(
      (l) => String(l.empId) === user?.empId && l.approvalRole === 'REFERENCE' && !l.isRead
  )

  // 결재자가 문서를 열었을 때 기안 의견 모달 표시
  // eslint-disable-next-line react-hooks/set-state-in-effect -- 문서 로딩 후 의견 모달 즉시 표시 필요
  useEffect(() => {
    if (canApprove && docDetail?.docOpinion) {
      setOpinionModalOpen(true)
    }
  }, [canApprove, docDetail])

  const handleApprove = async (comment?: string) => {
    if (!viewDocId) return
    setApproving(true)
    try {
      await approvalApi.approveDocument(viewDocId, comment)
      alert('승인되었습니다.')
      onBack()
    } catch {
      alert('승인에 실패했습니다.')
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async (reason: string) => {
    if (!viewDocId || !reason.trim()) { alert('반려 사유를 입력해주세요.'); return }
    setApproving(true)
    try {
      await approvalApi.rejectDocument(viewDocId, reason)
      alert('반려되었습니다.')
      onBack()
    } catch {
      alert('반려에 실패했습니다.')
    } finally {
      setApproving(false)
      setRejectModalOpen(false)
    }
  }

  const handleRecall = async () => {
    if (!viewDocId) return
    if (!confirm('상신을 취소(회수)하시겠습니까?')) return
    setApproving(true)
    try {
      await approvalApi.recallDocument(viewDocId)
      alert('회수되었습니다.')
      onBack()
    } catch {
      alert('회수에 실패했습니다.')
    } finally {
      setApproving(false)
    }
  }

  const handleResubmit = async () => {
    if (!viewDocId) return
    setApproving(true)
    try {
      collectValues()
      const latestData: Record<string, string> = {}
      if (formRef.current) {
        formRef.current.querySelectorAll<HTMLInputElement>('input, textarea, select').forEach((el) => {
          if (!el.name) return
          if (el.type === 'radio') { if (el.checked) latestData[el.name] = el.value }
          else if (el.type === 'checkbox') { latestData[el.name] = el.checked ? 'true' : 'false' }
          else { latestData[el.name] = el.value }
        })
      }
      await approvalApi.resubmitDocument(viewDocId, {
        docTitle: docTitleInput.trim() || latestData.title || latestData['제목'] || docDetail?.docTitle || form.name,
        docData: JSON.stringify(latestData),
        isEmergency,
        approvalLines: buildApprovalLines(),
      })
      alert('재기안되었습니다.')
      onBack()
    } catch {
      alert('재기안에 실패했습니다.')
    } finally {
      setApproving(false)
    }
  }

  const handleReceive = async () => {
    if (!viewDocId) return
    try {
      await approvalApi.receiveDocument(viewDocId)
      alert('수신 확인되었습니다.')
      onBack()
    } catch { alert('수신 확인에 실패했습니다.') }
  }

  const handleRead = async () => {
    if (!viewDocId) return
    try {
      await approvalApi.readDocument(viewDocId)
      alert('열람 확인되었습니다.')
      onBack()
    } catch { alert('열람 확인에 실패했습니다.') }
  }

  const handleCcConfirm = async () => {
    if (!viewDocId) return
    try {
      await approvalApi.ccConfirmDocument(viewDocId)
      alert('참조 확인되었습니다.')
      onBack()
    } catch { alert('참조 확인에 실패했습니다.') }
  }

  /* ── 결재요청 ── */
  const [submitModalOpen, setSubmitModalOpen] = useState(false)

  const handleSubmitClick = () => {
    if (approvers.length === 0) {
      alert('결재선을 설정해주세요.')
      setInfoModalOpen(true)
      return
    }
    collectValues()
    setSubmitModalOpen(true)
  }

  const handleSubmitConfirm = async (opinion: string, urgent: boolean, title: string) => {
    setSubmitting(true)
    try {
      if (title.trim()) setDocTitleInput(title.trim())
      const req = buildRequest()
      if (title.trim()) req.docTitle = title.trim()
      req.isEmergency = urgent
      if (opinion.trim()) req.docOpinion = opinion.trim()

      let docId: number

      if (editingTempId) {
        // 임시저장 문서 → 상신
        await approvalApi.updateTempDocument(editingTempId, {
          docTitle: req.docTitle,
          docData: req.docData,
          isEmergency: req.isEmergency,
          approvalLines: req.approvalLines,
        })
        await approvalApi.submitDocument(editingTempId)
        docId = editingTempId
      } else {
        // 새 문서 기안 (생성 + 즉시 상신)
        const { data } = await approvalApi.createDocument(req)
        docId = data
      }

      // 첨부파일 업로드
      if (attachedFiles.length > 0) {
        await approvalApi.uploadAttachments(docId, attachedFiles.map((f) => f.file))
      }

      setSubmitModalOpen(false)
      alert('결재 요청되었습니다.')
      onBack()
    } catch (err) {
      console.error('결재 요청 실패:', err)
      alert('결재 요청에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  /* ── 미리보기 (새 창) ── */
  const handlePreview = () => {
    // DOM 입력값을 attribute에 동기화하여 innerHTML에 반영
    let renderedFormHtml = formHtml
    if (formRef.current) {
      formRef.current.querySelectorAll<HTMLInputElement>('input').forEach((el) => {
        if (el.type === 'radio' || el.type === 'checkbox') {
          if (el.checked) el.setAttribute('checked', 'checked')
          else el.removeAttribute('checked')
        } else {
          el.setAttribute('value', el.value)
        }
      })
      formRef.current.querySelectorAll<HTMLTextAreaElement>('textarea').forEach((el) => {
        el.textContent = el.value
      })
      formRef.current.querySelectorAll<HTMLSelectElement>('select').forEach((el) => {
        Array.from(el.options).forEach((opt) => {
          if (opt.selected) opt.setAttribute('selected', 'selected')
          else opt.removeAttribute('selected')
        })
      })
      renderedFormHtml = formRef.current.innerHTML
    }
    const previewWindow = window.open('', '_blank', 'width=900,height=800,scrollbars=yes')
    if (!previewWindow) return

    const approverHeaders = approvers.map((a) => `<td style="padding:4px 16px;border:1px solid #d1d5db;text-align:center;color:#6b7280;font-weight:500;min-width:70px;">${a.position}</td>`).join('')
    const approverNames = approvers.map((a) => `<td style="padding:12px 16px;border:1px solid #d1d5db;text-align:center;">${a.name}</td>`).join('')
    const approverSep = approvers.length > 0
        ? `<td rowspan="2" style="background:#f9fafb;padding:4px 8px;border:1px solid #d1d5db;font-weight:600;text-align:center;writing-mode:vertical-rl;">승인</td>`
        : ''

    previewWindow.document.write(`<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"><title>${form.name} - 미리보기</title>
<style>
  body { font-family: 'Pretendard', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #111827; font-size: 13px; }
  .header { display: flex; gap: 24px; margin-bottom: 32px; }
  .info-table td { border: 1px solid #d1d5db; padding: 8px 16px; font-size: 12px; }
  .info-table .label { background: #f9fafb; font-weight: 600; color: #374151; width: 80px; }
  .approval-table td { font-size: 12px; }
  .section-title { font-size: 13px; font-weight: 600; margin: 24px 0 8px; }
  .file-item { background: #f9fafb; border-radius: 4px; padding: 6px 12px; margin: 4px 0; font-size: 12px; }
  .approval-form-content table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; }
  .approval-form-content table td, .approval-form-content table th { border: 1px solid #d1d5db; padding: 8px 12px; vertical-align: middle; word-break: break-word; }
  .approval-form-content table th { background-color: #f9fafb; font-weight: 600; color: #374151; text-align: center; }
  .approval-form-content table input, .approval-form-content table textarea, .approval-form-content table select { width: 100%; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; font-size: 12px; outline: none; box-sizing: border-box; }
  .form-readonly input, .form-readonly textarea, .form-readonly select { background-color: #f9fafb; pointer-events: none; color: #374151; }
  .form-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .form-table td, .form-table th { border: 1px solid #d1d5db; padding: 8px 12px; vertical-align: middle; }
  .form-table .form-label { background-color: #f9fafb; font-weight: 600; color: #374151; text-align: center; width: 120px; }
</style></head><body>
<h1 style="text-align:center;font-size:20px;font-weight:700;margin-bottom:24px;">${form.name}</h1>
<div class="header">
  <table class="info-table"><tbody>
    <tr><td class="label">기안자</td><td style="width:140px;">${currentUser.name}</td></tr>
    <tr><td class="label">기안일</td><td>${dateStr}</td></tr>
    <tr><td class="label">문서번호</td><td style="color:#9ca3af;">${docDetail?.docNum ?? ''}</td></tr>
  </tbody></table>
  <table class="approval-table" style="border-collapse:collapse;align-self:start;"><tbody>
    <tr>
      <td rowspan="2" style="background:#f9fafb;padding:4px 8px;border:1px solid #d1d5db;font-weight:600;text-align:center;writing-mode:vertical-rl;">신청</td>
      <td style="padding:4px 16px;border:1px solid #d1d5db;text-align:center;color:#6b7280;font-weight:500;min-width:70px;">${currentUser.position}</td>
      ${approverSep}
      ${approverHeaders}
    </tr>
    <tr>
      <td style="padding:12px 16px;border:1px solid #d1d5db;text-align:center;">${currentUser.name}</td>
      ${approverNames}
    </tr>
  </tbody></table>
</div>
<div class="approval-form-content form-readonly">${renderedFormHtml}</div>
${attachedFiles.length > 0 ? `
<div class="section-title">파일첨부</div>
${attachedFiles.map((f) => `<div class="file-item">${f.name} (${formatSize(f.size)})</div>`).join('')}
` : ''}
</body></html>`)
    previewWindow.document.close()

  }

  /* ── 툴바 ── */
  const Toolbar = () => (
      <div className="flex items-center gap-4 px-4 py-2 text-[12px] text-gray-600 border-b border-gray-200 bg-white">
        {!readOnly && (
            <>
              <button onClick={handleSubmitClick} disabled={submitting} className="flex items-center gap-1 hover:text-[#1D9E75] transition-colors disabled:opacity-50">
                <i className="fas fa-pen text-[10px]" /> 결재요청
              </button>
              <button onClick={handleTempSave} disabled={submitting} className="flex items-center gap-1 hover:text-[#1D9E75] transition-colors disabled:opacity-50">
                <i className="fas fa-save text-[10px]" /> 임시저장
              </button>
            </>
        )}
        {canApprove && (
            <>
              <button onClick={() => setApproveModalOpen(true)} disabled={approving} className="flex items-center gap-1 hover:text-[#1D9E75] transition-colors disabled:opacity-50">
                <i className="fas fa-check text-[10px]" /> 승인
              </button>
              <button onClick={() => setRejectModalOpen(true)} disabled={approving} className="flex items-center gap-1 hover:text-red-500 transition-colors disabled:opacity-50">
                <i className="fas fa-times text-[10px]" /> 반려
              </button>
            </>
        )}
        {canRecall && (
            <button onClick={handleRecall} disabled={approving} className="flex items-center gap-1 hover:text-orange-500 transition-colors disabled:opacity-50">
              <i className="fas fa-undo text-[10px]" /> 회수
            </button>
        )}
        {canResubmit && (
            <button onClick={handleResubmit} disabled={approving} className="flex items-center gap-1 hover:text-[#1D9E75] transition-colors disabled:opacity-50">
              <i className="fas fa-redo text-[10px]" /> 재기안
            </button>
        )}
        {canReceive && (
            <button onClick={handleReceive} disabled={approving} className="flex items-center gap-1 hover:text-[#1D9E75] transition-colors disabled:opacity-50">
              <i className="fas fa-inbox text-[10px]" /> 수신확인
            </button>
        )}
        {canRead && (
            <button onClick={handleRead} disabled={approving} className="flex items-center gap-1 hover:text-[#1D9E75] transition-colors disabled:opacity-50">
              <i className="fas fa-book-open text-[10px]" /> 열람확인
            </button>
        )}
        {canCcConfirm && (
            <button onClick={handleCcConfirm} disabled={approving} className="flex items-center gap-1 hover:text-[#1D9E75] transition-colors disabled:opacity-50">
              <i className="fas fa-user-check text-[10px]" /> 참조확인
            </button>
        )}
        <button onClick={handlePreview} className="flex items-center gap-1 hover:text-[#1D9E75] transition-colors">
          <i className="fas fa-eye text-[10px]" /> 미리보기
        </button>
        {readOnly && (
            <button onClick={onBack} className="flex items-center gap-1 hover:text-gray-600 transition-colors">
              <i className="fas fa-arrow-left text-[10px]" /> 목록
            </button>
        )}
        {!readOnly && (
            <button onClick={onBack} className="flex items-center gap-1 hover:text-red-400 transition-colors">
              <i className="fas fa-times-circle text-[10px]" /> 취소
            </button>
        )}
        <button
            onClick={() => setInfoModalOpen(true)}
            className="flex items-center gap-1 hover:text-[#1D9E75] transition-colors"
        >
          <i className="fas fa-info-circle text-[10px]" /> 결재 정보
        </button>
      </div>
  )

  if (loadingForm) {
    return (
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-gray-400 text-[14px]">양식 로딩 중...</div>
        </div>
    )
  }

  return (
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <Toolbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[800px] mx-auto py-8 px-4">
            {/* 기안 정보 (좌) + 결재선 미리보기 (우) */}
            <div className="flex justify-between items-start mb-8">
              <table className="text-[12px] border border-gray-300">
                <tbody>
                <tr>
                  <td className="bg-gray-50 px-4 py-2 font-semibold text-gray-700 border border-gray-300 w-20">기안자</td>
                  <td className="px-4 py-2 border border-gray-300 w-36">{docDetail?.empName ?? currentUser.name}</td>
                </tr>
                <tr>
                  <td className="bg-gray-50 px-4 py-2 font-semibold text-gray-700 border border-gray-300">소속</td>
                  <td className="px-4 py-2 border border-gray-300">{docDetail?.empDeptName ?? currentUser.department}</td>
                </tr>
                <tr>
                  <td className="bg-gray-50 px-4 py-2 font-semibold text-gray-700 border border-gray-300">기안일</td>
                  <td className="px-4 py-2 border border-gray-300">{docDetail?.docSubmittedAt?.slice(0, 10) ?? dateStr}</td>
                </tr>
                <tr>
                  <td className="bg-gray-50 px-4 py-2 font-semibold text-gray-700 border border-gray-300">문서번호</td>
                  <td className="px-4 py-2 border border-gray-300 text-gray-400">{docDetail?.docNum ?? ''}</td>
                </tr>
                </tbody>
              </table>

              <table className="text-[12px] border border-gray-300 self-start">
                <tbody>
                {/* 직급 행 */}
                {/* 직급 행 */}
                <tr>
                  <td rowSpan={4} className="bg-gray-50 px-2 py-1 border border-gray-300 text-gray-700 font-semibold text-center">
                    <span className="[writing-mode:vertical-rl]">신청</span>
                  </td>
                  <td className="px-4 py-1 border border-gray-300 text-gray-500 font-medium text-center min-w-[70px]">
                    {docDetail?.empGrade ?? currentUser.position}
                  </td>
                  {approvers.length > 0 && (
                      <td rowSpan={4} className="bg-gray-50 px-2 py-1 border border-gray-300 text-gray-700 font-semibold text-center">
                        <span className="[writing-mode:vertical-rl]">승인</span>
                      </td>
                  )}
                  {approvers.map((a) => (
                      <td key={a.id} className="px-4 py-1 border border-gray-300 text-gray-500 font-medium text-center min-w-[70px]">
                        {a.position}
                      </td>
                  ))}
                </tr>
                {/* 서명 행 */}
                <tr>
                  <td className="px-4 py-2 border border-gray-300 text-center h-[52px]">
                    {docDetail?.drafterSigUrl ? (
                        <img src={docDetail.drafterSigUrl} alt="서명" className="h-10 mx-auto object-contain" />
                    ) : (
                        <span className="text-[11px] text-gray-300">{docDetail ? '서명' : ''}</span>
                    )}
                  </td>
                  {approvers.map((a) => {
                    const empId = a.empId ?? Number(a.id)
                    const line = docDetail?.approvalLines?.find((l) => l.empId === empId && l.approvalRole === 'APPROVER')
                    const isApproved = line?.approvalLineStatus === 'APPROVED'
                    const isRejected = line?.approvalLineStatus === 'REJECTED'
                    return (
                        <td key={a.id} className="px-4 py-2 border border-gray-300 text-center h-[52px]">
                          {isApproved && line?.sigUrl ? (
                              <img src={line.sigUrl} alt="서명" className="h-10 mx-auto object-contain" />
                          ) : isApproved ? (
                              <span className="text-[11px] text-[#1D9E75] font-semibold">승인</span>
                          ) : isRejected ? (
                              <span className="text-[11px] text-red-500 font-semibold">반려</span>
                          ) : (
                              <span className="text-[11px] text-gray-300">{docDetail ? '대기' : ''}</span>
                          )}
                        </td>
                    )
                  })}
                </tr>
                {/* 이름 행 */}
                <tr>
                  <td className="px-4 py-2 border border-gray-300 text-center text-gray-800">
                    {docDetail?.empName ?? currentUser.name}
                  </td>
                  {approvers.map((a) => (
                      <td key={a.id} className="px-4 py-2 border border-gray-300 text-center text-gray-800">
                        {a.name}
                      </td>
                  ))}
                </tr>
                {/* 날짜 행 */}
                <tr>
                  <td className="px-4 py-1 border border-gray-300 text-center text-[10px] text-gray-400">
                    {docDetail?.docSubmittedAt?.slice(0, 10) ?? ''}
                  </td>
                  {approvers.map((a) => {
                    const empId = a.empId ?? Number(a.id)
                    const line = docDetail?.approvalLines?.find((l) => l.empId === empId && l.approvalRole === 'APPROVER')
                    const isRejected = line?.approvalLineStatus === 'REJECTED'
                    return (
                        <td key={a.id} className={`px-4 py-1 border border-gray-300 text-center text-[10px] ${isRejected ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                          {line?.lineProcessedAt?.slice(0, 10) ?? ''}
                        </td>
                    )
                  })}
                </tr>
                </tbody>
              </table>
            </div>

            {/* ── form_html 렌더링 영역 ── */}
            <div ref={formRef} className="approval-form-content mb-8" />

            {/* ── 파일첨부 ── */}
            <div className="mt-8 mb-4">
              <div className="flex items-center gap-1 text-[13px] font-semibold text-[#000000] mb-2">
                파일첨부
                <span className="text-gray-400 text-[11px] font-normal cursor-help" title="파일을 첨부합니다">&#9432;</span>
              </div>
              <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }}
              />
              <div
                  className={`border border-dashed rounded-lg py-6 text-center text-[12px] transition-colors ${
                      isDragOver ? 'border-[#1D9E75] bg-[#E1F5EE]' : 'border-gray-300 text-gray-400'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
              >
                <i className="fas fa-paperclip text-gray-300 mr-1" />
                이곳에 파일을 드래그 하세요. 또는{' '}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[#000000] underline hover:text-gray-600"
                >
                  파일선택
                </button>
                <span className="text-gray-300 ml-1">({formatSize(totalFileSize)})</span>
              </div>
              {attachedFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {attachedFiles.map((f, i) => (
                        <div key={i} className="flex items-center justify-between text-[12px] bg-gray-50 rounded px-3 py-1.5">
                          <div className="flex items-center gap-2">
                            <i className="fas fa-file text-gray-400 text-[10px]" />
                            <span className="text-gray-700">{f.name}</span>
                            <span className="text-gray-400">({formatSize(f.size)})</span>
                          </div>
                          {!readOnly && (
                              <button onClick={() => removeFile(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                                <i className="fas fa-times" />
                              </button>
                          )}
                        </div>
                    ))}
                  </div>
              )}
              {/* 기존 첨부파일 (문서 조회 모드) */}
              {docDetail?.attachments && docDetail.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {docDetail.attachments.map((att) => (
                        <div key={att.attachId} className="flex items-center justify-between text-[12px] bg-gray-50 rounded px-3 py-1.5">
                          <div className="flex items-center gap-2">
                            <i className="fas fa-file text-gray-400 text-[10px]" />
                            <span className="text-gray-700">{att.fileName}</span>
                            <span className="text-gray-400">({formatSize(att.fileSize)})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                                onClick={async () => {
                                  try {
                                    const { data: url } = await approvalApi.getAttachmentDownloadUrl(att.attachId)
                                    window.open(url, '_blank')
                                  } catch { alert('다운로드 URL을 가져올 수 없습니다.') }
                                }}
                                className="text-gray-500 hover:text-[#1D9E75] transition-colors text-[11px]"
                            >
                              <i className="fas fa-download" />
                            </button>
                            {isDrafter && docDetail?.approvalStatus === 'DRAFT' && (
                                <button
                                    onClick={async () => {
                                      if (!confirm(`${att.fileName} 파일을 삭제하시겠습니까?`)) return
                                      try {
                                        await approvalApi.deleteAttachment(att.attachId)
                                        setDocDetail((prev) => prev ? { ...prev, attachments: prev.attachments.filter((a) => a.attachId !== att.attachId) } : prev)
                                      } catch { alert('첨부파일 삭제에 실패했습니다.') }
                                    }}
                                    className="text-gray-300 hover:text-red-400 transition-colors text-[11px]"
                                >
                                  <i className="fas fa-times" />
                                </button>
                            )}
                          </div>
                        </div>
                    ))}
                  </div>
              )}
            </div>

            {/* ── 하단 결재선 / 문서정보 ── */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex gap-4 mb-4 text-[13px]">
                <button
                    onClick={() => setBottomTab('결재선')}
                    className={`pb-1 ${bottomTab === '결재선' ? 'font-bold text-gray-900 border-b-2 border-gray-900' : 'text-gray-400'}`}
                >
                  결재선
                </button>
                <button
                    onClick={() => setBottomTab('문서정보')}
                    className={`pb-1 ${bottomTab === '문서정보' ? 'font-bold text-gray-900 border-b-2 border-gray-900' : 'text-gray-400'}`}
                >
                  문서정보
                </button>
                <button
                    onClick={() => setBottomTab('댓글')}
                    className={`pb-1 ${bottomTab === '댓글' ? 'font-bold text-gray-900 border-b-2 border-gray-900' : 'text-gray-400'}`}
                >
                  댓글 {comments.length > 0 && <span className="text-[11px] text-[#1D9E75] ml-1">{comments.length}</span>}
                </button>
              </div>

              {bottomTab === '결재선' ? (
                  <div className="space-y-3">
                    <ApproverCard name={docDetail?.empName ?? currentUser.name} position={docDetail?.empGrade ?? currentUser.position} department={docDetail?.empDeptName ?? currentUser.department} role="기안" />
                    {approvers.map((a) => (
                        <ApproverCard key={a.id} name={a.name} position={a.position} department={a.department} role="결재 예정" />
                    ))}
                    {approvers.length === 0 && (
                        <div className="text-[12px] text-gray-400 py-4 text-center">결재 정보에서 결재선을 설정해주세요.</div>
                    )}
                  </div>
              ) : bottomTab === '문서정보' ? (
                  <div className="text-[13px] space-y-5 pl-2">
                    <div className="flex items-center">
                      <span className="w-24 font-semibold text-[#000000]">문서번호</span>
                      <span className="text-gray-400 text-[12px]">{docDetail?.docNum ?? ''}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-24 font-semibold text-[#000000]">전사문서함</span>
                      <span className="inline-block text-[11px] bg-gray-100 border border-gray-300 rounded px-2 py-0.5 text-gray-700 mr-2">
                    {form.folder}
                  </span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-24 font-semibold text-[#000000]">보존연한</span>
                      <select
                          value={retention}
                          onChange={(e) => setRetention(e.target.value)}
                          disabled={readOnly}
                          className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none"
                      >
                        {RETENTION_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="flex items-start">
                      <span className="w-24 font-semibold text-[#000000] pt-0.5">문서참조</span>
                      <div className="flex flex-wrap gap-1">
                        {ccList.length === 0
                            ? <span className="text-gray-400 text-[12px]"></span>
                            : ccList.map((m) => (
                                <span key={m.id} className="text-[11px] bg-gray-100 border border-gray-200 rounded px-2 py-0.5 text-gray-700">
                            {m.name} {m.position}
                          </span>
                            ))
                        }
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="w-24 font-semibold text-[#000000] pt-0.5">문서열람</span>
                      <div className="flex flex-wrap gap-1">
                        {viewers.length === 0
                            ? <span className="text-gray-400 text-[12px]"></span>
                            : viewers.map((m) => (
                                <span key={m.id} className="text-[11px] bg-gray-100 border border-gray-200 rounded px-2 py-0.5 text-gray-700">
                            {m.name} {m.position}
                          </span>
                            ))
                        }
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="w-24 font-semibold text-[#000000] pt-0.5">긴급문서</span>
                      <div>
                        <label className="flex items-center gap-1.5 cursor-pointer text-gray-700">
                          <input
                              type="checkbox"
                              checked={isEmergency}
                              onChange={(e) => setIsEmergency(e.target.checked)}
                              disabled={readOnly}
                              className="accent-[#1D9E75] w-4 h-4"
                          />
                          긴급
                        </label>
                        <p className="text-[11px] text-gray-500 mt-1">결재자의 대기문서 가장 상단에 표시됩니다.</p>
                      </div>
                    </div>
                  </div>
              ) : (
                  /* ── 댓글 탭 ── */
                  <div className="space-y-3">
                    {/* 댓글 입력 */}
                    <div className="flex gap-2">
                      <input
                          type="text"
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && commentInput.trim()) handleAddComment() }}
                          placeholder="댓글을 입력하세요"
                          className="flex-1 border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75]"
                      />
                      <button
                          onClick={handleAddComment}
                          disabled={!commentInput.trim()}
                          className="px-4 py-2 bg-[#1D9E75] text-white text-[12px] rounded hover:bg-[#178a64] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        등록
                      </button>
                    </div>

                    {/* 댓글 목록 */}
                    {comments.length === 0 ? (
                        <div className="text-[12px] text-gray-400 py-6 text-center">댓글이 없습니다.</div>
                    ) : (
                        comments.filter((c) => !c.parentCommentId).map((c) => (
                            <div key={c.commentId} className="space-y-2">
                              {/* 최상위 댓글 */}
                              <CommentItem
                                  comment={c}
                                  currentEmpId={Number(user?.empId)}
                                  editingCommentId={editingCommentId}
                                  editInput={editInput}
                                  onEditStart={(id, content) => { setEditingCommentId(id); setEditInput(content) }}
                                  onEditCancel={() => setEditingCommentId(null)}
                                  onEditSave={() => handleEditComment(c.commentId)}
                                  onEditInputChange={setEditInput}
                                  onDelete={() => handleDeleteComment(c.commentId)}
                                  onReplyToggle={() => setReplyTo(replyTo === c.commentId ? null : c.commentId)}
                              />
                              {/* 대댓글 */}
                              {comments.filter((r) => r.parentCommentId === c.commentId).map((r) => (
                                  <div key={r.commentId} className="ml-8">
                                    <CommentItem
                                        comment={r}
                                        currentEmpId={Number(user?.empId)}
                                        editingCommentId={editingCommentId}
                                        editInput={editInput}
                                        onEditStart={(id, content) => { setEditingCommentId(id); setEditInput(content) }}
                                        onEditCancel={() => setEditingCommentId(null)}
                                        onEditSave={() => handleEditComment(r.commentId)}
                                        onEditInputChange={setEditInput}
                                        onDelete={() => handleDeleteComment(r.commentId)}
                                    />
                                  </div>
                              ))}
                              {/* 대댓글 입력 */}
                              {replyTo === c.commentId && (
                                  <div className="ml-8 flex gap-2">
                                    <input
                                        type="text"
                                        value={replyInput}
                                        onChange={(e) => setReplyInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && replyInput.trim()) handleAddReply(c.commentId) }}
                                        placeholder="답글을 입력하세요"
                                        className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-[12px] outline-none focus:border-[#1D9E75]"
                                    />
                                    <button onClick={() => handleAddReply(c.commentId)} disabled={!replyInput.trim()} className="px-3 py-1.5 bg-[#1D9E75] text-white text-[11px] rounded hover:bg-[#178a64] disabled:opacity-40">등록</button>
                                    <button onClick={() => setReplyTo(null)} className="px-3 py-1.5 border border-gray-300 text-[11px] rounded text-gray-500 hover:bg-gray-50">취소</button>
                                  </div>
                              )}
                            </div>
                        ))
                    )}
                  </div>
              )}
            </div>
          </div>
        </div>

        <ApprovalInfoModal
            key={String(infoModalOpen)}
            isOpen={infoModalOpen}
            onClose={() => setInfoModalOpen(false)}
            approvers={approvers}
            ccList={ccList}
            viewers={viewers}
            readOnly={readOnly}
            approvalLines={docDetail?.approvalLines}
            onSave={(newApprovers, newCc, newViewers) => {
              setApprovers(newApprovers)
              setCcList(newCc)
              setViewers(newViewers)
              setInfoModalOpen(false)
            }}
        />

        <SubmitModal
            isOpen={submitModalOpen}
            formName={form.name}
            onClose={() => setSubmitModalOpen(false)}
            onSubmit={handleSubmitConfirm}
            submitting={submitting}
        />

        {docDetail?.docOpinion && (
            <OpinionModal
                isOpen={opinionModalOpen}
                opinion={docDetail.docOpinion}
                drafterName={docDetail.empName}
                onClose={() => setOpinionModalOpen(false)}
            />
        )}

        <ApproveModal
            isOpen={approveModalOpen}
            onClose={() => setApproveModalOpen(false)}
            onApprove={handleApprove}
            submitting={approving}
        />

        <RejectModal
            isOpen={rejectModalOpen}
            onClose={() => setRejectModalOpen(false)}
            onReject={handleReject}
            submitting={approving}
        />
      </div>
  )
}

function ApproverCard({ name, position, department, role }: {
  name: string; position: string; department: string; role: string
}) {
  return (
      <div className="flex items-center gap-3 py-2 border-b border-gray-100">
        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 shrink-0">
          <i className="fas fa-user text-sm" />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold text-gray-900">{name} {position}</div>
          <div className="text-[11px] text-gray-400">{department}</div>
          <div className="text-[11px] text-gray-400">{role}</div>
        </div>
      </div>
  )
}

/* ── 결재요청 확인 모달 ── */
function SubmitModal({ isOpen, formName, onClose, onSubmit, submitting }: {
  isOpen: boolean
  formName: string
  onClose: () => void
  onSubmit: (opinion: string, urgent: boolean, title: string) => void
  submitting?: boolean
}) {
  const [title, setTitle] = useState('')
  const [opinion, setOpinion] = useState('')
  const [urgent, setUrgent] = useState(false)

  if (!isOpen) return null

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-[460px] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-[15px] font-bold text-gray-900">결재요청</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>

          <div className="px-6 py-5 space-y-5">
            <div className="flex items-start">
              <span className="w-24 text-[13px] font-semibold text-gray-900 pt-1 shrink-0">결재제목</span>
              <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="결재 제목을 입력하세요"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-[13px] outline-none placeholder-gray-400 focus:border-[#1D9E75]"
              />
            </div>
            <div className="flex items-start">
              <span className="w-24 text-[13px] font-semibold text-gray-900 pt-0.5 shrink-0">결재문서명</span>
              <span className="text-[13px] text-gray-700">{formName}</span>
            </div>
            <div className="flex items-start">
              <span className="w-24 text-[13px] font-semibold text-gray-900 pt-1 shrink-0">기안의견</span>
              <textarea
                  value={opinion}
                  onChange={(e) => setOpinion(e.target.value)}
                  placeholder="의견을 작성해 주세요."
                  rows={4}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-[13px] outline-none resize-none placeholder-gray-400 focus:border-[#1D9E75]"
              />
            </div>
            <div className="flex items-start">
              <span className="w-24 text-[13px] font-semibold text-gray-900 pt-0.5 shrink-0">긴급문서</span>
              <div>
                <label className="flex items-center gap-1.5 cursor-pointer text-[13px] text-gray-700">
                  <input
                      type="checkbox"
                      checked={urgent}
                      onChange={(e) => setUrgent(e.target.checked)}
                      className="accent-[#1D9E75] w-4 h-4"
                  />
                  긴급
                </label>
                <p className="text-[11px] text-gray-500 mt-1">결재자의 대기문서 가장 상단에 표시됩니다.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
            <button
                onClick={() => onSubmit(opinion, urgent, title)}
                disabled={submitting}
                className="px-5 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] transition-colors disabled:opacity-50"
            >
              {submitting ? '처리 중...' : '결재요청'}
            </button>
            <button
                onClick={onClose}
                className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      </div>
  )
}

/* ── 기안 의견 열람 모달 ── */
function OpinionModal({ isOpen, opinion, drafterName, onClose }: {
  isOpen: boolean
  opinion: string
  drafterName: string
  onClose: () => void
}) {
  if (!isOpen) return null

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-[440px] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-[15px] font-bold text-gray-900">기안 의견</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>
          <div className="px-6 py-5">
            <div className="text-[12px] text-gray-500 mb-3">기안자: <span className="font-semibold text-gray-700">{drafterName}</span></div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed">
              {opinion}
            </div>
          </div>
          <div className="flex justify-end px-6 py-4 border-t border-gray-200">
            <button
                onClick={onClose}
                className="px-5 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      </div>
  )
}

/* ── 승인 의견 입력 모달 ── */
function ApproveModal({ isOpen, onClose, onApprove, submitting }: {
  isOpen: boolean
  onClose: () => void
  onApprove: (comment?: string) => void
  submitting?: boolean
}) {
  const [comment, setComment] = useState('')

  if (!isOpen) return null

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-[460px] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-[15px] font-bold text-gray-900">승인</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-start">
              <span className="w-24 text-[13px] font-semibold text-gray-900 pt-1 shrink-0">승인 의견</span>
              <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="의견을 입력해 주세요. (선택)"
                  rows={4}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-[13px] outline-none resize-none placeholder-gray-400 focus:border-[#1D9E75]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
            <button
                onClick={() => onApprove(comment.trim() || undefined)}
                disabled={submitting}
                className="px-5 py-1.5 bg-[#1D9E75] text-white text-[13px] font-medium rounded-md hover:bg-[#178a65] transition-colors disabled:opacity-50"
            >
              {submitting ? '처리 중...' : '승인'}
            </button>
            <button
                onClick={onClose}
                className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      </div>
  )
}

/* ── 반려 사유 입력 모달 ── */
function RejectModal({ isOpen, onClose, onReject, submitting }: {
  isOpen: boolean
  onClose: () => void
  onReject: (reason: string) => void
  submitting?: boolean
}) {
  const [reason, setReason] = useState('')

  if (!isOpen) return null

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-[460px] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-[15px] font-bold text-gray-900">반려</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-start">
              <span className="w-24 text-[13px] font-semibold text-gray-900 pt-1 shrink-0">반려 사유</span>
              <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="반려 사유를 입력해 주세요."
                  rows={4}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-[13px] outline-none resize-none placeholder-gray-400 focus:border-red-400"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
            <button
                onClick={() => onReject(reason)}
                disabled={submitting || !reason.trim()}
                className="px-5 py-1.5 bg-red-500 text-white text-[13px] font-medium rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {submitting ? '처리 중...' : '반려'}
            </button>
            <button
                onClick={onClose}
                className="px-5 py-1.5 border border-gray-300 text-gray-600 text-[13px] font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      </div>
  )
}
