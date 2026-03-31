import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { OrgManagementTab, Department, Rank, Position, Employee, Role, PermissionHistory, PersonnelOrder } from './types'
import { mockDepartments, mockRanks, mockPositions, mockEmployees, mockRoles, mockPermissionHistory, mockOrders } from './mockData'
import DepartmentTab from './components/DepartmentTab'
import RankPositionTab from './components/RankPositionTab'
import AuthTab from './components/AuthTab'
import EmployeeSearchTab from './components/EmployeeSearchTab'
import PersonnelOrderTab from './components/PersonnelOrderTab'

const TABS: { key: OrgManagementTab; label: string; icon: string }[] = [
  { key: 'department', label: '조직도', icon: 'fa-solid fa-sitemap' },
  { key: 'rank-position', label: '직급·직책', icon: 'fa-solid fa-layer-group' },
  { key: 'auth', label: '권한 관리', icon: 'fa-solid fa-shield-halved' },
  { key: 'employee-search', label: '직원 검색', icon: 'fa-solid fa-magnifying-glass' },
  { key: 'personnel-order', label: '인사 발령', icon: 'fa-solid fa-file-signature' },
]

const PATH_TO_TAB: Record<string, OrgManagementTab> = {
  '/org-management': 'department',
  '/org-management/rank': 'rank-position',
  '/org-management/auth': 'auth',
  '/org-management/search': 'employee-search',
  '/org-management/order': 'personnel-order',
}

const TAB_TO_PATH: Record<OrgManagementTab, string> = {
  'department': '/org-management',
  'rank-position': '/org-management/rank',
  'auth': '/org-management/auth',
  'employee-search': '/org-management/search',
  'personnel-order': '/org-management/order',
}

export default function OrgManagementPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialTab = PATH_TO_TAB[location.pathname] || 'department'
  const [activeTab, setActiveTab] = useState<OrgManagementTab>(initialTab)

  useEffect(() => {
    const tab = PATH_TO_TAB[location.pathname]
    if (tab && tab !== activeTab) setActiveTab(tab)
  }, [location.pathname])

  const handleTabChange = (tab: OrgManagementTab) => {
    setActiveTab(tab)
    navigate(TAB_TO_PATH[tab])
  }
  const [departments, setDepartments] = useState<Department[]>(mockDepartments)
  const [ranks, setRanks] = useState<Rank[]>(mockRanks)
  const [positions, setPositions] = useState<Position[]>(mockPositions)
  const [employees] = useState<Employee[]>(mockEmployees)
  const [roles, setRoles] = useState<Role[]>(mockRoles)
  const [permHistory, setPermHistory] = useState<PermissionHistory[]>(mockPermissionHistory)
  const [orders, setOrders] = useState<PersonnelOrder[]>(mockOrders)

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#f8fafb]">
      {/* 상단 헤더 */}
      <div className="px-6 pt-5 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[18px] font-bold text-gray-800">조직 관리</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">조직 구조, 직급·직책, 권한, 인사 발령을 관리합니다</p>
          </div>
          <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[11px] font-medium">
            <i className="fa-solid fa-lock text-[9px] mr-1" />인사 관리자 전용
          </span>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors relative ${
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

      {/* 탭 콘텐츠 */}
      <div className="flex-1 overflow-hidden p-5">
        {activeTab === 'department' && (
          <DepartmentTab departments={departments} employees={employees} onUpdateDepartments={setDepartments} />
        )}
        {activeTab === 'rank-position' && (
          <RankPositionTab ranks={ranks} positions={positions} departments={departments} onUpdateRanks={setRanks} onUpdatePositions={setPositions} />
        )}
        {activeTab === 'auth' && (
          <AuthTab roles={roles} permissionHistory={permHistory} onUpdateRoles={setRoles}
            onAddHistory={(entry) => setPermHistory((prev) => [entry, ...prev])} />
        )}
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
