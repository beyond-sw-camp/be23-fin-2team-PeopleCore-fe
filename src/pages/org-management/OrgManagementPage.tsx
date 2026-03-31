import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { OrgManagementTab, Department, Rank, Employee, PersonnelOrder } from './types'
import { mockDepartments, mockRanks, mockEmployees, mockOrders } from './mockData'
import EmployeeSearchTab from './components/EmployeeSearchTab'
import PersonnelOrderTab from './components/PersonnelOrderTab'

const MENU_ITEMS: { key: OrgManagementTab; label: string }[] = [
  { key: 'employee-search', label: '직원 검색' },
  { key: 'personnel-order', label: '인사 발령' },
]

const PATH_TO_TAB: Record<string, OrgManagementTab> = {
  '/org-management': 'employee-search',
  '/org-management/search': 'employee-search',
  '/org-management/order': 'personnel-order',
}

const TAB_TO_PATH: Record<string, string> = {
  'employee-search': '/org-management',
  'personnel-order': '/org-management/order',
}

export default function OrgManagementPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialTab = PATH_TO_TAB[location.pathname] || 'employee-search'
  const [activeTab, setActiveTab] = useState<OrgManagementTab>(initialTab)

  useEffect(() => {
    const tab = PATH_TO_TAB[location.pathname]
    if (tab && tab !== activeTab) setActiveTab(tab)
  }, [location.pathname])

  const handleTabChange = (tab: OrgManagementTab) => {
    setActiveTab(tab)
    const path = TAB_TO_PATH[tab]
    if (path) navigate(path)
  }

  const [departments] = useState<Department[]>(mockDepartments)
  const [ranks] = useState<Rank[]>(mockRanks)
  const [employees] = useState<Employee[]>(mockEmployees)
  const [orders, setOrders] = useState<PersonnelOrder[]>(mockOrders)

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── 사이드 패널 ── */}
      <div className="w-[220px] bg-white border-r border-[#d1d5db] flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-[#d1d5db]">
          <h2 className="text-[15px] font-bold text-[#000000]">조직 관리</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">인사 실무를 관리합니다</p>
        </div>

        {/* 인사 실무 */}
        <div className="px-4 pt-4 pb-2">
          <span className="text-[12px] font-semibold text-[#000000] mb-1 block">인사 실무</span>
          {MENU_ITEMS.map((item) => (
            <div
              key={item.key}
              onClick={() => handleTabChange(item.key)}
              className={`py-1.5 px-2 text-[12px] cursor-pointer rounded transition-colors ${
                activeTab === item.key
                  ? 'text-[#1D9E75] font-medium bg-[#E1F5EE]'
                  : 'text-[#000000] hover:text-[#000000] hover:bg-[#E1F5EE]'
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>

        {/* 하단 안내 */}
        <div className="mt-auto px-4 pb-4">
          <div className="px-3 py-2 bg-gray-50 rounded-lg">
            <p className="text-[10px] text-gray-400 leading-relaxed">
              <i className="fa-solid fa-circle-info text-[9px] mr-1" />
              조직도·직급·권한 설정은<br />인사통합 관리에서 관리합니다
            </p>
          </div>
        </div>
      </div>

      {/* ── 메인 콘텐츠 ── */}
      <div className="flex-1 overflow-hidden p-5 bg-[#f8fafb]">
        {activeTab === 'employee-search' && (
          <EmployeeSearchTab employees={employees} departments={departments} ranks={ranks} />
        )}
        {activeTab === 'personnel-order' && (
          <PersonnelOrderTab orders={orders} employees={employees} departments={departments} ranks={ranks} onUpdateOrders={setOrders} />
        )}
      </div>
    </div>
  )
}
