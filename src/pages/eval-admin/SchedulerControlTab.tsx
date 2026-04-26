import { useMemo, useState } from 'react'
import {
  useSeasons,
  useSeasonWithDetail,
  refreshSeasons,
  loadSeasonDetail,
  type Stage,
} from '../../stores/seasonsStore'
import { stageLabel, runSeasonScheduler, runStageScheduler } from '../../api/season'

// TODO: 지우기 — 스케줄러 수동 실행 (임시/개발용)
// 시즌/단계 시작일·종료일 도래를 기다리지 않고 즉시 다음 상태로 전이.
export default function SchedulerControlTab() {
  const seasons = useSeasons()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [runningSeason, setRunningSeason] = useState(false)
  const [runningStageId, setRunningStageId] = useState<number | null>(null)

  const defaultSeason = useMemo(
    () => seasons.find(s => s.status === '진행중') ?? seasons[0],
    [seasons],
  )
  const effectiveId = selectedId ?? defaultSeason?.id ?? null
  const selectedSeason = useSeasonWithDetail(effectiveId) ?? defaultSeason

  const handleRunSeason = async () => {
    if (runningSeason) return
    setRunningSeason(true)
    try {
      await runSeasonScheduler()
      await refreshSeasons()
      if (effectiveId) await loadSeasonDetail(effectiveId).catch(() => {})
      alert('시즌 스케줄러 실행 완료')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      alert(err?.response?.data?.message ?? err?.message ?? '시즌 스케줄러 실행 실패')
    } finally {
      setRunningSeason(false)
    }
  }

  const handleRunStage = async (stage: Stage) => {
    if (runningStageId !== null) return
    const sid = Number(stage.id)
    setRunningStageId(sid)
    try {
      await runStageScheduler(sid)
      await refreshSeasons()
      if (effectiveId) await loadSeasonDetail(effectiveId).catch(() => {})
      alert('단계 스케줄러 실행 완료')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      alert(err?.response?.data?.message ?? err?.message ?? '단계 스케줄러 실행 실패')
    } finally {
      setRunningStageId(null)
    }
  }

  const statusBadge = (s: string) => {
    if (s === '진행중') return 'bg-[#eaf6f0] text-[#2e9e6e]'
    if (s === '마감') return 'bg-[#f5f5f5] text-[#8a9490]'
    return 'bg-[#fef3cd] text-[#f59e0b]'
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">스케줄러 운영 (임시/개발용)</h1>
        <p className="text-[13px] text-[#8a9490]">
          시즌·단계 시작일/종료일 도래를 기다리지 않고 즉시 다음 상태로 전이합니다. 자정 자동 스케줄러가 도는 환경 외 개발/테스트 용도.
        </p>
      </div>

      {/* 시즌 스케줄러 */}
      <div className="bg-white border border-[#e0e5e3] rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[15px] font-semibold text-[#1a2b23] mb-0.5">시즌 스케줄러</h2>
            <p className="text-[12px] text-[#8a9490]">오늘 시작일/종료일에 해당하는 시즌·단계를 일괄 전이합니다.</p>
          </div>
          <button
            onClick={handleRunSeason}
            disabled={runningSeason}
            className="bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2.5 text-[13px] font-medium cursor-pointer hover:bg-[#0F6E56] disabled:opacity-50"
          >
            {runningSeason ? '실행 중...' : '시즌 스케줄러 실행'}
          </button>
        </div>
      </div>

      {/* 단계 스케줄러 */}
      <div className="bg-white border border-[#e0e5e3] rounded-lg p-5">
        <h2 className="text-[15px] font-semibold text-[#1a2b23] mb-1">단계 스케줄러</h2>
        <p className="text-[12px] text-[#8a9490] mb-4">
          단계 시작일/종료일을 무시하고 즉시 다음 상태로 전이합니다 (대기 → 진행중 → 마감).
        </p>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-[13px] text-[#8a9490]">평가 시즌:</span>
          <select
            value={selectedSeason?.id ?? ''}
            onChange={e => setSelectedId(Number(e.target.value))}
            className="border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] bg-white text-[#1a2b23]"
          >
            {seasons.length === 0 && <option value="">시즌 없음</option>}
            {seasons.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
            ))}
          </select>
        </div>

        {!selectedSeason ? (
          <div className="text-[13px] text-[#8a9490]">시즌이 없습니다.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedSeason.stages.map((stage, idx) => {
              const sid = Number(stage.id)
              const isRunning = runningStageId === sid
              const canRun = stage.status === '대기' || stage.status === '진행중'
              return (
                <div key={stage.id} className="border border-[#e0e5e3] rounded-lg p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[12px] text-[#8a9490]">{idx + 1}단계</span>
                      <span className="text-[13px] font-semibold text-[#1a2b23] truncate">{stageLabel(stage)}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${statusBadge(stage.status)}`}>
                        {stage.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#8a9490]">
                      {stage.startDate || '미정'} ~ {stage.endDate || '미정'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRunStage(stage)}
                    disabled={!canRun || runningStageId !== null}
                    title={canRun ? '시작일/종료일 무시하고 즉시 다음 상태로 전이' : '마감된 단계는 더 진행할 상태가 없습니다'}
                    className={`shrink-0 border rounded-lg px-3 py-2 text-[12px] font-medium transition-colors ${
                      canRun
                        ? 'border-[#1D9E75] text-[#1D9E75] bg-white hover:bg-[#f2faf6] cursor-pointer'
                        : 'border-[#e0e5e3] text-[#cbd5d1] bg-[#f8faf9] cursor-not-allowed'
                    } disabled:opacity-50`}
                  >
                    {isRunning ? '실행 중...' : '스케줄러 실행'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
