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

export interface VacationAdvanceUseDto {
  isAllowed: boolean
}

/* ══════════════════════════════════════
   STEP 2. 휴가 유형
   ══════════════════════════════════════ */

export type VacationDeductUnit = 1.0 | 0.5 | 0.25

export type VacationGenderRestriction = 'ALL' | 'MALE_ONLY' | 'FEMALE_ONLY'

export interface VacationTypeRequest {
  typeCode: string
  typeName: string
  deductUnit: number
  sortOrder: number | null
  payType: VacationPayType
  genderLimit: VacationGenderRestriction
}

export interface VacationTypeResponse {
  typeId: number
  typeCode: string
  typeName: string
  deductUnit: number
  isActive: boolean
  sortOrder: number
  isSystemReserved: boolean
  genderLimit?: VacationGenderRestriction | null
  payType?: VacationPayType
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
   STEP 3-0. 본인 보유 휴가 유형 (휴가 사용 신청 모달 드롭다운)
   ══════════════════════════════════════ */

export type VacationPayType = 'PAID' | 'UNPAID'

export interface MyVacationTypeResponse {
  typeId: number
  typeCode: string
  typeName: string
  deductUnit: number
  payType: VacationPayType
  balanceYear: number
  sortOrder: number
  remainingDays: number
  /** 회사 advance_use_active AND 연차/월차 일 때만 true. 잔여가 음수여도 신청 허용. */
  allowAdvance: boolean
}

/* ══════════════════════════════════════
   STEP 3-a. 부여 신청 가능 휴가 유형 (드롭다운)
   ══════════════════════════════════════ */

export type VacationGrantableTypeCode =
  | 'MATERNITY'
  | 'MISCARRIAGE'
  | 'SPOUSE_BIRTH'
  | 'FAMILY_CARE'
  | 'OFFICIAL_LEAVE'

export interface VacationGrantableTypeResponse {
  typeId: number
  typeCode: VacationGrantableTypeCode | string
  typeName: string
  /** 법정 연간 한도. 한도 없는 유형은 null (MISCARRIAGE, OFFICIAL_LEAVE) */
  cap: number | null
  balanceYear: number
  totalDays: number
  usedDays: number
  pendingUseDays: number
  pendingGrantDays: number
  availableDays: number
  /** 남은 신청 가능 일수. cap이 null이면 null */
  grantableDays: number | null
}

/* ══════════════════════════════════════
   STEP 3-b. 휴가 부여 신청 (GRANT)
   — USE 와 달리 기간 필드 없음, pregnancyWeeks 필드 추가
   ══════════════════════════════════════ */

export interface VacationGrantRequestResponse {
  requestId: number
  typeId: number
  typeCode: string
  typeName: string
  empId: number
  empName: string
  empDeptName: string | null
  empGrade: string | null
  empTitle: string | null
  useDays: number
  reason: string | null
  status: VacationRequestStatus
  managerId: number | null
  processedAt: string | null
  rejectReason: string | null
  approvalDocId: number | null
  pregnancyWeeks: number | null
  createdAt: string
}

export interface VacationAdminPeriodResponse {
  requestId: number
  empId: number
  empName: string
  deptName: string
  vacationTypeName: string
  requestStartAt: string
  requestEndAt: string
  useDays: number
}

export interface VacationAdminPeriodPageResponse {
  page: PageRes<VacationAdminPeriodResponse>
  uniqueEmployeeCount: number
  totalUseDays: number
}

/** useDays 소수부로 사용 단위 라벨 결정 (0→종일, 0.5→반차, 그 외→반반차) */
export function useDaysLabel(useDays: number): string {
  const frac = Number(useDays) % 1
  if (frac === 0) return '종일'
  if (frac === 0.5) return '반차'
  return '반반차'
}

/* ══════════════════════════════════════
   전사 휴가 관리 대시보드
   ══════════════════════════════════════ */

export interface DepartmentVacationSummary {
  deptId: number
  deptName: string
  memberCount: number
  avgUsageRate: number
  lowUsageCount: number
  totalDays: number
  usedDays: number
  availableDays: number
}

export interface DepartmentMemberVacation {
  empId: number
  empName: string
  empGrade: string
  deptName: string
  empHireDate: string
  serviceYears: number
  statutoryTypeCode: string
  statutoryTypeName: string
  periodStart: string | null
  periodEnd: string | null
  statutoryAvailable: number
  specialAvailable: number
  usedDays: number
  totalDays: number
  accruedDays: number
  adjustedDays: number
  usageRate: number
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
   (사원용) 내 휴가 현황 — 연차 카드 + 기타 + 예정/지난
   GET /vacation/balances/me/status?year=YYYY
   ══════════════════════════════════════ */

export interface MyVacationAnnualStatus {
  periodStart: string | null
  periodEnd: string | null
  totalDays: number
  usedDays: number
  pendingDays: number
  expiredDays: number
  availableDays: number
}

export interface MyVacationOtherBalance {
  balanceId: number
  typeId: number
  typeCode: string
  typeName: string
  balanceYear: number
  totalDays: number
  availableDays: number
  grantedAt: string | null
  expiresAt: string | null
}

export interface MyVacationRequestItem {
  requestId: number
  status: VacationRequestStatus
  typeId: number
  typeCode: string
  typeName: string
  useDays: number
  startAt: string
  endAt: string
  approvalDocId: number | null
}

export interface MyVacationStatusResponse {
  year: number
  annual: MyVacationAnnualStatus | null
  others: MyVacationOtherBalance[]
  upcoming: MyVacationRequestItem[]
  past: MyVacationRequestItem[]
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
   STEP 4-2. 휴가 조정 이력 (Ledger)
   ══════════════════════════════════════ */

export type VacationLedgerEventType =
  | 'MANUAL_GRANT'
  | 'MANUAL_USED'
  | 'ACCRUAL'
  | 'EXPIRED'
  | 'REQUEST_APPROVED'
  | 'REQUEST_CANCELED'
  | string

export interface VacationAdjustmentResponse {
  ledgerId: number
  eventType: VacationLedgerEventType
  changeDays: number
  typeId: number
  typeName: string
  balanceYear: number
  managerId: number | null
  managerName: string | null
  reason: string | null
  createdAt: string
}

export interface VacationAdjustmentPage {
  content: VacationAdjustmentResponse[]
  size: number
  number: number
  first: boolean
  hasNext: boolean
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

  // 1-9, 1-10 연차/월차 미리쓰기 허용 정책
  getAdvanceUsePolicy: () =>
    api.get<VacationAdvanceUseDto>('/hr-service/vacation/policy/advance-use').then(r => r.data),

  updateAdvanceUsePolicy: (body: VacationAdvanceUseDto) =>
    api.put<void>('/hr-service/vacation/policy/advance-use', body),

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

  reorderTypes: (items: { typeId: number; sortOrder: number }[]) =>
    api
      .put<VacationTypeResponse[]>('/hr-service/vacation/types/reorder', { items })
      .then((r) => r.data),

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

  // 3-1b 관리자 기간별 휴가 목록
  getAdminPeriodRequests: (params: {
    startDate: string
    endDate: string
    statuses?: VacationRequestStatus[]
    page?: number
    size?: number
  }) =>
    api.get<VacationAdminPeriodPageResponse>('/hr-service/vacation/requests/admin/period', {
      params: {
        startDate: params.startDate,
        endDate: params.endDate,
        ...(params.statuses?.length ? { statuses: params.statuses.join(',') } : {}),
        page: params.page ?? 0,
        size: params.size ?? 20,
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

  // (관리자) 특정 사원의 휴가 유형별 잔여 — 전사 휴가 현황 사원 클릭 모달용
  getEmployeeBalances: (empId: number, year: number) =>
    api.get<VacationBalanceResponse[]>(`/hr-service/vacation/balances/employees/${empId}`, {
      params: { year },
    }).then(r => r.data),

  // (사원) 내 휴가 현황 — 연차 카드 + 기타 + 예정/지난 한 번에
  // 주의: upcoming/past 필드는 카드 미리보기용으로만 사용. 모달에서는 아래 페이지네이션 API 사용
  getMyStatus: (year: number) =>
    api.get<MyVacationStatusResponse>('/hr-service/vacation/balances/me/status', {
      params: { year },
    }).then(r => r.data),

  // (사원) 예정 휴가 목록 — 페이지네이션 (정렬: startAt ASC 서버 고정)
  getMyUpcomingRequests: (year: number, page = 0, size = 10) =>
    api.get<PageRes<MyVacationRequestItem>>('/hr-service/vacation/balances/me/requests/upcoming', {
      params: { year, page, size },
    }).then(r => r.data),

  // (사원) 지난 휴가 목록 — 페이지네이션 (정렬: endAt DESC 서버 고정)
  getMyPastRequests: (year: number, page = 0, size = 10) =>
    api.get<PageRes<MyVacationRequestItem>>('/hr-service/vacation/balances/me/requests/past', {
      params: { year, page, size },
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

  // 3-0 (사원) 본인 보유 휴가 유형 — 휴가 사용 신청 모달 드롭다운용
  getMyVacationTypes: () =>
    api
      .get<MyVacationTypeResponse[]>('/hr-service/vacation/requests/my-vacation-types')
      .then((r) => r.data),

  // 3-0 (사원) 부여 신청 가능 휴가 유형
  getGrantableTypes: () =>
    api
      .get<VacationGrantableTypeResponse[]>('/hr-service/vacation/grant-requests/grantable-types')
      .then((r) => r.data),

  // 3-1 (사원) 내 부여 신청 이력
  getMyGrantRequests: (params: { page?: number; size?: number; sort?: string } = {}) =>
    api.get<PageRes<VacationGrantRequestResponse>>('/hr-service/vacation/grant-requests/me', {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 20,
        sort: params.sort ?? 'createdAt,DESC',
      },
    }).then(r => r.data),

  // 3-1b 관리자 부여 신청 현황 (상태별 페이지)
  getAdminGrantRequests: (params: {
    status: VacationRequestStatus
    page?: number
    size?: number
    sort?: string
  }) =>
    api.get<PageRes<VacationGrantRequestResponse>>('/hr-service/vacation/grant-requests/admin', {
      params: {
        status: params.status,
        page: params.page ?? 0,
        size: params.size ?? 20,
        sort: params.sort ?? 'createdAt,DESC',
      },
    }).then(r => r.data),

  // 3-2 (사원) 내 부여 신청 취소
  cancelMyGrantRequest: (requestId: number, body?: VacationCancelRequest) =>
    api.post<void>(`/hr-service/vacation/grant-requests/${requestId}/cancel`, body ?? {}),

  // 4-1 관리자 잔여 일괄 부여
  grantBalance: (body: VacationGrantRequest) =>
    api.post<void>('/hr-service/vacation/balances/grant', body),

  // 4-2 관리자 사원별 조정 이력 조회
  getAdjustments: (params: {
    empId: number
    year?: number
    typeId?: number
    page?: number
    size?: number
  }) =>
    api.get<VacationAdjustmentPage>(`/hr-service/vacation/balances/${params.empId}/adjustments`, {
      params: {
        ...(params.year !== undefined ? { year: params.year } : {}),
        ...(params.typeId !== undefined ? { typeId: params.typeId } : {}),
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    }).then((r) => r.data),

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

  // 대시보드 1. 부서별 요약 카드
  getDashboardDepartments: (params: { year: number; lowUsageThreshold?: number }) =>
    api.get<DepartmentVacationSummary[]>('/hr-service/vacation/dashboard/departments', {
      params: {
        year: params.year,
        ...(params.lowUsageThreshold !== undefined ? { lowUsageThreshold: params.lowUsageThreshold } : {}),
      },
    }).then(r => r.data),

  // 대시보드 2. 부서 사원 상세
  getDashboardDepartmentMembers: (params: {
    deptId: number
    year: number
    typeCode?: string
    page?: number
    size?: number
  }) =>
    api.get<PageRes<DepartmentMemberVacation>>(
      `/hr-service/vacation/dashboard/departments/${params.deptId}/members`,
      {
        params: {
          year: params.year,
          ...(params.typeCode ? { typeCode: params.typeCode } : {}),
          page: params.page ?? 0,
          size: params.size ?? 50,
        },
      },
    ).then(r => r.data),
}
