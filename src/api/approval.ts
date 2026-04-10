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
  empDeptId?: number
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
  docOpinion?: string      // 기안 의견
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
  docOpinion: string | null   // 기안 의견
  docSubmittedAt: string
  docCompleteAt: string | null
  empId: number
  empName: string
  empDeptName: string
  empGrade: string
  empTitle: string
  formId: number
  formHtml: string
  formName: string
  drafterSigUrl: string | null
  approvalLines: ApprovalLineResponse[]
  attachments: AttachmentResponse[]
}

export interface ApprovalLineResponse {
  lineId: number
  empId: number
  empName: string
  empDeptId?: number
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
  sigUrl: string | null
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
  numberRuleSlot3Type: string | null
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
  numberRuleSlot3Type: string | null
  numberRuleSlot3Custom: string | null
  numberRuleDateFormat: string
  numberRuleSeqDigits: number
  numberRuleSeparator: string
  numberRuleSeqResetCycle: 'YEAR' | 'MONTH' | 'NEVER'
}

// ── 결재선 템플릿 ──
export interface LineTemplateItemDto {
  empId: number
  approvalRole: string
  step: number
}

export interface ApprovalLineTemplateCreateRequest {
  lineTemName: string
  isDefault: boolean
  itemDto: LineTemplateItemDto[]
}

export interface ApprovalLineTemplateResponse {
  lineTemId: number
  lineTemName: string
  isDefault: boolean
  itemDto: LineTemplateItemDto[]
}

// ── 위임 ──
export interface ApprovalDelegationCreateRequest {
  empDeptName: string
  empGrade: string
  empTitle: string
  appDeleEmpId: number
  deleName: string
  deleDeptName: string
  deleGrade: string
  deleTitle: string
  appDeleStartAt: string
  appDeleEndAt: string
  appDeleReason: string
}

export interface AdminDelegationCreateRequest {
  empId: number
  empName: string
  empDeptName: string
  empGrade: string
  empTitle: string
  appDeleEmpId: number
  deleName: string
  deleDeptName: string
  deleGrade: string
  deleTitle: string | null
  appDeleStartAt: string
  appDeleEndAt: string
  appDeleReason: string
}

export interface ApprovalDelegationResponse {
  appDeleId: number
  empId: number
  empName: string
  empDeptName: string
  empGrade: string
  empTitle: string
  deleEmpId: number
  deleName: string
  deleDeptName: string
  deleGrade: string
  deleTitle: string | null
  startAt: string
  endAt: string
  reason: string
  isActive: boolean
  createdAt: string
}

// ── 서명 ──
export interface ApprovalSignatureResponse {
  fileId: number
  originalFileName: string
  fileUrl: string
  fileSize: number
  fileType: string
  managerId: number | null
  createdAt: string
}

// ── 부서 문서함 ──
export interface ManagerInfo {
  empId: number
  empName: string
  deptName: string
}

export interface DeptFolderResponse {
  id: number
  name: string
  createdAt: string
  docCount: number
  sortOrder: number
  managers: ManagerInfo[]
}

export interface DeptFolderReorderRequest {
  orderList: { id: number; sortOrder: number }[]
}

// ── 자동 분류 규칙 ──
export interface AutoClassifyConditions {
  titleContains: string | null
  formName: string | null
  drafterDept: string | null
  drafterName: string | null
}

export interface AutoClassifyRuleCreateRequest {
  ruleName: string
  sourceBox: 'SENT' | 'INBOX'
  conditions: AutoClassifyConditions
  targetFolderId: number
  isActive: boolean
}

export interface AutoClassifyRuleResponse {
  id: number
  ruleName: string
  sourceBox: 'SENT' | 'INBOX'
  conditions: AutoClassifyConditions
  targetFolderId: number
  targetFolderName: string
  isActive: boolean
  sortOrder: number
}

// ── 댓글 ──
export interface CommentResponse {
  commentId: number
  parentCommentId: number | null
  empId: number
  empName: string
  empDeptName: string
  empGradeName: string
  content: string
  createdAt: string
  updatedAt: string | null
}

// ── 개인 문서함 ──
export interface PersonalFolderResponse {
  id: number
  name: string
  createdAt: string
  sortOrder: number
  docCount: number
}

/* ══════════════════════════════════════════════
   API 함수
   ══════════════════════════════════════════════ */

// ── 1. 문서 CRUD ──
export const approvalApi = {
  // 1-1. 문서 기안 (생성 + 즉시 상신)
  createDocument(data: DocumentCreateRequest) {
    return api.post<number>('/collaboration-service/approval/document', data)
  },

  // 1-2. 임시저장
  createTempDocument(data: DocumentCreateRequest) {
    return api.post<number>('/collaboration-service/approval/document/temp', data)
  },

  // 1-3. 문서 상세 조회
  getDocument(docId: number) {
    return api.get<DocumentDetailResponse>(`/collaboration-service/approval/document/${docId}`)
  },

  // 1-4. 문서 수정
  updateDocument(docId: number, data: DocumentUpdateRequest) {
    return api.put(`/collaboration-service/approval/document/${docId}`, data)
  },

  // 1-5. 임시저장 문서 수정
  updateTempDocument(docId: number, data: DocumentUpdateRequest) {
    return api.put(`/collaboration-service/approval/document/temp/${docId}`, data)
  },

  // 1-6. 임시저장 문서 삭제
  deleteDocument(docId: number) {
    return api.delete(`/collaboration-service/approval/document/${docId}`)
  },

  // 1-7. 임시저장 → 상신
  submitDocument(docId: number) {
    return api.post(`/collaboration-service/approval/document/${docId}/submit`)
  },

  // 1-8. 반려 문서 재상신
  resubmitDocument(docId: number, data: DocumentUpdateRequest) {
    return api.post(`/collaboration-service/approval/document/${docId}/resubmit`, data)
  },

  // 1-9. 문서 회수
  recallDocument(docId: number) {
    return api.post(`/collaboration-service/approval/document/${docId}/recall`)
  },

  // ── 2. 결재 액션 ──
  approveDocument(docId: number, comment?: string) {
    return api.post(`/collaboration-service/approval/document/${docId}/approve`, { comment })
  },

  rejectDocument(docId: number, reason: string) {
    return api.post(`/collaboration-service/approval/document/${docId}/reject`, { reason })
  },

  receiveDocument(docId: number) {
    return api.post(`/collaboration-service/approval/document/${docId}/receive`)
  },

  readDocument(docId: number) {
    return api.post(`/collaboration-service/approval/document/${docId}/read`)
  },

  ccConfirmDocument(docId: number) {
    return api.post(`/collaboration-service/approval/document/${docId}/cc-confirm`)
  },

  // ── 3. 첨부파일 ──
  uploadAttachments(docId: number, files: File[]) {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    return api.post<AttachmentResponse[]>(`/collaboration-service/approval/document/${docId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getAttachments(docId: number) {
    return api.get<AttachmentResponse[]>(`/collaboration-service/approval/document/${docId}/attachments`)
  },

  getAttachmentDownloadUrl(attachId: number) {
    return api.get<string>(`/collaboration-service/approval/document/attachments/${attachId}/download`)
  },

  deleteAttachment(attachId: number) {
    return api.delete(`/collaboration-service/approval/document/attachments/${attachId}`)
  },

  // ── 4. 양식 폴더 관리 ──
  getFormFolders() {
    return api.get<FormFolderResponse[]>('/collaboration-service/approval/form-folder')
  },

  getAllFormFolders() {
    return api.get<FormFolderResponse[]>('/collaboration-service/approval/form-folder/all')
  },

  createFormFolder(data: { folderName: string; parentId: number | null }) {
    return api.post<FormFolderResponse>('/collaboration-service/approval/form-folder', data)
  },

  updateFormFolder(folderId: number, data: { folderName: string }) {
    return api.put<FormFolderResponse>(`/collaboration-service/approval/form-folder/${folderId}`, data)
  },

  deleteFormFolder(folderId: number) {
    return api.delete(`/collaboration-service/approval/form-folder/${folderId}`)
  },

  updateFormFolderVisibility(folderId: number, folderIsVisible: boolean) {
    return api.put(`/collaboration-service/approval/form-folder/${folderId}/visibility`, { folderIsVisible })
  },

  // ── 5. 양식 관리 ──
  getForms(folderId?: number) {
    const params = folderId != null ? { folderId } : {}
    return api.get<FormListResponse[]>('/collaboration-service/approval/form', { params })
  },

  getFormDetail(formId: number) {
    return api.get<FormDetailResponse>(`/collaboration-service/approval/forms/${formId}`)
  },

  getFormEdit(formId: number) {
    return api.get<{ formHtml: string }>(`/collaboration-service/approval/forms/${formId}/edit`)
  },

  createForm(data: {
    formName: string; formCode: string; formHtml: string; folderId: number
    formWritePermission: string; formIsPublic: boolean; formRetentionYear: number
    formMobileYn: boolean; formPreApprovalYn: boolean
  }) {
    return api.post<number>('/collaboration-service/approval/forms', data)
  },

  updateForm(formId: number, data: {
    formName: string; formHtml: string; formWritePermission: string
    formIsPublic: boolean; formRetentionYear: number
    formMobileYn: boolean; formPreApprovalYn: boolean
  }) {
    return api.put(`/collaboration-service/approval/forms/${formId}`, data)
  },

  deleteForm(formId: number) {
    return api.delete(`/collaboration-service/approval/forms/${formId}`)
  },

  reorderForms(orderList: { formId: number; formSortOrder: number }[]) {
    return api.put('/collaboration-service/approval/forms/reorder', { orderList })
  },

  batchUpdateForms(data: {
    forms: {
      formId: number; formIsPublic: boolean; formMobileYn: boolean
      formPreApprovalYn: boolean; formWritePermission: string; formRetentionYear: number
    }[]
  }) {
    return api.put('/collaboration-service/approval/forms/batch-settings', data)
  },

  // ── 6. 자주 쓰는 양식 ──
  getFrequentForms() {
    return api.get<FormListResponse[]>('/collaboration-service/approval/forms/frequent')
  },

  addFrequentForm(formId: number) {
    return api.post(`/collaboration-service/approval/forms/frequent/${formId}`)
  },

  removeFrequentForm(formId: number) {
    return api.delete(`/collaboration-service/approval/forms/frequent/${formId}`)
  },

  // ── 댓글 ──
  getComments(docId: number) {
    return api.get<CommentResponse[]>(`/collaboration-service/approval/document/${docId}/comments`)
  },

  createComment(docId: number, data: { parentCommentId: number | null; content: string }) {
    return api.post<CommentResponse>(`/collaboration-service/approval/document/${docId}/comments`, data)
  },

  updateComment(docId: number, commentId: number, data: { content: string }) {
    return api.put<CommentResponse>(`/collaboration-service/approval/document/${docId}/comments/${commentId}`, data)
  },

  deleteComment(docId: number, commentId: number) {
    return api.delete(`/collaboration-service/approval/document/${docId}/comments/${commentId}`)
  },

  // ── 문서함 건수 조회 ──
  getDocumentCounts() {
    return api.get<{
      waiting: number; ccView: number; upcoming: number
      draft: number; temp: number; approved: number; ccViewBox: number; inbox: number
      deptCompleted: number; deptReceived: number; deptSent: number
      deptFolderCounts: Record<string, number>
      personalFolderCounts: Record<string, number>
    }>('/collaboration-service/approval/documents/counts')
  },

  // ── 5. 문서 목록 조회 ──
  getWaitingDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/collaboration-service/approval/documents/waiting', { params })
  },

  getReceivedDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/collaboration-service/approval/documents/received', { params })
  },

  getCcViewDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/collaboration-service/approval/documents/cc-view', { params })
  },

  getUpcomingDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/collaboration-service/approval/documents/upcoming', { params })
  },

  getDraftDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/collaboration-service/approval/documents/draft', { params })
  },

  getTempDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/collaboration-service/approval/documents/temp', { params })
  },

  getApprovedDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/collaboration-service/approval/documents/approved', { params })
  },

  getCcViewBoxDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/collaboration-service/approval/documents/cc-view-box', { params })
  },

  getSentDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/collaboration-service/approval/documents/sent', { params })
  },

  getInboxDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/collaboration-service/approval/documents/inbox', { params })
  },

  // 부서 문서함
  getDeptCompletedDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/collaboration-service/approval/documents/dept/completed', { params })
  },

  getDeptReceivedDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/collaboration-service/approval/documents/dept/received', { params })
  },

  getDeptSentDocuments(params?: DocumentListSearchParams) {
    return api.get<PageResponse<DocumentListItem>>('/collaboration-service/approval/documents/dept/sent', { params })
  },

  // ── 6. 채번 규칙 ──
  getNumberRule() {
    return api.get<NumberRuleResponse>('/collaboration-service/approval/number-rule')
  },

  updateNumberRule(data: NumberRuleUpdateRequest) {
    return api.put('/collaboration-service/approval/number-rule', data)
  },

  // ── 7. 결재선 템플릿 ──
  getLineTemplates() {
    return api.get<ApprovalLineTemplateResponse[]>('/collaboration-service/approval/line-templates')
  },

  getDefaultLineTemplate() {
    return api.get<ApprovalLineTemplateResponse>('/collaboration-service/approval/line-templates/default')
  },

  createLineTemplate(data: ApprovalLineTemplateCreateRequest) {
    return api.post<number>('/collaboration-service/approval/line-templates', data)
  },

  updateLineTemplate(id: number, data: ApprovalLineTemplateCreateRequest) {
    return api.put(`/collaboration-service/approval/line-templates/${id}`, data)
  },

  deleteLineTemplate(id: number) {
    return api.delete(`/collaboration-service/approval/line-templates/${id}`)
  },

  // ── 8. 위임 ──
  getDelegations() {
    return api.get<ApprovalDelegationResponse[]>('/collaboration-service/approval/delegations')
  },

  createDelegation(data: ApprovalDelegationCreateRequest) {
    return api.post<number>('/collaboration-service/approval/delegations', data)
  },

  deleteDelegation(id: number) {
    return api.delete(`/collaboration-service/approval/delegations/${id}`)
  },

  toggleDelegation(id: number) {
    return api.patch(`/collaboration-service/approval/delegations/${id}/toggle`)
  },

  // ── 8-1. 관리자 위임 ──
  getAdminDelegations() {
    return api.get<ApprovalDelegationResponse[]>('/collaboration-service/approval/admin/delegations')
  },

  createAdminDelegation(data: AdminDelegationCreateRequest) {
    return api.post<number>('/collaboration-service/approval/admin/delegations', data)
  },

  deleteAdminDelegation(id: number) {
    return api.delete(`/collaboration-service/approval/admin/delegations/${id}`)
  },

  toggleAdminDelegation(id: number) {
    return api.patch(`/collaboration-service/approval/admin/delegations/${id}/toggle`)
  },

  // ── 9. 서명 ──
  getMySignature() {
    return api.get<ApprovalSignatureResponse>('/collaboration-service/approval/signatures/me')
  },

  uploadMySignature(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<ApprovalSignatureResponse>('/collaboration-service/approval/signatures', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  deleteMySignature() {
    return api.delete('/collaboration-service/approval/signatures')
  },

  getEmployeeSignature(empId: number) {
    return api.get<ApprovalSignatureResponse>(`/collaboration-service/approval/signatures/${empId}`)
  },

  uploadEmployeeSignature(empId: number, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<ApprovalSignatureResponse>(`/collaboration-service/approval/signatures/${empId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  deleteEmployeeSignature(empId: number) {
    return api.delete(`/collaboration-service/approval/signatures/${empId}`)
  },

  // ── 10. 부서 문서함 ──
  getDeptFolders() {
    return api.get<DeptFolderResponse[]>('/collaboration-service/approval/dept-folders')
  },

  createDeptFolder(name: string) {
    return api.post<DeptFolderResponse>('/collaboration-service/approval/dept-folders', { name })
  },

  updateDeptFolder(id: number, name: string) {
    return api.put<DeptFolderResponse>(`/collaboration-service/approval/dept-folders/${id}`, { name })
  },

  deleteDeptFolder(id: number) {
    return api.delete(`/collaboration-service/approval/dept-folders/${id}`)
  },

  reorderDeptFolders(orderList: { id: number; sortOrder: number }[]) {
    return api.put<DeptFolderResponse[]>('/collaboration-service/approval/dept-folders/reorder', { orderList })
  },

  addDeptFolderManager(folderId: number, data: ManagerInfo) {
    return api.post<ManagerInfo>(`/collaboration-service/approval/dept-folders/${folderId}/managers`, data)
  },

  removeDeptFolderManager(folderId: number, empId: number) {
    return api.delete(`/collaboration-service/approval/dept-folders/${folderId}/managers/${empId}`)
  },

  // ── 11. 자동 분류 규칙 ──
  getAutoClassifyRules() {
    return api.get<AutoClassifyRuleResponse[]>('/collaboration-service/approval/auto-classify-rules')
  },

  createAutoClassifyRule(data: AutoClassifyRuleCreateRequest) {
    return api.post<AutoClassifyRuleResponse>('/collaboration-service/approval/auto-classify-rules', data)
  },

  updateAutoClassifyRule(id: number, data: AutoClassifyRuleCreateRequest) {
    return api.put<AutoClassifyRuleResponse>(`/collaboration-service/approval/auto-classify-rules/${id}`, data)
  },

  deleteAutoClassifyRule(id: number) {
    return api.delete(`/collaboration-service/approval/auto-classify-rules/${id}`)
  },

  toggleAutoClassifyRule(id: number) {
    return api.patch(`/collaboration-service/approval/auto-classify-rules/${id}/toggle`)
  },

  reorderAutoClassifyRules(orderList: { id: number; sortOrder: number }[]) {
    return api.put('/collaboration-service/approval/auto-classify-rules/reorder', { orderList })
  },

  // ── 12. 개인 문서함 ──
  getPersonalFolders() {
    return api.get<PersonalFolderResponse[]>('/collaboration-service/approval/personal-folder')
  },

  createPersonalFolder(name: string) {
    return api.post<PersonalFolderResponse>('/collaboration-service/approval/personal-folder', { name })
  },

  updatePersonalFolder(id: number, name: string) {
    return api.put<PersonalFolderResponse>(`/collaboration-service/approval/personal-folder/${id}`, { name })
  },

  deletePersonalFolder(id: number) {
    return api.delete(`/collaboration-service/approval/personal-folder/${id}`)
  },

  reorderPersonalFolders(orderList: { id: number; sortOrder: number }[]) {
    return api.put<PersonalFolderResponse[]>('/collaboration-service/approval/personal-folder/reorder', { orderList })
  },

  transferPersonalFolder(id: number, targetEmpId: number) {
    return api.post(`/collaboration-service/approval/personal-folder/${id}/transfer`, { targetEmpId })
  },

  moveDocuments(folderId: number, docIds: number[], targetFolderId: number) {
    return api.put(`/collaboration-service/approval/personal-folder/${folderId}/move-documents`, { docIds, targetFolderId })
  },

  moveAllDocuments(folderId: number, targetFolderId: number) {
    return api.put(`/collaboration-service/approval/personal-folder/${folderId}/move-all`, null, { params: { targetFolderId } })
  },

  getPersonalFolderDocuments(folderId: number, params: DocumentListSearchParams = {}) {
    return api.get<PageResponse<DocumentListItem>>(`/collaboration-service/approval/personal-folder/${folderId}/documents`, { params })
  },
}
