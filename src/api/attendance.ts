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

export const attendanceApi = {
  getOvertimePolicy: () =>
    api.get<OvertimePolicyRes>('/hr-service/overtime/policy').then(r => r.data),

  saveOvertimePolicy: (data: OvertimePolicyReq) =>
    api.put<OvertimePolicyRes>('/hr-service/overtime/policy', data).then(r => r.data),
}
