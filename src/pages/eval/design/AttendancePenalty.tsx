import { useState } from 'react'

interface PenaltyPolicy {
  baseScore: number
  absentPenalty: number
  latePenalty: number
  earlyLeavePenalty: number
  isCustom: boolean
  updatedAt: string
}

interface Preset {
  label: string
  description: string
  policy: Omit<PenaltyPolicy, 'isCustom' | 'updatedAt'>
}

const presets: Preset[] = [
  {
    label: '표준형 (기본)',
    description: '일반적인 사무직 기준입니다. 무단결근에 높은 감점을, 지각·조퇴에는 경미한 감점을 부여합니다.',
    policy: { baseScore: 100, absentPenalty: 10, latePenalty: 2, earlyLeavePenalty: 2 },
  },
  {
    label: '엄격형',
    description: '현장직·교대근무 등 출근이 중요한 조직에 적합합니다. 모든 감점 항목이 높게 설정됩니다.',
    policy: { baseScore: 100, absentPenalty: 15, latePenalty: 5, earlyLeavePenalty: 5 },
  },
  {
    label: '유연형',
    description: '자율출근제·재택근무 조직에 적합합니다. 무단결근만 감점하고 지각·조퇴는 낮게 설정됩니다.',
    policy: { baseScore: 100, absentPenalty: 8, latePenalty: 1, earlyLeavePenalty: 1 },
  },
]

const initialPolicy: PenaltyPolicy = {
  baseScore: 100,
  absentPenalty: 10,
  latePenalty: 2,
  earlyLeavePenalty: 2,
  isCustom: false,
  updatedAt: '2024-05-01 14:30',
}

export default function AttendancePenalty() {
  const [policy, setPolicy] = useState<PenaltyPolicy>(initialPolicy)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<PenaltyPolicy>(initialPolicy)

  const applyPreset = (preset: Preset) => {
    setDraft({ ...draft, ...preset.policy, isCustom: false })
  }

  const handleSave = () => {
    setPolicy({ ...draft, isCustom: true, updatedAt: new Date().toLocaleString('ko-KR') })
    setEditing(false)
  }

  const handleCancel = () => {
    setDraft(policy)
    setEditing(false)
  }

  const handleEdit = () => {
    setDraft(policy)
    setEditing(true)
  }

  // 예시 시뮬레이션
  const simAbsent = 2
  const simLate = 3
  const simEarly = 1
  const currentPolicy = editing ? draft : policy
  const simScore = Math.max(0, currentPolicy.baseScore - (simAbsent * currentPolicy.absentPenalty) - (simLate * currentPolicy.latePenalty) - (simEarly * currentPolicy.earlyLeavePenalty))

  return (
    <div className="space-y-5">
      {/* 현재 설정 */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">근태 감점 정책</h3>
            <p className="text-xs text-gray-400 mt-0.5">근태 항목별 감점 점수를 설정합니다. 평가 시 근태 점수 산출에 반영됩니다.</p>
          </div>
          {!editing ? (
            <button onClick={handleEdit}
              className="text-xs px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all font-medium">
              <i className="fas fa-edit mr-1.5 text-[10px]"></i>수정
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleCancel}
                className="text-xs px-4 py-2 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors">
                취소
              </button>
              <button onClick={handleSave}
                className="text-xs px-4 py-2 bg-[#1D9E75] text-white rounded-lg hover:bg-[#0F6E56] transition-colors font-medium">
                저장
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <div className="text-[11px] text-gray-400 mb-1">기본 점수</div>
            {editing ? (
              <input type="number" value={draft.baseScore}
                onChange={e => setDraft({ ...draft, baseScore: Number(e.target.value) })}
                className="w-full text-center text-2xl font-bold text-gray-900 border border-gray-200 rounded-lg py-1 outline-none focus:border-[#1D9E75]" />
            ) : (
              <div className="text-2xl font-bold text-gray-900">{policy.baseScore}<span className="text-sm font-normal text-gray-400 ml-0.5">점</span></div>
            )}
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <div className="text-[11px] text-red-400 mb-1">무단결근 (1회당)</div>
            {editing ? (
              <input type="number" value={draft.absentPenalty}
                onChange={e => setDraft({ ...draft, absentPenalty: Number(e.target.value) })}
                className="w-full text-center text-2xl font-bold text-red-500 border border-red-200 rounded-lg py-1 outline-none focus:border-red-400" />
            ) : (
              <div className="text-2xl font-bold text-red-500">-{policy.absentPenalty}<span className="text-sm font-normal text-red-300 ml-0.5">점</span></div>
            )}
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 text-center">
            <div className="text-[11px] text-yellow-600 mb-1">지각 (1회당)</div>
            {editing ? (
              <input type="number" value={draft.latePenalty}
                onChange={e => setDraft({ ...draft, latePenalty: Number(e.target.value) })}
                className="w-full text-center text-2xl font-bold text-yellow-600 border border-yellow-200 rounded-lg py-1 outline-none focus:border-yellow-400" />
            ) : (
              <div className="text-2xl font-bold text-yellow-600">-{policy.latePenalty}<span className="text-sm font-normal text-yellow-400 ml-0.5">점</span></div>
            )}
          </div>
          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <div className="text-[11px] text-orange-500 mb-1">조기퇴근 (1회당)</div>
            {editing ? (
              <input type="number" value={draft.earlyLeavePenalty}
                onChange={e => setDraft({ ...draft, earlyLeavePenalty: Number(e.target.value) })}
                className="w-full text-center text-2xl font-bold text-orange-500 border border-orange-200 rounded-lg py-1 outline-none focus:border-orange-400" />
            ) : (
              <div className="text-2xl font-bold text-orange-500">-{policy.earlyLeavePenalty}<span className="text-sm font-normal text-orange-300 ml-0.5">점</span></div>
            )}
          </div>
        </div>

        {!editing && (
          <div className="text-[11px] text-gray-400 mt-3 text-right">
            마지막 수정: {policy.updatedAt}
          </div>
        )}
      </div>

      {/* 프리셋 */}
      {editing && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">프리셋</h3>
          <p className="text-xs text-gray-400 mb-4">조직 특성에 맞는 프리셋을 선택하면 감점 값이 자동으로 채워집니다.</p>
          <div className="grid grid-cols-3 gap-3">
            {presets.map(p => {
              const isActive = draft.absentPenalty === p.policy.absentPenalty && draft.latePenalty === p.policy.latePenalty && draft.earlyLeavePenalty === p.policy.earlyLeavePenalty
              return (
                <button key={p.label} onClick={() => applyPreset(p)}
                  className={`text-left p-4 rounded-xl border transition-all ${isActive ? 'border-[#1D9E75] bg-[#f2faf6]' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className={`text-sm font-medium mb-1 ${isActive ? 'text-[#1D9E75]' : 'text-gray-900'}`}>{p.label}</div>
                  <div className="text-[11px] text-gray-400 mb-2.5 leading-relaxed">{p.description}</div>
                  <div className="flex gap-2 text-[11px]">
                    <span className="px-2 py-0.5 bg-red-50 text-red-500 rounded-full">결근 -{p.policy.absentPenalty}</span>
                    <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-full">지각 -{p.policy.latePenalty}</span>
                    <span className="px-2 py-0.5 bg-orange-50 text-orange-500 rounded-full">조퇴 -{p.policy.earlyLeavePenalty}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 시뮬레이션 */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">감점 시뮬레이션</h3>
        <p className="text-xs text-gray-400 mb-4">현재 설정 기준으로 근태 점수가 어떻게 산출되는지 예시를 보여줍니다.</p>

        <div className="bg-gray-50 rounded-xl p-5">
          <div className="flex items-center gap-6 mb-4 text-sm">
            <span className="text-gray-500">무단결근 <span className="font-bold text-gray-900">{simAbsent}회</span></span>
            <span className="text-gray-500">지각 <span className="font-bold text-gray-900">{simLate}회</span></span>
            <span className="text-gray-500">조기퇴근 <span className="font-bold text-gray-900">{simEarly}회</span></span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">기본 점수</span>
              <span className="text-gray-900 font-medium">{currentPolicy.baseScore}점</span>
            </div>
            <div className="flex justify-between text-red-500">
              <span>무단결근 감점 ({simAbsent}회 x {currentPolicy.absentPenalty}점)</span>
              <span>-{simAbsent * currentPolicy.absentPenalty}점</span>
            </div>
            <div className="flex justify-between text-yellow-600">
              <span>지각 감점 ({simLate}회 x {currentPolicy.latePenalty}점)</span>
              <span>-{simLate * currentPolicy.latePenalty}점</span>
            </div>
            <div className="flex justify-between text-orange-500">
              <span>조기퇴근 감점 ({simEarly}회 x {currentPolicy.earlyLeavePenalty}점)</span>
              <span>-{simEarly * currentPolicy.earlyLeavePenalty}점</span>
            </div>
            <div className="flex justify-between pt-3 mt-1 border-t-2 border-gray-200">
              <span className="font-bold text-gray-900">최종 근태 점수</span>
              <span className={`font-bold text-lg ${simScore >= 80 ? 'text-[#1D9E75]' : simScore >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>{simScore}점</span>
            </div>
          </div>
        </div>
      </div>

      {/* 안내 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-500">
        근태 감점 정책은 평가 시즌의 근태 점수 산출에 자동 반영됩니다. 항목·가중치 탭에서 근태 비중을 설정하면 최종 평가 점수에 반영됩니다.
      </div>
    </div>
  )
}
