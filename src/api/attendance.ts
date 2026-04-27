import api from './client'

export interface OvertimePolicyRes {
  otPolicyId: number | null
  otMinUnit: 'FIFTEEN' | 'THIRTY' | 'SIXTY'
  otPolicyBefore: boolean
  otPolicyAfter: boolean
  otPolicyWeeklyMaxMinutes: number
  otPolicyWarningMinutes: number
  otExceedAction: 'NOTIFY' | 'BLOCK'
}

export interface OvertimePolicyReq {
  otMinUnit: 'FIFTEEN' | 'THIRTY' | 'SIXTY'
  otPolicyBefore: boolean
  otPolicyAfter: boolean
  otPolicyWeeklyMaxMinutes: number
  otPolicyWarningMinutes: number
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

/**
 * GET /workgroup/me 응답
 * - 휴가 사용 신청 모달에서 반차/반반차 시간대 계산, 근무일 판정에 사용
 * - workDayBitmask: 월=1, 화=2, 수=4, 목=8, 금=16, 토=32, 일=64
 */
export interface MyWorkGroupResponseDto {
  workGroupId: number
  groupName: string
  startTime: string
  endTime: string
  breakStart: string
  breakEnd: string
  workDayBitmask: number
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
  | 'LATE'
  | 'EARLY_LEAVE'
  | 'VACATION_ATTEND'
  | 'MISSING_COMMUTE'
  | 'UNDER_MIN_HOUR'
  | 'UNAPPROVED_OT'
  | 'MAX_HOUR_EXCEED'
  | 'ABSENT'

export const ATTENDANCE_CARD_LABEL: Record<AttendanceCardType, string> = {
  NORMAL: '정상',
  LATE: '지각',
  EARLY_LEAVE: '조퇴',
  VACATION_ATTEND: '휴가 중 출근',
  MISSING_COMMUTE: '출퇴근 누락',
  UNDER_MIN_HOUR: '1일 소정근로 미달',
  UNAPPROVED_OT: '미승인 초과근무',
  MAX_HOUR_EXCEED: '최대근무시간 초과',
  ABSENT: '결근',
}

export const ATTENDANCE_CARD_BADGE: Record<AttendanceCardType, string> = {
  NORMAL: 'bg-green-50 text-green-700 border-green-200',
  LATE: 'bg-orange-50 text-orange-600 border-orange-200',
  EARLY_LEAVE: 'bg-orange-50 text-orange-600 border-orange-200',
  VACATION_ATTEND: 'bg-amber-50 text-amber-700 border-amber-200',
  MISSING_COMMUTE: 'bg-gray-100 text-gray-600 border-gray-200',
  UNDER_MIN_HOUR: 'bg-gray-100 text-gray-600 border-gray-200',
  UNAPPROVED_OT: 'bg-red-50 text-red-600 border-red-200',
  MAX_HOUR_EXCEED: 'bg-red-100 text-red-700 border-red-300',
  ABSENT: 'bg-gray-200 text-gray-700 border-gray-300',
}

export type WorkStatus =
  | 'NORMAL'
  | 'LATE'
  | 'EARLY_LEAVE'
  | 'LATE_AND_EARLY'
  | 'HOLIDAY_WORK'
  | 'AUTO_CLOSED'
  | 'ABSENT'

export const WORK_STATUS_LABEL: Record<WorkStatus, string> = {
  NORMAL: '정상',
  LATE: '지각',
  EARLY_LEAVE: '조퇴',
  LATE_AND_EARLY: '지각+조퇴',
  HOLIDAY_WORK: '휴일근무',
  AUTO_CLOSED: '자동마감',
  ABSENT: '결근',
}

export const WORK_STATUS_BADGE: Record<WorkStatus, string> = {
  NORMAL: 'bg-green-50 text-green-700 border-green-200',
  LATE: 'bg-orange-50 text-orange-600 border-orange-200',
  EARLY_LEAVE: 'bg-orange-50 text-orange-600 border-orange-200',
  LATE_AND_EARLY: 'bg-red-50 text-red-600 border-red-200',
  HOLIDAY_WORK: 'bg-purple-50 text-purple-600 border-purple-200',
  AUTO_CLOSED: 'bg-purple-50 text-purple-600 border-purple-200',
  ABSENT: 'bg-gray-200 text-gray-700 border-gray-300',
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

  // 휴가 신청 모달 진입 시 본인 근무그룹 조회 (반차/반반차 시간대 계산, 근무일 판정)
  getMyWorkGroup: () =>
    api.get<MyWorkGroupResponseDto>('/hr-service/workgroup/me').then(r => r.data),

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

  getAggregateHeadline: (weekStart: string, employmentFilter: EmploymentFilter = 'ALL') =>
    api.get<AttendanceHeadlineRes>('/hr-service/attendance/admin/daily/aggregate/headline', {
      params: { weekStart, employmentFilter },
    }).then(r => r.data),

  getOvertimeRemaining: (weekStart: string) =>
    api.get<OvertimeRemainingRes>('/hr-service/attendance/overtime/remaining', {
      params: { weekStart },
    }).then(r => r.data),

  getOvertimeWeek: (weekStart: string) =>
    api.get<OvertimeWeekRes>('/hr-service/attendance/overtime/week', {
      params: { weekStart },
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

  getPeriodList: (params: {
    start: string
    end: string
    employmentFilter?: EmploymentFilter
    deptId?: number
    workGroupId?: number
    statuses?: AttendanceCardType[]
    keyword?: string
    page?: number
    size?: number
  }) =>
    api.get<PagedResDto<PeriodListItem>>('/hr-service/attendance/admin/daily/period/list', {
      params: {
        start: params.start,
        end: params.end,
        employmentFilter: params.employmentFilter ?? 'ALL',
        deptId: params.deptId,
        workGroupId: params.workGroupId,
        statuses: params.statuses,
        keyword: params.keyword,
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
      paramsSerializer: { indexes: null },
    }).then(r => r.data),

  getWeeklyStats: (weekStart: string, employmentFilter: EmploymentFilter = 'ALL') =>
    api.get<WeeklyStatItem[]>('/hr-service/attendance/admin/daily/weekly-stats', {
      params: { weekStart, employmentFilter },
    }).then(r => r.data),

  getDeptSummary: (weekStart: string, employmentFilter: EmploymentFilter = 'ALL') =>
    api.get<DeptSummaryItem[]>('/hr-service/attendance/admin/daily/dept-summary', {
      params: { weekStart, employmentFilter },
    }).then(r => r.data),

  getOvertimeEmployees: (params: {
    weekStart: string
    employmentFilter?: EmploymentFilter
    keyword?: string
    page?: number
    size?: number
  }) =>
    api.get<PagedResDto<OvertimeEmployeeItem>>('/hr-service/attendance/admin/daily/overtime', {
      params: {
        weekStart: params.weekStart,
        employmentFilter: params.employmentFilter ?? 'ALL',
        keyword: params.keyword,
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
    }).then(r => r.data),

  getEmployeeHistory: (params: {
    empId: number
    date: string
    cardType?: AttendanceCardType
    page?: number
    size?: number
  }) =>
    api.get<EmployeeHistoryRes>(`/hr-service/attendance/admin/daily/employee/${params.empId}/history`, {
      params: {
        date: params.date,
        cardType: params.cardType,
        page: params.page ?? 0,
        size: params.size ?? 10,
      },
    }).then(r => r.data),

  getMyWeeklySummary: (date?: string) =>
    api.get<AttendanceMyWeeklySummary>('/hr-service/attendance/my/weekly-summary', {
      params: date ? { date } : undefined,
    }).then(r => r.data),

  getOvertimeRequestsAdmin: (tab: OvertimeRequestAdminTab, page = 0, size = 10) => {
    const suffix = tab === 'all' ? '' : `/${tab}`
    return api.get<PagedResDto<OvertimeRequestAdminRow>>(`/hr-service/attendance/admin/overtime-requests${suffix}`, {
      params: { page, size },
    }).then(r => r.data)
  },

  getAttendanceModifyPrefill: (workDate: string) =>
    api.get<AttendanceModifyPrefillRes>('/hr-service/attendance/modify/prefill', {
      params: { workDate },
    }).then(r => r.data),

  getAttendanceModify: (attenModiId: number) =>
    api.get<AttendanceModifyDetail>(`/hr-service/attendance/modify/${attenModiId}`).then(r => r.data),

  getAttendanceModifyAdmin: (params: {
    status?: AttendanceModifyStatus
    page?: number
    size?: number
    sort?: string
  }) =>
    api.get<PageRes<AttendanceModifyAdminRow>>('/hr-service/attendance/modify/admin', {
      params: {
        ...(params.status ? { status: params.status } : {}),
        page: params.page ?? 0,
        size: params.size ?? 20,
        sort: params.sort ?? 'createdAt,DESC',
      },
    }).then(r => r.data),

  getMyAttendanceModify: (params: {
    page?: number
    size?: number
    sort?: string
  } = {}) =>
    api.get<PageRes<AttendanceModifyAdminRow>>('/hr-service/attendance/modify/my', {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 20,
        sort: params.sort ?? 'createdAt,DESC',
      },
    }).then(r => r.data),

  getAttendanceModifyWeek: (weekStart: string) =>
    api.get<AttendanceModifyWeekRes>('/hr-service/attendance/modify/week', {
      params: { weekStart },
    }).then(r => r.data),

  getAttendanceModifyHrMembers: () =>
    api.get<AttendanceModifyHrMembersRes>('/hr-service/attendance/modify/hr-members')
      .then(r => r.data),
}

export type OvertimeRequestAdminTab = 'all' | 'pending' | 'approved' | 'rejected'
export type OtStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED'
export type OtType = '연장근무' | '야간근무' | '휴일근무'

export interface OvertimeRequestAdminRow {
  otId: number
  empId: number
  empName: string
  deptName: string
  otType: OtType
  otDate: string
  durationLabel: string
  durationMinutes: number
  otReason: string
  otStatus: OtStatus
  approvalDocId: number | null
}

export type OvertimeMinUnit = 'ONE' | 'FIFTEEN' | 'THIRTY' | 'SIXTY'

export interface PeriodListItem {
  workDate: string
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

export type DayOfWeekEn = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

export interface WeeklyStatItem {
  date: string
  dayOfWeek: DayOfWeekEn
  totalEmp: number
  normal: number
  late: number
  earlyLeave: number
  absent: number
  onLeave: number
  overtime: number
  attendRate: number
}

export interface DeptSummaryItem {
  deptId: number
  deptName: string
  totalEmp: number
  attendRate: number
  lateRate: number
  absentCount: number
  avgOvertimeHours: number
  overtimeCount: number
  weeklyAvg: number
}

export interface TodayCommute {
  checkIn: string | null
  checkOut: string | null
}

export interface MyWorkGroup {
  workGroupId: number | null
  groupName: string
  groupStartTime: string
  groupEndTime: string
  dailyWorkMinutes: number
  weeklyWorkDays: number
  weeklyWorkMinutes: number
  companyWeeklyMaxMinutes: number
}

export interface MyWeeklyStats {
  weekStart: string
  weekEnd: string
  workedMinutes: number
  vacationMinutes: number
  attendedDays: number
  workDays: number
  remainingDays: number
  remainingMinutes: number
  approvedOvertimeMinutes: number
  abnormalDays: number
}

export interface AttendanceMyWeeklySummary {
  today: TodayCommute
  workGroup: MyWorkGroup
  weekly: MyWeeklyStats
}

export type WeeklyWorkStatus = 'NORMAL' | 'WARNING' | 'EXCEEDED'

export const WEEKLY_WORK_STATUS_LABEL: Record<WeeklyWorkStatus, string> = {
  NORMAL: '정상',
  WARNING: '경고',
  EXCEEDED: '초과',
}

export interface OvertimeEmployeeItem {
  empId: number
  empNum: string
  empName: string
  deptName: string | null
  gradeName: string | null
  weeklyWorkMinutes: number
  weeklyMaxMinute: number
  weeklyWarningMinute: number
  overtimeMinutes: number
  status: WeeklyWorkStatus
}

export interface EmployeeHistoryHeader {
  empId: number
  empNum: string
  empName: string
  deptName: string | null
  gradeName: string | null
  weeklyWorkMinutes: number
  weeklyWorkText: string
  cardType: AttendanceCardType | null
  weeklyMaxMinute: number
  weeklyWarningMinute: number
  weeklyStatus: WeeklyWorkStatus
}

export interface EmployeeHistoryRow {
  workDate: string
  dayOfWeek: DayOfWeekEn
  checkInAt: string
  checkOutAt: string | null
  workMinutes: number | null
  workText: string | null
  overtimeMinutes: number | null
  overtimeText: string | null
  attendanceStatuses: AttendanceCardType[]
}

export interface EmployeeHistoryRes {
  header: EmployeeHistoryHeader
  history: PagedResDto<EmployeeHistoryRow>
}

export type HolidayReason = 'NATIONAL' | 'COMPANY' | 'WEEKLY_OFF' | null

export interface CheckInRes {
  comRecId: number
  workDate: string
  checkInAt: string
  checkInIp: string
  workStatus: WorkStatus
  holidayReason: HolidayReason
}

export interface CheckOutRes {
  comRecId: number
  workDate: string
  checkInAt: string
  checkOutAt: string
  checkOutIp: string
  workedMinutes: number
  workStatus: WorkStatus
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

export interface AttendanceHeadlineRes {
  weekStart: string
  weekEnd: string
  attendanceRate: number
  lateRate: number
  absentCount: number
  weeklyMaxExceedCount: number
}

export type OvertimeExceedAction = 'NOTIFY' | 'BLOCK'

export interface OvertimeRemainingRes {
  weeklyMaxMinutes: number
  baseWorkMinutes: number
  maxOvertimeBufferMinutes: number
  weekUsedMinutes: number
  remainingMinutes: number
  exceedAction: OvertimeExceedAction
}

export type OvertimeStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED'

export interface OvertimeWeekItem {
  otId: number
  otStatus: OvertimeStatus
  otDate: string
  otPlanStart: string
  otPlanEnd: string
  otPlanMinutes: number
  otReason: string
}

export interface OvertimeWeekRes {
  weekStart: string
  weekEnd: string
  items: OvertimeWeekItem[]
}

/** @deprecated Kafka 기반 플로우로 전환됨. docData JSON 필드 명세용으로만 유지 */
export interface OvertimeCreateReq {
  otDate: string
  otPlanStart: string
  otPlanEnd: string
  otReason: string
}

/** @deprecated Kafka 기반 플로우로 전환됨. docData JSON 필드 명세용으로만 유지 */
export interface VacationCreateReq {
  infoId: number
  vacReqReason: string
  vacReqItems: Array<{
    startAt: string
    endAt: string
    useDay: number
  }>
}

export type AttendanceModifyStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED'

export const ATTENDANCE_MODIFY_STATUS_BADGE: Record<AttendanceModifyStatus, { text: string; cls: string }> = {
  PENDING: { text: '승인대기', cls: 'bg-yellow-50 text-yellow-600' },
  APPROVED: { text: '승인완료', cls: 'bg-gray-100 text-gray-600' },
  REJECTED: { text: '반려', cls: 'bg-red-50 text-red-500' },
  CANCELED: { text: '취소', cls: 'bg-gray-100 text-gray-500' },
}

export interface AttendanceModifyPrefillRes {
  formId: number
  formCode: string
  comRecId: number
  workDate: string
  currentCheckIn: string | null
  currentCheckOut: string | null
  isAutoClosed: boolean
  workStatus: WorkStatus | null
  /** @deprecated workStatus enum 사용. 백엔드 호환성 위해 유지. */
  workStatusLabel: string | null
  empId: number
  empName: string
  deptName: string | null
  gradeName: string | null
  titleName: string | null
}

export interface AttendanceModifyDetail {
  attenModiId: number
  approvalDocId: number | null
  comRecId: number
  workDate: string
  empId: number
  attenEmpName: string
  attenEmpDeptName: string | null
  attenEmpGrade: string | null
  attenEmpTitle: string | null
  attenReqCheckIn: string
  attenReqCheckOut: string
  attenReason: string
  attenStatus: AttendanceModifyStatus
  managerId: number | null
  managerName: string | null
  attenRejectReason: string | null
  createdAt: string
  updatedAt: string
}

export interface AttendanceModifyWeekDay {
  workDate: string
  dayOfWeek: DayOfWeekEn
  isHoliday: boolean
  holidayReason: HolidayReason
  comRecId: number | null
  checkIn: string | null
  checkOut: string | null
  actualWorkMinutes: number
  recognizedOvertimeMinutes: number
  unrecognizedOvertimeMinutes: number
  workStatus: WorkStatus | null
  isVacation: boolean
  vacationTypeName: string | null
  vacationStart: string | null
  vacationEnd: string | null
  vacationUseDay: number | null
}

export interface AttendanceModifyWeekRes {
  weekStart: string
  weekEnd: string
  days: AttendanceModifyWeekDay[]
}

export interface AttendanceModifyAdminRow {
  attenModiId: number
  approvalDocId: number | null
  workDate: string
  attenEmpName: string
  attenEmpDeptName: string | null
  attenEmpGrade: string | null
  attenReqCheckIn: string
  attenReqCheckOut: string
  attenReason: string
  attenStatus: AttendanceModifyStatus
  createdAt: string
}

export interface HrMember {
  empId: number
  empName: string
  deptName: string
  gradeName: string
  titleName: string
  empRole: string
}

export interface AttendanceModifyHrMembersRes {
  hrMembers: HrMember[]
}

export const formatHm = (min: number) => {
  const m = Math.max(0, min)
  return `${Math.floor(m / 60)}h ${m % 60}m`
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
