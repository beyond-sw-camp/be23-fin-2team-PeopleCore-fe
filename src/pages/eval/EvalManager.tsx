import { useState } from 'react'
import GoalApprove from './manager/GoalApprove'
import AchievementReview from './manager/AchievementReview'
import TeamEval from './manager/TeamEval'

type SubTab = 'goal-approve' | 'achievement' | 'eval'

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: 'goal-approve', label: '목표 승인' },
  { key: 'achievement', label: '달성도 검토' },
  { key: 'eval', label: '팀원 평가' },
]

export default function EvalManager() {
  const [activeTab, setActiveTab] = useState<SubTab>('goal-approve')

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-[160px] bg-white border-r border-gray-200 py-3 px-2 space-y-0.5 shrink-0">
        {SUB_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`w-full text-left px-3 py-2 rounded-lg text-[12px] transition-colors ${
              activeTab === tab.key
                ? 'bg-[#eaf6f0] text-[#1D9E75] font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === 'goal-approve' && <GoalApprove />}
        {activeTab === 'achievement' && <AchievementReview />}
        {activeTab === 'eval' && <TeamEval />}
      </div>
    </div>
  )
}
