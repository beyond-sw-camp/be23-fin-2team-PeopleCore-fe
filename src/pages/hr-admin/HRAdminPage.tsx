import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Department, Rank, Position, Employee, Role, PermissionHistory } from '../org-management/types'
import { mockDepartments, mockRanks, mockPositions, mockEmployees, mockRoles, mockPermissionHistory } from '../org-management/mockData'
import DepartmentTab from '../org-management/components/DepartmentTab'
import RankPositionTab from '../org-management/components/RankPositionTab'
import AuthTab from '../org-management/components/AuthTab'

type AdminTab =
  | 'overview'
  | 'approval-settings'
  | 'salary-policy'
  | 'attendance-policy'
  | 'evaluation'
  | 'org-department'
  | 'org-rank-position'
  | 'org-auth'
  | 'employee-core'

const SIDEBAR_SECTIONS: { title: string; items: { key: AdminTab; label: string; icon: string }[] }[] = [
  {
    title: '서비스 현황',
    items: [
      { key: 'overview', label: '서비스 이용현황', icon: 'fa-solid fa-chart-pie' },
    ],
  },
  {
    title: '정책 관리',
    items: [
      { key: 'approval-settings', label: '결재 환경설정', icon: 'fa-solid fa-file-signature' },
      { key: 'salary-policy', label: '급여 정책', icon: 'fa-solid fa-coins' },
      { key: 'attendance-policy', label: '근태·연차 정책', icon: 'fa-solid fa-clock' },
      { key: 'evaluation', label: '평가 제도 관리', icon: 'fa-solid fa-star' },
    ],
  },
  {
    title: '조직·권한',
    items: [
      { key: 'org-department', label: '조직도 관리', icon: 'fa-solid fa-sitemap' },
      { key: 'org-rank-position', label: '직급·직책 체계', icon: 'fa-solid fa-layer-group' },
      { key: 'org-auth', label: '권한 관리', icon: 'fa-solid fa-shield-halved' },
    ],
  },
  {
    title: '핵심 인사',
    items: [
      { key: 'employee-core', label: '인사 핵심 관리', icon: 'fa-solid fa-user-gear' },
    ],
  },
]

// ── 서비스 이용현황 ──
function OverviewTab() {
  return (
    <div>
      <h2 className="text-[22px] font-bold text-gray-800 mb-1">A Company</h2>
      <p className="text-[13px] text-gray-400 mb-6">PeopleCore 인사통합 관리 시스템</p>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h3 className="text-[14px] font-bold text-gray-800 mb-4">서비스 이용현황</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-[11px] text-gray-400 mb-1">사용자 수</p>
            <p className="text-[20px] font-bold text-[#1D9E75]">152<span className="text-[13px] font-normal text-gray-400">명</span></p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-[11px] text-gray-400 mb-1">결제 여부</p>
            <p className="text-[14px] font-semibold text-gray-800">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-[12px]">
                <i className="fa-solid fa-circle-check text-[10px]" />결제 완료
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h3 className="text-[14px] font-bold text-gray-800 mb-4">요금</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-[11px] text-gray-400 mb-1">플랜</p>
            <p className="text-[14px] font-semibold text-gray-800">Enterprise</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-[11px] text-gray-400 mb-1">월 요금</p>
            <p className="text-[14px] font-semibold text-gray-800">₩1,520,000</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-[11px] text-gray-400 mb-1">다음 결제일</p>
            <p className="text-[14px] font-semibold text-gray-800">2026-04-01</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-[14px] font-bold text-gray-800 mb-4">모듈별 사용현황</h3>
        <div className="space-y-3">
          {[
            { name: '전자결재', count: 1247, icon: 'fa-solid fa-file-signature', color: '#3B82F6' },
            { name: '급여 관리', count: 152, icon: 'fa-solid fa-coins', color: '#F59E0B' },
            { name: '근태 관리', count: 152, icon: 'fa-solid fa-clock', color: '#10B981' },
            { name: '성과 평가', count: 89, icon: 'fa-solid fa-star', color: '#8B5CF6' },
            { name: '메신저', count: 148, icon: 'fa-solid fa-comments', color: '#EC4899' },
          ].map((mod) => (
            <div key={mod.name} className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${mod.color}15` }}>
                <i className={`${mod.icon} text-[12px]`} style={{ color: mod.color }} />
              </div>
              <span className="text-[13px] text-gray-700 flex-1">{mod.name}</span>
              <span className="text-[13px] font-semibold text-gray-800">{mod.count.toLocaleString()}건</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 결재 환경설정 ──
function ApprovalSettingsTab() {
  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">결재 환경설정</h3>
      <p className="text-[12px] text-gray-400 mb-5">결재 양식 및 결재 프로세스 정책을 관리합니다</p>
      <div className="space-y-4">
        <SettingCard title="결재 양식 관리" desc="결재 양식 템플릿을 등록·수정·삭제합니다" id="approval-7" />
        <SettingCard title="결재선 기본값 설정" desc="부서별 기본 결재선을 설정합니다" id="approval-3" />
        <SettingCard title="결재 위임 정책" desc="부재 시 결재 위임 규칙을 관리합니다" id="approval-4" />
        <SettingCard title="결재번호 규칙" desc="결재 완료 후 문서번호 생성 규칙을 설정합니다" id="approval-2" />
      </div>
    </div>
  )
}

// ── 급여 정책 ──
function SalaryPolicyTab() {
  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">급여 정책</h3>
      <p className="text-[12px] text-gray-400 mb-5">전사 급여 체계와 수당·공제 정책을 관리합니다</p>
      <div className="space-y-4">
        <SettingCard title="기본급 테이블 설정" desc="직급·호봉 기반 기본급 테이블을 정의합니다" id="hr-pay1" />
        <SettingCard title="수당 항목 및 금액 설정" desc="직책·가족·식대·교통 등 수당 항목과 금액을 관리합니다" id="hr-pay3" />
        <SettingCard title="공제 규칙 설정" desc="4대보험·소득세·지방소득세 자동 계산 규칙을 설정합니다" id="hr-pay5" />
        <SettingCard title="성과급 기준 설정" desc="평가 등급별 성과급 금액 테이블을 정의합니다" id="hr-pay11" />
        <SettingCard title="급여 이체 최종 승인" desc="급여 이체 파일 생성을 최종 승인합니다" id="hr-pay9" badge="승인 필요" />
        <SettingCard title="퇴직금 산정 정책" desc="평균임금 기반 퇴직금 자동 계산 규칙을 설정합니다" id="hr-pay13" />
      </div>
    </div>
  )
}

// ── 근태·연차 정책 ──
function AttendancePolicyTab() {
  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">근태·연차 정책</h3>
      <p className="text-[12px] text-gray-400 mb-5">전사 연차 발생 규칙과 근태 관리 정책을 설정합니다</p>
      <div className="space-y-4">
        <SettingCard title="연차 발생 규칙 설정" desc="근속연수별 연차 발생일수 규칙을 정의합니다" id="att-7" />
        <SettingCard title="연차 소멸 처리" desc="미사용 연차를 자동 소멸 처리하고 이력을 기록합니다" id="att-12" badge="실행" />
        <SettingCard title="주 52시간 정책 설정" desc="법정 근무시간 한도 관리 정책을 설정합니다" id="att-19" />
        <SettingCard title="근태→급여 연동 확정" desc="월 마감 근태 데이터를 급여 모듈에 확정 전달합니다" id="att-20" badge="승인 필요" />
      </div>
    </div>
  )
}

// ── 평가 제도 관리 ──
function EvaluationTab() {
  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">평가 제도 관리</h3>
      <p className="text-[12px] text-gray-400 mb-5">전사 평가 주기, 항목, 등급 정책을 관리합니다</p>
      <div className="space-y-4">
        <SettingCard title="평가 주기/일정 생성" desc="반기/연간 평가 주기와 시작·종료일을 설정합니다" id="eval-1" />
        <SettingCard title="평가 항목·가중치 설정" desc="정량/정성 평가 항목과 가중치를 정의합니다" id="eval-2" />
        <SettingCard title="강제배분 비율 설정" desc="S/A/B/C 등급별 인원 비율 상한을 설정합니다" id="eval-4" />
        <SettingCard title="등급 보정 (Calibration)" desc="등급 초안을 검토하고 예외 케이스를 수동 조정합니다" id="eval-17" badge="조정" />
        <SettingCard title="최종 등급 확정 및 잠금" desc="보정 완료 후 최종 등급을 확정하고 수정 불가 처리합니다" id="eval-18" badge="확정" />
        <SettingCard title="평가 결과 일괄 통보" desc="최종 등급과 피드백을 전 대상자에게 공개합니다" id="eval-21" badge="실행" />
        <SettingCard title="급여/인센티브 연동" desc="확정된 평가 등급을 급여 모듈에 전달합니다" id="eval-20" />
      </div>
    </div>
  )
}

// ── 인사 핵심 관리 ──
function EmployeeCoreTab() {
  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">인사 핵심 관리</h3>
      <p className="text-[12px] text-gray-400 mb-5">계정 발급, 퇴직 처리, 연봉계약 등 핵심 인사 업무를 관리합니다</p>
      <div className="space-y-4">
        <SettingCard title="신입사원 계정 발급" desc="입사 확정 후 ERP 계정을 발급하고 초기 비밀번호를 발송합니다" id="emp-1" />
        <SettingCard title="사원 권한 승인" desc="사원의 메뉴·기능 접근 권한 신청을 검토하고 승인합니다" id="emp-2" badge="승인 필요" />
        <SettingCard title="퇴직 최종 처리" desc="퇴직 신청서를 접수하고 최종 퇴직 처리합니다" id="emp-17" badge="주의" />
        <SettingCard title="연봉계약 관리" desc="사원별 연봉 계약서를 생성·발송·관리합니다" id="emp-18" />
        <SettingCard title="인사 서류 관리" desc="근로 계약서·서약서·개인정보 동의서 등을 보관합니다" id="emp-9" />
      </div>
    </div>
  )
}

// ── 설정 카드 컴포넌트 ──
function SettingCard({ title, desc, id, badge }: { title: string; desc: string; id: string; badge?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#1D9E75]/30 hover:shadow-sm transition-all cursor-pointer group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-[13px] font-semibold text-gray-800 group-hover:text-[#1D9E75] transition-colors">{title}</h4>
            {badge && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                badge === '승인 필요' ? 'bg-amber-50 text-amber-600' :
                badge === '주의' ? 'bg-red-50 text-red-500' :
                badge === '확정' ? 'bg-blue-50 text-blue-600' :
                'bg-gray-100 text-gray-500'
              }`}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400">{desc}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className="text-[10px] text-gray-300 font-mono">{id}</span>
          <i className="fa-solid fa-chevron-right text-[10px] text-gray-300 group-hover:text-[#1D9E75] transition-colors" />
        </div>
      </div>
    </div>
  )
}

// ── 메인 페이지 ──
export default function HRAdminPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')

  // 조직 관리용 state
  const [departments, setDepartments] = useState<Department[]>(mockDepartments)
  const [ranks, setRanks] = useState<Rank[]>(mockRanks)
  const [positions, setPositions] = useState<Position[]>(mockPositions)
  const [employees] = useState<Employee[]>(mockEmployees)
  const [roles, setRoles] = useState<Role[]>(mockRoles)
  const [permHistory, setPermHistory] = useState<PermissionHistory[]>(mockPermissionHistory)

  const isFullPageTab = activeTab === 'org-department' || activeTab === 'org-rank-position' || activeTab === 'org-auth'

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
      case 'org-auth':
        return <AuthTab roles={roles} permissionHistory={permHistory} onUpdateRoles={setRoles} onAddHistory={(entry) => setPermHistory((prev) => [entry, ...prev])} />
      case 'employee-core': return <EmployeeCoreTab />
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 사이드바 */}
      <div className="w-[220px] bg-white border-r border-[#d1d5db] flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-[#d1d5db]">
          <div className="flex items-center gap-2 mb-1">
            <i className="fa-solid fa-shield-halved text-[14px] text-[#1D9E75]" />
            <h2 className="text-[15px] font-bold text-[#000000]">인사통합</h2>
          </div>
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
                <i className={`${item.icon} text-[10px] ${activeTab === item.key ? 'text-[#1D9E75]' : 'text-gray-400'}`} />
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
            <i className="fa-solid fa-arrow-left text-[10px]" />
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
