import { useState } from 'react'
import EvalResultView from './result/EvalResultView'
import SalaryBonusLink from './result/SalaryBonusLink'
import ResultBulkNotify from './result/ResultBulkNotify'
import AppealManagement from './result/AppealManagement'
import EvalReport from './result/EvalReport'
import YearlyHistory from './result/YearlyHistory'

type ResultTab = 'result' | 'incentive' | 'notify' | 'appeal' | 'report' | 'history'

const tabs: { key: ResultTab; label: string }[] = [
  { key: 'result', label: '결과 조회' },
  { key: 'incentive', label: '급여 연동' },
  { key: 'notify', label: '결과 통보' },
  { key: 'appeal', label: '이의신청 관리' },
  { key: 'report', label: '리포트' },
  { key: 'history', label: '연도별 이력' },
]

export default function EvalResult() {
  const [tab, setTab] = useState<ResultTab>('result')

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › <span className="text-[#1D9E75] font-medium">평가 결과 처리</span>
      </div>

      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">평가 결과 처리</h1>
          <p className="text-xs text-gray-400 mt-1">결과 조회, 급여 연동, 결과 통보, 이의신청, 리포트를 관리합니다.</p>
        </div>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none">
          <option>2024년 상반기 정기평가</option>
          <option>2023년 하반기 정기평가</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-[#1D9E75] shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'result' && <EvalResultView />}
      {tab === 'incentive' && <SalaryBonusLink />}
      {tab === 'notify' && <ResultBulkNotify />}
      {tab === 'appeal' && <AppealManagement />}
      {tab === 'report' && <EvalReport />}
      {tab === 'history' && <YearlyHistory />}
    </div>
  )
}
