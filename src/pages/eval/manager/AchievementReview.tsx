import { useState, useEffect } from 'react'
import { directionLabel, calcAchievementRate } from '../employee/kpiTemplates'
import {
  fetchTeamSelfEvaluations,
  approveSelfEvaluation,
  rejectSelfEvaluation,
  approveAllPendingSelfEvaluations,
  downloadSelfEvalFile,
  type TeamMemberSelfEvaluationResponse,
  type SelfEvaluationResponse,
  type AchievementLevel,
  type SelfEvalApprovalStatus,
} from '../../../api/selfEvaluation'
import { fetchAllKpiTemplates, type KpiTemplateResponse } from '../../../api/kpiTemplate'
import type { GoalType } from '../../../api/goal'
import { useStageReadOnly } from '../../../components/eval/StageGate'

type LevelKo = '우수' | '양호' | '보통' | '부족' | '미흡'

const levelBackendToKo: Record<AchievementLevel, LevelKo> = {
  EXCELLENT: '우수',
  GOOD: '양호',
  AVERAGE: '보통',
  POOR: '부족',
  INADEQUATE: '미흡',
}

const approvalToKo = (s: SelfEvalApprovalStatus): '대기' | '승인' | '반려' | '미제출' => {
  if (s === 'APPROVED') return '승인'
  if (s === 'REJECTED') return '반려'
  if (s === 'PENDING') return '대기'
  return '미제출'
}

const achievementColors: Record<LevelKo, { bg: string; text: string; border: string }> = {
  '우수': { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]', border: 'border-[#7c3aed]' },
  '양호': { bg: 'bg-[#eaf6f0]', text: 'text-[#2e9e6e]', border: 'border-[#2e9e6e]' },
  '보통': { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]', border: 'border-[#3b82f6]' },
  '부족': { bg: 'bg-[#fef3cd]', text: 'text-[#f59e0b]', border: 'border-[#f59e0b]' },
  '미흡': { bg: 'bg-[#fef2f2]', text: 'text-[#ef4444]', border: 'border-[#ef4444]' },
}

const goalTypeColors: Record<GoalType, { bg: string; text: string }> = {
  KPI: { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]' },
  OKR: { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]' },
}

const rateColor = (rate: number) => {
  if (rate >= 100) return 'text-[#7c3aed]'
  if (rate >= 80) return 'text-[#2e9e6e]'
  if (rate >= 60) return 'text-[#f59e0b]'
  return 'text-[#ef4444]'
}

const isPendingStatus = (s: SelfEvalApprovalStatus) => s === 'PENDING' || s === 'DRAFT'

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AchievementReview() {
  const [members, setMembers] = useState<TeamMemberSelfEvaluationResponse[]>([])
  const [templates, setTemplates] = useState<KpiTemplateResponse[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [rejectModal, setRejectModal] = useState<{ goalId: number; reason: string } | null>(null)
  const [approveAllModal, setApproveAllModal] = useState<{ memberId: number } | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const readOnly = useStageReadOnly()

  useEffect(() => {
    Promise.all([fetchTeamSelfEvaluations(), fetchAllKpiTemplates()])
      .then(([list, tpls]) => {
        setMembers(list)
        setTemplates(tpls)
        if (list.length > 0 && selectedId === null) setSelectedId(list[0].id)
      })
      .catch(e => {
        console.error('[AchievementReview] load failed', e)
        setError(e?.response?.data?.message || '팀원 자기평가를 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selected = members.find(m => m.id === selectedId)

  const findTemplate = (kpiTemplateId: number | null): KpiTemplateResponse | undefined =>
    kpiTemplateId ? templates.find(t => t.kpiId === kpiTemplateId) : undefined

  // 단건 응답으로 해당 goalId 교체
  const applyUpdate = (memberId: number, updated: SelfEvaluationResponse) => {
    setMembers(prev => prev.map(m =>
      m.id === memberId
        ? { ...m, evaluations: m.evaluations.map(ev => ev.goalId === updated.goalId ? updated : ev) }
        : m
    ))
  }

  const handleApprove = async (memberId: number, goalId: number) => {
    if (readOnly) return
    setSaving(true)
    setError(null)
    try {
      const updated = await approveSelfEvaluation(goalId)
      applyUpdate(memberId, updated)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error('[AchievementReview] approve failed', e)
      setError(e?.response?.data?.message || '승인에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleRejectConfirm = async (memberId: number) => {
    if (readOnly) return
    if (!rejectModal || !rejectModal.reason.trim()) return
    const { goalId, reason } = rejectModal
    setSaving(true)
    setError(null)
    try {
      const updated = await rejectSelfEvaluation(goalId, reason)
      applyUpdate(memberId, updated)
      setRejectModal(null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error('[AchievementReview] reject failed', e)
      setError(e?.response?.data?.message || '반려에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleApproveAll = async (memberId: number) => {
    if (readOnly) return
    setSaving(true)
    setError(null)
    try {
      const updated = await approveAllPendingSelfEvaluations(memberId)
      const map = new Map(updated.map(u => [u.goalId, u]))
      setMembers(prev => prev.map(m =>
        m.id === memberId
          ? { ...m, evaluations: m.evaluations.map(ev => map.get(ev.goalId) ?? ev) }
          : m
      ))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error('[AchievementReview] approve-all failed', e)
      setError(e?.response?.data?.message || '일괄 승인에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async (goalId: number, fileId: number, filename: string) => {
    setSaving(true)
    setError(null)
    try {
      await downloadSelfEvalFile(goalId, fileId, filename)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error('[AchievementReview] download failed', e)
      setError(e?.response?.data?.message || '파일 다운로드에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // 집계 - 전체 팀원 기준
  const totalPending = members.reduce((s, m) => s + m.evaluations.filter(e => isPendingStatus(e.approval)).length, 0)
  const totalRejected = members.reduce((s, m) => s + m.evaluations.filter(e => e.approval === 'REJECTED').length, 0)
  const submittedMembers = members.filter(m => m.submittedDate !== null).length

  const fmtDate = (iso: string | null | undefined) => {
    if (!iso) return '-'
    return iso.replace('T', ' ').slice(0, 10)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-sm text-gray-400">
        <i className="fas fa-spinner fa-spin mr-2" /> 불러오는 중...
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(평가자) &gt; 팀원 달성도 검토</div>

      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">팀원 달성도 검토</h1>
        <p className="text-[13px] text-[#8a9490]">사원이 제출한 KPI 달성률과 OKR 달성도를 검토하고 승인 또는 반려합니다.</p>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 mb-4 bg-red-50 border border-red-200 text-[13px] text-red-700">
          <i className="fas fa-triangle-exclamation mr-2" />{error}
        </div>
      )}

      {/* 현황 요약 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-3 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">전체 팀원</div>
          <div className="text-[20px] font-bold text-[#1a2b23]">{members.length}명</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-3 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">제출 완료</div>
          <div className="text-[20px] font-bold text-[#2e9e6e]">{submittedMembers}명</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-3 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">승인 대기</div>
          <div className="text-[20px] font-bold text-[#f59e0b]">{totalPending}건</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-3 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">반려</div>
          <div className="text-[20px] font-bold text-[#ef4444]">{totalRejected}건</div>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-12 text-center">
          <div className="text-[#d0d8d4] text-[40px] mb-3">📋</div>
          <div className="text-[14px] text-[#8a9490]">검토 대상 팀원이 없습니다.</div>
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
                {members.map(m => {
                  const pending = m.evaluations.filter(e => isPendingStatus(e.approval)).length
                  const approved = m.evaluations.filter(e => e.approval === 'APPROVED').length
                  const rejected = m.evaluations.filter(e => e.approval === 'REJECTED').length
                  const isSubmitted = m.submittedDate !== null

                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedId(m.id)}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedId === m.id ? 'bg-[#eaf6f0]' : 'hover:bg-[#fafbfa]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <div className="text-[13px] font-medium text-[#1a2b23]">{m.employeeName}</div>
                          <div className="text-[11px] text-[#8a9490]">{m.position}</div>
                        </div>
                        {!isSubmitted ? (
                          <span className="bg-[#f5f5f5] text-[#8a9490] text-[10px] px-1.5 py-0.5 rounded">미제출</span>
                        ) : pending > 0 ? (
                          <span className="bg-[#fef3cd] text-[#f59e0b] text-[10px] px-1.5 py-0.5 rounded font-medium">{pending}건 대기</span>
                        ) : (
                          <span className="bg-[#eaf6f0] text-[#2e9e6e] text-[10px] px-1.5 py-0.5 rounded font-medium">검토 완료</span>
                        )}
                      </div>
                      <div className="flex gap-3 text-[10px] text-[#8a9490]">
                        <span>승인 <span className="text-[#2e9e6e] font-medium">{approved}</span></span>
                        <span>반려 <span className="text-[#ef4444] font-medium">{rejected}</span></span>
                        <span>대기 <span className="text-[#f59e0b] font-medium">{pending}</span></span>
                      </div>
                      {isSubmitted && (
                        <div className="text-[10px] text-[#b0b8b4] mt-1">제출일: {fmtDate(m.submittedDate)}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 달성도 검토 */}
          <div className="col-span-8">
            {selected ? (
              <div className="space-y-4">
                <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[16px] font-semibold text-[#1a2b23]">{selected.employeeName}</div>
                    <div className="text-[12px] text-[#8a9490]">
                      {selected.dept} · {selected.position} · 업무 {selected.evaluations.length}건
                      <span className="ml-2">
                        (KPI <span className="text-[#3b82f6] font-medium">{selected.evaluations.filter(e => e.goalType === 'KPI').length}</span>
                        · OKR <span className="text-[#7c3aed] font-medium">{selected.evaluations.filter(e => e.goalType === 'OKR').length}</span>)
                      </span>
                    </div>
                  </div>
                  {selected.submittedDate && selected.evaluations.some(e => isPendingStatus(e.approval)) && (
                    <button
                      onClick={() => { if (readOnly) return; setApproveAllModal({ memberId: selected.id }) }}
                      disabled={saving || readOnly}
                      className="bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2 text-[12px] font-medium cursor-pointer hover:bg-[#0F6E56] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? '처리 중...' : '대기 건 일괄 승인'}
                    </button>
                  )}
                </div>

                {!selected.submittedDate ? (
                  <div className="bg-white border border-[#e0e5e3] rounded-lg p-12 text-center">
                    <div className="text-[#d0d8d4] text-[32px] mb-3">📭</div>
                    <div className="text-[14px] text-[#8a9490]">아직 자기평가를 제출하지 않았습니다</div>
                  </div>
                ) : (
                  selected.evaluations.map((ev) => {
                    const ko = approvalToKo(ev.approval)
                    const isApproved = ko === '승인'
                    const isRejected = ko === '반려'
                    const isPending = ko === '대기'
                    const selfLevelKo = ev.achievementLevel ? levelBackendToKo[ev.achievementLevel] : null
                    const weight = ev.weight ?? 0
                    const tpl = findTemplate(ev.kpiTemplateId)
                    const rate = ev.goalType === 'KPI' && tpl && ev.targetValue !== null && ev.actualValue !== null
                      ? calcAchievementRate(tpl.direction, ev.targetValue, ev.actualValue)
                      : null

                    return (
                      <div key={ev.goalId} className={`bg-white border rounded-lg p-5 ${
                        isApproved ? 'border-[#2e9e6e]' :
                        isRejected ? 'border-[#fca5a5]' :
                        'border-[#e0e5e3]'
                      }`}>
                        {/* 헤더 */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`${goalTypeColors[ev.goalType].bg} ${goalTypeColors[ev.goalType].text} px-2 py-0.5 rounded text-[11px] font-medium`}>
                              {ev.goalType}
                            </span>
                            <span className="bg-[#eaf6f0] text-[#2e9e6e] px-2 py-0.5 rounded text-[11px]">{ev.category}</span>
                            {weight > 0 && (
                              <span className="bg-[#eff6ff] text-[#3b82f6] px-1.5 py-0.5 rounded text-[10px] font-medium">
                                가중치 {weight}%
                              </span>
                            )}
                            <span className="text-[13px] font-medium text-[#1a2b23]">{ev.title}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            isApproved ? 'bg-[#eaf6f0] text-[#2e9e6e]' :
                            isRejected ? 'bg-[#fef2f2] text-[#ef4444]' :
                            isPending ? 'bg-[#fef3cd] text-[#f59e0b]' :
                            'bg-[#f5f5f5] text-[#8a9490]'
                          }`}>{ko}</span>
                        </div>

                        {/* KPI 달성률 */}
                        {ev.goalType === 'KPI' && (
                          <div className="mb-3 bg-[#f8faf9] rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-[11px] text-[#8a9490]">KPI 실적</div>
                              {tpl && (
                                <div className="flex gap-1.5">
                                  <span className="px-2 py-0.5 bg-white border border-[#d4ecdd] rounded text-[10px] text-[#1D9E75] font-medium">
                                    방향 : {directionLabel[tpl.direction]}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-[12px]">
                                <span className="text-[#8a9490]">목표: </span>
                                <span className="font-medium text-[#1a2b23]">{ev.targetValue ?? '-'}{ev.targetUnit ?? ''}</span>
                              </div>
                              <div className="text-[12px]">
                                <span className="text-[#8a9490]">실적: </span>
                                <span className="font-medium text-[#1a2b23]">{ev.actualValue ?? '—'}{ev.actualValue !== null ? (ev.targetUnit ?? '') : ''}</span>
                              </div>
                              {rate !== null && (
                                <div className="text-[12px]">
                                  <span className="text-[#8a9490]">달성률: </span>
                                  <span className={`font-bold text-[16px] ${rateColor(rate)}`}>{rate}%</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* OKR 달성도 */}
                        {ev.goalType === 'OKR' && selfLevelKo && (
                          <div className="mb-3">
                            <div className="text-[11px] text-[#8a9490] mb-1">사원 자체 달성도</div>
                            <span className={`px-3 py-1.5 rounded-lg text-[13px] font-medium border ${
                              achievementColors[selfLevelKo].bg} ${achievementColors[selfLevelKo].text} ${achievementColors[selfLevelKo].border
                            }`}>
                              {selfLevelKo}
                            </span>
                          </div>
                        )}

                        {/* 달성 내용 */}
                        {ev.achievementDetail && (
                          <div className="mb-3">
                            <div className="text-[11px] font-medium text-[#5a6b62] mb-1">달성 내용</div>
                            <div className="text-[13px] text-[#3a4b42] bg-[#f8faf9] rounded-lg p-3">{ev.achievementDetail}</div>
                          </div>
                        )}

                        {ev.evidence && (
                          <div className="mb-3">
                            <div className="text-[11px] font-medium text-[#5a6b62] mb-1">실적 근거</div>
                            <div className="text-[12px] text-[#8a9490] bg-[#f8faf9] rounded-lg p-2">{ev.evidence}</div>
                          </div>
                        )}

                        {ev.files.length > 0 && (
                          <div className="mb-3">
                            <div className="text-[11px] font-medium text-[#5a6b62] mb-1">첨부 파일</div>
                            <div className="space-y-1">
                              {ev.files.map(f => (
                                <button
                                  key={f.fileId}
                                  onClick={() => handleDownload(ev.goalId, f.fileId, f.originalFileName)}
                                  disabled={saving}
                                  className="w-full flex items-center justify-between bg-[#f8faf9] border border-[#e0e5e3] hover:bg-[#eaf6f0] hover:border-[#1D9E75] rounded-md px-2.5 py-1.5 text-[12px] cursor-pointer transition-colors disabled:opacity-50"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                      <polyline points="7 10 12 15 17 10" />
                                      <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    <span className="truncate text-[#1a2b23]">{f.originalFileName}</span>
                                    <span className="text-[#8a9490] shrink-0">{formatSize(f.fileSize)}</span>
                                  </div>
                                  <span className="text-[10px] text-[#1D9E75] shrink-0">다운로드</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {isRejected && ev.rejectReason && (
                          <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-lg p-3 mb-3">
                            <div className="text-[11px] font-medium text-[#ef4444] mb-1">반려 사유</div>
                            <div className="text-[13px] text-[#7f1d1d]">{ev.rejectReason}</div>
                          </div>
                        )}

                        {isPending && (
                          <div className="flex gap-2 justify-end pt-3 border-t border-[#f0f2f1]">
                            <button
                              onClick={() => { if (readOnly) return; setRejectModal({ goalId: ev.goalId, reason: '' }) }}
                              disabled={saving || readOnly}
                              className="border border-[#ef4444] text-[#ef4444] bg-white rounded-lg px-4 py-2 text-[12px] cursor-pointer hover:bg-[#fef2f2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              반려
                            </button>
                            <button
                              onClick={() => handleApprove(selected.id, ev.goalId)}
                              disabled={saving || readOnly}
                              className="bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2 text-[12px] font-medium cursor-pointer hover:bg-[#0F6E56] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              승인
                            </button>
                          </div>
                        )}

                        {isApproved && (
                          <div className="text-[12px] text-[#2e9e6e] text-right pt-2 border-t border-[#eaf6f0]">승인 완료</div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            ) : (
              <div className="bg-white border border-[#e0e5e3] rounded-lg p-12 text-center">
                <div className="text-[#d0d8d4] text-[40px] mb-3">📋</div>
                <div className="text-[14px] text-[#8a9490]">좌측에서 팀원을 선택하세요</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 반려 모달 */}
      {rejectModal && selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[480px]">
            <h3 className="text-[16px] font-semibold text-[#1a2b23] mb-2">달성도 반려</h3>
            <p className="text-[13px] text-[#8a9490] mb-4">반려 사유를 작성하면 사원이 수정 후 재제출할 수 있습니다.</p>
            <div className="relative mb-4">
              <textarea
                value={rejectModal.reason}
                onChange={e => setRejectModal({ ...rejectModal, reason: e.target.value })}
                maxLength={1000}
                className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 pb-6 text-[13px] resize-none focus:border-[#ef4444] focus:outline-none"
                rows={4}
                placeholder="반려 사유를 입력하세요"
                autoFocus
              />
              <span className="absolute bottom-2 right-3 text-[11px] text-[#8a9490] pointer-events-none">
                {rejectModal.reason.length}/1000
              </span>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectModal(null)}
                disabled={saving}
                className="border border-[#e0e5e3] bg-white rounded-lg px-4 py-2 text-[13px] cursor-pointer hover:bg-[#f5f5f5] disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={() => handleRejectConfirm(selected.id)}
                disabled={!rejectModal.reason.trim() || saving}
                className={`rounded-lg px-4 py-2 text-[13px] font-medium border-none cursor-pointer transition-colors ${
                  rejectModal.reason.trim() && !saving ? 'bg-[#ef4444] text-white hover:bg-[#dc2626]' : 'bg-[#d0d8d4] text-white cursor-not-allowed'
                }`}
              >
                {saving ? '처리 중...' : '반려 확인'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일괄 승인 확인 모달 */}
      {approveAllModal && (() => {
        const member = members.find(m => m.id === approveAllModal.memberId)
        const pendingCount = member?.evaluations.filter(e => isPendingStatus(e.approval)).length ?? 0
        return (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-[420px]">
              <h3 className="text-[16px] font-semibold text-[#1a2b23] mb-2">대기 건 일괄 승인</h3>
              <p className="text-[13px] text-[#8a9490] mb-5">
                {member?.employeeName ? <><b>{member.employeeName}</b> 의 </> : ''}
                대기 중인 자기평가 <b>{pendingCount}건</b>을 모두 승인합니다. 승인 후에는 평가 등급 산정에 반영됩니다.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setApproveAllModal(null)}
                  disabled={saving}
                  className="border border-[#e0e5e3] bg-white rounded-lg px-4 py-2 text-[13px] cursor-pointer hover:bg-[#f5f5f5] disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={async () => {
                    const memberId = approveAllModal.memberId
                    setApproveAllModal(null)
                    await handleApproveAll(memberId)
                  }}
                  disabled={saving}
                  className="bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer hover:bg-[#0F6E56] transition-colors disabled:opacity-50"
                >
                  {saving ? '처리 중...' : '승인 확인'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
