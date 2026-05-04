import api from './client'

// ── 타입 정의 ──

export type OrderType = 'PROMOTION' | 'TRANSFER' | 'TITLE_CHANGE'
export type OrderStatus = 'SCHEDULED' | 'APPLIED'

export interface HrOrderListItem {
  orderId: number
  empId: number
  empNum: string
  empName: string
  orderType: OrderType
  effectiveDate: string
  status: OrderStatus
  isNotified: boolean
  createAt: string
}

export interface HrOrderDetailInfo {
  targetType: string   // GRADE | DEPARTMENT | TITLE
  beforeName: string
  afterName: string
}

export interface HrOrderFieldDetail {
  fieldKey: string
  label: string
  section: string
  fieldType: string
  value: string
}

export interface HrOrderDetail {
  orderId: number
  empId: number
  empNum: string
  empName: string
  deptName: string
  gradeName: string
  titleName: string
  orderType: OrderType
  effectiveDate: string
  status: OrderStatus
  isNotified: boolean
  notifiedAt: string | null
  createdAt: string
  details: HrOrderDetailInfo[]
  formFields: HrOrderFieldDetail[]
}

export interface HrOrderCreateReq {
  orderType: OrderType
  effectiveDate: string   // yyyy-MM-dd
  details: {
    empId: number
    targetType: string    // DEPARTMENT | GRADE | TITLE
    beforeId: number
    afterId: number
  }[]
  formValues?: Record<string, string>
}

export interface HrOrderUpdateReq {
  orderType: OrderType
  effectiveDate: string
  details: {
    empId: number
    targetType: string
    beforeId: number
    afterId: number
  }[]
  formValues?: Record<string, string>
}

export interface HrOrderHistoryItem {
  // 백엔드 hr_order 행은 number, HIRE/RESIGN 합성 행은 null
  orderId: number | null
  // 백엔드는 hr_order의 OrderType 외에 'HIRE'/'RESIGN' 합성 문자열도 보냄
  orderType: string
  effectiveDate: string
  // hr_order는 OrderStatus enum 값, 합성행은 'APPLIED' 같은 문자열
  status: string
  createAt: string
  detailChange: {
    targetType: string   // GRADE | DEPARTMENT | TITLE
    beforeName: string
    afterName: string
  }[]
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export interface HrOrderListParams {
  keyword?: string
  orderType?: OrderType
  status?: OrderStatus
  page?: number
  size?: number
}

// ── API 함수 ──

export const hrOrderApi = {
  /** 발령 목록 조회 (페이징, 필터) */
  getList(params: HrOrderListParams = {}) {
    return api.get<PageResponse<HrOrderListItem>>('/hr-service/hr-order', { params })
  },

  /** 발령 상세 조회 */
  getDetail(orderId: number) {
    return api.get<HrOrderDetail>(`/hr-service/hr-order/${orderId}`)
  },

  /** 발령 등록 (status = SCHEDULED, 발령일이 오늘 이전이면 즉시 반영) */
  create(data: HrOrderCreateReq) {
    return api.post<number>('/hr-service/hr-order', data)
  },

  /** 발령 수정 (SCHEDULED 상태만) */
  update(orderId: number, data: HrOrderUpdateReq) {
    return api.put('/hr-service/hr-order/' + orderId, data)
  },

  /** 발령 삭제 (SCHEDULED 상태만, soft delete) */
  delete(orderId: number) {
    return api.delete(`/hr-service/hr-order/${orderId}`)
  },

  /** 알림 발송 */
  notify(orderId: number) {
    return api.put(`/hr-service/hr-order/${orderId}/notify`)
  },

  /** 사원 인사 이력 조회 */
  getHistory(empId: number) {
    return api.get<HrOrderHistoryItem[]>(`/hr-service/hr-order/history/${empId}`)
  },
}
