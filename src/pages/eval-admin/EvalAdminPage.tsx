import { useState } from 'react'
import KpiTemplate from '../eval/design/KpiTemplate'
import KpiOptionManagement from '../hr/KpiOptionManagement'
import EvaluationRules from '../eval/design/EvaluationRules'
import SeasonCreate from '../eval/design/SeasonCreate'
import StageOpenClose from '../eval/operation/StageOpenClose'
import EmpEvaluatorMapping from '../eval/operation/EmpEvaluatorMapping'
import GradeDraftAuto from '../eval/grading/GradeDraftAuto'
import GradeCalibration from '../eval/grading/GradeCalibration'
import GradeFinalLock from '../eval/grading/GradeFinalLock'
import EvalResultView from '../eval/result/EvalResultView'
import EvalResultDetail from '../eval/result/EvalResultDetail'
import SchedulerControlTab from './SchedulerControlTab'
import { ActiveStagesProvider } from '../../hooks/useActiveStages'

type EvalAdminTab =
  | 'emp-evaluator'
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
      { key: 'emp-evaluator', label: '사원별 평가자 매핑' },
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
  // 결과 조회 탭 내부에서 상세<->목록 전환을 URL 변경 없이 처리
  const [resultDetailGradeId, setResultDetailGradeId] = useState<number | null>(null)

  const handleTabClick = (key: EvalAdminTab) => {
    setActiveTab(key)
    if (key !== 'result-view') setResultDetailGradeId(null)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'emp-evaluator': return <EmpEvaluatorMapping />
      case 'kpi-template': return <KpiTemplate />
      case 'kpi-option': return <KpiOptionManagement />
      case 'rules': return <EvaluationRules />
      case 'season': return <SeasonCreate />
      case 'stage': return <StageOpenClose />
      case 'grade-auto': return <GradeDraftAuto />
      case 'grade-calibration': return <GradeCalibration />
      case 'grade-final': return <GradeFinalLock />
      case 'result-view':
        return resultDetailGradeId !== null
          ? <EvalResultDetail id={String(resultDetailGradeId)} onBack={() => setResultDetailGradeId(null)} />
          : <EvalResultView onViewDetail={(gradeId) => setResultDetailGradeId(gradeId)} />
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
                  onClick={() => handleTabClick(item.key)}
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

        <div className="flex-1 overflow-y-auto bg-white p-6">
          {renderContent()}
        </div>
      </div>
    </ActiveStagesProvider>
  )
}
