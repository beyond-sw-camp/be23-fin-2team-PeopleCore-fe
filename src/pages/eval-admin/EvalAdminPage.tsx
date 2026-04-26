import { useState } from 'react'
import EvaluatorRoleTab from '../hr-admin/components/EvaluatorRoleTab'
import KpiTemplate from '../eval/design/KpiTemplate'
import KpiOptionManagement from '../hr/KpiOptionManagement'
import EvaluationRules from '../eval/design/EvaluationRules'
import SeasonCreate from '../eval/design/SeasonCreate'
import StageOpenClose from '../eval/operation/StageOpenClose'
import GradeDraftAuto from '../eval/grading/GradeDraftAuto'
import GradeCalibration from '../eval/grading/GradeCalibration'
import GradeFinalLock from '../eval/grading/GradeFinalLock'
import EvalResultView from '../eval/result/EvalResultView'
import SchedulerControlTab from './SchedulerControlTab'
import { ActiveStagesProvider } from '../../hooks/useActiveStages'

type EvalAdminTab =
  | 'evaluator-role'
  | 'kpi-template'
  | 'kpi-option'
  | 'rules'
  | 'season'
  | 'stage'
  | 'grade-auto'
  | 'grade-calibration'
  | 'grade-final'
  | 'result-view'
  | 'scheduler'

const SIDEBAR_SECTIONS: { title: string; items: { key: EvalAdminTab; label: string }[] }[] = [
  {
    title: '평가 설계',
    items: [
      { key: 'season', label: '평가 시즌' },
      { key: 'stage', label: '단계 관리' },
    ],
  },
  {
    title: '등급 산정/보정',
    items: [
      { key: 'grade-auto', label: '자동 산정' },
      { key: 'grade-calibration', label: '등급 보정' },
      { key: 'grade-final', label: '최종 확정(잠금)' },
    ],
  },
  {
    title: '평가 결과 처리',
    items: [
      { key: 'result-view', label: '결과 조회' },
    ],
  },
  {
    title: '운영',
    items: [
      { key: 'evaluator-role', label: '성과 평가권한' },
      { key: 'kpi-template', label: 'KPI 지표 관리' },
      { key: 'kpi-option', label: 'KPI 옵션 관리' },
      { key: 'rules', label: '평가 규칙 관리' },
    ],
  },
  {
    title: '개발용',
    items: [
      // TODO: 지우기 — 스케줄러 수동 실행 (임시/개발용)
      { key: 'scheduler', label: '스케줄러 (임시)' },
    ],
  },
]

export default function EvalAdminPage() {
  const [activeTab, setActiveTab] = useState<EvalAdminTab>('season')

  const renderContent = () => {
    switch (activeTab) {
      case 'evaluator-role': return <EvaluatorRoleTab />
      case 'kpi-template': return <KpiTemplate />
      case 'kpi-option': return <KpiOptionManagement />
      case 'rules': return <EvaluationRules />
      case 'season': return <SeasonCreate />
      case 'stage': return <StageOpenClose />
      case 'grade-auto': return <GradeDraftAuto />
      case 'grade-calibration': return <GradeCalibration />
      case 'grade-final': return <GradeFinalLock />
      case 'result-view': return <EvalResultView />
      case 'scheduler': return <SchedulerControlTab />
    }
  }

  return (
    <ActiveStagesProvider>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[220px] bg-white border-r border-[#d1d5db] flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-[#d1d5db]">
            <h2 className="text-[15px] font-bold text-[#000000] mb-1">평가 관리</h2>
            <p className="text-[11px] text-gray-400">HR 관리자 전용</p>
          </div>
          {SIDEBAR_SECTIONS.map((section) => (
            <div key={section.title} className="px-4 pt-3 pb-2">
              <span className="text-[12px] font-semibold text-[#000000] mb-1 block">{section.title}</span>
              {section.items.map((item) => (
                <div
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex items-center gap-2 py-1.5 px-2 text-[12px] cursor-pointer rounded transition-colors ${
                    activeTab === item.key
                      ? 'text-[#1D9E75] font-medium bg-[#E1F5EE]'
                      : 'text-[#000000] hover:text-[#000000] hover:bg-[#E1F5EE]'
                  }`}
                >
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto bg-[#f8fafb] p-6">
          {renderContent()}
        </div>
      </div>
    </ActiveStagesProvider>
  )
}
