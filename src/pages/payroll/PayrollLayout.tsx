import { useNavigate, useLocation, Routes, Route } from 'react-router-dom'
import EmployeePayroll from './EmployeePayroll'
import PayrollLedger from './PayrollLedger'
import InsuranceSettle from './InsuranceSettle'
import SeveranceLedger from './SeveranceLedger'
import SeveranceEstimate from './SeveranceEstimate'

const MENU_ITEMS = [
  { label: '사원별 급여관리', path: '/payroll/employee' },
  { label: '급여대장(작성)', path: '/payroll/ledger' },
  { label: '정산보험료', path: '/payroll/insurance-settle' },
  { label: '퇴직금대장(작성)', path: '/payroll/severance-ledger' },
  { label: '퇴직금추계액', path: '/payroll/severance-estimate' },
]

export default function PayrollLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 사이드바 */}
      <div className="w-[220px] bg-white border-r border-[#d1d5db] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#d1d5db]">
          <h2 className="text-[15px] font-bold text-[#000000]">급여 관리</h2>
        </div>
        <nav className="p-2 space-y-0.5">
          {MENU_ITEMS.map(item => {
            const isActive = currentPath === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full text-left px-3 py-2 rounded-lg text-[12px] transition-colors ${
                  isActive
                    ? 'text-[#1D9E75] font-medium bg-[#E1F5EE]'
                    : 'text-[#000000] hover:bg-[#f2faf6] hover:text-[#1D9E75]'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* 콘텐츠 */}
      <Routes>
        <Route path="employee" element={<EmployeePayroll />} />
        <Route path="ledger" element={<PayrollLedger />} />
        <Route path="insurance-settle" element={<InsuranceSettle />} />
        <Route path="severance-ledger" element={<SeveranceLedger />} />
        <Route path="severance-estimate" element={<SeveranceEstimate />} />
        <Route path="*" element={<EmployeePayroll />} />
      </Routes>
    </div>
  )
}
