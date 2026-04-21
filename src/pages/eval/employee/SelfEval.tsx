import { useState, useMemo } from 'react'
import {
  kpiTemplates,
  directionLabel,
  calcAchievementRate,
} from './kpiTemplates'
import { defaultRules, computeGoalWeights } from '../design/evaluationRulesData'

type GoalType = 'KPI' | 'OKR'
type AchievementLevel = '우수' | '양호' | '보통' | '부족' | '미흡' | null

interface Goal {
  id: number
  goalType: GoalType
  category: string
  title: string
  grade: '상' | '중' | '하'
  description: string
  // KPI 전용
  kpiTemplateId?: number
  targetValue?: number
  targetUnit?: string
  actualValue?: number
  // OKR 전용
  achievementLevel: AchievementLevel
  // 공통
  achievementDetail: string
  evidence: string
  evidenceFiles: { name: string; size: number }[]
  approvalStatus: '대기' | '승인' | '반려' | null
  rejectReason?: string
}

const achievementOptions: { value: AchievementLevel; label: string; color: string; bg: string }[] = [
  { value: '우수', label: '우수', color: 'text-[#7c3aed]', bg: 'bg-[#faf5ff] border-[#7c3aed]' },
  { value: '양호', label: '양호', color: 'text-[#2e9e6e]', bg: 'bg-[#eaf6f0] border-[#2e9e6e]' },
  { value: '보통', label: '보통', color: 'text-[#3b82f6]', bg: 'bg-[#eff6ff] border-[#3b82f6]' },
  { value: '부족', label: '부족', color: 'text-[#f59e0b]', bg: 'bg-[#fef3cd] border-[#f59e0b]' },
  { value: '미흡', label: '미흡', color: 'text-[#ef4444]', bg: 'bg-[#fef2f2] border-[#ef4444]' },
]

const gradeColors: Record<string, { bg: string; text: string }> = {
  '상': { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]' },
  '중': { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]' },
  '하': { bg: 'bg-[#f8faf9]', text: 'text-[#8a9490]' },
}

const goalTypeColors: Record<GoalType, { bg: string; text: string }> = {
  KPI: { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]' },
  OKR: { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]' },
}

const mockGoals: Goal[] = [
  {
    id: 1, goalType: 'KPI', category: '업무성과', title: '신규 고객 유치 건수', grade: '상',
    description: '분기 내 신규 계약 체결 고객 수',
    kpiTemplateId: 1, targetValue: 20, targetUnit: '건', actualValue: undefined,
    achievementLevel: null, achievementDetail: '', evidence: '', evidenceFiles: [], approvalStatus: null,
  },
  {
    id: 2, goalType: 'KPI', category: '업무성과', title: '고객 만족도(CSAT)', grade: '중',
    description: '분기 CS 응대 만족도 평균 점수',
    kpiTemplateId: 4, targetValue: 90, targetUnit: '%', actualValue: 91,
    achievementLevel: null, achievementDetail: '고객 만족도 91.2% 달성. CS 응대 매뉴얼 개정.', evidence: 'CS 만족도 설문 결과',
    evidenceFiles: [{ name: 'CSAT_2026Q1_설문결과.xlsx', size: 142336 }], approvalStatus: '승인',
  },
  {
    id: 3, goalType: 'OKR', category: '역량개발', title: 'AWS 자격증 취득', grade: '하',
    description: '클라우드 역량 강화를 위한 자격증 취득',
    achievementLevel: '양호', achievementDetail: 'AWS SAA 자격증 취득 완료. 시험 점수 820점으로 합격.',
    evidence: 'AWS 자격증 합격 증명서',
    evidenceFiles: [{ name: 'AWS_SAA_certificate.pdf', size: 285114 }], approvalStatus: '승인',
  },
  {
    id: 4, goalType: 'OKR', category: '역량개발', title: '사내 세미나 발표 2회', grade: '하',
    description: '기술 지식 공유를 위한 사내 발표',
    achievementLevel: '보통', achievementDetail: '세미나 1회 진행 완료. 2차 세미나는 일정 조율 중.',
    evidence: '세미나 발표 자료', evidenceFiles: [], approvalStatus: '반려',
    rejectReason: '목표 대비 달성이 미완료 상태입니다. 2회 모두 완료 후 재제출 바랍니다.',
  },
  {
    id: 5, goalType: 'OKR', category: '조직기여', title: '신규 입사자 온보딩 지원', grade: '중',
    description: '신규 팀원 적응 지원 및 멘토링',
    achievementLevel: null, achievementDetail: '', evidence: '', evidenceFiles: [], approvalStatus: null,
  },
]

export default function SelfEval() {
  const [goals, setGoals] = useState<Goal[]>(mockGoals)

  const handleLevelChange = (id: number, level: AchievementLevel) => {
    setGoals(goals.map(g => g.id === id ? { ...g, achievementLevel: level } : g))
  }

  const handleTextChange = (id: number, field: 'achievementDetail' | 'evidence', value: string) => {
    setGoals(goals.map(g => g.id === id ? { ...g, [field]: value } : g))
  }

  const handleActualChange = (id: number, value: number) => {
    setGoals(goals.map(g => g.id === id ? { ...g, actualValue: value } : g))
  }

  const handleFileAdd = (id: number, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const added: { name: string; size: number }[] = []
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i]
      added.push({ name: f.name, size: f.size })
    }
    setGoals(goals.map(g => g.id === id ? { ...g, evidenceFiles: [...g.evidenceFiles, ...added] } : g))
  }

  const handleFileRemove = (id: number, idx: number) => {
    setGoals(goals.map(g => g.id === id ? { ...g, evidenceFiles: g.evidenceFiles.filter((_, i) => i !== idx) } : g))
  }

  // 파일 크기 표시
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // 비중·점수 모두 "승인된 KPI"만 모집단으로 사용
  // OKR / 대기 / 반려 목표는 점수 반영 대상 아님 → 카드 비중도 0%로 표시
  const scoringGoalIds = useMemo(
    () => new Set(
      goals.filter(g => g.goalType === 'KPI' && g.approvalStatus === '승인').map(g => g.id),
    ),
    [goals],
  )

  // 목표카드에 표시할 비중 — 승인된 KPI끼리만 합 100%로 정규화, 나머지는 0
  const weightById = useMemo(() => {
    const scoringGoals = goals.filter(g => scoringGoalIds.has(g.id))
    const scoringWeights = computeGoalWeights(scoringGoals, defaultRules.taskGradeWeights)
    const map = new Map<number, number>()
    scoringGoals.forEach((g, i) => map.set(g.id, scoringWeights[i]))
    return map
  }, [goals, scoringGoalIds])

  // 목표 카드 정렬 순서 - 미제출(null) -> 반려 -> 대기 -> 승인
  const sortedGoals = useMemo(() => {
    const rank: Record<string, number> = { '반려': 1, '대기': 2, '승인': 3 }
    return [...goals].sort((a, b) => {
      const aKey = a.approvalStatus === null ? 0 : (rank[a.approvalStatus] ?? 99)
      const bKey = b.approvalStatus === null ? 0 : (rank[b.approvalStatus] ?? 99)
      return aKey - bKey
    })
  }, [goals])

  const editableGoals = goals.filter(g => g.approvalStatus !== '승인')
  const isGoalFilled = (g: Goal) => {
    if (g.goalType === 'KPI') return g.actualValue !== undefined && g.achievementDetail.trim().length > 0
    return g.achievementLevel !== null && g.achievementDetail.trim().length > 0
  }
  const filledCount = goals.filter(isGoalFilled).length
  const allFilled = editableGoals.every(isGoalFilled)
  const approvedCount = goals.filter(g => g.approvalStatus === '승인').length

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(개인) &gt; 자기평가</div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">자기평가 입력 및 제출</h1>
          <p className="text-[13px] text-[#8a9490]">KPI는 실적 수치를 입력하면 달성률이 자동 계산되고, OKR은 달성도를 직접 선택합니다.</p>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-[#8a9490]">작성 현황</div>
          <div className="text-[20px] font-bold text-[#2e9e6e]">{filledCount}<span className="text-[14px] text-[#8a9490] font-normal"> / {goals.length}</span></div>
        </div>
      </div>

      {/* 평가 기간 정보 */}
      <div className="bg-[#f8faf9] border border-[#e0e5e3] rounded-lg p-4 mb-6 flex gap-8 text-[13px]">
        <div><span className="text-[#8a9490]">평가 주기:</span> <span className="font-medium text-[#1a2b23]">2026년 상반기</span></div>
        <div><span className="text-[#8a9490]">자기평가 기간:</span> <span className="font-medium text-[#1a2b23]">2026.07.01 ~ 2026.07.10</span></div>
        <div><span className="text-[#8a9490]">자기평가 제출 마감:</span> <span className="font-medium text-[#ef4444]">2026.07.10</span></div>
      </div>

      {/* 현황 요약 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-3 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">전체 업무</div>
          <div className="text-[20px] font-bold text-[#1a2b23]">{goals.length}건</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-3 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">작성 완료</div>
          <div className="text-[20px] font-bold text-[#3b82f6]">{filledCount}건</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-3 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">팀장 승인</div>
          <div className="text-[20px] font-bold text-[#2e9e6e]">{approvedCount}건</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-3 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">반려</div>
          <div className="text-[20px] font-bold text-[#ef4444]">{goals.filter(g => g.approvalStatus === '반려').length}건</div>
        </div>
      </div>

      {/* 목표별 자기평가 */}
      <div className="space-y-4">
        {sortedGoals.map((goal) => {
          const isApproved = goal.approvalStatus === '승인'
          const isRejected = goal.approvalStatus === '반려'
          const template = goal.kpiTemplateId !== undefined
            ? kpiTemplates.find(t => t.id === goal.kpiTemplateId)
            : undefined
          const rate = goal.goalType === 'KPI' && template && goal.targetValue !== undefined && goal.actualValue !== undefined
            ? calcAchievementRate(template.direction, goal.targetValue, goal.actualValue)
            : null
          const weight = weightById.get(goal.id) ?? 0

          return (
            <div key={goal.id} className={`bg-white border rounded-lg p-5 ${
              isApproved ? 'border-[#2e9e6e]' : isRejected ? 'border-[#fca5a5]' : 'border-[#e0e5e3]'
            }`}>
              {/* 목표 헤더 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`${goalTypeColors[goal.goalType].bg} ${goalTypeColors[goal.goalType].text} px-2 py-0.5 rounded text-[11px] font-medium`}>
                    {goal.goalType}
                  </span>
                  <span className="bg-[#eaf6f0] text-[#2e9e6e] px-2 py-0.5 rounded text-[11px]">{goal.category}</span>
                  <span className={`${gradeColors[goal.grade].bg} ${gradeColors[goal.grade].text} px-1.5 py-0.5 rounded text-[10px] font-medium`}>
                    업무등급 {goal.grade}
                  </span>
                  <span className="bg-[#eff6ff] text-[#3b82f6] px-1.5 py-0.5 rounded text-[10px] font-medium">
                    비중 {weight.toFixed(1)}%
                  </span>
                  <span className="font-medium text-[#1a2b23] text-[14px]">{goal.title}</span>
                </div>
                {goal.approvalStatus && (
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    isApproved ? 'bg-[#eaf6f0] text-[#2e9e6e]' :
                    isRejected ? 'bg-[#fef2f2] text-[#ef4444]' :
                    'bg-[#fef3cd] text-[#f59e0b]'
                  }`}>{goal.approvalStatus}</span>
                )}
              </div>

              <div className="text-[12px] text-[#8a9490] mb-4 pl-1">{goal.description}</div>

              {/* 반려 사유 */}
              {isRejected && goal.rejectReason && (
                <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-lg p-3 mb-4">
                  <div className="text-[11px] font-medium text-[#ef4444] mb-1">반려 사유</div>
                  <div className="text-[13px] text-[#7f1d1d]">{goal.rejectReason}</div>
                </div>
              )}

              {/* KPI: 실적 수치 입력 */}
              {goal.goalType === 'KPI' && (
                <div className="mb-4 bg-[#f8faf9] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[12px] font-medium text-[#5a6b62]">실적 입력</label>
                    {template && (
                      <div className="flex gap-1.5">
                        <span className="px-2 py-0.5 bg-white border border-[#d4ecdd] rounded text-[10px] text-[#1D9E75] font-medium">
                          방향 : {directionLabel[template.direction]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[#8a9490]">목표:</span>
                      <span className="text-[14px] font-semibold text-[#1a2b23]">{goal.targetValue}{goal.targetUnit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[#8a9490]">실적:</span>
                      <input
                        type="number"
                        value={goal.actualValue ?? ''}
                        onChange={e => !isApproved && handleActualChange(goal.id, Number(e.target.value))}
                        disabled={isApproved}
                        className={`w-24 border rounded-md px-2 py-1.5 text-[14px] font-semibold text-center ${
                          isApproved ? 'border-[#e0e5e3] bg-white text-[#5a6b62]' : 'border-[#e0e5e3] text-[#1a2b23] focus:border-[#3b82f6] focus:outline-none'
                        }`}
                        placeholder="0"
                      />
                      <span className="text-[12px] text-[#8a9490]">{goal.targetUnit}</span>
                    </div>
                    {rate !== null && (
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-[12px] text-[#8a9490]">달성률:</span>
                        <span className={`text-[16px] font-bold ${
                          rate >= 100 ? 'text-[#7c3aed]' : rate >= 80 ? 'text-[#2e9e6e]' : rate >= 60 ? 'text-[#f59e0b]' : 'text-[#ef4444]'
                        }`}>{rate}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* OKR: 달성도 선택 */}
              {goal.goalType === 'OKR' && (
                <div className="mb-3">
                  <label className="block text-[12px] font-medium text-[#5a6b62] mb-2">달성도 평가</label>
                  <div className="flex gap-2">
                    {achievementOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => !isApproved && handleLevelChange(goal.id, opt.value)}
                        disabled={isApproved}
                        className={`px-4 py-2 rounded-lg text-[12px] font-medium border cursor-pointer transition-colors ${
                          goal.achievementLevel === opt.value
                            ? `${opt.bg} ${opt.color}`
                            : isApproved
                            ? 'bg-[#f5f5f5] text-[#d0d8d4] border-[#e0e5e3] cursor-not-allowed'
                            : 'bg-white text-[#8a9490] border-[#e0e5e3] hover:border-[#8a9490]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 달성 내용 */}
              <div className="mb-3">
                <label className="block text-[12px] font-medium text-[#5a6b62] mb-1">달성 내용</label>
                <textarea
                  value={goal.achievementDetail}
                  onChange={e => handleTextChange(goal.id, 'achievementDetail', e.target.value)}
                  disabled={isApproved}
                  className={`w-full border rounded-md px-3 py-2 text-[13px] resize-none focus:outline-none ${
                    isApproved ? 'border-[#e0e5e3] bg-[#f8faf9] text-[#5a6b62]' : 'border-[#e0e5e3] focus:border-[#2e9e6e]'
                  }`}
                  rows={3}
                  placeholder="해당 업무에 대해 어떤 성과를 이뤘는지 구체적으로 작성하세요"
                />
              </div>

              {/* 실적 근거 */}
              <div>
                <label className="block text-[12px] font-medium text-[#5a6b62] mb-1">실적 근거 <span className="text-[#8a9490] font-normal">(선택)</span></label>
                <textarea
                  value={goal.evidence}
                  onChange={e => handleTextChange(goal.id, 'evidence', e.target.value)}
                  disabled={isApproved}
                  className={`w-full border rounded-md px-3 py-2 text-[13px] resize-none focus:outline-none ${
                    isApproved ? 'border-[#e0e5e3] bg-[#f8faf9] text-[#5a6b62]' : 'border-[#e0e5e3] focus:border-[#2e9e6e]'
                  }`}
                  rows={2}
                  placeholder="달성 내용을 뒷받침하는 근거 (예: 리포트, 보고서, 자격증 등)"
                />

                {/* 파일 첨부 */}
                <div className="mt-2">
                  <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-[12px] ${
                    isApproved ? 'border-[#e0e5e3] bg-[#f8faf9] text-[#8a9490] cursor-not-allowed' : 'border-[#e0e5e3] bg-white text-[#5a6b62] cursor-pointer hover:bg-[#f5f5f5]'
                  }`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                    </svg>
                    파일 첨부
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      disabled={isApproved}
                      onChange={e => { handleFileAdd(goal.id, e.target.files); e.target.value = '' }}
                    />
                  </label>

                  {goal.evidenceFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {goal.evidenceFiles.map((f, i) => (
                        <div key={i} className="flex items-center justify-between bg-[#f8faf9] border border-[#e0e5e3] rounded-md px-2.5 py-1.5 text-[12px]">
                          <div className="flex items-center gap-2 min-w-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5a6b62" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <span className="truncate text-[#1a2b23]">{f.name}</span>
                            <span className="text-[#8a9490] shrink-0">{formatSize(f.size)}</span>
                          </div>
                          {!isApproved && (
                            <button
                              onClick={() => handleFileRemove(goal.id, i)}
                              className="text-[#8a9490] hover:text-[#ef4444] ml-2 shrink-0 border-none bg-transparent cursor-pointer"
                              aria-label="파일 삭제"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end mt-6 gap-3">
        <button className="border border-[#e0e5e3] bg-white rounded-lg px-5 py-2.5 text-[13px] cursor-pointer hover:bg-[#f5f5f5]">임시 저장</button>
        <button
          className={`rounded-lg px-5 py-2.5 text-[13px] font-medium border-none cursor-pointer transition-colors ${
            allFilled ? 'bg-[#1D9E75] text-white hover:bg-[#0F6E56]' : 'bg-[#d0d8d4] text-white cursor-not-allowed'
          }`}
          disabled={!allFilled}
        >
          자기평가 제출
        </button>
      </div>
    </div>
  )
}
