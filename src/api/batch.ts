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
