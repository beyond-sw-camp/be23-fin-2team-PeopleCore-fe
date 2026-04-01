import { useState } from 'react'
import StageOpenClose from './operation/StageOpenClose'
import ScheduleNotice from './operation/ScheduleNotice'
import GoalStatus from './operation/GoalStatus'
import EvalInputMonitor from './operation/EvalInputMonitor'
import OverdueReminder from './operation/OverdueReminder'

type OperationTab = 'stage' | 'schedule' | 'goals' | 'monitor' | 'overdue'

const tabs: { key: OperationTab; label: string }[] = [
  { key: 'stage', label: '단계 개폐' },
  { key: 'schedule', label: '일정·공지' },
  { key: 'goals', label: '목표 현황' },
  { key: 'monitor', label: '평가 입력 현황' },
  { key: 'overdue', label: '독촉·리마인드' },
]

export default function EvalOperation() {
  const [tab, setTab] = useState<OperationTab>('stage')

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › <span className="text-[#1D9E75] font-medium">평가 운영</span>
      </div>

      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">평가 운영</h1>
        <p className="text-xs text-gray-400 mt-1">평가 단계 관리, 일정 공지, 목표 현황, 입력 모니터링, 독촉을 관리합니다.</p>
      </div>

      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-[#1D9E75] shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stage' && <StageOpenClose />}
      {tab === 'schedule' && <ScheduleNotice />}
      {tab === 'goals' && <GoalStatus />}
      {tab === 'monitor' && <EvalInputMonitor />}
      {tab === 'overdue' && <OverdueReminder />}
    </div>
  )
}
