import { useState, useEffect, type InputHTMLAttributes } from 'react'
import {
  defaultRules,
  gradePalette,
  type EvalItem,
  type GradeItem,
  type RulesState,
} from './evaluationRulesData'
import { fetchRules, saveRules, toFrontendRules } from '../../../api/evalRules'

const uid = () => Math.random().toString(36).slice(2, 9)

// 숫자 입력 — 사용자가 0 을 지웠을 때 빈 문자열 상태를 보존해서 다시 0 이 찍히지 않도록 함.
// 외부 value 변경(시즌 로드/저장 후 갱신 등)은 별도로 동기화한다.
type NumberFieldProps = {
  value: number
  onChange: (n: number) => void
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>

function NumberField({ value, onChange, ...rest }: NumberFieldProps) {
  const [text, setText] = useState(String(value))
  useEffect(() => {
    const parsed = text.trim() === '' ? NaN : Number(text)
    // 사용자가 막 지워서 ''로 비워둔 상태(value === 0)는 보존, 그 외엔 외부 value 로 동기화
    if (parsed !== value && !(text === '' && value === 0)) {
      setText(String(value))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <input
      {...rest}
      type="number"
      value={text}
      onFocus={e => e.currentTarget.select()}
      onChange={e => {
        const v = e.target.value
        setText(v)
        if (v === '') {
          onChange(0)
        } else {
          const n = Number(v)
          if (!isNaN(n)) onChange(n)
        }
      }}
      onBlur={() => {
        if (text === '') setText('0')
      }}
    />
  )
}

export default function EvaluationRules() {
  const [rules, setRules] = useState<RulesState>(defaultRules)
  const [dirty, setDirty] = useState(false)
  // 초기 true — 첫 렌더에서 defaultRules 가 0.3초 깜빡이는 현상 제거
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 마운트 시 회사 규칙 로드 (회사당 1 row)
  useEffect(() => {
    fetchRules()
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
  }, [])

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

  // ── 등급 조작 ────────────────────────────────────
  // ⑥ 변환표는 ③과 독립이므로 등급 추가/삭제가 변환표를 건드리지 않는다.
  const addGrade = () => {
    patch({
      grades: [...rules.grades, {
        id: uid(),
        label: `G${rules.grades.length + 1}`,
        ratio: 0,
        color: gradePalette[rules.grades.length % gradePalette.length],
      }],
    })
  }

  const updateGrade = (id: string, f: Partial<GradeItem>) => {
    patch({ grades: rules.grades.map(g => (g.id === id ? { ...g, ...f } : g)) })
  }

  const removeGrade = (id: string) => {
    if (rules.grades.length <= 2) return
    patch({ grades: rules.grades.filter(g => g.id !== id) })
  }

  // ── 등급 원점수 변환표 (⑥) ─ ③과 독립적으로 행 추가/라벨 편집/삭제 ──
  const addRawScore = () => {
    const last = rules.rawScoreTable[rules.rawScoreTable.length - 1]
    const nextRaw = last ? Math.max(0, last.rawScore - 10) : 95
    patch({
      rawScoreTable: [
        ...rules.rawScoreTable,
        { id: uid(), label: `G${rules.rawScoreTable.length + 1}`, rawScore: nextRaw },
      ],
    })
  }

  const updateRawScoreItem = (id: string, f: Partial<{ label: string; rawScore: number }>) => {
    patch({
      rawScoreTable: rules.rawScoreTable.map(r => (r.id === id ? { ...r, ...f } : r)),
    })
  }

  const removeRawScore = (id: string) => {
    patch({ rawScoreTable: rules.rawScoreTable.filter(r => r.id !== id) })
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
  // ⑥ 변환표 자체 행을 위→아래 내림차순(strictly decreasing)으로 검증
  const gradeOrderValid = rules.rawScoreTable.every((r, i) => {
    if (i === 0) return true
    return rules.rawScoreTable[i - 1].rawScore > r.rawScore
  })
  const rawLabelsValid = rules.rawScoreTable.every(r => r.label.trim())

  const canSave = weightValid && gradeValid && gradeOrderValid && rawLabelsValid && dirty && rules.items.every(it => it.name.trim()) && rules.grades.every(g => g.label.trim())

  // 저장 — 백엔드 PUT /eval/rules (회사당 1 row)
  const handleSave = async () => {
    if (!confirm('현재 설정을 저장하시겠습니까?')) return

    setSaving(true)
    try {
      const dto = await saveRules(rules)
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
                        <span className={`text-[12px] font-medium ${isDisabled ? 'text-gray-400' : 'text-[#1a2b23]'}`}>
                          {it.name}
                        </span>
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
                        onFocus={e => e.currentTarget.select()}
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

        {/* 공식 프리뷰 */}
        <div className="mt-4 p-3 bg-[#f8faf9] border border-gray-200 rounded-md text-[12px] font-mono text-gray-700">
          원점수 = {rules.items.filter(it => !(it.locked && it.enabled === false)).map(it => `${it.name}×${it.weight}%`).join(' + ')}
        </div>
      </div>

      {/* ② 등급 체계 (동적) */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[14px] font-semibold text-gray-800">② 전사 등급 체계 · 목표 비율</h3>
          <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
            gradeValid ? 'bg-[#eaf6f0] text-[#2e9e6e]' : 'bg-[#fef2f2] text-[#ef4444]'
          }`}>
            비율 {gradeSum}% {gradeValid ? '✓' : '(100%여야 함)'}
          </span>
        </div>
        <p className="text-[11px] text-gray-400 mb-3">등급 라벨 · 강제배분 비율을 설정합니다 (예: S 10%, A 20%...). 비율 합계는 100%여야 합니다. 원점수 환산은 ⑤ 변환표에서 별도 관리합니다.</p>

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
                        onFocus={e => e.currentTarget.select()}
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
              onFocus={e => e.currentTarget.select()}
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
              onFocus={e => e.currentTarget.select()}
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

      {/* ⑤ 등급 원점수 변환표 (②와 독립, 동적 행 추가/라벨 편집/삭제) */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[14px] font-semibold text-gray-800">⑤ 등급 원점수 변환표</h3>
          <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
            gradeOrderValid && rawLabelsValid ? 'bg-[#eaf6f0] text-[#2e9e6e]' : 'bg-[#fef2f2] text-[#ef4444]'
          }`}>
            {!rawLabelsValid ? '라벨 누락' : gradeOrderValid ? '✓' : '원점수 순서 오류'}
          </span>
        </div>
        <p className="text-[11px] text-gray-400 mb-3">
          팀장이 팀원에게 등급을 부여하면 이 표의 <strong>원점수</strong>로 환산되어 종합점수 공식에 들어갑니다.
          팀장이 선택할 수 있는 등급 옵션도 이 표 기준입니다.
        </p>

        <div className="border border-gray-200 rounded-md overflow-hidden">
          <table className="w-full text-[12px] table-fixed">
            <colgroup>
              <col className="w-[60px]" />
              <col className="w-[160px]" />
              <col />
              <col className="w-[180px]" />
              <col className="w-[80px]" />
            </colgroup>
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-3 py-2 text-center">순위</th>
                <th className="px-3 py-2 text-center">라벨</th>
                <th></th>
                <th className="px-3 py-2 text-right pr-4">원점수</th>
                <th className="px-3 py-2 text-center">삭제</th>
              </tr>
            </thead>
            <tbody>
              {rules.rawScoreTable.map((r, idx) => {
                return (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-center text-gray-400">{idx + 1}</td>
                    <td className="px-3 py-2">
                      <input
                        value={r.label}
                        onChange={e => updateRawScoreItem(r.id, { label: e.target.value })}
                        className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-[12px] text-center font-medium"
                        placeholder="S"
                      />
                    </td>
                    <td></td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1 pr-2">
                        <input
                          type="number"
                          onFocus={e => e.currentTarget.select()}
                          value={r.rawScore}
                          onChange={e => updateRawScoreItem(r.id, { rawScore: Number(e.target.value) })}
                          className="w-20 border border-gray-200 rounded-md px-2 py-1.5 text-[12px] text-right"
                          min={0} max={100}
                        />
                        <span className="text-[11px] text-gray-400 shrink-0">점</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => removeRawScore(r.id)}
                        className="text-[#ef4444] hover:underline"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                )
              })}
              {rules.rawScoreTable.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">등록된 변환 항목이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <button
          onClick={addRawScore}
          className="mt-3 px-3 py-1.5 border border-dashed border-[#1D9E75] text-[#1D9E75] rounded-md text-[12px] hover:bg-[#f2faf6]"
        >
          + 변환 항목 추가
        </button>

        <div className="mt-3 p-3 bg-[#f8faf9] border border-gray-200 rounded-md text-[11px] text-gray-700 font-mono">
          {(() => {
            const sample = rules.rawScoreTable[1] ?? rules.rawScoreTable[0]
            if (!sample) return '등록된 변환 항목이 없습니다.'
            return `예) 팀장이 ${sample.label} 부여 → 원점수 = ${sample.rawScore}점 → finalScore 공식에 반영`
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
          KPI 달성률을 점수로 환산할 때 적용되는 상한·MAINTAIN 허용 이탈·미달 패널티를 설정합니다. 자기평가 만점은 100점 고정.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[11px] text-gray-500 mb-1 font-semibold">점수 상한 (Cap)</label>
            <div className="flex items-center gap-1">
              <NumberField
                value={rules.kpiScoring.cap}
                onChange={n => patch({ kpiScoring: { ...rules.kpiScoring, cap: n } })}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-[13px]"
                min={100} max={200} step={5}
              />
              <span className="text-[11px] text-gray-400 shrink-0">%</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">초과달성 점수 상한. 기본 120 (120% 이상은 120으로 절삭)</p>
          </div>

          <div>
            <label className="block text-[11px] text-gray-500 mb-1 font-semibold">MAINTAIN 허용 이탈</label>
            <div className="flex items-center gap-1">
              <NumberField
                value={rules.kpiScoring.maintainTolerance}
                onChange={n => patch({ kpiScoring: { ...rules.kpiScoring, maintainTolerance: n } })}
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
              <NumberField
                value={rules.kpiScoring.underperformanceThreshold}
                onChange={n => patch({ kpiScoring: { ...rules.kpiScoring, underperformanceThreshold: n } })}
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
              <NumberField
                value={rules.kpiScoring.underperformanceFactor}
                onChange={n => patch({ kpiScoring: { ...rules.kpiScoring, underperformanceFactor: n } })}
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
          <div>selfScore = min(Σ(점수 × 비중), 100)  → 0~100점</div>
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
