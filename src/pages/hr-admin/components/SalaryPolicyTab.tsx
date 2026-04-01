import SettingCard from './SettingCard'

export default function SalaryPolicyTab() {
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
