import { useState } from 'react'
import AllEvalList from './view/AllEvalList'
import ManagerEvalView from './view/ManagerEvalView'
import PeerEvalView from './view/PeerEvalView'
import MyEvalDetail from './view/MyEvalDetail'

type ViewTab = 'all' | 'manager' | 'peer' | 'detail'

const tabs: { key: ViewTab; label: string }[] = [
  { key: 'all', label: '전체 평가 목록' },
  { key: 'manager', label: '상위자 평가' },
  { key: 'peer', label: '동료 평가' },
  { key: 'detail', label: '개인 상세' },
]

export default function EvalView() {
  const [tab, setTab] = useState<ViewTab>('all')

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › <span className="text-[#1D9E75] font-medium">평가 조회</span>
      </div>

      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">평가 조회</h1>
        <p className="text-xs text-gray-400 mt-1">전체 평가 목록, 상위자/동료 평가, 개인 상세를 조회합니다.</p>
      </div>

      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-[#1D9E75] shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'all' && <AllEvalList />}
      {tab === 'manager' && <ManagerEvalView />}
      {tab === 'peer' && <PeerEvalView />}
      {tab === 'detail' && <MyEvalDetail />}
    </div>
  )
}
