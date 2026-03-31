import { useState } from 'react'
import GoalRegister from './employee/GoalRegister'
import SelfEval from './employee/SelfEval'
import PeerEvalInput from './employee/PeerEvalInput'
import MyResult from './employee/MyResult'
import AppealRequest from './employee/AppealRequest'

type SubTab = 'goal' | 'self' | 'peer' | 'result' | 'appeal'

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: 'goal', label: '목표 등록' },
  { key: 'self', label: '자기평가' },
  { key: 'peer', label: '동료평가' },
  { key: 'result', label: '내 평가결과' },
  { key: 'appeal', label: '이의신청' },
]

export default function EvalEmployee() {
  const [activeTab, setActiveTab] = useState<SubTab>('goal')

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
        {activeTab === 'goal' && <GoalRegister />}
        {activeTab === 'self' && <SelfEval />}
        {activeTab === 'peer' && <PeerEvalInput />}
        {activeTab === 'result' && <MyResult />}
        {activeTab === 'appeal' && <AppealRequest />}
      </div>
    </div>
  )
}
