import { useLocation } from 'react-router-dom'
import SeasonCreate from './design/SeasonCreate'
import StageOpenClose from './operation/StageOpenClose'

// KPI 지표/옵션 관리, 평가 규칙은 인사통합(HRAdminPage)으로 이동됨.
export default function EvalDesign() {
  const { pathname } = useLocation()
  const sub = pathname.split('/')[3] || 'season'

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {sub === 'season' && <SeasonCreate />}
      {sub === 'stage' && <StageOpenClose />}
    </div>
  )
}
