import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  batchApi,
  type BatchExecutionResponse,
  type BatchJobName,
  type BatchMode,
  type PromotionStage,
} from '../../../api/batch'

const JOB_OPTIONS: { value: '' | BatchJobName; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'annualGrantFiscalJob', label: '회계연도 연차 발생' },
  { value: 'promotionNoticeJob', label: '연차 촉진 통지' },
]

const LIMIT_OPTIONS = [10, 20, 50, 100]

const JOB_LABEL: Record<string, string> = {
  balanceExpiryJob: '잔여 만료 처리',
  annualGrantFiscalJob: '회계연도 연차 발생',
  promotionNoticeJob: '연차 촉진 통지',
}

type StatusKind = 'success' | 'partial' | 'failed' | 'running' | 'other'

const getStatusKind = (row: BatchExecutionResponse): StatusKind => {
  const s = row.status
  if (s === 'COMPLETED') return row.skipCount > 0 ? 'partial' : 'success'
  if (s === 'FAILED' || s === 'ABANDONED' || s === 'STOPPED') return 'failed'
  if (s === 'STARTED' || s === 'STARTING') return 'running'
  return 'other'
}

const STATUS_CHIP: Record<StatusKind, { label: string; cls: string }> = {
  success: { label: '성공', cls: 'bg-[#E1F5EE] text-[#1D9E75]' },
  partial: { label: '부분 실패', cls: 'bg-yellow-50 text-yellow-700' },
  failed: { label: '실패', cls: 'bg-red-50 text-red-600' },
  running: { label: '실행중', cls: 'bg-blue-50 text-blue-600' },
  other: { label: '기타', cls: 'bg-gray-100 text-gray-600' },
}

const formatDuration = (start: string, end: string | null) => {
  if (!end) return '-'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (!Number.isFinite(ms) || ms < 0) return '-'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}초`
  const m = Math.floor(s / 60)
  return `${m}분 ${s % 60}초`
}

// parameters 문자열("{'k':'v',...}") 파싱 — 재실행 폼 사전 채우기용 best-effort 파서.
const parseBatchParameters = (raw: string): Record<string, string | number> => {
  const out: Record<string, string | number> = {}
  if (!raw) return out
  const re = /'([^']+)':\s*('([^']*)'|(-?\d+(?:\.\d+)?))/g
  let match: RegExpExecArray | null
  while ((match = re.exec(raw)) !== null) {
    const key = match[1]
    if (match[3] !== undefined) out[key] = match[3]
    else if (match[4] !== undefined) out[key] = Number(match[4])
  }
  return out
}

const todayIso = () => new Date().toISOString().slice(0, 10)

// 파라미터 raw 문자열 → 칩용 key/value 리스트 (내 회사의 companyId 는 생략).
const summarizeParams = (raw: string, myCompanyId: string): { key: string; value: string }[] => {
  const parsed = parseBatchParameters(raw)
  const items: { key: string; value: string }[] = []
  const order = ['targetDate', 'stage', 'monthsBefore', 'companyId']
  for (const key of order) {
    if (!(key in parsed)) continue
    const val = String(parsed[key])
    if (key === 'companyId' && val === myCompanyId) continue
    const displayKey =
      key === 'targetDate' ? '대상일' :
      key === 'stage' ? '단계' :
      key === 'monthsBefore' ? '만료 N개월 전' :
      key === 'companyId' ? '회사' : key
    items.push({ key: displayKey, value: val })
  }
  return items
}

interface RerunFormState {
  companyId: string
  targetDate: string
  stage: PromotionStage
  monthsBefore: number
  mode: BatchMode
}

export default function BatchManageView() {
  const [jobFilter, setJobFilter] = useState<'' | BatchJobName>('')
  const [limit, setLimit] = useState<number>(20)
  const [rows, setRows] = useState<BatchExecutionResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [rerunTarget, setRerunTarget] = useState<BatchExecutionResponse | null>(null)
  const [rerunForm, setRerunForm] = useState<RerunFormState>({
    companyId: '',
    targetDate: todayIso(),
    stage: 'FIRST',
    monthsBefore: 2,
    mode: 'RESTART',
  })
  const [rerunSubmitting, setRerunSubmitting] = useState(false)

  const [feedback, setFeedback] = useState<{ kind: 'info' | 'success' | 'error'; text: string } | null>(null)
  const feedbackTimer = useRef<number | null>(null)

  const [discordSending, setDiscordSending] = useState(false)
  const [detailRow, setDetailRow] = useState<BatchExecutionResponse | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const myCompanyId = useMemo(() => localStorage.getItem('companyId') || '', [])

  const showFeedback = useCallback((kind: 'info' | 'success' | 'error', text: string) => {
    setFeedback({ kind, text })
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current)
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), 4000)
  }, [])

  const loadRows = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await batchApi.listExecutions({
        jobName: jobFilter || undefined,
        limit,
      })
      setRows(data)
    } catch (e) {
      const err = e as { response?: { status?: number } }
      if (err?.response?.status !== 403) {
        setError('배치 이력 조회에 실패했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }, [jobFilter, limit])

  useEffect(() => {
    void loadRows()
  }, [loadRows])

  // 실행중 건이 있고 자동 새로고침이 켜진 경우 5초 폴링
  const hasRunning = useMemo(() => rows.some((r) => getStatusKind(r) === 'running'), [rows])
  useEffect(() => {
    if (!hasRunning || !autoRefresh) return
    const id = window.setInterval(() => { void loadRows() }, 5000)
    return () => window.clearInterval(id)
  }, [hasRunning, autoRefresh, loadRows])

  useEffect(() => () => {
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current)
  }, [])

  const openRerun = (row: BatchExecutionResponse) => {
    const parsed = parseBatchParameters(row.parameters)
    setRerunForm({
      companyId: myCompanyId,
      targetDate: String(parsed.targetDate ?? todayIso()),
      stage: (parsed.stage === 'SECOND' ? 'SECOND' : 'FIRST') as PromotionStage,
      monthsBefore: typeof parsed.monthsBefore === 'number' ? parsed.monthsBefore : 2,
      mode: 'RESTART',
    })
    setRerunTarget(row)
  }

  const rerunJobName = rerunTarget?.jobName as BatchJobName | undefined

  const rerunValid = useMemo(() => {
    if (!rerunJobName) return false
    if (!rerunForm.targetDate) return false
    if (rerunJobName === 'annualGrantFiscalJob' || rerunJobName === 'promotionNoticeJob') {
      if (!rerunForm.companyId.trim()) return false
    }
    if (rerunJobName === 'promotionNoticeJob') {
      if (!rerunForm.stage) return false
      if (!Number.isFinite(rerunForm.monthsBefore) || rerunForm.monthsBefore < 1) return false
    }
    return true
  }, [rerunJobName, rerunForm])

  const submitRerun = async () => {
    if (!rerunTarget || !rerunJobName || !rerunValid) return
    setRerunSubmitting(true)
    try {
      let res
      if (rerunJobName === 'balanceExpiryJob') {
        res = await batchApi.rerunBalanceExpiry({
          targetDate: rerunForm.targetDate,
          mode: rerunForm.mode,
        })
      } else if (rerunJobName === 'annualGrantFiscalJob') {
        res = await batchApi.rerunAnnualGrantFiscal({
          companyId: rerunForm.companyId.trim(),
          targetDate: rerunForm.targetDate,
          mode: rerunForm.mode,
        })
      } else if (rerunJobName === 'promotionNoticeJob') {
        res = await batchApi.rerunPromotionNotice({
          companyId: rerunForm.companyId.trim(),
          targetDate: rerunForm.targetDate,
          stage: rerunForm.stage,
          monthsBefore: rerunForm.monthsBefore,
          mode: rerunForm.mode,
        })
      } else {
        showFeedback('error', '지원하지 않는 배치입니다.')
        setRerunSubmitting(false)
        return
      }

      if (res.appliedMode !== rerunForm.mode) {
        showFeedback('info', res.message ?? '이미 완료된 JobInstance 라 새 실행으로 전환되었습니다.')
      } else if (res.status === 'COMPLETED') {
        showFeedback('success', '재실행 완료')
      } else if (res.status === 'FAILED') {
        showFeedback('error', '재실행이 실패했습니다. 상세 사유를 확인하세요.')
      } else {
        showFeedback('info', `재실행 상태: ${res.status}`)
      }
      setRerunTarget(null)
      await loadRows()
    } catch (e) {
      const err = e as { response?: { status?: number; data?: { code?: string } } }
      const status = err?.response?.status
      const code = err?.response?.data?.code
      if (status === 400 && code === 'BATCH_JOB_NOT_SUPPORTED') showFeedback('error', '지원하지 않는 배치입니다.')
      else if (status === 400 && code === 'BATCH_PARAMETER_INVALID') showFeedback('error', '필수 입력 값이 누락되었습니다.')
      else if (status === 404 && code === 'BATCH_JOB_NOT_FOUND') showFeedback('error', '서버 설정 오류, 관리자에게 문의하세요.')
      else if (status === 500 && code === 'BATCH_RERUN_FAILED') showFeedback('error', '재실행에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      else showFeedback('error', '재실행 요청 중 오류가 발생했습니다.')
    } finally {
      setRerunSubmitting(false)
    }
  }

  const handleDiscordTest = async () => {
    if (discordSending) return
    setDiscordSending(true)
    try {
      await batchApi.testDiscord({})
      showFeedback('success', 'Discord 채널을 확인하세요.')
    } catch {
      showFeedback('error', 'Discord 테스트 요청에 실패했습니다.')
    } finally {
      setDiscordSending(false)
    }
  }

  return (
    <div>
      <h2 className="text-[18px] font-bold text-gray-900 mb-1">배치 관리</h2>
      <p className="text-[12px] text-gray-400 mb-3">연차 관련 야간 잡의 실행 이력을 확인하고, 실패한 잡을 수동 재실행합니다.</p>

      <div className="mb-5 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-[11px] text-blue-700 flex items-center gap-2">
        <i className="fas fa-info-circle" />
        연차 관련 배치는 매일 <strong>00:10 ~ 00:15 KST</strong> 사이 자동 실행됩니다. 해당 시간대 전에는 이력이 비어 있을 수 있습니다.
      </div>

      {feedback && (
        <div
          className={`mb-3 border rounded-lg px-4 py-2 text-[12px] flex items-start justify-between gap-3 ${
            feedback.kind === 'success'
              ? 'bg-[#E1F5EE] border-[#1D9E75]/40 text-[#0f6b4f]'
              : feedback.kind === 'error'
              ? 'bg-red-50 border-red-200 text-red-600'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}
        >
          <span className="whitespace-pre-wrap">{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-current/70 hover:opacity-70 text-[13px] leading-none">&times;</button>
        </div>
      )}

      {/* 상단 필터 + 액션 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-gray-600">Job</span>
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value as '' | BatchJobName)}
              className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none focus:border-[#1D9E75]"
            >
              {JOB_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-gray-600">건수</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-[12px] outline-none focus:border-[#1D9E75]"
            >
              {LIMIT_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer ml-2">
            <input type="checkbox" checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="accent-[#1D9E75]" />
            <span className="text-[11px] text-gray-600">자동 새로고침 {autoRefresh ? 'ON' : 'OFF'}</span>
          </label>
          {hasRunning && autoRefresh && (
            <span className="text-[11px] text-blue-600">실행중인 Job이 있어 5초마다 새로고침 중</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDiscordTest}
            disabled={discordSending}
            className="px-3 py-1.5 text-[12px] border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <i className="fa-brands fa-discord mr-1" />
            {discordSending ? 'Discord 전송 중...' : 'Discord 알림 테스트'}
          </button>
          <button
            onClick={() => void loadRows()}
            disabled={loading}
            className="px-3 py-1.5 text-[12px] bg-[#1D9E75] text-white rounded-md hover:bg-[#178a65] disabled:opacity-50"
          >
            <i className="fas fa-rotate mr-1" />
            {loading ? '조회 중...' : '새로고침'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-[12px] px-3 py-2 rounded">
          {error}
        </div>
      )}

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b-2 border-gray-900 bg-gray-50">
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">Job</th>
              <th className="px-3 py-2.5 text-center text-gray-700 font-medium">상태</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">시작</th>
              <th className="px-3 py-2.5 text-right text-gray-700 font-medium">소요</th>
              <th className="px-3 py-2.5 text-right text-gray-700 font-medium">Read · Write · Skip</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">파라미터</th>
              <th className="px-3 py-2.5 text-left text-gray-700 font-medium">실패 사유</th>
              <th className="px-3 py-2.5 text-right text-gray-700 font-medium">작업</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading ? (
              <tr><td colSpan={8} className="py-14 text-center text-gray-400">
                <div className="text-[13px] mb-1">조회된 실행 이력이 없습니다.</div>
                <div className="text-[11px] text-gray-300">연차 관련 배치는 매일 00:10 ~ 00:15 KST 에 자동 실행됩니다.</div>
              </td></tr>
            ) : rows.map((r) => {
              const kind = getStatusKind(r)
              const chip = STATUS_CHIP[kind]
              const canRerun = kind === 'failed' || kind === 'partial'
              const isSupported = r.jobName === 'balanceExpiryJob'
                || r.jobName === 'annualGrantFiscalJob'
                || r.jobName === 'promotionNoticeJob'
              const failureShort = (r.rootCauseMessage ?? '').length > 50
                ? `${r.rootCauseMessage!.slice(0, 50)}…`
                : (r.rootCauseMessage ?? '')
              const paramChips = summarizeParams(r.parameters, myCompanyId)
              return (
                <tr
                  key={r.executionId}
                  onClick={() => setDetailRow(r)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-3 py-2.5 text-gray-800 font-medium" title={r.jobName}>
                    {JOB_LABEL[r.jobName] ?? r.jobName}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${chip.cls}`}>
                      {chip.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{r.startTime?.replace('T', ' ').slice(0, 19)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600">{formatDuration(r.startTime, r.endTime)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">
                    {r.readCount} · {r.writeCount} · <span className={r.skipCount > 0 ? 'text-yellow-700 font-semibold' : ''}>{r.skipCount}</span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 max-w-[240px]" title={r.parameters}>
                    {paramChips.length === 0 ? (
                      <span className="text-gray-300 text-[11px]">-</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {paramChips.map((c) => (
                          <span key={c.key} className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px]">
                            <span className="text-gray-500">{c.key}=</span>
                            <span className="font-medium">{c.value}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-red-600 max-w-[260px] truncate" title={r.rootCauseMessage ?? ''}>
                    {failureShort || <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    {canRerun && isSupported ? (
                      <button
                        onClick={() => openRerun(r)}
                        className="text-[11px] text-[#1D9E75] hover:underline"
                      >재실행</button>
                    ) : (
                      <span className="text-gray-300 text-[11px]">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 재실행 모달 */}
      {rerunTarget && rerunJobName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => !rerunSubmitting && setRerunTarget(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[520px] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-[15px] font-bold text-gray-900">배치 재실행 — {JOB_LABEL[rerunJobName] ?? rerunJobName}</h3>
              <p className="text-[11px] text-gray-400 mt-1">Execution #{rerunTarget.executionId} / Instance #{rerunTarget.instanceId}</p>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="flex items-start gap-4">
                <label className="text-[12px] text-gray-700 w-24 shrink-0 pt-2 font-medium">Job</label>
                <input value={rerunJobName} disabled
                  className="flex-1 border border-gray-200 rounded px-3 py-2 text-[12px] bg-gray-50 text-gray-500 font-mono" />
              </div>

              {(rerunJobName === 'annualGrantFiscalJob' || rerunJobName === 'promotionNoticeJob') && (
                <div className="flex items-start gap-4">
                  <label className="text-[12px] text-gray-700 w-24 shrink-0 pt-2 font-medium">회사</label>
                  <div className="flex-1">
                    <div className="text-[12px] text-gray-500 py-2">로그인 사용자의 회사로 자동 적용됩니다.</div>
                    {rerunForm.companyId && (
                      <div className="text-[10px] text-gray-400 font-mono break-all">{rerunForm.companyId}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                <label className="text-[12px] text-gray-700 w-24 shrink-0 pt-2 font-medium">대상 일자 <span className="text-red-500">*</span></label>
                <input type="date" value={rerunForm.targetDate}
                  onChange={(e) => setRerunForm((p) => ({ ...p, targetDate: e.target.value }))}
                  className="border border-gray-300 rounded px-3 py-2 text-[12px] outline-none focus:border-[#1D9E75]" />
              </div>

              {rerunJobName === 'promotionNoticeJob' && (
                <>
                  <div className="flex items-start gap-4">
                    <label className="text-[12px] text-gray-700 w-24 shrink-0 pt-2 font-medium">단계 <span className="text-red-500">*</span></label>
                    <div className="flex items-center gap-3 pt-2">
                      <label className="flex items-center gap-1.5 text-[12px] cursor-pointer">
                        <input type="radio" name="stage" checked={rerunForm.stage === 'FIRST'}
                          onChange={() => setRerunForm((p) => ({ ...p, stage: 'FIRST' }))}
                          className="accent-[#1D9E75]" />
                        FIRST (1차)
                      </label>
                      <label className="flex items-center gap-1.5 text-[12px] cursor-pointer">
                        <input type="radio" name="stage" checked={rerunForm.stage === 'SECOND'}
                          onChange={() => setRerunForm((p) => ({ ...p, stage: 'SECOND' }))}
                          className="accent-[#1D9E75]" />
                        SECOND (2차)
                      </label>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <label className="text-[12px] text-gray-700 w-24 shrink-0 pt-2 font-medium">monthsBefore <span className="text-red-500">*</span></label>
                    <input type="number" min={1} value={rerunForm.monthsBefore}
                      onChange={(e) => setRerunForm((p) => ({ ...p, monthsBefore: Number(e.target.value) }))}
                      className="border border-gray-300 rounded px-3 py-2 text-[12px] outline-none w-24 focus:border-[#1D9E75]" />
                    <span className="pt-2 text-[11px] text-gray-400">만료 N개월 전 대상</span>
                  </div>
                </>
              )}

              <div className="flex items-start gap-4">
                <label className="text-[12px] text-gray-700 w-24 shrink-0 pt-2 font-medium">모드</label>
                <div className="flex-1 space-y-2">
                  <label className="flex items-start gap-2 text-[12px] cursor-pointer">
                    <input type="radio" name="mode" checked={rerunForm.mode === 'RESTART'}
                      onChange={() => setRerunForm((p) => ({ ...p, mode: 'RESTART' }))}
                      className="accent-[#1D9E75] mt-0.5" />
                    <span>
                      <strong>RESTART</strong> (권장)
                      <span className="block text-[11px] text-gray-400">실패한 지점부터 이어서 실행. 이미 완료된 Instance는 자동 FRESH 전환.</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-2 text-[12px] cursor-pointer">
                    <input type="radio" name="mode" checked={rerunForm.mode === 'FRESH'}
                      onChange={() => setRerunForm((p) => ({ ...p, mode: 'FRESH' }))}
                      className="accent-[#1D9E75] mt-0.5" />
                    <span>
                      <strong>FRESH</strong>
                      <span className="block text-[11px] text-gray-400">처음부터 다시 실행. 중복 발송/적립 방지는 서비스 레이어가 처리.</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setRerunTarget(null)}
                disabled={rerunSubmitting}
                className="px-4 py-2 border border-gray-300 text-gray-600 text-[13px] rounded-md hover:bg-gray-50 disabled:opacity-50"
              >취소</button>
              <button
                onClick={submitRerun}
                disabled={!rerunValid || rerunSubmitting}
                className={`px-5 py-2 text-[13px] font-medium rounded-md transition-colors ${
                  rerunValid && !rerunSubmitting
                    ? 'bg-[#1D9E75] text-white hover:bg-[#178a65]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {rerunSubmitting ? '재실행 중...' : '재실행'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상세 Drawer */}
      {detailRow && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/20" onClick={() => setDetailRow(null)} />
          <div className="absolute right-0 top-0 bottom-0 w-[480px] bg-white shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between">
              <div>
                <h3 className="text-[14px] font-bold text-gray-900">
                  {JOB_LABEL[detailRow.jobName] ?? detailRow.jobName}
                  <span className="text-[11px] text-gray-400 ml-2">#{detailRow.executionId}</span>
                </h3>
                <p className="text-[11px] text-gray-500 mt-1">{detailRow.startTime?.replace('T', ' ').slice(0, 19)}</p>
              </div>
              <button onClick={() => setDetailRow(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-[12px]">
              <div>
                <p className="text-[11px] text-gray-400 mb-1">상태</p>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_CHIP[getStatusKind(detailRow)].cls}`}>
                  {STATUS_CHIP[getStatusKind(detailRow)].label}
                </span>
                <span className="ml-2 text-gray-500">{detailRow.status} / {detailRow.exitCode}</span>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 mb-1">집계</p>
                <p className="text-gray-700">Read {detailRow.readCount} · Write {detailRow.writeCount} · Skip {detailRow.skipCount}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 mb-1">파라미터</p>
                <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-[11px] whitespace-pre-wrap break-all font-mono">{detailRow.parameters}</pre>
              </div>
              {detailRow.rootCauseMessage && (
                <div>
                  <p className="text-[11px] text-gray-400 mb-1">실패 사유</p>
                  <pre className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-[11px] whitespace-pre-wrap break-all font-mono">{detailRow.rootCauseMessage}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
