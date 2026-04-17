import { useState } from 'react'
import { defaultRules, computeGoalWeights } from '../design/evaluationRulesData'

type GoalType = 'KPI' | 'OKR'
type TaskGrade = '상' | '중' | '하'
type ApprovalStatus = '대기' | '승인' | '반려'

interface GoalItem {
  id: number
  title: string
  category: string
  goalType: GoalType
  grade: TaskGrade
  targetValue?: number
  targetUnit?: string
  approvalStatus: ApprovalStatus
  rejectReason?: string
}

interface TeamMemberGoal {
  id: number
  employeeName: string
  dept: string
  position: string
  submittedDate: string
  goals: GoalItem[]
}

const goalTypeColors: Record<GoalType, { bg: string; text: string }> = {
  KPI: { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]' },
  OKR: { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]' },
}

const gradeStyle: Record<TaskGrade, string> = {
  '상': 'bg-[#faf5ff] text-[#7c3aed] border-[#7c3aed]',
  '중': 'bg-[#eff6ff] text-[#3b82f6] border-[#3b82f6]',
  '하': 'bg-[#f5f5f5] text-[#8a9490] border-[#d0d8d4]',
}

const initialData: TeamMemberGoal[] = [
  {
    id: 1, employeeName: '김민수', dept: '개발팀', position: '선임', submittedDate: '2026-01-15',
    goals: [
      { id: 101, title: '신규 고객 유치', category: '업무성과', goalType: 'KPI', grade: '상', targetValue: 20, targetUnit: '건', approvalStatus: '대기' },
      { id: 102, title: 'API 응답시간 개선', category: '업무성과', goalType: 'KPI', grade: '상', targetValue: 30, targetUnit: '%', approvalStatus: '대기' },
      { id: 103, title: 'Kubernetes 자격증 취득', category: '역량개발', goalType: 'OKR', grade: '중', approvalStatus: '대기' },
      { id: 104, title: '코드 리뷰 참여율 100%', category: '조직기여', goalType: 'OKR', grade: '하', approvalStatus: '대기' },
    ],
  },
  {
    id: 2, employeeName: '이서연', dept: '개발팀', position: '책임', submittedDate: '2026-01-14',
    goals: [
      { id: 201, title: '시스템 아키텍처 개선', category: '업무성과', goalType: 'OKR', grade: '상', approvalStatus: '승인' },
      { id: 202, title: '팀 기술 교육 월 1회', category: '조직기여', goalType: 'KPI', grade: '중', targetValue: 12, targetUnit: '회', approvalStatus: '대기' },
      { id: 203, title: 'MSA 전환 프로젝트 리드', category: '업무성과', goalType: 'OKR', grade: '상', approvalStatus: '대기' },
    ],
  },
  {
    id: 3, employeeName: '박준호', dept: '개발팀', position: '사원', submittedDate: '2026-01-16',
    goals: [
      { id: 301, title: '버그 수정', category: '업무성과', goalType: 'KPI', grade: '상', targetValue: 10, targetUnit: '건/월', approvalStatus: '반려', rejectReason: '전부 "상"으로만 설정되었습니다. 중요도에 맞게 재분배 필요.' },
      { id: 302, title: 'React 학습', category: '역량개발', goalType: 'OKR', grade: '상', approvalStatus: '반려', rejectReason: '학습 목표는 보통 등급이 적절합니다. 조정 후 재제출.' },
      { id: 303, title: '문서 정리', category: '조직기여', goalType: 'OKR', grade: '상', approvalStatus: '반려', rejectReason: '지원 성격 업무이므로 "하"가 적절합니다.' },
    ],
  },
]

function deriveStatus(goals: GoalItem[]): ApprovalStatus {
  if (goals.some(g => g.approvalStatus === '대기')) return '대기'
  if (goals.every(g => g.approvalStatus === '승인')) return '승인'
  return '반려'
}

export default function GoalApprove() {
  const [data, setData] = useState<TeamMemberGoal[]>(initialData)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [rejectModal, setRejectModal] = useState<{ memberId: number; goalId: number; reason: string } | null>(null)

  const selected = data.find(d => d.id === selectedId)

  const totalPending = data.reduce((s, m) => s + m.goals.filter(g => g.approvalStatus === '대기').length, 0)
  const totalApproved = data.reduce((s, m) => s + m.goals.filter(g => g.approvalStatus === '승인').length, 0)
  const totalRejected = data.reduce((s, m) => s + m.goals.filter(g => g.approvalStatus === '반려').length, 0)

  const handleApprove = (memberId: number, goalId: number) => {
    setData(data.map(m =>
      m.id === memberId
        ? { ...m, goals: m.goals.map(g => g.id === goalId ? { ...g, approvalStatus: '승인' as ApprovalStatus, rejectReason: undefined } : g) }
        : m
    ))
  }

  const handleApproveAllPending = (memberId: number) => {
    setData(data.map(m =>
      m.id === memberId
        ? { ...m, goals: m.goals.map(g => g.approvalStatus === '대기' ? { ...g, approvalStatus: '승인' as ApprovalStatus, rejectReason: undefined } : g) }
        : m
    ))
  }

  const handleRejectConfirm = () => {
    if (!rejectModal || !rejectModal.reason.trim()) return
    setData(data.map(m =>
      m.id === rejectModal.memberId
        ? { ...m, goals: m.goals.map(g => g.id === rejectModal.goalId ? { ...g, approvalStatus: '반려' as ApprovalStatus, rejectReason: rejectModal.reason } : g) }
        : m
    ))
    setRejectModal(null)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(팀장) &gt; 목표 관리</div>

      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">팀원 목표 승인</h1>
        <p className="text-[13px] text-[#8a9490]">각 목표별로 개별 승인·반려합니다. 일괄 승인도 가능합니다.</p>
      </div>

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

      <div className="grid grid-cols-12 gap-6">
        {/* 팀원 목록 */}
        <div className="col-span-5">
          <div className="bg-white border border-[#e0e5e3] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e0e5e3] bg-[#f8faf9]">
              <h3 className="text-[13px] font-semibold text-[#1a2b23]">팀원 목록</h3>
            </div>
            <div className="divide-y divide-[#f0f2f1]">
              {data.map(item => {
                const pending = item.goals.filter(g => g.approvalStatus === '대기').length
                const approved = item.goals.filter(g => g.approvalStatus === '승인').length
                const rejected = item.goals.filter(g => g.approvalStatus === '반려').length
                const status = deriveStatus(item.goals)
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
                      {pending > 0 ? (
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
                    <div className="text-[10px] text-[#b0b8b4] mt-1">제출일: {item.submittedDate}</div>
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
                    {selected.dept} · {selected.position} · 목표 {selected.goals.length}건 · 제출일 {selected.submittedDate}
                  </div>
                </div>
                {selected.goals.some(g => g.approvalStatus === '대기') && (
                  <button
                    onClick={() => handleApproveAllPending(selected.id)}
                    className="bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2 text-[12px] font-medium cursor-pointer hover:bg-[#0F6E56] transition-colors"
                  >
                    대기 건 일괄 승인
                  </button>
                )}
              </div>

              {(() => {
                // 대기(재제출 포함) → 반려 → 승인 순으로 정렬: 재진입 시 대기가 반려 위에 쌓임
                const statusOrder: Record<ApprovalStatus, number> = { '대기': 0, '반려': 1, '승인': 2 }
                const sortedGoals = [...selected.goals].sort(
                  (a, b) => statusOrder[a.approvalStatus] - statusOrder[b.approvalStatus],
                )
                // 비중은 KPI만 대상 (OKR은 제외)
                const kpiGoals = sortedGoals.filter(g => g.goalType === 'KPI')
                const kpiWeights = computeGoalWeights(kpiGoals, defaultRules.taskGradeWeights)
                const weightByGoalId = new Map<number, number>()
                kpiGoals.forEach((g, idx) => weightByGoalId.set(g.id, kpiWeights[idx] ?? 0))
                return sortedGoals.map(goal => {
                  const isApproved = goal.approvalStatus === '승인'
                  const isRejected = goal.approvalStatus === '반려'
                  const isPending = goal.approvalStatus === '대기'
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
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${gradeStyle[goal.grade]}`}>
                            등급 {goal.grade}
                          </span>
                          {goal.goalType === 'KPI' && (
                            <span className="bg-[#eff6ff] text-[#3b82f6] px-2 py-0.5 rounded text-[11px] font-medium">
                              비중 {weightByGoalId.get(goal.id)?.toFixed(1) ?? 0}%
                            </span>
                          )}
                          <span className="text-[13px] font-medium text-[#1a2b23]">{goal.title}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          isApproved ? 'bg-[#eaf6f0] text-[#2e9e6e]' :
                          isRejected ? 'bg-[#fef2f2] text-[#ef4444]' :
                          'bg-[#fef3cd] text-[#f59e0b]'
                        }`}>{goal.approvalStatus}</span>
                      </div>

                      {goal.goalType === 'KPI' && goal.targetValue && (
                        <div className="text-[12px] text-[#8a9490] pl-1 mb-2">
                          목표치: <span className="text-[#3b82f6] font-medium">{goal.targetValue}{goal.targetUnit}</span>
                        </div>
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
                            className="border border-[#ef4444] text-[#ef4444] bg-white rounded-lg px-3 py-1.5 text-[12px] cursor-pointer hover:bg-[#fef2f2] transition-colors"
                          >
                            반려
                          </button>
                          <button
                            onClick={() => handleApprove(selected.id, goal.id)}
                            className="bg-[#1D9E75] text-white border-none rounded-lg px-3 py-1.5 text-[12px] font-medium cursor-pointer hover:bg-[#0F6E56] transition-colors"
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
                className="border border-[#e0e5e3] bg-white rounded-lg px-4 py-2 text-[13px] cursor-pointer hover:bg-[#f5f5f5]"
              >
                취소
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectModal.reason.trim()}
                className={`rounded-lg px-4 py-2 text-[13px] font-medium text-white border-none ${
                  rejectModal.reason.trim()
                    ? 'bg-[#ef4444] cursor-pointer hover:bg-[#dc2626]'
                    : 'bg-[#d0d8d4] cursor-not-allowed'
                }`}
              >
                반려 확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
