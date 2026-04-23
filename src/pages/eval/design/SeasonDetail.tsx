import { useState } from 'react'
import {
  updateSeasonAction,
  deleteSeasonAction,
  loadSeasonDetail,
  useSeasons,
  type Season,
} from '../../../stores/seasonsStore'
import { stageLabel, updateStageDates, SEASON_PERIOD_OPTIONS, SEASON_PERIOD_LABEL } from '../../../api/season'

// YYYY-MM-DD 에 N일 더한 날짜 (단계 시작일 min 계산용 — 이전 단계보다 strict 이후)
function addDaysISO(dateStr: string, days: number): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const statusColor = (s: string) => {
  if (s === '진행중') return 'bg-[#eaf6f0] text-[#2e9e6e]'
  if (s === '준비중') return 'bg-[#fef3cd] text-[#f59e0b]'
  return 'bg-[#f5f5f5] text-[#8a9490]'
}

interface Props {
  season: Season
  onBack: () => void
}

// 평가 시즌 상세 — 기본 정보 수정. 완료 시즌은 읽기 전용. DRAFT(준비중)만 삭제·단계일정 편집 가능.
export default function SeasonDetail({ season, onBack }: Props) {
  const allSeasons = useSeasons()
  const isCompleted = season.status === '완료'
  const readOnly = isCompleted
  const stageEditable = season.status === '준비중'

  const [form, setForm] = useState({
    name: season.name,
    period: season.period,
    startDate: season.startDate,
    endDate: season.endDate,
  })
  const [stageDates, setStageDates] = useState(() =>
    season.stages.reduce<Record<string, { startDate: string; endDate: string }>>((acc, s) => {
      acc[s.id] = { startDate: s.startDate, endDate: s.endDate }
      return acc
    }, {}),
  )
  const [saving, setSaving] = useState(false)

  const handleStageDateChange = (stageId: string, field: 'startDate' | 'endDate', value: string) => {
    setStageDates(prev => ({ ...prev, [stageId]: { ...prev[stageId], [field]: value } }))
  }

  // 단계 일정 검증 — 시즌 기간 내, 시작<종료, 이전 단계보다 시작이 strict 이후 (같은 날 불허)
  const validateStages = (): string | null => {
    if (!stageEditable) return null
    let prevStart: string | null = null
    for (let i = 0; i < season.stages.length; i++) {
      const s = season.stages[i]
      const d = stageDates[s.id]
      if (!d?.startDate || !d?.endDate) return `${i + 1}번째 단계 날짜를 입력하세요`
      if (d.endDate < d.startDate) return `${i + 1}번째 단계: 종료일이 시작일보다 빠를 수 없습니다`
      if (d.startDate < form.startDate || d.endDate > form.endDate) {
        return `${i + 1}번째 단계는 시즌 기간 내여야 합니다`
      }
      if (prevStart && d.startDate <= prevStart) {
        return `${i + 1}번째 단계 시작일은 이전 단계 시작일보다 이후여야 합니다`
      }
      prevStart = d.startDate
    }
    return null
  }

  const handleSave = async () => {
    if (readOnly) return
    if (!form.name || !form.startDate || !form.endDate) {
      alert('필수 항목을 입력해 주세요.')
      return
    }
    if (form.endDate < form.startDate) {
      alert('종료일이 시작일보다 빠를 수 없습니다.')
      return
    }
    // 시즌 간 기간 겹침 금지 — 자기 자신 제외
    const overlap = allSeasons.find(s =>
      s.id !== season.id && form.startDate <= s.endDate && s.startDate <= form.endDate
    )
    if (overlap) {
      alert(`다른 시즌(${overlap.name}: ${overlap.startDate} ~ ${overlap.endDate})과 기간이 겹칩니다.`)
      return
    }
    const stageErr = validateStages()
    if (stageErr) { alert(stageErr); return }

    setSaving(true)
    try {
      await updateSeasonAction(season.id, {
        name: form.name,
        period: form.period,
        startDate: form.startDate,
        endDate: form.endDate,
      })
      // 단계 날짜는 변경된 것만 PATCH (준비중일 때만)
      if (stageEditable) {
        const changed = season.stages.filter(s => {
          const d = stageDates[s.id]
          return d && (d.startDate !== s.startDate || d.endDate !== s.endDate)
        })
        for (const s of changed) {
          const d = stageDates[s.id]
          await updateStageDates(Number(s.id), { startDate: d.startDate, endDate: d.endDate })
        }
        if (changed.length > 0) await loadSeasonDetail(season.id)
      }
      alert('저장되었습니다.')
      onBack()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      alert(err?.response?.data?.message ?? err?.message ?? '저장에 실패했습니다')
    } finally {
      setSaving(false)
    }
  }

  const canDelete = season.status === '준비중'
  const handleDelete = async () => {
    if (!canDelete) return
    if (!confirm(`"${season.name}" 시즌을 삭제하시겠습니까?`)) return
    try {
      await deleteSeasonAction(season.id)
      onBack()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '삭제에 실패했습니다')
    }
  }

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
            <p className="text-[13px] text-[#8a9490]">평가 시즌의 기본 정보를 관리합니다.</p>
          </div>
        </div>
        <span className={`text-[12px] px-3 py-1 rounded font-medium ${statusColor(season.status)}`}>
          {season.status}
        </span>
      </div>

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
          <span>완료된 시즌은 읽기 전용입니다.</span>
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
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              disabled={readOnly}
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-[12px] text-[#5a6b62] mb-1">평가주기</label>
            <select
              value={form.period}
              onChange={e => setForm({ ...form, period: e.target.value })}
              disabled={readOnly}
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] disabled:bg-gray-50 disabled:text-gray-500"
            >
              {SEASON_PERIOD_OPTIONS.map(p => (
                <option key={p} value={p}>{SEASON_PERIOD_LABEL[p]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] text-[#5a6b62] mb-1">상태</label>
            <input
              type="text"
              value={season.status}
              disabled
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-[12px] text-[#5a6b62] mb-1">시작일</label>
            <input
              type="date"
              value={form.startDate}
              onChange={e => setForm({ ...form, startDate: e.target.value })}
              disabled={readOnly}
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-[12px] text-[#5a6b62] mb-1">종료일</label>
            <input
              type="date"
              value={form.endDate}
              onChange={e => setForm({ ...form, endDate: e.target.value })}
              disabled={readOnly}
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* 단계별 일정 — 준비중만 편집 가능 */}
      <div className="bg-white border border-[#e0e5e3] rounded-lg overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-[#e0e5e3] bg-[#f8faf9]">
          <h3 className="text-[14px] font-semibold text-[#1a2b23]">단계별 일정</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {stageEditable
              ? '시즌 시작 전에는 단계 날짜를 자유롭게 조정할 수 있습니다.'
              : '시즌이 시작된 이후에는 조회만 가능합니다.'}
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
            {season.stages.map((stage, i) => {
              const d = stageDates[stage.id] ?? { startDate: stage.startDate, endDate: stage.endDate }
              // 이전 단계 시작일 + 1일 이후만 선택 가능 (같은 날 불허)
              const prevStage = i > 0 ? season.stages[i - 1] : null
              const prevStart = prevStage ? stageDates[prevStage.id]?.startDate : ''
              const startMin = prevStart ? addDaysISO(prevStart, 1) : form.startDate || undefined
              return (
                <tr key={stage.id} className="border-b border-[#f0f2f1]">
                  <td className="px-3 py-3 text-center text-[12px] text-gray-400">{i + 1}</td>
                  <td className="px-5 py-3 text-[13px] font-medium text-[#1a2b23]">{stageLabel(stage)}</td>
                  <td className="px-5 py-3 text-center text-[#5a6b62]">
                    {stageEditable ? (
                      <input
                        type="date"
                        value={d.startDate}
                        min={startMin}
                        max={form.endDate || undefined}
                        onChange={e => handleStageDateChange(stage.id, 'startDate', e.target.value)}
                        className="w-full border border-[#e0e5e3] rounded px-2 py-1 text-[12px]"
                      />
                    ) : (stage.startDate || '-')}
                  </td>
                  <td className="px-5 py-3 text-center text-[#5a6b62]">
                    {stageEditable ? (
                      <input
                        type="date"
                        value={d.endDate}
                        min={d.startDate || form.startDate || undefined}
                        max={form.endDate || undefined}
                        onChange={e => handleStageDateChange(stage.id, 'endDate', e.target.value)}
                        className="w-full border border-[#e0e5e3] rounded px-2 py-1 text-[12px]"
                      />
                    ) : (stage.endDate || '-')}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${statusColor(stage.status)}`}>
                      {stage.status}
                    </span>
                  </td>
                </tr>
              )
            })}
            {season.stages.length === 0 && (
              <tr><td colSpan={5} className="text-center py-6 text-[12px] text-gray-400">등록된 단계가 없습니다.</td></tr>
            )}
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
          title={canDelete ? '시즌 삭제' : '준비중 상태만 삭제 가능합니다'}
        >
          시즌 삭제
        </button>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="border border-[#e0e5e3] bg-white rounded-lg px-5 py-2.5 text-[13px] cursor-pointer hover:bg-[#f5f5f5]"
          >
            목록으로
          </button>
          <button
            onClick={handleSave}
            disabled={readOnly || saving}
            className="bg-[#1D9E75] text-white border-none rounded-lg px-5 py-2.5 text-[13px] font-medium cursor-pointer hover:bg-[#0F6E56] disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
