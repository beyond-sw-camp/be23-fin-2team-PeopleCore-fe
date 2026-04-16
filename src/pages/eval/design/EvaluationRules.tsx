import { useState, useEffect } from 'react'
import {
  defaultRules,
  gradePalette,
  type EvalItem,
  type AdjustItem,
  type GradeItem,
  type RulesState,
} from './evaluationRulesData'
import { useDraftSeasons } from '../../../stores/seasonsStore'
import { fetchRules, saveRules, toFrontendRules } from '../../../api/evalRules'

const uid = () => Math.random().toString(36).slice(2, 9)

export default function EvaluationRules() {
  const seasons = useDraftSeasons()
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null)
  const [rules, setRules] = useState<RulesState>(defaultRules)
  const [dirty, setDirty] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 시즌 로드 후 첫 번째 시즌 자동 선택
  useEffect(() => {
    if (selectedSeasonId === null && seasons.length > 0) {
      setSelectedSeasonId(seasons[0].id)
    }
  }, [seasons, selectedSeasonId])

  const currentSeason = seasons.find(s => s.id === selectedSeasonId)
  const seasonId = currentSeason?.id ?? null

  // 시즌 변경 시 백엔드에서 규칙 조회
  useEffect(() => {
    if (!seasonId) return
    setLoading(true)
    fetchRules(seasonId)
      .then(dto => {
        if (dto) {
          setRules(toFrontendRules(dto))
        } else {
          setRules(defaultRules)
        }
        setDirty(false)
      })
      .catch(() => {
        setRules(defaultRules)
        setDirty(false)
      })
      .finally(() => setLoading(false))
  }, [seasonId])

  const patch = (p: Partial<RulesState>) => {
    setRules(r => ({ ...r, ...p }))
    setDirty(true)
  }

  // ── 평가 항목 조작 ────────────────────────────────
  const addItem = () => {
    patch({
      items: [...rules.items, { id: uid(), name: '새 항목', weight: 0 }],
    })
  }

  const updateItem = (id: string, f: Partial<EvalItem>) => {
    patch({ items: rules.items.map(it => (it.id === id ? { ...it, ...f } : it)) })
  }

  const removeItem = (id: string) => {
    if (rules.items.length <= 1) return
    // 잠금 항목(자기평가/상위자평가)은 삭제 불가
    const target = rules.items.find(it => it.id === id)
    if (target?.locked) return
    patch({ items: rules.items.filter(it => it.id !== id) })
  }

  // ── 가감 항목 조작 ──────────────────────────────
  const addAdjust = () => {
    patch({
      adjustments: [...rules.adjustments, { id: uid(), name: '새 항목', points: 0, enabled: true }],
    })
  }

  const updateAdjust = (id: string, f: Partial<AdjustItem>) => {
    patch({ adjustments: rules.adjustments.map(a => (a.id === id ? { ...a, ...f } : a)) })
  }

  const removeAdjust = (id: string) => {
    patch({ adjustments: rules.adjustments.filter(a => a.id !== id) })
  }

  // ── 등급 조작 ────────────────────────────────────
  const addGrade = () => {
    const newId = uid()
    patch({
      grades: [...rules.grades, {
        id: newId,
        label: `G${rules.grades.length + 1}`,
        ratio: 0,
        color: gradePalette[rules.grades.length % gradePalette.length],
      }],
      rawScoreTable: [...rules.rawScoreTable, { gradeId: newId, rawScore: 50 }],
    })
  }

  const updateGrade = (id: string, f: Partial<GradeItem>) => {
    patch({ grades: rules.grades.map(g => (g.id === id ? { ...g, ...f } : g)) })
  }

  const updateRawScore = (gradeId: string, rawScore: number) => {
    const exists = rules.rawScoreTable.some(r => r.gradeId === gradeId)
    patch({
      rawScoreTable: exists
        ? rules.rawScoreTable.map(r => r.gradeId === gradeId ? { ...r, rawScore } : r)
        : [...rules.rawScoreTable, { gradeId, rawScore }],
    })
  }

  const removeGrade = (id: string) => {
    if (rules.grades.length <= 2) return
    patch({
      grades: rules.grades.filter(g => g.id !== id),
      rawScoreTable: rules.rawScoreTable.filter(r => r.gradeId !== id),
    })
  }

  // ── 검증 ────────────────────────────────────────
  // 가중치 합계 - 비활성화된 잠금 항목은 제외
  const weightSum = rules.items.reduce((s, it) => {
    if (it.locked && it.enabled === false) return s
    return s + it.weight
  }, 0)
  const gradeSum = rules.grades.reduce((s, g) => s + g.ratio, 0)
  const weightValid = weightSum === 100
  const gradeValid = gradeSum === 100
  const gradeOrderValid = rules.grades.every((g, i) => {
    if (i === 0) return true
    const curr = rules.rawScoreTable.find(r => r.gradeId === g.id)?.rawScore
    const prev = rules.rawScoreTable.find(r => r.gradeId === rules.grades[i - 1].id)?.rawScore
    if (curr == null || prev == null) return true
    return prev > curr
  })

  const canSave = weightValid && gradeValid && gradeOrderValid && dirty && rules.items.every(it => it.name.trim()) && rules.grades.every(g => g.label.trim())

  // 저장 — 백엔드 PUT /eval/rules/{seasonId}
  const handleSave = async () => {
    if (!seasonId) return
    if (!confirm('현재 설정을 저장하시겠습니까?')) return

    setSaving(true)
    try {
      const dto = await saveRules(seasonId, rules)
      setRules(toFrontendRules(dto))
      setDirty(false)
    } catch (e: any) {
      alert(e?.response?.data?.message ?? '저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // 기본값 복원 — 프론트 defaultRules 로 리셋 (저장 전까지 서버 반영 안 됨)
  const handleReset = () => {
    if (!confirm('기본값으로 복원하시겠습니까? 저장하지 않은 변경사항은 초기화됩니다.')) return
    setRules(defaultRules)
    setDirty(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-[14px] text-[#8a9490]">규칙 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* 안내 */}
      <div className="p-4 bg-[#f2faf6] border border-[#d4ecdd] rounded-lg text-[12px] text-gray-700">
        <div className="font-semibold text-[#1D9E75] mb-1">평가 규칙 설정</div>
        시즌별 평가 항목·가중치, 전사 등급 체계, 팀장 편향 보정을 자유롭게 구성합니다. 항목·등급 모두 추가/삭제 가능합니다.
      </div>

      {/* 시즌 */}
      <div className="flex items-center gap-2">
        <label className="text-[12px] text-gray-600">적용 시즌</label>
        <select
          value={selectedSeasonId ?? ''}
          onChange={e => setSelectedSeasonId(Number(e.target.value))}
          className="border border-gray-200 rounded-md px-3 py-2 text-[12px]"
        >
          {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* ① 평가 항목 (동적) */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[14px] font-semibold text-gray-800">① 평가 항목 및 가중치</h3>
          <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
            weightValid ? 'bg-[#eaf6f0] text-[#2e9e6e]' : 'bg-[#fef2f2] text-[#ef4444]'
          }`}>
            합계 {weightSum}% {weightValid ? '✓' : '(100%여야 함)'}
          </span>
        </div>
        <p className="text-[11px] text-gray-400 mb-3">종합점수를 구성하는 항목들. 각 항목별로 사원/팀장이 실제 점수를 입력합니다.</p>

        <div className="border border-gray-200 rounded-md overflow-hidden">
          <table className="w-full text-[12px] table-fixed">
            <colgroup>
              <col className="w-[60px]" />
              <col className="w-[180px]" />
              <col />
              <col className="w-[140px]" />
              <col className="w-[80px]" />
            </colgroup>
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-3 py-2 text-center">사용</th>
                <th className="px-3 py-2 text-left">항목명</th>
                <th></th>
                <th className="px-3 py-2 text-center">가중치(%)</th>
                <th className="px-3 py-2 text-center">삭제</th>
              </tr>
            </thead>
            <tbody>
              {rules.items.map(it => {
                const isLocked = !!it.locked
                const isDisabled = isLocked && it.enabled === false
                return (
                  <tr key={it.id} className={`border-t border-gray-100 ${isDisabled ? 'bg-gray-50/50' : ''}`}>
                    {/* 사용 여부 - 잠금 항목만 체크박스 노출, 일반 항목은 항상 사용 */}
                    <td className="px-3 py-2 text-center">
                      {isLocked ? (
                        <input
                          type="checkbox"
                          checked={it.enabled !== false}
                          onChange={e => updateItem(it.id, { enabled: e.target.checked })}
                          className="w-4 h-4 cursor-pointer accent-[#1D9E75]"
                          title={it.enabled !== false ? '사용 중 (클릭하여 비활성)' : '비활성 (클릭하여 사용)'}
                        />
                      ) : (
                        <span className="text-[10px] text-gray-400">—</span>
                      )}
                    </td>

                    {/* 항목명 - 잠금 항목은 readonly + 뱃지 */}
                    <td className="px-3 py-2">
                      {isLocked ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[12px] font-medium ${isDisabled ? 'text-gray-400' : 'text-[#1a2b23]'}`}>
                            {it.name}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-[#eaf6f0] text-[#1D9E75] rounded font-medium">
                            필수
                          </span>
                        </div>
                      ) : (
                        <input
                          value={it.name}
                          onChange={e => updateItem(it.id, { name: e.target.value })}
                          className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-[12px]"
                          placeholder="예: 동료평가, 프로젝트 공헌"
                        />
                      )}
                    </td>
                    <td></td>

                    {/* 가중치 - 비활성 시 disabled */}
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        value={it.weight}
                        onChange={e => updateItem(it.id, { weight: Number(e.target.value) })}
                        disabled={isDisabled}
                        className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-[12px] text-center disabled:bg-gray-100 disabled:text-gray-400"
                        min={0} max={100}
                      />
                    </td>

                    {/* 삭제 - 잠금 항목은 숨김 */}
                    <td className="px-3 py-2 text-center">
                      {isLocked ? (
                        <span className="text-[10px] text-gray-300">—</span>
                      ) : (
                        <button
                          onClick={() => removeItem(it.id)}
                          className="text-[#ef4444] hover:underline"
                        >
                          삭제
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <button
          onClick={addItem}
          className="mt-3 px-3 py-1.5 border border-dashed border-[#1D9E75] text-[#1D9E75] rounded-md text-[12px] hover:bg-[#f2faf6]"
        >
          + 평가 항목 추가
        </button>

        {/* 공식 프리뷰 */}
        <div className="mt-4 p-3 bg-[#f8faf9] border border-gray-200 rounded-md text-[12px] font-mono text-gray-700">
          원점수 = {rules.items.filter(it => !(it.locked && it.enabled === false)).map(it => `${it.name}×${it.weight}%`).join(' + ')}
          {rules.adjustments.filter(a => a.enabled).map(a =>
            a.points >= 0 ? ` + ${a.name}(+${a.points})` : ` − ${a.name}(${Math.abs(a.points)})`
          ).join('')}
        </div>
      </div>

      {/* ①-B 점수 가감 항목 (감점/가산) */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[14px] font-semibold text-gray-800">① 점수 가감 항목</h3>
          <span className="text-[11px] text-gray-400">비율이 아닌 고정 점수로 원점수에 가감</span>
        </div>
        <p className="text-[11px] text-gray-400 mb-3">
          지각(-2점), 무단결근(-5점) 등 근태 기반 건당 감점. 발생 건수 × 점수로 원점수에서 차감.
        </p>

        <div className="border border-gray-200 rounded-md overflow-hidden">
          <table className="w-full text-[12px] table-fixed">
            <colgroup>
              <col className="w-[70px]" />
              <col className="w-[180px]" />
              <col />
              <col className="w-[110px]" />
              <col className="w-[80px]" />
              <col className="w-[80px]" />
            </colgroup>
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-3 py-2 text-center">적용</th>
                <th className="px-3 py-2 text-left">항목명</th>
                <th></th>
                <th className="px-3 py-2 text-center">점수</th>
                <th className="px-3 py-2 text-center">유형</th>
                <th className="px-3 py-2 text-center">삭제</th>
              </tr>
            </thead>
            <tbody>
              {rules.adjustments.map(a => (
                <tr key={a.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={a.enabled}
                      onChange={e => updateAdjust(a.id, { enabled: e.target.checked })}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={a.name}
                      onChange={e => updateAdjust(a.id, { name: e.target.value })}
                      className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-[12px]"
                      placeholder="예: 무단결근, 징계, 표창"
                    />
                  </td>
                  <td></td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="number"
                      value={a.points}
                      onChange={e => updateAdjust(a.id, { points: Number(e.target.value) })}
                      className="w-20 border border-gray-200 rounded-md px-2 py-1.5 text-[12px] text-center"
                      step={1}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                      a.points >= 0
                        ? 'bg-[#eaf6f0] text-[#2e9e6e]'
                        : 'bg-[#fef2f2] text-[#ef4444]'
                    }`}>
                      {a.points >= 0 ? '가산' : '감점'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => removeAdjust(a.id)}
                      className="text-[#ef4444] hover:underline"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
              {rules.adjustments.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">등록된 가감 항목이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <button
          onClick={addAdjust}
          className="mt-3 px-3 py-1.5 border border-dashed border-[#1D9E75] text-[#1D9E75] rounded-md text-[12px] hover:bg-[#f2faf6]"
        >
          + 가감 항목 추가
        </button>

        <div className="mt-3 p-3 bg-[#fffbeb] border border-[#fde68a] rounded-md text-[11px] text-[#92400e]">
          각 항목의 실제 적용 여부는 개인별 이벤트(근태 규칙, 징계 기록, 표창 수여 등)에 따라 결정됩니다. 여기서는 <strong>이벤트 발생 시 적용될 점수</strong>만 정의합니다.
        </div>
      </div>

      {/* ② 등급 체계 (동적) */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[14px] font-semibold text-gray-800">② 전사 등급 체계 · 컷오프 · 목표 비율</h3>
          <div className="flex gap-1.5">
            <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
              gradeValid ? 'bg-[#eaf6f0] text-[#2e9e6e]' : 'bg-[#fef2f2] text-[#ef4444]'
            }`}>
              비율 {gradeSum}% {gradeValid ? '✓' : '(100%여야 함)'}
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
              gradeOrderValid ? 'bg-[#eaf6f0] text-[#2e9e6e]' : 'bg-[#fef2f2] text-[#ef4444]'
            }`}>
              컷오프 {gradeOrderValid ? '✓' : '순서 오류'}
            </span>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mb-3">등급 라벨 · 강제배분 비율을 설정합니다 (예: S 10%, A 20%...). 비율 합계는 100%여야 합니다.</p>

        <div className="border border-gray-200 rounded-md overflow-hidden">
          <table className="w-full text-[12px] table-fixed">
            <colgroup>
              <col className="w-[60px]" />
              <col className="w-[50px]" />
              <col className="w-[120px]" />
              <col />
              <col className="w-[140px]" />
              <col className="w-[80px]" />
            </colgroup>
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-3 py-2 text-center">순위</th>
                <th className="px-3 py-2 text-center">색</th>
                <th className="px-3 py-2 text-center">라벨</th>
                <th></th>
                <th className="px-3 py-2 text-center">강제배분(%)</th>
                <th className="px-3 py-2 text-center">삭제</th>
              </tr>
            </thead>
            <tbody>
              {rules.grades.map((g, idx) => (
                <tr key={g.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 text-center text-gray-400">{idx + 1}</td>
                  <td className="px-3 py-2 text-center">
                    <div className="w-5 h-5 rounded mx-auto" style={{ backgroundColor: g.color }} />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={g.label}
                      onChange={e => updateGrade(g.id, { label: e.target.value })}
                      className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-[12px] text-center font-medium"
                      placeholder="S"
                    />
                  </td>
                  <td></td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="number"
                        value={g.ratio}
                        onChange={e => updateGrade(g.id, { ratio: Number(e.target.value) })}
                        className="w-16 border border-gray-200 rounded-md px-2 py-1.5 text-[12px] text-center"
                        min={0} max={100}
                      />
                      <span className="text-[11px] text-gray-400 shrink-0">%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => removeGrade(g.id)}
                      disabled={rules.grades.length <= 2}
                      className="text-[#ef4444] hover:underline disabled:text-gray-300 disabled:no-underline"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={addGrade}
          className="mt-3 px-3 py-1.5 border border-dashed border-[#1D9E75] text-[#1D9E75] rounded-md text-[12px] hover:bg-[#f2faf6]"
        >
          + 등급 추가
        </button>

        {/* 분포 바 */}
        <div className="mt-4 flex h-6 rounded overflow-hidden border border-gray-200">
          {rules.grades.map(g => (
            <div
              key={g.id}
              className="flex items-center justify-center text-[10px] font-medium text-white"
              style={{ width: `${g.ratio}%`, backgroundColor: g.color }}
            >
              {g.ratio > 5 ? `${g.label} ${g.ratio}%` : ''}
            </div>
          ))}
        </div>
      </div>

      {/* ③ 목표별 업무등급 가중 배수 */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[14px] font-semibold text-gray-800">③ 목표별 업무등급 가중 배수</h3>
          <span className="text-[11px] text-gray-400">각 목표의 상·중·하 등급별 가중치 배수</span>
        </div>
        <p className="text-[11px] text-gray-400 mb-3">
          사원이 여러 목표를 등록하면 이 배수로 합산 비중이 자동 계산됩니다. (예: 상 5개=각 20%, 상3+중2=상 21.4%/중 14.3%)
        </p>

        <div className="grid grid-cols-3 gap-3 mb-3">
          {(['상', '중', '하'] as const).map(g => (
            <div key={g}>
              <label className="block text-[11px] text-gray-500 mb-1 font-semibold">{g} 배수</label>
              <input
                type="number"
                value={rules.taskGradeWeights[g]}
                onChange={e => patch({
                  taskGradeWeights: { ...rules.taskGradeWeights, [g]: Number(e.target.value) },
                })}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-[13px] text-center"
                min={0} step={0.5}
              />
            </div>
          ))}
        </div>

        <div className="p-3 bg-[#f8faf9] border border-gray-200 rounded-md text-[11px] text-gray-600 font-mono">
          예시) 상×2개 + 중×2개 + 하×1개 (배수 {rules.taskGradeWeights.상}:{rules.taskGradeWeights.중}:{rules.taskGradeWeights.하}) →{' '}
          {(() => {
            const w = rules.taskGradeWeights
            const sum = w.상 * 2 + w.중 * 2 + w.하 * 1
            if (sum === 0) return '— 배수 모두 0'
            const s = Math.round((w.상 / sum) * 1000) / 10
            const m = Math.round((w.중 / sum) * 1000) / 10
            const l = Math.round((w.하 / sum) * 1000) / 10
            return `상 각 ${s}%, 중 각 ${m}%, 하 ${l}%`
          })()}
        </div>
      </div>

      {/* ④ 편향 보정 */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[14px] font-semibold text-gray-800">④ 팀장 편향 보정 (Z-score 정규화)</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rules.useBiasAdjustment}
              onChange={e => patch({ useBiasAdjustment: e.target.checked })}
              className="cursor-pointer"
            />
            <span className="text-[12px] text-gray-600">사용</span>
          </label>
        </div>
        <p className="text-[11px] text-gray-400 mb-2">
          팀별 평균·표준편차를 전사 기준으로 정규화하여 팀장 관대·엄격 편향을 제거합니다.
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4 font-mono text-[11px] text-gray-700 space-y-0.5">
          <div>z = (원점수 − 팀평균) / 팀표준편차</div>
          <div>z_scaled = z × 전사표준편차 + 전사평균</div>
          <div>보정점수 = 원점수 × (1 − 가중치) + z_scaled × 가중치</div>
        </div>

        <div className={`grid grid-cols-2 gap-4 ${!rules.useBiasAdjustment ? 'opacity-40 pointer-events-none' : ''}`}>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">보정 강도 (0 ~ 1.0)</label>
            <input
              type="number"
              value={rules.biasWeight}
              onChange={e => patch({ biasWeight: Number(e.target.value) })}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-[13px]"
              min={0} max={1} step={0.1}
            />
            <p className="text-[10px] text-gray-400 mt-1">1.0 = 완전 z-score 적용 · 0.5 = 원점수와 반반</p>
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">최소 팀 규모 (명)</label>
            <input
              type="number"
              value={rules.minTeamSize}
              onChange={e => patch({ minTeamSize: Number(e.target.value) })}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-[13px]"
              min={2} max={20}
            />
            <p className="text-[10px] text-gray-400 mt-1">
              미달 팀(5명 이하 등)은 원점수 유지 — 통계적 신뢰도 부족.
            </p>
          </div>
        </div>
      </div>

      {/* ⑤ 등급 원점수 변환표 */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[14px] font-semibold text-gray-800">⑤ 등급 원점수 변환표</h3>
          <span className="text-[11px] text-gray-400">등급 ↔ 원점수 1:1 매핑</span>
        </div>
        <p className="text-[11px] text-gray-400 mb-3">
          팀장이 팀원에게 등급을 부여하면 이 표의 <strong>원점수</strong>로 환산되어 종합점수 공식에 들어갑니다.
          등급 라벨은 ②번 등급체계에서 자동으로 가져옵니다.
        </p>

        <div className="border border-gray-200 rounded-md overflow-hidden mb-3">
          <table className="w-full text-[12px] table-fixed">
            <colgroup>
              <col className="w-[120px]" />
              <col />
              <col className="w-[180px]" />
            </colgroup>
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">등급</th>
                <th></th>
                <th className="px-3 py-2 text-right pr-4">원점수</th>
              </tr>
            </thead>
            <tbody>
              {rules.grades.map(g => {
                const raw = rules.rawScoreTable.find(r => r.gradeId === g.id)?.rawScore ?? 0
                return (
                  <tr key={g.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-left font-semibold text-gray-700">{g.label}</td>
                    <td></td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1 pr-2">
                        <input
                          type="number"
                          value={raw}
                          onChange={e => updateRawScore(g.id, Number(e.target.value))}
                          className="w-20 border border-gray-200 rounded-md px-2 py-1.5 text-[12px] text-right"
                          min={0} max={100}
                        />
                        <span className="text-[11px] text-gray-400 shrink-0">점</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-[#f8faf9] border border-gray-200 rounded-md text-[11px] text-gray-700 font-mono">
          {(() => {
            const sample = rules.grades[1] ?? rules.grades[0]
            if (!sample) return '등록된 등급이 없습니다.'
            const raw = rules.rawScoreTable.find(r => r.gradeId === sample.id)?.rawScore ?? 0
            return `예) 팀장이 ${sample.label} 부여 → 원점수 = ${raw}점 → finalScore 공식에 반영`
          })()}
        </div>
      </div>

      {/* ⑥ KPI 점수 환산 규칙 */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[14px] font-semibold text-gray-800">⑥ KPI 점수 환산 규칙</h3>
          <span className="text-[11px] text-gray-400">달성률 → 점수 변환 파라미터</span>
        </div>
        <p className="text-[11px] text-gray-400 mb-3">
          KPI 달성률을 점수로 환산할 때 적용되는 상한·리스케일·MAINTAIN 허용 이탈·미달 패널티를 설정합니다.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[11px] text-gray-500 mb-1 font-semibold">점수 상한 (Cap)</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={rules.kpiScoring.cap}
                onChange={e => patch({ kpiScoring: { ...rules.kpiScoring, cap: Number(e.target.value) } })}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-[13px]"
                min={100} max={200} step={5}
              />
              <span className="text-[11px] text-gray-400 shrink-0">%</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">초과달성 점수 상한. 기본 120 (120% 이상은 120으로 절삭)</p>
          </div>

          <div>
            <label className="block text-[11px] text-gray-500 mb-1 font-semibold">리스케일 만점</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={rules.kpiScoring.scaleTo}
                onChange={e => patch({ kpiScoring: { ...rules.kpiScoring, scaleTo: Number(e.target.value) } })}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-[13px]"
                min={10} max={1000} step={10}
              />
              <span className="text-[11px] text-gray-400 shrink-0">점</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Cap {rules.kpiScoring.cap} → {rules.kpiScoring.scaleTo}점 만점으로 환산 (× {rules.kpiScoring.scaleTo}/{rules.kpiScoring.cap})</p>
          </div>

          <div>
            <label className="block text-[11px] text-gray-500 mb-1 font-semibold">MAINTAIN 허용 이탈</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={rules.kpiScoring.maintainTolerance}
                onChange={e => patch({ kpiScoring: { ...rules.kpiScoring, maintainTolerance: Number(e.target.value) } })}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-[13px]"
                min={0} max={50} step={1}
              />
              <span className="text-[11px] text-gray-400 shrink-0">±%</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">유지형 지표에서 목표 대비 ±n% 이내는 만점. 0이면 선형 감점.</p>
          </div>

          <div>
            <label className="block text-[11px] text-gray-500 mb-1 font-semibold">미달 기준</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={rules.kpiScoring.underperformanceThreshold}
                onChange={e => patch({ kpiScoring: { ...rules.kpiScoring, underperformanceThreshold: Number(e.target.value) } })}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-[13px]"
                min={0} max={100} step={5}
              />
              <span className="text-[11px] text-gray-400 shrink-0">%</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">달성률이 이 값 미만이면 패널티 배율 적용. 0이면 비활성.</p>
          </div>

          <div>
            <label className="block text-[11px] text-gray-500 mb-1 font-semibold">미달 패널티 배율</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={rules.kpiScoring.underperformanceFactor}
                onChange={e => patch({ kpiScoring: { ...rules.kpiScoring, underperformanceFactor: Number(e.target.value) } })}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-[13px]"
                min={0} max={1} step={0.1}
                disabled={rules.kpiScoring.underperformanceThreshold === 0}
              />
              <span className="text-[11px] text-gray-400 shrink-0">×</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">미달 시 점수 × 배율. 0.5 = 반토막, 1.0 = 패널티 없음.</p>
          </div>
        </div>

        <div className="p-3 bg-[#f8faf9] border border-gray-200 rounded-md text-[11px] text-gray-700 font-mono space-y-0.5">
          <div>달성률 = calcAchievementRate(방향, 목표, 실적{rules.kpiScoring.maintainTolerance > 0 ? `, tol=±${rules.kpiScoring.maintainTolerance}%` : ''})</div>
          <div>점수 = min({rules.kpiScoring.cap}, 달성률){rules.kpiScoring.underperformanceThreshold > 0 ? ` × (달성률 < ${rules.kpiScoring.underperformanceThreshold}% 이면 ×${rules.kpiScoring.underperformanceFactor})` : ''}</div>
          <div>selfScore = Σ(점수 × 비중) × ({rules.kpiScoring.scaleTo}/{rules.kpiScoring.cap})  → 0~{rules.kpiScoring.scaleTo}점</div>
        </div>
      </div>

      {/* 저장 바 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
        <div className="text-[12px] text-gray-500">
          {dirty ? <span className="text-[#f59e0b] font-medium">● 저장되지 않은 변경사항</span> : '저장됨'}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-200 rounded-md text-[12px] text-gray-600 hover:bg-gray-50"
          >
            기본값 복원
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className={`px-4 py-2 rounded-md text-[12px] font-medium text-white ${
              canSave && !saving ? 'bg-[#1D9E75] hover:bg-[#0F6E56]' : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
