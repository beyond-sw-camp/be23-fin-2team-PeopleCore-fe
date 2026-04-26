import React, { useState, useEffect, useMemo } from 'react'
import {
  fetchMyGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  submitAllDrafts,
  type GoalResponse,
  type GoalRequest,
  type GoalType,
  type TaskGrade,
} from '../../../api/goal'
import {
  fetchAllKpiTemplates,
  type KpiTemplateResponse,
  type KpiDirection,
} from '../../../api/kpiTemplate'
import { fetchKpiOptionBundle } from '../../../api/kpiOption'
import { departmentApi, type DepartmentTreeResponse } from '../../../api/org'
import { useStageReadOnly } from '../../../components/eval/StageGate'

// 화면 표시용 한글 등급 라벨
type GradeKo = '상' | '중' | '하'

const gradeBackendToKo: Record<TaskGrade, GradeKo> = {
  HIGH: '상',
  MID: '중',
  LOW: '하',
}

const gradeKoToBackend: Record<GradeKo, TaskGrade> = {
  '상': 'HIGH',
  '중': 'MID',
  '하': 'LOW',
}

const directionLabel: Record<KpiDirection, string> = {
  UP: '상승 목표',
  DOWN: '하강 목표',
  MAINTAIN: '유지 목표',
}

const gradeStyle: Record<GradeKo, string> = {
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
  grade: GradeKo
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

// 백엔드 승인상태 → UI 라벨 (status, approval 두 컬럼)
function approvalToUi(approval: GoalResponse['approval']): { status: string; approval: string } {
  switch (approval) {
    case 'DRAFT':    return { status: '작성중',   approval: '대기' }
    case 'PENDING':  return { status: '제출완료', approval: '대기' }
    case 'APPROVED': return { status: '제출완료', approval: '승인' }
    case 'REJECTED': return { status: '제출완료', approval: '반려' }
  }
}

export default function GoalRegister() {
  const [goals, setGoals] = useState<GoalResponse[]>([])
  const [templates, setTemplates] = useState<KpiTemplateResponse[]>([])
  const [deptTree, setDeptTree] = useState<DepartmentTreeResponse[]>([])
  const [departmentLevel, setDepartmentLevel] = useState<string>('leaf')  // KpiOption 정책
  const [newGoal, setNewGoal] = useState<FormState>(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 단계 마감 후에도 페이지는 보이지만 쓰기 액션은 차단
  const readOnly = useStageReadOnly()

  // 초기 로드: 내 목표 + KPI 템플릿 + 부서 트리 + KpiOption 정책
  useEffect(() => {
    Promise.all([
      fetchMyGoals(),
      fetchAllKpiTemplates(),
      departmentApi.getTree().then(r => r.data).catch(() => []),
      fetchKpiOptionBundle().catch(() => ({ categories: [], units: [], departmentLevel: 'leaf' })),
    ])
      .then(([gs, ts, tree, bundle]) => {
        setGoals(gs)
        setTemplates(ts)
        setDeptTree(tree)
        setDepartmentLevel(bundle.departmentLevel)
      })
      .catch((e: any) => {
        console.error('[GoalRegister] load failed', e)
        setError(e?.response?.data?.message || '데이터를 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [])

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

  // 정책에 맞는 템플릿만 노출
  //   - departmentLevel = "leaf"  → leaf 부서 소속 템플릿만
  //   - departmentLevel = "1".."N" → 해당 depth 부서 소속 템플릿만
  const availableTemplates = useMemo(() => {
    if (templates.length === 0) return templates
    if (departmentLevel === 'leaf') {
      return templates.filter(t => leafSet.has(t.deptId))
    }
    const targetDepth = Number(departmentLevel)
    if (!Number.isFinite(targetDepth)) return templates
    return templates.filter(t => depthMap.get(t.deptId) === targetDepth)
  }, [templates, departmentLevel, depthMap, leafSet])

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
      grade: gradeBackendToKo[goal.grade],
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
    const grade = gradeKoToBackend[newGoal.grade]
    if (newGoal.goalType === 'KPI') {
      if (!selectedTemplate) return null
      if (!newGoal.targetValue) return null
      return {
        goalType: 'KPI',
        grade,
        kpiTemplateId: selectedTemplate.kpiId,
        targetValue: Number(newGoal.targetValue),
      }
    }
    if (!newGoal.title.trim()) return null
    return {
      goalType: 'OKR',
      grade,
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
        setGoals(prev => prev.filter(g => g.id !== id && !result.cascadedOkrs.some(o => o.goalId === g.id)))
        return
      }

      // cascade 없이 정상 삭제됨
      setGoals(prev => prev.filter(g => g.id !== id))
    } catch (e: any) {
      console.error('[GoalRegister] delete failed', e)
      setError(e?.response?.data?.message || '삭제에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitAll = async () => {
    if (readOnly) return
    setSaving(true)
    setError(null)
    try {
      const updated = await submitAllDrafts()
      // 전체 재갱신 (반환 리스트가 회사 규칙 기준 비율까지 재계산된 상태일 수 있음)
      const fresh = await fetchMyGoals()
      setGoals(fresh.length > 0 ? fresh : updated)
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
  const allSubmittable = pendingGoals.length > 0 && pendingGoals.every(g => g.title.trim())
  const submitLabel =
    pendingGoals.length === 0 ? '제출 완료' :
    draftGoals.length > 0 && rejectedGoals.length > 0 ? `미제출 ${pendingGoals.length}건 제출` :
    rejectedGoals.length > 0 ? `반려 ${rejectedGoals.length}건 재제출` :
    `작성중 ${draftGoals.length}건 제출`
  const kpiCount = goals.filter(g => g.goalType === 'KPI').length
  const okrCount = goals.filter(g => g.goalType === 'OKR').length
  const approvedCount = goals.filter(g => g.approval === 'APPROVED').length
  const rejectedCount = goals.filter(g => g.approval === 'REJECTED').length
  const draftCount = goals.filter(g => g.approval === 'DRAFT').length

  const canSave = newGoal.goalType === 'KPI'
    ? selectedTemplate !== undefined && newGoal.targetValue !== ''
    : newGoal.title.trim().length > 0

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-sm text-gray-400">
        <i className="fas fa-spinner fa-spin mr-2" /> 불러오는 중...
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(개인) &gt; 목표 등록</div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">목표 등록/수정</h1>
          <p className="text-[13px] text-[#8a9490]">본인의 평가 목표를 등록·수정합니다. KPI는 인사팀이 등록한 지표를 선택합니다.</p>
        </div>
        <button
          onClick={() => { if (readOnly) return; setEditingId(null); setNewGoal(emptyForm); setShowForm(true); setError(null) }}
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
              {(['상', '중', '하'] as GradeKo[]).map(g => (
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
                    const tpl = templates.find(t => t.kpiId === id)
                    setNewGoal({
                      ...newGoal,
                      kpiTemplateId: id,
                      targetValue: '',
                      // 지표 선택 시 구분(카테고리) 자동 설정 — 입력 불가 드롭다운에 반영
                      category: tpl ? tpl.categoryLabel : newGoal.category,
                    })
                  }}
                  className="w-full border border-[#e0e5e3] rounded-md px-3 py-2 text-[13px]"
                >
                  <option value="">— 지표를 선택하세요 —</option>
                  {availableTemplates.map(t => (
                    <option key={t.kpiId} value={t.kpiId}>{t.name}</option>
                  ))}
                </select>
                {availableTemplates.length === 0 && (
                  <p className="mt-1 text-[11px] text-[#ef4444]">등록된 KPI 지표가 없습니다.</p>
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
              disabled={!canSave || saving || readOnly}
              className={`rounded-lg px-4 py-2 text-[13px] font-medium border-none ${
                canSave && !saving && !readOnly ? 'bg-[#1D9E75] text-white cursor-pointer hover:bg-[#0F6E56]' : 'bg-[#d0d8d4] text-white cursor-not-allowed'
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
            {goals.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-10 text-center text-[13px] text-[#8a9490]">등록된 목표가 없습니다.</td></tr>
            ) : goals.map(goal => {
              const gradeKo = gradeBackendToKo[goal.grade]
              const ui = approvalToUi(goal.approval)
              const canEdit = goal.approval === 'DRAFT' || goal.approval === 'REJECTED'
              return (
                <React.Fragment key={goal.id}>
                  <tr className="border-b border-[#f0f2f1] hover:bg-[#fafbfa]">
                    <td className="px-4 py-3 text-center">
                      <span className={`${goalTypeColors[goal.goalType].bg} ${goalTypeColors[goal.goalType].text} px-2 py-0.5 rounded text-[11px] font-medium`}>
                        {goal.goalType}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="bg-[#eaf6f0] text-[#2e9e6e] px-2 py-0.5 rounded text-[11px] whitespace-nowrap">{goal.category}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${gradeStyle[gradeKo]}`}>
                        {gradeKo}
                      </span>
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
                      {goal.ratio !== null ? (
                        <span className="text-[#1a2b23] font-semibold">{goal.ratio}%</span>
                      ) : (
                        <span className="text-[#b0b8b4] text-[11px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        ui.status === '제출완료' ? 'bg-[#eff6ff] text-[#3b82f6]' : 'bg-[#f5f5f5] text-[#8a9490]'
                      }`}>{ui.status}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        ui.approval === '승인' ? 'bg-[#eaf6f0] text-[#2e9e6e]' :
                        ui.approval === '반려' ? 'bg-[#fef2f2] text-[#ef4444]' :
                        'bg-[#f5f5f5] text-[#8a9490]'
                      }`}>{ui.approval}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {canEdit && (
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => handleEdit(goal)} disabled={saving || readOnly} className="text-[#3b82f6] bg-transparent border-none text-[12px] cursor-pointer hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline">수정</button>
                          <button onClick={() => handleDelete(goal.id)} disabled={saving || readOnly} className="text-[#ef4444] bg-transparent border-none text-[12px] cursor-pointer hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline">삭제</button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {goal.approval === 'REJECTED' && goal.rejectReason && (
                    <tr className="border-b border-[#f0f2f1]">
                      <td colSpan={10} className="px-4 py-2 bg-[#fef2f2] text-[12px]">
                        <span className="text-[#ef4444] font-semibold mr-2">반려 사유</span>
                        <span className="text-[#5a6b62]">{goal.rejectReason}</span>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 제출 버튼 */}
      <div className="flex justify-end mt-6 gap-3">
        <button
          onClick={handleSubmitAll}
          className={`rounded-lg px-5 py-2.5 text-[13px] font-medium border-none cursor-pointer transition-colors ${
            allSubmittable && !saving && !readOnly ? 'bg-[#1D9E75] text-white hover:bg-[#0F6E56]' : 'bg-[#d0d8d4] text-white cursor-not-allowed'
          }`}
          disabled={!allSubmittable || saving || readOnly}
        >
          {saving ? '처리 중...' : submitLabel}
        </button>
      </div>
    </div>
  )
}
