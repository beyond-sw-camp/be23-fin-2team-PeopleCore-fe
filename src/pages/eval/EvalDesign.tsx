import { useLocation } from 'react-router-dom'
import SeasonCreate from './design/SeasonCreate'
import KpiTemplate from './design/KpiTemplate'
import EvaluationRules from './design/EvaluationRules'
import StageOpenClose from './operation/StageOpenClose'
import KpiOptionManagement from '../hr/KpiOptionManagement'

export default function EvalDesign() {
  const { pathname } = useLocation()
  const sub = pathname.split('/')[3] || 'season'

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {sub === 'season' && <SeasonCreate />}
      {sub === 'stage' && <StageOpenClose />}
      {sub === 'kpi' && <KpiTemplate />}
      {sub === 'kpi-options' && <KpiOptionManagement />}
      {sub === 'rules' && <EvaluationRules />}
    </div>
  )
}
