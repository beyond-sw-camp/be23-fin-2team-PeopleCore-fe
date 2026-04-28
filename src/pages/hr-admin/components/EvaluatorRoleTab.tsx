import { useEffect, useMemo, useState } from 'react'
import {
  evaluatorRoleApi,
  type DeptOverride,
  type DeptResolution,
  type EvaluatorRoleMode,
} from '../../../api/evaluatorRole'
import { gradeApi, titleApi } from '../../../api/org'

interface TargetItem {
  id: number
  name: string
  subLabel?: string
}

export default function EvaluatorRoleTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<EvaluatorRoleMode>('GRADE')
  const [grades, setGrades] = useState<TargetItem[]>([])
  const [titles, setTitles] = useState<TargetItem[]>([])
  const [grantedId, setGrantedId] = useState<number | null>(null)

  // preview 결과 (부서별 매칭) + 사용자 선택한 override
  const [previewDepts, setPreviewDepts] = useState<DeptResolution[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [overrides, setOverrides] = useState<Record<number, number>>({})  // deptId → empId

  const [dirty, setDirty] = useState(false)
  const [modeSwitchTo, setModeSwitchTo] = useState<EvaluatorRoleMode | null>(null)
  const [error, setError] = useState<string | null>(null)

  const targets = useMemo(() => (mode === 'GRADE' ? grades : titles), [mode, grades, titles])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [{ data: config }, { data: gradeList }, { data: titleList }] = await Promise.all([
        evaluatorRoleApi.getConfig(),
        gradeApi.getList(),
        titleApi.getList(),
      ])
      setGrades(gradeList.map(g => ({ id: g.gradeId, name: g.gradeName })))
      setTitles(
        titleList.map(t => ({
          id: t.titleId,
          name: t.titleName,
          subLabel: t.deptName ?? '전사',
        })),
      )
      setMode(config.mode)
      setGrantedId(config.grantedTargetId)
      // 저장된 override 를 Map 으로 복원
      const map: Record<number, number> = {}
      config.overrides.forEach(o => { map[o.deptId] = o.empId })
      setOverrides(map)
      setDirty(false)

      // 이미 저장된 값 있으면 preview 도 불러와서 표시
      if (config.grantedTargetId !== null) {
        await fetchPreview(config.mode, config.grantedTargetId)
      } else {
        setPreviewDepts([])
      }
    } catch (e) {
      console.error('[EvaluatorRoleTab] load 실패', e)
      setError('설정을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 선택 바뀔 때마다 preview 재조회
  const fetchPreview = async (m: EvaluatorRoleMode, id: number) => {
    setPreviewLoading(true)
    try {
      const { data } = await evaluatorRoleApi.preview(m, id)
      setPreviewDepts(data.depts)
    } catch (e) {
      console.error('[EvaluatorRoleTab] preview 실패', e)
      setPreviewDepts([])
    } finally {
      setPreviewLoading(false)
    }
  }

  const selectTarget = (id: number) => {
    setGrantedId(id)
    setOverrides({})  // 새 선택 시 기존 override 초기화
    setDirty(true)
    fetchPreview(mode, id)
  }

  const pickDeptEmp = (deptId: number, empId: number) => {
    setOverrides(prev => ({ ...prev, [deptId]: empId }))
    setDirty(true)
  }

  const confirmModeSwitch = () => {
    if (!modeSwitchTo) return
    setMode(modeSwitchTo)
    setGrantedId(null)
    setOverrides({})
    setPreviewDepts([])
    setDirty(true)
    setModeSwitchTo(null)
  }

  // 저장 가능 여부: target 선택됨 + 모든 conflict 부서에 override 지정됨
  const conflictDepts = previewDepts.filter(d => d.conflict)
  const unresolvedDepts = conflictDepts.filter(d => !(d.deptId in overrides))
  const canSave = grantedId !== null && unresolvedDepts.length === 0

  const save = async () => {
    if (grantedId == null) {
      setError('대상을 선택해야 합니다.')
      return
    }
    if (unresolvedDepts.length > 0) {
      setError(`다음 부서에 평가자를 지정해주세요: ${unresolvedDepts.map(d => d.deptName).join(', ')}`)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const overrideList: DeptOverride[] = Object.entries(overrides).map(([deptId, empId]) => ({
        deptId: Number(deptId),
        empId,
      }))
      const { data } = await evaluatorRoleApi.updateConfig({
        mode,
        grantedTargetId: grantedId,
        overrides: overrideList,
      })
      setMode(data.mode)
      setGrantedId(data.grantedTargetId)
      const map: Record<number, number> = {}
      data.overrides.forEach(o => { map[o.deptId] = o.empId })
      setOverrides(map)
      setDirty(false)
    } catch (e: unknown) {
      console.error('[EvaluatorRoleTab] 저장 실패', e)
      const err = e as { response?: { data?: { message?: string }; status?: number }; message?: string }
      const backendMsg = err?.response?.data?.message
      const status = err?.response?.status
      if (status === 403) {
        setError('인사 최고 관리자만 평가자 설정을 저장할 수 있습니다.')
      } else if (backendMsg) {
        setError(backendMsg)
      } else {
        setError('저장에 실패했습니다.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px] text-gray-400 text-[13px]">
        <i className="fa-solid fa-spinner fa-spin mr-2" /> 불러오는 중...
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[18px] font-bold text-gray-800 mb-1">성과 평가권한</h1>
        <p className="text-[12px] text-gray-500">
          성과관리의 평가자 메뉴(목표 승인·달성도 검토·팀원 평가·팀 결과)를 볼 수 있는 대상을 <b>직급 또는 직책</b> 중 한 축에서 <b>하나</b>만 지정합니다.
          같은 부서에 해당 직급/직책 보유자가 여러 명이면 부서별로 1명을 지정합니다.
        </p>
      </div>

      {/* 1단계: mode + target 선택 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[13px] font-semibold text-gray-800">역할 부여 기준</div>
            <div className="text-[11px] text-gray-400 mt-0.5">
              모드를 전환하면 현재 선택이 초기화됩니다.
            </div>
          </div>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['GRADE', 'TITLE'] as const).map(m => (
              <button
                key={m}
                onClick={() => {
                  if (m === mode) return
                  if (grantedId !== null || dirty) {
                    setModeSwitchTo(m)
                  } else {
                    setMode(m)
                  }
                }}
                className={`px-4 py-1.5 text-[12px] rounded-md transition-colors ${
                  mode === m
                    ? 'bg-white text-[#1D9E75] font-semibold shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'GRADE' ? '직급' : '직책'}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-gray-500 bg-gray-50 rounded px-3 py-2">
          <i className="fa-solid fa-circle-info mr-1.5 text-gray-400" />
          {mode === 'GRADE'
            ? '직급을 기준으로 평가자 역할이 부여됩니다. 같은 부서에 같은 직급 보유자가 여러 명이면 아래에서 1명을 지정합니다.'
            : '직책을 기준으로 평가자 역할이 부여됩니다. 같은 부서에 같은 직책 보유자가 여러 명이면 아래에서 1명을 지정합니다.'}
        </div>
      </div>

      {/* 2단계: 라디오 선택 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="text-[13px] font-semibold text-gray-800">
            {mode === 'GRADE' ? '직급 선택' : '직책 선택'}
          </div>
          <div className="text-[11px] text-gray-500">
            {grantedId !== null
              ? `선택됨: ${targets.find(t => t.id === grantedId)?.name ?? '-'}`
              : '미선택'}
          </div>
        </div>

        {targets.length === 0 ? (
          <div className="px-4 py-10 text-center text-[12px] text-gray-400">
            {mode === 'GRADE' ? '등록된 직급이 없습니다.' : '등록된 직책이 없습니다.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {targets.map(t => {
              const checked = grantedId === t.id
              return (
                <label
                  key={t.id}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                    checked ? 'bg-[#F1FAF5]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="evaluator-role-target"
                      checked={checked}
                      onChange={() => selectTarget(t.id)}
                      className="w-4 h-4 accent-[#1D9E75]"
                    />
                    <span className="text-[13px] text-gray-800">{t.name}</span>
                  </div>
                  {t.subLabel && (
                    <span className="text-[11px] text-gray-500">{t.subLabel}</span>
                  )}
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* 3단계: 부서별 결과 */}
      {grantedId !== null && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="text-[13px] font-semibold text-gray-800">부서별 평가자</div>
            <div className="text-[11px] text-gray-500">
              {previewLoading
                ? '계산 중...'
                : `${previewDepts.length}개 부서 · 충돌 ${conflictDepts.length}개 · 미지정 ${unresolvedDepts.length}개`}
            </div>
          </div>

          {previewLoading ? (
            <div className="px-4 py-10 text-center text-[12px] text-gray-400">
              <i className="fa-solid fa-spinner fa-spin mr-2" /> 부서별 매칭 계산 중...
            </div>
          ) : previewDepts.length === 0 ? (
            <div className="px-4 py-10 text-center text-[12px] text-gray-400">
              해당하는 부서가 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {previewDepts.map(d => {
                // 매칭 0명
                if (d.candidates.length === 0) {
                  return (
                    <div key={d.deptId} className="flex items-center justify-between px-4 py-3">
                      <span className="text-[13px] text-gray-800">{d.deptName}</span>
                      <span className="text-[11px] text-gray-400">해당 인원 없음</span>
                    </div>
                  )
                }
                // 매칭 1명 — 자동 배정
                if (d.candidates.length === 1) {
                  const only = d.candidates[0]
                  return (
                    <div key={d.deptId} className="flex items-center justify-between px-4 py-3">
                      <span className="text-[13px] text-gray-800">{d.deptName}</span>
                      <span className="text-[12px] text-[#1D9E75]">
                        <i className="fa-solid fa-user-check mr-1.5" />
                        {only.empName}
                      </span>
                    </div>
                  )
                }
                // 매칭 2명+ — 드롭다운으로 선택
                const picked = overrides[d.deptId]
                const isUnresolved = picked === undefined
                return (
                  <div
                    key={d.deptId}
                    className={`flex items-center justify-between px-4 py-3 ${
                      isUnresolved ? 'bg-amber-50/60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-gray-800">{d.deptName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                        {d.candidates.length}명 — 1명 지정 필요
                      </span>
                    </div>
                    <select
                      value={picked ?? ''}
                      onChange={e => pickDeptEmp(d.deptId, Number(e.target.value))}
                      className={`text-[12px] border rounded px-2 py-1 ${
                        isUnresolved ? 'border-amber-300' : 'border-gray-200'
                      }`}
                    >
                      <option value="" disabled>선택...</option>
                      {d.candidates.map(c => (
                        <option key={c.empId} value={c.empId}>{c.empName}</option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          <i className="fa-solid fa-triangle-exclamation mr-1.5" />
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={load}
          disabled={!dirty || saving}
          className="px-4 py-2 text-[12px] text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
        >
          변경 취소
        </button>
        <button
          onClick={save}
          disabled={!dirty || saving || !canSave}
          className="px-5 py-2 text-[12px] text-white bg-[#1D9E75] rounded-lg hover:opacity-90 disabled:opacity-40"
          title={!canSave && unresolvedDepts.length > 0 ? '충돌 부서 지정 필요' : undefined}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      {modeSwitchTo && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={() => setModeSwitchTo(null)}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative bg-white rounded-xl shadow-2xl w-[min(360px,calc(100vw-24px))] p-6 text-center"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-[14px] font-bold text-gray-800 mb-2">
              {modeSwitchTo === 'GRADE' ? '직급 기준으로 전환' : '직책 기준으로 전환'}
            </h3>
            <p className="text-[12px] text-gray-500 mb-5 whitespace-pre-line">
              {`현재 ${mode === 'GRADE' ? '직급' : '직책'} 선택과 부서별 지정이 초기화됩니다.\n저장 전까지는 적용되지 않습니다.`}
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setModeSwitchTo(null)}
                className="px-5 py-2 text-[12px] text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={confirmModeSwitch}
                className="px-5 py-2 text-[12px] text-white bg-[#1D9E75] rounded-lg hover:opacity-90"
              >
                전환
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
