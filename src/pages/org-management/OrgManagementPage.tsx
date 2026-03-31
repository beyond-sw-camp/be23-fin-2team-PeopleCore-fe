import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { OrgManagementTab, Department, Rank, Position, Employee, Role, PermissionHistory, PersonnelOrder } from './types'
import { mockDepartments, mockRanks, mockPositions, mockEmployees, mockRoles, mockPermissionHistory, mockOrders } from './mockData'
import DepartmentTab from './components/DepartmentTab'
import RankPositionTab from './components/RankPositionTab'
import AuthTab from './components/AuthTab'
import EmployeeSearchTab from './components/EmployeeSearchTab'
import PersonnelOrderTab from './components/PersonnelOrderTab'

const ORG_MENU: { key: OrgManagementTab; label: string }[] = [
  { key: 'department', label: '조직도' },
  { key: 'rank-position', label: '직급·직책' },
]

const MANAGE_MENU: { key: OrgManagementTab; label: string }[] = [
  { key: 'auth', label: '권한 관리' },
  { key: 'employee-search', label: '직원 검색' },
  { key: 'personnel-order', label: '인사 발령' },
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
    <div className="flex flex-1 overflow-hidden">
      {/* ── 사이드 패널 ── */}
      <div className="w-[220px] bg-white border-r border-[#d1d5db] flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-[#d1d5db]">
          <h2 className="text-[15px] font-bold text-[#000000]">조직 관리</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">조직 구조 및 인사를 관리합니다</p>
        </div>

        {/* 조직 구조 */}
        <div className="px-4 pt-4 pb-2">
          <span className="text-[12px] font-semibold text-[#000000] mb-1 block">조직 구조</span>
          {ORG_MENU.map((item) => (
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

        {/* 인사 관리 */}
        <div className="px-4 pt-3 pb-2">
          <span className="text-[12px] font-semibold text-[#000000] mb-1 block">인사 관리</span>
          {MANAGE_MENU.map((item) => (
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

        {/* 하단 뱃지 */}
        <div className="mt-auto px-4 pb-4">
          <span className="inline-flex items-center px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-[11px] font-medium">
            <i className="fa-solid fa-lock text-[9px] mr-1" />인사 관리자 전용
          </span>
        </div>
      </div>

      {/* ── 메인 콘텐츠 ── */}
      <div className="flex-1 overflow-hidden p-5 bg-[#f8fafb]">
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
