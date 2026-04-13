import {
  setSeasons,
  getSeasons,
  type Season,
  type Stage,
} from '../../../stores/seasonsStore'

const statusColor = (s: string) => {
  if (s === '진행중') return 'bg-[#eaf6f0] text-[#2e9e6e]'
  if (s === '준비중') return 'bg-[#fef3cd] text-[#f59e0b]'
  if (s === '완료') return 'bg-[#f5f5f5] text-[#8a9490]'
  if (s === '마감') return 'bg-[#f5f5f5] text-[#8a9490]'
  if (s === '대기') return 'bg-[#f5f5f5] text-[#8a9490]'
  return 'bg-[#f5f5f5] text-[#8a9490]'
}

interface Props {
  season: Season
  onBack: () => void
}

// 평가 시즌 상세 — 기본 정보/일정 관리. 완료 시즌은 읽기 전용.
export default function SeasonDetail({ season, onBack }: Props) {
  const isCompleted = season.status === '완료'
  const readOnly = isCompleted

  const updateSeason = (updater: (s: Season) => Season) => {
    setSeasons(getSeasons().map(s => (s.id === season.id ? updater(s) : s)))
  }

  const handleSeasonFieldChange = (field: 'name' | 'startDate' | 'endDate' | 'status', value: string) => {
    if (readOnly) return
    updateSeason(s => ({ ...s, [field]: value } as Season))
  }

  const handleStageChange = (stageId: string, field: keyof Stage, value: string) => {
    if (readOnly) return
    updateSeason(s => ({
      ...s,
      stages: s.stages.map(st => (st.id === stageId ? ({ ...st, [field]: value } as Stage) : st)),
    }))
  }

  const canDelete = !isCompleted
  const handleDelete = () => {
    if (!canDelete) return
    if (!confirm(`"${season.name}" 시즌을 삭제하시겠습니까?`)) return
    setSeasons(getSeasons().filter(s => s.id !== season.id))
    onBack()
  }

  // 일정 요약 계산
  const stageCount = season.stages.length
  const completedStages = season.stages.filter(s => s.status === '마감').length
  const activeStages = season.stages.filter(s => s.status === '진행중').length

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">
        성과관리(인사) &gt; 설계 &gt; 평가 주기/일정 생성 &gt;{' '}
        <span className="text-[#2e9e6e] font-medium">{season.name}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-[#8a9490] bg-transparent border-none cursor-pointer text-[18px] hover:text-[#1a2b23]"
          >
            ←
          </button>
          <div>
            <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">{season.name}</h1>
            <p className="text-[13px] text-[#8a9490]">평가 시즌의 기본 정보와 단계별 일정을 설정합니다.</p>
          </div>
        </div>
        <span className={`text-[12px] px-3 py-1 rounded font-medium ${statusColor(season.status)}`}>
          {season.status}
        </span>
      </div>

      {/* 요약 배너 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-4">
          <div className="text-[11px] text-gray-400 mb-1">전체 단계</div>
          <div className="text-[18px] font-bold text-gray-800">{stageCount}개</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-4">
          <div className="text-[11px] text-gray-400 mb-1">진행 중</div>
          <div className="text-[18px] font-bold text-[#2e9e6e]">{activeStages}개</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-4">
          <div className="text-[11px] text-gray-400 mb-1">마감</div>
          <div className="text-[18px] font-bold text-gray-500">{completedStages}개</div>
        </div>
      </div>

      {readOnly && (
        <div className="mb-5 px-4 py-2.5 bg-[#fef3cd] border border-[#fde68a] rounded-lg text-[12px] text-[#92400e] flex items-center gap-2">
          <span>🔒</span>
          <span>완료된 시즌은 읽기 전용입니다. 수정이 필요하면 관리자에게 문의하세요.</span>
        </div>
      )}

      {/* 기본 정보 */}
      <div className="bg-white border border-[#e0e5e3] rounded-lg p-5 mb-6">
        <h3 className="text-[14px] font-semibold text-[#1a2b23] mb-4">기본 정보</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-[12px] text-[#5a6b62] mb-1">평가명</label>
            <input
              type="text"
              value={season.name}
              onChange={e => handleSeasonFieldChange('name', e.target.value)}
              disabled={readOnly}
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-[12px] text-[#5a6b62] mb-1">시작일</label>
            <input
              type="date"
              value={season.startDate}
              onChange={e => handleSeasonFieldChange('startDate', e.target.value)}
              disabled={readOnly}
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-[12px] text-[#5a6b62] mb-1">종료일</label>
            <input
              type="date"
              value={season.endDate}
              onChange={e => handleSeasonFieldChange('endDate', e.target.value)}
              disabled={readOnly}
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-[12px] text-[#5a6b62] mb-1">상태</label>
            <select
              value={season.status}
              onChange={e => handleSeasonFieldChange('status', e.target.value)}
              disabled={readOnly}
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="준비중">준비중</option>
              <option value="진행중">진행중</option>
              <option value="완료">완료</option>
            </select>
          </div>
        </div>
      </div>

      {/* 단계별 일정 */}
      <div className="bg-white border border-[#e0e5e3] rounded-lg overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-[#e0e5e3] bg-[#f8faf9]">
          <h3 className="text-[14px] font-semibold text-[#1a2b23]">단계별 일정 관리</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            시즌 생성 시 자동 등록된 단계의 날짜만 수정 가능합니다.
          </p>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#e0e5e3]">
              <th className="text-center px-3 py-3 font-medium text-[#5a6b62] w-[60px]">순서</th>
              <th className="text-left px-5 py-3 font-medium text-[#5a6b62]">단계명</th>
              <th className="text-center px-5 py-3 font-medium text-[#5a6b62] w-[180px]">시작일</th>
              <th className="text-center px-5 py-3 font-medium text-[#5a6b62] w-[180px]">종료일</th>
              <th className="text-center px-5 py-3 font-medium text-[#5a6b62] w-[90px]">상태</th>
            </tr>
          </thead>
          <tbody>
            {season.stages.map((stage, i) => (
              <tr key={stage.id} className="border-b border-[#f0f2f1] hover:bg-[#fafbfa]">
                <td className="px-3 py-3 text-center text-[12px] text-gray-400">{i + 1}</td>
                <td className="px-5 py-3 text-[13px] font-medium text-[#1a2b23]">{stage.name}</td>
                <td className="px-5 py-3 text-center">
                  <input
                    type="date"
                    value={stage.startDate}
                    onChange={e => handleStageChange(stage.id, 'startDate', e.target.value)}
                    disabled={readOnly}
                    className="border border-[#e0e5e3] rounded-md px-2 py-1.5 text-[12px] text-center disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </td>
                <td className="px-5 py-3 text-center">
                  <input
                    type="date"
                    value={stage.endDate}
                    onChange={e => handleStageChange(stage.id, 'endDate', e.target.value)}
                    disabled={readOnly}
                    className="border border-[#e0e5e3] rounded-md px-2 py-1.5 text-[12px] text-center disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${statusColor(stage.status)}`}>
                    {stage.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between gap-3">
        <button
          onClick={handleDelete}
          disabled={!canDelete}
          className={`rounded-lg px-5 py-2.5 text-[13px] font-medium transition-colors ${
            canDelete
              ? 'border border-[#ef4444] text-[#ef4444] bg-white hover:bg-[#fef2f2] cursor-pointer'
              : 'border border-[#e0e5e3] text-[#cbd5d1] bg-[#f8faf9] cursor-not-allowed'
          }`}
          title={canDelete ? '시즌 삭제' : '완료된 시즌은 삭제할 수 없습니다'}
        >
          시즌 삭제
        </button>
        <button
          onClick={onBack}
          className="border border-[#e0e5e3] bg-white rounded-lg px-5 py-2.5 text-[13px] cursor-pointer hover:bg-[#f5f5f5]"
        >
          목록으로
        </button>
      </div>
    </div>
  )
}
