import SettingCard from './SettingCard'

export default function EmployeeCoreTab() {
  return (
    <div>
      <h3 className="text-[16px] font-bold text-gray-800 mb-1">인사 핵심 관리</h3>
      <p className="text-[12px] text-gray-400 mb-5">계정 발급, 퇴직 처리, 연봉계약 등 핵심 인사 업무를 관리합니다</p>
      <div className="space-y-2.5">
        <SettingCard title="신입사원 계정 발급" desc="입사 확정 후 ERP 계정을 발급하고 초기 비밀번호를 발송합니다" id="emp-1" />
        <SettingCard title="사원 권한 승인" desc="사원의 메뉴·기능 접근 권한 신청을 검토하고 승인합니다" id="emp-2" badge="승인 필요" />
        <SettingCard title="퇴직 최종 처리" desc="퇴직 신청서를 접수하고 최종 퇴직 처리합니다" id="emp-17" badge="주의" />
        <SettingCard title="연봉계약 관리" desc="사원별 연봉 계약서를 생성·발송·관리합니다" id="emp-18" />
        <SettingCard title="인사 서류 관리" desc="근로 계약서·서약서·개인정보 동의서 등을 보관합니다" id="emp-9" />
      </div>
    </div>
  )
}
