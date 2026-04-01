import { useState } from 'react'
import GradeDraftAuto from './grading/GradeDraftAuto'
import DeptGradeDistribution from './grading/DeptGradeDistribution'
import GradeCalibration from './grading/GradeCalibration'
import GradeFinalLock from './grading/GradeFinalLock'

type GradingTab = 'auto' | 'distribution' | 'calibration' | 'confirm'

const tabs: { key: GradingTab; label: string }[] = [
  { key: 'auto', label: '자동 산정' },
  { key: 'distribution', label: '부서별 분포' },
  { key: 'calibration', label: '등급 보정' },
  { key: 'confirm', label: '최종 확정' },
]

export default function EvalGrading() {
  const [tab, setTab] = useState<GradingTab>('auto')

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="text-xs text-gray-400 mb-1">
        인사관리 › 성과평가 › <span className="text-[#1D9E75] font-medium">등급 산정/보정</span>
      </div>

      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">등급 산정/보정</h1>
        <p className="text-xs text-gray-400 mt-1">등급 자동 산정, 부서별 분포, 보정, 최종 확정을 관리합니다.</p>
      </div>

      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-[#1D9E75] shadow-sm' : 'text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'auto' && <GradeDraftAuto />}
      {tab === 'distribution' && <DeptGradeDistribution />}
      {tab === 'calibration' && <GradeCalibration />}
      {tab === 'confirm' && <GradeFinalLock />}
    </div>
  )
}
