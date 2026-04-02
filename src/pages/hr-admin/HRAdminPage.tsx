import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Department, Rank, Position, Employee } from '../org-management/types'
import { mockDepartments, mockRanks, mockPositions, mockEmployees } from '../org-management/mockData'
import DepartmentTab from '../org-management/components/DepartmentTab'
import RankPositionTab from '../org-management/components/RankPositionTab'
import AuthTab from '../org-management/components/AuthTab'
import OverviewTab from './components/OverviewTab'
import ApprovalSettingsTab from './components/ApprovalSettingsTab'
import SalaryPolicyTab from './components/SalaryPolicyTab'
import AttendancePolicyTab from './components/AttendancePolicyTab'
import EvaluationTab from './components/EvaluationTab'
import EmployeeCoreTab from './components/EmployeeCoreTab'

type AdminTab =
  | 'overview'
  | 'approval-settings'
  | 'salary-policy'
  | 'attendance-policy'
  | 'evaluation'
  | 'org-department'
  | 'org-rank-position'
  | 'employee-core'

const SIDEBAR_SECTIONS: { title: string; items: { key: AdminTab; label: string }[] }[] = [
  {
    title: '서비스 현황',
    items: [
      { key: 'overview', label: '서비스 이용현황' },
    ],
  },
  {
    title: '정책 관리',
    items: [
      { key: 'approval-settings', label: '결재 환경설정' },
      { key: 'salary-policy', label: '급여 정책' },
      { key: 'attendance-policy', label: '근태·연차 정책' },
      { key: 'evaluation', label: '평가 제도 관리' },
    ],
  },
  {
    title: '조직관리',
    items: [
      { key: 'org-department', label: '조직도 관리', icon: 'fa-solid fa-sitemap' },
      { key: 'org-rank-position', label: '직급·직책 체계', icon: 'fa-solid fa-layer-group' },
    ],
  },
  {
    title: '핵심 인사',
    items: [
      { key: 'employee-core', label: '인사 핵심 관리' },
    ],
  },
]

// ── 메인 페이지 ──
export default function HRAdminPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')

  // 조직 관리용 state
  const [departments, setDepartments] = useState<Department[]>(mockDepartments)
  const [ranks, setRanks] = useState<Rank[]>(mockRanks)
  const [positions, setPositions] = useState<Position[]>(mockPositions)
  const [employees] = useState<Employee[]>(mockEmployees)
  const isFullPageTab = activeTab === 'org-department' || activeTab === 'org-rank-position'

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />
      case 'approval-settings': return <ApprovalSettingsTab />
      case 'salary-policy': return <SalaryPolicyTab />
      case 'attendance-policy': return <AttendancePolicyTab />
      case 'evaluation': return <EvaluationTab />
      case 'org-department':
        return <DepartmentTab departments={departments} employees={employees} onUpdateDepartments={setDepartments} />
      case 'org-rank-position':
        return <RankPositionTab ranks={ranks} positions={positions} departments={departments} onUpdateRanks={setRanks} onUpdatePositions={setPositions} />
      case 'employee-core': return <EmployeeCoreTab />
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 사이드바 */}
      <div className="w-[220px] bg-white border-r border-[#d1d5db] flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-[#d1d5db]">
          <h2 className="text-[15px] font-bold text-[#000000] mb-1">인사통합</h2>
          <p className="text-[11px] text-gray-400">최고권한자 전용 관리 화면</p>
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

        {/* 하단 돌아가기 */}
        <div className="mt-auto px-4 pb-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[12px] text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className={`flex-1 overflow-hidden bg-[#f8fafb] ${isFullPageTab ? 'p-5' : 'p-6 overflow-y-auto'}`}>
        {renderContent()}
      </div>
    </div>
  )
}
