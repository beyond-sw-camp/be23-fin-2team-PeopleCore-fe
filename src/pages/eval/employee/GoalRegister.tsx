import { useState, useEffect, useMemo } from 'react'
import {
  fetchMyGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  submitAllDrafts,
  updateGoalWeights,
  type GoalResponse,
  type GoalRequest,
  type GoalType,
} from '../../../api/goal'
import {
  fetchAllKpiTemplates,
  type KpiTemplateResponse,
  type KpiDirection,
} from '../../../api/kpiTemplate'
import { fetchKpiOptionBundle, type KpiOptionItem } from '../../../api/kpiOption'
import { departmentApi, type DepartmentTreeResponse } from '../../../api/org'
import { useStageReadOnly } from '../../../components/eval/StageGate'
import { useAuth } from '../../../contexts/AuthContext'

const directionLabel: Record<KpiDirection, string> = {
  UP: '증가형',
  DOWN: '감소형',
  MAINTAIN: '유지형',
}

const goalTypeColors: Record<GoalType, { bg: string; text: string }> = {
  KPI: { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]' },
  OKR: { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]' },
}

interface FormState {
  goalType: GoalType
  category: string
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
  kpiTemplateId: null,
  targetValue: '',
  title: '',
  description: '',
}

// 백엔드 승인상태 → UI 라벨 (status, approval 두 컬럼)
// REJECTED 는 사원이 다시 수정·재제출해야 하므로 상태 컬럼은 '작성중'으로 표시 (승인 컬럼이 '반려'로 구분 역할)
function approvalToUi(approval: GoalResponse['approval']): { status: string; approval: string } {
  switch (approval) {
    case 'DRAFT':    return { status: '작성중',   approval: '대기' }
    case 'PENDING':  return { status: '제출완료', approval: '대기' }
    case 'APPROVED': return { status: '제출완료', approval: '승인' }
    case 'REJECTED': return { status: '작성중',   approval: '반려' }
  }
}

export default function GoalRegister() {
  const [goals, setGoals] = useState<GoalResponse[]>([])
  const [templates, setTemplates] = useState<KpiTemplateResponse[]>([])
  const [deptTree, setDeptTree] = useState<DepartmentTreeResponse[]>([])
  const [departmentLevel, setDepartmentLevel] = useState<string>('leaf')  // KpiOption 정책
  const [categories, setCategories] = useState<KpiOptionItem[]>([])  // 회사별 카테고리 옵션
  const [newGoal, setNewGoal] = useState<FormState>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  // 가중치 설정 — 로컬 편집값 (서버 저장 전 임시상태). goalId → weight
  const [weightDraft, setWeightDraft] = useState<Record<number, number>>({})
  // 입력 버퍼 — 타이핑 중인 문자열을 그대로 보관. 비우거나 한 자릿수 입력 가능하게 하고,
  // blur 시점에만 [10,100]으로 clamp 해서 weightDraft에 반영
  const [weightInputBuffer, setWeightInputBuffer] = useState<Record<number, string>>({})
  const [savingWeights, setSavingWeights] = useState(false)

  // 관리 컬럼 ... 메뉴 — 열린 행의 goalId
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 단계 마감 후에도 페이지는 보이지만 쓰기 액션은 차단
  const readOnly = useStageReadOnly()

  // 본인 직급 — KPI 마스터를 (해당 직급 OR 전 직급 공통) 으로 좁혀서 받기
  const { user } = useAuth()
  const myGradeId = user?.gradeId ? Number(user.gradeId) : undefined

  // 초기 로드 — 직급은 user 가 잡힌 뒤 다시 조회되도록 의존성에 포함
  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      fetchMyGoals(),
      fetchAllKpiTemplates({ gradeId: myGradeId }),
      departmentApi.getTree().then(r => r.data).catch(() => []),
      fetchKpiOptionBundle().catch(() => ({ categories: [], units: [], departmentLevel: 'leaf' })),
    ])
      .then(([gs, ts, tree, bundle]) => {
        setGoals(gs)
        setTemplates(ts)
        setDeptTree(tree)
        setDepartmentLevel(bundle.departmentLevel ?? 'leaf')
        setCategories(bundle.categories ?? [])
        // 가중치 초기화 — 서버 값 그대로 (KPI 만)
        const draft: Record<number, number> = {}
        gs.forEach(g => { if (g.goalType === 'KPI' && g.weight !== null) draft[g.id] = g.weight })
        setWeightDraft(draft)
      })
      .catch((e: any) => {
        console.error('[GoalRegister] load failed', e)
        setError(e?.response?.data?.message || '데이터를 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [user?.empId, myGradeId])

  // 부서 트리에서 depth 맵 + leaf 여부 맵 구축
  const { depthMap, leafSet } = useMemo(() => {
    const depthMap = new Map<number, number>()
    const leafSet = new Set<number>()
    const walk = (nodes: DepartmentTreeResponse[], level: number) => {
      for (const n of nodes) {
        depthMap.set(n.id, level)
        if (!n.children || n.children.length === 0) leafSet.add(n.id)
        else walk(n.children, level + 1)
      }
    }
    walk(deptTree, 1)
    return { depthMap, leafSet }
  }, [deptTree])

  // 정책(부서 레벨) + 선택된 카테고리에 맞는 템플릿만 노출
  const availableTemplates = useMemo(() => {
    if (templates.length === 0) return templates
    let filtered = templates
    if (departmentLevel === 'leaf') {
      filtered = filtered.filter(t => leafSet.has(t.deptId))
    } else {
      const targetDepth = Number(departmentLevel)
      if (Number.isFinite(targetDepth)) {
        filtered = filtered.filter(t => depthMap.get(t.deptId) === targetDepth)
      }
    }
    // KPI 지표 드롭다운에서만 사용되므로 카테고리 필터를 항상 적용
    return filtered.filter(t => t.categoryLabel === newGoal.category)
  }, [templates, departmentLevel, depthMap, leafSet, newGoal.category])

  const selectedTemplate: KpiTemplateResponse | undefined = useMemo(
    () => templates.find(t => t.kpiId === newGoal.kpiTemplateId),
    [templates, newGoal.kpiTemplateId],
  )

  const handleEdit = (goal: GoalResponse) => {
    if (readOnly) return
    setEditingId(goal.id)
    setNewGoal({
      goalType: goal.goalType,
      category: goal.category,
      kpiTemplateId: goal.kpiTemplateId ?? null,
      targetValue: goal.targetValue?.toString() ?? '',
      title: goal.title,
      description: goal.description,
    })
    setShowForm(true)
    setError(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setNewGoal(emptyForm)
    setError(null)
  }

  const buildPayload = (): GoalRequest | null => {
    if (newGoal.goalType === 'KPI') {
      if (!selectedTemplate) return null
      if (!newGoal.targetValue) return null
      return {
        goalType: 'KPI',
        kpiTemplateId: selectedTemplate.kpiId,
        targetValue: Number(newGoal.targetValue),
      }
    }
    if (!newGoal.title.trim()) return null
    return {
      goalType: 'OKR',
      category: newGoal.category,
      title: newGoal.title,
      description: newGoal.description,
    }
  }

  const handleAdd = async () => {
    if (readOnly) return
    const payload = buildPayload()
    if (!payload) return
    setSaving(true)
    setError(null)
    try {
      if (editingId !== null) {
        const updated = await updateGoal(editingId, payload)
        setGoals(prev => prev.map(g => g.id === editingId ? updated : g))
      } else {
        const created = await createGoal(payload)
        setGoals(prev => [...prev, created])
        // 신규 KPI 는 서버에서 weight=10 박힘 — 로컬 draft 도 동기화
        if (created.goalType === 'KPI' && created.weight !== null) {
          setWeightDraft(prev => ({ ...prev, [created.id]: created.weight! }))
        }
      }
      handleCancel()
    } catch (e: any) {
      console.error('[GoalRegister] save failed', e)
      setError(e?.response?.data?.message || '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (readOnly) return
    if (!confirm('이 목표를 삭제하시겠습니까?')) return
    setSaving(true)
    setError(null)
    try {
      // 1차 시도: confirm=false 로 cascade 필요 여부 확인
      const result = await deleteGoal(id, false)

      // cascade 필요: 마지막 KPI + OKR 잔존 → 사용자에게 2차 확인
      if (result.requiresConfirm) {
        const okrTitles = result.cascadedOkrs.map(o => `- ${o.title}`).join('\n')
        const okrCount = result.cascadedOkrs.length
        const proceed = confirm(
          `이 KPI 를 삭제하면 아래 OKR ${okrCount}개도 함께 삭제됩니다.\n\n${okrTitles}\n\n계속하시겠습니까?`,
        )
        if (!proceed) return
        // 2차 호출: confirm=true 로 cascade 실행
        await deleteGoal(id, true)
        const cascadedIds = new Set(result.cascadedOkrs.map(o => o.goalId))
        setGoals(prev => prev.filter(g => g.id !== id && !cascadedIds.has(g.id)))
        setWeightDraft(prev => {
          const next = { ...prev }
          delete next[id]
          cascadedIds.forEach(cid => delete next[cid])
          return next
        })
        return
      }

      // cascade 없이 정상 삭제됨
      setGoals(prev => prev.filter(g => g.id !== id))
      setWeightDraft(prev => { const next = { ...prev }; delete next[id]; return next })
    } catch (e: any) {
      console.error('[GoalRegister] delete failed', e)
      setError(e?.response?.data?.message || '삭제에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // 가중치 일괄 저장 (임시저장 — 합계 검증 X)
  const handleSaveWeights = async () => {
    if (readOnly) return
    setSavingWeights(true)
    setError(null)
    try {
      const items = kpiGoals.map(g => ({ goalId: g.id, weight: weightDraft[g.id] ?? g.weight ?? 10 }))
      const fresh = await updateGoalWeights(items)
      setGoals(fresh)
      const draft: Record<number, number> = {}
      fresh.forEach(g => { if (g.goalType === 'KPI' && g.weight !== null) draft[g.id] = g.weight })
      setWeightDraft(draft)
    } catch (e: any) {
      console.error('[GoalRegister] save weights failed', e)
      setError(e?.response?.data?.message || '가중치 저장에 실패했습니다.')
    } finally {
      setSavingWeights(false)
    }
  }

  const handleSubmitAll = async () => {
    if (readOnly) return
    setSaving(true)
    setError(null)
    try {
      // 제출 전에 현재 draft 가중치를 서버에 먼저 반영 (임시저장)
      // — 그래야 백엔드 submit-all 의 합계 100 검증이 최신 값으로 돈다
      if (kpiGoals.length > 0) {
        const items = kpiGoals.map(g => ({ goalId: g.id, weight: weightDraft[g.id] ?? g.weight ?? 10 }))
        await updateGoalWeights(items)
      }
      await submitAllDrafts()
      const fresh = await fetchMyGoals()
      setGoals(fresh)
      const draft: Record<number, number> = {}
      fresh.forEach(g => { if (g.goalType === 'KPI' && g.weight !== null) draft[g.id] = g.weight })
      setWeightDraft(draft)
    } catch (e: any) {
      console.error('[GoalRegister] submit failed', e)
      setError(e?.response?.data?.message || '제출에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // 집계용 파생값
  const draftGoals = goals.filter(g => g.approval === 'DRAFT')
  const rejectedGoals = goals.filter(g => g.approval === 'REJECTED')
  const pendingGoals = [...draftGoals, ...rejectedGoals]
  const kpiGoals = useMemo(() => goals.filter(g => g.goalType === 'KPI'), [goals])
  const weightSum = kpiGoals.reduce((s, g) => s + (weightDraft[g.id] ?? g.weight ?? 0), 0)
  const allSubmittable = pendingGoals.length > 0
    && pendingGoals.every(g => g.title.trim())
    && weightSum === 100
  const submitLabel =
    pendingGoals.length === 0 ? '제출 완료' :
    draftGoals.length > 0 && rejectedGoals.length > 0 ? `미제출 ${pendingGoals.length}건 제출` :
    rejectedGoals.length > 0 ? `반려 ${rejectedGoals.length}건 재제출` :
    `작성중 ${draftGoals.length}건 제출`
  const kpiCount = kpiGoals.length
  const okrCount = goals.filter(g => g.goalType === 'OKR').length
  const approvedCount = goals.filter(g => g.approval === 'APPROVED').length
  const rejectedCount = goals.filter(g => g.approval === 'REJECTED').length
  const draftCount = goals.filter(g => g.approval === 'DRAFT').length

  // KPI 10개 초과 차단 — min=10 다 적용해도 합계 > 100 되어 제출 불가
  const canAddKpi = kpiCount < 10

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-sm text-gray-400">
        <i className="fas fa-spinner fa-spin mr-2" /> 불러오는 중...
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6" onClick={() => openMenuId !== null && setOpenMenuId(null)}>
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(개인) &gt; 목표 등록</div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">목표 등록/수정</h1>
          <p className="text-[13px] text-[#8a9490]">본인의 평가 목표를 등록·수정합니다. 가중치는 등록 후 아래 "가중치 설정"에서 조정합니다.</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setNewGoal(emptyForm); setShowForm(true); setError(null) }}
          disabled={readOnly}
          className="bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2.5 text-[13px] font-medium cursor-pointer hover:bg-[#0F6E56] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#1D9E75]"
        >
          + 목표 추가
        </button>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 mb-4 bg-red-50 border border-red-200 text-[13px] text-red-700">
          <i className="fas fa-triangle-exclamation mr-2" />{error}
        </div>
      )}

      {/* 현황 */}
      <div className="bg-[#f8faf9] border border-[#e0e5e3] rounded-lg p-4 mb-6 flex items-center gap-6 text-[13px]">
        <div>전체 <span className="font-bold text-[#1a2b23]">{goals.length}</span>건</div>
        <div>KPI <span className="font-bold text-[#3b82f6]">{kpiCount}</span></div>
        <div>OKR <span className="font-bold text-[#7c3aed]">{okrCount}</span></div>
        <div className="border-l border-[#e0e5e3] pl-6">승인 <span className="font-bold text-[#2e9e6e]">{approvedCount}</span></div>
        <div>반려 <span className="font-bold text-[#ef4444]">{rejectedCount}</span></div>
        <div>작성중 <span className="font-bold text-[#8a9490]">{draftCount}</span></div>
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
                  disabled={t === 'KPI' && !canAddKpi && editingId === null}
                  className={`px-5 py-2.5 rounded-lg text-[13px] font-medium border cursor-pointer transition-colors ${
                    newGoal.goalType === t
                      ? t === 'KPI' ? 'bg-[#eff6ff] text-[#3b82f6] border-[#3b82f6]' : 'bg-[#faf5ff] text-[#7c3aed] border-[#7c3aed]'
                      : 'bg-white text-[#8a9490] border-[#e0e5e3] hover:border-[#8a9490]'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {t === 'KPI' ? 'KPI (정량·템플릿)' : 'OKR (정성·자유)'}
                </button>
              ))}
            </div>
            {!canAddKpi && editingId === null && newGoal.goalType === 'KPI' && (
              <p className="mt-1 text-[11px] text-[#ef4444]">KPI 목표는 최대 10개까지 등록 가능합니다.</p>
            )}
          </div>

          {/* 구분 — KPI 만 노출. 카테고리에 따라 지표 목록이 필터됨 */}
          {newGoal.goalType === 'KPI' && (
            <div className="mb-4">
              <label className="block text-[12px] text-[#5a6b62] mb-1">
                구분 <span className="ml-1 text-[#8a9490]">(지표를 카테고리별로 필터)</span>
              </label>
              <select
                value={newGoal.category}
                onChange={e => {
                  // 카테고리가 바뀌면 선택된 지표/목표값 초기화 (필터 결과가 바뀌므로)
                  setNewGoal({ ...newGoal, category: e.target.value, kpiTemplateId: null, targetValue: '' })
                }}
                className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]"
              >
                {categories.length > 0
                  ? categories.map(c => <option key={c.id ?? c.label} value={c.label}>{c.label}</option>)
                  : <option value={newGoal.category}>{newGoal.category}</option>}
              </select>
            </div>
          )}

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
                    setNewGoal({ ...newGoal, kpiTemplateId: id, targetValue: '' })
                  }}
                  className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]"
                >
                  <option value="">— 지표를 선택하세요 —</option>
                  {availableTemplates.map(t => (
                    <option key={t.kpiId} value={t.kpiId}>{t.name}</option>
                  ))}
                </select>
                {availableTemplates.length === 0 && (
                  <p className="mt-1 text-[11px] text-[#ef4444]">선택한 카테고리에 등록된 KPI 지표가 없습니다.</p>
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
                      단위 : {selectedTemplate.unitLabel}
                    </span>
                    {selectedTemplate.baseline !== null && (
                      <span className="px-2 py-0.5 bg-white border border-[#d4ecdd] rounded text-[#5a6b62] font-medium">
                        사내 평균 : {selectedTemplate.baseline}{selectedTemplate.unitLabel}
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
                    {selectedTemplate ? selectedTemplate.unitLabel : ''}
                  </span>
                </div>
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
            <button onClick={handleCancel} disabled={saving} className="border border-[#e0e5e3] bg-white rounded-lg px-4 py-2 text-[13px] cursor-pointer hover:bg-[#f5f5f5] disabled:opacity-50">취소</button>
            <button
              onClick={handleAdd}
              disabled={saving || readOnly}
              className={`rounded-lg px-4 py-2 text-[13px] font-medium border-none ${
                !saving && !readOnly ? 'bg-[#1D9E75] text-white cursor-pointer hover:bg-[#0F6E56]' : 'bg-[#d0d8d4] text-white cursor-not-allowed'
              }`}
            >
              {saving ? '저장 중...' : (editingId !== null ? '수정' : '추가')}
            </button>
          </div>
        </div>
      )}

      {/* KPI 1개 + OKR 존재 시 cascade 사전 안내 */}
      {kpiCount === 1 && okrCount > 0 && (
        <div className="rounded-lg px-4 py-3 mb-4 bg-amber-50 border border-amber-200 text-[13px] text-amber-700">
          <i className="fas fa-triangle-exclamation mr-2" />
          OKR 은 KPI 1개 이상 있어야 유지됩니다. 이 KPI 를 삭제하면 OKR {okrCount}개도 함께 삭제됩니다.
        </div>
      )}

      {/* 묶음 반려 사유 — 평가자가 전체 단위로 반려할 때 동일 사유가 들어가므로 배너 1회만 표시 */}
      {rejectedGoals.length > 0 && rejectedGoals[0].rejectReason && (
        <div className="rounded-lg px-4 py-3 mb-4 bg-[#fef2f2] border border-[#fca5a5] text-[13px]">
          <div className="flex items-start gap-2">
            <i className="fas fa-circle-exclamation text-[#ef4444] mt-0.5" />
            <div className="flex-1">
              <div className="text-[#ef4444] font-semibold mb-1">반려 사유 ({rejectedGoals.length}건 일괄)</div>
              <div className="text-[#7f1d1d] whitespace-pre-wrap">{rejectedGoals[0].rejectReason}</div>
            </div>
          </div>
        </div>
      )}

      {/* 목표 목록 */}
      {kpiGoals.length > 0 && (
        <div className="flex items-center justify-end mb-2">
          <div className="text-[12px]">
            <span className="text-[#8a9490]">합계 </span>
            <span className={
              weightSum === 100 ? 'text-[#1D9E75] font-bold text-[16px]' :
              weightSum > 100 ? 'text-[#ef4444] font-bold text-[16px]' :
              'text-[#5a6b62] font-bold text-[16px]'
            }>{weightSum}%</span>
            <span className="text-[#8a9490]"> / 100%</span>
          </div>
        </div>
      )}
      <div className="bg-white border border-[#e0e5e3] rounded-lg overflow-visible mb-2">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#f8faf9] border-b border-[#e0e5e3]">
              <th className="text-center px-4 py-3 font-medium text-[#5a6b62] w-[60px]">유형</th>
              <th className="text-left px-4 py-3 font-medium text-[#5a6b62] w-[80px]">구분</th>
              <th className="text-left px-4 py-3 font-medium text-[#5a6b62]">목표명</th>
              <th className="text-left px-4 py-3 font-medium text-[#5a6b62]">상세 설명</th>
              <th className="text-center px-4 py-3 font-medium text-[#5a6b62] w-[100px]">목표치</th>
              <th className="text-center px-4 py-3 font-medium text-[#5a6b62] w-[120px]">가중치 (%)</th>
              <th className="text-center px-4 py-3 font-medium text-[#5a6b62] w-[80px]">상태</th>
              <th className="text-center px-4 py-3 font-medium text-[#5a6b62] w-[80px]">승인</th>
              <th className="text-center px-4 py-3 font-medium text-[#5a6b62] w-[80px]">관리</th>
            </tr>
          </thead>
          <tbody>
            {goals.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-[13px] text-[#8a9490]">등록된 목표가 없습니다.</td></tr>
            ) : goals.map(goal => {
              const ui = approvalToUi(goal.approval)
              const canEdit = goal.approval === 'DRAFT' || goal.approval === 'REJECTED'
              const w = weightDraft[goal.id] ?? goal.weight ?? 10
              return (
                  <tr key={goal.id} className="border-b border-[#f0f2f1] hover:bg-[#fafbfa]">
                    <td className="px-4 py-3 text-center">
                      <span className={`${goalTypeColors[goal.goalType].bg} ${goalTypeColors[goal.goalType].text} px-2 py-0.5 rounded text-[11px] font-medium`}>
                        {goal.goalType}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="bg-[#eaf6f0] text-[#2e9e6e] px-2 py-0.5 rounded text-[11px] whitespace-nowrap">{goal.category}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1a2b23]">{goal.title}</td>
                    <td className="px-4 py-3 text-[#5a6b62]">{goal.description}</td>
                    <td className="px-4 py-3 text-center">
                      {goal.goalType === 'KPI' && goal.targetValue !== null ? (
                        <span className="text-[#3b82f6] font-medium">{goal.targetValue}{goal.targetUnit ?? ''}</span>
                      ) : (
                        <span className="text-[#8a9490]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {goal.goalType === 'KPI' ? (
                        <>
                          <input
                            type="number"
                            min={10}
                            max={100}
                            step={5}
                            value={weightInputBuffer[goal.id] ?? String(w)}
                            disabled={readOnly}
                            onChange={e => {
                              const raw = e.target.value
                              setWeightInputBuffer(prev => ({ ...prev, [goal.id]: raw }))
                              const parsed = Number(raw)
                              if (raw !== '' && !Number.isNaN(parsed)) {
                                setWeightDraft(prev => ({ ...prev, [goal.id]: parsed }))
                              }
                            }}
                            onBlur={() => {
                              const raw = weightInputBuffer[goal.id]
                              const num = raw === undefined ? w : (raw === '' ? NaN : Number(raw))
                              const clamped = Number.isNaN(num) ? 10 : Math.max(10, Math.min(100, Math.round(num)))
                              setWeightDraft(prev => ({ ...prev, [goal.id]: clamped }))
                              setWeightInputBuffer(prev => {
                                const next = { ...prev }
                                delete next[goal.id]
                                return next
                              })
                            }}
                            className="w-16 border border-[#e0e5e3] rounded-md px-2 py-1 text-[13px] text-center focus:outline-none focus:border-[#1D9E75] disabled:bg-gray-50"
                          />
                          <span className="ml-1 text-[12px] text-[#8a9490]">%</span>
                        </>
                      ) : (
                        <span className="text-[#8a9490]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block whitespace-nowrap px-2 py-0.5 rounded text-[11px] font-medium ${
                        ui.status === '제출완료' ? 'bg-[#eff6ff] text-[#3b82f6]' : 'bg-[#f5f5f5] text-[#8a9490]'
                      }`}>{ui.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block whitespace-nowrap px-2 py-0.5 rounded text-[11px] font-medium ${
                        ui.approval === '승인' ? 'bg-[#eaf6f0] text-[#2e9e6e]' :
                        ui.approval === '반려' ? 'bg-[#fef2f2] text-[#ef4444]' :
                        'bg-[#f5f5f5] text-[#8a9490]'
                      }`}>{ui.approval}</span>
                    </td>
                    <td className="px-4 py-3 text-center relative">
                      {canEdit && (
                        <>
                          <button
                            onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === goal.id ? null : goal.id) }}
                            disabled={saving || readOnly}
                            className="text-gray-400 hover:text-[#1D9E75] text-xs transition-colors px-2 py-1 bg-transparent border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="관리"
                          >
                            <i className="fas fa-ellipsis-v" />
                          </button>
                          {openMenuId === goal.id && (
                            <div className="absolute right-4 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 w-28">
                              <button
                                onClick={() => { setOpenMenuId(null); handleEdit(goal) }}
                                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-[#f2faf6] hover:text-[#1D9E75] transition-colors bg-transparent border-none cursor-pointer"
                              >
                                <i className="fas fa-edit mr-2 text-[10px]" />수정
                              </button>
                              <div className="border-t border-gray-100 my-1" />
                              <button
                                onClick={() => { setOpenMenuId(null); handleDelete(goal.id) }}
                                className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors bg-transparent border-none cursor-pointer"
                              >
                                <i className="fas fa-trash-alt mr-2 text-[10px]" />삭제
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {kpiGoals.length > 0 && (
        <p className="text-[12px] text-[#8a9490] text-right mb-6">KPI 목표마다 가중치(%)를 입력하세요. 합계가 100%일 때만 제출할 수 있습니다.</p>
      )}

      {/* 제출 버튼 */}
      <div className="flex justify-end items-center gap-3">
        <button
          onClick={handleSaveWeights}
          disabled={readOnly || savingWeights || saving || kpiGoals.length === 0}
          className="border border-[#1D9E75] bg-white text-[#1D9E75] rounded-lg px-5 py-2.5 text-[13px] font-medium cursor-pointer hover:bg-[#f5faf7] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {savingWeights ? '저장 중...' : '임시저장'}
        </button>
        <button
          onClick={handleSubmitAll}
          className={`rounded-lg px-5 py-2.5 text-[13px] font-medium border-none cursor-pointer transition-colors ${
            allSubmittable && !saving && !readOnly ? 'bg-[#1D9E75] text-white hover:bg-[#0F6E56]' : 'bg-[#d0d8d4] text-white cursor-not-allowed'
          }`}
          disabled={!allSubmittable || saving || readOnly}
          title={weightSum !== 100 ? 'KPI 가중치 합계가 100%가 되어야 제출할 수 있습니다.' : ''}
        >
          {saving ? '처리 중...' : submitLabel}
        </button>
      </div>
    </div>
  )
}
