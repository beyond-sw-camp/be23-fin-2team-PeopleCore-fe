import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import EmployeeList from './EmployeeList'
import EmployeeRegister from './EmployeeRegister'
import SalaryContract from './SalaryContract'
import Certificate from './Certificate'
import WorkforceStatus from './WorkforceStatus'
import RetirementManagement from './RetirementManagement'
import PersonnelAppointment from './PersonnelAppointment'

type HRTab = 'list' | 'register' | 'salary-contract' | 'certificate' | 'workforce' | 'retirement' | 'appointment'

const TABS: { key: HRTab; label: string; icon: string }[] = [
  { key: 'list', label: '사원 목록', icon: 'fa-solid fa-users' },
  { key: 'register', label: '사원 등록', icon: 'fa-solid fa-user-plus' },
  { key: 'salary-contract', label: '연봉 계약', icon: 'fa-solid fa-file-contract' },
  { key: 'certificate', label: '증명서', icon: 'fa-solid fa-certificate' },
  { key: 'workforce', label: '인력 현황', icon: 'fa-solid fa-chart-pie' },
  { key: 'retirement', label: '퇴직 관리', icon: 'fa-solid fa-user-minus' },
  { key: 'appointment', label: '인사 발령', icon: 'fa-solid fa-file-signature' },
]

const PATH_TO_TAB: Record<string, HRTab> = {
  '/hr': 'list',
  '/hr/list': 'list',
  '/hr/register': 'register',
  '/hr/salary-contract': 'salary-contract',
  '/hr/certificate': 'certificate',
  '/hr/workforce': 'workforce',
  '/hr/retirement': 'retirement',
  '/hr/appointment': 'appointment',
}

const TAB_TO_PATH: Record<HRTab, string> = {
  'list': '/hr/list',
  'register': '/hr/register',
  'salary-contract': '/hr/salary-contract',
  'certificate': '/hr/certificate',
  'workforce': '/hr/workforce',
  'retirement': '/hr/retirement',
  'appointment': '/hr/appointment',
}

export default function HRPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialTab = PATH_TO_TAB[location.pathname] || 'list'
  const [activeTab, setActiveTab] = useState<HRTab>(initialTab)

  useEffect(() => {
    const tab = PATH_TO_TAB[location.pathname]
     
    if (tab && tab !== activeTab) setActiveTab(tab)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const handleTabChange = (tab: HRTab) => {
    setActiveTab(tab)
    navigate(TAB_TO_PATH[tab])
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <div className="px-6 pt-5 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[18px] font-bold text-gray-800">사원 관리</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">사원 목록, 등록, 연봉 계약, 증명서, 인력 현황 등을 관리합니다</p>
          </div>
          <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[11px] font-medium">
            <i className="fa-solid fa-lock text-[9px] mr-1" />인사 관리자 전용
          </span>
        </div>

        <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors relative whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-[#1D9E75]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className={`${tab.icon} text-[11px]`} />
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1D9E75] rounded-t" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'list' && <EmployeeList />}
        {activeTab === 'register' && <EmployeeRegister />}
        {activeTab === 'salary-contract' && <SalaryContract />}
        {activeTab === 'certificate' && <Certificate />}
        {activeTab === 'workforce' && <WorkforceStatus />}
        {activeTab === 'retirement' && <RetirementManagement />}
        {activeTab === 'appointment' && <PersonnelAppointment />}
      </div>
    </div>
  )
}
