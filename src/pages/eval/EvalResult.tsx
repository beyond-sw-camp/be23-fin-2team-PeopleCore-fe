import { useLocation } from 'react-router-dom'
import EvalResultView from './result/EvalResultView'
import EvalResultDetail from './result/EvalResultDetail'
import SalaryBonusLink from './result/SalaryBonusLink'
import AppealManagement from './result/AppealManagement'

export default function EvalResult() {
  const { pathname } = useLocation()
  const parts = pathname.split('/')
  const sub = parts[3] || 'view'
  const detailId = parts[3] === 'view' ? parts[4] : undefined

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {sub === 'view' && !detailId && <EvalResultView />}
      {sub === 'view' && detailId && <EvalResultDetail id={detailId} />}
      {sub === 'incentive' && <SalaryBonusLink />}
      {sub === 'appeal' && <AppealManagement />}
    </div>
  )
}
