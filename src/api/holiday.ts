import api from './client'

export type HolidayType = 'NATIONAL' | 'COMPANY'

export interface HolidayRes {
  holidayId: number
  /** 원본 저장값 (반복 휴일은 최초 등록 연도) */
  date: string
  /** year 파라미터 기준 실제 발생일 - 달력 매칭용 */
  occurrenceDate: string
  holidayName: string
  holidayType: HolidayType
  isRepeating: boolean
  companyId: string | null
  createdAt: string
  updatedAt: string
}

export interface HolidayReq {
  date: string
  holidayName: string
  isRepeating: boolean
}

export type HolidayTypeFilter = 'ALL' | HolidayType

export const holidayApi = {
  list: (year: number, type: HolidayTypeFilter = 'ALL') =>
    api
      .get<HolidayRes[]>('/hr-service/holiday/admin', { params: { year, type } })
      .then((r) => r.data),

  create: (body: HolidayReq) =>
    api.post<HolidayRes>('/hr-service/holiday/admin', body).then((r) => r.data),

  update: (holidayId: number, body: HolidayReq) =>
    api
      .put<HolidayRes>(`/hr-service/holiday/admin/${holidayId}`, body)
      .then((r) => r.data),

  delete: (holidayId: number) =>
    api.delete<void>(`/hr-service/holiday/admin/${holidayId}`),
}
