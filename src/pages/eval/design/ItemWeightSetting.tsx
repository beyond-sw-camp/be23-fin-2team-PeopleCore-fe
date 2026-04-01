import { useState } from 'react'

type EvalType = '업무평가' | '동료평가' | '상위자평가' | '근태'

interface EvalItem {
  id: number
  evalType: EvalType
  category: string
  name: string
  type: '정량' | '정성'
  weight: number
}

interface Preset {
  label: string
  description: string
  typeWeights: { task: number; peer: number; manager: number; attendance: number }
  items: Omit<EvalItem, 'id'>[]
}

const evalTypes: EvalType[] = ['업무평가', '동료평가', '상위자평가', '근태']

const evalTypeColors: Record<EvalType, { bg: string; text: string }> = {
  '업무평가': { bg: 'bg-[#eff6ff]', text: 'text-[#3b82f6]' },
  '동료평가': { bg: 'bg-[#faf5ff]', text: 'text-[#7c3aed]' },
  '상위자평가': { bg: 'bg-[#fef3cd]', text: 'text-[#d97706]' },
  '근태': { bg: 'bg-[#eaf6f0]', text: 'text-[#2e9e6e]' },
}

const presets: Preset[] = [
  {
    label: '성과 중심형 (기본)',
    description: '업무성과 비중이 높고, 상위자 평가 비중이 큰 구조입니다. KPI·프로젝트 등 정량 지표 위주로 평가하며 대부분의 일반 부서에 적합합니다.',
    typeWeights: { task: 30, peer: 20, manager: 40, attendance: 10 },
    items: [
      { evalType: '업무평가', category: '업무성과', name: 'KPI 달성률', type: '정량', weight: 30 },
      { evalType: '업무평가', category: '업무성과', name: '프로젝트 기여도', type: '정성', weight: 20 },
      { evalType: '동료평가', category: '조직기여', name: '협업·소통', type: '정성', weight: 15 },
      { evalType: '동료평가', category: '조직기여', name: '리더십', type: '정성', weight: 10 },
      { evalType: '상위자평가', category: '역량', name: '직무 전문성', type: '정성', weight: 15 },
      { evalType: '상위자평가', category: '역량', name: '문제 해결력', type: '정성', weight: 10 },
      { evalType: '근태', category: '근태', name: '출근율', type: '정량', weight: 60 },
      { evalType: '근태', category: '근태', name: '지각/조퇴 횟수', type: '정량', weight: 25 },
      { evalType: '근태', category: '근태', name: '연차 사용률', type: '정량', weight: 15 },
    ],
  },
  {
    label: '역량 중심형',
    description: '직무 역량과 성장 가능성에 초점을 맞춘 구조입니다. 신입/주니어 직급이나 R&D 부서처럼 단기 성과보다 장기 역량 개발이 중요한 조직에 적합합니다.',
    typeWeights: { task: 20, peer: 25, manager: 40, attendance: 15 },
    items: [
      { evalType: '업무평가', category: '업무성과', name: 'KPI 달성률', type: '정량', weight: 40 },
      { evalType: '업무평가', category: '역량', name: '자기 개발', type: '정성', weight: 30 },
      { evalType: '업무평가', category: '업무성과', name: '프로젝트 기여도', type: '정성', weight: 30 },
      { evalType: '동료평가', category: '조직기여', name: '협업·소통', type: '정성', weight: 50 },
      { evalType: '동료평가', category: '조직기여', name: '멘토링·지식공유', type: '정성', weight: 50 },
      { evalType: '상위자평가', category: '역량', name: '직무 전문성', type: '정성', weight: 50 },
      { evalType: '상위자평가', category: '역량', name: '문제 해결력', type: '정성', weight: 50 },
      { evalType: '근태', category: '근태', name: '출근율', type: '정량', weight: 60 },
      { evalType: '근태', category: '근태', name: '지각/조퇴 횟수', type: '정량', weight: 25 },
      { evalType: '근태', category: '근태', name: '연차 사용률', type: '정량', weight: 15 },
    ],
  },
  {
    label: '균형형',
    description: '성과·역량·조직기여를 균등하게 평가하는 구조입니다. 평가자 유형별 비중도 고르게 분배하여 다면평가 효과를 극대화합니다. 범용적으로 사용 가능합니다.',
    typeWeights: { task: 25, peer: 25, manager: 35, attendance: 15 },
    items: [
      { evalType: '업무평가', category: '업무성과', name: 'KPI 달성률', type: '정량', weight: 40 },
      { evalType: '업무평가', category: '업무성과', name: '업무 품질', type: '정성', weight: 30 },
      { evalType: '업무평가', category: '역량', name: '자기 개발', type: '정성', weight: 30 },
      { evalType: '동료평가', category: '조직기여', name: '협업·소통', type: '정성', weight: 50 },
      { evalType: '동료평가', category: '조직기여', name: '조직 문화 기여', type: '정성', weight: 50 },
      { evalType: '상위자평가', category: '역량', name: '직무 전문성', type: '정성', weight: 50 },
      { evalType: '상위자평가', category: '역량', name: '문제 해결력', type: '정성', weight: 50 },
      { evalType: '근태', category: '근태', name: '출근율', type: '정량', weight: 50 },
      { evalType: '근태', category: '근태', name: '지각/조퇴 횟수', type: '정량', weight: 30 },
      { evalType: '근태', category: '근태', name: '연차 사용률', type: '정량', weight: 20 },
    ],
  },
]

const categories = ['업무성과', '역량', '조직기여', '근태']

export default function ItemWeightSetting() {
  const [typeWeights, setTypeWeights] = useState({ task: 30, peer: 20, manager: 40, attendance: 10 })
  const [editingTypes, setEditingTypes] = useState(false)
  const [tempWeights, setTempWeights] = useState({ task: 30, peer: 20, manager: 40, attendance: 10 })
  const [items, setItems] = useState<EvalItem[]>(
    presets[0].items.map((item, i) => ({ ...item, id: i + 1 }))
  )

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ evalType: '업무평가' as EvalType, category: '업무성과', name: '', type: '정성' as '정량' | '정성', weight: 10 })
  const [showPresets, setShowPresets] = useState(false)
  const [activeTab, setActiveTab] = useState<EvalType>('업무평가')

  const totalTypeWeight = tempWeights.task + tempWeights.peer + tempWeights.manager + tempWeights.attendance

  const itemsByType = (et: EvalType) => items.filter(i => i.evalType === et)
  const totalWeightByType = (et: EvalType) => itemsByType(et).reduce((s, i) => s + i.weight, 0)

  const handleTypeSave = () => {
    if (totalTypeWeight !== 100) return
    setTypeWeights(tempWeights)
    setEditingTypes(false)
  }

  const handleAddItem = () => {
    if (!formData.name.trim()) return
    setItems([...items, { ...formData, id: Date.now() }])
    setFormData({ evalType: activeTab, category: '업무성과', name: '', type: '정성', weight: 10 })
    setShowAddForm(false)
  }

  const handleEditStart = (item: EvalItem) => {
    setEditingId(item.id)
    setFormData({ evalType: item.evalType, category: item.category, name: item.name, type: item.type, weight: item.weight })
    setShowAddForm(false)
  }

  const handleEditSave = () => {
    if (!formData.name.trim() || editingId === null) return
    setItems(items.map(item => item.id === editingId ? { ...item, ...formData } : item))
    setEditingId(null)
    setFormData({ evalType: activeTab, category: '업무성과', name: '', type: '정성', weight: 10 })
  }

  const handleEditCancel = () => {
    setEditingId(null)
    setFormData({ evalType: activeTab, category: '업무성과', name: '', type: '정성', weight: 10 })
  }

  const handleDelete = (id: number) => {
    setItems(items.filter(item => item.id !== id))
  }

  const applyPreset = (preset: Preset) => {
    setTypeWeights(preset.typeWeights)
    setTempWeights(preset.typeWeights)
    setItems(preset.items.map((item, i) => ({ ...item, id: Date.now() + i })))
    setShowPresets(false)
  }

  const currentItems = itemsByType(activeTab)

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-[11px] text-[#8a9490] mb-4">성과관리(인사) &gt; 설계 &gt; 평가 항목·가중치 설정</div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-[#1a2b23] mb-1">평가 항목·가중치 설정</h1>
          <p className="text-[13px] text-[#8a9490]">평가 유형별 비중과 유형 내 항목별 가중치를 설정합니다.</p>
        </div>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="border border-[#e0e5e3] bg-white text-[#1a2b23] rounded-lg px-4 py-2.5 text-[13px] font-medium cursor-pointer hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors"
        >
          기본 프리셋 적용
        </button>
      </div>

      {/* 프리셋 선택 */}
      {showPresets && (
        <div className="bg-white border border-[#e0e5e3] rounded-lg p-5 mb-6">
          <h3 className="text-[14px] font-semibold text-[#1a2b23] mb-2">기본 프리셋 선택</h3>
          <p className="text-[12px] text-[#8a9490] mb-4">
            조직 특성에 맞는 프리셋을 선택하면 평가 유형 비중과 항목이 자동으로 세팅됩니다. 적용 후 개별 수정이 가능합니다.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {presets.map((preset, i) => (
              <div key={i} className="border border-[#e0e5e3] rounded-lg p-4 hover:border-[#1D9E75] transition-colors">
                <div className="text-[13px] font-semibold text-[#1a2b23] mb-2">{preset.label}</div>
                <p className="text-[11px] text-[#8a9490] mb-3 leading-relaxed">{preset.description}</p>
                <div className="text-[11px] text-[#5a6b62] mb-1">
                  자기 {preset.typeWeights.task}% · 동료 {preset.typeWeights.peer}% · 상위자 {preset.typeWeights.manager}% · 근태 {preset.typeWeights.attendance}%
                </div>
                <div className="text-[11px] text-[#8a9490] mb-3">항목 {preset.items.length}개</div>
                <button
                  onClick={() => applyPreset(preset)}
                  className="w-full bg-[#1D9E75] text-white border-none rounded-md px-3 py-2 text-[12px] font-medium cursor-pointer hover:bg-[#0F6E56] transition-colors"
                >
                  적용
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-3">
            <button onClick={() => setShowPresets(false)} className="text-[12px] text-[#8a9490] bg-transparent border-none cursor-pointer hover:text-[#1a2b23]">닫기</button>
          </div>
        </div>
      )}

      {/* 평가 유형별 비중 */}
      <div className="bg-white border border-[#e0e5e3] rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[14px] font-semibold text-[#1a2b23]">평가 유형별 비중</h3>
            <p className="text-[11px] text-[#8a9490] mt-0.5">각 평가 유형이 최종 점수에 반영되는 비율입니다. 합계가 100%여야 합니다.</p>
          </div>
          {!editingTypes ? (
            <button
              onClick={() => { setEditingTypes(true); setTempWeights(typeWeights) }}
              className="border border-[#e0e5e3] bg-white text-[#1a2b23] rounded-lg px-4 py-2 text-[13px] cursor-pointer hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors"
            >
              수정
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${totalTypeWeight === 100 ? 'bg-[#eaf6f0] text-[#2e9e6e]' : 'bg-[#fef2f2] text-[#ef4444]'}`}>
                합계 {totalTypeWeight}%
              </span>
              <button onClick={handleTypeSave} className="bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer hover:bg-[#0F6E56]">저장</button>
              <button onClick={() => setEditingTypes(false)} className="border border-[#e0e5e3] bg-white rounded-lg px-4 py-2 text-[13px] cursor-pointer hover:bg-[#f5f5f5]">취소</button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: '업무평가', key: 'task' as const, desc: '본인이 작성한 달성도·실적 근거' },
            { label: '동료평가', key: 'peer' as const, desc: '동료가 평가한 협업·역량 점수' },
            { label: '상위자평가', key: 'manager' as const, desc: '팀장이 부여한 S~D 등급' },
            { label: '근태', key: 'attendance' as const, desc: '출근율·지각·연차 사용 등 근태 반영' },
          ].map(item => (
            <div key={item.key} className="border border-[#e0e5e3] rounded-lg p-4 text-center">
              <div className="text-[12px] text-[#5a6b62] mb-1">{item.label}</div>
              {editingTypes ? (
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={tempWeights[item.key]}
                  onChange={e => setTempWeights({ ...tempWeights, [item.key]: Number(e.target.value) })}
                  className="w-20 border border-[#e0e5e3] rounded-md px-2 py-1 text-center text-[20px] font-bold text-[#1D9E75]"
                />
              ) : (
                <div className="text-[24px] font-bold text-[#1D9E75]">{typeWeights[item.key]}%</div>
              )}
              <div className="text-[10px] text-[#8a9490] mt-1">{item.desc}</div>
              <div className="text-[10px] text-[#8a9490] mt-1">항목 {itemsByType(item.label as EvalType).length}개</div>
            </div>
          ))}
        </div>
      </div>

      {/* 유형별 항목 관리 — 탭 */}
      <div className="bg-white border border-[#e0e5e3] rounded-lg overflow-hidden mb-6">
        <div className="flex border-b border-[#e0e5e3]">
          {evalTypes.map(et => {
            const isActive = activeTab === et
            const total = totalWeightByType(et)
            return (
              <button
                key={et}
                onClick={() => { setActiveTab(et); setEditingId(null); setShowAddForm(false) }}
                className={`flex-1 py-3 text-[13px] font-medium cursor-pointer border-none transition-colors ${
                  isActive
                    ? 'bg-white text-[#1D9E75] border-b-2 border-[#1D9E75]'
                    : 'bg-[#f8faf9] text-[#8a9490] hover:text-[#5a6b62]'
                }`}
                style={isActive ? { borderBottom: '2px solid #1D9E75' } : {}}
              >
                {et}
                <span className={`ml-1 text-[11px] px-1.5 py-0.5 rounded ${total === 100 ? 'bg-[#eaf6f0] text-[#2e9e6e]' : 'bg-[#fef2f2] text-[#ef4444]'}`}>
                  {total}%
                </span>
              </button>
            )
          })}
        </div>

        {/* 탭 설명 */}
        <div className="px-5 py-3 bg-[#f8faf9] border-b border-[#e0e5e3] flex items-center justify-between">
          <div>
            <p className="text-[12px] text-[#5a6b62]">
              <span className={`${evalTypeColors[activeTab].bg} ${evalTypeColors[activeTab].text} px-2 py-0.5 rounded text-[11px] font-medium mr-2`}>{activeTab}</span>
              유형에 속한 항목들입니다. 항목별 가중치 합계가 <span className="font-medium">100%</span>가 되어야 합니다.
            </p>
          </div>
          <button
            onClick={() => { setShowAddForm(true); setEditingId(null); setFormData({ evalType: activeTab, category: activeTab === '근태' ? '근태' : '업무성과', name: '', type: activeTab === '근태' ? '정량' : '정성', weight: 10 }) }}
            className="bg-[#1D9E75] text-white border-none rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer hover:bg-[#0F6E56] transition-colors"
          >
            + 항목 추가
          </button>
        </div>

        {/* 항목 추가 폼 */}
        {showAddForm && (
          <div className="px-5 py-4 border-b border-[#e0e5e3] bg-[#fafbfa]">
            <h4 className="text-[13px] font-semibold text-[#1a2b23] mb-3">새 항목 추가 ({activeTab})</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-[#5a6b62] mb-1">카테고리</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-[#e0e5e3] rounded-md px-2 py-1.5 text-[12px]"
                >
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-[#5a6b62] mb-1">항목명</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="항목명 입력"
                  className="w-full border border-[#e0e5e3] rounded-md px-2 py-1.5 text-[12px]"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] text-[#5a6b62] mb-1">유형</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as '정량' | '정성' })}
                    className="w-full border border-[#e0e5e3] rounded-md px-2 py-1.5 text-[12px]"
                  >
                    <option value="정량">정량</option>
                    <option value="정성">정성</option>
                  </select>
                </div>
                <div className="w-20">
                  <label className="block text-[11px] text-[#5a6b62] mb-1">가중치(%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formData.weight}
                    onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })}
                    className="w-full border border-[#e0e5e3] rounded-md px-2 py-1.5 text-[12px]"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setShowAddForm(false)} className="border border-[#e0e5e3] bg-white rounded-md px-3 py-1.5 text-[12px] cursor-pointer hover:bg-[#f5f5f5]">취소</button>
              <button onClick={handleAddItem} className="bg-[#1D9E75] text-white border-none rounded-md px-3 py-1.5 text-[12px] font-medium cursor-pointer hover:bg-[#0F6E56]">추가</button>
            </div>
          </div>
        )}

        {/* 항목 테이블 */}
        {currentItems.length > 0 ? (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#e0e5e3]">
                <th className="text-left px-5 py-3 font-medium text-[#5a6b62]">카테고리</th>
                <th className="text-left px-5 py-3 font-medium text-[#5a6b62]">항목명</th>
                <th className="text-center px-5 py-3 font-medium text-[#5a6b62]">유형</th>
                <th className="text-left px-5 py-3 font-medium text-[#5a6b62]">가중치</th>
                <th className="text-center px-5 py-3 font-medium text-[#5a6b62] w-[140px]">관리</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(item => (
                <tr key={item.id} className="border-b border-[#f0f2f1] hover:bg-[#fafbfa]">
                  {editingId === item.id ? (
                    <>
                      <td className="px-5 py-3">
                        <select
                          value={formData.category}
                          onChange={e => setFormData({ ...formData, category: e.target.value })}
                          className="border border-[#e0e5e3] rounded-md px-2 py-1 text-[12px]"
                        >
                          {categories.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="text"
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="border border-[#e0e5e3] rounded-md px-2 py-1 text-[12px] w-full"
                        />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <select
                          value={formData.type}
                          onChange={e => setFormData({ ...formData, type: e.target.value as '정량' | '정성' })}
                          className="border border-[#e0e5e3] rounded-md px-2 py-1 text-[12px]"
                        >
                          <option value="정량">정량</option>
                          <option value="정성">정성</option>
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={formData.weight}
                          onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })}
                          className="border border-[#e0e5e3] rounded-md px-2 py-1 text-[12px] w-16"
                        />
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <button onClick={handleEditSave} className="text-[#2e9e6e] bg-transparent border border-[#2e9e6e] rounded px-2 py-0.5 text-[11px] cursor-pointer hover:bg-[#eaf6f0]">저장</button>
                          <button onClick={handleEditCancel} className="text-[#8a9490] bg-transparent border border-[#e0e5e3] rounded px-2 py-0.5 text-[11px] cursor-pointer hover:bg-[#f5f5f5]">취소</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3">
                        <span className="bg-[#eaf6f0] text-[#2e9e6e] px-2 py-0.5 rounded text-[11px]">{item.category}</span>
                      </td>
                      <td className="px-5 py-3 font-medium text-[#1a2b23]">{item.name}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          item.type === '정량' ? 'bg-[#eff6ff] text-[#3b82f6]' : 'bg-[#faf5ff] text-[#7c3aed]'
                        }`}>{item.type}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[#f0f2f1] rounded-full overflow-hidden">
                            <div className="h-full bg-[#1D9E75] rounded-full" style={{ width: `${item.weight}%` }} />
                          </div>
                          <span className="text-[12px] font-semibold text-[#1a2b23] w-8">{item.weight}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => handleEditStart(item)} className="text-[#5a6b62] bg-transparent border border-[#e0e5e3] rounded px-2 py-0.5 text-[11px] cursor-pointer hover:border-[#1D9E75] hover:text-[#1D9E75]">수정</button>
                          <button onClick={() => handleDelete(item.id)} className="text-[#5a6b62] bg-transparent border border-[#e0e5e3] rounded px-2 py-0.5 text-[11px] cursor-pointer hover:border-[#ef4444] hover:text-[#ef4444]">삭제</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-5 py-12 text-center">
            <div className="text-[#d0d8d4] text-[32px] mb-2">📋</div>
            <div className="text-[13px] text-[#8a9490]">{activeTab}에 등록된 항목이 없습니다.</div>
            <div className="text-[11px] text-[#8a9490] mt-1">"+ 항목 추가" 버튼으로 항목을 추가하세요.</div>
          </div>
        )}
      </div>

      {/* 기본 세팅 기준 안내 */}
      <div className="bg-[#f8faf9] border border-[#e0e5e3] rounded-lg p-5">
        <h3 className="text-[13px] font-semibold text-[#1a2b23] mb-3">기본 세팅 기준 안내</h3>
        <div className="space-y-3 text-[12px] text-[#5a6b62] leading-relaxed">
          <div>
            <div className="font-medium text-[#1a2b23] mb-1">평가 유형별 비중 (최종 점수 산정 시)</div>
            <ul className="list-disc ml-4 space-y-0.5">
              <li><span className="font-medium">상위자평가 40%</span> — 팀장이 직무 수행과 성과를 직접 관찰한 평가이므로 가장 높은 비중을 부여합니다.</li>
              <li><span className="font-medium">업무평가 30%</span> — 본인이 작성한 목표 달성도·실적 근거를 기반으로 산출합니다.</li>
              <li><span className="font-medium">동료평가 20%</span> — 협업·소통 역량은 동료가 가장 잘 판단할 수 있어 보조 지표로 활용합니다.</li>
              <li><span className="font-medium">근태 10%</span> — 출근율, 지각/조퇴 횟수, 연차 사용률 등 근태 데이터를 자동 반영합니다.</li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-[#1a2b23] mb-1">유형 내 항목 가중치</div>
            <ul className="list-disc ml-4 space-y-0.5">
              <li>각 평가 유형 내에서 항목별 가중치 합계가 <span className="font-medium">100%</span>가 되어야 합니다.</li>
              <li>예) 업무평가(30%) 안에서 KPI 달성률 30% + 프로젝트 기여도 20% + ... = 100%</li>
              <li>최종 점수 = Σ (유형 비중 × 유형 내 항목 점수 × 항목 가중치)</li>
            </ul>
          </div>
          <div className="text-[11px] text-[#8a9490] pt-1">
            ※ 위 기준은 일반 사무직 기준이며, 부서·직급 특성에 따라 프리셋을 변경하거나 개별 항목을 수정하여 사용할 수 있습니다.
          </div>
        </div>
      </div>
    </div>
  )
}
