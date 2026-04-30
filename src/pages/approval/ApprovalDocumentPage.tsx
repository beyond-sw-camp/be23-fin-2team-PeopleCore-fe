import React, { useState, useRef, useEffect, useCallback } from 'react'
import ApprovalInfoModal from './ApprovalInfoModal'
import { type OrgMember } from './approvalTypes'
import { useAuth } from '../../contexts/AuthContext'
import { approvalApi, type ApprovalLineRequest, type DocumentCreateRequest, type DocumentDetailResponse, type CommentResponse } from '../../api/approval'
import { approvalDraftApi } from '../../api/payAdmin'
import { attendanceApi, formatHm, type OvertimeWeekItem, type OvertimeStatus } from '../../api/attendance'
import { showGlobalAlert } from '../../components/common/GlobalAlertHost'

const OT_STATUS_LABEL: Record<OvertimeStatus, string> = {
  PENDING: '대기', APPROVED: '승인', REJECTED: '반려', CANCELED: '취소',
}

const fmtHm = (iso: string) => iso.length >= 16 ? iso.slice(11, 16) : iso

const escapeHtml = (s: string) => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const mondayOf = (dateStr: string) => {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const renderOvertimeHistoryRows = (items: OvertimeWeekItem[]): string => {
  if (items.length === 0) {
    return `<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:12px;">이번주 신청 내역이 없습니다</td></tr>`
  }
  return items.map((it) => `
    <tr>
      <td style="text-align:center;">${it.otId}</td>
      <td style="text-align:center;">${OT_STATUS_LABEL[it.otStatus] ?? it.otStatus}</td>
      <td style="text-align:center;">${escapeHtml(it.otDate)}</td>
      <td style="text-align:center;">${fmtHm(it.otPlanStart)}</td>
      <td style="text-align:center;">${fmtHm(it.otPlanEnd)}</td>
      <td style="text-align:center;">${formatHm(it.otPlanMinutes)}</td>
      <td>${escapeHtml(it.otReason ?? '')}</td>
    </tr>
  `).join('')
}

interface FormInfo {
  formId: number
  name: string
  folder: string
  retention: string
  formHtml?: string
  formCode?: string
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
  /** 사전 데이터 (휴가/초과근무 등 hr 측 PK 포함). buildRequest 시 docData에 항상 머지됨 */
  extraDocData?: Record<string, unknown>
  /** 양식 본문 입력 잠금 (사전 데이터 변경 금지). 결재선/제목 등은 편집 가능 */
  lockForm?: boolean
  /** 첨부파일 초기값 — 외부(휴가/초과근무 등 모달)에서 선택한 파일을 그대로 이어받음 */
  initialAttachments?: File[]
  /** 조회 중인 문서를 다른 docId로 전환 (재기안 성공 시 새 문서로 이동, 이전 버전 보기 등) */
  onNavigateToDoc?: (docId: number) => void
  /** 사용자의 취소(닫기) 의도 전달 — 호스트가 dirty 체크 후 임시저장 확인 모달을 띄움. 미지정 시 onBack 직접 호출 */
  onRequestCancel?: () => void
  /** 호스트가 dirty 여부를 조회할 수 있는 ref — 취소/창닫기 시 임시저장 확인 모달 표시 판단용 */
  isDirtyRef?: React.RefObject<(() => boolean) | null>
  /** 결재선 prefill (Copilot 등 외부에서 결재자 목록을 미리 채울 때 사용) — 신규 기안 모드일 때만 적용 */
  initialApprovers?: OrgMember[]
  /**
   * 외부에서 결의서 HTML을 직접 주입할 때 사용. 있으면 formId 기반 양식 lookup을 건너뛰고 이 HTML을 우선 사용.
   * 급여/퇴직급여 결재처럼 백엔드(hr-service)가 동적으로 빌드한 결의서 HTML을 그대로 표시할 때 사용.
   */
  customHtmlTemplate?: string
}

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
                                               extraDocData,
                                               lockForm = false,
                                               initialAttachments,
                                               onNavigateToDoc,
                                               onRequestCancel,
                                               isDirtyRef,
                                               initialApprovers,
                                               customHtmlTemplate,
                                             }: ApprovalDocumentPageProps) {
  const { user } = useAuth()
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  // 신규 기안 모드(viewDocId/editingTempId 없음) 에서만 initialApprovers 가 의미를 가진다.
  // 조회/임시저장 재열기 모드에서는 기존 effect 가 결재선을 덮어쓰므로 충돌 없음.
  const [approvers, setApprovers] = useState<OrgMember[]>(() => initialApprovers ?? [])
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
  const [submitting, setSubmitting] = useState(false)

  // 문서 상세 (조회 모드)
  const [docDetail, setDocDetail] = useState<DocumentDetailResponse | null>(null)
  const [formHtml, setFormHtml] = useState('')
  const [loadingForm, setLoadingForm] = useState(false)
  // 초과근로 주간 이력 스냅샷 (기안 시점 고정 저장)
  const [otWeekHistoryJson, setOtWeekHistoryJson] = useState<string | null>(null)

  // 승인/반려 상태
  const [approving, setApproving] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [allConfirmModalOpen, setAllConfirmModalOpen] = useState(false)
  const [opinionModalOpen, setOpinionModalOpen] = useState(false)

  // 파일첨부 state (외부 prefill이 있으면 초기값으로 설정)
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>(
    () => initialAttachments?.map((f) => ({ file: f, name: f.name, size: f.size })) ?? [],
  )

  // initialAttachments가 뒤늦게 도착하는 경우(postMessage 비동기 수신) 이어받기
  useEffect(() => {
    if (!initialAttachments || initialAttachments.length === 0) return
    setAttachedFiles((prev) => {
      if (prev.length > 0) return prev
      return initialAttachments.map((f) => ({ file: f, name: f.name, size: f.size }))
    })
  }, [initialAttachments])
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
  useEffect(() => {
    const loadDocId = viewDocId ?? editingTempId
    if (loadDocId) {
      // 문서 상세 조회 모드 (기존 문서 또는 임시저장 문서)
      setLoadingForm(true)
      approvalApi.getDocument(loadDocId)
          .then(async ({ data }) => {
            setDocDetail(data)
            setDocTitleInput(data.docTitle ?? '')
            // 조회 모드에서 양식 HTML 결정 우선순위:
            // 1. 외부 customHtmlTemplate (호출부에서 명시적으로 전달)
            // 2. 급여/퇴직급여 결재면 스냅샷 API 호출 (immutable 본문)
            // 3. 양식 자체 formHtml (구문서 호환 fallback)
            let resolvedHtml = customHtmlTemplate ?? data.formHtml
            console.log('[결재조회] docId=', viewDocId, 'formCode=', data.formCode, 'customHtmlTemplate?', !!customHtmlTemplate)
            if (!customHtmlTemplate && viewDocId) {
              const isPayrollDoc = data.formCode === 'PAYROLL_PAYMENT' || data.formCode === 'RETIREMENT_PAYMENT'
              console.log('[결재조회] isPayrollDoc=', isPayrollDoc)
              if (isPayrollDoc) {
                try {
                  const snapshot = await approvalDraftApi.getSnapshot(viewDocId)
                  console.log('[결재조회] snapshot 응답', { htmlLen: snapshot?.htmlSnapshot?.length })
                  if (snapshot?.htmlSnapshot) resolvedHtml = snapshot.htmlSnapshot
                } catch (err) {
                  console.error('[결재조회] snapshot 실패', (err as { response?: { status?: number } })?.response?.status, err)
                }
              }
            }
            setFormHtml(resolvedHtml)
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
    } else if (customHtmlTemplate) {
      // 새 문서 작성 — 외부에서 빌드된 HTML(예: 급여 결재) 직접 사용
      setDocDetail(null)
      setFormHtml(customHtmlTemplate)
      setLoadingForm(false)
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
  }, [viewDocId, editingTempId, form.formId, form.name, customHtmlTemplate])

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
    // data-key 기반 텍스트 셀 (급여/퇴직급여 결의서) 도 같이 수집
    formRef.current.querySelectorAll<HTMLElement>('[data-key]').forEach((el) => {
      const key = el.getAttribute('data-key')
      if (!key || data[key] !== undefined) return
      data[key] = el.textContent ?? ''
    })
    setDocData(data)
  }, [])

  // 반려된 문서를 기안자 본인이 보면 재기안을 위해 폼 수정 허용
  const isResubmitEditable = readOnly
    && docDetail?.approvalStatus === 'REJECTED'
    && !!user?.empId
    && String(docDetail.empId) === user.empId
  const effectiveReadOnly = readOnly && !isResubmitEditable

  useEffect(() => {
    if (!formRef.current || !formHtml) return
    formRef.current.innerHTML = formHtml

    // form HTML 안의 .form-title은 중복 방지를 위해 숨김 (제목은 React에서 별도 렌더)
    formRef.current.querySelectorAll<HTMLElement>('.form-title').forEach((el) => {
      el.style.display = 'none'
    })

    // name 속성이 없는 input/textarea/select에 자동 name 부여
    formRef.current.querySelectorAll<HTMLInputElement>('input, textarea, select').forEach((el, idx) => {
      if (!el.name) el.name = `field_${idx}`
    })

    // hr 측 시간 필드는 표 칸에서 datetime-local 위젯이 잘리므로 type="time"으로 변환
    // 실제 POST는 hr 모달에서 이미 LocalDateTime으로 전송됨. docData 는 표시용.
    formRef.current.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]').forEach((el) => {
      if (el.name === 'otPlanStart' || el.name === 'otPlanEnd') {
        el.type = 'time'
      }
    })

    if (effectiveReadOnly) formRef.current.classList.add('form-readonly')
    else formRef.current.classList.remove('form-readonly')

    const dataToFill: Record<string, unknown> = (initialDocData && Object.keys(initialDocData).length > 0)
        ? { ...initialDocData }
        : (docDetail?.docData ? JSON.parse(docDetail.docData) : {})

    // 구문서 폴백: 예전 양식은 vacReqStartat/vacReqEndat 만 저장되어 있어
    // 새 양식의 "휴가 일자" 칸(vacReqDatesText)이 비어 보임. 서버에 없을 때만 합성.
    if (
      !dataToFill.vacReqDatesText &&
      (dataToFill.vacReqStartat || dataToFill.vacReqEndat)
    ) {
      const s = String(dataToFill.vacReqStartat ?? '').slice(0, 16).replace('T', ' ')
      const e = String(dataToFill.vacReqEndat ?? '').slice(0, 16).replace('T', ' ')
      dataToFill.vacReqDatesText = s && e ? `${s} ~ ${e}` : (s || e)
    }

    // 휴가신청서 신규 스펙: vacReqUseDay는 백엔드에 저장 안 됨 → vacReqItems 합계로 합성해서 form에 표시
    if (dataToFill.vacReqUseDay === undefined && Array.isArray(dataToFill.vacReqItems)) {
      const sum = (dataToFill.vacReqItems as Array<{ useDay?: number }>)
        .reduce((acc, it) => acc + (Number(it?.useDay) || 0), 0)
      if (sum > 0) dataToFill.vacReqUseDay = sum
    }

    // 값 주입은 disabled/readonly 적용 전에 수행 — 일부 브라우저는 disabled date/time 인풋에 value 세터 무시
    Object.entries(dataToFill).forEach(([name, value]) => {
      if (value === null || value === undefined) return
      // 배열/객체는 form input에 바인딩하지 않음 (예: vacReqItems은 doc_data JSON에만 유지)
      if (typeof value === 'object') return
      const strValue = String(value)
      const els = formRef.current!.querySelectorAll<HTMLInputElement>(`[name="${name}"]`)
      els.forEach((el) => {
        if (el.type === 'radio') {
          el.checked = el.value === strValue
        } else if (el.type === 'checkbox') {
          el.checked = strValue === 'true'
        } else {
          // BE는 LocalDateTime 풀 포맷("YYYY-MM-DDTHH:mm:ss")으로 저장. input[type=date/time]은
          // 각자 짧은 포맷만 허용하므로 표시 시점에 슬라이스해서 주입.
          let normalized = strValue
          if (el.type === 'date' && strValue.includes('T')) {
            normalized = strValue.slice(0, 10)
          } else if (el.type === 'time' && strValue.includes('T')) {
            normalized = strValue.slice(11, 16)
          }
          el.value = normalized
          if (el.type === 'date' || el.type === 'time') {
            el.setAttribute('value', normalized)
          }
        }
      })
      // data-key 기반 텍스트 셀 (급여/퇴직급여 결의서 — contenteditable td) 채우기
      const dataKeyEls = formRef.current!.querySelectorAll<HTMLElement>(`[data-key="${name}"]`)
      dataKeyEls.forEach((el) => {
        el.textContent = strValue
      })
    })

    // 값 주입 후 lockForm이면 입력 잠금 (date/time 화면 비는 문제 회피)
    if (lockForm) {
      formRef.current.classList.add('form-readonly')
      formRef.current.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select').forEach((el) => {
        el.disabled = true
        el.setAttribute('readonly', 'readonly')
      })
    }

    if (!effectiveReadOnly) {
      const handler = () => collectValues()
      formRef.current.addEventListener('input', handler)
      formRef.current.addEventListener('change', handler)
      const ref = formRef.current
      return () => {
        ref.removeEventListener('input', handler)
        ref.removeEventListener('change', handler)
      }
    }
  }, [formHtml, effectiveReadOnly, lockForm, initialDocData, collectValues, docDetail, docTitleInput, form.name])

  /* ── 초과근로 주간 이력 스냅샷 ── */
  useEffect(() => {
    if (form.formCode !== 'OVERTIME_REQUEST') return
    if (!lockForm) return
    const otDate = initialDocData?.otDate
    if (!otDate) return
    if (initialDocData?.otWeekHistory) return
    const weekStart = mondayOf(otDate)
    let aborted = false
    attendanceApi.getOvertimeWeek(weekStart)
      .then((res) => { if (!aborted) setOtWeekHistoryJson(JSON.stringify(res.items)) })
      .catch(() => { /* 백엔드 미구현 시 무시 */ })
    return () => { aborted = true }
  }, [form.formCode, lockForm, initialDocData])

  useEffect(() => {
    if (!formRef.current || !formHtml) return
    const tbody = formRef.current.querySelector<HTMLTableSectionElement>('tbody[data-history="overtime-week"]')
    if (!tbody) return
    const snapshotSource =
      otWeekHistoryJson
      ?? (initialDocData?.otWeekHistory as string | undefined)
      ?? (docDetail?.docData ? (JSON.parse(docDetail.docData) as Record<string, string>).otWeekHistory : undefined)
    if (!snapshotSource) return
    try {
      const items = JSON.parse(snapshotSource) as OvertimeWeekItem[]
      tbody.innerHTML = renderOvertimeHistoryRows(items)
    } catch { /* 파싱 실패 시 무시 */ }
  }, [formHtml, otWeekHistoryJson, initialDocData, docDetail])

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
      // data-key 기반 텍스트 셀 (급여/퇴직급여 결의서) 도 같이 수집
      formRef.current.querySelectorAll<HTMLElement>('[data-key]').forEach((el) => {
        const key = el.getAttribute('data-key')
        if (!key || latestData[key] !== undefined) return
        latestData[key] = el.textContent ?? ''
      })
    }
    const merged: Record<string, unknown> = {
      ...latestData,
      ...(extraDocData ?? {}),
      ...(otWeekHistoryJson ? { otWeekHistory: otWeekHistoryJson } : {}),
    }
    // 휴가신청서: vacReqItems가 진실의 원천. 표시용 합계/레거시 범위 필드는 백엔드로 보내지 않음.
    if (form.formCode === 'VACATION_REQUEST') {
      delete merged.vacReqUseDay
      delete merged.vacReqStartat
      delete merged.vacReqEndat
    }
    // 초과근로신청서: BE는 otDate/otPlanStart/otPlanEnd를 LocalDateTime으로 받음.
    // 폼의 input[type=date/time]에서 모은 짧은 포맷을 풀 포맷으로 복원.
    if (form.formCode === 'OVERTIME_REQUEST') {
      const otDateRaw = typeof merged.otDate === 'string' ? merged.otDate : ''
      const dateStr = otDateRaw.slice(0, 10)
      if (/^\d{4}-\d{2}-\d{2}$/.test(otDateRaw)) {
        merged.otDate = `${otDateRaw}T00:00:00`
      }
      if (dateStr) {
        const otStart = typeof merged.otPlanStart === 'string' ? merged.otPlanStart : ''
        const otEnd = typeof merged.otPlanEnd === 'string' ? merged.otPlanEnd : ''
        if (/^\d{2}:\d{2}$/.test(otStart)) merged.otPlanStart = `${dateStr}T${otStart}:00`
        if (/^\d{2}:\d{2}$/.test(otEnd)) merged.otPlanEnd = `${dateStr}T${otEnd}:00`
      }
    }
    // 상신 시점의 완성된 결의서 HTML 캡처 (스냅샷용)
    // 사용자가 보고있던 그대로의 DOM을 직렬화 → 백엔드에서 ApprovalDocCreatedEvent.htmlContent로 흘러감
    const htmlContent = formRef.current?.outerHTML ?? ''

    return {
      formId: docDetail?.formId ?? form.formId,
      docTitle: docTitleInput.trim() || latestData.title || latestData['제목'] || docDetail?.docTitle || form.name,
      docType: form.folder,
      docData: JSON.stringify(merged),
      isEmergency,
      approvalLines: buildApprovalLines(),
      htmlContent,
    }
  }

  /* ── 임시저장 ── */
  const handleTempSave = async () => {
    setSubmitting(true)
    try {
      const req = buildRequest()
      const newFiles = attachedFiles.map((f) => f.file)
      let docId: number
      if (editingTempId) {
        await approvalApi.updateTempDocument(editingTempId, {
          docTitle: req.docTitle,
          docData: req.docData,
          isEmergency: req.isEmergency,
          approvalLines: req.approvalLines,
        }, newFiles)
        docId = editingTempId
      } else {
        const { data } = await approvalApi.createTempDocument(req, newFiles)
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

  // 호스트(ApprovalModalHost)가 dirty 여부를 조회할 수 있도록 함수 노출.
  // 조회/읽기전용 모드에서는 항상 false — 확인 모달 생략.
  // 내용 판정 기준: 제목 / 결재선 / 첨부 / 긴급 / 폼 필드에 사용자 입력값 존재.
  useEffect(() => {
    if (!isDirtyRef) return
    const check = (): boolean => {
      if (effectiveReadOnly) return false
      if (viewDocId) return false
      if (docTitleInput.trim() !== '') return true
      if (approvers.length > 0 || ccList.length > 0 || viewers.length > 0) return true
      if (attachedFiles.length > 0) return true
      if (isEmergency) return true
      // _docData는 사용자가 폼에 입력할 때 (또는 임시저장 문서 로드 시) 채워진다.
      // 신규 기안에서 아무 것도 입력하지 않으면 비어있음.
      for (const v of Object.values(_docData)) {
        if (v && v !== 'false' && v.trim() !== '') return true
      }
      return false
    }
    isDirtyRef.current = check
    return () => { if (isDirtyRef.current === check) isDirtyRef.current = null }
  }, [isDirtyRef, effectiveReadOnly, viewDocId, docTitleInput, approvers.length, ccList.length, viewers.length, attachedFiles.length, isEmergency, _docData])

  /* ── 문서 액션 조건 ── */
  const isDrafter = readOnly && docDetail && String(docDetail.empId) === user?.empId
  const canApprove = readOnly && docDetail && docDetail.approvalStatus === 'PENDING' && docDetail.approvalLines?.some(
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
  // 첨부파일 수정 가능 조건: 신규 기안 / 반려 후 재기안 / 기안자 본인의 DRAFT
  const canEditAttachments = !effectiveReadOnly || (isDrafter && docDetail?.approvalStatus === 'DRAFT')

  // 결재자가 문서를 열었을 때 기안 의견 모달 표시
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

  // 전결 — 남은 결재자를 모두 건너뛰고 최종 승인
  const handleAllConfirm = async (comment?: string) => {
    if (!viewDocId) return
    setApproving(true)
    try {
      await approvalApi.allConfirmDocument(viewDocId, comment)
      showGlobalAlert('전결 처리되었습니다.', 'success')
      setAllConfirmModalOpen(false)
      onBack()
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      showGlobalAlert(msg ?? '전결 처리에 실패했습니다.', 'error')
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

  const handleResubmit = () => {
    if (!viewDocId) return
    if (approvers.length === 0) {
      alert('결재선을 설정해주세요.')
      setInfoModalOpen(true)
      return
    }
    collectValues()
    setResubmitMode(true)
    setSubmitModalOpen(true)
  }

  const handleResubmitConfirm = async (opinion: string, urgent: boolean, title: string) => {
    if (!viewDocId) return
    setSubmitting(true)
    try {
      if (title.trim()) setDocTitleInput(title.trim())
      const latestData: Record<string, string> = {}
      if (formRef.current) {
        formRef.current.querySelectorAll<HTMLInputElement>('input, textarea, select').forEach((el) => {
          if (!el.name) return
          if (el.type === 'radio') { if (el.checked) latestData[el.name] = el.value }
          else if (el.type === 'checkbox') { latestData[el.name] = el.checked ? 'true' : 'false' }
          else { latestData[el.name] = el.value }
        })
        // data-key 기반 텍스트 셀 (급여/퇴직급여 결의서) 도 같이 수집
        formRef.current.querySelectorAll<HTMLElement>('[data-key]').forEach((el) => {
          const key = el.getAttribute('data-key')
          if (!key || latestData[key] !== undefined) return
          latestData[key] = el.textContent ?? ''
        })
      }
      const resolvedTitle = title.trim() || docTitleInput.trim() || latestData.title || latestData['제목'] || docDetail?.docTitle || form.name
      // 재기안 시점의 완성된 결의서 HTML 캡처 (스냅샷용)
      const htmlContent = formRef.current?.outerHTML ?? ''
      // 신규 첨부파일은 재상신 multipart에 포함 (기존 첨부는 백엔드가 복제해줌)
      const { data: newDocId } = await approvalApi.resubmitDocument(viewDocId, {
        docTitle: resolvedTitle,
        docData: JSON.stringify(latestData),
        isEmergency: urgent,
        approvalLines: buildApprovalLines(),
        htmlContent,
        ...(opinion.trim() ? { docOpinion: opinion.trim() } : {}),
      }, attachedFiles.map((f) => f.file))

      setSubmitModalOpen(false)
      alert('재기안되었습니다.')
      if (newDocId && onNavigateToDoc) {
        onNavigateToDoc(newDocId)
      } else {
        onBack()
      }
    } catch {
      alert('재기안에 실패했습니다.')
    } finally {
      setSubmitting(false)
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
  const [resubmitMode, setResubmitMode] = useState(false)

  const handleSubmitClick = () => {
    if (approvers.length === 0) {
      alert('결재선을 설정해주세요.')
      setInfoModalOpen(true)
      return
    }
    collectValues()
    setResubmitMode(false)
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

      const newFiles = attachedFiles.map((f) => f.file)

      if (editingTempId) {
        // 임시저장 문서 → 신규 첨부 포함 업데이트 후 상신
        await approvalApi.updateTempDocument(editingTempId, {
          docTitle: req.docTitle,
          docData: req.docData,
          isEmergency: req.isEmergency,
          approvalLines: req.approvalLines,
        }, newFiles)
        await approvalApi.submitDocument(editingTempId)
      } else {
        // 새 문서 기안 (생성 + 즉시 상신, 첨부 동시 전송)
        await approvalApi.createDocument(req, newFiles)
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
<html lang="ko"><head><meta charset="utf-8"><title>${docDetail?.docTitle?.trim() || docTitleInput.trim() || form.name} - 미리보기</title>
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
  .approval-form-content .form-title { display: none; }
  .approval-form-content h1, .approval-form-content h2, .approval-form-content h3 { font-size: 14px !important; font-weight: 600 !important; margin: 8px 0 !important; letter-spacing: normal !important; }
</style></head><body>
<div style="text-align:center;font-size:28px;font-weight:700;margin-bottom:24px;letter-spacing:-0.02em;">${docDetail?.docTitle?.trim() || docTitleInput.trim() || form.name}</div>
<div class="header">
  <table class="info-table"><tbody>
    <tr><td class="label">기안자</td><td style="width:140px;">${currentUser.name}</td></tr>
    <tr><td class="label">기안일</td><td>${dateStr}</td></tr>
    <tr><td class="label">문서번호</td><td style="color:#000000;">${docDetail?.docNum ?? ''}</td></tr>
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
              <button onClick={() => setAllConfirmModalOpen(true)} disabled={approving} className="flex items-center gap-1 hover:text-[#1D9E75] transition-colors disabled:opacity-50">
                <i className="fas fa-check-double text-[10px]" /> 전결
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
            <button onClick={onRequestCancel ?? onBack} className="flex items-center gap-1 hover:text-red-400 transition-colors">
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
                  <td className="px-4 py-2 border border-gray-300 text-black">{docDetail?.docNum ?? ''}</td>
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
                    ) : docDetail ? (
                        <span className="text-[12px] text-gray-800 font-medium">{docDetail.empName ?? currentUser.name}</span>
                    ) : (
                        <span className="text-[11px] text-gray-300"></span>
                    )}
                  </td>
                  {approvers.map((a) => {
                    const empId = a.empId ?? Number(a.id)
                    const line = docDetail?.approvalLines?.find((l) => l.empId === empId && l.approvalRole === 'APPROVER')
                    const isApproved = line?.approvalLineStatus === 'APPROVED'
                    const isRejected = line?.approvalLineStatus === 'REJECTED'
                    const isCanceled = line?.approvalLineStatus === 'CANCELED'
                    return (
                        <td key={a.id} className="px-4 py-2 border border-gray-300 text-center h-[52px]">
                          {isApproved && line?.sigUrl ? (
                              <img src={line.sigUrl} alt="서명" className="h-10 mx-auto object-contain" />
                          ) : isApproved ? (
                              <span className="text-[11px] text-[#1D9E75] font-semibold">승인</span>
                          ) : isRejected ? (
                              <span className="text-[11px] text-red-500 font-semibold">반려</span>
                          ) : isCanceled ? (
                              <span className="text-[11px] text-gray-400 line-through">취소</span>
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
                    const isCanceled = line?.approvalLineStatus === 'CANCELED'
                    const dateCls = isRejected ? 'text-red-500 font-semibold' : isCanceled ? 'text-gray-400 line-through' : 'text-gray-400'
                    return (
                        <td key={a.id} className={`px-4 py-1 border border-gray-300 text-center text-[10px] ${dateCls}`}>
                          {line?.lineProcessedAt?.slice(0, 10) ?? ''}
                        </td>
                    )
                  })}
                </tr>
                </tbody>
              </table>
            </div>

            {/* ── 문서 제목 (입력한 결재제목 우선, 없으면 양식 이름) ── */}
            <h1 className="text-center text-[28px] font-bold text-gray-900 mb-2 tracking-tight">
              {docDetail?.docTitle?.trim() || docTitleInput.trim() || form.name}
            </h1>

            {/* ── 재기안된 문서일 경우 이전 버전 안내 ── */}
            {docDetail?.previousDocId && (
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">재기안됨</span>
                  {onNavigateToDoc && (
                      <button
                          type="button"
                          onClick={() => onNavigateToDoc(docDetail.previousDocId!)}
                          className="text-[12px] text-[#1D9E75] hover:underline"
                      >
                        이전 버전 보기
                      </button>
                  )}
                </div>
            )}
            {!docDetail?.previousDocId && <div className="mb-4" />}

            {/* ── form_html 렌더링 영역 ── */}
            <div ref={formRef} className="approval-form-content mb-8" />

            {/* ── 파일첨부 ── */}
            <div className="mt-8 mb-4">
              <div className="flex items-center gap-1 text-[13px] font-semibold text-[#000000] mb-2">
                파일첨부
                <span className="text-gray-400 text-[11px] font-normal cursor-help" title="파일을 첨부합니다">&#9432;</span>
              </div>
              {canEditAttachments && (
                  <>
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
                                <button onClick={() => removeFile(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                                  <i className="fas fa-times" />
                                </button>
                              </div>
                          ))}
                        </div>
                    )}
                  </>
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
                            {canEditAttachments && docDetail?.approvalStatus === 'DRAFT' && (
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
                {readOnly && (
                  <button
                      onClick={() => setBottomTab('댓글')}
                      className={`pb-1 ${bottomTab === '댓글' ? 'font-bold text-gray-900 border-b-2 border-gray-900' : 'text-gray-400'}`}
                  >
                    댓글 {comments.length > 0 && <span className="text-[11px] text-[#1D9E75] ml-1">{comments.length}</span>}
                  </button>
                )}
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
                      <span className="text-black text-[12px]">{docDetail?.docNum ?? ''}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-24 font-semibold text-[#000000]">전사문서함</span>
                      <span className="inline-block text-[11px] bg-gray-100 border border-gray-300 rounded px-2 py-0.5 text-gray-700 mr-2">
                    {form.folder}
                  </span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-24 font-semibold text-[#000000]">보존연한</span>
                      <span className="inline-block text-[11px] bg-gray-100 border border-gray-300 rounded px-2 py-0.5 text-gray-700">
                        {form.retention}
                      </span>
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
              ) : bottomTab === '댓글' && readOnly ? (
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
              ) : null}
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
            formCode={form.formCode}
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
            onSubmit={resubmitMode ? handleResubmitConfirm : handleSubmitConfirm}
            submitting={submitting}
            initialTitle={resubmitMode ? (docDetail?.docTitle ?? '') : ''}
            initialUrgent={resubmitMode ? (docDetail?.isEmergency ?? false) : isEmergency}
            confirmLabel={resubmitMode ? '재기안' : '결재요청'}
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

        <ApproveModal
            isOpen={allConfirmModalOpen}
            onClose={() => setAllConfirmModalOpen(false)}
            onApprove={handleAllConfirm}
            submitting={approving}
            title="전결"
            submitText="전결"
            labelText="전결 의견"
            warning="남은 결재자를 모두 건너뛰고 현재 결재자가 최종 승인 처리합니다."
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
function SubmitModal({ isOpen, formName, onClose, onSubmit, submitting, initialTitle = '', initialUrgent = false, confirmLabel = '결재요청' }: {
  isOpen: boolean
  formName: string
  onClose: () => void
  onSubmit: (opinion: string, urgent: boolean, title: string) => void
  submitting?: boolean
  initialTitle?: string
  initialUrgent?: boolean
  confirmLabel?: string
}) {
  const [title, setTitle] = useState(initialTitle)
  const [opinion, setOpinion] = useState('')
  const [urgent, setUrgent] = useState(initialUrgent)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)

  // isOpen 상승 엣지에서 폼 초기화 (useEffect 내부 동기 setState 회피)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setTitle(initialTitle)
      setUrgent(initialUrgent)
      setOpinion('')
    }
  }

  if (!isOpen) return null

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-[460px] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-[15px] font-bold text-gray-900">{confirmLabel}</h2>
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
              {submitting ? '처리 중...' : confirmLabel}
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

/* ── 승인/전결 의견 입력 모달 ── */
function ApproveModal({ isOpen, onClose, onApprove, submitting, title = '승인', submitText = '승인', labelText = '승인 의견', warning }: {
  isOpen: boolean
  onClose: () => void
  onApprove: (comment?: string) => void
  submitting?: boolean
  title?: string
  submitText?: string
  labelText?: string
  warning?: string
}) {
  const [comment, setComment] = useState('')

  if (!isOpen) return null

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-[460px] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>
          <div className="px-6 py-5">
            {warning && (
              <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-[12px] text-amber-800">
                {warning}
              </div>
            )}
            <div className="flex items-start">
              <span className="w-24 text-[13px] font-semibold text-gray-900 pt-1 shrink-0">{labelText}</span>
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
              {submitting ? '처리 중...' : submitText}
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
