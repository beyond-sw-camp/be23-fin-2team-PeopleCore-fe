import { useState, useMemo, useRef } from 'react'
import {
  useActiveSeasons,
  useSeasonWithDetail,
  toggleStageStatusAction,
  updateStageDatesAction,
  refreshSeasons,
  loadSeasonDetail,
  type Stage,
} from '../../../stores/seasonsStore'
import { stageLabel, runStageScheduler } from '../../../api/season'

export default function StageOpenClose() {
  const seasons = useActiveSeasons()   // 완료(CLOSED) 시즌 제외
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [extendStage, setExtendStage] = useState<Stage | null>(null)
  const [extendDate, setExtendDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  // 이번 세션에서 임시오픈된 단계 id (마감 → 진행중 토글 시 추가, 다시 마감하면 제거)
  // 새로고침 시에는 today >= endDate 휴리스틱으로 폴백
  const [tempOpenedIds, setTempOpenedIds] = useState<Set<string>>(new Set())
  // TODO: 지우기 — 단계 스케줄러 수동 실행 (임시/시연용)
  const [runningStageId, setRunningStageId] = useState<number | null>(null)

  const defaultSeason = useMemo(
    () => seasons.find(s => s.status === '진행중') ?? seasons[0],
    [seasons],
  )
  const effectiveId = selectedId ?? defaultSeason?.id ?? null
  const selectedSeason = useSeasonWithDetail(effectiveId) ?? defaultSeason

  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollBy = (px: number) => scrollRef.current?.scrollBy({ left: px, behavior: 'smooth' })

  // 단계 상태 토글 — 임시 오픈 / 마감 즉시 적용 (비밀번호 확인 단계 없음)
  const toggleStage = async (stage: Stage) => {
    if (!selectedSeason) return
    setError(null)
    const wasClosed = stage.status === '마감'
    try {
      await toggleStageStatusAction(selectedSeason.id, Number(stage.id))
      setTempOpenedIds(prev => {
        const next = new Set(prev)
        if (wasClosed) next.add(String(stage.id))
        else next.delete(String(stage.id))
        return next
      })
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      const msg = err?.response?.data?.message ?? err?.message ?? '처리에 실패했습니다.'
      alert(msg)
    }
  }

  // 다음 단계 시작일 전날 = 연장 가능한 최대 종료일 (다음 단계가 없으면 시즌 종료일)
  const getMaxExtendDate = (stage: Stage): string | undefined => {
    if (!selectedSeason) return undefined
    const idx = selectedSeason.stages.findIndex(s => s.id === stage.id)
    const next = idx >= 0 ? selectedSeason.stages[idx + 1] : undefined
    if (next?.startDate) {
      const d = new Date(next.startDate)
      d.setDate(d.getDate() - 1)
      return d.toISOString().slice(0, 10)
    }
    return selectedSeason.endDate || undefined
  }

  const handleExtendSubmit = async () => {
    if (!extendStage || !selectedSeason) return
    if (!extendDate) { setError('연장 날짜를 입력하세요.'); return }
    if (extendDate < extendStage.endDate) { setError('기존 종료일보다 이후 날짜여야 합니다.'); return }
    const maxDate = getMaxExtendDate(extendStage)
    if (maxDate && extendDate > maxDate) {
      setError('다음 단계 시작일 전날까지만 연장할 수 있습니다.'); return
    }
    setError(null)
    try {
      await updateStageDatesAction(selectedSeason.id, Number(extendStage.id), { endDate: extendDate })
      setExtendStage(null)
      setExtendDate('')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      const msg = err?.response?.data?.message ?? err?.message ?? '처리에 실패했습니다.'
      alert(msg)
    }
  }

  const statusBadge = (s: string) => {
    if (s === '진행중') return 'bg-[#eaf6f0] text-[#2e9e6e]'
    if (s === '마감') return 'bg-[#f5f5f5] text-[#8a9490]'
    return 'bg-[#fef3cd] text-[#f59e0b]'
  }

  const circleStyle = (s: string) => {
    if (s === '마감') return 'bg-[#2e9e6e] text-white'
    if (s === '진행중') return 'bg-[#1D9E75] text-white ring-4 ring-[#1D9E75]/20'
    return 'bg-[#f5f5f5] text-[#8a9490] border-2 border-[#e0e5e3]'
  }

  if (!selectedSeason) {
    return <div className="p-6 text-gray-400">평가 시즌이 없습니다. 먼저 시즌을 생성해주세요.</div>
  }

  // 진행중 시즌일 때만 단계 개폐·기간 연장 가능 (준비중/완료는 읽기 전용)
  const isOperable = selectedSeason.status === '진행중'

  // TODO: 지우기 — 단계 스케줄러 수동 실행 (임시/시연용)
  const handleRunStageScheduler = async (stage: Stage) => {
    if (runningStageId !== null) return
    const sid = Number(stage.id)
    setRunningStageId(sid)
    try {
      await runStageScheduler(sid)
      await refreshSeasons()
      if (selectedSeason) await loadSeasonDetail(selectedSeason.id).catch(() => {})
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      alert(err?.response?.data?.message ?? err?.message ?? '단계 스케줄러 실행 실패')
    } finally {
      setRunningStageId(null)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(인사) &gt; 운영 &gt; 평가 오픈/마감 처리</div>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">평가 오픈/마감 처리</h1>
          <p className="text-[13px] text-[#8a9490]">
            진행중인 단계는 기간을 연장할 수 있고, 마감된 단계는 임시 개폐로 잠시 열고 닫을 수 있습니다.
          </p>
        </div>
        {/* TODO: 지우기 — 단계별 스케줄러 수동 실행 (임시/시연용) */}
        <div className="flex gap-1.5 shrink-0">
          {selectedSeason.stages.map((stage, idx) => {
            const sid = Number(stage.id)
            const isRunning = runningStageId === sid
            const canRun = stage.status === '대기' || stage.status === '진행중'
            return (
              <button
                key={stage.id}
                onClick={() => handleRunStageScheduler(stage)}
                disabled={!canRun || runningStageId !== null}
                title={`${stageLabel(stage)} (${stage.status}) — 즉시 다음 상태로 전이`}
                className={`min-w-[64px] border rounded-lg px-2 py-1.5 text-[12px] font-medium transition-colors ${
                  canRun
                    ? 'border-[#1D9E75] text-[#1D9E75] bg-white hover:bg-[#f2faf6] cursor-pointer'
                    : 'border-[#e0e5e3] text-[#cbd5d1] bg-[#f8faf9] cursor-not-allowed'
                } disabled:opacity-50`}
              >
                {isRunning ? '실행 중' : `${idx + 1}단계`}
              </button>
            )
          })}
        </div>
      </div>

      {/* 시즌 선택 */}
      <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 mb-6 flex items-center gap-3">
        <span className="text-[13px] text-[#8a9490]">평가 시즌:</span>
        <select
          value={selectedSeason?.id ?? ''}
          onChange={e => setSelectedId(Number(e.target.value))}
          className="border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] bg-white text-[#1a2b23]"
        >
          {seasons.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
          ))}
        </select>
        <span className={`ml-auto px-2 py-0.5 rounded text-[11px] font-medium ${
          selectedSeason.status === '진행중' ? 'bg-[#eaf6f0] text-[#2e9e6e]' :
          selectedSeason.status === '완료' ? 'bg-[#f5f5f5] text-[#8a9490]' :
          'bg-[#fef3cd] text-[#f59e0b]'
        }`}>{selectedSeason.status}</span>
      </div>

      {/* 파이프라인 */}
      <div className="relative mb-6">
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#f8fafb] via-[#f8fafb]/80 to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#f8fafb] via-[#f8fafb]/80 to-transparent z-10" />

        <button
          onClick={() => scrollBy(-300)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-[#e0e5e3] shadow-md text-[#1a2b23] hover:border-[#1D9E75] hover:text-[#1D9E75] flex items-center justify-center transition-colors"
          aria-label="이전"
        >
          <i className="fa-solid fa-chevron-left text-[14px]" />
        </button>
        <button
          onClick={() => scrollBy(300)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-[#e0e5e3] shadow-md text-[#1a2b23] hover:border-[#1D9E75] hover:text-[#1D9E75] flex items-center justify-center transition-colors"
          aria-label="다음"
        >
          <i className="fa-solid fa-chevron-right text-[14px]" />
        </button>

        <div
          ref={scrollRef}
          className="overflow-x-auto hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
          <div className="flex gap-4 pb-1 px-14">
          {selectedSeason.stages.map((stage, idx) => {
            const isClosed = stage.status === '마감'
            return (
              <div key={stage.id} className="relative shrink-0 w-[280px]">
                {idx < selectedSeason.stages.length - 1 && (
                  <div className="absolute top-10 -right-2 w-4 h-0.5 bg-[#e0e5e3] z-10" />
                )}
                <div className={`bg-white border border-[#e0e5e3] rounded-lg p-5 ${isClosed ? 'opacity-70' : ''}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold ${circleStyle(stage.status)}`}>
                      {stage.status === '마감' ? '✓' : idx + 1}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[#1a2b23]">{stageLabel(stage)}</div>
                      <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${statusBadge(stage.status)}`}>
                        {stage.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-[#8a9490] mb-3">
                    {stage.startDate || '미정'} ~ {stage.endDate || '미정'}
                  </div>

                  {/* 제출 현황 (mock) */}
                  {(() => {
                    const total = 73
                    const submitted = stage.status === '마감' ? total : stage.status === '진행중' ? 45 : 0
                    const pct = total > 0 ? (submitted / total) * 100 : 0
                    return (
                      <div className="mb-3">
                        <div className="flex justify-between text-[11px] text-[#8a9490] mb-1">
                          <span>제출 현황</span>
                          <span>{submitted}/{total}</span>
                        </div>
                        <div className="h-1.5 bg-[#f0f2f1] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1D9E75] rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })()}

                  {/* 버튼: 단계 상태와 임시오픈 여부에 따라 1개만 노출
                       - 마감: 임시 오픈
                       - 진행중 + 임시오픈됨: 마감
                       - 진행중 + 정상: 기간 연장
                       - 대기: 버튼 없음
                       임시오픈 판정: 이번 세션의 토글 이력(tempOpenedIds) OR today > endDate (새로고침 폴백) */}
                  {(() => {
                    const today = new Date().toISOString().slice(0, 10)
                    const isTempOpened =
                      stage.status === '진행중' &&
                      (tempOpenedIds.has(String(stage.id)) ||
                        (!!stage.endDate && today > stage.endDate))

                    if (stage.status === '마감') {
                      return (
                        <button
                          disabled={!isOperable}
                          onClick={() => toggleStage(stage)}
                          title={isOperable ? '마감 단계를 잠시 열기' : '진행중 시즌에서만 가능합니다'}
                          className={`w-full text-white border-none rounded-lg px-3 py-2 text-[12px] font-medium transition-colors ${
                            isOperable ? 'bg-[#1D9E75] hover:bg-[#0F6E56] cursor-pointer' : 'bg-[#cbd5d1] cursor-not-allowed'
                          }`}
                        >임시 오픈</button>
                      )
                    }
                    if (isTempOpened) {
                      return (
                        <button
                          disabled={!isOperable}
                          onClick={() => toggleStage(stage)}
                          title={isOperable ? '임시 오픈 종료 (마감)' : '진행중 시즌에서만 가능합니다'}
                          className={`w-full text-white border-none rounded-lg px-3 py-2 text-[12px] font-medium transition-colors ${
                            isOperable ? 'bg-[#ef4444] hover:bg-[#dc2626] cursor-pointer' : 'bg-[#cbd5d1] cursor-not-allowed'
                          }`}
                        >마감</button>
                      )
                    }
                    if (stage.status === '진행중') {
                      return (
                        <button
                          disabled={!isOperable}
                          onClick={() => {
                            setExtendStage(stage)
                            setExtendDate(stage.endDate)
                          }}
                          title={isOperable ? '종료일 연장' : '진행중 시즌에서만 가능합니다'}
                          className={`w-full border rounded-lg px-3 py-2 text-[12px] font-medium transition-colors ${
                            isOperable
                              ? 'border-[#1D9E75] text-[#1D9E75] bg-white hover:bg-[#f2faf6] cursor-pointer'
                              : 'border-[#e0e5e3] text-[#cbd5d1] bg-[#f8faf9] cursor-not-allowed'
                          }`}
                        >기간 연장</button>
                      )
                    }
                    return null // 대기: 버튼 없음
                  })()}
                </div>
              </div>
            )
          })}
          </div>
        </div>
      </div>

      {/* 안내 */}
      <div className="bg-[#fef3cd] border border-[#fde68a] rounded-lg px-5 py-3 text-[12px] text-[#92400e]">
        단계는 날짜에 따라 자동 전환되며 수동으로 직접 조작하지 않습니다. 마감 단계의 임시 오픈과 진행 단계의 기간 연장은 즉시 반영됩니다. 날짜·단계 순서는 <strong>평가 설계 &gt; 평가 시즌</strong>에서 편집합니다.
      </div>

      {/* 기간 연장 — 날짜 입력 모달 (비번 통과 후 노출) */}
      {extendStage && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[440px]">
            <div className="text-center mb-4">
              <div className="text-[36px] mb-2">🗓️</div>
              <h3 className="text-[18px] font-semibold text-[#1a2b23] mb-1">
                {stageLabel(extendStage)} 기간 연장
              </h3>
              <p className="text-[13px] text-[#8a9490]">
                종료일을 연장합니다. 현재 종료일: <strong>{extendStage.endDate || '미정'}</strong>
              </p>
            </div>
            <label className="block text-[12px] text-[#5a6b62] mb-1">새 종료일</label>
            <input
              type="date"
              value={extendDate}
              min={extendStage.endDate || undefined}
              max={getMaxExtendDate(extendStage)}
              onChange={e => setExtendDate(e.target.value)}
              className="w-full border border-[#e0e5e3] rounded-lg px-3 py-2.5 text-[13px] mb-2"
            />
            {error && <p className="text-[12px] text-[#ef4444] mb-2">{error}</p>}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setExtendStage(null); setExtendDate(''); setError(null) }}
                className="flex-1 border border-[#e0e5e3] bg-white rounded-lg px-4 py-2.5 text-[13px] cursor-pointer hover:bg-[#f5f5f5]"
              >취소</button>
              <button
                onClick={handleExtendSubmit}
                className="flex-1 bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2.5 text-[13px] font-medium cursor-pointer hover:bg-[#0F6E56]"
              >연장 적용</button>
            </div>
          </div>
        </div>
      )}

      {error && !extendStage && <p className="text-[12px] text-[#ef4444] mt-3">{error}</p>}
    </div>
  )
}
