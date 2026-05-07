import api from './client'

// ── Enums ──
export type EventsNotiMethod = 'EMAIL' | 'PUSH' | 'POPUP'
export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
export type ShareStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

// ── Event DTOs ──
export interface NotificationReq { method: EventsNotiMethod; minutesBefore: number }
export interface NotificationRes { notificationId: number; method: EventsNotiMethod; minutesBefore: number }

export interface RepeatedRulesReq { frequency: Frequency; intervalVal: number; byDay?: string; byMonthDay?: string; until?: string; count?: number }
export interface RepeatedRulesRes { repeatedRulesId: number; frequency: Frequency; intervalVal: number; byDay?: string; byMonthDay?: string; until?: string; count?: number }

export interface EventCreateReq {
  title: string; description?: string; location?: string
  startAt: string; endAt: string; isAllDay: boolean; isPublic: boolean
  myCalendarsId: number
  repeatedRule?: RepeatedRulesReq
  notifications?: NotificationReq[]
  attendeeEmpIds?: number[]
}

export interface EventUpdateReq {
  title: string; description?: string; location?: string
  startAt: string; endAt: string; isAllDay: boolean; isPublic: boolean
  myCalendarsId: number
  notifications?: NotificationReq[]
}

export interface EventRes {
  eventsId: number; title: string; description?: string; location?: string
  startAt: string; endAt: string; isAllDay: boolean; isPublic: boolean
  myCalendarsId: number; calendarName: string; displayColor: string; empId: number
  companyCalendarId?: number; isAllEmployees?: boolean
  createdAt: string
  repeatedRule?: RepeatedRulesRes
  notifications?: NotificationRes[]
}

export type CalendarHolidayType = 'NATIONAL' | 'COMPANY'
export interface CalendarHolidayRes {
  holidayId: number
  date: string
  occurrenceDate?: string
  name?: string
  type?: CalendarHolidayType
  holidayName?: string
  holidayType?: CalendarHolidayType
}
export interface CalendarEventRangeRes {
  events: EventRes[]
  holidays: CalendarHolidayRes[]
}

// ── MyCalendar DTOs ──
export interface MyCalendarCreateReq { calendarName: string; displayColor: string; isPublic?: boolean }
export interface MyCalendarUpdateReq { calendarName?: string; displayColor?: string; isVisible?: boolean; isPublic?: boolean; sortOrder?: number }
export interface MyCalendarRes { myCalendarsId: number; calendarName: string; displayColor: string; isVisible: boolean; isPublic: boolean; sortOrder: number; isDefault: boolean }

// ── CompanyCalendar DTOs ──
export interface CompanyCalendarRes { companyCalendarId: number; calendarName: string; displayColor: string; isVisible: boolean; sortOrder: number }
export interface CompanyEventCreateReq {
  title: string; description?: string; location?: string
  startAt: string; endAt: string; isAllDay: boolean
  isAllEmployees: boolean
}

// ── InterestCalendar DTOs ──
export interface ShareRequestCreateReq { targetEmpId: number }
export interface ShareRequestRes { calendarShareReqId: number; fromEmpId: number; fromEmpName: string; toEmpId: number; toEmpName: string; shareStatus: ShareStatus; requestedAt: string; respondedAt?: string }
export interface InterestCalendarUpdateReq { displayColor?: string; isVisible?: boolean; sortOrder?: number }
export interface InterestCalendarRes { interestCalendarId: number; targetEmpId: number; targetEmpName: string; displayColor: string; isVisible: boolean; sortOrder: number; requestedAt: string; respondedAt?: string }

const BASE = '/collaboration-service/calendar'
const rangeParams = (start: string, end: string) => ({ start, end, from: start, to: end })

// ── Event API ──
export const calendarEventApi = {
  create: (data: EventCreateReq) =>
    api.post<EventRes>(`${BASE}/events`, data).then(r => r.data),
  update: (id: number, data: EventUpdateReq) =>
    api.put<EventRes>(`${BASE}/events/${id}`, data).then(r => r.data),
  delete: (id: number) =>
    api.delete(`${BASE}/events/${id}`),
  getDetail: (id: number) =>
    api.get<EventRes>(`${BASE}/events/${id}`).then(r => r.data),
  getByRange: (start: string, end: string) =>
    api.get<EventRes[] | CalendarEventRangeRes>(`${BASE}/events`, { params: rangeParams(start, end) })
      .then(r => Array.isArray(r.data) ? r.data : (r.data?.events ?? [])),
  getRangeWithHolidays: (start: string, end: string) =>
    api.get<EventRes[] | CalendarEventRangeRes>(`${BASE}/events`, { params: rangeParams(start, end) })
      .then((r): CalendarEventRangeRes => Array.isArray(r.data)
        ? { events: r.data, holidays: [] }
        : { events: r.data.events ?? [], holidays: r.data.holidays ?? [] }),
}

// ── MyCalendar API ──
export const myCalendarApi = {
  getList: () =>
    api.get<MyCalendarRes[]>(`${BASE}/my`).then(r => r.data),
  create: (data: MyCalendarCreateReq) =>
    api.post<MyCalendarRes>(`${BASE}/my`, data).then(r => r.data),
  update: (id: number, data: MyCalendarUpdateReq) =>
    api.patch<MyCalendarRes>(`${BASE}/my/${id}`, data).then(r => r.data),
  delete: (id: number) =>
    api.delete(`${BASE}/my/${id}`),
}

// ── CompanyCalendar API ──
export const companyCalendarApi = {
  createEvent: (data: CompanyEventCreateReq) =>
    api.post<EventRes>(`${BASE}/company-events`, data).then(r => r.data),
}

// ── InterestCalendar API ──
export const interestCalendarApi = {
  getList: () =>
    api.get<InterestCalendarRes[]>(`${BASE}/interest`).then(r => r.data),
  requestShare: (data: ShareRequestCreateReq) =>
    api.post(`${BASE}/interest/share-request`, data),
  respondShare: (shareReqId: number, accepted: boolean) =>
    api.patch(`${BASE}/interest/share-request/${shareReqId}`, null, { params: { accepted } }),
  getSentRequests: (page = 0, size = 20) =>
    api.get<{ content: ShareRequestRes[] }>(`${BASE}/interest/share-request/sent`, { params: { page, size } }).then(r => r.data),
  getReceivedRequests: (page = 0, size = 20) =>
    api.get<{ content: ShareRequestRes[] }>(`${BASE}/interest/share-request/received`, { params: { page, size } }).then(r => r.data),
  update: (id: number, data: InterestCalendarUpdateReq) =>
    api.patch<InterestCalendarRes>(`${BASE}/interest/${id}`, data).then(r => r.data),
  delete: (id: number) =>
    api.delete(`${BASE}/interest/${id}`),
}
