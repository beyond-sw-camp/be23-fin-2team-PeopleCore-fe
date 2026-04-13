import api from './client'

export interface OvertimePolicyRes {
  otPolicyId: number | null
  otMinUnit: 'FIFTEEN' | 'THIRTY' | 'SIXTY'
  otPolicyBefore: boolean
  otPolicyAfter: boolean
  otPolicyWeeklyMaxHour: number
  otPolicyWarningHour: number
  otExceedAction: 'NOTIFY' | 'BLOCK'
}

export interface OvertimePolicyReq {
  otMinUnit: 'FIFTEEN' | 'THIRTY' | 'SIXTY'
  otPolicyBefore: boolean
  otPolicyAfter: boolean
  otPolicyWeeklyMaxHour: number
  otPolicyWarningHour: number
  otExceedAction: 'NOTIFY' | 'BLOCK'
}

export type OvertimeRecognize = 'APPROVAL' | 'ALL'

export interface WorkGroupListItem {
  workGroupId: number
  groupName: string
  groupCode: string
  groupStartTime: string
  groupEndTime: string
  groupWorkDay: number
  groupMobileCheck: boolean
  memberCount: number
}

export interface WorkGroupDetail {
  workGroupId: number
  groupName: string
  groupCode: string
  groupDesc: string
  groupStartTime: string
  groupEndTime: string
  groupWorkDay: number
  groupBreakStart: string
  groupBreakEnd: string
  groupOvertimeRecognize: OvertimeRecognize
  groupMobileCheck: boolean
}

export interface WorkGroupReq {
  groupName: string
  groupCode: string
  groupDesc: string
  groupStartTime: string
  groupEndTime: string
  groupWorkDay: number
  groupBreakStart: string
  groupBreakEnd: string
  groupOvertimeRecognize: OvertimeRecognize
  groupMobileCheck: boolean
}

export interface WorkGroupOption {
  workGroupId: number
  groupName: string
  groupCode: string
}

export interface WorkGroupMember {
  empId: number
  empName: string
  deptName: string
  gradeName: string
  titleName: string
}

export interface PageRes<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface PagedResDto<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type AttendanceCardType =
  | 'NORMAL'
  | 'WORKING'
  | 'LATE'
  | 'EARLY_LEAVE'
  | 'VACATION_ATTEND'
  | 'MISSING_COMMUTE'
  | 'UNDER_MIN_HOUR'
  | 'OFFSITE'
  | 'UNAPPROVED_OT'
  | 'MAX_HOUR_EXCEED'

export const ATTENDANCE_CARD_LABEL: Record<AttendanceCardType, string> = {
  NORMAL: '정상',
  WORKING: '종일근무상태',
  LATE: '지각',
  EARLY_LEAVE: '조퇴',
  VACATION_ATTEND: '휴가 중 출근',
  MISSING_COMMUTE: '출퇴근 누락',
  UNDER_MIN_HOUR: '1일 소정근로 미달',
  OFFSITE: '근무지 외',
  UNAPPROVED_OT: '미승인 초과근무',
  MAX_HOUR_EXCEED: '최대근무시간 초과',
}

export const ATTENDANCE_CARD_BADGE: Record<AttendanceCardType, string> = {
  NORMAL: 'bg-green-50 text-green-700 border-green-200',
  WORKING: 'bg-blue-50 text-blue-600 border-blue-200',
  LATE: 'bg-orange-50 text-orange-600 border-orange-200',
  EARLY_LEAVE: 'bg-orange-50 text-orange-600 border-orange-200',
  VACATION_ATTEND: 'bg-amber-50 text-amber-700 border-amber-200',
  MISSING_COMMUTE: 'bg-gray-100 text-gray-600 border-gray-200',
  UNDER_MIN_HOUR: 'bg-gray-100 text-gray-600 border-gray-200',
  OFFSITE: 'bg-red-50 text-red-600 border-red-200',
  UNAPPROVED_OT: 'bg-red-50 text-red-600 border-red-200',
  MAX_HOUR_EXCEED: 'bg-red-100 text-red-700 border-red-300',
}

export type EmploymentFilter = 'ALL' | 'ACTIVE' | 'ON_LEAVE'

export interface DailySummaryRes {
  date: string
  counts: Record<AttendanceCardType, number>
}

export interface DailyListItem {
  empId: number
  empNum: string
  empName: string
  deptName: string | null
  workGroupName: string | null
  checkInAt: string | null
  checkOutAt: string | null
  totalWorkMinutes: number | null
  vacationTypeName: string | null
  attendanceStatuses: AttendanceCardType[]
}

export interface DailyCardItem {
  empId: number
  empNum: string
  empName: string
  deptName: string | null
  gradeName: string | null
  weeklyWorkedMinutes: number
  weeklyWorkedText: string
  detail: string
}

export const WEEKDAY_BITS = [
  { day: '월', bit: 1 },
  { day: '화', bit: 2 },
  { day: '수', bit: 4 },
  { day: '목', bit: 8 },
  { day: '금', bit: 16 },
  { day: '토', bit: 32 },
  { day: '일', bit: 64 },
] as const

export const encodeWorkDays = (days: string[]): number =>
  WEEKDAY_BITS.reduce((acc, { day, bit }) => (days.includes(day) ? acc | bit : acc), 0)

export const decodeWorkDays = (mask: number): string[] =>
  WEEKDAY_BITS.filter(({ bit }) => (mask & bit) !== 0).map((w) => w.day)

export const attendanceApi = {
  getOvertimePolicy: () =>
    api.get<OvertimePolicyRes>('/hr-service/overtime/policy').then(r => r.data),

  saveOvertimePolicy: (data: OvertimePolicyReq) =>
    api.put<OvertimePolicyRes>('/hr-service/overtime/policy', data).then(r => r.data),

  getWorkGroups: () =>
    api.get<WorkGroupListItem[]>('/hr-service/workgroup').then(r => r.data),

  getWorkGroupOptions: () =>
    api.get<WorkGroupOption[]>('/hr-service/workgroup/options').then(r => r.data),

  getWorkGroup: (id: number) =>
    api.get<WorkGroupDetail>(`/hr-service/workgroup/${id}`).then(r => r.data),

  getWorkGroupMembers: (id: number, page = 0, size = 10, sort?: string) =>
    api.get<PageRes<WorkGroupMember>>(`/hr-service/workgroup/employees/${id}`, {
      params: { page, size, ...(sort ? { sort } : {}) },
    }).then(r => r.data),

  createWorkGroup: (data: WorkGroupReq) =>
    api.post<WorkGroupDetail>('/hr-service/workgroup', data).then(r => r.data),

  updateWorkGroup: (id: number, data: WorkGroupReq) =>
    api.put<WorkGroupDetail>(`/hr-service/workgroup/${id}`, data).then(r => r.data),

  deleteWorkGroup: (id: number) =>
    api.delete(`/hr-service/workgroup/${id}`),

  transferMembers: (sourceWorkGroupId: number, data: { targetWorkGroupId: number; empIds: number[] }) =>
    api.put<WorkGroupTransferRes>(`/hr-service/workgroup/member/transfer/${sourceWorkGroupId}`, data).then(r => r.data),

  getAllowedIps: () =>
    api.get<AllowedIpRes[]>('/hr-service/company/allowed-ips').then(r => r.data),

  createAllowedIp: (data: AllowedIpReq) =>
    api.post<AllowedIpRes>('/hr-service/company/allowed-ips', data).then(r => r.data),

  updateAllowedIp: (id: number, data: AllowedIpReq) =>
    api.put<AllowedIpRes>(`/hr-service/company/allowed-ips/${id}`, data).then(r => r.data),

  toggleAllowedIp: (id: number) =>
    api.patch<AllowedIpRes>(`/hr-service/company/allowed-ips/${id}/toggle`).then(r => r.data),

  deleteAllowedIp: (id: number) =>
    api.delete(`/hr-service/company/allowed-ips/${id}`),

  checkIn: () =>
    api.post<CheckInRes>('/hr-service/attendance/check-in').then(r => r.data),

  checkOut: () =>
    api.post<CheckOutRes>('/hr-service/attendance/check-out').then(r => r.data),

  getDailySummary: (date: string, employmentFilter: EmploymentFilter = 'ALL') =>
    api.get<DailySummaryRes>('/hr-service/attendance/admin/daily/summary', {
      params: { date, employmentFilter },
    }).then(r => r.data),

  getDailyList: (params: {
    date: string
    employmentFilter?: EmploymentFilter
    deptId?: number
    workGroupId?: number
    statuses?: AttendanceCardType[]
    keyword?: string
    page?: number
    size?: number
  }) =>
    api.get<PagedResDto<DailyListItem>>('/hr-service/attendance/admin/daily/list', {
      params: {
        date: params.date,
        employmentFilter: params.employmentFilter ?? 'ALL',
        ...(params.deptId != null ? { deptId: params.deptId } : {}),
        ...(params.workGroupId != null ? { workGroupId: params.workGroupId } : {}),
        ...(params.statuses && params.statuses.length > 0 ? { statuses: params.statuses } : {}),
        ...(params.keyword ? { keyword: params.keyword } : {}),
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
      paramsSerializer: {
        indexes: null,
      },
    }).then(r => r.data),

  getDailyCard: (params: {
    date: string
    cardType: AttendanceCardType
    employmentFilter?: EmploymentFilter
    page?: number
    size?: number
  }) =>
    api.get<PagedResDto<DailyCardItem>>('/hr-service/attendance/admin/daily/card', {
      params: {
        date: params.date,
        cardType: params.cardType,
        employmentFilter: params.employmentFilter ?? 'ALL',
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
    }).then(r => r.data),
}

export type CheckInStatus = 'ON_TIME' | 'LATE' | 'HOLIDAY_WORK'
export type CheckOutStatus = 'EARLY_LEAVE' | 'ON_TIME' | 'HOLIDAY_WORK_END'
export type HolidayReason = 'NATIONAL' | 'COMPANY' | 'WEEKLY_OFF' | null

export interface CheckInRes {
  comRecId: number
  workDate: string
  checkInAt: string
  checkInIp: string
  isOffsite: boolean
  checkInStatus: CheckInStatus
  holidayReason: HolidayReason
}

export interface CheckOutRes {
  comRecId: number
  workDate: string
  checkInAt: string
  checkOutAt: string
  checkOutIp: string
  workedMinutes: number
  isOffsite: boolean
  checkOutStatus: CheckOutStatus
  holidayReason: HolidayReason
}

export interface AllowedIpRes {
  id: number
  ipCidr: string
  label: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AllowedIpReq {
  ipCidr: string
  label?: string
  isActive?: boolean
}

export interface WorkGroupTransferRes {
  sourceWorkGroupId: number
  targetWorkGroupId: number
  movedCount: number
  movedMembers: Array<{
    empId: number
    empName: string
    deptName: string | null
    gradeName: string | null
    titleName: string | null
    assignedAt: string
  }>
}
