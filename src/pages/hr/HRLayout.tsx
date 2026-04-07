import { useNavigate, useLocation, Routes, Route } from 'react-router-dom'
import EmployeeList from './EmployeeList'
import EmployeeRegister from './EmployeeRegister'
import EmployeeDetail from './EmployeeDetail'
import EmployeeEdit from './EmployeeEdit'
import EmployeeRetire from './EmployeeRetire'
import SalaryContract from './SalaryContract'
import Certificate from './Certificate'
import WorkforceStatus from './WorkforceStatus'
import RetirementManagement from './RetirementManagement'
import RetirementDetail from './RetirementDetail'
import RetirementEdit from './RetirementEdit'
import PersonnelAppointment from './PersonnelAppointment'
import PermissionManagement from './PermissionManagement'
import HRHistory from './HRHistory'
import FaceLoginManagement from './FaceLoginManagement'

interface MenuSection {
  title: string
  items: { label: string; path: string }[]
}

const MENU_SECTIONS: MenuSection[] = [
  {
    title: '사원 조회 및 수정',
    items: [
      { label: '사원 목록', path: '/hr/list' },
      { label: '인력 현황', path: '/hr/workforce' },
    ],
  },
  {
    title: '관리',
    items: [
      { label: '연봉 계약', path: '/hr/salary-contract' },
      { label: '퇴직 관리', path: '/hr/retirement' },
      { label: '권한 관리', path: '/hr/permission' },
      { label: 'Face Login 관리', path: '/hr/face-login' },
    ],
  },
  {
    title: '인사이동',
    items: [
      { label: '인사 발령', path: '/hr/appointment' },
      { label: '발령 이력', path: '/hr/history' },
    ],
  },
]

function SectionGroup({ section, currentPath, onNavigate }: {
  section: MenuSection; currentPath: string; onNavigate: (path: string) => void
}) {
  const hasActive = section.items.some(item => currentPath === item.path || currentPath.startsWith(item.path + '/'))

  return (
    <div>
      <div
        className={`px-3 py-2 text-[11px] font-semibold uppercase ${
          hasActive ? 'text-[#1D9E75]' : 'text-gray-400'
        }`}
      >
        {section.title}
      </div>
      <div>
        {section.items.map(item => {
          const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/')
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center gap-2 text-left px-3 py-[7px] ml-1 rounded-lg text-[12px] transition-colors ${
                isActive
                  ? 'text-[#1D9E75] font-medium'
                  : 'text-[#000000] hover:bg-[#f2faf6] hover:text-[#1D9E75]'
              }`}
            >
              <span className={`w-[5px] h-[5px] rounded-full ${isActive ? 'bg-[#2e9e6e]' : 'bg-[#d0d8d4]'}`} />
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function HRLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* 사이드바 */}
      <div className="w-[220px] bg-white border-r border-[#d1d5db] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#d1d5db]">
          <h2 className="text-[15px] font-bold text-[#000000]">사원 관리</h2>
        </div>
        <nav className="p-2 space-y-0.5">
          {MENU_SECTIONS.map(section => (
            <SectionGroup
              key={section.title}
              section={section}
              currentPath={currentPath}
              onNavigate={navigate}
            />
          ))}
        </nav>
      </div>

      {/* 콘텐츠 */}
      <Routes>
        <Route path="list" element={<EmployeeList />} />
        <Route path="employee/register" element={<EmployeeRegister />} />
        <Route path="employee/:id" element={<EmployeeDetail />} />
        <Route path="employee/:id/edit" element={<EmployeeEdit />} />
        <Route path="employee/:id/retire" element={<EmployeeRetire />} />
        <Route path="salary-contract" element={<SalaryContract />} />
        <Route path="certificate" element={<Certificate />} />
        <Route path="workforce" element={<WorkforceStatus />} />
        <Route path="retirement" element={<RetirementManagement />} />
        <Route path="retirement/:id" element={<RetirementDetail />} />
        <Route path="retirement/:id/edit" element={<RetirementEdit />} />
        <Route path="appointment" element={<PersonnelAppointment />} />
        <Route path="permission" element={<PermissionManagement />} />
        <Route path="face-login" element={<FaceLoginManagement />} />
        <Route path="history" element={<HRHistory />} />
        <Route path="*" element={<EmployeeList />} />
      </Routes>
    </div>
  )
}
