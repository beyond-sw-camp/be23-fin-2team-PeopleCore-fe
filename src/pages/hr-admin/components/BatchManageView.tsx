import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { adminBatchApi, type AdminBatchJob } from '../../../api/batch'
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
        장애 복구 / 정책 변경 즉시 반영이 필요할 때 운영 잡을 수동으로 트리거합니다.
      </p>

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
          근무그룹 자동마감 (즉시 실행)
        </h3>
        <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">
          선택한 근무그룹의 어제자 자동마감/결근 처리를 즉시 트리거합니다.
          같은 날 이미 처리된 경우 자동으로 중복 차단되며, 결과는 알림으로 안내됩니다.
        </p>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          {workGroupsLoading ? (
            <p className="text-[12px] text-gray-400">
              <i className="fa-solid fa-spinner fa-spin mr-1.5" />
              근무그룹 목록을 불러오는 중...
            </p>
          ) : workGroupsError ? (
            <p className="text-[12px] text-red-600">{workGroupsError}</p>
          ) : workGroups.length === 0 ? (
            <p className="text-[12px] text-gray-400">등록된 근무그룹이 없습니다.</p>
          ) : (
            (() => {
              const selected = workGroups.find((wg) => wg.workGroupId === selectedWorkGroupId) ?? null
              const left = selected ? autoCloseRemainingSec(selected.workGroupId) : 0
              const isPending = selected ? autoClosePending === selected.workGroupId : false
              const disabled = !selected || isPending || left > 0
              return (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                        자동마감 즉시 실행
                      </>
                    )}
                  </button>
                </div>
              )
            })()
          )}
        </div>
      </section>

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
    </div>
  )
}
