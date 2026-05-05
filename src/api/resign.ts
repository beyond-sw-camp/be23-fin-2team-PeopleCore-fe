import api from './client'

// ── 타입 정의 ──

export interface ResignListItem {
  id: number               // = resignId
  empId: number            // 사원 PK (퇴직금 산정 등 후속 호출에 사용)
  empNum: string
  empName: string
  deptName: string
  gradeName: string
  empStatus: string        // ACTIVE | CONFIRMED | RESIGNED
  resignDate: string | null // 퇴직예정일자 (yyyy-MM-dd)
  registeredDate: string   // LocalDate (yyyy-MM-dd)
}

export interface ResignDetail {
  resignId: number
  docId: number | null
  empNum: string
  empName: string
  deptName: string
  gradeName: string
  hireDate: string
  empStatus: string        // ACTIVE | CONFIRMED | RESIGNED
  resignDate: string | null // 퇴직예정일자
  registeredDate: string
}

export interface ResignStatus {
  processableCount: number
  confirmedCount: number
  completedCount: number
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

export interface ResignListParams {
  keyword?: string
  empStatus?: string
  sortField?: string
  page?: number
  size?: number
}

// ── API 함수 ──

export const resignApi = {
  /** 퇴직 목록 조회 */
  getList(params: ResignListParams = {}) {
    return api.get<PageResponse<ResignListItem>>('/hr-service/resign', { params })
  },

  /** 퇴직 통계 (카드) */
  getStatus() {
    return api.get<ResignStatus>('/hr-service/resign/status')
  },

  /** 퇴직 상세 조회 */
  getDetail(resignId: number) {
    return api.get<ResignDetail>(`/hr-service/resign/${resignId}/process`)
  },

  /** 퇴직 처리 */
  process(resignId: number) {
    return api.put(`/hr-service/resign/${resignId}`)
  },

  /** 퇴직 기록 삭제 (soft delete) */
  delete(resignId: number) {
    return api.delete(`/hr-service/resign/${resignId}`)
  },
}
