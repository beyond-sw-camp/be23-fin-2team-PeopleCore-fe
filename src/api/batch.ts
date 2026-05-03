import api from './client'

export type BatchJobName =
  | 'balanceExpiryJob'
  | 'annualGrantFiscalJob'
  | 'promotionNoticeJob'

export type BatchStatus =
  | 'STARTED'
  | 'STARTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'ABANDONED'
  | 'STOPPED'
  | 'STOPPING'
  | 'UNKNOWN'

export interface BatchExecutionResponse {
  executionId: number
  instanceId: number
  jobName: BatchJobName | string
  status: BatchStatus | string
  exitCode: string
  parameters: string
  startTime: string
  endTime: string | null
  readCount: number
  writeCount: number
  skipCount: number
  rootCauseMessage: string | null
}

export type BatchMode = 'RESTART' | 'FRESH'

export interface BalanceExpiryRerunReq {
  targetDate: string
  mode?: BatchMode
}

export interface AnnualGrantFiscalRerunReq {
  companyId: string
  targetDate: string
  mode?: BatchMode
}

export type PromotionStage = 'FIRST' | 'SECOND'

export interface PromotionNoticeRerunReq {
  companyId: string
  targetDate: string
  stage: PromotionStage
  monthsBefore: number
  mode?: BatchMode
}

export interface BatchRerunResponse {
  executionId: number
  status: BatchStatus | string
  appliedMode: BatchMode
  message: string | null
}

export interface DiscordTestReq {
  jobName?: string
  params?: string
  exitCode?: string
  failureCount?: number
  rootCauseMessage?: string
}

export const batchApi = {
  listExecutions: (params: { jobName?: BatchJobName; limit?: number } = {}) =>
    api
      .get<BatchExecutionResponse[]>('/hr-service/api/admin/batch/executions', {
        params: {
          ...(params.jobName ? { jobName: params.jobName } : {}),
          limit: params.limit ?? 20,
        },
      })
      .then((r) => r.data),

  rerunBalanceExpiry: (body: BalanceExpiryRerunReq) =>
    api
      .post<BatchRerunResponse>('/hr-service/api/admin/batch/balanceExpiryJob/rerun', body)
      .then((r) => r.data),

  rerunAnnualGrantFiscal: (body: AnnualGrantFiscalRerunReq) =>
    api
      .post<BatchRerunResponse>('/hr-service/api/admin/batch/annualGrantFiscalJob/rerun', body)
      .then((r) => r.data),

  rerunPromotionNotice: (body: PromotionNoticeRerunReq) =>
    api
      .post<BatchRerunResponse>('/hr-service/api/admin/batch/promotionNoticeJob/rerun', body)
      .then((r) => r.data),

  testDiscord: (body: DiscordTestReq = {}) =>
    api.post<void>('/hr-service/api/admin/batch/test-discord', body),
}

// ── 운영 잡 수동 트리거 (HR_SUPER_ADMIN) ────────────────────────────
// 응답은 즉시 202 Accepted. 실제 처리는 백그라운드 워커 스레드에서 수행.
export type AdminBatchJob =
  | 'partition-ensure'
  | 'monthly-accrual'
  | 'annual-transition'
  | 'annual-grant'
  | 'promotion-notice'
  | 'balance-expiry'
  | 'menstrual-monthly-grant'

const ADMIN_BATCH_PATH: Record<AdminBatchJob, string> = {
  'partition-ensure': '/hr-service/admin/attendance/partition/ensure',
  'monthly-accrual': '/hr-service/admin/vacations/monthly-accrual/run',
  'annual-transition': '/hr-service/admin/vacations/annual-transition/run',
  'annual-grant': '/hr-service/admin/vacations/annual-grant/run',
  'promotion-notice': '/hr-service/admin/vacations/promotion-notice/run',
  'balance-expiry': '/hr-service/admin/vacations/balance-expiry/run',
  'menstrual-monthly-grant': '/hr-service/admin/vacations/menstrual-monthly-grant/run',
}

export const adminBatchApi = {
  trigger: (job: AdminBatchJob) =>
    api.post<void>(ADMIN_BATCH_PATH[job], null),

  // 근무그룹별 자동마감 즉시 실행 (HR_SUPER_ADMIN)
  // 응답 202: 트리거 접수(백그라운드 실행), 403: 권한 부족, 500: Quartz 트리거 실패(미등록 WorkGroup 등)
  triggerAutoClose: (workGroupId: number) =>
    api.post<void>(`/hr-service/admin/attendance/auto-close/${workGroupId}/run`, null),
}

// ── 잡 실행 현황 조회 (HR_SUPER_ADMIN) ───────────────────────────────
export const JOB_RUN_NAMES = [
  'monthlyAccrualJob',
  'annualTransitionJob',
  'annualGrantHireJob',
  'annualGrantFiscalJob',
  'menstrualMonthlyGrantJob',
  'balanceExpiryJob',
  'promotionNoticeJob',
  'autoCloseJob',
] as const
export type JobRunName = (typeof JOB_RUN_NAMES)[number]

export const JOB_RUN_NAME_LABEL: Record<JobRunName, string> = {
  monthlyAccrualJob: '월차 적립',
  annualTransitionJob: '월차→연차 전환',
  annualGrantHireJob: '연차 발생 (입사일)',
  annualGrantFiscalJob: '연차 발생 (회계연도)',
  menstrualMonthlyGrantJob: '생리휴가 부여',
  balanceExpiryJob: '휴가 만료',
  promotionNoticeJob: '연차 촉진 통지',
  autoCloseJob: '자동마감 + 결근',
}

export const JOB_RUN_STATUSES = [
  'COMPLETED',
  'FAILED',
  'STARTED',
  'STOPPED',
  'ABANDONED',
] as const
export type JobRunStatus = (typeof JOB_RUN_STATUSES)[number]

export const JOB_RUN_STATUS_LABEL: Record<JobRunStatus, string> = {
  COMPLETED: '완료',
  FAILED: '실패',
  STARTED: '실행 중',
  STOPPED: '중단',
  ABANDONED: '포기',
}

export interface StepRunRes {
  stepExecutionId: number
  stepName: string
  status: JobRunStatus | string
  readCount: number
  writeCount: number
  skipCount: number
  commitCount: number
  rollbackCount: number
}

export interface JobRunRes {
  jobInstanceId: number
  jobExecutionId: number
  jobName: JobRunName | string
  status: JobRunStatus | string
  exitCode: string
  startTime: string | null
  endTime: string | null
  jobParameters: Record<string, string>
  steps: StepRunRes[] | null
}

export interface JobRunSearchParams {
  jobName?: JobRunName | ''
  companyId?: string
  fromDate?: string
  toDate?: string
  status?: JobRunStatus | ''
  page?: number
  size?: number
}

export interface PageResp<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export const jobRunsApi = {
  search: (params: JobRunSearchParams = {}) => {
    const query: Record<string, string | number> = {
      page: params.page ?? 0,
      size: params.size ?? 20,
    }
    if (params.jobName) query.jobName = params.jobName
    if (params.companyId) query.companyId = params.companyId
    if (params.fromDate) query.fromDate = params.fromDate
    if (params.toDate) query.toDate = params.toDate
    if (params.status) query.status = params.status
    return api
      .get<PageResp<JobRunRes>>('/hr-service/admin/jobs/runs', { params: query })
      .then((r) => r.data)
  },

  detail: (jobExecutionId: number) =>
    api
      .get<JobRunRes>(`/hr-service/admin/jobs/runs/${jobExecutionId}`)
      .then((r) => r.data),
}
