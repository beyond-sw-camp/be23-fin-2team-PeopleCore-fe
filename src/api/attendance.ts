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
