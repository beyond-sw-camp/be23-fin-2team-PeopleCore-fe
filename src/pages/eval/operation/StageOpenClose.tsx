import { useState, useMemo, useRef } from 'react'
import {
  useSeasons,
  useSeasonWithDetail,
  setSeasons,
  getSeasons,
  type StageStatus,
} from '../../../stores/seasonsStore'

export default function StageOpenClose() {
  const seasons = useSeasons()
  const [confirmModal, setConfirmModal] = useState<{ id: string; action: '오픈' | '마감'; stageName: string } | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const defaultSeason = useMemo(
    () => seasons.find(s => s.status === '진행중') ?? seasons[0],
    [seasons],
  )
  const effectiveId = selectedId ?? defaultSeason?.id ?? null
  // 상세 로드 (stages 포함). 이미 로드된 경우 재사용.
  const selectedSeason = useSeasonWithDetail(effectiveId) ?? defaultSeason

  // 마감은 왼쪽, 진행중은 중간, 대기는 오른쪽
  const orderedStages = useMemo(() => {
    if (!selectedSeason) return []
    const closed = selectedSeason.stages.filter(s => s.status === '마감')
    const active = selectedSeason.stages.filter(s => s.status === '진행중')
    const waiting = selectedSeason.stages.filter(s => s.status === '대기')
    return [...closed, ...active, ...waiting]
  }, [selectedSeason])

  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollBy = (px: number) => scrollRef.current?.scrollBy({ left: px, behavior: 'smooth' })

  const handleConfirm = () => {
    if (!confirmModal || !selectedSeason) return
    const newStatus: StageStatus = confirmModal.action === '오픈' ? '진행중' : '마감'
    setSeasons(getSeasons().map(s => {
      if (s.id !== selectedSeason.id) return s
      return {
        ...s,
        stages: s.stages.map(st => st.id === confirmModal.id ? { ...st, status: newStatus } : st),
      }
    }))
    setConfirmModal(null)
  }

  const statusBadge = (s: StageStatus) => {
    if (s === '진행중') return 'bg-[#eaf6f0] text-[#2e9e6e]'
    if (s === '마감') return 'bg-[#f5f5f5] text-[#8a9490]'
    return 'bg-[#fef3cd] text-[#f59e0b]'
  }

  const circleStyle = (s: StageStatus) => {
    if (s === '마감') return 'bg-[#2e9e6e] text-white'
    if (s === '진행중') return 'bg-[#1D9E75] text-white ring-4 ring-[#1D9E75]/20'
    return 'bg-[#f5f5f5] text-[#8a9490] border-2 border-[#e0e5e3]'
  }

  if (!selectedSeason) {
    return <div className="p-6 text-gray-400">평가 시즌이 없습니다. 먼저 시즌을 생성해주세요.</div>
  }

  // 진행중 시즌일 때만 단계 개폐 가능 (준비중/완료는 읽기 전용)
  const isOperable = selectedSeason.status === '진행중'

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(인사) &gt; 운영 &gt; 평가 오픈/마감 처리</div>

      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">평가 오픈/마감 처리</h1>
        <p className="text-[13px] text-[#8a9490]">평가 단계별 오픈 및 마감을 처리합니다. 마감된 단계는 자동으로 왼쪽으로 이동합니다.</p>
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

      {/* 파이프라인 — 가로 스크롤 + 양옆 그라데이션 + 화살표 */}
      <div className="relative mb-6">
        {/* 왼쪽 그라데이션 */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#f8fafb] via-[#f8fafb]/80 to-transparent z-10" />
        {/* 오른쪽 그라데이션 */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#f8fafb] via-[#f8fafb]/80 to-transparent z-10" />

        {/* 왼쪽 화살표 */}
        <button
          onClick={() => scrollBy(-300)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-[#e0e5e3] shadow-md text-[#1a2b23] hover:border-[#1D9E75] hover:text-[#1D9E75] flex items-center justify-center transition-colors"
          aria-label="이전"
        >
          <i className="fa-solid fa-chevron-left text-[14px]" />
        </button>
        {/* 오른쪽 화살표 */}
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
          {orderedStages.map((stage, idx) => {
            const origIdx = selectedSeason.stages.findIndex(s => s.id === stage.id)
            const isClosed = stage.status === '마감'
            return (
              <div key={stage.id} className="relative shrink-0 w-[280px]">
                {idx < orderedStages.length - 1 && (
                  <div className="absolute top-10 -right-2 w-4 h-0.5 bg-[#e0e5e3] z-10" />
                )}
                <div className={`bg-white border border-[#e0e5e3] rounded-lg p-5 ${isClosed ? 'opacity-70' : ''}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold ${circleStyle(stage.status)}`}>
                      {stage.status === '마감' ? '✓' : origIdx + 1}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[#1a2b23]">{stage.name}</div>
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

                  {stage.status === '대기' && (
                    <button
                      disabled={!isOperable}
                      onClick={() => setConfirmModal({ id: stage.id, action: '오픈', stageName: stage.name })}
                      title={isOperable ? '' : '진행중 시즌에서만 단계를 오픈할 수 있습니다'}
                      className={`w-full text-white border-none rounded-lg px-3 py-2 text-[12px] font-medium transition-colors ${
                        isOperable ? 'bg-[#1D9E75] hover:bg-[#0F6E56] cursor-pointer' : 'bg-[#cbd5d1] cursor-not-allowed'
                      }`}
                    >오픈</button>
                  )}
                  {stage.status === '진행중' && (
                    <button
                      disabled={!isOperable}
                      onClick={() => setConfirmModal({ id: stage.id, action: '마감', stageName: stage.name })}
                      title={isOperable ? '' : '진행중 시즌에서만 단계를 마감할 수 있습니다'}
                      className={`w-full text-white border-none rounded-lg px-3 py-2 text-[12px] font-medium transition-colors ${
                        isOperable ? 'bg-[#ef4444] hover:bg-[#dc2626] cursor-pointer' : 'bg-[#cbd5d1] cursor-not-allowed'
                      }`}
                    >마감</button>
                  )}
                  {stage.status === '마감' && (
                    <div className="text-center text-[12px] text-[#8a9490] py-1">마감 완료</div>
                  )}
                </div>
              </div>
            )
          })}
          </div>
        </div>
      </div>

      {/* 안내 */}
      <div className="bg-[#fef3cd] border border-[#fde68a] rounded-lg px-5 py-3 text-[12px] text-[#92400e]">
        이전 단계가 마감된 후 다음 단계를 오픈할 수 있습니다. 날짜·단계 순서는 <strong>평가 설계 &gt; 평가 시즌</strong>에서 편집합니다.
      </div>

      {/* 확인 모달 */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[440px]">
            <div className="text-center mb-4">
              <div className="text-[36px] mb-2">{confirmModal.action === '오픈' ? '🔓' : '🔒'}</div>
              <h3 className="text-[18px] font-semibold text-[#1a2b23] mb-1">
                {confirmModal.stageName} 단계 {confirmModal.action}
              </h3>
              <p className="text-[13px] text-[#8a9490]">
                {confirmModal.action === '오픈'
                  ? `"${confirmModal.stageName}" 단계를 오픈하면 대상자들이 해당 평가를 시작할 수 있습니다. 오픈하시겠습니까?`
                  : `"${confirmModal.stageName}" 단계를 마감하면 더 이상 제출이 불가능합니다. 미제출자가 있을 수 있으니 확인 후 진행하세요.`}
              </p>
            </div>

            {confirmModal.action === '마감' && (
              <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-lg p-3 mb-4 text-[12px] text-[#991b1b]">
                마감 후에는 해당 단계의 평가 입력/수정이 차단됩니다. 미제출자에게 사전 안내 후 진행을 권장합니다.
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)}
                className="flex-1 border border-[#e0e5e3] bg-white rounded-lg px-4 py-2.5 text-[13px] cursor-pointer hover:bg-[#f5f5f5]"
              >취소</button>
              <button onClick={handleConfirm}
                className={`flex-1 text-white border-none rounded-lg px-4 py-2.5 text-[13px] font-medium cursor-pointer transition-colors ${
                  confirmModal.action === '오픈' ? 'bg-[#1D9E75] hover:bg-[#0F6E56]' : 'bg-[#ef4444] hover:bg-[#dc2626]'
                }`}
              >{confirmModal.action === '오픈' ? '오픈 확인' : '마감 확인'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
