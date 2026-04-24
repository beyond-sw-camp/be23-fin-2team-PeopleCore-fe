import { useState, useEffect } from 'react'
import {
  fetchTeamGoals,
  approveGoal as apiApproveGoal,
  rejectGoal as apiRejectGoal,
  approveAllPending as apiApproveAllPending,
  type TeamMemberGoalResponse,
  type GoalResponse,
  type GoalType,
  type TaskGrade,
  type GoalApprovalStatus,
} from '../../../api/goal'

type GradeKo = '상' | '중' | '하'
type ApprovalKo = '대기' | '승인' | '반려'

const gradeBackendToKo: Record<TaskGrade, GradeKo> = {
  HIGH: '상',
  MID: '중',
  LOW: '하',
}

const approvalToKo = (s: GoalApprovalStatus): ApprovalKo => {
  if (s === 'APPROVED') return '승인'
  if (s === 'REJECTED') return '반려'
  return '대기'   // DRAFT / PENDING 모두 "대기" 표시 (팀 화면에는 DRAFT 거의 안 뜸)
}

const goalTypeColors: Record<GoalType, { bg: string; text: string }> = {
  KPI: { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]' },
  OKR: { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]' },
}

const gradeStyle: Record<GradeKo, string> = {
  '상': 'bg-[#faf5ff] text-[#7c3aed] border-[#7c3aed]',
  '중': 'bg-[#eff6ff] text-[#3b82f6] border-[#3b82f6]',
  '하': 'bg-[#f5f5f5] text-[#8a9490] border-[#d0d8d4]',
}

const isPendingStatus = (s: GoalApprovalStatus) => s === 'PENDING'

export default function GoalApprove() {
  const [data, setData] = useState<TeamMemberGoalResponse[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [rejectModal, setRejectModal] = useState<{ memberId: number; goalId: number; reason: string } | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await fetchTeamGoals()
      setData(list)
      // 첫 로드 시 첫 팀원 자동 선택
      if (list.length > 0 && selectedId === null) {
        setSelectedId(list[0].id)
      }
    } catch (e: any) {
      console.error('[GoalApprove] load failed', e)
      setError(e?.response?.data?.message || '팀원 목표를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selected = data.find(d => d.id === selectedId)

  // 단건 결과 반영 헬퍼 — 해당 memberId 의 해당 goalId 를 updated 로 교체
  const applyGoalUpdate = (memberId: number, updated: GoalResponse) => {
    setData(prev => prev.map(m =>
      m.id === memberId
        ? { ...m, goals: m.goals.map(g => g.id === updated.id ? updated : g) }
        : m
    ))
  }

  const handleApprove = async (memberId: number, goalId: number) => {
    setSaving(true)
    setError(null)
    try {
      const updated = await apiApproveGoal(goalId)
      applyGoalUpdate(memberId, updated)
    } catch (e: any) {
      console.error('[GoalApprove] approve failed', e)
      setError(e?.response?.data?.message || '승인에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleRejectConfirm = async () => {
    if (!rejectModal || !rejectModal.reason.trim()) return
    const { memberId, goalId, reason } = rejectModal
    setSaving(true)
    setError(null)
    try {
      const updated = await apiRejectGoal(goalId, reason)
      applyGoalUpdate(memberId, updated)
      setRejectModal(null)
    } catch (e: any) {
      console.error('[GoalApprove] reject failed', e)
      setError(e?.response?.data?.message || '반려에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleApproveAllPending = async (memberId: number) => {
    setSaving(true)
    setError(null)
    try {
      const updatedGoals = await apiApproveAllPending(memberId)
      const updatedIds = new Set(updatedGoals.map(g => g.id))
      setData(prev => prev.map(m =>
        m.id === memberId
          ? {
              ...m,
              goals: m.goals.map(g =>
                updatedIds.has(g.id) ? updatedGoals.find(u => u.id === g.id)! : g
              ),
            }
          : m
      ))
    } catch (e: any) {
      console.error('[GoalApprove] approve-all failed', e)
      setError(e?.response?.data?.message || '일괄 승인에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // ─── 집계 ───
  const totalPending = data.reduce((s, m) => s + m.goals.filter(g => isPendingStatus(g.approval)).length, 0)
  const totalApproved = data.reduce((s, m) => s + m.goals.filter(g => g.approval === 'APPROVED').length, 0)
  const totalRejected = data.reduce((s, m) => s + m.goals.filter(g => g.approval === 'REJECTED').length, 0)

  const fmtDate = (iso: string | null | undefined) => {
    if (!iso) return '-'
    return iso.replace('T', ' ').slice(0, 10)   // YYYY-MM-DD
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
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(평가자) &gt; 목표 승인</div>

      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">팀원 목표 승인</h1>
        <p className="text-[13px] text-[#8a9490]">각 목표별로 개별 승인·반려합니다. 일괄 승인도 가능합니다.</p>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 mb-4 bg-red-50 border border-red-200 text-[13px] text-red-700">
          <i className="fas fa-triangle-exclamation mr-2" />{error}
        </div>
      )}

      {/* 현황 요약 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">전체 팀원</div>
          <div className="text-[24px] font-bold text-[#1a2b23]">{data.length}명</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">승인 대기</div>
          <div className="text-[24px] font-bold text-[#f59e0b]">{totalPending}건</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">승인</div>
          <div className="text-[24px] font-bold text-[#2e9e6e]">{totalApproved}건</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">반려</div>
          <div className="text-[24px] font-bold text-[#ef4444]">{totalRejected}건</div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-12 text-center">
          <div className="text-[#d0d8d4] text-[40px] mb-3">📋</div>
          <div className="text-[14px] text-[#8a9490]">승인 대상 팀원이 없습니다.</div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* 팀원 목록 */}
          <div className="col-span-5">
            <div className="bg-white border border-[#e0e5e3] rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-[#e0e5e3] bg-[#f8faf9]">
                <h3 className="text-[13px] font-semibold text-[#1a2b23]">팀원 목록</h3>
              </div>
              <div className="divide-y divide-[#f0f2f1]">
                {data.map(item => {
                  const pending = item.goals.filter(g => isPendingStatus(g.approval)).length
                  const approved = item.goals.filter(g => g.approval === 'APPROVED').length
                  const rejected = item.goals.filter(g => g.approval === 'REJECTED').length
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedId === item.id ? 'bg-[#eaf6f0]' : 'hover:bg-[#fafbfa]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <div className="text-[13px] font-medium text-[#1a2b23]">{item.employeeName}</div>
                          <div className="text-[11px] text-[#8a9490]">{item.position}</div>
                        </div>
                        {item.submittedDate === null ? (
                          <span className="bg-[#f5f5f5] text-[#8a9490] text-[10px] px-1.5 py-0.5 rounded font-medium">미제출</span>
                        ) : pending > 0 ? (
                          <span className="bg-[#fef3cd] text-[#f59e0b] text-[10px] px-1.5 py-0.5 rounded font-medium">검토중</span>
                        ) : (
                          <span className="bg-[#eaf6f0] text-[#2e9e6e] text-[10px] px-1.5 py-0.5 rounded font-medium">검토완료</span>
                        )}
                      </div>
                      <div className="flex gap-3 text-[10px] text-[#8a9490]">
                        <span>승인 <span className="text-[#2e9e6e] font-medium">{approved}</span></span>
                        <span>반려 <span className="text-[#ef4444] font-medium">{rejected}</span></span>
                        <span>대기 <span className="text-[#f59e0b] font-medium">{pending}</span></span>
                      </div>
                      <div className="text-[10px] text-[#b0b8b4] mt-1">제출일: {fmtDate(item.submittedDate)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 상세 보기 */}
          <div className="col-span-7">
            {selected ? (
              <div className="space-y-4">
                <div className="bg-white border border-[#e0e5e3] rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[16px] font-semibold text-[#1a2b23]">{selected.employeeName}의 목표</div>
                    <div className="text-[12px] text-[#8a9490]">
                      {selected.dept} · {selected.position} · 목표 {selected.goals.length}건 · 제출일 {fmtDate(selected.submittedDate)}
                    </div>
                  </div>
                  {selected.goals.some(g => isPendingStatus(g.approval)) && (
                    <button
                      onClick={() => handleApproveAllPending(selected.id)}
                      disabled={saving}
                      className="bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2 text-[12px] font-medium cursor-pointer hover:bg-[#0F6E56] transition-colors disabled:opacity-50"
                    >
                      {saving ? '처리 중...' : '대기 건 일괄 승인'}
                    </button>
                  )}
                </div>

                {(() => {
                  const statusOrder: Record<ApprovalKo, number> = { '대기': 0, '반려': 1, '승인': 2 }
                  const sortedGoals = [...selected.goals].sort(
                    (a, b) => statusOrder[approvalToKo(a.approval)] - statusOrder[approvalToKo(b.approval)],
                  )
                  return sortedGoals.map(goal => {
                    const ko = approvalToKo(goal.approval)
                    const isApproved = ko === '승인'
                    const isRejected = ko === '반려'
                    const isPending = ko === '대기'
                    const gradeKo = gradeBackendToKo[goal.grade]
                    return (
                      <div key={goal.id} className={`bg-white border rounded-lg p-4 ${
                        isApproved ? 'border-[#2e9e6e]' : isRejected ? 'border-[#fca5a5]' : 'border-[#e0e5e3]'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`${goalTypeColors[goal.goalType].bg} ${goalTypeColors[goal.goalType].text} px-2 py-0.5 rounded text-[11px] font-medium`}>
                              {goal.goalType}
                            </span>
                            <span className="bg-[#eaf6f0] text-[#2e9e6e] px-2 py-0.5 rounded text-[11px]">{goal.category}</span>
                            <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${gradeStyle[gradeKo]}`}>
                              등급 {gradeKo}
                            </span>
                            {goal.ratio !== null && (
                              <span className="bg-[#eff6ff] text-[#3b82f6] px-2 py-0.5 rounded text-[11px] font-medium">
                                비중 {goal.ratio.toFixed(1)}%
                              </span>
                            )}
                            <span className="text-[13px] font-medium text-[#1a2b23]">{goal.title}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            isApproved ? 'bg-[#eaf6f0] text-[#2e9e6e]' :
                            isRejected ? 'bg-[#fef2f2] text-[#ef4444]' :
                            'bg-[#fef3cd] text-[#f59e0b]'
                          }`}>{ko}</span>
                        </div>

                        {goal.goalType === 'KPI' && goal.targetValue !== null && (
                          <div className="text-[12px] text-[#8a9490] pl-1 mb-2">
                            목표치: <span className="text-[#3b82f6] font-medium">{goal.targetValue}{goal.targetUnit ?? ''}</span>
                          </div>
                        )}

                        {goal.description && (
                          <div className="text-[12px] text-[#5a6b62] pl-1 mb-2">{goal.description}</div>
                        )}

                        {isRejected && goal.rejectReason && (
                          <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-lg p-2.5 mb-2">
                            <div className="text-[11px] font-medium text-[#ef4444] mb-0.5">반려 사유</div>
                            <div className="text-[12px] text-[#7f1d1d]">{goal.rejectReason}</div>
                          </div>
                        )}

                        {isPending && (
                          <div className="flex gap-2 justify-end pt-2 border-t border-[#f0f2f1]">
                            <button
                              onClick={() => setRejectModal({ memberId: selected.id, goalId: goal.id, reason: '' })}
                              disabled={saving}
                              className="border border-[#ef4444] text-[#ef4444] bg-white rounded-lg px-3 py-1.5 text-[12px] cursor-pointer hover:bg-[#fef2f2] transition-colors disabled:opacity-50"
                            >
                              반려
                            </button>
                            <button
                              onClick={() => handleApprove(selected.id, goal.id)}
                              disabled={saving}
                              className="bg-[#1D9E75] text-white border-none rounded-lg px-3 py-1.5 text-[12px] font-medium cursor-pointer hover:bg-[#0F6E56] transition-colors disabled:opacity-50"
                            >
                              승인
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })
                })()}
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
      {rejectModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[480px]">
            <h3 className="text-[16px] font-semibold text-[#1a2b23] mb-2">목표 반려</h3>
            <p className="text-[13px] text-[#8a9490] mb-4">반려 사유를 작성하면 사원이 수정 후 재제출할 수 있습니다.</p>
            <textarea
              value={rejectModal.reason}
              onChange={e => setRejectModal({ ...rejectModal, reason: e.target.value })}
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] resize-none mb-4 focus:border-[#ef4444] focus:outline-none"
              rows={4}
              placeholder="반려 사유를 입력하세요"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectModal(null)}
                disabled={saving}
                className="border border-[#e0e5e3] bg-white rounded-lg px-4 py-2 text-[13px] cursor-pointer hover:bg-[#f5f5f5] disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectModal.reason.trim() || saving}
                className={`rounded-lg px-4 py-2 text-[13px] font-medium text-white border-none ${
                  rejectModal.reason.trim() && !saving
                    ? 'bg-[#ef4444] cursor-pointer hover:bg-[#dc2626]'
                    : 'bg-[#d0d8d4] cursor-not-allowed'
                }`}
              >
                {saving ? '처리 중...' : '반려 확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
