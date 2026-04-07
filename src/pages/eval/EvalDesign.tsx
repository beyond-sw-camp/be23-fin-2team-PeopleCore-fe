import { useState } from 'react'
import SeasonCreate from './design/SeasonCreate'
import ItemWeightSetting from './design/ItemWeightSetting'
import ForceDistribution from './design/ForceDistribution'
import TargetConfirmation from './design/TargetConfirmation'
import PeerAssignment from './design/PeerAssignment'
import AttendancePenalty from './design/AttendancePenalty'

type DesignTab = 'season' | 'items' | 'distribution' | 'attendance' | 'target' | 'peer'

const tabs: { key: DesignTab; label: string }[] = [
  { key: 'season', label: '평가 시즌' },
  { key: 'items', label: '항목·가중치' },
  { key: 'distribution', label: '강제배분' },
  { key: 'attendance', label: '근태 감점' },
  { key: 'target', label: '대상자 확정' },
  { key: 'peer', label: '동료평가 지정' },
]

export default function EvalDesign() {
  const [tab, setTab] = useState<DesignTab>('season')

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › <span className="text-[#1D9E75] font-medium">평가 설계</span>
      </div>

      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">평가 설계</h1>
        <p className="text-xs text-gray-400 mt-1">평가 시즌, 항목·가중치, 강제배분, 대상자 확정, 동료평가 지정을 관리합니다.</p>
      </div>

      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-[#1D9E75] shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'season' && <SeasonCreate />}
      {tab === 'items' && <ItemWeightSetting />}
      {tab === 'distribution' && <ForceDistribution />}
      {tab === 'attendance' && <AttendancePenalty />}
      {tab === 'target' && <TargetConfirmation />}
      {tab === 'peer' && <PeerAssignment />}
    </div>
  )
}
