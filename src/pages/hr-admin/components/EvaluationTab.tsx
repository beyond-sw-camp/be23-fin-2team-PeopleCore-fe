import SettingCard from './SettingCard'

export default function EvaluationTab() {
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
