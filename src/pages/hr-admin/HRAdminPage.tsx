import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { Department, Rank, Position, Employee } from '../org-management/types'
import { departmentApi, gradeApi, titleApi, employeeApi } from '../../api/org'
import type { DepartmentTreeResponse } from '../../api/org'
import DepartmentTab from '../org-management/components/DepartmentTab'
import RankPositionTab from '../org-management/components/RankPositionTab'
import ApprovalSettingsTab from './components/ApprovalSettingsTab'
import SalaryPolicyTab from './components/SalaryPolicyTab'
import AttendancePolicyTab from './components/AttendancePolicyTab'
import EmployeeRegisterFormConfig from './components/EmployeeRegisterFormConfig'
import SalaryContractFormConfig from './components/SalaryContractFormConfig'
import BatchManageView from './components/BatchManageView'

type AdminTab =
  | 'approval-settings'
  | 'salary-policy'
  | 'attendance-policy'
  | 'board-settings'
  | 'org-department'
  | 'org-rank-position'
  | 'emp-register-form'
  | 'salary-contract-form'
  | 'batch-manage'

type SidebarSection = { title: string; items: { key: AdminTab; label: string; icon?: string }[] }

const BASE_SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: '정책 관리',
    items: [
      { key: 'approval-settings', label: '결재 환경설정' },
      { key: 'salary-policy', label: '급여 정책' },
      { key: 'attendance-policy', label: '근태·연차 정책' },
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
    title: '사원관리',
    items: [
      { key: 'emp-register-form', label: '신규 사원 등록 폼' },
      { key: 'salary-contract-form', label: '연봉 계약서 폼' },
    ],
  },
  // 운영 섹션은 추후 사용 예정 — 사이드바에서만 숨김 (BatchManageView 컴포넌트/렌더 케이스는 유지)
  // {
  //   title: '운영',
  //   items: [
  //     { key: 'batch-manage', label: '배치 관리', icon: 'fa-solid fa-gears' },
  //   ],
  // },
]



// ── 메인 페이지 ──
export default function HRAdminPage() {
  const navigate = useNavigate()
  const { isHRSuperAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<AdminTab>('approval-settings')
  // const [activeTab, setActiveTab] = useState<AdminTab>('org-department')
  const [sideOpen, setSideOpen] = useState(false)

  // 개발자용(배치 관리) 섹션은 사이드바에 노출하지 않고, 하단 히든 버튼으로만 진입
  const SIDEBAR_SECTIONS = BASE_SIDEBAR_SECTIONS

  const selectTab = (key: AdminTab) => {
    setActiveTab(key)
    setSideOpen(false)
  }

  // 조직 관리용 state
  const [departments, setDepartments] = useState<Department[]>([])
  const [ranks, setRanks] = useState<Rank[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    departmentApi.getTree().then(({ data }) => {
      const flatten = (nodes: DepartmentTreeResponse[], parentId: string | null = null): Department[] =>
        nodes.flatMap((n, i) => {
          const id = String(n.id)
          return [
            { id, name: n.deptName, code: n.deptCode, parentId, headId: null, sortOrder: i + 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            ...flatten(n.children || [], id),
          ]
        })
      setDepartments(flatten(data))
    }).catch(() => {})

    employeeApi.getList({ size: 1000 }).then(({ data: empData }) => {
      const list = Array.isArray(empData) ? empData : empData.content || []
      setEmployees(list.map((e, i) => ({
        id: String(i + 1), name: e.empName, email: '', phone: '',
        departmentId: String(e.deptId),
        departmentName: e.deptName,
        rankId: '', rankName: e.gradeName, positionId: null, positionName: e.titleName || null,
        joinDate: e.empHireDate,
        status: e.empStatus === '재직' ? 'active' as const : e.empStatus === '휴직' ? 'leave' as const : 'retired' as const,
        profileColor: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
      })))
    }).catch(() => {})

    gradeApi.getList().then(({ data }) => {
      setRanks(data.map((g, i) => ({ id: String(g.gradeId), name: g.gradeName, level: g.gradeOrder || i + 1, createdAt: new Date().toISOString() })))
    }).catch(() => {})

    titleApi.getList().then(({ data }) => {
      setPositions(data.map((t, i) => ({
        id: String(t.titleId),
        name: t.titleName,
        code: t.titleCode,
        order: t.titleOrder ?? i + 1,
        createdAt: new Date().toISOString(),
      })))
    }).catch(() => {})
  }, [])
  const isFullPageTab = activeTab === 'org-department' || activeTab === 'org-rank-position'

  const renderContent = () => {
    switch (activeTab) {
      case 'approval-settings': return <ApprovalSettingsTab />
      case 'salary-policy': return <SalaryPolicyTab />
      case 'attendance-policy': return <AttendancePolicyTab />
      case 'org-department':
        return <DepartmentTab departments={departments} employees={employees} onUpdateDepartments={setDepartments} />
      case 'org-rank-position':
        return <RankPositionTab ranks={ranks} positions={positions} onUpdateRanks={setRanks} onUpdatePositions={setPositions} />
      case 'emp-register-form': return <EmployeeRegisterFormConfig onBack={() => setActiveTab('approval-settings')} />
      case 'salary-contract-form': return <SalaryContractFormConfig onBack={() => setActiveTab('approval-settings')} />
      case 'batch-manage': return <BatchManageView />
    }
  }

  const sidebarBody = (
    <>
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
              onClick={() => selectTab(item.key)}
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

      <div className="mt-auto px-4 pb-4 pt-3 border-t border-gray-100">
        {/* 개발자용 히든 진입점: 우하단 작은 점. HR_SUPER_ADMIN 만 클릭 가능. */}
        {isHRSuperAdmin && (
          <button
            type="button"
            onClick={() => selectTab('batch-manage')}
            aria-label="배치 관리 (개발자용)"
            title="배치 관리"
            className="block ml-auto mb-1 w-1.5 h-1.5 rounded-full bg-gray-200/40 hover:bg-[#1D9E75] transition-colors focus:outline-none"
          />
        )}
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[12px] text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          메인으로 돌아가기
        </button>
      </div>
    </>
  )

  return (
    <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
      {/* 모바일 헤더 바 */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-white border-b border-[#d1d5db]">
        <button
          type="button"
          onClick={() => setSideOpen(true)}
          className="flex items-center gap-2 text-[13px] text-gray-700"
        >
          <i className="fa-solid fa-bars" />
          <span>인사통합 메뉴</span>
        </button>
      </div>

      {/* 데스크톱 사이드바 */}
      <div className="hidden md:flex w-[220px] bg-white border-r border-[#d1d5db] flex-col shrink-0 overflow-y-auto">
        {sidebarBody}
      </div>

      {/* 모바일 드로어 */}
      {sideOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSideOpen(false)} />
          <div className="relative bg-white w-[260px] max-w-[80vw] flex flex-col h-full shadow-xl overflow-y-auto animate-in slide-in-from-left duration-200">
            <button
              type="button"
              onClick={() => setSideOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
              aria-label="메뉴 닫기"
            >
              <i className="fa-solid fa-xmark" />
            </button>
            {sidebarBody}
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className={`flex-1 overflow-hidden bg-white ${isFullPageTab ? 'p-3 md:p-5' : 'p-3 md:p-6 overflow-y-auto'}`}>
        {renderContent()}
      </div>
    </div>
  )
}
