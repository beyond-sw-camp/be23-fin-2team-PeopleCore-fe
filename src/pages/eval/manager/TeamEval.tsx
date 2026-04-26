import { useState, useRef, useEffect } from 'react'
import {
  fetchTeamMembers,
  fetchAchievement,
  fetchManagerEvaluation,
  saveManagerEvalDraft,
  submitManagerEval,
  type TeamMemberEvalListDto,
  type ManagerEvalAchievementDto,
} from '../../../api/managerEvaluation'
import { fetchRules, toFrontendRules } from '../../../api/evalRules'
import { defaultRules } from '../design/evaluationRulesData'
import { calcAchievementRate } from '../employee/kpiTemplates'
import { useStageReadOnly } from '../../../components/eval/StageGate'

type EvalGrade = string | null

interface EvalForm {
  grade: EvalGrade
  comment: string
  feedback: string
}

// ③ 등급체계에 color 매칭이 없을 때 쓰는 기본 팔레트 (라벨 index 순환)
const fallbackGradeHex = ['#7c3aed', '#2e9e6e', '#3b82f6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#6366f1']

const levelBackendToKo: Record<string, string> = {
  EXCELLENT: '우수',
  GOOD: '양호',
  AVERAGE: '보통',
  POOR: '부족',
  INADEQUATE: '미흡',
}

const rateColor = (r: number) => r >= 100 ? 'text-[#2e9e6e]' : r >= 80 ? 'text-[#f59e0b]' : 'text-[#ef4444]'

const emptyForm: EvalForm = { grade: null, comment: '', feedback: '' }

const summary = (m: TeamMemberEvalListDto) => {
  const parts: string[] = [`KPI ${m.kpiCount} · OKR ${m.okrCount}`]
  if (!m.selfEvalSubmitted) parts.push('자기평가 미제출')
  if (m.managerEvalSubmitted) parts.push('평가 완료')
  return parts.join(' · ')
}

export default function TeamEval() {
  const [members, setMembers] = useState<TeamMemberEvalListDto[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [evalForm, setEvalForm] = useState<EvalForm>(emptyForm)
  const [achievement, setAchievement] = useState<ManagerEvalAchievementDto | null>(null)
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)

  // 팀장이 부여 가능한 라벨 목록 — ⑥ rawScoreTable 기준, 색은 ③ gradeRules 의 hex 매칭
  const [gradeOptions, setGradeOptions] = useState<{ label: string; colorHex: string }[]>(() =>
    defaultRules.rawScoreTable.map((r, i) => ({
      label: r.label,
      colorHex: defaultRules.grades.find(g => g.label === r.label)?.color
        ?? fallbackGradeHex[i % fallbackGradeHex.length],
    }))
  )

  const [showAchievement, setShowAchievement] = useState(false)
  const [panelPos, setPanelPos] = useState({ x: 240, y: 240 })
  const [kpiExpanded, setKpiExpanded] = useState(false)
  const [okrExpanded, setOkrExpanded] = useState(false)
  const KPI_COLLAPSED = 3
  const OKR_COLLAPSED = 3
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null)

  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const readOnly = useStageReadOnly()

  // 팀원 목록 로드
  useEffect(() => {
    fetchTeamMembers()
      .then(list => {
        setMembers(list)
        if (list.length > 0 && selectedId === null) setSelectedId(list[0].empId)
      })
      .catch(e => {
        console.error('[TeamEval] team-members failed', e)
        setError(e?.response?.data?.message || '팀원 목록을 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 회사 평가 규칙 로드 → ⑥ rawScoreTable 에서 등급 버튼 라벨 구성
  useEffect(() => {
    fetchRules()
      .then(dto => {
        if (!dto) return
        const rules = toFrontendRules(dto)
        if (!rules.rawScoreTable.length) return
        setGradeOptions(
          rules.rawScoreTable.map((r, i) => ({
            label: r.label,
            colorHex: rules.grades.find(g => g.label === r.label)?.color
              ?? fallbackGradeHex[i % fallbackGradeHex.length],
          }))
        )
      })
      .catch(e => console.error('[TeamEval] rules failed', e))
  }, [])

  // 선택 변경 시: 기존 평가 + 달성도 같이 로드
  useEffect(() => {
    if (selectedId === null) return
    setLoadingDetail(true)
    setError(null)
    setInfoMessage(null)
    setAchievement(null)
    Promise.all([fetchManagerEvaluation(selectedId), fetchAchievement(selectedId)])
      .then(([detail, ach]) => {
        setEvalForm({
          grade: (detail.grade as EvalGrade) ?? null,
          comment: detail.comment ?? '',
          feedback: detail.feedback ?? '',
        })
        setSubmittedAt(detail.submittedAt)
        setAchievement(ach)
      })
      .catch(e => {
        console.error('[TeamEval] detail/achievement failed', e)
        setError(e?.response?.data?.message || '팀원 상세를 불러오지 못했습니다.')
        setEvalForm(emptyForm)
        setSubmittedAt(null)
      })
      .finally(() => setLoadingDetail(false))
  }, [selectedId])

  // 드래그 이동 (플로팅 패널)
  const handleDragStart = (e: React.MouseEvent) => {
    dragRef.current = { offsetX: e.clientX - panelPos.x, offsetY: e.clientY - panelPos.y }
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      setPanelPos({
        x: Math.max(0, e.clientX - dragRef.current.offsetX),
        y: Math.max(0, e.clientY - dragRef.current.offsetY),
      })
    }
    const onUp = () => { dragRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const selected = members.find(m => m.empId === selectedId) ?? null

  const handleSelect = (id: number) => {
    setSelectedId(id)
  }

  // 자기평가 미제출이면 평가 입력 자체 차단 (백엔드도 동일 정책)
  // — readOnly (단계 마감) 인 경우에도 입력 차단
  const canInput = selected?.selfEvalSubmitted === true && !readOnly
  const isFormComplete = canInput && evalForm.grade !== null && evalForm.comment.trim() && evalForm.feedback.trim()

  const handleDraft = async () => {
    if (readOnly) return
    if (!selected) return
    setSaving(true)
    setError(null)
    setInfoMessage(null)
    try {
      await saveManagerEvalDraft(selected.empId, {
        grade: evalForm.grade,
        comment: evalForm.comment,
        feedback: evalForm.feedback,
      })
      setInfoMessage('임시저장 되었습니다.')
    } catch (e: any) {
      console.error('[TeamEval] draft failed', e)
      setError(e?.response?.data?.message || '임시저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (readOnly) return
    if (!selected || !isFormComplete) return
    setSaving(true)
    setError(null)
    setInfoMessage(null)
    try {
      await submitManagerEval(selected.empId, {
        grade: evalForm.grade,
        comment: evalForm.comment,
        feedback: evalForm.feedback,
      })
      // 상태 갱신: 이 팀원의 managerEvalSubmitted=true, submittedAt 반영
      setMembers(prev => prev.map(m =>
        m.empId === selected.empId ? { ...m, managerEvalSubmitted: true } : m
      ))
      // 제출 직후 submittedAt 조회 재확인
      const detail = await fetchManagerEvaluation(selected.empId)
      setSubmittedAt(detail.submittedAt)
      setInfoMessage('평가가 제출되었습니다.')
    } catch (e: any) {
      console.error('[TeamEval] submit failed', e)
      setError(e?.response?.data?.message || '제출에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-sm text-gray-400">
        <i className="fas fa-spinner fa-spin mr-2" /> 불러오는 중...
      </div>
    )
  }

  // 플로팅 패널: 달성률 계산 (KPI 만)
  const kpiRows = achievement?.kpiList.map(k => ({
    ...k,
    rate: k.targetValue !== null && k.actualValue !== null
      ? calcAchievementRate(k.direction, k.targetValue, k.actualValue)
      : null,
  })) ?? []
  const okrRows = achievement?.okrList ?? []

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(평가자) &gt; 팀원 평가</div>

      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">상위자 평가 및 피드백 작성</h1>
        <p className="text-[13px] text-[#8a9490]">팀원에 대한 종합 평가 등급(S~D)을 부여하고 코멘트와 피드백을 작성합니다.</p>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 mb-4 bg-red-50 border border-red-200 text-[13px] text-red-700">
          <i className="fas fa-triangle-exclamation mr-2" />{error}
        </div>
      )}
      {infoMessage && (
        <div className="rounded-lg px-4 py-3 mb-4 bg-emerald-50 border border-emerald-200 text-[13px] text-emerald-700">
          <i className="fas fa-circle-check mr-2" />{infoMessage}
        </div>
      )}

      {members.length === 0 ? (
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-12 text-center">
          <div className="text-[#d0d8d4] text-[40px] mb-3">📝</div>
          <div className="text-[14px] text-[#8a9490]">평가 대상 팀원이 없습니다.</div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* 팀원 목록 */}
          <div className="col-span-4">
            <div className="bg-white border border-[#e0e5e3] rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-[#e0e5e3] bg-[#f8faf9]">
                <h3 className="text-[13px] font-semibold text-[#1a2b23]">팀원 목록</h3>
              </div>
              <div className="divide-y divide-[#f0f2f1]">
                {members.map(m => (
                  <div
                    key={m.empId}
                    onClick={() => handleSelect(m.empId)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedId === m.empId ? 'bg-[#eaf6f0]' : 'hover:bg-[#fafbfa]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <div className="text-[13px] font-medium text-[#1a2b23]">{m.name}</div>
                        <div className="text-[11px] text-[#8a9490]">{m.position}</div>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        m.managerEvalSubmitted ? 'bg-[#eaf6f0] text-[#2e9e6e]' : 'bg-[#f5f5f5] text-[#8a9490]'
                      }`}>
                        {m.managerEvalSubmitted ? '평가 완료' : '미평가'}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#b0b8b4]">{summary(m)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 평가 입력 */}
          <div className="col-span-8">
            {selected ? (
              loadingDetail ? (
                <div className="bg-white border border-[#e0e5e3] rounded-lg p-12 text-center text-[14px] text-[#8a9490]">
                  <i className="fas fa-spinner fa-spin mr-2" /> 팀원 상세 로딩 중...
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 팀원 정보 */}
                  <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="text-[16px] font-semibold text-[#1a2b23]">{selected.name}</div>
                      <div className="text-[12px] text-[#8a9490]">{selected.dept} · {selected.position}</div>
                      <div className="text-[11px] text-[#b0b8b4] mt-1">{summary(selected)}</div>
                      {submittedAt && (
                        <div className="text-[11px] text-[#2e9e6e] mt-1">
                          제출일시: {submittedAt.replace('T', ' ').slice(0, 16)}
                        </div>
                      )}
                    </div>
                    {achievement && (kpiRows.length + okrRows.length > 0) && (
                      <button
                        onClick={() => setShowAchievement(true)}
                        className="border border-[#1D9E75] text-[#1D9E75] bg-white rounded-lg px-4 py-2 text-[12px] font-medium cursor-pointer hover:bg-[#eaf6f0] transition-colors whitespace-nowrap"
                      >
                        달성도 보기
                      </button>
                    )}
                  </div>

                  {!selected.selfEvalSubmitted && (
                    <div className="rounded-lg px-4 py-3 bg-yellow-50 border border-yellow-200 text-[12px] text-yellow-800">
                      <i className="fas fa-triangle-exclamation mr-2" />
                      이 팀원은 자기평가를 아직 제출하지 않았습니다. 자기평가 제출 전까지는 평가 입력이 불가합니다.
                    </div>
                  )}

                  {/* 평가 등급 */}
                  <div className={`bg-white border border-[#e0e5e3] rounded-lg p-5 ${canInput ? '' : 'opacity-60'}`}>
                    <h3 className="text-[14px] font-semibold text-[#1a2b23] mb-4">상위자 평가</h3>

                    <div className="mb-5">
                      <label className="block text-[12px] font-medium text-[#5a6b62] mb-2">평가 등급</label>
                      <div className="flex gap-2 flex-wrap">
                        {gradeOptions.map(opt => {
                          const selected = evalForm.grade === opt.label
                          const baseCls = 'min-w-14 h-11 px-3 rounded-lg text-[14px] font-bold border transition-colors'
                          if (!canInput) {
                            return (
                              <button
                                key={opt.label}
                                disabled
                                className={`${baseCls} bg-[#f5f5f5] text-[#d0d8d4] border-[#e0e5e3] cursor-not-allowed`}
                              >
                                {opt.label}
                              </button>
                            )
                          }
                          return (
                            <button
                              key={opt.label}
                              onClick={() => setEvalForm({ ...evalForm, grade: opt.label })}
                              className={`${baseCls} cursor-pointer ${
                                selected
                                  ? 'border-current'
                                  : 'bg-white text-[#d0d8d4] border-[#e0e5e3] hover:border-[#8a9490]'
                              }`}
                              style={selected ? { backgroundColor: `${opt.colorHex}1A`, color: opt.colorHex } : undefined}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-[12px] font-medium text-[#5a6b62] mb-1">평가 코멘트</label>
                      <textarea
                        value={evalForm.comment}
                        onChange={e => setEvalForm({ ...evalForm, comment: e.target.value })}
                        disabled={!canInput}
                        className={`w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] resize-none focus:outline-none ${
                          !canInput ? 'bg-[#f5f5f5] text-[#8a9490] cursor-not-allowed' : 'focus:border-[#2e9e6e]'
                        }`}
                        rows={3}
                        placeholder={canInput ? '평가 등급에 대한 근거를 작성하세요 (잘한 점, 개선점 등)' : '자기평가 제출 후 입력 가능합니다'}
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] font-medium text-[#5a6b62] mb-1">피드백</label>
                      <textarea
                        value={evalForm.feedback}
                        onChange={e => setEvalForm({ ...evalForm, feedback: e.target.value })}
                        disabled={!canInput}
                        className={`w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] resize-none focus:outline-none ${
                          !canInput ? 'bg-[#f5f5f5] text-[#8a9490] cursor-not-allowed' : 'focus:border-[#2e9e6e]'
                        }`}
                        rows={3}
                        placeholder={canInput ? '팀원에게 전달할 피드백을 작성하세요 (성장 방향, 기대 사항 등)' : '자기평가 제출 후 입력 가능합니다'}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleDraft}
                      disabled={saving || !canInput}
                      className="border border-[#e0e5e3] bg-white rounded-lg px-5 py-2.5 text-[13px] cursor-pointer hover:bg-[#f5f5f5] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? '처리 중...' : '임시 저장'}
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!isFormComplete || saving}
                      className={`rounded-lg px-5 py-2.5 text-[13px] font-medium border-none cursor-pointer transition-colors ${
                        isFormComplete && !saving ? 'bg-[#1D9E75] text-white hover:bg-[#0F6E56]' : 'bg-[#d0d8d4] text-white cursor-not-allowed'
                      }`}
                    >
                      {saving ? '처리 중...' : '평가 제출'}
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="bg-white border border-[#e0e5e3] rounded-lg p-12 text-center">
                <div className="text-[#d0d8d4] text-[40px] mb-3">📝</div>
                <div className="text-[14px] text-[#8a9490]">좌측에서 평가할 팀원을 선택하세요</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 달성도 플로팅 메모 패널 (드래그 가능) */}
      {showAchievement && selected && achievement && (
        <div
          className="fixed z-40 w-[480px] max-w-[90vw] shadow-2xl border border-[#e0e5e3] bg-white rounded-lg flex flex-col overflow-hidden"
          style={{ left: panelPos.x, top: panelPos.y, height: 'min(500px, 80vh)' }}
        >
          <div
            onMouseDown={handleDragStart}
            className="px-5 py-3 border-b border-[#e0e5e3] bg-[#f8faf9] flex items-center justify-between cursor-move select-none"
          >
            <div className="flex items-center gap-2">
              <span className="text-[#b0b8b4] text-[14px]">⋮⋮</span>
              <div>
                <h3 className="text-[13px] font-semibold text-[#1a2b23]">{selected.name} — 승인된 달성도</h3>
                <p className="text-[10px] text-[#8a9490] mt-0.5">헤더를 잡고 드래그하여 이동</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#eaf6f0] text-[#2e9e6e] font-medium">검토 승인</span>
              <button
                onClick={() => setShowAchievement(false)}
                className="text-[#8a9490] bg-transparent border-none cursor-pointer text-[18px] hover:text-[#1a2b23] leading-none"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {/* KPI */}
            {kpiRows.length > 0 && (() => {
              const visible = kpiExpanded ? kpiRows : kpiRows.slice(0, KPI_COLLAPSED)
              return (
                <div className="px-5 pt-4 pb-2">
                  <div className="text-[12px] font-semibold text-[#3b82f6] mb-2 flex items-center gap-1.5">
                    <span className="bg-[#eff6ff] text-[#3b82f6] px-2 py-0.5 rounded text-[11px]">KPI</span>
                    업무 달성도 <span className="text-[10px] text-[#8a9490] font-normal">({kpiRows.length})</span>
                  </div>
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="border-b border-[#e0e5e3]">
                        <th className="text-left px-3 py-2 font-medium text-[#5a6b62] text-[12px]">구분</th>
                        <th className="text-left px-3 py-2 font-medium text-[#5a6b62] text-[12px]">목표</th>
                        <th className="text-center px-3 py-2 font-medium text-[#5a6b62] text-[12px]">목표치</th>
                        <th className="text-center px-3 py-2 font-medium text-[#5a6b62] text-[12px]">실적</th>
                        <th className="text-center px-3 py-2 font-medium text-[#5a6b62] text-[12px]">달성률</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((g, i) => (
                        <tr key={i} className="border-b border-[#f0f2f1]">
                          <td className="px-3 py-2"><span className="bg-[#eaf6f0] text-[#2e9e6e] px-2 py-0.5 rounded text-[11px]">{g.category}</span></td>
                          <td className="px-3 py-2 text-[#1a2b23]">{g.title}</td>
                          <td className="px-3 py-2 text-center text-[#5a6b62]">{g.targetValue ?? '-'}{g.targetUnit ?? ''}</td>
                          <td className="px-3 py-2 text-center text-[#1a2b23] font-medium">{g.actualValue ?? '—'}{g.actualValue !== null ? (g.targetUnit ?? '') : ''}</td>
                          <td className="px-3 py-2 text-center">
                            {g.rate !== null ? (
                              <span className={`font-bold ${rateColor(g.rate)}`}>{g.rate}%</span>
                            ) : (
                              <span className="text-[#b0b8b4]">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {kpiRows.length > KPI_COLLAPSED && (
                    <button
                      onClick={() => setKpiExpanded(v => !v)}
                      className="w-full mt-2 py-1.5 text-[11px] text-[#3b82f6] bg-[#eff6ff] hover:bg-[#dbeafe] rounded border-none cursor-pointer font-medium"
                    >
                      {kpiExpanded ? '접기' : `더보기 (+${kpiRows.length - KPI_COLLAPSED})`}
                    </button>
                  )}
                </div>
              )
            })()}

            {/* OKR */}
            {okrRows.length > 0 && (() => {
              const visible = okrExpanded ? okrRows : okrRows.slice(0, OKR_COLLAPSED)
              return (
                <div className="px-5 pt-3 pb-4 border-t border-[#f0f2f1]">
                  <div className="text-[12px] font-semibold text-[#7c3aed] mb-2 flex items-center gap-1.5">
                    <span className="bg-[#faf5ff] text-[#7c3aed] px-2 py-0.5 rounded text-[11px]">OKR</span>
                    참고 목표 <span className="text-[10px] text-[#8a9490] font-normal">({okrRows.length})</span>
                    <span className="text-[10px] text-[#8a9490] font-normal">(평가 점수 미반영)</span>
                  </div>
                  <div className="space-y-1.5">
                    {visible.map((g, i) => {
                      const levelKo = g.selfLevel ? levelBackendToKo[g.selfLevel] ?? g.selfLevel : null
                      return (
                        <div key={i} className="flex items-center gap-3 bg-[#faf5ff]/50 rounded-lg px-3 py-2">
                          <span className="bg-[#faf5ff] text-[#7c3aed] px-2 py-0.5 rounded text-[11px]">{g.category}</span>
                          <span className="text-[13px] text-[#1a2b23] flex-1">{g.title}</span>
                          {levelKo && (
                            <span className="text-[11px] text-[#5a6b62] bg-white border border-[#e0e5e3] px-2 py-0.5 rounded">자기평가: {levelKo}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {okrRows.length > OKR_COLLAPSED && (
                    <button
                      onClick={() => setOkrExpanded(v => !v)}
                      className="w-full mt-2 py-1.5 text-[11px] text-[#7c3aed] bg-[#faf5ff] hover:bg-[#ede9fe] rounded border-none cursor-pointer font-medium"
                    >
                      {okrExpanded ? '접기' : `더보기 (+${okrRows.length - OKR_COLLAPSED})`}
                    </button>
                  )}
                </div>
              )
            })()}

            {kpiRows.length === 0 && okrRows.length === 0 && (
              <div className="p-6 text-center text-[12px] text-[#8a9490]">승인된 목표가 없습니다.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
