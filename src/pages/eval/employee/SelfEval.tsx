import { useState, useEffect, useMemo } from 'react'
import { directionLabel, calcAchievementRate } from './kpiTemplates'
import { defaultRules, computeGoalWeights } from '../design/evaluationRulesData'
import {
  fetchMySelfEvaluations,
  saveSelfEvalDraft,
  submitSelfEvalAll,
  uploadSelfEvalFile,
  deleteSelfEvalFile,
  type SelfEvaluationResponse,
  type SelfEvalFileResponse,
  type AchievementLevel,
  type SelfEvalApprovalStatus,
  type SelfEvaluationDraftItem,
} from '../../../api/selfEvaluation'
import { fetchAllKpiTemplates, type KpiTemplateResponse } from '../../../api/kpiTemplate'
import type { GoalType, TaskGrade } from '../../../api/goal'

// 화면 라벨/스타일 ─────────────────────────
type GradeKo = '상' | '중' | '하'
type LevelKo = '우수' | '양호' | '보통' | '부족' | '미흡'

const gradeBackendToKo: Record<TaskGrade, GradeKo> = { HIGH: '상', MID: '중', LOW: '하' }

const levelBackendToKo: Record<AchievementLevel, LevelKo> = {
  EXCELLENT: '우수',
  GOOD: '양호',
  AVERAGE: '보통',
  POOR: '부족',
  INADEQUATE: '미흡',
}

const levelKoToBackend: Record<LevelKo, AchievementLevel> = {
  '우수': 'EXCELLENT',
  '양호': 'GOOD',
  '보통': 'AVERAGE',
  '부족': 'POOR',
  '미흡': 'INADEQUATE',
}

const approvalToKo = (s: SelfEvalApprovalStatus): '대기' | '승인' | '반려' | null => {
  if (s === 'APPROVED') return '승인'
  if (s === 'REJECTED') return '반려'
  if (s === 'PENDING') return '대기'
  return null   // DRAFT: 아직 제출 안 함 → 라벨 없음
}

const achievementOptions: { value: LevelKo; color: string; bg: string }[] = [
  { value: '우수', color: 'text-[#7c3aed]', bg: 'bg-[#faf5ff] border-[#7c3aed]' },
  { value: '양호', color: 'text-[#2e9e6e]', bg: 'bg-[#eaf6f0] border-[#2e9e6e]' },
  { value: '보통', color: 'text-[#3b82f6]', bg: 'bg-[#eff6ff] border-[#3b82f6]' },
  { value: '부족', color: 'text-[#f59e0b]', bg: 'bg-[#fef3cd] border-[#f59e0b]' },
  { value: '미흡', color: 'text-[#ef4444]', bg: 'bg-[#fef2f2] border-[#ef4444]' },
]

const gradeColors: Record<GradeKo, { bg: string; text: string }> = {
  '상': { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]' },
  '중': { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]' },
  '하': { bg: 'bg-[#f8faf9]', text: 'text-[#8a9490]' },
}

const goalTypeColors: Record<GoalType, { bg: string; text: string }> = {
  KPI: { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]' },
  OKR: { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]' },
}

// 로컬 편집용 수정 가능 필드만 분리해서 관리
interface EditState {
  actualValue: number | null
  achievementLevel: LevelKo | null
  achievementDetail: string
  evidence: string
}

const emptyEdit: EditState = {
  actualValue: null,
  achievementLevel: null,
  achievementDetail: '',
  evidence: '',
}

const buildEdit = (r: SelfEvaluationResponse): EditState => ({
  actualValue: r.actualValue,
  achievementLevel: r.achievementLevel ? levelBackendToKo[r.achievementLevel] : null,
  achievementDetail: r.achievementDetail ?? '',
  evidence: r.evidence ?? '',
})

export default function SelfEval() {
  const [responses, setResponses] = useState<SelfEvaluationResponse[]>([])
  const [edits, setEdits] = useState<Record<number, EditState>>({})  // goalId → edit 필드
  const [templates, setTemplates] = useState<KpiTemplateResponse[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  // 초기 로드
  useEffect(() => {
    Promise.all([fetchMySelfEvaluations(), fetchAllKpiTemplates()])
      .then(([resp, tpls]) => {
        setResponses(resp)
        setTemplates(tpls)
        // 로컬 edit state 초기화 — 서버 값 복사
        const m: Record<number, EditState> = {}
        resp.forEach(r => { m[r.goalId] = buildEdit(r) })
        setEdits(m)
      })
      .catch((e: any) => {
        console.error('[SelfEval] load failed', e)
        setError(e?.response?.data?.message || '자기평가 대상을 불러오지 못했습니다.')
      })
      .finally(() => setLoading(false))
  }, [])

  const getEdit = (goalId: number): EditState => edits[goalId] ?? emptyEdit
  const patchEdit = (goalId: number, patch: Partial<EditState>) => {
    setEdits(prev => ({ ...prev, [goalId]: { ...getEdit(goalId), ...patch } }))
  }

  const findTemplate = (kpiTemplateId: number | null): KpiTemplateResponse | undefined =>
    kpiTemplateId ? templates.find(t => t.kpiId === kpiTemplateId) : undefined

  // 파일 크기 표시
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // 편집 가능 여부 - 승인된 건은 편집 불가
  const isEditable = (r: SelfEvaluationResponse) => r.approval !== 'APPROVED'
  // 화면에 "작성 완료" 카운트 기준 — 로컬 edit state 기준으로 계산 (저장 여부와 무관)
  const isFilled = (r: SelfEvaluationResponse): boolean => {
    const e = getEdit(r.goalId)
    if (r.goalType === 'KPI') return e.actualValue !== null && e.achievementDetail.trim().length > 0
    return e.achievementLevel !== null && e.achievementDetail.trim().length > 0
  }

  // 비중: 승인된 KPI 만 모집단 — 승인된 KPI 끼리 100% 정규화
  const scoringGoals = useMemo(
    () => responses.filter(r => r.goalType === 'KPI' && r.approval === 'APPROVED'),
    [responses],
  )
  const weightById = useMemo(() => {
    const map = new Map<number, number>()
    if (scoringGoals.length === 0) return map
    // computeGoalWeights 가 기대하는 shape: { grade: '상'|'중'|'하' }
    const shaped = scoringGoals.map(r => ({ grade: gradeBackendToKo[r.grade] }))
    const ws = computeGoalWeights(shaped, defaultRules.taskGradeWeights)
    scoringGoals.forEach((r, i) => map.set(r.goalId, ws[i]))
    return map
  }, [scoringGoals])

  // 목표 정렬 순서 — 미제출(DRAFT) → 반려 → 대기 → 승인
  const sortedResponses = useMemo(() => {
    const rank: Record<SelfEvalApprovalStatus, number> =
      { DRAFT: 0, REJECTED: 1, PENDING: 2, APPROVED: 3 }
    return [...responses].sort((a, b) => rank[a.approval] - rank[b.approval])
  }, [responses])

  // 편집 가능한 항목들 전부 채워졌는지 — 제출 버튼 활성/비활성
  const editable = responses.filter(isEditable)
  const filledCount = responses.filter(isFilled).length
  const allFilled = editable.length > 0 && editable.every(isFilled)
  const approvedCount = responses.filter(r => r.approval === 'APPROVED').length
  const rejectedCount = responses.filter(r => r.approval === 'REJECTED').length

  // 저장/제출 공통 — 편집 가능한 항목만 payload 로 묶어서 전송
  const buildPayload = (): SelfEvaluationDraftItem[] => {
    return editable.map(r => {
      const e = getEdit(r.goalId)
      return {
        goalId: r.goalId,
        actualValue: r.goalType === 'KPI' ? e.actualValue : null,
        achievementLevel: r.goalType === 'OKR' && e.achievementLevel
          ? levelKoToBackend[e.achievementLevel]
          : null,
        achievementDetail: e.achievementDetail,
        evidence: e.evidence,
      }
    })
  }

  const refreshFromServer = async () => {
    const fresh = await fetchMySelfEvaluations()
    setResponses(fresh)
    const m: Record<number, EditState> = {}
    fresh.forEach(r => { m[r.goalId] = buildEdit(r) })
    setEdits(m)
  }

  const handleDraft = async () => {
    setSaving(true)
    setError(null)
    setInfoMessage(null)
    try {
      await saveSelfEvalDraft({ items: buildPayload() })
      await refreshFromServer()
      setInfoMessage('임시저장 되었습니다.')
    } catch (e: any) {
      console.error('[SelfEval] draft failed', e)
      setError(e?.response?.data?.message || '임시저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    setInfoMessage(null)
    try {
      await submitSelfEvalAll({ items: buildPayload() })
      await refreshFromServer()
      setInfoMessage('자기평가가 제출되었습니다.')
    } catch (e: any) {
      console.error('[SelfEval] submit failed', e)
      setError(e?.response?.data?.message || '제출에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // 파일 업로드 - 서버에서 새 FileResponse 받아서 로컬 state 의 files 배열에 추가
  const handleFileAdd = async (goalId: number, fileList: FileList | null) => {
    console.log('[SelfEval] handleFileAdd called', { goalId, fileCount: fileList?.length })
    if (!fileList || fileList.length === 0) return
    setSaving(true)
    setError(null)
    setInfoMessage(null)
    try {
      const uploadedList: SelfEvalFileResponse[] = []
      for (let i = 0; i < fileList.length; i++) {
        console.log('[SelfEval] uploading file', fileList[i].name)
        const uploaded = await uploadSelfEvalFile(goalId, fileList[i])
        console.log('[SelfEval] upload response', uploaded)
        uploadedList.push(uploaded)
      }
      setResponses(prev => prev.map(r =>
        r.goalId === goalId
          ? { ...r, files: [...(r.files ?? []), ...uploadedList] }
          : r
      ))
      const names = uploadedList.map(f => f.originalFileName).join(', ')
      setInfoMessage(`파일 ${uploadedList.length}개 업로드됨 (${names})`)
    } catch (e: any) {
      console.error('[SelfEval] upload failed', e)
      console.error('[SelfEval] upload error detail', {
        status: e?.response?.status,
        data: e?.response?.data,
        message: e?.message,
      })
      const status = e?.response?.status ? ` (HTTP ${e.response.status})` : ''
      setError((e?.response?.data?.message || e?.message || '파일 업로드에 실패했습니다.') + status)
      // 상단으로 스크롤해서 에러 배너가 바로 보이게
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(false)
    }
  }

  const handleFileRemove = async (goalId: number, fileId: number) => {
    setSaving(true)
    setError(null)
    setInfoMessage(null)
    try {
      await deleteSelfEvalFile(goalId, fileId)
      let removedName = ''
      setResponses(prev => prev.map(r => {
        if (r.goalId !== goalId) return r
        const removed = r.files.find(f => f.fileId === fileId)
        if (removed) removedName = removed.originalFileName
        return { ...r, files: r.files.filter(f => f.fileId !== fileId) }
      }))
      setInfoMessage(removedName ? `파일 삭제됨 (${removedName})` : '파일 삭제됨')
    } catch (e: any) {
      console.error('[SelfEval] delete failed', e)
      setError(e?.response?.data?.message || '파일 삭제에 실패했습니다.')
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
          <div className="text-[20px] font-bold text-[#2e9e6e]">{filledCount}<span className="text-[14px] text-[#8a9490] font-normal"> / {responses.length}</span></div>
        </div>
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

      {/* 현황 요약 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-3 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">전체 업무</div>
          <div className="text-[20px] font-bold text-[#1a2b23]">{responses.length}건</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-3 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">작성 완료</div>
          <div className="text-[20px] font-bold text-[#3b82f6]">{filledCount}건</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-3 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">평가자 승인</div>
          <div className="text-[20px] font-bold text-[#2e9e6e]">{approvedCount}건</div>
        </div>
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-3 text-center">
          <div className="text-[11px] text-[#8a9490] mb-1">반려</div>
          <div className="text-[20px] font-bold text-[#ef4444]">{rejectedCount}건</div>
        </div>
      </div>

      {responses.length === 0 ? (
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-12 text-center">
          <div className="text-[#d0d8d4] text-[40px] mb-3">📋</div>
          <div className="text-[14px] text-[#8a9490]">자기평가 대상 목표가 없습니다. (목표가 승인되어야 자기평가가 가능합니다)</div>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedResponses.map(r => {
            const ko = approvalToKo(r.approval)
            const editable = isEditable(r)
            const isApproved = r.approval === 'APPROVED'
            const isRejected = r.approval === 'REJECTED'
            const gradeKo = gradeBackendToKo[r.grade]
            const template = findTemplate(r.kpiTemplateId)
            const edit = getEdit(r.goalId)
            const rate = r.goalType === 'KPI' && template && r.targetValue !== null && edit.actualValue !== null
              ? calcAchievementRate(template.direction, r.targetValue, edit.actualValue)
              : null
            const weight = weightById.get(r.goalId) ?? 0

            return (
              <div key={r.goalId} className={`bg-white border rounded-lg p-5 ${
                isApproved ? 'border-[#2e9e6e]' : isRejected ? 'border-[#fca5a5]' : 'border-[#e0e5e3]'
              }`}>
                {/* 목표 헤더 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`${goalTypeColors[r.goalType].bg} ${goalTypeColors[r.goalType].text} px-2 py-0.5 rounded text-[11px] font-medium`}>
                      {r.goalType}
                    </span>
                    <span className="bg-[#eaf6f0] text-[#2e9e6e] px-2 py-0.5 rounded text-[11px]">{r.category}</span>
                    <span className={`${gradeColors[gradeKo].bg} ${gradeColors[gradeKo].text} px-1.5 py-0.5 rounded text-[10px] font-medium`}>
                      업무등급 {gradeKo}
                    </span>
                    {weight > 0 && (
                      <span className="bg-[#eff6ff] text-[#3b82f6] px-1.5 py-0.5 rounded text-[10px] font-medium">
                        비중 {weight.toFixed(1)}%
                      </span>
                    )}
                    <span className="font-medium text-[#1a2b23] text-[14px]">{r.title}</span>
                  </div>
                  {ko && (
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      isApproved ? 'bg-[#eaf6f0] text-[#2e9e6e]' :
                      isRejected ? 'bg-[#fef2f2] text-[#ef4444]' :
                      'bg-[#fef3cd] text-[#f59e0b]'
                    }`}>{ko}</span>
                  )}
                </div>

                {r.description && (
                  <div className="text-[12px] text-[#8a9490] mb-4 pl-1">{r.description}</div>
                )}

                {/* 반려 사유 */}
                {isRejected && r.rejectReason && (
                  <div className="bg-[#fef2f2] border border-[#fca5a5] rounded-lg p-3 mb-4">
                    <div className="text-[11px] font-medium text-[#ef4444] mb-1">반려 사유</div>
                    <div className="text-[13px] text-[#7f1d1d]">{r.rejectReason}</div>
                  </div>
                )}

                {/* KPI: 실적 수치 입력 */}
                {r.goalType === 'KPI' && (
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
                        <span className="text-[14px] font-semibold text-[#1a2b23]">{r.targetValue ?? '-'}{r.targetUnit ?? ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#8a9490]">실적:</span>
                        <input
                          type="number"
                          value={edit.actualValue ?? ''}
                          onChange={e => editable && patchEdit(r.goalId, { actualValue: e.target.value === '' ? null : Number(e.target.value) })}
                          disabled={!editable}
                          className={`w-24 border rounded-md px-2 py-1.5 text-[14px] font-semibold text-center ${
                            !editable ? 'border-[#e0e5e3] bg-white text-[#5a6b62]' : 'border-[#e0e5e3] text-[#1a2b23] focus:border-[#3b82f6] focus:outline-none'
                          }`}
                          placeholder="0"
                        />
                        <span className="text-[12px] text-[#8a9490]">{r.targetUnit ?? ''}</span>
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
                {r.goalType === 'OKR' && (
                  <div className="mb-3">
                    <label className="block text-[12px] font-medium text-[#5a6b62] mb-2">달성도 평가</label>
                    <div className="flex gap-2">
                      {achievementOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => editable && patchEdit(r.goalId, { achievementLevel: opt.value })}
                          disabled={!editable}
                          className={`px-4 py-2 rounded-lg text-[12px] font-medium border cursor-pointer transition-colors ${
                            edit.achievementLevel === opt.value
                              ? `${opt.bg} ${opt.color}`
                              : !editable
                              ? 'bg-[#f5f5f5] text-[#d0d8d4] border-[#e0e5e3] cursor-not-allowed'
                              : 'bg-white text-[#8a9490] border-[#e0e5e3] hover:border-[#8a9490]'
                          }`}
                        >
                          {opt.value}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 달성 내용 */}
                <div className="mb-3">
                  <label className="block text-[12px] font-medium text-[#5a6b62] mb-1">달성 내용</label>
                  <textarea
                    value={edit.achievementDetail}
                    onChange={e => editable && patchEdit(r.goalId, { achievementDetail: e.target.value })}
                    disabled={!editable}
                    className={`w-full border rounded-md px-3 py-2 text-[13px] resize-none focus:outline-none ${
                      !editable ? 'border-[#e0e5e3] bg-[#f8faf9] text-[#5a6b62]' : 'border-[#e0e5e3] focus:border-[#2e9e6e]'
                    }`}
                    rows={3}
                    placeholder="해당 업무에 대해 어떤 성과를 이뤘는지 구체적으로 작성하세요"
                  />
                </div>

                {/* 실적 근거 */}
                <div>
                  <label className="block text-[12px] font-medium text-[#5a6b62] mb-1">실적 근거 <span className="text-[#8a9490] font-normal">(선택)</span></label>
                  <textarea
                    value={edit.evidence}
                    onChange={e => editable && patchEdit(r.goalId, { evidence: e.target.value })}
                    disabled={!editable}
                    className={`w-full border rounded-md px-3 py-2 text-[13px] resize-none focus:outline-none ${
                      !editable ? 'border-[#e0e5e3] bg-[#f8faf9] text-[#5a6b62]' : 'border-[#e0e5e3] focus:border-[#2e9e6e]'
                    }`}
                    rows={2}
                    placeholder="달성 내용을 뒷받침하는 근거 (예: 리포트, 보고서, 자격증 등)"
                  />

                  {/* 파일 첨부 */}
                  <div className="mt-2">
                    <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-[12px] ${
                      !editable || saving ? 'border-[#e0e5e3] bg-[#f8faf9] text-[#8a9490] cursor-not-allowed' : 'border-[#e0e5e3] bg-white text-[#5a6b62] cursor-pointer hover:bg-[#f5f5f5]'
                    }`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                      </svg>
                      {saving ? '처리 중...' : '파일 첨부'}
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        disabled={!editable || saving}
                        onChange={e => { handleFileAdd(r.goalId, e.target.files); e.target.value = '' }}
                      />
                    </label>

                    {r.files.length > 0 && (
                      <div className="mt-3">
                        <div className="text-[11px] font-medium text-[#2e9e6e] mb-1.5 flex items-center gap-1.5">
                          <i className="fas fa-paperclip text-[10px]" />
                          첨부된 파일 <span className="text-[#8a9490] font-normal">({r.files.length})</span>
                        </div>
                        <div className="space-y-1">
                        {r.files.map(f => (
                          <div key={f.fileId} className="flex items-center justify-between bg-[#f8faf9] border border-[#e0e5e3] rounded-md px-2.5 py-1.5 text-[12px]">
                            <div className="flex items-center gap-2 min-w-0">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5a6b62" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              <span className="truncate text-[#1a2b23]">{f.originalFileName}</span>
                              <span className="text-[#8a9490] shrink-0">{formatSize(f.fileSize)}</span>
                            </div>
                            {editable && (
                              <button
                                onClick={() => handleFileRemove(r.goalId, f.fileId)}
                                disabled={saving}
                                className="text-[#8a9490] hover:text-[#ef4444] ml-2 shrink-0 border-none bg-transparent cursor-pointer disabled:opacity-50"
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
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex justify-end mt-6 gap-3">
        <button
          onClick={handleDraft}
          disabled={saving || editable.length === 0}
          className="border border-[#e0e5e3] bg-white rounded-lg px-5 py-2.5 text-[13px] cursor-pointer hover:bg-[#f5f5f5] disabled:opacity-50"
        >
          {saving ? '처리 중...' : '임시 저장'}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!allFilled || saving}
          className={`rounded-lg px-5 py-2.5 text-[13px] font-medium border-none cursor-pointer transition-colors ${
            allFilled && !saving ? 'bg-[#1D9E75] text-white hover:bg-[#0F6E56]' : 'bg-[#d0d8d4] text-white cursor-not-allowed'
          }`}
        >
          {saving ? '처리 중...' : '자기평가 제출'}
        </button>
      </div>
    </div>
  )
}
