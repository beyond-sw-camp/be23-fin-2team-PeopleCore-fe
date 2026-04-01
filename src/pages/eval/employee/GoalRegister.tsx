import { useState } from 'react'

type GoalType = 'KPI' | 'OKR'

interface Goal {
  id: number
  goalType: GoalType
  category: string
  title: string
  description: string
  // KPI 전용
  targetValue?: number
  targetUnit?: string
  // 공통
  status: '작성중' | '제출완료' | '승인' | '반려'
}

const mockGoals: Goal[] = [
  { id: 1, goalType: 'KPI', category: '업무성과', title: '신규 고객 유치', description: '분기별 신규 고객 유치를 통한 매출 확대', targetValue: 20, targetUnit: '건', status: '승인' },
  { id: 2, goalType: 'KPI', category: '업무성과', title: '고객 만족도 유지', description: 'CS 응대 품질 개선 및 고객 만족도 향상', targetValue: 90, targetUnit: '%', status: '승인' },
  { id: 3, goalType: 'OKR', category: '역량개발', title: 'AWS 자격증 취득', description: '클라우드 역량 강화를 위한 자격증 취득', status: '작성중' },
  { id: 4, goalType: 'OKR', category: '조직기여', title: '신규 입사자 온보딩 지원', description: '신규 팀원 적응 지원 및 멘토링', status: '제출완료' },
]

const goalTypeColors: Record<GoalType, { bg: string; text: string }> = {
  KPI: { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]' },
  OKR: { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]' },
}

export default function GoalRegister() {
  const [goals, setGoals] = useState<Goal[]>(mockGoals)
  const [newGoal, setNewGoal] = useState<{
    goalType: GoalType; category: string; title: string; description: string;
    targetValue: string; targetUnit: string
  }>({ goalType: 'KPI', category: '업무성과', title: '', description: '', targetValue: '', targetUnit: '건' })
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const handleEdit = (goal: Goal) => {
    setEditingId(goal.id)
    setNewGoal({
      goalType: goal.goalType,
      category: goal.category,
      title: goal.title,
      description: goal.description,
      targetValue: goal.targetValue?.toString() ?? '',
      targetUnit: goal.targetUnit ?? '건',
    })
    setShowForm(true)
  }

  const handleAdd = () => {
    if (!newGoal.title) return
    const existingGoal = editingId !== null ? goals.find(g => g.id === editingId) : null
    const goal: Goal = {
      id: editingId ?? Date.now(),
      goalType: newGoal.goalType,
      category: newGoal.category,
      title: newGoal.title,
      description: newGoal.description,
      status: existingGoal?.status ?? '작성중',
    }
    if (newGoal.goalType === 'KPI') {
      goal.targetValue = Number(newGoal.targetValue) || 0
      goal.targetUnit = newGoal.targetUnit
    }
    if (editingId !== null) {
      setGoals(goals.map(g => g.id === editingId ? goal : g))
      setEditingId(null)
    } else {
      setGoals([...goals, goal])
    }
    setNewGoal({ goalType: 'KPI', category: '업무성과', title: '', description: '', targetValue: '', targetUnit: '건' })
    setShowForm(false)
  }

  const handleDelete = (id: number) => {
    setGoals(goals.filter(g => g.id !== id))
  }

  const allSubmittable = goals.length > 0 && goals.every(g => g.title.trim())
  const kpiCount = goals.filter(g => g.goalType === 'KPI').length
  const okrCount = goals.filter(g => g.goalType === 'OKR').length

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(개인) &gt; 목표 등록</div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">목표 등록/수정</h1>
          <p className="text-[13px] text-[#8a9490]">본인의 평가 목표를 등록·수정합니다. KPI(정량)와 OKR(정성) 유형을 선택하여 등록하세요.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2.5 text-[13px] font-medium cursor-pointer hover:bg-[#0F6E56] transition-colors"
        >
          + 목표 추가
        </button>
      </div>

      {/* 현황 */}
      <div className="bg-[#f8faf9] border border-[#e0e5e3] rounded-lg p-4 mb-6 flex items-center gap-6 text-[13px]">
        <div>전체 <span className="font-bold text-[#1a2b23]">{goals.length}</span>건</div>
        <div>KPI <span className="font-bold text-[#3b82f6]">{kpiCount}</span></div>
        <div>OKR <span className="font-bold text-[#7c3aed]">{okrCount}</span></div>
        <div className="border-l border-[#e0e5e3] pl-6">승인 <span className="font-bold text-[#2e9e6e]">{goals.filter(g => g.status === '승인').length}</span></div>
        <div>작성중 <span className="font-bold text-[#8a9490]">{goals.filter(g => g.status === '작성중').length}</span></div>
      </div>

      {/* 목표 추가 폼 */}
      {showForm && (
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-5 mb-6">
          <h3 className="text-[14px] font-semibold text-[#1a2b23] mb-4">{editingId !== null ? '목표 수정' : '새 목표 추가'}</h3>

          {/* 유형 선택 */}
          <div className="mb-4">
            <label className="block text-[12px] text-[#5a6b62] mb-2">목표 유형</label>
            <div className="flex gap-3">
              {(['KPI', 'OKR'] as GoalType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setNewGoal({ ...newGoal, goalType: t })}
                  className={`px-5 py-2.5 rounded-lg text-[13px] font-medium border cursor-pointer transition-colors ${
                    newGoal.goalType === t
                      ? t === 'KPI' ? 'bg-[#eff6ff] text-[#3b82f6] border-[#3b82f6]' : 'bg-[#faf5ff] text-[#7c3aed] border-[#7c3aed]'
                      : 'bg-white text-[#8a9490] border-[#e0e5e3] hover:border-[#8a9490]'
                  }`}
                >
                  {t === 'KPI' ? 'KPI (정량)' : 'OKR (정성)'}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[12px] text-[#5a6b62] mb-1">구분</label>
            <select
              value={newGoal.category}
              onChange={e => setNewGoal({ ...newGoal, category: e.target.value })}
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]"
            >
              <option>업무성과</option>
              <option>역량개발</option>
              <option>조직기여</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-[12px] text-[#5a6b62] mb-1">목표명</label>
            <input
              value={newGoal.title}
              onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]"
              placeholder="목표를 입력하세요"
            />
          </div>
          <div className="mb-4">
            <label className="block text-[12px] text-[#5a6b62] mb-1">상세 설명</label>
            <textarea
              value={newGoal.description}
              onChange={e => setNewGoal({ ...newGoal, description: e.target.value })}
              className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] resize-none"
              rows={3}
              placeholder="목표에 대한 상세 설명을 입력하세요"
            />
          </div>

          {/* KPI 전용 필드 */}
          {newGoal.goalType === 'KPI' && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[12px] text-[#5a6b62] mb-1">목표 수치</label>
                <input
                  type="number"
                  value={newGoal.targetValue}
                  onChange={e => setNewGoal({ ...newGoal, targetValue: e.target.value })}
                  className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]"
                  placeholder="예: 20"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#5a6b62] mb-1">단위</label>
                <select
                  value={newGoal.targetUnit}
                  onChange={e => setNewGoal({ ...newGoal, targetUnit: e.target.value })}
                  className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]"
                >
                  <option value="건">건</option>
                  <option value="%">%</option>
                  <option value="원">원</option>
                  <option value="명">명</option>
                  <option value="회">회</option>
                  <option value="점">점</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowForm(false); setEditingId(null); setNewGoal({ goalType: 'KPI', category: '업무성과', title: '', description: '', targetValue: '', targetUnit: '건' }) }} className="border border-[#e0e5e3] bg-white rounded-lg px-4 py-2 text-[13px] cursor-pointer hover:bg-[#f5f5f5]">취소</button>
            <button onClick={handleAdd} className="bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer hover:bg-[#0F6E56]">{editingId !== null ? '수정' : '추가'}</button>
          </div>
        </div>
      )}

      {/* 목표 목록 */}
      <div className="bg-white border border-[#e0e5e3] rounded-lg overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#f8faf9] border-b border-[#e0e5e3]">
              <th className="text-center px-4 py-3 font-medium text-[#5a6b62] w-[60px]">유형</th>
              <th className="text-left px-4 py-3 font-medium text-[#5a6b62] w-[80px]">구분</th>
              <th className="text-left px-4 py-3 font-medium text-[#5a6b62]">목표명</th>
              <th className="text-left px-4 py-3 font-medium text-[#5a6b62]">상세 설명</th>
              <th className="text-center px-4 py-3 font-medium text-[#5a6b62] w-[100px]">목표치</th>
              <th className="text-center px-4 py-3 font-medium text-[#5a6b62] w-[80px]">상태</th>
              <th className="text-center px-4 py-3 font-medium text-[#5a6b62] w-[80px]">관리</th>
            </tr>
          </thead>
          <tbody>
            {goals.map(goal => (
              <tr key={goal.id} className="border-b border-[#f0f2f1] hover:bg-[#fafbfa]">
                <td className="px-4 py-3 text-center">
                  <span className={`${goalTypeColors[goal.goalType].bg} ${goalTypeColors[goal.goalType].text} px-2 py-0.5 rounded text-[11px] font-medium`}>
                    {goal.goalType}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="bg-[#eaf6f0] text-[#2e9e6e] px-2 py-0.5 rounded text-[11px]">{goal.category}</span>
                </td>
                <td className="px-4 py-3 font-medium text-[#1a2b23]">{goal.title}</td>
                <td className="px-4 py-3 text-[#5a6b62]">{goal.description}</td>
                <td className="px-4 py-3 text-center">
                  {goal.goalType === 'KPI' ? (
                    <span className="text-[#3b82f6] font-medium">{goal.targetValue}{goal.targetUnit}</span>
                  ) : (
                    <span className="text-[#8a9490]">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    goal.status === '승인' ? 'bg-[#eaf6f0] text-[#2e9e6e]' :
                    goal.status === '반려' ? 'bg-[#fef2f2] text-[#ef4444]' :
                    goal.status === '제출완료' ? 'bg-[#eff6ff] text-[#3b82f6]' :
                    'bg-[#f5f5f5] text-[#8a9490]'
                  }`}>{goal.status}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {goal.status === '작성중' && (
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => handleEdit(goal)} className="text-[#3b82f6] bg-transparent border-none text-[12px] cursor-pointer hover:underline">수정</button>
                      <button onClick={() => handleDelete(goal.id)} className="text-[#ef4444] bg-transparent border-none text-[12px] cursor-pointer hover:underline">삭제</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 제출 버튼 */}
      <div className="flex justify-end mt-6 gap-3">
        <button className="border border-[#e0e5e3] bg-white rounded-lg px-5 py-2.5 text-[13px] cursor-pointer hover:bg-[#f5f5f5]">임시 저장</button>
        <button
          className={`rounded-lg px-5 py-2.5 text-[13px] font-medium border-none cursor-pointer transition-colors ${
            allSubmittable ? 'bg-[#1D9E75] text-white hover:bg-[#0F6E56]' : 'bg-[#d0d8d4] text-white cursor-not-allowed'
          }`}
          disabled={!allSubmittable}
        >
          목표 제출
        </button>
      </div>
    </div>
  )
}
