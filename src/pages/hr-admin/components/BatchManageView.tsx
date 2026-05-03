import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  adminBatchApi,
  jobRunsApi,
  JOB_RUN_NAMES,
  JOB_RUN_NAME_LABEL,
  JOB_RUN_STATUSES,
  JOB_RUN_STATUS_LABEL,
  type AdminBatchJob,
  type JobRunName,
  type JobRunStatus,
  type JobRunRes,
  type JobRunSearchParams,
  type PageResp,
} from '../../../api/batch'
import { attendanceApi, type WorkGroupListItem } from '../../../api/attendance'
import { useAuth } from '../../../contexts/AuthContext'

interface JobMeta {
  key: AdminBatchJob
  category: '근태' | '휴가'
  title: string
  description: string
  icon: string
  accent: string
}

const JOBS: JobMeta[] = [
  {
    key: 'partition-ensure',
    category: '근태',
    title: '파티션 사전 생성',
    description: 'commute_record 테이블의 다음 달 파티션을 즉시 생성합니다.',
    icon: 'fa-solid fa-database',
    accent: 'text-sky-600 bg-sky-50',
  },
  {
    key: 'monthly-accrual',
    category: '휴가',
    title: '월차 적립',
    description: '입사 1~11개월차 사원의 월차를 자동 적립합니다.',
    icon: 'fa-solid fa-calendar-plus',
    accent: 'text-emerald-600 bg-emerald-50',
  },
  {
    key: 'annual-transition',
    category: '휴가',
    title: '월차 → 연차 전환',
    description: '1주년 도달 사원의 월차를 소멸시키고 1년차 연차를 발생시킵니다.',
    icon: 'fa-solid fa-right-left',
    accent: 'text-emerald-600 bg-emerald-50',
  },
  {
    key: 'annual-grant',
    category: '휴가',
    title: '연차 발생',
    description: '입사기념일/회계연도 시작일 사원의 연차를 발생시킵니다.',
    icon: 'fa-solid fa-calendar-check',
    accent: 'text-emerald-600 bg-emerald-50',
  },
  {
    key: 'promotion-notice',
    category: '휴가',
    title: '연차 촉진 통지',
    description: '1차 / 2차 연차 촉진 통지를 발송합니다.',
    icon: 'fa-solid fa-bell',
    accent: 'text-amber-600 bg-amber-50',
  },
  {
    key: 'balance-expiry',
    category: '휴가',
    title: '잔여 휴가 만료 처리',
    description: '만료일이 도래한 잔여 휴가를 EXPIRED 처리합니다.',
    icon: 'fa-solid fa-hourglass-end',
    accent: 'text-rose-600 bg-rose-50',
  },
  {
    key: 'menstrual-monthly-grant',
    category: '휴가',
    title: '생리휴가 적립',
    description: '여성 사원의 월별 생리휴가 1일을 적립합니다.',
    icon: 'fa-solid fa-venus',
    accent: 'text-pink-600 bg-pink-50',
  },
]

const COOLDOWN_SECONDS = 10

type Feedback = { kind: 'success' | 'error' | 'info'; text: string }

const errorMessage = (status: number | undefined): string => {
  if (status === 401) return '인증이 만료되었습니다. 다시 로그인해 주세요.'
  if (status === 403) return '권한이 없습니다. (HR_SUPER_ADMIN 전용)'
  if (status === 500) return '배치 트리거에 실패했습니다. 잠시 후 다시 시도해 주세요.'
  return '요청 처리 중 오류가 발생했습니다.'
}

const statusBadgeClass = (status: string): string => {
  const base = 'inline-block px-2 py-0.5 rounded text-[11px] font-medium'
  switch (status) {
    case 'COMPLETED':
      return `${base} bg-emerald-50 text-emerald-700 border border-emerald-200`
    case 'FAILED':
      return `${base} bg-red-50 text-red-700 border border-red-200`
    case 'STARTED':
      return `${base} bg-blue-50 text-blue-700 border border-blue-200`
    case 'STOPPED':
      return `${base} bg-amber-50 text-amber-700 border border-amber-200`
    case 'ABANDONED':
      return `${base} bg-gray-100 text-gray-600 border border-gray-200`
    default:
      return `${base} bg-gray-100 text-gray-600 border border-gray-200`
  }
}

const formatTs = (s: string | null): string => {
  if (!s) return '-'
  return s.replace('T', ' ').slice(0, 19)
}

const formatDuration = (start: string | null, end: string | null): string => {
  if (!start || !end) return '-'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (!Number.isFinite(ms) || ms < 0) return '-'
  const sec = Math.round(ms / 1000)
  if (sec < 60) return `${sec}초`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m < 60) return `${m}분 ${s}초`
  const h = Math.floor(m / 60)
  return `${h}시간 ${m % 60}분`
}

const autoCloseErrorMessage = (status: number | undefined): string => {
  if (status === 401) return '인증이 만료되었습니다. 다시 로그인해 주세요.'
  if (status === 403) return '권한이 없습니다. (HR_SUPER_ADMIN 전용)'
  if (status === 500) return '트리거에 실패했습니다. 근무그룹이 활성 상태인지 확인해주세요.'
  return '요청 처리 중 오류가 발생했습니다.'
}

export default function BatchManageView() {
  const { isHRSuperAdmin } = useAuth()

  const [confirmJob, setConfirmJob] = useState<JobMeta | null>(null)
  const [pending, setPending] = useState<AdminBatchJob | null>(null)
  const [cooldownEndsAt, setCooldownEndsAt] = useState<Record<string, number>>({})
  const [now, setNow] = useState(() => Date.now())
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const feedbackTimer = useRef<number | null>(null)

  const [workGroups, setWorkGroups] = useState<WorkGroupListItem[]>([])
  const [workGroupsLoading, setWorkGroupsLoading] = useState(false)
  const [workGroupsError, setWorkGroupsError] = useState<string | null>(null)
  const [selectedWorkGroupId, setSelectedWorkGroupId] = useState<number | null>(null)
  const [autoClosePending, setAutoClosePending] = useState<number | null>(null)
  const [autoCloseCooldownEndsAt, setAutoCloseCooldownEndsAt] = useState<Record<number, number>>({})
  const [confirmAutoClose, setConfirmAutoClose] = useState<WorkGroupListItem | null>(null)

  // 잡 실행 현황 탭
  const [activeView, setActiveView] = useState<'trigger' | 'runs'>('trigger')
  const [runFilters, setRunFilters] = useState<{
    jobName: JobRunName | ''
    companyId: string
    fromDate: string
    toDate: string
    status: JobRunStatus | ''
  }>({ jobName: '', companyId: '', fromDate: '', toDate: '', status: '' })
  const [runQuery, setRunQuery] = useState<JobRunSearchParams>({ page: 0, size: 20 })
  const [runPage, setRunPage] = useState<PageResp<JobRunRes> | null>(null)
  const [runsLoading, setRunsLoading] = useState(false)
  const [runsError, setRunsError] = useState<string | null>(null)
  const [runDetail, setRunDetail] = useState<JobRunRes | null>(null)
  const [runDetailLoading, setRunDetailLoading] = useState(false)
  const [runDetailError, setRunDetailError] = useState<string | null>(null)

  const remainingSec = useCallback(
    (key: AdminBatchJob) => {
      const endsAt = cooldownEndsAt[key]
      if (!endsAt) return 0
      return Math.max(0, Math.ceil((endsAt - now) / 1000))
    },
    [cooldownEndsAt, now],
  )

  const autoCloseRemainingSec = useCallback(
    (workGroupId: number) => {
      const endsAt = autoCloseCooldownEndsAt[workGroupId]
      if (!endsAt) return 0
      return Math.max(0, Math.ceil((endsAt - now) / 1000))
    },
    [autoCloseCooldownEndsAt, now],
  )

  const hasActiveCooldown = useMemo(
    () =>
      Object.values(cooldownEndsAt).some((t) => t > now) ||
      Object.values(autoCloseCooldownEndsAt).some((t) => t > now),
    [cooldownEndsAt, autoCloseCooldownEndsAt, now],
  )

  useEffect(() => {
    if (!hasActiveCooldown) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [hasActiveCooldown])

  useEffect(() => () => {
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current)
  }, [])

  const showFeedback = useCallback((fb: Feedback) => {
    setFeedback(fb)
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current)
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), 4000)
  }, [])

  useEffect(() => {
    if (!isHRSuperAdmin) return
    let cancelled = false
    setWorkGroupsLoading(true)
    setWorkGroupsError(null)
    attendanceApi
      .getWorkGroups()
      .then((list) => {
        if (cancelled) return
        setWorkGroups(list)
        if (list.length > 0) setSelectedWorkGroupId((prev) => prev ?? list[0].workGroupId)
      })
      .catch(() => {
        if (cancelled) return
        setWorkGroupsError('근무그룹 목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setWorkGroupsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isHRSuperAdmin])

  const runAutoClose = async (wg: WorkGroupListItem) => {
    setConfirmAutoClose(null)
    setAutoClosePending(wg.workGroupId)
    try {
      await adminBatchApi.triggerAutoClose(wg.workGroupId)
      showFeedback({
        kind: 'success',
        text: `[${wg.groupName}] 자동마감 처리를 시작했습니다. 결과는 알림으로 안내됩니다.`,
      })
      setAutoCloseCooldownEndsAt((prev) => ({
        ...prev,
        [wg.workGroupId]: Date.now() + COOLDOWN_SECONDS * 1000,
      }))
      setNow(Date.now())
    } catch (e) {
      const err = e as { response?: { status?: number } }
      showFeedback({ kind: 'error', text: autoCloseErrorMessage(err?.response?.status) })
    } finally {
      setAutoClosePending(null)
    }
  }

  useEffect(() => {
    if (!isHRSuperAdmin) return
    if (activeView !== 'runs') return
    let cancelled = false
    setRunsLoading(true)
    setRunsError(null)
    jobRunsApi
      .search(runQuery)
      .then((data) => {
        if (cancelled) return
        setRunPage(data)
      })
      .catch((e) => {
        if (cancelled) return
        const status = (e as { response?: { status?: number } })?.response?.status
        if (status === 403) setRunsError('권한이 없습니다. (HR_SUPER_ADMIN 전용)')
        else setRunsError('잡 실행 현황을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setRunsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeView, runQuery, isHRSuperAdmin])

  const applyRunFilters = () => {
    setRunQuery({
      jobName: runFilters.jobName || undefined,
      companyId: runFilters.companyId.trim() || undefined,
      fromDate: runFilters.fromDate || undefined,
      toDate: runFilters.toDate || undefined,
      status: runFilters.status || undefined,
      page: 0,
      size: 20,
    })
  }

  const resetRunFilters = () => {
    setRunFilters({ jobName: '', companyId: '', fromDate: '', toDate: '', status: '' })
    setRunQuery({ page: 0, size: 20 })
  }

  const openRunDetail = async (jobExecutionId: number) => {
    setRunDetail(null)
    setRunDetailError(null)
    setRunDetailLoading(true)
    try {
      const data = await jobRunsApi.detail(jobExecutionId)
      setRunDetail(data)
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status
      if (status === 404) setRunDetailError('해당 실행 기록을 찾을 수 없습니다.')
      else if (status === 403) setRunDetailError('권한이 없습니다. (HR_SUPER_ADMIN 전용)')
      else setRunDetailError('상세 정보를 불러오지 못했습니다.')
    } finally {
      setRunDetailLoading(false)
    }
  }

  const closeRunDetail = () => {
    setRunDetail(null)
    setRunDetailError(null)
  }

  const goRunPage = (next: number) => {
    if (!runPage) return
    if (next < 0 || next >= runPage.totalPages) return
    setRunQuery((prev) => ({ ...prev, page: next }))
  }

  const runJob = async (job: JobMeta) => {
    setConfirmJob(null)
    setPending(job.key)
    try {
      await adminBatchApi.trigger(job.key)
      showFeedback({ kind: 'success', text: `[${job.title}] 잡이 트리거되었습니다. (백그라운드 실행 중)` })
      setCooldownEndsAt((prev) => ({ ...prev, [job.key]: Date.now() + COOLDOWN_SECONDS * 1000 }))
      setNow(Date.now())
    } catch (e) {
      const err = e as { response?: { status?: number } }
      showFeedback({ kind: 'error', text: errorMessage(err?.response?.status) })
    } finally {
      setPending(null)
    }
  }

  const grouped = useMemo(() => {
    const acc: Record<JobMeta['category'], JobMeta[]> = { 근태: [], 휴가: [] }
    for (const j of JOBS) acc[j.category].push(j)
    return acc
  }, [])

  if (!isHRSuperAdmin) {
    return (
      <div>
        <h2 className="text-[18px] font-bold text-gray-900 mb-1">배치 관리</h2>
        <div className="mt-6 bg-red-50 border border-red-200 text-red-600 text-[13px] px-4 py-3 rounded-lg">
          이 화면은 HR_SUPER_ADMIN 권한이 있는 사용자만 접근할 수 있습니다.
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-[18px] font-bold text-gray-900 mb-1">배치 관리</h2>
      <p className="text-[12px] text-gray-400 mb-4">
        운영 잡 수동 트리거 및 실행 현황 조회 (개발자용)
      </p>

      <div className="mb-4 flex items-center gap-1 border-b border-gray-200">
        {([
          { key: 'trigger', label: '배치 트리거', icon: 'fa-solid fa-play' },
          { key: 'runs', label: '잡 실행 현황', icon: 'fa-solid fa-list-check' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveView(tab.key)}
            className={`px-4 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
              activeView === tab.key
                ? 'border-[#1D9E75] text-[#1D9E75]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className={`${tab.icon} mr-1.5`} />
            {tab.label}
          </button>
        ))}
      </div>

      {feedback && (
        <div
          className={`mb-4 border rounded-lg px-4 py-2 text-[12px] flex items-start justify-between gap-3 ${
            feedback.kind === 'success'
              ? 'bg-[#E1F5EE] border-[#1D9E75]/40 text-[#0f6b4f]'
              : feedback.kind === 'error'
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}
        >
          <span className="whitespace-pre-wrap">{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-current/70 hover:opacity-70 text-[13px] leading-none"
            aria-label="닫기"
          >
            &times;
          </button>
        </div>
      )}

      {activeView === 'trigger' && (
      <>
      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-[12px] text-blue-700 space-y-1">
        <p className="flex items-center gap-2">
          <i className="fas fa-circle-info" />
          <span>
            응답은 즉시 <strong>202 Accepted</strong>로 반환되지만, 실제 처리는 백그라운드 워커 스레드에서 진행됩니다.
            결과 확인은 시간을 두고 별도 조회가 필요합니다.
          </span>
        </p>
        <p className="flex items-center gap-2 pl-6 text-[11px] text-blue-600/80">
          중복 실행 방지를 위해 트리거 후 {COOLDOWN_SECONDS}초간 버튼이 비활성화됩니다.
        </p>
      </div>

      {(['근태', '휴가'] as const).map((cat) => (
        <section key={cat} className="mb-6">
          <h3 className="text-[13px] font-semibold text-gray-700 mb-2">
            <i className={`mr-1.5 ${cat === '근태' ? 'fa-solid fa-clock' : 'fa-solid fa-umbrella-beach'}`} />
            {cat}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {grouped[cat].map((job) => {
              const left = remainingSec(job.key)
              const isPending = pending === job.key
              const disabled = isPending || left > 0
              return (
                <div
                  key={job.key}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-[14px] ${job.accent}`}>
                      <i className={job.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900">{job.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{job.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                    <code className="text-[10px] text-gray-400 font-mono truncate">
                      POST /admin/{job.key === 'partition-ensure' ? 'attendance/partition/ensure' : `vacations/${job.key}/run`}
                    </code>
                    <button
                      type="button"
                      onClick={() => setConfirmJob(job)}
                      disabled={disabled}
                      className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors shrink-0 ml-2 ${
                        disabled
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-[#1D9E75] text-white hover:bg-[#178a65]'
                      }`}
                    >
                      {isPending ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin mr-1" />
                          요청 중...
                        </>
                      ) : left > 0 ? (
                        `${left}초 후 재실행`
                      ) : (
                        <>
                          <i className="fa-solid fa-play mr-1" />
                          실행
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}

      <section className="mb-6">
        <h3 className="text-[13px] font-semibold text-gray-700 mb-2">
          <i className="fa-solid fa-bolt mr-1.5 text-amber-500" />
          근무그룹 자동마감
        </h3>
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-[14px] text-amber-600 bg-amber-50">
                <i className="fa-solid fa-bolt" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900">근무그룹 자동마감 즉시 실행</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  선택한 근무그룹의 어제자 자동마감/결근 처리를 즉시 트리거합니다.
                  같은 날 이미 처리된 경우 자동으로 중복 차단되며, 결과는 알림으로 안내됩니다.
                </p>
              </div>
            </div>

            {workGroupsLoading ? (
              <p className="text-[12px] text-gray-400 pt-1 border-t border-gray-100">
                <i className="fa-solid fa-spinner fa-spin mr-1.5" />
                근무그룹 목록을 불러오는 중...
              </p>
            ) : workGroupsError ? (
              <p className="text-[12px] text-red-600 pt-1 border-t border-gray-100">{workGroupsError}</p>
            ) : workGroups.length === 0 ? (
              <p className="text-[12px] text-gray-400 pt-1 border-t border-gray-100">등록된 근무그룹이 없습니다.</p>
            ) : (
              (() => {
                const selected = workGroups.find((wg) => wg.workGroupId === selectedWorkGroupId) ?? null
                const left = selected ? autoCloseRemainingSec(selected.workGroupId) : 0
                const isPending = selected ? autoClosePending === selected.workGroupId : false
                const disabled = !selected || isPending || left > 0
                return (
                  <div className="flex flex-col gap-3 pt-3 border-t border-gray-100 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                      <label className="text-[11px] text-gray-500" htmlFor="auto-close-wg-select">
                        근무그룹 선택
                      </label>
                      <select
                        id="auto-close-wg-select"
                        className="w-full sm:max-w-md text-[13px] border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
                        value={selectedWorkGroupId ?? ''}
                        onChange={(e) => setSelectedWorkGroupId(Number(e.target.value))}
                        disabled={isPending}
                      >
                        {workGroups.map((wg) => (
                          <option key={wg.workGroupId} value={wg.workGroupId}>
                            {wg.groupName} ({wg.groupCode}) · {wg.memberCount}명
                          </option>
                        ))}
                      </select>
                      <code className="text-[10px] text-gray-400 font-mono truncate">
                        POST /admin/attendance/auto-close/{selected?.workGroupId ?? '{workGroupId}'}/run
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={() => selected && setConfirmAutoClose(selected)}
                      disabled={disabled}
                      className={`px-4 py-2 text-[13px] font-medium rounded-md transition-colors shrink-0 ${
                        disabled
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-amber-500 text-white hover:bg-amber-600'
                      }`}
                    >
                      {isPending ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin mr-1" />
                          요청 중...
                        </>
                      ) : left > 0 ? (
                        `${left}초 후 재실행`
                      ) : (
                        <>
                          <i className="fa-solid fa-bolt mr-1" />
                          즉시 실행
                        </>
                      )}
                    </button>
                  </div>
                )
              })()
            )}
          </div>
        </div>
      </section>
      </>
      )}

      {activeView === 'runs' && (
        <section>
          <div className="mb-4 bg-white border border-gray-200 rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-500">잡 이름</label>
                <select
                  className="text-[13px] border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
                  value={runFilters.jobName}
                  onChange={(e) =>
                    setRunFilters((p) => ({ ...p, jobName: e.target.value as JobRunName | '' }))
                  }
                >
                  <option value="">전체</option>
                  {JOB_RUN_NAMES.map((j) => (
                    <option key={j} value={j}>
                      {JOB_RUN_NAME_LABEL[j]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-500">상태</label>
                <select
                  className="text-[13px] border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
                  value={runFilters.status}
                  onChange={(e) =>
                    setRunFilters((p) => ({ ...p, status: e.target.value as JobRunStatus | '' }))
                  }
                >
                  <option value="">전체</option>
                  {JOB_RUN_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {JOB_RUN_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-500">회사 ID (UUID, 선택)</label>
                <input
                  type="text"
                  className="text-[13px] border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
                  placeholder="비워두면 전체"
                  value={runFilters.companyId}
                  onChange={(e) => setRunFilters((p) => ({ ...p, companyId: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-500">시작일 (포함)</label>
                <input
                  type="date"
                  className="text-[13px] border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
                  value={runFilters.fromDate}
                  onChange={(e) => setRunFilters((p) => ({ ...p, fromDate: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-500">종료일 (포함)</label>
                <input
                  type="date"
                  className="text-[13px] border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40"
                  value={runFilters.toDate}
                  onChange={(e) => setRunFilters((p) => ({ ...p, toDate: e.target.value }))}
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={applyRunFilters}
                  className="px-4 py-1.5 text-[13px] font-medium rounded-md bg-[#1D9E75] text-white hover:bg-[#178a65]"
                >
                  <i className="fa-solid fa-magnifying-glass mr-1" />
                  검색
                </button>
                <button
                  type="button"
                  onClick={resetRunFilters}
                  className="px-3 py-1.5 text-[13px] border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50"
                >
                  초기화
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium whitespace-nowrap">실행 ID</th>
                    <th className="text-left px-3 py-2 font-medium whitespace-nowrap">잡 이름</th>
                    <th className="text-left px-3 py-2 font-medium whitespace-nowrap">상태</th>
                    <th className="text-left px-3 py-2 font-medium whitespace-nowrap">대상 일자</th>
                    <th className="text-left px-3 py-2 font-medium whitespace-nowrap">시작</th>
                    <th className="text-left px-3 py-2 font-medium whitespace-nowrap">종료</th>
                    <th className="text-left px-3 py-2 font-medium whitespace-nowrap">소요</th>
                    <th className="text-right px-3 py-2 font-medium whitespace-nowrap">상세</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {runsLoading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-gray-400">
                        <i className="fa-solid fa-spinner fa-spin mr-1.5" />
                        불러오는 중...
                      </td>
                    </tr>
                  ) : runsError ? (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-red-600">{runsError}</td>
                    </tr>
                  ) : !runPage || runPage.empty ? (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-gray-400">조회된 실행 기록이 없습니다.</td>
                    </tr>
                  ) : (
                    runPage.content.map((row) => (
                      <tr key={row.jobExecutionId} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono text-gray-700">{row.jobExecutionId}</td>
                        <td className="px-3 py-2 text-gray-900 whitespace-nowrap">
                          {JOB_RUN_NAME_LABEL[row.jobName as JobRunName] ?? row.jobName}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={statusBadgeClass(row.status)}>
                            {JOB_RUN_STATUS_LABEL[row.status as JobRunStatus] ?? row.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                          {row.jobParameters?.targetDate ?? '-'}
                        </td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                          {formatTs(row.startTime)}
                        </td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                          {formatTs(row.endTime)}
                        </td>
                        <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                          {formatDuration(row.startTime, row.endTime)}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => void openRunDetail(row.jobExecutionId)}
                            className="px-2 py-1 text-[11px] border border-gray-300 text-gray-600 rounded hover:bg-gray-50"
                          >
                            <i className="fa-solid fa-up-right-from-square mr-1" />
                            상세
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {runPage && runPage.totalPages > 1 && (
              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 text-[12px] text-gray-600">
                <span>총 {runPage.totalElements}건</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={runPage.first}
                    onClick={() => goRunPage(runPage.number - 1)}
                    className={`px-2 py-1 rounded border ${runPage.first ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 hover:bg-gray-50'}`}
                  >
                    <i className="fa-solid fa-chevron-left" />
                  </button>
                  <span className="px-2">
                    {runPage.number + 1} / {runPage.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={runPage.last}
                    onClick={() => goRunPage(runPage.number + 1)}
                    className={`px-2 py-1 rounded border ${runPage.last ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 hover:bg-gray-50'}`}
                  >
                    <i className="fa-solid fa-chevron-right" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 실행 확인 모달 */}
      {confirmJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmJob(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[min(440px,calc(100vw-24px))]">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-[15px] font-bold text-gray-900">
                <i className="fa-solid fa-triangle-exclamation text-amber-500 mr-2" />
                배치 트리거 확인
              </h3>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-[13px] text-gray-700">
                <strong>{confirmJob.title}</strong> 잡을 지금 즉시 실행합니다.
              </p>
              <p className="text-[12px] text-gray-500 leading-relaxed">{confirmJob.description}</p>
              <p className="text-[11px] text-gray-400">
                실행은 백그라운드에서 진행되며, 응답에는 진행 상황이 포함되지 않습니다.
              </p>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setConfirmJob(null)}
                className="px-4 py-2 border border-gray-300 text-gray-600 text-[13px] rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void runJob(confirmJob)}
                className="px-5 py-2 text-[13px] font-medium rounded-md bg-[#1D9E75] text-white hover:bg-[#178a65]"
              >
                실행
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 자동마감 실행 확인 모달 */}
      {confirmAutoClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmAutoClose(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[min(460px,calc(100vw-24px))]">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-[15px] font-bold text-gray-900">
                <i className="fa-solid fa-triangle-exclamation text-amber-500 mr-2" />
                자동마감 즉시 실행 확인
              </h3>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-[13px] text-gray-700">
                근무그룹 <strong>[{confirmAutoClose.groupName}]</strong> 의 어제자
                자동마감/결근 처리를 즉시 실행합니다.
              </p>
              <p className="text-[12px] text-gray-500 leading-relaxed">
                같은 날 이미 처리된 경우 자동으로 중복 차단됩니다. 응답은 즉시 반환되며,
                실제 처리는 백그라운드 워커 스레드에서 수행됩니다.
              </p>
              <p className="text-[11px] text-gray-400">
                실행 결과는 시스템 알림(Discord 등)으로 안내됩니다.
              </p>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setConfirmAutoClose(null)}
                className="px-4 py-2 border border-gray-300 text-gray-600 text-[13px] rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void runAutoClose(confirmAutoClose)}
                className="px-5 py-2 text-[13px] font-medium rounded-md bg-amber-500 text-white hover:bg-amber-600"
              >
                실행
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 잡 실행 상세 모달 */}
      {(runDetail || runDetailLoading || runDetailError) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={closeRunDetail} />
          <div className="relative bg-white rounded-xl shadow-xl w-[min(720px,calc(100vw-24px))] max-h-[calc(100vh-48px)] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-[15px] font-bold text-gray-900">
                <i className="fa-solid fa-circle-info text-[#1D9E75] mr-2" />
                잡 실행 상세
                {runDetail && (
                  <span className="ml-2 text-[12px] font-normal text-gray-500 font-mono">
                    #{runDetail.jobExecutionId}
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={closeRunDetail}
                aria-label="닫기"
                className="text-gray-400 hover:text-gray-600 text-[16px]"
              >
                &times;
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {runDetailLoading ? (
                <p className="text-[13px] text-gray-500 text-center py-8">
                  <i className="fa-solid fa-spinner fa-spin mr-1.5" />
                  불러오는 중...
                </p>
              ) : runDetailError ? (
                <p className="text-[13px] text-red-600 text-center py-8">{runDetailError}</p>
              ) : runDetail ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                    <div>
                      <span className="text-gray-500">잡 이름</span>
                      <p className="text-gray-900 font-medium">
                        {JOB_RUN_NAME_LABEL[runDetail.jobName as JobRunName] ?? runDetail.jobName}
                        <span className="ml-1.5 text-gray-400 font-mono text-[11px]">({runDetail.jobName})</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">상태</span>
                      <p>
                        <span className={statusBadgeClass(runDetail.status)}>
                          {JOB_RUN_STATUS_LABEL[runDetail.status as JobRunStatus] ?? runDetail.status}
                        </span>
                        <span className="ml-1.5 text-gray-400 font-mono text-[11px]">exit: {runDetail.exitCode}</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">시작 시각</span>
                      <p className="text-gray-900">{formatTs(runDetail.startTime)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">종료 시각</span>
                      <p className="text-gray-900">
                        {formatTs(runDetail.endTime)}
                        <span className="ml-1.5 text-gray-400 text-[11px]">
                          ({formatDuration(runDetail.startTime, runDetail.endTime)})
                        </span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[12px] font-semibold text-gray-700 mb-1.5">JobParameters</h4>
                    {Object.keys(runDetail.jobParameters ?? {}).length === 0 ? (
                      <p className="text-[12px] text-gray-400">파라미터 없음</p>
                    ) : (
                      <div className="border border-gray-200 rounded-md overflow-hidden">
                        <table className="w-full text-[12px]">
                          <tbody className="divide-y divide-gray-100">
                            {Object.entries(runDetail.jobParameters).map(([k, v]) => (
                              <tr key={k}>
                                <td className="px-3 py-1.5 text-gray-500 bg-gray-50 w-32 font-mono">{k}</td>
                                <td className="px-3 py-1.5 text-gray-900 font-mono break-all">{v}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-[12px] font-semibold text-gray-700 mb-1.5">Step 카운트</h4>
                    {!runDetail.steps || runDetail.steps.length === 0 ? (
                      <p className="text-[12px] text-gray-400">Step 정보 없음</p>
                    ) : (
                      <div className="border border-gray-200 rounded-md overflow-x-auto">
                        <table className="w-full text-[12px]">
                          <thead className="bg-gray-50 text-gray-600">
                            <tr>
                              <th className="text-left px-3 py-1.5 font-medium">Step</th>
                              <th className="text-left px-3 py-1.5 font-medium">상태</th>
                              <th className="text-right px-3 py-1.5 font-medium">Read</th>
                              <th className="text-right px-3 py-1.5 font-medium">Write</th>
                              <th className="text-right px-3 py-1.5 font-medium">Skip</th>
                              <th className="text-right px-3 py-1.5 font-medium">Commit</th>
                              <th className="text-right px-3 py-1.5 font-medium">Rollback</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {runDetail.steps.map((s) => {
                              const isFailed = s.status === 'FAILED'
                              const hasSkip = s.skipCount > 0
                              const rowCls = isFailed
                                ? 'bg-red-50/60'
                                : hasSkip
                                  ? 'bg-amber-50/60'
                                  : ''
                              return (
                                <tr key={s.stepExecutionId} className={rowCls}>
                                  <td className="px-3 py-1.5 text-gray-900 font-mono">{s.stepName}</td>
                                  <td className="px-3 py-1.5">
                                    <span className={statusBadgeClass(s.status)}>
                                      {JOB_RUN_STATUS_LABEL[s.status as JobRunStatus] ?? s.status}
                                    </span>
                                  </td>
                                  <td className="px-3 py-1.5 text-right font-mono text-gray-700">{s.readCount}</td>
                                  <td className="px-3 py-1.5 text-right font-mono text-gray-700">{s.writeCount}</td>
                                  <td className={`px-3 py-1.5 text-right font-mono ${hasSkip ? 'text-amber-700 font-semibold' : 'text-gray-700'}`}>
                                    {s.skipCount}
                                  </td>
                                  <td className="px-3 py-1.5 text-right font-mono text-gray-700">{s.commitCount}</td>
                                  <td className={`px-3 py-1.5 text-right font-mono ${s.rollbackCount > 0 ? 'text-red-700 font-semibold' : 'text-gray-700'}`}>
                                    {s.rollbackCount}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={closeRunDetail}
                className="px-4 py-2 border border-gray-300 text-gray-600 text-[13px] rounded-md hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
