import React, { useState, useMemo } from 'react'
import {
  kpiTemplates,
  directionLabel,
  unitLabel,
  type KpiTemplate,
  type KpiDepartment,
} from './kpiTemplates'

// TODO: 백엔드 연동 시 로그인 사용자 정보에서 읽어올 것
const MY_DEPARTMENT: KpiDepartment = '영업팀'

type GoalType = 'KPI' | 'OKR'
type TaskGrade = '상' | '중' | '하'

interface Goal {
  id: number
  goalType: GoalType
  category: string
  title: string
  description: string
  grade: TaskGrade          // 사원이 지정하는 업무 중요도
  // KPI 전용 (템플릿 기반)
  kpiTemplateId?: number
  targetValue?: number
  targetUnit?: string
  // 공통
  status: '작성중' | '제출완료'
  approval: '대기' | '승인' | '반려'
  rejectReason?: string     // 반려 시 팀장이 입력한 사유
}

const mockGoals: Goal[] = [
  { id: 1, goalType: 'KPI', category: '업무성과', title: '신규 고객 유치 건수', description: '분기 내 신규 계약 체결 고객 수', grade: '상', kpiTemplateId: 1, targetValue: 20, targetUnit: '건', status: '제출완료', approval: '승인' },
  { id: 2, goalType: 'KPI', category: '업무성과', title: '고객 만족도(CSAT)', description: '분기 CS 응대 만족도 평균 점수', grade: '상', kpiTemplateId: 4, targetValue: 90, targetUnit: '%', status: '제출완료', approval: '승인' },
  { id: 3, goalType: 'OKR', category: '역량개발', title: 'AWS 자격증 취득', description: '클라우드 역량 강화를 위한 자격증 취득', grade: '중', status: '작성중', approval: '대기' },
  { id: 4, goalType: 'OKR', category: '조직기여', title: '신규 입사자 온보딩 지원', description: '신규 팀원 적응 지원 및 멘토링', grade: '하', status: '제출완료', approval: '대기' },
  { id: 5, goalType: 'OKR', category: '역량개발', title: '사내 기술 세미나 발표', description: '분기 1회 기술 공유 세션 진행', grade: '중', status: '작성중', approval: '반려', rejectReason: '주제가 너무 광범위합니다. 구체적인 기술 영역을 지정해주세요.' },
]

const gradeStyle: Record<TaskGrade, string> = {
  '상': 'bg-[#faf5ff] text-[#7c3aed] border-[#7c3aed]',
  '중': 'bg-[#eff6ff] text-[#3b82f6] border-[#3b82f6]',
  '하': 'bg-[#f5f5f5] text-[#8a9490] border-[#d0d8d4]',
}

const goalTypeColors: Record<GoalType, { bg: string; text: string }> = {
  KPI: { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]' },
  OKR: { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]' },
}

interface FormState {
  goalType: GoalType
  category: string
  grade: TaskGrade
  // KPI
  kpiTemplateId: number | null
  targetValue: string
  // OKR
  title: string
  description: string
}

const emptyForm: FormState = {
  goalType: 'KPI',
  category: '업무성과',
  grade: '중',
  kpiTemplateId: null,
  targetValue: '',
  title: '',
  description: '',
}

export default function GoalRegister() {
  const [goals, setGoals] = useState<Goal[]>(mockGoals)
  const [newGoal, setNewGoal] = useState<FormState>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  // 본인 부서 또는 COMMON 의 KPI 템플릿 전체 (구분 필터 제거 - 템플릿에서 카테고리 자동 유래)
  const availableTemplates = useMemo(
    () => kpiTemplates.filter(t =>
      t.department === MY_DEPARTMENT || t.department === 'COMMON',
    ),
    [],
  )

  const selectedTemplate: KpiTemplate | undefined = useMemo(
    () => kpiTemplates.find(t => t.id === newGoal.kpiTemplateId),
    [newGoal.kpiTemplateId],
  )

  const handleEdit = (goal: Goal) => {
    setEditingId(goal.id)
    setNewGoal({
      goalType: goal.goalType,
      category: goal.category,
      grade: goal.grade,
      kpiTemplateId: goal.kpiTemplateId ?? null,
      targetValue: goal.targetValue?.toString() ?? '',
      title: goal.title,
      description: goal.description,
    })
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setNewGoal(emptyForm)
  }

  const handleAdd = () => {
    const existingGoal = editingId !== null ? goals.find(g => g.id === editingId) : null

    let goal: Goal
    if (newGoal.goalType === 'KPI') {
      if (!selectedTemplate) return
      if (!newGoal.targetValue) return
      goal = {
        id: editingId ?? Date.now(),
        goalType: 'KPI',
        category: selectedTemplate.category,
        title: selectedTemplate.name,
        description: selectedTemplate.description,
        grade: newGoal.grade,
        kpiTemplateId: selectedTemplate.id,
        targetValue: Number(newGoal.targetValue),
        targetUnit: unitLabel[selectedTemplate.unit],
        // 반려 건을 수정하면 작성중으로 되돌려서 재제출 가능하게
        status: existingGoal?.approval === '반려' ? '작성중' : (existingGoal?.status ?? '작성중'),
        approval: existingGoal?.approval === '반려' ? '대기' : (existingGoal?.approval ?? '대기'),
      }
    } else {
      if (!newGoal.title.trim()) return
      goal = {
        id: editingId ?? Date.now(),
        goalType: 'OKR',
        category: newGoal.category,
        title: newGoal.title,
        description: newGoal.description,
        grade: newGoal.grade,
        status: existingGoal?.approval === '반려' ? '작성중' : (existingGoal?.status ?? '작성중'),
        approval: existingGoal?.approval === '반려' ? '대기' : (existingGoal?.approval ?? '대기'),
      }
    }

    if (editingId !== null) {
      setGoals(goals.map(g => g.id === editingId ? goal : g))
    } else {
      setGoals([...goals, goal])
    }
    handleCancel()
  }

  const handleDelete = (id: number) => {
    setGoals(goals.filter(g => g.id !== id))
  }

  const handleSubmitAll = () => {
    setGoals(goals.map(g =>
      (g.status === '작성중' || g.approval === '반려')
        ? { ...g, status: '제출완료' as const, approval: '대기' as const, rejectReason: undefined }
        : g,
    ))
  }

  const draftGoals = goals.filter(g => g.status === '작성중')
  const rejectedGoals = goals.filter(g => g.approval === '반려')
  const pendingGoals = [...draftGoals, ...rejectedGoals]
  const allSubmittable = pendingGoals.length > 0 && pendingGoals.every(g => g.title.trim())
  const submitLabel =
    pendingGoals.length === 0 ? '제출 완료' :
    draftGoals.length > 0 && rejectedGoals.length > 0 ? `미제출 ${pendingGoals.length}건 제출` :
    rejectedGoals.length > 0 ? `반려 ${rejectedGoals.length}건 재제출` :
    `작성중 ${draftGoals.length}건 제출`
  const kpiCount = goals.filter(g => g.goalType === 'KPI').length
  const okrCount = goals.filter(g => g.goalType === 'OKR').length

  // 승인된 목표만 대상, 등급별 가중치(상=3, 중=2, 하=1)로 비율 배분
  const gradeWeight: Record<TaskGrade, number> = { '상': 3, '중': 2, '하': 1 }
  const approvedGoals = goals.filter(g => g.approval === '승인')
  const totalWeight = approvedGoals.reduce((s, g) => s + gradeWeight[g.grade], 0)
  const ratioOf = (g: Goal): number | null => {
    if (g.approval !== '승인' || totalWeight === 0) return null
    return +(gradeWeight[g.grade] / totalWeight * 100).toFixed(1)
  }

  const canSave = newGoal.goalType === 'KPI'
    ? selectedTemplate !== undefined && newGoal.targetValue !== ''
    : newGoal.title.trim().length > 0

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(개인) &gt; 목표 등록</div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">목표 등록/수정</h1>
          <p className="text-[13px] text-[#8a9490]">본인의 평가 목표를 등록·수정합니다. KPI는 인사팀이 등록한 지표를 선택합니다.</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setNewGoal(emptyForm); setShowForm(true) }}
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
        <div className="border-l border-[#e0e5e3] pl-6">승인 <span className="font-bold text-[#2e9e6e]">{goals.filter(g => g.approval === '승인').length}</span></div>
        <div>반려 <span className="font-bold text-[#ef4444]">{goals.filter(g => g.approval === '반려').length}</span></div>
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
                  onClick={() => setNewGoal({ ...newGoal, goalType: t, kpiTemplateId: null, targetValue: '' })}
                  className={`px-5 py-2.5 rounded-lg text-[13px] font-medium border cursor-pointer transition-colors ${
                    newGoal.goalType === t
                      ? t === 'KPI' ? 'bg-[#eff6ff] text-[#3b82f6] border-[#3b82f6]' : 'bg-[#faf5ff] text-[#7c3aed] border-[#7c3aed]'
                      : 'bg-white text-[#8a9490] border-[#e0e5e3] hover:border-[#8a9490]'
                  }`}
                >
                  {t === 'KPI' ? 'KPI (정량·템플릿)' : 'OKR (정성·자유)'}
                </button>
              ))}
            </div>
          </div>

          {/* 구분 — KPI 는 지표 선택 시 자동 설정 + 입력 불가, OKR 만 선택 가능 */}
          <div className="mb-4">
            <label className="block text-[12px] text-[#5a6b62] mb-1">
              구분
              {newGoal.goalType === 'KPI' && (
                <span className="ml-1 text-[#8a9490]">(지표 선택 시 자동)</span>
              )}
            </label>
            <select
              value={newGoal.category}
              onChange={e => setNewGoal({ ...newGoal, category: e.target.value })}
              disabled={newGoal.goalType === 'KPI'}
              className={`w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px] ${
                newGoal.goalType === 'KPI' ? 'bg-[#f5f5f5] text-[#8a9490] cursor-not-allowed' : ''
              }`}
            >
              <option>업무성과</option>
              <option>역량개발</option>
              <option>조직기여</option>
            </select>
          </div>

          {/* 업무등급 */}
          <div className="mb-4">
            <label className="block text-[12px] text-[#5a6b62] mb-1">
              업무등급 <span className="text-[#8a9490]">(중요도)</span>
            </label>
            <div className="flex gap-2">
              {(['상', '중', '하'] as TaskGrade[]).map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setNewGoal({ ...newGoal, grade: g })}
                  className={`flex-1 px-3 py-2 rounded-md text-[13px] font-medium border cursor-pointer transition-colors ${
                    newGoal.grade === g
                      ? gradeStyle[g]
                      : 'bg-white text-[#8a9490] border-[#e0e5e3] hover:border-[#8a9490]'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {newGoal.goalType === 'KPI' ? (
            <>
              {/* KPI 지표 선택 */}
              <div className="mb-4">
                <label className="block text-[12px] text-[#5a6b62] mb-1">
                  KPI 지표 <span className="text-[#8a9490]">(인사팀 등록)</span>
                </label>
                <select
                  value={newGoal.kpiTemplateId ?? ''}
                  onChange={e => {
                    const id = e.target.value === '' ? null : Number(e.target.value)
                    const tpl = kpiTemplates.find(t => t.id === id)
                    setNewGoal({
                      ...newGoal,
                      kpiTemplateId: id,
                      targetValue: '',
                      // 지표 선택 시 구분(카테고리) 자동 설정 — 입력 불가 드롭다운에 반영
                      category: tpl ? tpl.category : newGoal.category,
                    })
                  }}
                  className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]"
                >
                  <option value="">— 지표를 선택하세요 —</option>
                  {availableTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {availableTemplates.length === 0 && (
                  <p className="mt-1 text-[11px] text-[#ef4444]">해당 카테고리에 등록된 지표가 없습니다.</p>
                )}
              </div>

              {/* 선택된 지표 상세 */}
              {selectedTemplate && (
                <div className="mb-4 p-3 bg-[#f5faf7] border border-[#d4ecdd] rounded-md">
                  <p className="text-[12px] text-[#5a6b62] mb-2">{selectedTemplate.description}</p>
                  <div className="flex gap-3 text-[11px] flex-wrap">
                    <span className="px-2 py-0.5 bg-white border border-[#d4ecdd] rounded text-[#1D9E75] font-medium">
                      방향 : {directionLabel[selectedTemplate.direction]}
                    </span>
                    <span className="px-2 py-0.5 bg-white border border-[#d4ecdd] rounded text-[#1D9E75] font-medium">
                      단위 : {unitLabel[selectedTemplate.unit]}
                    </span>
                    {selectedTemplate.baseline !== undefined && (
                      <span className="px-2 py-0.5 bg-white border border-[#d4ecdd] rounded text-[#5a6b62] font-medium">
                        사내 평균 : {selectedTemplate.baseline}{unitLabel[selectedTemplate.unit]}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 목표값 */}
              <div className="mb-4">
                <label className="block text-[12px] text-[#5a6b62] mb-1">목표값</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={newGoal.targetValue}
                    onChange={e => setNewGoal({ ...newGoal, targetValue: e.target.value })}
                    className="flex-1 border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]"
                    placeholder="숫자 입력"
                    disabled={!selectedTemplate}
                  />
                  <span className="text-[13px] text-[#5a6b62] min-w-[40px]">
                    {selectedTemplate ? unitLabel[selectedTemplate.unit] : ''}
                  </span>
                </div>
                {(() => {
                  if (!selectedTemplate || selectedTemplate.baseline === undefined || !newGoal.targetValue) return null
                  const target = Number(newGoal.targetValue)
                  const base = selectedTemplate.baseline
                  if (!Number.isFinite(target) || base === 0) return null
                  let ratio: number
                  if (selectedTemplate.direction === 'UP') ratio = target / base
                  else if (selectedTemplate.direction === 'DOWN') ratio = base / target
                  else ratio = 1 - Math.abs(target - base) / base
                  let label = ''
                  let color = ''
                  if (selectedTemplate.direction === 'MAINTAIN') {
                    if (ratio >= 0.9) { label = '적정 범위입니다 (기준값 ±10% 이내)'; color = 'text-[#2e9e6e] bg-[#eaf6f0]' }
                    else { label = '기준값에서 다소 벗어나 있습니다'; color = 'text-[#f59e0b] bg-[#fef3cd]' }
                  } else {
                    if (ratio >= 1.5) { label = `도전적인 목표입니다 (사내 평균 대비 ${Math.round((ratio - 1) * 100)}% 상향)`; color = 'text-[#7c3aed] bg-[#faf5ff]' }
                    else if (ratio >= 1.05) { label = `현실적인 목표입니다 (사내 평균 대비 ${Math.round((ratio - 1) * 100)}% 상향)`; color = 'text-[#2e9e6e] bg-[#eaf6f0]' }
                    else if (ratio >= 0.95) { label = '사내 평균과 유사합니다'; color = 'text-[#8a9490] bg-[#f5f5f5]' }
                    else { label = '사내 평균보다 낮습니다'; color = 'text-[#b0b8b4] bg-[#f5f5f5]' }
                  }
                  return (
                    <div className={`mt-2 inline-block px-2 py-1 rounded text-[11px] font-medium ${color}`}>
                      {label}
                    </div>
                  )
                })()}
              </div>
            </>
          ) : (
            <>
              {/* OKR 자유 입력 */}
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
            </>
          )}

          <div className="flex gap-2 justify-end">
            <button onClick={handleCancel} className="border border-[#e0e5e3] bg-white rounded-lg px-4 py-2 text-[13px] cursor-pointer hover:bg-[#f5f5f5]">취소</button>
            <button
              onClick={handleAdd}
              disabled={!canSave}
              className={`rounded-lg px-4 py-2 text-[13px] font-medium border-none ${
                canSave ? 'bg-[#1D9E75] text-white cursor-pointer hover:bg-[#0F6E56]' : 'bg-[#d0d8d4] text-white cursor-not-allowed'
              }`}
            >
              {editingId !== null ? '수정' : '추가'}
            </button>
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
              <th className="text-center px-4 py-3 font-medium text-[#5a6b62] w-[60px]">등급</th>
              <th className="text-left px-4 py-3 font-medium text-[#5a6b62]">목표명</th>
              <th className="text-left px-4 py-3 font-medium text-[#5a6b62]">상세 설명</th>
              <th className="text-center px-4 py-3 font-medium text-[#5a6b62] w-[100px]">목표치</th>
              <th className="text-center px-4 py-3 font-medium text-[#5a6b62] w-[80px]">비율</th>
              <th className="text-center px-4 py-3 font-medium text-[#5a6b62] w-[80px]">상태</th>
              <th className="text-center px-4 py-3 font-medium text-[#5a6b62] w-[80px]">승인</th>
              <th className="text-center px-4 py-3 font-medium text-[#5a6b62] w-[80px]">관리</th>
            </tr>
          </thead>
          <tbody>
            {goals.map(goal => (
              <React.Fragment key={goal.id}>
              <tr className="border-b border-[#f0f2f1] hover:bg-[#fafbfa]">
                <td className="px-4 py-3 text-center">
                  <span className={`${goalTypeColors[goal.goalType].bg} ${goalTypeColors[goal.goalType].text} px-2 py-0.5 rounded text-[11px] font-medium`}>
                    {goal.goalType}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="bg-[#eaf6f0] text-[#2e9e6e] px-2 py-0.5 rounded text-[11px]">{goal.category}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${gradeStyle[goal.grade]}`}>
                    {goal.grade}
                  </span>
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
                  {ratioOf(goal) !== null ? (
                    <span className="text-[#1a2b23] font-semibold">{ratioOf(goal)}%</span>
                  ) : (
                    <span className="text-[#b0b8b4] text-[11px]">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    goal.status === '제출완료' ? 'bg-[#eff6ff] text-[#3b82f6]' :
                    'bg-[#f5f5f5] text-[#8a9490]'
                  }`}>{goal.status}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    goal.approval === '승인' ? 'bg-[#eaf6f0] text-[#2e9e6e]' :
                    goal.approval === '반려' ? 'bg-[#fef2f2] text-[#ef4444]' :
                    'bg-[#f5f5f5] text-[#8a9490]'
                  }`}>{goal.approval}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {(goal.status === '작성중' || goal.approval === '반려') && (
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => handleEdit(goal)} className="text-[#3b82f6] bg-transparent border-none text-[12px] cursor-pointer hover:underline">수정</button>
                      <button onClick={() => handleDelete(goal.id)} className="text-[#ef4444] bg-transparent border-none text-[12px] cursor-pointer hover:underline">삭제</button>
                    </div>
                  )}
                </td>
              </tr>
              {goal.approval === '반려' && goal.rejectReason && (
                <tr className="border-b border-[#f0f2f1]">
                  <td colSpan={10} className="px-4 py-2 bg-[#fef2f2] text-[12px]">
                    <span className="text-[#ef4444] font-semibold mr-2">반려 사유</span>
                    <span className="text-[#5a6b62]">{goal.rejectReason}</span>
                  </td>
                </tr>
              )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* 제출 버튼 */}
      <div className="flex justify-end mt-6 gap-3">
        <button
          onClick={handleSubmitAll}
          className={`rounded-lg px-5 py-2.5 text-[13px] font-medium border-none cursor-pointer transition-colors ${
            allSubmittable ? 'bg-[#1D9E75] text-white hover:bg-[#0F6E56]' : 'bg-[#d0d8d4] text-white cursor-not-allowed'
          }`}
          disabled={!allSubmittable}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  )
}
