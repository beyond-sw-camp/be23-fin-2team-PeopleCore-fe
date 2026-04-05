import api from './client'

/* ══════════════════════════════════════════════
   TypeScript 타입 정의 (백엔드 API 스펙 기반)
   ══════════════════════════════════════════════ */

// ── Enum 값 ──
export type ApprovalStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED'
export type ApprovalLineStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELEGATED'
export type ApprovalRole = 'APPROVER' | 'REFERENCE' | 'VIEWER'

// ── 결재선 요청 ──
export interface ApprovalLineRequest {
  empId: number
  empName: string
  empDeptName: string
  empGrade: string
  empTitle: string
  approvalRole: ApprovalRole
  lineStep: number
}

// ── 문서 생성 요청 ──
export interface DocumentCreateRequest {
  formId: number
  docTitle: string
  docType: string
  docData: string          // JSON 문자열
  isEmergency: boolean
  approvalLines: ApprovalLineRequest[]
}

// ── 문서 수정 요청 ──
export interface DocumentUpdateRequest {
  docTitle: string
  docData: string
  isEmergency: boolean
  approvalLines: ApprovalLineRequest[]
}

// ── 문서 상세 응답 ──
export interface DocumentDetailResponse {
  docId: number
  docNum: string
  docTitle: string
  docType: string
  docData: string
  approvalStatus: ApprovalStatus
  isEmergency: boolean
  docSubmittedAt: string
  docCompleteAt: string | null
  empId: number
  empName: string
  empDeptName: string
  empGrade: string
  empTitle: string
  formHtml: string
  formName: string
  approvalLines: ApprovalLineResponse[]
  attachments: AttachmentResponse[]
}

export interface ApprovalLineResponse {
  lineId: number
  empId: number
  empName: string
  empDeptName: string
  empGrade: string
  empTitle: string
  approvalRole: ApprovalRole
  lineStep: number
  approvalLineStatus: ApprovalLineStatus
  lineProcessedAt: string | null
  lineRejectReason: string | null
  isDelegated: boolean
  isRead: boolean
}

export interface AttachmentResponse {
  attachId: number
  fileName: string
  fileSize: number
  fileUrl?: string
}

// ── 문서 목록 응답 ──
export interface DocumentListItem {
  docId: number
  docTitle: string
  docNum: string
  docStatus: string
  isEmergency: boolean
  formName: string
  drafterName: string
  drafterDept: string
  createdAt: string
  hasAttachment: boolean
}

export interface PageResponse<T> {
  content: T[]
  pageable: Record<string, unknown>
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

// ── 양식 폴더 응답 ──
export interface FormFolderResponse {
  folderId: number
  folderName: string
  folderPath: string
  folderSortOrder: number
  folderIsVisible: boolean
  children: FormFolderResponse[]
}

// ── 양식 목록 응답 ──
export interface FormListResponse {
  formId: number
  formName: string
  formCode: string
  folderId: number
  folderName: string
  isSystem: boolean
  formVersion: number
  isActive: boolean
  formWritePermission: string
  formIsPublic: boolean
  formRetentionYear: number
  formMobileYn: boolean
  formPreApprovalYn: boolean
  formSortOrder: number
}

// ── 양식 상세 응답 ──
export interface FormDetailResponse extends FormListResponse {
  formHtml: string
}

// ── 문서 목록 검색 파라미터 ──
export interface DocumentListSearchParams {
  search?: string
  startDate?: string
  endDate?: string
  formId?: number
  status?: string
  page?: number
  size?: number
  sort?: string
}

// ── 채번 규칙 ──
export interface NumberRuleResponse {
  numberRuleId: number
  numberRuleSlot1Type: string
  numberRuleSlot1Custom: string | null
  numberRuleSlot2Type: string
  numberRuleSlot2Custom: string | null
  numberRuleSlot3Type: string
  numberRuleSlot3Custom: string | null
  numberRuleDateFormat: string
  numberRuleSeqDigits: number
  numberRuleSeparator: string
  numberRuleSeqResetCycle: 'YEAR' | 'MONTH' | 'NEVER'
  preview: string
}

export interface NumberRuleUpdateRequest {
  numberRuleSlot1Type: string
  numberRuleSlot1Custom: string | null
  numberRuleSlot2Type: string
  numberRuleSlot2Custom: string | null
  numberRuleSlot3Type: string
  numberRuleSlot3Custom: string | null
  numberRuleDateFormat: string
  numberRuleSeqDigits: number
  numberRuleSeparator: string
  numberRuleSeqResetCycle: 'YEAR' | 'MONTH' | 'NEVER'
}

/* ══════════════════════════════════════════════
   API 함수
   ══════════════════════════════════════════════ */

// ── 1. 문서 CRUD ──
export const approvalApi = {
  // 1-1. 문서 기안 (생성 + 즉시 상신)
  createDocument(data: DocumentCreateRequest) {
    return api.post<number>('/approval/document', data)
  },

  // 1-2. 임시저장
  createTempDocument(data: DocumentCreateRequest) {
    return api.post<number>('/approval/document/temp', data)
  },

  // 1-3. 문서 상세 조회
  getDocument(docId: number) {
    return api.get<DocumentDetailResponse>(`/approval/document/${docId}`)
  },

  // 1-4. 문서 수정
  updateDocument(docId: number, data: DocumentUpdateRequest) {
    return api.put(`/approval/document/${docId}`, data)
  },

  // 1-5. 임시저장 문서 수정
  updateTempDocument(docId: number, data: DocumentUpdateRequest) {
    return api.put(`/approval/document/temp/${docId}`, data)
  },

  // 1-6. 임시저장 문서 삭제
  deleteDocument(docId: number) {
    return api.delete(`/approval/document/${docId}`)
  },

  // 1-7. 임시저장 → 상신
  submitDocument(docId: number) {
    return api.post(`/approval/document/${docId}/submit`)
  },

  // 1-8. 반려 문서 재상신
  resubmitDocument(docId: number, data: DocumentUpdateRequest) {
    return api.post(`/approval/document/${docId}/resubmit`, data)
  },

  // 1-9. 문서 회수
  recallDocument(docId: number) {
    return api.post(`/approval/document/${docId}/recall`)
  },

  // ── 2. 결재 액션 ──
  approveDocument(docId: number, comment?: string) {
    return api.post(`/approval/document/${docId}/approve`, { comment })
  },

  rejectDocument(docId: number, reason: string) {
    return api.post(`/approval/document/${docId}/reject`, { reason })
  },

  receiveDocument(docId: number) {
    return api.post(`/approval/document/${docId}/receive`)
  },

  readDocument(docId: number) {
    return api.post(`/approval/document/${docId}/read`)
  },

  ccConfirmDocument(docId: number) {
    return api.post(`/approval/document/${docId}/cc-confirm`)
  },

  // ── 3. 첨부파일 ──
  uploadAttachments(docId: number, files: File[]) {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    return api.post<AttachmentResponse[]>(`/approval/document/${docId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getAttachments(docId: number) {
    return api.get<AttachmentResponse[]>(`/approval/document/${docId}/attachments`)
  },

  getAttachmentDownloadUrl(attachId: number) {
    return api.get<string>(`/approval/document/attachments/${attachId}/download`)
  },

  deleteAttachment(attachId: number) {
    return api.delete(`/approval/document/attachments/${attachId}`)
  },

  // ── 4. 양식 관리 ──
  getFormFolders() {
    return api.get<FormFolderResponse[]>('/approval/form-folder')
  },

  getForms(folderId?: number) {
    const params = folderId != null ? { folderId } : {}
    return api.get<FormListResponse[]>('/approval/form', { params })
  },

  getFormDetail(formId: number) {
    return api.get<FormDetailResponse>(`/approval/forms/${formId}`)
  },

  getFrequentForms() {
    return api.get<FormListResponse[]>('/approval/forms/frequent')
  },

  addFrequentForm(formId: number) {
    return api.post(`/approval/forms/frequent/${formId}`)
  },

  removeFrequentForm(formId: number) {
    return api.delete(`/approval/forms/frequent/${formId}`)
  },

  // ── 5. 문서 목록 조회 ──
  getWaitingDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/approval/documents/waiting', { params })
  },

  getReceivedDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/approval/documents/received', { params })
  },

  getCcViewDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/approval/documents/cc-view', { params })
  },

  getUpcomingDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/approval/documents/upcoming', { params })
  },

  getDraftDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/approval/documents/draft', { params })
  },

  getTempDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/approval/documents/temp', { params })
  },

  getApprovedDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/approval/documents/approved', { params })
  },

  getCcViewBoxDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/approval/documents/cc-view-box', { params })
  },

  getSentDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/approval/documents/sent', { params })
  },

  getInboxDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/approval/documents/inbox', { params })
  },

  // 부서 문서함
  getDeptCompletedDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/approval/documents/dept/completed', { params })
  },

  getDeptReceivedDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/approval/documents/dept/received', { params })
  },

  getDeptSentDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/approval/documents/dept/sent', { params })
  },

  // ── 6. 채번 규칙 ──
  getNumberRule() {
    return api.get<NumberRuleResponse>('/approval/number-rule')
  },

  updateNumberRule(data: NumberRuleUpdateRequest) {
    return api.put('/approval/number-rule', data)
  },
}
