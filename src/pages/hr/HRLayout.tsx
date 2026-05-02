import { useNavigate, useLocation, Routes, Route } from 'react-router-dom'
import EmployeeList from './EmployeeList'
import EmployeeRegister from './EmployeeRegister'
import EmployeeDetail from './EmployeeDetail'
import EmployeeEdit from './EmployeeEdit'
import SalaryContract from './SalaryContract'
import Certificate from './Certificate'
import WorkforceStatus from './WorkforceStatus'
import RetirementManagement from './RetirementManagement'
import RetirementDetail from './RetirementDetail'
import PersonnelAppointment from './PersonnelAppointment'
import HRHistory from './HRHistory'
import FaceLoginManagement from './FaceLoginManagement'
// [REPORT] 작업 중 격리 영역 — 로컬에 src/pages/report/ReportPage.tsx 존재 시에만 자동 활성화.
// .gitignore 처리된 폴더라 다른 팀원 환경에선 glob 결과 비어 있어 메뉴/라우트가 빠진다.
const reportMods = import.meta.glob('../report/ReportPage.tsx', { eager: true })
const ReportPage = (Object.values(reportMods)[0] as { default?: React.ComponentType })?.default

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
  // [REPORT] 격리 섹션 — ReportPage 로드 성공 시에만 추가
  ...(ReportPage ? [{
    title: 'AI 분석',
    items: [
      { label: 'AI 리포트', path: '/hr/report' },
    ],
  }] : []),
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
        <Route path="salary-contract" element={<SalaryContract />} />
        <Route path="certificate" element={<Certificate />} />
        <Route path="workforce" element={<WorkforceStatus />} />
        <Route path="retirement" element={<RetirementManagement />} />
        <Route path="retirement/:id" element={<RetirementDetail />} />
        <Route path="appointment" element={<PersonnelAppointment />} />
        <Route path="face-login" element={<FaceLoginManagement />} />
        <Route path="history" element={<HRHistory />} />
        {/* [REPORT] 격리 라우트 — ReportPage 로드 성공 시에만 활성화 */}
        {ReportPage && <Route path="report" element={<ReportPage />} />}
        <Route path="*" element={<EmployeeList />} />
      </Routes>
    </div>
  )
}
