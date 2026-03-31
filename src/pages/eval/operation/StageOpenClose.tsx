import { useState } from 'react'

type StageStatus = '마감' | '진행중' | '대기'

interface Stage {
  id: number
  name: string
  dateRange: string
  submitted: number
  total: number
  status: StageStatus
}

const initialStages: Stage[] = [
  { id: 1, name: '목표등록', dateRange: '2024-06-01 ~ 2024-06-07', submitted: 65, total: 73, status: '마감' },
  { id: 2, name: '자기평가', dateRange: '2024-06-08 ~ 2024-06-15', submitted: 45, total: 73, status: '진행중' },
  { id: 3, name: '동료평가', dateRange: '2024-06-10 ~ 2024-06-17', submitted: 0, total: 73, status: '대기' },
  { id: 4, name: '상위자평가', dateRange: '2024-06-18 ~ 2024-06-25', submitted: 0, total: 73, status: '대기' },
]

const seasons = ['2024년 상반기 정기평가', '2023년 하반기 정기평가', '2024년 하반기 정기평가']

export default function StageOpenClose() {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0])
  const [stages, setStages] = useState<Stage[]>(initialStages)
  const [confirmModal, setConfirmModal] = useState<{ id: number; action: '오픈' | '마감'; stageName: string } | null>(null)

  const handleConfirm = () => {
    if (!confirmModal) return
    setStages(stages.map(s => {
      if (s.id !== confirmModal.id) return s
      return { ...s, status: confirmModal.action === '오픈' ? '진행중' : '마감' }
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

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(인사) &gt; 운영 &gt; 평가 오픈/마감 처리</div>

      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">평가 오픈/마감 처리</h1>
        <p className="text-[13px] text-[#8a9490]">평가 단계별 오픈 및 마감을 처리합니다.</p>
      </div>

      {/* 시즌 선택 */}
      <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 mb-6 flex items-center gap-3">
        <span className="text-[13px] text-[#8a9490]">평가 시즌:</span>
        <select
          value={selectedSeason}
          onChange={e => setSelectedSeason(e.target.value)}
          className="border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]"
        >
          {seasons.map(s => <option key={s}>{s}</option>)}
        </select>
        <span className="ml-auto px-2 py-0.5 rounded text-[11px] font-medium bg-[#eaf6f0] text-[#2e9e6e]">진행중</span>
      </div>

      {/* 단계 파이프라인 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stages.map((stage, idx) => (
          <div key={stage.id} className="relative">
            {idx < stages.length - 1 && (
              <div className="absolute top-10 left-full w-4 h-0.5 bg-[#e0e5e3] z-10 -translate-x-2" />
            )}
            <div className="bg-white border border-[#e0e5e3] rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold ${circleStyle(stage.status)}`}>
                  {stage.status === '마감' ? '✓' : stage.id}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[#1a2b23]">{stage.name}</div>
                  <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${statusBadge(stage.status)}`}>
                    {stage.status}
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-[#8a9490] mb-3">{stage.dateRange}</div>
              <div className="mb-3">
                <div className="flex justify-between text-[11px] text-[#8a9490] mb-1">
                  <span>제출 현황</span>
                  <span>{stage.submitted}/{stage.total}</span>
                </div>
                <div className="h-1.5 bg-[#f0f2f1] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1D9E75] rounded-full transition-all"
                    style={{ width: `${(stage.submitted / stage.total) * 100}%` }}
                  />
                </div>
              </div>
              {stage.status === '대기' && (
                <button
                  onClick={() => setConfirmModal({ id: stage.id, action: '오픈', stageName: stage.name })}
                  className="w-full bg-[#1D9E75] text-white border-none rounded-lg px-3 py-2 text-[12px] font-medium cursor-pointer hover:bg-[#0F6E56] transition-colors"
                >
                  오픈
                </button>
              )}
              {stage.status === '진행중' && (
                <button
                  onClick={() => setConfirmModal({ id: stage.id, action: '마감', stageName: stage.name })}
                  className="w-full bg-[#ef4444] text-white border-none rounded-lg px-3 py-2 text-[12px] font-medium cursor-pointer hover:bg-[#dc2626] transition-colors"
                >
                  마감
                </button>
              )}
              {stage.status === '마감' && (
                <div className="text-center text-[12px] text-[#8a9490] py-1">마감 완료</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 안내 */}
      <div className="bg-[#fef3cd] border border-[#fde68a] rounded-lg px-5 py-3 text-[12px] text-[#92400e]">
        이전 단계가 마감된 후 다음 단계를 오픈할 수 있습니다. 단계 순서(목표등록 → 자기평가 → 동료평가 → 상위자평가)를 준수해주세요.
      </div>

      {/* 확인 모달 */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[440px]">
            <div className="text-center mb-4">
              <div className={`text-[36px] mb-2 ${confirmModal.action === '오픈' ? '' : ''}`}>
                {confirmModal.action === '오픈' ? '🔓' : '🔒'}
              </div>
              <h3 className="text-[18px] font-semibold text-[#1a2b23] mb-1">
                {confirmModal.stageName} 단계 {confirmModal.action}
              </h3>
              <p className="text-[13px] text-[#8a9490]">
                {confirmModal.action === '오픈'
                  ? `"${confirmModal.stageName}" 단계를 오픈하면 대상자들이 해당 평가를 시작할 수 있습니다. 오픈하시겠습니까?`
                  : `"${confirmModal.stageName}" 단계를 마감하면 더 이상 제출이 불가능합니다. 미제출자가 있을 수 있으니 확인 후 진행하세요.`
                }
              </p>
            </div>

            {confirmModal.action === '마감' && (
              <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-lg p-3 mb-4 text-[12px] text-[#991b1b]">
                마감 후에는 해당 단계의 평가 입력/수정이 차단됩니다. 미제출자에게 사전 안내 후 진행을 권장합니다.
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 border border-[#e0e5e3] bg-white rounded-lg px-4 py-2.5 text-[13px] cursor-pointer hover:bg-[#f5f5f5]"
              >
                취소
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 text-white border-none rounded-lg px-4 py-2.5 text-[13px] font-medium cursor-pointer transition-colors ${
                  confirmModal.action === '오픈'
                    ? 'bg-[#1D9E75] hover:bg-[#0F6E56]'
                    : 'bg-[#ef4444] hover:bg-[#dc2626]'
                }`}
              >
                {confirmModal.action === '오픈' ? '오픈 확인' : '마감 확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
