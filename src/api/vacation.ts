import api from './client'

/* ══════════════════════════════════════
   공통 타입
   ══════════════════════════════════════ */
export interface PageRes<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
  numberOfElements?: number
}

/* ══════════════════════════════════════
   STEP 1. 연차 정책
   ══════════════════════════════════════ */

export type VacationGrantBasisType = 'HIRE' | 'FISCAL'

export interface VacationGrantBasisDto {
  grantBasis: VacationGrantBasisType
  /** mm-dd 형식. HIRE면 null, FISCAL이면 "01-01" */
  fiscalYearStart: string | null
}

export interface VacationRuleRes {
  id: number
  minYears: number
  maxYears: number | null
  days: number
  desc: string | null
}

export interface VacationRuleCreateReq {
  minYears: number
  maxYears: number | null
  days: number
  desc: string | null
}

export interface VacationPromotionPolicyDto {
  isActive: boolean
  firstMonthsBefore: number | null
  secondMonthsBefore: number | null
}

/* ══════════════════════════════════════
   STEP 2. 휴가 유형
   ══════════════════════════════════════ */

export type VacationDeductUnit = 1.0 | 0.5 | 0.25

export interface VacationTypeRequest {
  typeCode: string
  typeName: string
  deductUnit: number
  sortOrder: number | null
}

export interface VacationTypeResponse {
  typeId: number
  typeCode: string
  typeName: string
  deductUnit: number
  isActive: boolean
  sortOrder: number
  isSystemReserved: boolean
}

/* ══════════════════════════════════════
   STEP 3. 신청 이력
   ══════════════════════════════════════ */

export type VacationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED'

export const VACATION_REQUEST_STATUS_LABEL: Record<VacationRequestStatus, string> = {
  PENDING: '승인대기',
  APPROVED: '승인완료',
  REJECTED: '반려',
  CANCELED: '취소',
}

export interface VacationRequestResponse {
  requestId: number
  typeId: number
  typeCode: string
  typeName: string
  empId: number
  empName: string
  empDeptName: string | null
  empGrade: string | null
  empTitle: string | null
  startAt: string
  endAt: string
  useDays: number
  reason: string | null
  status: VacationRequestStatus
  managerId: number | null
  processedAt: string | null
  rejectReason: string | null
  approvalDocId: number | null
  createdAt: string
}

export interface VacationCancelRequest {
  reason?: string
}

/* ══════════════════════════════════════
   (사원용) 내 잔여
   ══════════════════════════════════════ */

export interface VacationBalanceResponse {
  balanceId: number
  typeId: number
  typeCode: string
  typeName: string
  balanceYear: number
  totalDays: number
  usedDays: number
  pendingDays: number
  expiredDays: number
  availableDays: number
  grantedAt: string
  expiresAt: string | null
}

/* ══════════════════════════════════════
   STEP 4. 잔여 부여 (관리자)
   ══════════════════════════════════════ */

export interface VacationGrantRequest {
  typeId: number
  empIds: number[]
  days: number
  year?: number | null
  expiresAt?: string | null
  reason?: string | null
}

/* ══════════════════════════════════════
   STEP 5. 촉진 통지 이력
   ══════════════════════════════════════ */

export type VacationPromotionNoticeStage = 'FIRST' | 'SECOND'

export interface VacationPromotionNoticeResponse {
  noticeId: number
  empId: number
  noticeYear: number
  targetRemainingDays: number
  noticeStage: VacationPromotionNoticeStage
  noticeSentAt: string
  employeeResponse: string | null
  responseUsedDays: number | null
  responseRecordedAt: string | null
}

/* ══════════════════════════════════════
   API
   ══════════════════════════════════════ */

export const vacationApi = {
  // 1-1, 1-2 연차 지급 기준
  getGrantBasis: () =>
    api.get<VacationGrantBasisDto>('/hr-service/vacation/policy/grant-basis').then(r => r.data),

  updateGrantBasis: (body: VacationGrantBasisDto) =>
    api.put<VacationGrantBasisDto>('/hr-service/vacation/policy/grant-basis', body).then(r => r.data),

  // 1-3 ~ 1-6 연차 발생 규칙
  getRules: () =>
    api.get<VacationRuleRes[]>('/hr-service/vacation/policy/rules').then(r => r.data),

  createRule: (body: VacationRuleCreateReq) =>
    api.post<VacationRuleRes>('/hr-service/vacation/policy/rules', body).then(r => r.data),

  updateRule: (ruleId: number, body: VacationRuleCreateReq) =>
    api.put<VacationRuleRes>(`/hr-service/vacation/policy/rules/${ruleId}`, body).then(r => r.data),

  deleteRule: (ruleId: number) =>
    api.delete<void>(`/hr-service/vacation/policy/rules/${ruleId}`),

  // 1-7, 1-8 연차 촉진 정책
  getPromotionPolicy: () =>
    api.get<VacationPromotionPolicyDto>('/hr-service/vacation/policy/promotion').then(r => r.data),

  updatePromotionPolicy: (body: VacationPromotionPolicyDto) =>
    api.put<void>('/hr-service/vacation/policy/promotion', body),

  // 2-1 ~ 2-5 휴가 유형 (관리자)
  getAllTypes: () =>
    api.get<VacationTypeResponse[]>('/hr-service/vacation/types/all').then(r => r.data),

  getActiveTypes: () =>
    api.get<VacationTypeResponse[]>('/hr-service/vacation/types').then(r => r.data),

  createType: (body: VacationTypeRequest) =>
    api.post<VacationTypeResponse>('/hr-service/vacation/types', body).then(r => r.data),

  updateType: (typeId: number, body: VacationTypeRequest) =>
    api.put<VacationTypeResponse>(`/hr-service/vacation/types/${typeId}`, body).then(r => r.data),

  deactivateType: (typeId: number) =>
    api.delete<void>(`/hr-service/vacation/types/${typeId}`),

  hardDeleteType: (typeId: number) =>
    api.delete<void>(`/hr-service/vacation/types/${typeId}/hard`),

  activateType: (typeId: number) =>
    api.post<void>(`/hr-service/vacation/types/${typeId}/activate`),

  // 3-1 관리자 상태별 신청 목록
  getAdminRequests: (params: {
    status: VacationRequestStatus
    page?: number
    size?: number
    sort?: string
  }) =>
    api.get<PageRes<VacationRequestResponse>>('/hr-service/vacation/requests/admin', {
      params: {
        status: params.status,
        page: params.page ?? 0,
        size: params.size ?? 20,
        sort: params.sort ?? 'createdAt,DESC',
      },
    }).then(r => r.data),

  // 3-2 관리자 직권 취소
  adminCancelRequest: (requestId: number, body: VacationCancelRequest) =>
    api.post<void>(`/hr-service/vacation/requests/admin/${requestId}/cancel`, body),

  // (사원) 내 잔여
  getMyBalances: (year?: number) =>
    api.get<VacationBalanceResponse[]>('/hr-service/vacation/balances/me', {
      params: year !== undefined ? { year } : {},
    }).then(r => r.data),

  // (사원) 내 신청 이력
  getMyRequests: (params: { page?: number; size?: number; sort?: string } = {}) =>
    api.get<PageRes<VacationRequestResponse>>('/hr-service/vacation/requests/me', {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 20,
        sort: params.sort ?? 'createdAt,DESC',
      },
    }).then(r => r.data),

  // (사원) 내 신청 취소
  cancelMyRequest: (requestId: number, body?: VacationCancelRequest) =>
    api.post<void>(`/hr-service/vacation/requests/${requestId}/cancel`, body ?? {}),

  // 4-1 관리자 잔여 일괄 부여
  grantBalance: (body: VacationGrantRequest) =>
    api.post<void>('/hr-service/vacation/balances/grant', body),

  // 5-1 관리자 촉진 통지 이력 (회사 전체)
  getAdminPromotionNotices: (params: {
    year?: number
    page?: number
    size?: number
    sort?: string
  } = {}) =>
    api.get<PageRes<VacationPromotionNoticeResponse>>('/hr-service/vacation/promotion-notices', {
      params: {
        ...(params.year !== undefined ? { year: params.year } : {}),
        page: params.page ?? 0,
        size: params.size ?? 20,
        sort: params.sort ?? 'noticeSentAt,DESC',
      },
    }).then(r => r.data),

  // 5-2 사원용 내 촉진 통지 이력
  getMyPromotionNotices: (year?: number) =>
    api.get<VacationPromotionNoticeResponse[]>('/hr-service/vacation/promotion-notices/me', {
      params: year !== undefined ? { year } : {},
    }).then(r => r.data),
}
